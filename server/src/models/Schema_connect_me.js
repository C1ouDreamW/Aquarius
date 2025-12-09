const express = require("express");
const mongoose = require("mongoose");


const connect_me = new mongoose.Schema({
  name: String,
  email: String,
  message: String,
  date: { type: Date, default: Date.now },
})

const heyDb = mongoose.connection.useDb('heycloudream');
module.exports = heyDb.model('connect_me', connect_me, 'connect_me');