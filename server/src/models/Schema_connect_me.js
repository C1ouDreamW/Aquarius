const express = require("express");
const mongoose = require("mongoose");


const connect_me = new mongoose.Schema({
  name: String,
  email: String,
  message: String,
  date: { type: Date, default: Date.now },
})

module.exports = mongoose.model('connect_me', connect_me, 'heycloudream');