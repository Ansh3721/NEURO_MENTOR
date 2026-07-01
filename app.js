if(process.env.NODE_ENV != 'production'){
    require('dotenv').config();
}

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const  path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const ExpressError = require("./utils/ExpressError.js");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const flash = require ("connect-flash");
const passport = require ("passport");
const LocalStrategy = require("passport-local");
const multer = require("multer");
const User = require("./models/user.js");
const StudentProfile = require("./models/studentProfile.js");

const listingRouter = require("./routs/listing.js");
const reviewRouter = require("./routs/review.js");
const userRouter = require("./routs/user.js");
const studentProfileRouter = require("./routs/studentProfile.js");

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

const store = MongoStore.create({
    mongoUrl : dbUrl,
    crypto:{
        secret: process.env.SECRET
    },
    touchAfter : 24 * 60 ,
});

store.on("error",(err)=>{
    console.log("Error in MONGO SESSION STORE", err);
})

const sessionOptions = {
    store,
    secret: process.env.SECRET,
    resave: false , 
    saveUninitialized: true ,
    cookie : {
        expires : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) ,
        maxAge :  7 * 24 * 60 * 60 * 1000 ,
        httpOnly : true,
    },   
};


app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req,res,next)=>{
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currUser = req.user ;
    next();
});

// Populate whether the current user already has a listing (used by navbar and guards)
app.use(async (req, res, next) => {
    res.locals.hasListing = false;
    res.locals.userListingId = null;
    res.locals.hasStudentProfile = false;
    res.locals.studentProfileId = null;
    try {
        if (req.user) {
            const Listing = require('./models/listing');
            const existingListing = await Listing.findOne({ owner: req.user._id }).select('_id');
            if (existingListing) {
                res.locals.hasListing = true;
                res.locals.userListingId = existingListing._id;
            }

            const existingProfile = await StudentProfile.findOne({ owner: req.user._id }).select('_id');
            if (existingProfile) {
                res.locals.hasStudentProfile = true;
                res.locals.studentProfileId = existingProfile._id;
            }
        }
    } catch (e) {
        console.error('Error checking user profile state:', e && e.message);
    }
    next();
});


app.get("/", (req,res)=> {
    res.render("./home.ejs");
});

app.get('/wallet', async (req, res) => {
    if (!req.user) {
        return res.redirect('/login');
    }

    const StudentProfile = require('./models/studentProfile');
    const Listing = require('./models/listing');

    const studentProfile = await StudentProfile.findOne({ owner: req.user._id });
    const educatorProfile = await Listing.findOne({ owner: req.user._id });

    const balance = studentProfile?.walletBalance ?? educatorProfile?.walletBalance ?? 0;
    const bookingSummary = studentProfile?.bookingSummary || educatorProfile?.bookingSummary || {};

    res.render('wallet.ejs', {
        balance,
        upcoming: bookingSummary.upcomingSessions ?? 0,
        completed: bookingSummary.completedSessions ?? 0,
        cancelled: bookingSummary.cancelledSessions ?? 0,
    });
});

app.use ("/listings" , listingRouter);
app.use ("/listings/:id/stu_problem",reviewRouter);
app.use("/student-profile", studentProfileRouter);
app.use("/",userRouter);

app.use((req, res, next) => {
    next(new ExpressError(404, "page not found!"));
});

app.use((err,req,res,next)=>{
    if (err instanceof multer.MulterError) {
        console.error("Multer error:", err.code, err.field, err.message);
        return res.status(400).render("Error.ejs", {
            message: `${err.message}${err.field ? ` (${err.field})` : ""}`,
        });
    }
    let{statusCode = 500 , message = "something went wrong!!"} = err ;
    res.status(statusCode).render("Error.ejs" , {message});
    // res.status(statusCode).send(message);
});


app.listen(8080, () => {
    console.log("server is listening on port 8080");
});     