const mongoose = require('mongoose');

const requestSchema = mongoose.Schema(
  {
    ngo: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    food: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Food',
    },
    status: {
      type: String,
      enum: ['Pending', 'Accepted', 'Rejected', 'Completed'],
      default: 'Pending',
    },
    message: {
      type: String,
    },
    pickupOtp: {
      type: String,
      select: false,
    },
    pickupConfirmedAt: {
      type: Date,
    }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Request', requestSchema);
