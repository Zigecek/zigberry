const mongoose = require("mongoose");

const logSchema = mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  date: Date,
  content: Object,
});

module.exports = mongoose.model("Log", logSchema, "logs");
