const mongoose = require('mongoose');
const { Schema } = mongoose;

const reqString = { type: String, required: true };

const schema = new Schema({
    _id: reqString,
    date: reqString
});

const name = 'thermalPasteDate';

module.exports = mongoose.models[name] || mongoose.model(name, schema);