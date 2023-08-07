const mongoose = require('mongoose')
const busRouteSchema = new mongoose.Schema({
    routeNumber: String,
    startingPoint: String,
    endpoints: [String],
    stops: [String],
    schedule: [String],
})

const BusRoute= mongoose.model('BusRoute', busRouteSchema);

module.exports = BusRoute;
