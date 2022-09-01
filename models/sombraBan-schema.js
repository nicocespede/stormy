const mongoose = require('mongoose');
const { Schema } = mongoose;

const schema = new Schema({
    reason: { type: String, required: false }
});

const name = 'sombraBan';

module.exports = mongoose.models[name] || mongoose.model(name, schema);