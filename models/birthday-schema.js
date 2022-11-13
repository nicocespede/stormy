const mongoose = require('mongoose');
const { Schema } = mongoose;

const reqString = { type: String, required: true };

const schema = new Schema({
    _id: reqString,
    username: reqString,
    date: { type: Date, required: true }
});

const name = 'birthday';

module.exports = mongoose.models[name] || mongoose.model(name, schema);