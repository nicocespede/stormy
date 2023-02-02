const mongoose = require('mongoose');
const { Schema } = mongoose;

const schema = new Schema({
    _id: { type: Number, required: true },
    name: { type: String, required: true },
    mode: { type: String, required: true }
});

const name = 'icon';

module.exports = mongoose.models[name] || mongoose.model(name, schema, name);