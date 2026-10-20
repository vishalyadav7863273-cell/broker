const router = require('express').Router();
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const multer = require('multer');
const ApiError = require('../utils/ApiError');
const { protect, staffOrAdmin } = require('../middleware/auth');

const dir = path.join(__dirname, '../../uploads');
fs.mkdirSync(dir, { recursive: true });

const EXT = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };
const upload = multer({
  storage: multer.diskStorage({ destination: dir, filename: (req, file, cb) => cb(null, crypto.randomBytes(12).toString('hex') + EXT[file.mimetype]) }),
  limits: { fileSize: 5 * 1024 * 1024, files: 6 },
  fileFilter: (req, file, cb) => (EXT[file.mimetype] ? cb(null, true) : cb(new ApiError(400, 'Only JPG, PNG or WebP images are allowed'))),
});

// POST /api/uploads  (multipart, field "photos", up to 6 images of 5 MB) -> { urls: ['/uploads/xxx.jpg'] }
router.post('/', protect, staffOrAdmin,
  (req, res, next) => upload.array('photos', 6)(req, res, (err) => {
    if (!err) return next();
    if (err instanceof multer.MulterError) return next(new ApiError(400, err.code === 'LIMIT_FILE_SIZE' ? 'Each image must be 5 MB or less' : 'Too many files (max 6 per upload)'));
    next(err);
  }),
  (req, res) => {
    if (!req.files?.length) throw new ApiError(400, 'Choose at least one image');
    res.status(201).json({ urls: req.files.map((f) => `/uploads/${f.filename}`) });
  });

module.exports = router;
