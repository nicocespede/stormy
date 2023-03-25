const mongoose = require('mongoose');
const { Schema } = mongoose;

const reqObject = { type: Object, required: true };

const schema = new Schema({
    _id: { type: String, required: true },
    achievements: reqObject,
    trades: { type: Number, required: true },
    lastOpened: reqObject,
    owned: reqObject,
    repeated: reqObject,
    timeout: { type: Date, required: false }
});

const name = 'collector';

module.exports = mongoose.models[name] || mongoose.model(name, schema);