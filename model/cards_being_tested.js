'use strict'
const mongoose = require("mongoose");
//const uniqueValidator = require('mongoose-unique-validator');
const Schema = mongoose.Schema;

let CardsBeingTestedSchema = new Schema({
    userid: String,
    card: String,
    status:String
    

});
//CardsSchema.plugin(uniqueValidator);
module.exports = mongoose.model("CardsBeingTested", CardsBeingTestedSchema, "CardsBeingTested");