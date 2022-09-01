const mongoose = require('mongoose');
const { Schema } = mongoose;

const schema = new Schema({
    _id: { type: String, required: true },
    data: { type: Object, required: true }
});

const name = 'moviesAndGames';

module.exports = mongoose.models[name] || mongoose.model(name, schema, name);