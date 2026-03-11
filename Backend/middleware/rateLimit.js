const buckets = new Map();

const createMemoryRateLimiter = ({ windowMs = 60 * 1000, max = 30, keyFn, message = "Too many requests" } = {}) => {
  return (req, res, next) => {
    const now = Date.now();
    const key =
      (typeof keyFn === "function" && keyFn(req)) ||
      `${req.ip || req.connection?.remoteAddress || "unknown"}:${req.originalUrl || req.path}`;

    const state = buckets.get(key);
    if (!state || now > state.resetAt) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    state.count += 1;
    if (state.count > max) {
      const retryAfterSec = Math.max(1, Math.ceil((state.resetAt - now) / 1000));
      res.setHeader("Retry-After", String(retryAfterSec));
      return res.status(429).json({ success: false, message });
    }

    return next();
  };
};

module.exports = { createMemoryRateLimiter };
