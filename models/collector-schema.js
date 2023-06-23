const mongoose = require('mongoose');
const { Schema } = mongoose;

const reqObject = { type: Object, required: true };
const reqString = { type: String, required: true };

const schema = new Schema({
    _id: reqString,
    achievements: reqObject,
    lastOpened: reqObject,
    membership: reqString,
    owned: reqObject,
    repeated: reqObject,
    timeout: { type: Date, required: false }
});

const name = 'fwc-collector';

module.exports = mongoose.models[name] || mongoose.model(name, schema);