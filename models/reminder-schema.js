const mongoose = require('mongoose');
const { Schema } = mongoose;

const reqString = { type: String, required: true };

const schema = new Schema({
    description: reqString,
    userId: reqString,
    date: Date
}, {
    timestamps: true
});

const name = 'reminder';

module.exports = mongoose.models[name] || mongoose.model(name, schema);