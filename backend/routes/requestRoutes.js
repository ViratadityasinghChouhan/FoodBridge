const express = require('express');
const router = express.Router();
const { createRequest, getMyRequests, getDonorRequests, updateRequestStatus, confirmPickup, updateMyRequest, deleteMyRequest } = require('../controllers/requestController');
const { protect } = require('../middlewares/authMiddleware');

router.route('/me').get(protect, getMyRequests);
router.route('/donor').get(protect, getDonorRequests);
router.route('/:foodId').post(protect, createRequest);
router.route('/:id/confirm-pickup').put(protect, confirmPickup);
router.route('/:id').put(protect, updateRequestStatus).patch(protect, updateMyRequest).delete(protect, deleteMyRequest);

module.exports = router;
