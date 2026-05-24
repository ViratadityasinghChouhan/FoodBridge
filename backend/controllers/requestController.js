const crypto = require('crypto');
const Request = require('../models/Request');
const Food = require('../models/Food');

const generatePickupOtp = () => crypto.randomInt(100000, 1000000).toString();

// @desc    Request food pickup
// @route   POST /api/requests/:foodId
// @access  Private
const createRequest = async (req, res, next) => {
  try {
    if (!['receiver', 'admin'].includes(req.user.role)) {
      res.status(403);
      throw new Error('Only receivers can request food pickup');
    }

    if (req.user.role === 'receiver' && !req.user.isPhoneVerified) {
      res.status(403);
      throw new Error('Verify your phone number before requesting food');
    }

    const food = await Food.findById(req.params.foodId);

    if (!food || food.status !== 'Available') {
      res.status(400);
      throw new Error('Food is not available');
    }

    if (food.donor.toString() === req.user.id) {
      res.status(400);
      throw new Error('You cannot request pickup for your own listing');
    }

    // Check if request already exists
    const existingRequest = await Request.findOne({ ngo: req.user.id, food: food._id });
    if (existingRequest) {
      res.status(400);
      throw new Error('You have already requested this food');
    }

    const request = await Request.create({
      ngo: req.user.id,
      food: food._id,
      status: 'Pending',
      message: req.body?.message || ''
    });

    const createdRequest = await Request.findById(request._id)
      .populate('food', 'title status quantity pickupAddress expiryTime image type')
      .populate('ngo', 'name phoneNumber');

    res.status(201).json(createdRequest);
  } catch (error) {
    next(error);
  }
};

// @desc    Get logged in user's pickup requests
// @route   GET /api/requests/me
// @access  Private
const getMyRequests = async (req, res, next) => {
  try {
    const requests = await Request.find({ ngo: req.user.id })
      .populate('food', 'title status quantity pickupAddress expiryTime image type')
      .populate('ngo', 'name phoneNumber')
      .sort({ createdAt: -1 });

    res.status(200).json(requests);
  } catch (error) {
    next(error);
  }
};

// @desc    Get requests for a donor's food
// @route   GET /api/requests/donor
// @access  Private (Donor only)
const getDonorRequests = async (req, res, next) => {
  try {
    if (!['donor', 'admin'].includes(req.user.role)) {
      res.status(403);
      throw new Error('Only donors can view requests for their listings');
    }

    // Find all food listings by this donor
    const foodQuery = req.user.role === 'admin' ? {} : { donor: req.user.id };
    const foods = await Food.find(foodQuery).select('_id');
    const foodIds = foods.map(f => f._id);

    const requests = await Request.find({ food: { $in: foodIds } })
      .select('+pickupOtp')
      .populate('ngo', 'name phoneNumber')
      .populate('food', 'title status quantity pickupAddress expiryTime')
      .sort({ createdAt: -1 });

    await Promise.all(
      requests
        .filter((request) => request.status === 'Accepted' && !request.pickupOtp)
        .map(async (request) => {
          request.pickupOtp = generatePickupOtp();
          await request.save();
        })
    );

    res.status(200).json(requests);
  } catch (error) {
    next(error);
  }
};

// @desc    Update request status (Accept/Reject)
// @route   PUT /api/requests/:id
// @access  Private (Donor only)
const updateRequestStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const allowedStatuses = ['Accepted', 'Rejected'];

    if (!allowedStatuses.includes(status)) {
      res.status(400);
      throw new Error('Invalid request status');
    }

    const request = await Request.findById(req.params.id).populate('food');

    if (!request) {
      res.status(404);
      throw new Error('Request not found');
    }

    // Ensure user is the donor of the food
    if (req.user.role !== 'admin' && request.food.donor.toString() !== req.user.id) {
      res.status(401);
      throw new Error('User not authorized');
    }

    if (request.status !== 'Pending') {
      res.status(400);
      throw new Error('Only pending requests can be accepted or rejected');
    }

    request.status = status;

    if (status === 'Accepted') {
      request.pickupOtp = generatePickupOtp();
      request.food.status = 'Reserved';
      await request.food.save();
    }

    await request.save();

    const updatedRequest = await Request.findById(request._id)
      .select('+pickupOtp')
      .populate('ngo', 'name phoneNumber')
      .populate('food', 'title status quantity pickupAddress expiryTime image type');

    res.status(200).json(updatedRequest);
  } catch (error) {
    next(error);
  }
};

