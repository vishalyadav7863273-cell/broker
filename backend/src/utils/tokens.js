const jwt = require('jsonwebtoken');

const signAccessToken = (user) =>
  jwt.sign({ sub: user._id.toString(), role: user.role }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m',
  });

const signRefreshToken = (user) =>
  jwt.sign({ sub: user._id.toString(), tv: user.tokenVersion }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: `${process.env.JWT_REFRESH_EXPIRES_DAYS || 7}d`,
  });

const verifyAccessToken = (t) => jwt.verify(t, process.env.JWT_ACCESS_SECRET);
const verifyRefreshToken = (t) => jwt.verify(t, process.env.JWT_REFRESH_SECRET);

const refreshCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge: (Number(process.env.JWT_REFRESH_EXPIRES_DAYS) || 7) * 24 * 60 * 60 * 1000,
  path: '/api/auth',
});

module.exports = { signAccessToken, signRefreshToken, verifyAccessToken, verifyRefreshToken, refreshCookieOptions };
