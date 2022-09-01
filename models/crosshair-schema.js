const mongoose = require('mongoose');
const { Schema } = mongoose;

const reqString = { type: String, required: true };

const schema = new Schema({
    id: { type: Number, required: false },
    name: reqString,
    code: reqString,
    ownerId: reqString,
    imageUrl: { type: String, required: false }
});

const name = 'crosshair';

module.exports = mongoose.models[name] || mongoose.model(name, schema);