const mongoose = require('mongoose');

const flatSchema = new mongoose.Schema(
  {
    propertyId: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    area: { type: String, required: true, trim: true, index: true },
    monthlyRent: { type: Number, required: true, min: 0, index: true },
    // Derived from rent by default (2 / 1 / 1 months) but admin can override.
    securityDeposit: { type: Number, min: 0 },
    advanceRent: { type: Number, min: 0 },
    brokerage: { type: Number, min: 0 },
    bhk: { type: String, enum: ['1RK', '1BHK', '2BHK', '3BHK', '4BHK+'], required: true, index: true },
    furnishing: { type: String, enum: ['furnished', 'semi-furnished', 'unfurnished'], required: true, index: true },
    floor: { type: Number, min: 0 },
    photos: [{ type: String }],
    amenities: [{ type: String }],
    status: { type: String, enum: ['available', 'occupied', 'maintenance'], default: 'available', index: true },
    description: { type: String, maxlength: 3000 },
    // Property details shown on the flat page
    carpetArea: { type: Number, min: 0 }, // sq ft
    bathrooms: { type: Number, min: 0 },
    balconies: { type: Number, min: 0 },
    facing: { type: String, enum: ['North', 'South', 'East', 'West', 'North-East', 'North-West', 'South-East', 'South-West'] },
    ageOfProperty: { type: Number, min: 0 }, // years
    availableFrom: { type: Date },
    maintenance: { type: Number, min: 0 }, // INR per month
    preferredTenants: { type: String, enum: ['any', 'family', 'bachelor'] },
    parking: { type: String, enum: ['none', 'bike', 'car', 'both'] },
    petsAllowed: { type: Boolean },
  },
  { timestamps: true }
);

flatSchema.pre('validate', function (next) {
  if (this.securityDeposit == null) this.securityDeposit = this.monthlyRent * 2;
  if (this.advanceRent == null) this.advanceRent = this.monthlyRent;
  if (this.brokerage == null) this.brokerage = this.monthlyRent;
  next();
});

module.exports = mongoose.model('Flat', flatSchema);
