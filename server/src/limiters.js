import rateLimit from 'express-rate-limit';

const tooMany = { error: 'Too many requests. Please wait a few minutes and try again.' };

// Slows down password guessing.
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: tooMany,
});

// Protects your AI quota from runaway use.
export const aiLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 60,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: tooMany,
});
