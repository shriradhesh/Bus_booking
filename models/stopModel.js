const mongoose = require('mongoose')
const stopSchema = new mongoose.Schema({
stopName : {
    type : String,
    required : true
}  

},
{timestamps: true}
)

const stopModel= mongoose.model('stopModel', stopSchema);

module.exports = stopModel;
