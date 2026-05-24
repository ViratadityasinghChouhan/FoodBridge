const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a name'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Please add an email'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please add a valid email',
      ],
    },
    password: {
      type: String,
      required: function () {
        return this.authProvider !== 'google';
      },
      minlength: 6,
      select: false, // Do not return password by default
    },
    authProvider: {
      type: String,
      enum: ['local', 'google'],
      default: 'local',
    },
    googleId: {
      type: String,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: {
      type: String,
      select: false,
    },
    emailVerificationExpires: {
      type: Date,
      select: false,
    },
    emailVerificationOtp: {
      type: String,
      select: false,
    },
    emailVerificationOtpExpires: {
      type: Date,
      select: false,
    },
    emailOtpAttempts: {
      type: Number,
      default: 0,
      select: false,
    },
    isPhoneVerified: {
      type: Boolean,
      default: false,
    },
    phoneVerificationOtp: {
      type: String,
      select: false,
    },
    phoneVerificationOtpExpires: {
      type: Date,
      select: false,
    },
    phoneOtpAttempts: {
      type: Number,
      default: 0,
      select: false,
    },
    role: {
      type: String,
      enum: ['donor', 'receiver', 'admin', 'Donor', 'NGO', 'Admin', 'Individual'],
      default: 'receiver',
    },
    phoneNumber: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    address: {
      type: String,
    },
    organizationName: {
      type: String,
    },
    organizationType: {
      type: String,
    },
    mapLocation: {
      type: String,
    },
    foodTypePreference: {
      type: String,
    },
    verificationDocument: {
      type: String,
    },
    ngoCertificate: {
      type: String,
    },
    volunteerCount: {
      type: Number,
    },
    profilePicture: {
      type: String,
      default: 'default.jpg',
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
    ngoVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre('save', async function () {
  if (!this.password || !this.isModified('password')) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
