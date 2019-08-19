var mongoose = require("mongoose");
var findOrCreate = require('mongoose-find-or-create');



var ChatSchema = new mongoose.Schema({
  messages : [{
    sender: {type: mongoose.Schema.Types.ObjectId, ref: "User" },
    receiver: {type: mongoose.Schema.Types.ObjectId, ref: "User" },
    content: String,
    date: Date,
  }]
});

ChatSchema.plugin(findOrCreate);


var Chat = mongoose.model("Chat", ChatSchema);

module.exports = {
	Chat:Chat,
	ChatSchema: ChatSchema
}