const mongoose = require('mongoose');
const { Schema } = mongoose;

const reqString = { type: String, required: true };

const schema = new Schema({
    _id: reqString,
    tag: reqString,
    reason: { type: String, required: false },
    responsibleId: reqString,
    character: reqString
});

const name = 'ban';

module.exports = mongoose.models[name] || mongoose.model(name, schema);