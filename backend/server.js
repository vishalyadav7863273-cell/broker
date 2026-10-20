require('dotenv').config();
const http = require('http');
const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');

const connectDB = require('./src/config/db');
const authRoutes = require('./src/routes/authRoutes');
const flatRoutes = require('./src/routes/flatRoutes');
const visitRoutes = require('./src/routes/visitRoutes');
const notificationRoutes = require('./src/routes/notificationRoutes');
const adminRoutes = require('./src/routes/adminRoutes');
const paymentRoutes = require('./src/routes/paymentRoutes');
const uploadRoutes = require('./src/routes/uploadRoutes');
const paymentController = require('./src/controllers/paymentController');
const { initSocket } = require('./src/socket');
const { notFound, errorHandler } = require('./src/middleware/error');

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: (process.env.CLIENT_URLS || 'http://localhost:5173').split(',').map((s) => s.trim()),
    credentials: true,
  })
);
// Razorpay webhook needs the raw body for signature verification, so it is registered before express.json()
app.post('/api/payments/webhook', express.raw({ type: 'application/json', limit: '1mb' }), paymentController.webhook);
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use(mongoSanitize());
if (process.env.NODE_ENV !== 'production') app.use(morgan('dev'));

app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, max: 300, standardHeaders: true, legacyHeaders: false }));

// Uploaded flat photos. helmet defaults to same-origin; the frontend runs on another origin, so allow cross-origin reads here.
app.use('/uploads', (req, res, next) => { res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin'); next(); }, express.static(path.join(__dirname, 'uploads'), { maxAge: '7d' }));

app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api/auth', authRoutes);
app.use('/api/flats', flatRoutes);
app.use('/api/visits', visitRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/uploads', uploadRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);
initSocket(server);
connectDB().then(() => {
  server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});

module.exports = app;