// @desc    Confirm collected food using the OTP supplied by the donor
// @route   PUT /api/requests/:id/confirm-pickup
// @access  Private (Receiver who requested pickup)
const confirmPickup = async (req, res, next) => {
  try {
    const otp = String(req.body.otp || '').trim();
    const request = await Request.findById(req.params.id)
      .select('+pickupOtp')
      .populate('food');

    if (!request) {
      res.status(404);
      throw new Error('Request not found');
    }

    if (request.ngo.toString() !== req.user.id) {
      res.status(401);
      throw new Error('Only the receiving account can confirm pickup');
    }

    if (request.status !== 'Accepted') {
      res.status(400);
      throw new Error('Pickup can only be confirmed after the donor accepts the request');
    }

    if (!request.pickupOtp || request.pickupOtp !== otp) {
      res.status(400);
      throw new Error('Invalid pickup OTP');
    }

    request.status = 'Completed';
    request.pickupConfirmedAt = new Date();
    request.pickupOtp = undefined;
    request.food.status = 'Picked Up';

    await Promise.all([request.save(), request.food.save()]);

    const updatedRequest = await Request.findById(request._id)
      .populate('ngo', 'name phoneNumber')
      .populate('food', 'title status quantity pickupAddress expiryTime image type');

    res.status(200).json(updatedRequest);
  } catch (error) {
    next(error);
  }
};

// @desc    Update receiver pickup request message
// @route   PATCH /api/requests/:id
// @access  Private (Receiver who requested pickup)
const updateMyRequest = async (req, res, next) => {
  try {
    const request = await Request.findById(req.params.id);

    if (!request) {
      res.status(404);
      throw new Error('Request not found');
    }

    if (req.user.role !== 'admin' && request.ngo.toString() !== req.user.id) {
      res.status(401);
      throw new Error('Only the receiving account can edit this request');
    }

    if (request.status !== 'Pending') {
      res.status(400);
      throw new Error('Only pending pickup requests can be edited');
    }

    request.message = req.body?.message || '';
    await request.save();

    const updatedRequest = await Request.findById(request._id)
      .populate('ngo', 'name phoneNumber')
      .populate('food', 'title status quantity pickupAddress expiryTime image type');

    res.status(200).json(updatedRequest);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete/cancel receiver pickup request
// @route   DELETE /api/requests/:id
// @access  Private (Receiver who requested pickup or Admin)
const deleteMyRequest = async (req, res, next) => {
  try {
    const request = await Request.findById(req.params.id).populate('food');

    if (!request) {
      res.status(404);
      throw new Error('Request not found');
    }

    if (req.user.role !== 'admin' && request.ngo.toString() !== req.user.id) {
      res.status(401);
      throw new Error('Only the receiving account can delete this request');
    }

    if (request.status === 'Completed') {
      res.status(400);
      throw new Error('Completed pickup requests cannot be deleted');
    }

    if (request.status === 'Accepted' && request.food?.status === 'Reserved') {
      request.food.status = 'Available';
      await request.food.save();
    }

    await request.deleteOne();
    res.status(200).json({ id: req.params.id, foodId: request.food?._id });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createRequest,
  getMyRequests,
  getDonorRequests,
  updateRequestStatus,
  confirmPickup,
  updateMyRequest,
  deleteMyRequest,
};
