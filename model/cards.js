'use strict'
const mongoose = require("mongoose");
const uniqueValidator = require('mongoose-unique-validator');
const Schema = mongoose.Schema;

let CardsSchema = new Schema({
    userID: String,
    owner: String,
    card: {
        number: { type: String, unique: true },
        mes: String,
        ano: String,
        cvv: String

    },
    tested: { type: Boolean, default: false },
    valid: { type: Boolean, default: false },
    data: { type: Date, default: new Date() }

});
CardsSchema.plugin(uniqueValidator);
module.exports = mongoose.model("Cards", CardsSchema, "Cards");