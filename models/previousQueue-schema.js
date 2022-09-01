const mongoose = require('mongoose');
const { Schema } = mongoose;

const reqObject = { type: Object, required: true };
const reqString = { type: String, required: true };

const schema = new Schema({
    current: reqObject,
    guildId: reqString,
    metadataId: reqString,
    previousTracks: reqObject,
    tracks: reqObject,
    voiceChannelId: reqString
});

const name = 'previousQueue';

module.exports = mongoose.models[name] || mongoose.model(name, schema, name);