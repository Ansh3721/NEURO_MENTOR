const  Listing  = require("./models/listing.js");
const ExpressError = require("./utils/ExpressError.js");
const { listingSchema , stu_problemSchema } = require("./schema.js");

module.exports.preventDuplicateListing = async (req, res, next) => {
    if (!req.user) {
        return next();
    }
    try {
        const existing = await Listing.findOne({ owner: req.user._id });
        if (existing) {
            req.flash('error', 'You already have an educator profile.');
            return res.redirect(`/listings/${existing._id}`);
        }
        return next();
    } catch (err) {
        return next(err);
    }
};

module.exports.isLoggedIn = (req,res,next)=>{
    if(!req.isAuthenticated()){
        req.session.redirectUrl = req.originalUrl;
        req.flash("error","you must be logged in..");
        return res.redirect("/login");
    }
    next();
}

module.exports.saveRedirectUrl = (req,res,next)=>{
    if(req.session.redirectUrl){
        res.locals.redirectUrl = req.session.redirectUrl;
    }
    next();
};

module.exports.isOwner = async (req,res,next)=>{
    let {id} = req.params;
    let listing = await Listing.findById(id);
    if(!listing.owner._id.equals(res.locals.currUser._id)){
        req.flash("error","you dont have access..");
        return res.redirect(`/listings/${id}`);
    }
    next();
};

module.exports.validateListing = (req, res, next)=>{
    try {
        let { error } = listingSchema.validate(req.body);
        if ( error ){
            let errMsg = error.details.map((el) => el.message).join(",");
            console.error("Listing validation failed:", {
                message: errMsg,
                bodyKeys: Object.keys(req.body || {}),
                files: Array.isArray(req.files) ? req.files.map(f => ({ fieldname: f.fieldname, originalname: f.originalname, mimetype: f.mimetype })) : Object.keys(req.files || {})
            });
            throw new ExpressError(400, errMsg);
        }
        else{
            next();
        }
    } catch (e) {
        console.error("Error during listing validation:", e && e.message, {
            bodyKeys: Object.keys(req.body || {}),
            files: Array.isArray(req.files) ? req.files.map(f => ({ fieldname: f.fieldname, originalname: f.originalname, mimetype: f.mimetype })) : Object.keys(req.files || {})
        });
        throw e;
    }
};


module.exports.validateStu_problem = (req, res, next)=>{
    let { error } = stu_problemSchema.validate(req.body);
    if ( error ){
        let errMsg = error.details.map((el) => el.message).join(",");
        throw new ExpressError(400, errMsg);
    }
    else{
        next();
    }
};