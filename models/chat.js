var mongoose = require("mongoose");
var findOrCreate = require('mongoose-find-or-create');

var ChatSchema = new mongoose.Schema({
  messages : [{
    sender: {type: mongoose.Schema.Types.ObjectId, ref: "User" },
    receiver: {type: mongoose.Schema.Types.ObjectId, ref: "User" },
    content: {type: String},
    date: {type:Date}
  }]
});

ChatSchema.plugin(findOrCreate);

module.exports = mongoose.model("Chat", ChatSchema);