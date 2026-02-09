// Updated UserSchema
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    // other fields
    referralCode: { type: String, sparse: true },
    referralLink: { type: String, sparse: true }
});

module.exports = mongoose.model('User', UserSchema);