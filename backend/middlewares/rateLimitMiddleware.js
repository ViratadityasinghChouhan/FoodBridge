const buckets = new Map();

const createRateLimiter = ({ windowMs = 15 * 60 * 1000, max = 30, keyPrefix = 'global' } = {}) => {
  return (req, res, next) => {
    const key = `${keyPrefix}:${req.ip}:${req.originalUrl}`;
    const now = Date.now();
    const current = buckets.get(key);

    if (!current || current.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    current.count += 1;
    if (current.count > max) {
      res.status(429);
      return next(new Error('Too many attempts. Please wait and try again.'));
    }

    return next();
  };
};

module.exports = { createRateLimiter };
