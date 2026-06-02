const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const stu_problem = require('./stu_problem.js');


const listingSchema = new Schema ({
    email : String,  
    name : String ,
    bio : String ,
    location : String ,
    languages : String ,
    educatorType : String ,
    studentDetails : {
      degree : String,
      college : String,
      yearSemester : String,
      cgpaPointer : String,
      subjectGrades : String,
    },
    professionalDetails : {
      jobRole : String,
      companyName : String,
      yearsExperience : Number,
      previousExperience : String,
    },
    subjects : [
      {
        name : String,
        level : String,
      },
    ],
    socialProfiles : {
      linkedin : String,
      github : String,
      instagram : String,
      portfolio : String,
    },
    availability : {
      days : [String],
      timeSlots : String,
    },
    pricing : Number,
    identityVerification : {
      idType : String,
      governmentId : {
        url : String,
        filename : String,
      },
    },
    agreements : {
      confirmAccuracy : Boolean,
      acceptTerms : Boolean,
    },
    image : {
      url : {
        type:String,
        default : "https://imgs.search.brave.com/IosFfAUW198am6vMcV2nU_7N6dRiqTHJ0SmoX0X27mY/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9pLnBp/bmltZy5jb20vb3Jp/Z2luYWxzLzJjLzQ3/L2Q1LzJjNDdkNWRk/NWI1MzJmODNiYjU1/YzRjZDZmNWJkMWVm/LmpwZw",
      },
      filename : {
        type:String,
        default :"filename.jpg"
      }
    },
    stu_problems :[
      {
      type : Schema.Types.ObjectId,
      ref : "Stu_problem"
      } ,
    ],
    owner :{
      type:Schema.Types.ObjectId,
      ref: "User",
    }
},{ strict: false });


listingSchema.post("findOneAndDelete",async (listing)=>{
    if(listing){
      await stu_problem.deleteMany({_id:{$in:listing.stu_problems}});
    }
});

const Listing = mongoose.model("Listing", listingSchema);
module.exports = Listing;

