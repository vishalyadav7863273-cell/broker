// Usage: set ADMIN_* values in .env, then run: npm run create-admin
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

(async () => {
  const { MONGODB_URI, ADMIN_NAME, ADMIN_EMAIL, ADMIN_PHONE, ADMIN_PASSWORD } = process.env;
  if (!MONGODB_URI || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.error('Set MONGODB_URI, ADMIN_EMAIL and ADMIN_PASSWORD in .env first.');
    process.exit(1);
  }
  if (ADMIN_PASSWORD.length < 10) {
    console.error('ADMIN_PASSWORD must be at least 10 characters.');
    process.exit(1);
  }
  await mongoose.connect(MONGODB_URI);
  const existing = await User.findOne({ email: ADMIN_EMAIL.toLowerCase() });
  if (existing) {
    console.log('A user with this email already exists. Nothing changed.');
  } else {
    await User.create({
      fullName: ADMIN_NAME || 'Admin',
      email: ADMIN_EMAIL,
      phone: ADMIN_PHONE,
      passwordHash: await User.hashPassword(ADMIN_PASSWORD),
      role: 'admin',
      isVerified: true,
    });
    console.log(`Admin created: ${ADMIN_EMAIL}`);
    console.log('Now remove ADMIN_PASSWORD from .env.');
  }
  await mongoose.disconnect();
})();
