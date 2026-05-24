const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

const normalizeRole = (role) => {
  if (['donor', 'Donor', 'Individual'].includes(role)) return 'donor';
  if (['receiver', 'NGO'].includes(role)) return 'receiver';
  if (['admin', 'Admin'].includes(role)) return 'admin';
  return 'receiver';
};

const serverUrl = () => `http://localhost:${process.env.PORT || 5000}`;
const frontendUrl = () => process.env.CLIENT_URL || process.env.FRONTEND_URL || serverUrl();
const apiUrl = () => process.env.API_URL || serverUrl();
const OTP_EXPIRY_MS = 5 * 60 * 1000;
const MAX_OTP_ATTEMPTS = 3;

const cleanString = (value) => String(value || '').trim();
const normalizeEmail = (email) => cleanString(email).toLowerCase();
const normalizePhone = (phoneNumber) => cleanString(phoneNumber).replace(/\s+/g, '');

const validatePassword = (password, confirmPassword) => {
  if (confirmPassword !== undefined && password !== confirmPassword) {
    throw new Error('Password and confirm password do not match');
  }

  if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(String(password || ''))) {
    throw new Error('Password must be at least 8 characters and include uppercase, lowercase, and a number');
  }
};

const createEmailVerification = () => ({
  token: crypto.randomBytes(32).toString('hex'),
  otp: String(crypto.randomInt(100000, 1000000)),
  expires: new Date(Date.now() + OTP_EXPIRY_MS),
});

const createPhoneVerification = () => ({
  otp: String(crypto.randomInt(100000, 1000000)),
  expires: new Date(Date.now() + OTP_EXPIRY_MS),
});

const isEmailSenderConfigured = () =>
  Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

const isSmsSenderConfigured = () =>
  Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM_NUMBER);

const canUseDevOtpFallback = () =>
  process.env.NODE_ENV !== 'production' && process.env.DEV_OTP_FALLBACK !== 'false';

const sendVerificationEmail = async (user, verification) => {
  const token = typeof verification === 'string' ? verification : verification.token;
  const otp = typeof verification === 'string' ? undefined : verification.otp;
  const verificationUrl = `${apiUrl()}/api/auth/verify-email/${token}`;
  const otpText = otp ? ` Your email OTP is ${otp}.` : '';
  const message = `Your OTP for email verification is: ${otp || ''}`;

  if (!isEmailSenderConfigured()) {
    if (canUseDevOtpFallback()) {
      console.log(`[email verification dev fallback] ${user.email}: ${message}`);
      return { sent: false, verificationUrl, otp, devFallback: true };
    }
    throw new Error('Email sending is not configured. Add SMTP_HOST, SMTP_USER, SMTP_PASS, and SMTP_FROM in backend/.env.');
  }

  let nodemailer;
  try {
    nodemailer = require('nodemailer');
  } catch (error) {
    throw new Error('Email sending is unavailable because nodemailer is not installed. Run npm install in backend.');
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: process.env.SMTP_USER && process.env.SMTP_PASS ? {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    } : undefined,
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER || 'no-reply@foodbridge.local',
    to: user.email,
    subject: 'Food Donation Platform - Email Verification',
    text: `${message}\n\nYou can also verify using this link: ${verificationUrl}`,
    html: `<p>Hi ${user.name},</p><p>Your OTP for email verification is: <strong>${otp}</strong></p><p>This OTP expires in 5 minutes.</p><p><a href="${verificationUrl}">Verify email</a></p>`,
  });

  return { sent: true, verificationUrl };
};

