const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const linstingSchema = new Schema ({
    email : {
        type : String,
        required : true
    },  
    name : String ,
    family_background : String ,
    skills : String ,
    challanges : String ,
    goals : String ,
    higher_studies : String ,
    image : {
      url : String,
      filename : String,
    }
});

const Listing = mongoose.model("Listing", linstingSchema);
module.exports = Listing;

