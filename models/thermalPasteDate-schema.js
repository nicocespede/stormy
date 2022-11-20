const mongoose = require('mongoose');
const { Schema } = mongoose;

const schema = new Schema({
    _id: { type: String, required: true },
    date: { type: Date, required: true }
});

const name = 'thermalPasteDate';

module.exports = mongoose.models[name] || mongoose.model(name, schema);