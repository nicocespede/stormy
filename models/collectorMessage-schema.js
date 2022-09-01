const mongoose = require('mongoose');
const { Schema } = mongoose;

const reqString = { type: String, required: true };

const schema = new Schema({
    _id: reqString,
    messageId: reqString,
    channelId: reqString,
    isActive: { type: Boolean, required: true }
});

const name = 'collectorMessage';

module.exports = mongoose.models[name] || mongoose.model(name, schema);