if(process.env.NODE_ENV != "production") {
    require("dotenv").config();
}

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");//for ejs setup
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const ExpressError = require("./utils/expressError.js");
const session  =  require("express-session");
const mongoStore = require('connect-mongo');
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");//hashing algorithm used=pbkdf2
const User = require("./models/user.js");

const listingRouter = require("./routes/listing.js");
const reviewRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");

const dbUrl = process.env.ATLASDB_URL;

main().then(()=>{
    console.log("connected to database");
}).catch((err)=>{
    console.log(err);
});

async function main() {
    await mongoose.connect(dbUrl);
}

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({extended:true}));//to parse request data
app.use(methodOverride("_method"));
app.engine('ejs', ejsMate);
app.use(express.static(path.join(__dirname,"/public")));

const store = mongoStore.create({
    mongoUrl: dbUrl,
    crypto: {
        secret:process.env.SECRET,
    },
    touchAfter: 24*3600,
});

store.on("error", ()=> {
    console.log("ERROR IN MONGO SESSION STORE", err);
})

const sessionOptions = {
    store,
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
        expires: Date.now() + 7*24*60*60*1000,//1 week expirey
        maxAge: 7*24*60*60*1000 ,
        httpOnly: true
    }
};

//home route
// app.get("/", (req,res)=>{
//     res.send("i am root");
// });

app.use(session(sessionOptions));
app.use(flash());

//using passport after session to identify users as they browse from page to page
app.use(passport.initialize());//initializatin
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

//use static serialize and deserialize of model for passport session support
passport.serializeUser(User.serializeUser());//storing user related info
passport.deserializeUser(User.deserializeUser());//unstoring user related info

//middleware for flash connection
app.use((req,res,next) => {
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currUser = req.user;
    next();
});

//creating a demo user
// app.get("/demouser", async (req,res) => {
//     let fakeUser = new User({
//         email: "student@gmail.com",
//         username: "delta-student"
//     });
//     //storing user
//     let registeredUser = await User.register(fakeUser, "helloworld");//register method password=helloworld
//     res.send(registeredUser);
// })

//listing routes
app.use("/listings", listingRouter);

//review routes
app.use("/listings/:id/reviews", reviewRouter)

//user routes
app.use("/", userRouter);

app.all("*",(req, res, next)=>{
    next(new ExpressError(404,"Page Not Found"));
});

//middleware
app.use((err, req, res, next)=>{
    const {statusCode = 500, message ="something went wrong..." } = err;
    // console.error(err);
    res.status(statusCode).render("error", {err});
    //res.status(statusCode).send(message);
});

app.listen(8080,()=>{
    console.log("server is listening to port 8080");
});