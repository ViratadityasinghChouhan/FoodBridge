const Food = require('../models/Food');

const parseCoordinates = (value) => {
  const match = String(value || '').match(/^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/);
  if (!match) return null;

  const latitude = Number(match[1]);
  const longitude = Number(match[2]);
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return null;

  return { latitude, longitude };
};

const readCoordinates = (latitude, longitude) => {
  if (latitude === undefined || longitude === undefined) return null;
  if (String(latitude).trim() === '' || String(longitude).trim() === '') return null;

  const parsedLatitude = Number(latitude);
  const parsedLongitude = Number(longitude);

  if (!Number.isFinite(parsedLatitude) || !Number.isFinite(parsedLongitude)) return null;
  if (parsedLatitude < -90 || parsedLatitude > 90 || parsedLongitude < -180 || parsedLongitude > 180) return null;

  return { latitude: parsedLatitude, longitude: parsedLongitude };
};

const distanceInKm = (origin, destination) => {
  const toRadians = (degrees) => degrees * Math.PI / 180;
  const latitudeDistance = toRadians(destination.latitude - origin.latitude);
  const longitudeDistance = toRadians(destination.longitude - origin.longitude);
  const value =
    Math.sin(latitudeDistance / 2) ** 2 +
    Math.cos(toRadians(origin.latitude)) *
      Math.cos(toRadians(destination.latitude)) *
      Math.sin(longitudeDistance / 2) ** 2;

  return 6371 * (2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value)));
};

const validateFutureExpiry = (expiryTime) => {
  const expiryDate = new Date(expiryTime);

  if (Number.isNaN(expiryDate.getTime()) || expiryDate <= new Date()) {
    throw new Error('Expiry time must be in the future so receivers can see this listing');
  }
};

const normalizeFoodType = (type) => {
  if (!type) return null;

  const value = String(type).trim().toLowerCase();
  if (['veg', 'vegetarian'].includes(value)) return 'Veg';
  if (['non-veg', 'non veg', 'nonveg', 'non-vegetarian'].includes(value)) return 'Non-Veg';
  if (['both', 'all', 'all types', 'mixed'].includes(value)) return 'Both';

  return null;
};

// @desc    Get all active food listings
// @route   GET /api/food
// @access  Public
const getFoods = async (req, res, next) => {
  try {
    const receiverLocation = readCoordinates(req.query.latitude, req.query.longitude);
    const maxDistance = Number(req.query.maxDistance);
    const shouldFilterByDistance = receiverLocation && Number.isFinite(maxDistance) && maxDistance > 0;
    const requestedType = normalizeFoodType(req.query.type);

    if (req.query.maxDistance && !shouldFilterByDistance) {
      res.status(400);
      throw new Error('Set a valid current location before filtering donations by distance');
    }

    await Food.updateMany(
      { status: 'Available', expiryTime: { $lte: new Date() } },
      { $set: { status: 'Expired' } }
    );

    const query = { status: 'Available', expiryTime: { $gt: new Date() } };
    if (requestedType) {
      query.type = requestedType === 'Both' ? { $in: ['Veg', 'Non-Veg', 'Both'] } : { $in: [requestedType, 'Both'] };
    }

    const foods = await Food.find(query)
      .populate('donor', 'name phoneNumber address profilePicture')
      .sort({ quantity: -1, createdAt: -1 });

    const results = foods
      .map((food) => {
        const foodLocation = readCoordinates(food.location?.latitude, food.location?.longitude) ||
          parseCoordinates(food.pickupAddress);
        const distanceKm = receiverLocation && foodLocation
          ? Number(distanceInKm(receiverLocation, foodLocation).toFixed(1))
          : null;

        return { ...food.toObject(), distanceKm };
      })
      .filter((food) => !shouldFilterByDistance || (food.distanceKm !== null && food.distanceKm <= maxDistance));

    res.status(200).json(results);
  } catch (error) {
    next(error);
  }
};