const sendPhoneVerification = async (user, otp) => {
  const message = `Your Food Donation Platform OTP is ${otp}`;

  if (!user.phoneNumber) {
    return { sent: false, reason: 'missing_phone' };
  }

  if (!isSmsSenderConfigured()) {
    if (canUseDevOtpFallback()) {
      console.log(`[phone verification dev fallback] ${user.phoneNumber}: ${message}`);
      return { sent: false, otp, devFallback: true };
    }
    throw new Error('Phone OTP sending is not configured. Add TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_FROM_NUMBER in backend/.env.');
  }

  const auth = Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64');
  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      From: process.env.TWILIO_FROM_NUMBER,
      To: user.phoneNumber,
      Body: message,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Phone verification SMS failed: ${errorText}`);
  }

  return { sent: true };
};

const verifyGoogleToken = async (credential) => {
  const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`);
  if (!response.ok) {
    throw new Error('Google sign-in could not be verified');
  }

  const profile = await response.json();
  if (process.env.GOOGLE_CLIENT_ID && profile.aud !== process.env.GOOGLE_CLIENT_ID) {
    throw new Error('Google sign-in is not configured for this app');
  }

  if (profile.email_verified !== 'true' && profile.email_verified !== true) {
    throw new Error('Google email is not verified');
  }

  return profile;
};

const userPayload = (user) => ({
  _id: user.id,
  name: user.name,
  email: user.email,
  role: normalizeRole(user.role),
  phoneNumber: user.phoneNumber,
  address: user.address,
  organizationName: user.organizationName,
  organizationType: user.organizationType,
  mapLocation: user.mapLocation,
  foodTypePreference: user.foodTypePreference,
  volunteerCount: user.volunteerCount,
  isEmailVerified: user.isEmailVerified,
  isPhoneVerified: user.isPhoneVerified,
  isBlocked: user.isBlocked,
  ngoVerified: user.ngoVerified,
  authProvider: user.authProvider,
  token: generateToken(user._id),
});

