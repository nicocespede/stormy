const mongoose = require('mongoose');
const { Schema } = mongoose;

const reqString = { type: String, required: true };

const schema = new Schema({
    _id: reqString,
    url: reqString
});

const name = 'playlist';

module.exports = mongoose.models[name] || mongoose.model(name, schema);