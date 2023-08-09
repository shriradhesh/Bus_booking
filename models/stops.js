const mongoose = require('mongoose');

const stopSchema = new mongoose.Schema({
  stopName: { 
    type: String,
    required: true
     },

  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true
    },
    coordinates: {
      type: [Number],
      required: true
    }
  }
});

stopSchema.index({ location: '2dsphere' }); // index for geospatial queries

const Stop = mongoose.model('Stop', stopSchema);

module.exports = Stop;
