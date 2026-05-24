const mongoose = require('mongoose');

const foodSchema = mongoose.Schema(
  {
    donor: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    title: {
      type: String,
      required: [true, 'Please add a title for the food'],
    },
    category: {
      type: String,
      required: [true, 'Please specify category (e.g., Raw, Cooked, Packaged)'],
    },
    type: {
      type: String,
      enum: ['Veg', 'Non-Veg', 'Both'],
      required: true,
    },
    quantity: {
      type: Number,
      required: [true, 'Please add quantity (number of people it can feed)'],
    },
    pickupAddress: {
      type: String,
      required: [true, 'Please add a pickup address'],
    },
    coordinates: {
      lat: { type: Number },
      lng: { type: Number },
    },
    expiryTime: {
      type: Date,
      required: [true, 'Please add an expiry time'],
    },
    status: {
      type: String,
      enum: ['Available', 'Reserved', 'Picked Up', 'Expired'],
      default: 'Available',
    },
    image: {
      type: String,
      default: 'https://images.unsplash.com/photo-1593113565214-80afcb4a4771?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
    },
    specialInstructions: {
      type: String,
    }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Food', foodSchema);
