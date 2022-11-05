const mongoose = require('mongoose');
const { Schema } = mongoose;

const schema = new Schema({
    _id: { type: String, required: true },
    filters: { type: Object, required: true },
    choices: { type: Object, required: false }
});

const name = 'filters';

module.exports = mongoose.models[name] || mongoose.model(name, schema, name);