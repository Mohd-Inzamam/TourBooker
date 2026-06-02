const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    address: {
      type: String,
      trim: true
    },
    city: {
      type: String,
      trim: true
    },
    state: {
      type: String,
      trim: true
    },
    country: {
      type: String,
      trim: true
    },
    coordinates: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: [Number] // [longitude, latitude]
    },
    placeId: {
      type: String
    },
    displayName: {
      type: String
    }
  },
  {
    timestamps: true
  }
);

// Add compound index on city and country for fast search
locationSchema.index({ city: 1, country: 1 });
locationSchema.index({ coordinates: '2dsphere' });


const Location = mongoose.model('Location', locationSchema);
module.exports = Location;
