let express = require('express');
let router = express.Router();
let passport = require('passport');

// Login page
// Login User
router.get('/login', (req, res, next) => {
    if (!req.user) {
        res.render('Auth/login', {
            title: 'Login',
            message: req.flash('loginMessage'),
            displayName: ''
        });
    } else {
        return res.redirect('/');
    }
});
// Google authentication
router.get('/auth/google',
    passport.authenticate('google', {
        scope: ['profile', 'email']
    })
);

// Google callback
router.get('/auth/google/callback',
    passport.authenticate('google', {
        failureRedirect: '/login',
        successRedirect: '/'
    })
);

// GitHub authentication
router.get('/auth/github',
    passport.authenticate('github', {
        scope: ['user:email']
    })
);

// GitHub callback
router.get('/auth/github/callback',
    passport.authenticate('github', {
        failureRedirect: '/login',
        successRedirect: '/'
    })
);

// Logout
router.post('/logout', (req, res, next) => {
    req.logout((err) => {
        if (err) return next(err);
        res.redirect('/');
    });
});

module.exports = router;