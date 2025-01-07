const express = require("express");
const router = express.Router({ mergeParams: true });//merging parameters child to parent
const wrapAsync = require("../utils/wrapAsync.js");//function that returns a function for performing error handling
const Review = require("../models/review.js");
const Listing = require("../models/listing.js")
const { validateReview, isLoggedIn, isReviewAuthor } = require("../middleware.js");
const reviewController = require("../controllers/reviews.js");

//Post review Route
router.post("/", isLoggedIn, validateReview, wrapAsync(reviewController.createReview));

//delete review route
router.delete("/:reviewId",
    isLoggedIn,
    isReviewAuthor,
    wrapAsync(reviewController.destroyReview))

module.exports = router;