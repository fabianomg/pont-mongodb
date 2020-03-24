'use strict'
const mongoose = require("mongoose");
//const uniqueValidator = require('mongoose-unique-validator');
const Schema = mongoose.Schema;

let CardsBeingTestedSchema = new Schema({
    userID: String,
    owner: String,
    card: {
        number: { type: String },
        mes: String,
        ano: String,
        cvv: String

    },
    valid: { type: Boolean, default: false },
    data: { type: Date, default: new Date() }

});
//CardsSchema.plugin(uniqueValidator);
module.exports = mongoose.model("CardsBeingTested", CardsBeingTestedSchema, "CardsBeingTested");