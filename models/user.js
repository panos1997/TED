var mongoose = require("mongoose");
var passportLocalMongoose = require("passport-local-mongoose");


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


var userSchema = new mongoose.Schema({
	username: String,
	password: String,
	role: String,
	request: String,
	
	password_again: String,
	firstName: String,
	lastName: String,
	email: String,
	phone: Number,
	address: String,
	AFM:	Number,
	location: String,
	
	
	auctions : [
		type = mongoose.Schema.Types.ObjectId,
		ref = "Auction"
	],
	Bidder_Rating: Number,
	Seller_Rating: Number,
	Location: String,
	Country: String,
    chats : [ ChatSchema ]
    
});

userSchema.plugin(passportLocalMongoose);

var User = mongoose.model("User", userSchema);


module.exports = User;