// @desc    Create food listing
// @route   POST /api/food
// @access  Private
const createFood = async (req, res, next) => {
  try {
    if (!['donor', 'admin'].includes(req.user.role)) {
      res.status(403);
      throw new Error('Only donors can create food listings');
    }

    if (req.user.role === 'donor' && (!req.user.isEmailVerified || !req.user.isPhoneVerified)) {
      res.status(403);
      throw new Error('Verify both email and phone before posting food');
    }

    const { title, category, quantity, pickupAddress, latitude, longitude, expiryTime, specialInstructions, image } = req.body;
    const location = readCoordinates(latitude, longitude) || parseCoordinates(pickupAddress);
    const type = normalizeFoodType(req.body.type);

    if (!type) {
      res.status(400);
      throw new Error('Choose a valid food type: Veg, Non-Veg, or Both');
    }

    try {
      validateFutureExpiry(req.body.expiryTime);
    } catch (error) {
      res.status(400);
      throw error;
    }

    // Dummy geocoding for demonstration: Add random offsets to a central location (e.g. San Francisco)
    const baseLat = 37.7749;
    const baseLng = -122.4194;
    const randomLat = baseLat + (Math.random() - 0.5) * 0.1;
    const randomLng = baseLng + (Math.random() - 0.5) * 0.1;

    const food = await Food.create({
      donor: req.user.id,
      title,
      category,
      type,
      quantity,
      pickupAddress,
      coordinates: { lat: randomLat, lng: randomLng },
      expiryTime,
      specialInstructions,
      image: image || undefined,
    });

    res.status(201).json(food);
  } catch (error) {
    next(error);
  }
};

// @desc    Get logged in user's food listings
// @route   GET /api/food/me
// @access  Private
const getMyFoods = async (req, res, next) => {
  try {
    if (!['donor', 'admin'].includes(req.user.role)) {
      res.status(403);
      throw new Error('Only donors can view food listings they created');
    }

    await Food.updateMany(
      { donor: req.user.id, status: 'Available', expiryTime: { $lte: new Date() } },
      { $set: { status: 'Expired' } }
    );

    const foods = await Food.find({ donor: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json(foods);
  } catch (error) {
    next(error);
  }
};

// @desc    Update a food listing
// @route   PUT /api/food/:id
// @access  Private (Donor/Admin)
const updateFood = async (req, res, next) => {
  try {
    const food = await Food.findById(req.params.id);

    if (!food) {
      res.status(404);
      throw new Error('Food listing not found');
    }

    if (req.user.role !== 'admin' && food.donor.toString() !== req.user.id) {
      res.status(401);
      throw new Error('User not authorized');
    }

    const allowedFields = ['title', 'category', 'type', 'quantity', 'pickupAddress', 'expiryTime', 'status', 'image', 'specialInstructions'];
    if (req.body.type !== undefined) {
      const type = normalizeFoodType(req.body.type);
      if (!type) {
        res.status(400);
        throw new Error('Choose a valid food type: Veg, Non-Veg, or Both');
      }
      req.body.type = type;
    }

    if (req.body.expiryTime !== undefined) {
      try {
        validateFutureExpiry(req.body.expiryTime);
      } catch (error) {
        res.status(400);
        throw error;
      }
    }

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        food[field] = req.body[field];
      }
    });

    if (req.body.latitude !== undefined || req.body.longitude !== undefined || req.body.pickupAddress !== undefined) {
      const location = readCoordinates(req.body.latitude, req.body.longitude) || parseCoordinates(food.pickupAddress);
      food.location = location || undefined;
    }

    const updatedFood = await food.save();
    res.status(200).json(updatedFood);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a food listing
// @route   DELETE /api/food/:id
// @access  Private (Donor/Admin)
const deleteFood = async (req, res, next) => {
  try {
    const food = await Food.findById(req.params.id);

    if (!food) {
      res.status(404);
      throw new Error('Food listing not found');
    }

    if (req.user.role !== 'admin' && food.donor.toString() !== req.user.id) {
      res.status(401);
      throw new Error('User not authorized');
    }

    await food.deleteOne();
    res.status(200).json({ id: req.params.id });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getFoods,
  createFood,
  getMyFoods,
  updateFood,
  deleteFood,
};