const accountPayload = (user) => ({
  _id: user.id,
  name: user.name,
  email: user.email,
  role: normalizeRole(user.role),
  phoneNumber: user.phoneNumber,
  address: user.address,
  organizationName: user.organizationName,
  organizationType: user.organizationType,
  mapLocation: user.mapLocation,
  foodTypePreference: user.foodTypePreference,
  verificationDocument: user.verificationDocument,
  ngoCertificate: user.ngoCertificate,
  volunteerCount: user.volunteerCount,
  profilePicture: user.profilePicture,
  isEmailVerified: user.isEmailVerified,
  isPhoneVerified: user.isPhoneVerified,
  isBlocked: user.isBlocked,
  ngoVerified: user.ngoVerified,
  authProvider: user.authProvider,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res, next) => {
  try {
    const {
      name,
      email,
      password,
      confirmPassword,
      role,
      phoneNumber,
      address,
      organizationName,
      organizationType,
      mapLocation,
      foodTypePreference,
      verificationDocument,
      ngoCertificate,
      volunteerCount,
      profilePicture,
    } = req.body;

    const normalizedRole = normalizeRole(role);
    const cleanedName = cleanString(name);
    const cleanedEmail = normalizeEmail(email);
    const cleanedPhoneNumber = normalizePhone(phoneNumber);

    if (!cleanedName || !cleanedEmail || !cleanedPhoneNumber) {
      res.status(400);
      throw new Error('Name, email, and phone number are required');
    }

    validatePassword(password, confirmPassword);

    if (normalizedRole === 'admin') {
      res.status(403);
      throw new Error('Admin accounts cannot be registered publicly');
    }

    // Check if user exists
    const userExists = await User.findOne({
      $or: [{ email: cleanedEmail }, { phoneNumber: cleanedPhoneNumber }],
    });

    if (userExists) {
      res.status(400);
      throw new Error(userExists.email === cleanedEmail ? 'Email already exists' : 'Phone number already exists');
    }

    const verification = createEmailVerification();
    const phoneVerification = createPhoneVerification();

    if (!isEmailSenderConfigured() && !canUseDevOtpFallback()) {
      res.status(500);
      throw new Error('Email OTP cannot be sent until SMTP settings are configured in backend/.env.');
    }

    if (phoneVerification && !isSmsSenderConfigured() && !canUseDevOtpFallback()) {
      res.status(500);
      throw new Error('Phone OTP cannot be sent until Twilio SMS settings are configured in backend/.env.');
    }

    // Create user
    const user = await User.create({
      name: cleanedName,
      email: cleanedEmail,
      password,
      role: normalizedRole,
      authProvider: 'local',
      isEmailVerified: false,
      emailVerificationToken: verification.token,
      emailVerificationExpires: verification.expires,
      emailVerificationOtp: verification.otp,
      emailVerificationOtpExpires: verification.expires,
      emailOtpAttempts: 0,
      isPhoneVerified: false,
      phoneVerificationOtp: phoneVerification?.otp,
      phoneVerificationOtpExpires: phoneVerification?.expires,
      phoneOtpAttempts: 0,
      phoneNumber: cleanedPhoneNumber,
      address,
      organizationName,
      organizationType,
      mapLocation,
      foodTypePreference,
      verificationDocument,
      ngoCertificate,
      volunteerCount,
      profilePicture,
    });

    if (user) {
      const emailResult = await sendVerificationEmail(user, verification);
      const phoneResult = phoneVerification ? await sendPhoneVerification(user, phoneVerification.otp) : null;
      const emailStatus = emailResult.sent ? 'Email OTP sent.' : 'Email OTP generated for local testing.';
      const phoneStatus = !phoneVerification
        ? ''
        : phoneResult?.sent
          ? ' Phone OTP sent.'
          : ' Phone OTP generated for local testing.';

      res.status(201).json({
        needsEmailVerification: true,
        needsPhoneVerification: Boolean(phoneVerification),
        message: `Account created. ${emailStatus}${phoneStatus}`,
        emailOtpSent: emailResult.sent,
        phoneOtpSent: Boolean(phoneResult?.sent),
        emailOtp: emailResult.devFallback ? emailResult.otp : undefined,
        phoneOtp: phoneResult?.devFallback ? phoneResult.otp : undefined,
      });
    } else {
      res.status(400);
      throw new Error('Invalid user data');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const cleanedEmail = normalizeEmail(email);

    // Check for user email
    const user = await User.findOne({ email: cleanedEmail }).select('+password');

    if (user?.authProvider === 'google' && !user.password) {
      res.status(401);
      throw new Error('Use Google sign-in for this account');
    }

    if (user?.isBlocked) {
      res.status(403);
      throw new Error('This account has been blocked. Contact admin.');
    }

    if (user && (await user.matchPassword(password))) {
      if (user.role === 'donor' && !user.isEmailVerified) {
        res.status(403);
        throw new Error('Please verify your email before logging in');
      }
      if (user.phoneNumber && !user.isPhoneVerified) {
        res.status(403);
        throw new Error('Please verify your phone number before logging in');
      }
      res.json(userPayload(user));
    } else {
      res.status(401);
      throw new Error('Invalid credentials');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Verify a user's email
// @route   GET /api/auth/verify-email/:token
// @access  Public
const verifyEmail = async (req, res, next) => {
  try {
    const user = await User.findOne({
      emailVerificationToken: req.params.token,
      emailVerificationExpires: { $gt: new Date() },
    }).select('+emailVerificationToken +emailVerificationExpires +emailVerificationOtp +emailVerificationOtpExpires +emailOtpAttempts');

    if (!user) {
      return res.redirect(`${frontendUrl()}/login?verified=failed`);
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    user.emailVerificationOtp = undefined;
    user.emailVerificationOtpExpires = undefined;
    user.emailOtpAttempts = 0;
    await user.save();

    res.redirect(`${frontendUrl()}/login?verified=success`);
  } catch (error) {
    next(error);
  }
};

// @desc    Resend verification email
// @route   POST /api/auth/resend-verification
// @access  Public
const resendVerification = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: normalizeEmail(req.body.email) })
      .select('+emailVerificationToken +emailVerificationExpires +emailVerificationOtp +emailVerificationOtpExpires +emailOtpAttempts');

    if (!user) {
      res.status(404);
      throw new Error('Account not found');
    }

    if (user.isEmailVerified) {
      res.status(400);
      throw new Error('Email is already verified');
    }

    const verification = createEmailVerification();
    user.emailVerificationToken = verification.token;
    user.emailVerificationExpires = verification.expires;
    user.emailVerificationOtp = verification.otp;
    user.emailVerificationOtpExpires = verification.expires;
    user.emailOtpAttempts = 0;
    await user.save();
    const emailResult = await sendVerificationEmail(user, verification);

    res.status(200).json({
      message: emailResult.sent ? 'Verification email sent again.' : 'Email OTP generated for local testing.',
      emailOtpSent: emailResult.sent,
      emailOtp: emailResult.devFallback ? emailResult.otp : undefined,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify email using OTP
// @route   POST /api/auth/verify-email-otp
// @access  Public
const verifyEmailOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email: normalizeEmail(email) })
      .select('+emailVerificationOtp +emailVerificationOtpExpires +emailVerificationToken +emailVerificationExpires +emailOtpAttempts');

    if (!user) {
      res.status(400);
      throw new Error('Account not found');
    }

    if (user.isEmailVerified) {
      res.status(400);
      throw new Error('Email is already verified');
    }

    if (!user.emailVerificationOtp || !user.emailVerificationOtpExpires || user.emailVerificationOtpExpires <= new Date()) {
      res.status(400);
      throw new Error('Email OTP has expired. Please resend OTP.');
    }

    if (user.emailOtpAttempts >= MAX_OTP_ATTEMPTS) {
      res.status(429);
      throw new Error('Maximum email OTP attempts reached. Please resend OTP.');
    }

    if (user.emailVerificationOtp !== cleanString(otp)) {
      user.emailOtpAttempts += 1;
      await user.save();
      res.status(400);
      throw new Error(`Invalid email OTP. ${MAX_OTP_ATTEMPTS - user.emailOtpAttempts} attempt(s) remaining.`);
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    user.emailVerificationOtp = undefined;
    user.emailVerificationOtpExpires = undefined;
    user.emailOtpAttempts = 0;
    await user.save();

    res.status(200).json({ message: 'Email verified successfully.' });
  } catch (error) {
    next(error);
  }
};

// @desc    Send phone verification OTP
// @route   POST /api/auth/send-phone-otp
// @access  Public
const sendPhoneOtp = async (req, res, next) => {
  try {
    const { email, phoneNumber } = req.body;
    const user = await User.findOne(email ? { email: normalizeEmail(email) } : { phoneNumber: normalizePhone(phoneNumber) })
      .select('+phoneVerificationOtp +phoneVerificationOtpExpires +phoneOtpAttempts');

    if (!user) {
      res.status(404);
      throw new Error('Account not found');
    }

    if (!user.phoneNumber) {
      res.status(400);
      throw new Error('No phone number is saved for this account');
    }

    if (user.isPhoneVerified) {
      res.status(400);
      throw new Error('Phone number is already verified');
    }

    const phoneVerification = createPhoneVerification();
    user.phoneVerificationOtp = phoneVerification.otp;
    user.phoneVerificationOtpExpires = phoneVerification.expires;
    user.phoneOtpAttempts = 0;
    await user.save();

    const phoneResult = await sendPhoneVerification(user, phoneVerification.otp);
    res.status(200).json({
      message: phoneResult.sent ? 'Phone verification OTP sent.' : 'Phone OTP generated for local testing.',
      phoneOtpSent: phoneResult.sent,
      phoneOtp: phoneResult.devFallback ? phoneResult.otp : undefined,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify phone using OTP
// @route   POST /api/auth/verify-phone-otp
// @access  Public
const verifyPhoneOtp = async (req, res, next) => {
  try {
    const { email, phoneNumber, otp } = req.body;
    const user = await User.findOne(email ? { email: normalizeEmail(email) } : { phoneNumber: normalizePhone(phoneNumber) })
      .select('+phoneVerificationOtp +phoneVerificationOtpExpires +phoneOtpAttempts');

    if (!user) {
      res.status(400);
      throw new Error('Account not found');
    }

    if (user.isPhoneVerified) {
      res.status(400);
      throw new Error('Phone number is already verified');
    }

    if (!user.phoneVerificationOtp || !user.phoneVerificationOtpExpires || user.phoneVerificationOtpExpires <= new Date()) {
      res.status(400);
      throw new Error('Phone OTP has expired. Please resend OTP.');
    }

    if (user.phoneOtpAttempts >= MAX_OTP_ATTEMPTS) {
      res.status(429);
      throw new Error('Maximum phone OTP attempts reached. Please resend OTP.');
    }

    if (user.phoneVerificationOtp !== cleanString(otp)) {
      user.phoneOtpAttempts += 1;
      await user.save();
      res.status(400);
      throw new Error(`Invalid phone OTP. ${MAX_OTP_ATTEMPTS - user.phoneOtpAttempts} attempt(s) remaining.`);
    }

    user.isPhoneVerified = true;
    user.phoneVerificationOtp = undefined;
    user.phoneVerificationOtpExpires = undefined;
    user.phoneOtpAttempts = 0;
    await user.save();

    res.status(200).json({ message: 'Phone number verified successfully.' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Google client ID for browser sign-in
// @route   GET /api/auth/google-client-id
// @access  Public
const getGoogleClientId = (req, res) => {
  res.status(200).json({
    clientId: process.env.GOOGLE_CLIENT_ID || '',
  });
};

// @desc    Login or register with Google
// @route   POST /api/auth/google
// @access  Public
const googleAuth = async (req, res, next) => {
  try {
    const { credential, role } = req.body;
    if (!process.env.GOOGLE_CLIENT_ID) {
      res.status(503);
      throw new Error('Google sign-in is not configured. Add GOOGLE_CLIENT_ID in backend/.env and restart the server.');
    }

    if (!credential) {
      res.status(400);
      throw new Error('Google credential is required');
    }

    const profile = await verifyGoogleToken(credential);
    const normalizedRole = normalizeRole(role);
    if (normalizedRole === 'admin') {
      res.status(403);
      throw new Error('Admin accounts cannot be created with Google sign-in');
    }

    let user = await User.findOne({ email: profile.email }).select('+password');
    if (!user) {
      user = await User.create({
        name: profile.name || profile.email,
        email: profile.email,
        role: normalizedRole,
        authProvider: 'google',
        googleId: profile.sub,
        isEmailVerified: true,
        profilePicture: profile.picture,
      });
    } else {
      user.authProvider = user.authProvider === 'local' ? 'local' : 'google';
      user.googleId = user.googleId || profile.sub;
      user.isEmailVerified = true;
      user.profilePicture = user.profilePicture === 'default.jpg' && profile.picture ? profile.picture : user.profilePicture;
      await user.save();
    }

    res.status(200).json(userPayload(user));
  } catch (error) {
    next(error);
  }
};

// @desc    Get user data
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
  try {
    res.status(200).json(req.user);
  } catch (error) {
    next(error);
  }
};

// @desc    Get registered donor and receiver account details
// @route   GET /api/auth/users
// @access  Private (Admin only)
const getUsers = async (req, res, next) => {
  try {
    const users = await User.find({
      role: { $in: ['donor', 'receiver', 'Donor', 'NGO', 'Individual'] },
    }).sort({ createdAt: -1 });

    res.status(200).json(users.map(accountPayload));
  } catch (error) {
    next(error);
  }
};

// @desc    Block or unblock a user
// @route   PUT /api/auth/users/:id/block
// @access  Private (Admin only)
const updateUserBlockStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    if (user.role === 'admin') {
      res.status(400);
      throw new Error('Admin accounts cannot be blocked from this route');
    }

    user.isBlocked = Boolean(req.body.isBlocked);
    await user.save();

    res.status(200).json(accountPayload(user));
  } catch (error) {
    next(error);
  }
};

// @desc    Mark NGO/receiver documents as verified
// @route   PUT /api/auth/users/:id/verify-ngo
// @access  Private (Admin only)
const verifyNgo = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    user.ngoVerified = Boolean(req.body.ngoVerified ?? true);
    await user.save();

    res.status(200).json(accountPayload(user));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerUser,
  loginUser,
  verifyEmail,
  resendVerification,
  verifyEmailOtp,
  sendPhoneOtp,
  verifyPhoneOtp,
  getGoogleClientId,
  googleAuth,
  getMe,
  getUsers,
  updateUserBlockStatus,
  verifyNgo,
};
