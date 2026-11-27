// protection of DB password
require('dotenv').config();

let createError = require('http-errors');
let express = require('express');
let path = require('path');
let cookieParser = require('cookie-parser');
let logger = require('morgan');
let session = require('express-session');
let passport = require('passport');
let GoogleStrategy = require('passport-google-oauth20').Strategy;
let GitHubStrategy = require('passport-github2').Strategy;
let flash = require('connect-flash');
let indexRouter = require('../routes/index');
let usersRouter = require('../routes/users');
let workoutRouter = require('../routes/workout');
let authRouter = require('../routes/auth');

let app = express();


// mongo DB connection
const mongoose = require('mongoose');
let DB = require('./database');

mongoose.connect(DB.URI);

let mongoDB = mongoose.connection;

mongoDB.on('error', console.error.bind(console, 'Connection Error'));

mongoDB.once('open', () => {
    console.log('Connected to MongoDB Atlas');
});

// Session
app.use(session({
    secret: process.env.SESSION_SECRET,
    saveUninitialized: false,
    resave: false
}));

// Import user model
let userModel = require('../models/user');
let User = userModel.User;

// Google Authentication Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || "http://localhost:3000/auth/google/callback",
    state: true
},
async (accessToken, refreshToken, profile, done) => {
    try {
        let user = await User.findOne({
            provider: 'google',
            providerId: profile.id
        });

        if (!user) {
            user = await User.create({
                provider: 'google',
                providerId: profile.id,
                username: profile.displayName,
                displayName: profile.displayName,
                email: profile.emails?.[0]?.value || ''
            });
        }

        return done(null, user);

    } catch (err) {
        return done(err);
    }
}));

// GitHub Authentication Strategy
passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL:  process.env.GITHUB_CALLBACK_URL || "http://localhost:3000/auth/github/callback",
    state: true
},
async (accessToken, refreshToken, profile, done) => {
    try {
        let user = await User.findOne({
            provider: 'github',
            providerId: profile.id
        });

        if (!user) {
            user = await User.create({
                provider: 'github',
                providerId: profile.id,
                username: profile.username,
                displayName: profile.displayName || profile.username,
                email: profile.emails?.[0]?.value || ''
            });
        }

        return done(null, user);

    } catch (err) {
        return done(err);
    }
}));

// Serialize user information
passport.serializeUser((user, done) => {
    done(null, user._id);
});

// Deserialize user information
passport.deserializeUser(async (id, done) => {
    try {
        let user = await User.findById(id);
        done(null, user || false);
    } catch (err) {
        done(err);
    }
});

// Passport initialization
app.use(passport.initialize());
app.use(passport.session());

// Make authenticated user available to all EJS pages
app.use((req, res, next) => {
    res.locals.user = req.user || null;
    next();
});

// initialize flash
app.use(flash());

// view engine setup
app.set('views', path.join(__dirname, '../views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '../public')));
// Make Bootstrap files available
app.use('/bootstrap', express.static(path.join(__dirname, '../node_modules', 'bootstrap')));
// Make Font Awesome files available
app.use('/@fortawesome/fontawesome-free', express.static(path.join(__dirname, '../node_modules', '@fortawesome', 'fontawesome-free')));

app.use('/', indexRouter);
app.use('/workouts', workoutRouter);
app.use('/users', usersRouter);
app.use('/', authRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
