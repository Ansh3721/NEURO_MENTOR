const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const  Listing  = require("../models/listing.js");
const multer = require("multer");
const qs = require("qs");
const {storage} = require("../cloudconfig.js");
const allowedImageMimeTypes = new Set(["image/jpeg", "image/jpg", "image/png"]);

const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        const mimeType = (file.mimetype || "").toLowerCase();
        if (allowedImageMimeTypes.has(mimeType)) {
            return cb(null, true);
        }

        const error = new Error("Only image files (JPG, JPEG, PNG) are allowed for profile photo and verification document uploads.");
        error.statusCode = 400;
        return cb(error);
    },
});

const uploadListingFiles = upload.fields([
    { name: "listing[image]", maxCount: 1 },
    { name: "listing[governmentId]", maxCount: 1 },
]);

function normalizeMultipartBody(req, res, next) {
    const contentType = req.headers["content-type"] || "";
    if (!contentType.includes("multipart/form-data") || !req.body || req.body.listing) {
        return next();
    }

    const encoded = Object.entries(req.body)
        .flatMap(([key, value]) => {
            if (Array.isArray(value)) {
                return value.map((item) => `${encodeURIComponent(key)}=${encodeURIComponent(item)}`);
            }
            return `${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
        })
        .join("&");

    req.body = qs.parse(encoded);
    return next();
}
const {isLoggedIn , isOwner ,validateListing} = require("../middleware.js")

const listingController = require("../controllers/listing.js");



//Index Route
router.get("/",wrapAsync(listingController.index));

//New Route
router.get(
    "/new",
    isLoggedIn ,
    listingController.new
    );

//Create Route
router.post(
    "/",
    isLoggedIn,
    uploadListingFiles,
    normalizeMultipartBody,
    validateListing,
    wrapAsync (listingController.create)
);

// Show Route
router.get(
    "/:id",
    wrapAsync(listingController.show)
);

//Edit Route
router.get(
    "/:id/edit",
    isLoggedIn,
    isOwner,
    wrapAsync(listingController.edit)
);

//Update Route
router.put(
    "/:id",
    isLoggedIn,
    isOwner,
    uploadListingFiles,
    normalizeMultipartBody,
    validateListing,
    wrapAsync(listingController.update)
);

//Delete Route
router.delete(
    "/:id",
    isLoggedIn,
    isOwner,
    wrapAsync (listingController.delete)
);

module.exports = router;
