'use strict'
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

let LogsSchema = new Schema({
	arq:String,
    type: String,
    msg: String,
    data: { type: Date, default: new Date() }
});
module.exports = mongoose.model("Logs", LogsSchema, "Logs");