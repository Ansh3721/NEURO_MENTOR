const  Listing  = require("../models/listing.js");

function buildListingViewModel(listing) {
    if (!listing) return null;
    const payload = listing.toObject ? listing.toObject() : { ...listing };
    payload.walletBalance = payload.walletBalance ?? 0;
    payload.bookingSummary = {
        upcomingSessions: payload.bookingSummary?.upcomingSessions ?? 0,
        completedSessions: payload.bookingSummary?.completedSessions ?? 0,
        cancelledSessions: payload.bookingSummary?.cancelledSessions ?? 0,
    };
    return payload;
}

function applyUploadedFiles(listing, files = {}) {
    const fileList = Array.isArray(files)
        ? files
        : Object.values(files || {}).flat();
    const profilePhoto = fileList.find((file) => file.fieldname === "listing[image]");
    if (profilePhoto) {
        listing.image = {
            url: profilePhoto.path,
            filename: profilePhoto.filename,
        };
    }

    const governmentId = fileList.find((file) => file.fieldname === "listing[governmentId]");
    if (governmentId) {
        listing.identityVerification = {
            ...(listing.identityVerification || {}),
            governmentId: {
                url: governmentId.path,
                filename: governmentId.filename,
            },
        };
    }

    return listing;
}

//index 
module.exports.index = async (req,res) => {
    let query = {};
    const searchVal = req.query.q ? req.query.q.trim() : "";
    if (searchVal) {
        query = {
            $or: [
                { name: { $regex: searchVal, $options: "i" } },
                { "subjects.name": { $regex: searchVal, $options: "i" } }
            ]
        };
    }
    const allListings = await Listing.find(query);
    res.render("listings/index.ejs", { allListings, searchVal });
};

//new
module.exports.new = (req,res)=>{
    res.render("listings/new.ejs");
};

//create
module.exports.create =  async (req, res) => {
    const listing = new Listing(req.body.listing);
    applyUploadedFiles(listing, req.files);
    listing.owner = req.user._id;
    await listing.save();
    req.flash("success","New educator profile added!!");
    res.redirect("/listings");
};


//show
module.exports.show = async (req,res) =>{
    const id = req.params.id;
    const listing = await Listing.findById(id).populate("stu_problems").populate("owner");
    if(! listing){
        req.flash("error","student does not exist!!");
        return res.redirect("/listings");
    }
    res.render("listings/show.ejs",{listing: buildListingViewModel(listing)});
};

//edit
module.exports.edit = async(req,res)=>{
    const id = req.params.id;
    const listing = await Listing.findById(id);
    res.render("listings/edit.ejs",{listing});
};

//update
module.exports.update = async (req,res)=>{
    const {id} = req.params;
    let listing = await Listing.findByIdAndUpdate(id,{...req.body.listing});
    if (listing) {
        applyUploadedFiles(listing, req.files);
        await listing.save();
    }
    req.flash("success","Educator profile updated!!");
    res.redirect(`/listings/${id}`);
};

//delete
module.exports.delete = async (req,res) =>{
    const id = req.params.id;
    await Listing.findByIdAndDelete(id);
    req.flash("success","student Deleted!!");
    res.redirect("/listings");
};