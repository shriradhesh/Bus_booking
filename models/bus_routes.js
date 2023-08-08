const mongoose = require('mongoose')
const busRouteSchema = new mongoose.Schema({
    routeNumber:{
        type : String,
        required : true,
    },
    startingPoint: {
        type : String,
        required : true,
    },
    endPoint:{ 
        type : [String],
        required : true
               },
    stops: {
        type : [String],
        required : true,
    },
    schedule:{
        type : [String],
        required : true,
    },
    distances: 
    {type : [Number]}, 
})

const BusRoute= mongoose.model('BusRoute', busRouteSchema);

module.exports = BusRoute;
