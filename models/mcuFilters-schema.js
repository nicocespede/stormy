const mongoose = require('mongoose');
const { Schema } = mongoose;

const schema = new Schema({
    _id: { type: Number, required: true },
    filters: { type: Object, required: true }
});

const name = 'mcuFilters';

module.exports = mongoose.models[name] || mongoose.model(name, schema, name);