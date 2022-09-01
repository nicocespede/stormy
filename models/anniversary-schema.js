const mongoose = require('mongoose');
const { Schema } = mongoose;

const reqString = { type: String, required: true };

const schema = new Schema({
    id1: reqString,
    id2: reqString,
    date: reqString,
    flag: Boolean
});

const name = 'anniversary';

module.exports = mongoose.models[name] || mongoose.model(name, schema, 'anniversaries');