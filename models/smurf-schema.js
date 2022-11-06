const mongoose = require('mongoose');
const { Schema } = mongoose;

const reqString = { type: String, required: true };

const schema = new Schema({
    _id: reqString,
    name: reqString,
    user: reqString,
    password: reqString,
    vip: { type: Boolean, required: true },
    bannedUntil: { type: Date, required: false }
});

const name = 'smurf';

module.exports = mongoose.models[name] || mongoose.model(name, schema, 'smurfs');