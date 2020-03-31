"use strict";
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

let CardsSchema = new Schema({
  id: String,
  valid: Boolean,
  card: {
    number: { type: String, unique: true },
    mes: String,
    ano: String,
    cvv: String
  },
  created_at: { type: Date, default: new Date() }
});
module.exports = mongoose.model("Cards", CardsSchema, "Cards");
