let mongoose = require('mongoose');

let User = mongoose.Schema({
    provider: {
        type: String,
        required: true,
        enum: ['google', 'github']
    },
    providerId: {
        type: String,
        required: true
    },
    username: {
        type: String,
        default: "",
        trim: true
    },
    displayName: {
        type: String,
        default: "",
        trim: true
    },
    email: {
        type: String,
        default: ""
    },
    created: {
        type: Date,
        default: Date.now
    },
    updated: {
        type: Date,
        default: Date.now
    }
},
{
    collection: 'oauth_users'
});

User.index(
    { provider: 1, providerId: 1 },
    { unique: true }
);

module.exports.User = mongoose.model('OAuthUser', User);