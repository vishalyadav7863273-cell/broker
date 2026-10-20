// Usage: npm run seed
// Inserts 16 demo flats with full details. Flats that already exist keep what the admin edited;
// only the new "property details" fields are filled in if they are still missing.
require('dotenv').config();
const mongoose = require('mongoose');
const Flat = require('../models/Flat');

const inDays = (n) => new Date(Date.now() + n * 864e5);
// d = [carpetArea sqft, bathrooms, balconies, facing, age years, maintenance/month, preferredTenants, parking, petsAllowed, availableInDays]
const mk = (i, name, area, rent, bhk, furnishing, floor, amenities, description, d, status = 'available') => ({
  propertyId: `FR-${100 + i}`, name, address: `${12 + i * 3}, ${area}, Lucknow`, area, monthlyRent: rent, bhk, furnishing, floor, amenities, description, status,
  carpetArea: d[0], bathrooms: d[1], balconies: d[2], facing: d[3], ageOfProperty: d[4], maintenance: d[5], preferredTenants: d[6], parking: d[7], petsAllowed: d[8], availableFrom: inDays(d[9]),
});

const FLATS = [
  mk(1, 'Sunrise Residency 2B', 'Gomti Nagar', 18000, '2BHK', 'semi-furnished', 3, ['Lift', 'Parking', 'Power backup', '24x7 water', 'Security'], 'Bright corner flat with a balcony facing the park. Wardrobes and modular kitchen included.', [980, 2, 1, 'East', 4, 1200, 'family', 'both', false, 7]),
  mk(2, 'Green Court Studio', 'Indira Nagar', 8500, '1RK', 'furnished', 1, ['Wi-Fi', 'Geyser', 'Power backup', 'Washing machine'], 'Compact furnished studio, 10 minutes from the main market. Suited to working professionals and students.', [340, 1, 0, 'North', 2, 500, 'bachelor', 'bike', false, 3]),
  mk(3, 'Lotus Heights 3B', 'Gomti Nagar', 28000, '3BHK', 'furnished', 5, ['Lift', 'Gym', 'Parking', 'CCTV', 'Power backup'], 'Spacious family flat with three bedrooms, a dining area and two balconies. Society has a gym and play area.', [1450, 3, 2, 'North-East', 3, 2500, 'family', 'both', true, 14]),
  mk(4, 'Maple Villa Floor', 'Aliganj', 12000, '2BHK', 'unfurnished', 0, ['Parking', 'Garden', '24x7 water'], 'Ground floor of an independent house with a private garden. Quiet lane, pets welcome.', [900, 2, 1, 'South', 8, 0, 'family', 'both', true, 10]),
  mk(5, 'City Nest 1BHK', 'Hazratganj', 14000, '1BHK', 'semi-furnished', 2, ['Lift', 'Security', 'Wi-Fi'], 'Walkable to offices, cafes and metro. Fresh paint and new fittings.', [560, 1, 1, 'West', 5, 800, 'any', 'bike', false, 5]),
  mk(6, 'Orchid Apartments', 'Vikas Nagar', 9500, '1BHK', 'unfurnished', 2, ['Parking', 'Water tank', 'Security'], 'Budget-friendly 1BHK in a calm residential block, close to schools and a hospital.', [520, 1, 1, 'East', 10, 400, 'family', 'bike', false, 0], 'occupied'),
  mk(7, 'Skyline Duplex', 'Jankipuram', 35000, '4BHK+', 'semi-furnished', 4, ['Lift', 'Terrace', 'Parking', 'CCTV', 'Power backup'], 'Duplex with a private terrace. Ideal for large families; gated society.', [2100, 4, 3, 'North', 1, 3500, 'family', 'both', true, 20]),
  mk(8, 'Palm Grove 2B', 'Indira Nagar', 15500, '2BHK', 'furnished', 4, ['Lift', 'AC in bedrooms', 'Geyser', 'Parking'], 'Fully furnished with ACs, sofa and bed. Move in with just a suitcase.', [940, 2, 1, 'North-West', 3, 1000, 'any', 'car', false, 2]),
  mk(9, 'Riverside Residency 3B', 'Gomti Nagar', 32000, '3BHK', 'furnished', 7, ['Lift', 'Gym', 'Swimming pool', 'Club house', 'Parking', 'CCTV'], 'High-floor flat with open views, a club house and a swimming pool in the society.', [1620, 3, 2, 'East', 2, 3000, 'family', 'both', true, 12]),
  mk(10, 'Cedar Court 1RK', 'Aliganj', 6500, '1RK', 'semi-furnished', 1, ['Geyser', 'Water tank', 'Power backup'], 'Neat and affordable room with a kitchenette, near colleges and the bus stop.', [280, 1, 0, 'South', 6, 300, 'bachelor', 'bike', false, 1]),
  mk(11, 'Heritage Lane 2B', 'Hazratganj', 21000, '2BHK', 'semi-furnished', 2, ['Security', 'Parking', 'Power backup', 'Wi-Fi'], 'Old-world charm with high ceilings in the heart of the city. Walk to shops and offices.', [1050, 2, 1, 'West', 15, 1500, 'any', 'bike', false, 8]),
  mk(12, 'Meadow View 1BHK', 'Vikas Nagar', 11000, '1BHK', 'furnished', 3, ['Lift', 'Wi-Fi', 'Geyser', 'Security'], 'Cosy furnished 1BHK with a green view. Ideal for a couple or a working professional.', [580, 1, 1, 'North-East', 3, 600, 'any', 'bike', false, 4]),
  mk(13, 'Orion Towers 2B', 'Jankipuram', 17000, '2BHK', 'semi-furnished', 6, ['Lift', 'Gym', 'Parking', 'CCTV', '24x7 water'], 'Modern tower with a gym and 24x7 water. Large living room and two balconies.', [1000, 2, 2, 'East', 2, 1400, 'family', 'both', true, 9]),
  mk(14, 'Banyan Nest 3B Floor', 'Aliganj', 22000, '3BHK', 'unfurnished', 1, ['Parking', 'Garden', 'Terrace access', 'Water tank'], 'Independent builder floor with a shared terrace and a car-park in front.', [1300, 3, 2, 'South-East', 7, 0, 'family', 'both', true, 15]),
  mk(15, 'Zenith Studio', 'Gomti Nagar', 9000, '1RK', 'furnished', 3, ['Wi-Fi', 'Lift', 'Geyser', 'Washing machine', 'Security'], 'Smart studio with a work desk, wardrobe and washing machine. Move-in ready.', [360, 1, 0, 'West', 1, 700, 'bachelor', 'bike', false, 2]),
  mk(16, 'Elm Park Residency 2B', 'Indira Nagar', 19500, '2BHK', 'furnished', 5, ['Lift', 'Parking', 'AC in bedrooms', 'Power backup', 'Security'], 'Furnished 2BHK facing a park. Two ACs, modular kitchen and two full bathrooms.', [990, 2, 1, 'North', 2, 1300, 'family', 'both', false, 6]),
];

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  let added = 0; let filled = 0;
  for (const f of FLATS) {
    const exists = await Flat.findOne({ propertyId: f.propertyId });
    if (!exists) { await Flat.create(f); added += 1; continue; }
    if (exists.carpetArea == null) {
      const { propertyId, name, address, area, monthlyRent, bhk, furnishing, floor, amenities, description, status, ...details } = f; // eslint-disable-line no-unused-vars
      await Flat.updateOne({ _id: exists._id }, { $set: details }); filled += 1;
    }
  }
  console.log(`Added ${added} flat(s); filled details on ${filled} existing flat(s); ${FLATS.length} in the demo set.`);
  await mongoose.disconnect();
})();
