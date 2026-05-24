const express = require('express');
const router = express.Router();
const { getFoods, createFood, getMyFoods, updateFood, deleteFood } = require('../controllers/foodController');
const { protect } = require('../middlewares/authMiddleware');

router.route('/').get(getFoods).post(protect, createFood);
router.route('/me').get(protect, getMyFoods);
router.route('/:id').put(protect, updateFood).delete(protect, deleteFood);

module.exports = router;
