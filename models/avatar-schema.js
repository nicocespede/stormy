const mongoose = require('mongoose');
const { Schema } = mongoose;

const schema = new Schema({
    _id: { type: Number, required: true },
    url: { type: String, required: true }
});

const name = 'avatar';

module.exports = mongoose.models[name] || mongoose.model(name, schema, name);