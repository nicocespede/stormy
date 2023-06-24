const mongoose = require('mongoose');
const { Schema } = mongoose;

const reqDate = { type: Date, required: false };
const reqObject = { type: Object, required: true };
const reqString = { type: String, required: true };

const schema = new Schema({
    id: { type: Number, required: true },
    senderId: reqString,
    sent: reqObject,
    counterpartyId: reqString,
    received: reqObject,
    status: reqString,
    creationDate: reqDate,
    completionDate: reqDate
});

const name = 'fwc-trade';

module.exports = mongoose.models[name] || mongoose.model(name, schema);