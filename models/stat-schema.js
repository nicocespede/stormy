const mongoose = require('mongoose');
const { Schema } = mongoose;

const notReqNumber = { type: Number, required: false };

const schema = new Schema({
    _id: { type: String, required: true },
    seconds: notReqNumber,
    minutes: notReqNumber,
    hours: notReqNumber,
    days: notReqNumber
});

const name = 'stat';

module.exports = mongoose.models[name] || mongoose.model(name, schema);