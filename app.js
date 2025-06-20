if(process.env.NODE_ENV != 'production'){
    require('dotenv').config();
}

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const  path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const multer = require("multer");
const {storage} = require("./cloudconfig.js");
const upload = multer({ storage });
const  Listing  = require("./models/listing.js");


// let MONGO_URL = "mongodb://127.0.0.1:27017/stu_info";
let dbUrl = process.env.ATLASDB_URL ;

main()
    .then( () => {
        console.log("connected to DB");
    })
    .catch( (err) => {
        console.log(err);
    });

async function main() {
    await mongoose.connect(dbUrl);
}

app.set("view engine","ejs");
app.set("views",path.join(__dirname,"views"));
app.use(express.urlencoded({extended:true}));
app.use(methodOverride("_method"));
app.engine("ejs",ejsMate);
app.use(express.static(path.join(__dirname,"/public")));


//Index Route
app.get("/listings",async (req,res) => {
    const allListings = await Listing.find();
    res.render("listings/index.ejs",{allListings})
});

//New Route
app.get("/listing/new",(req,res)=>{
    res.render("listings/new.ejs");
});

//Create Route
app.post("/listing", upload.single ('listing[image]'), async (req,res)=>{
    let url = req.file.path ;
    let filename = req.file.filename ;
    // console.log( url , filename );
    const newListing = new Listing(req.body.listing);
    newListing.image = { url , filename};
    await newListing.save();
    res.redirect("/listings");
})
//Show Route
app.get("/listings/:id",async (req,res) =>{
    const id = req.params.id;
    const listing = await Listing.findById(id);
    res.render("listings/show.ejs",{listing});
});

//Edit Route
app.get("/listing/:id/edit",async(req,res)=>{
    const id = req.params.id;
    const listing = await Listing.findById(id);
    res.render("listings/edit.ejs",{listing});
});

//Update Route
app.put("/listings/:id", upload.single ('listing[image]') ,async (req,res)=>{
    const id = req.params.id;
    let url = req.file.path ;
    let filename = req.file.filename ;
    await Listing.findByIdAndUpdate(id,{...req.body.listing});
    await Listing.findByIdAndUpdate(id,{
        image : {
            url : url ,
            filename : filename
        }
    });
    const listing = await Listing.findById(id);
    res.render("listings/show.ejs",{listing});
    // res.redirect(`/listings/:${id}`);
});

//Delete Route
app.delete("/listings/:id",async (req,res) =>{
    const id = req.params.id;
    await Listing.findByIdAndDelete(id);
    res.redirect("/listings");
})



// app.get("/testListing",async (req,res) => {
//     let sampleListing = new Listing({
//         email : "test@gmail.com",
//         name:"My name",
//         family_background : "This is my home",
//         skills : "programming",
//         challanges : "I am a student",
//         goals : "I want to be a developer",
//         higher_studies : "I want to study in a good university",
//     });
//     await sampleListing.save();
//     console.log("sample is saved");
//     res.send("sample is saved");
// })


app.get("/", (req,res)=> {
    res.send("Hii , i am root");
});


app.listen(8080, () => {
    console.log("server is listining on port 8080");
});     