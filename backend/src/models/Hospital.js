// src/models/Hospital.js
const mongoose = require("mongoose");

const hospitalSchema = new mongoose.Schema({
  name: String,
  address: String,
  location: {
    lat: Number,
    lng: Number
  }
});

module.exports = mongoose.model("Hospital", hospitalSchema);
