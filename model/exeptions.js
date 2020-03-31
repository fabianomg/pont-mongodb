"use strict";
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

let ExeptionsSchema = new Schema({
  user: String,
  msg: String,
  created_at: { type: Date, default: new Date() }
});
module.exports = mongoose.model("Exceptions", ExeptionsSchema, "exeptions");
