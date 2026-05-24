const jwt = require('jsonwebtoken');
const User = require('../models/User');

const normalizeRole = (role) => {
  if (['donor', 'Donor', 'Individual'].includes(role)) return 'donor';
  if (['receiver', 'NGO'].includes(role)) return 'receiver';
  if (['admin', 'Admin'].includes(role)) return 'admin';
  return role;
};

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from the token
      req.user = await User.findById(decoded.id).select('-password');
      if (req.user) {
        req.user.role = normalizeRole(req.user.role);
        if (req.user.isBlocked) {
          res.status(403);
          return next(new Error('This account has been blocked'));
        }
      }

      next();
    } catch (error) {
      console.error(error);
      res.status(401);
      next(new Error('Not authorized, token failed'));
    }
  }

  if (!token) {
    res.status(401);
    next(new Error('Not authorized, no token'));
  }
};

// Role authorization middleware
const authorize = (...roles) => {
  return (req, res, next) => {
    const userRole = normalizeRole(req.user.role);
    if (!roles.includes(userRole)) {
      res.status(403);
      return next(
        new Error(`User role ${userRole} is not authorized to access this route`)
      );
    }
    next();
  };
};

module.exports = { protect, authorize };
