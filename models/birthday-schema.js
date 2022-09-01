const mongoose = require('mongoose');
const { Schema } = mongoose;

const reqString = { type: String, required: true };

const schema = new Schema({
    _id: reqString,
    username: reqString,
    day: reqString,
    month: reqString,
    flag: { type: Boolean, required: true }
});

const name = 'birthday';

module.exports = mongoose.models[name] || mongoose.model(name, schema);