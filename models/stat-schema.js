const mongoose = require('mongoose');
const { Schema } = mongoose;

const reqNumber = { type: Number, required: true };

const schema = new Schema({
    _id: { type: String, required: true },
    seconds: reqNumber,
    minutes: reqNumber,
    hours: reqNumber,
    days: reqNumber
});

const name = 'stat';

module.exports = mongoose.models[name] || mongoose.model(name, schema);