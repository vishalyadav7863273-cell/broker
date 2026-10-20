const mongoose = require('mongoose');

// NOTE: no password here. Login credentials live only in `users`; userId links the two.
const customerSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: true, sparse: true },
    fullName: { type: String, required: true, trim: true, maxlength: 100 },
    nativePlace: { type: String, trim: true },
    currentlyStaying: { type: String, trim: true },
    nationality: { type: String, trim: true },
    contactNumber: { type: String, required: true, trim: true, index: true },
    ageGroup: { type: String, enum: ['18-25', '26-35', '36-45', '46-60', '60+'] },
    linkedinProfile: { type: String, trim: true },
    maxBudget: { type: Number, min: 0 },
    requiredBHK: { type: String, enum: ['1RK', '1BHK', '2BHK', '3BHK', '4BHK+'] },
    furnishingPreference: { type: String, enum: ['furnished', 'semi-furnished', 'unfurnished', 'any'], default: 'any' },
    preferredFloor: { type: String, trim: true },
    preferredArea: { type: String, trim: true },
    profession: { type: String, trim: true },
    companyOrCollege: { type: String, trim: true },
    workLocation: { type: String, trim: true },
    tenantType: { type: String, enum: ['family', 'bachelor'] },
    numberOfPeople: { type: Number, min: 1, max: 20 },
    expectedShiftingDate: { type: Date },
    smokingDrinkingPreference: { type: String, trim: true }, // optional
    vehicleOwnership: { type: String, enum: ['none', 'two-wheeler', 'four-wheeler', 'both'], default: 'none' },
    pets: { type: String, trim: true },
    additionalNotes: { type: String, trim: true, maxlength: 1000 },
    consentForDataCollection: { type: Boolean, required: true },
    consentAt: { type: Date },
    deletionRequested: { type: Boolean, default: false },
  },
  { timestamps: true }
);

customerSchema.index({ fullName: 'text', contactNumber: 'text', preferredArea: 'text' });

module.exports = mongoose.model('Customer', customerSchema);
