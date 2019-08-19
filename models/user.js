var mongoose = require("mongoose");
var passportLocalMongoose = require("passport-local-mongoose");
var ChatStuff = require("./chat.js");

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
    //chats : [ { chat: ChatStuff.ChatSchema, unread: Number } ]   
    chats: [   	
    	{
    		chat: {
    			type : mongoose.Schema.Types.ObjectId, ref : "Chat"
    		},
    		unread: Number	 
    	}
    ]
});

userSchema.plugin(passportLocalMongoose);

var User = mongoose.model("User", userSchema);


module.exports = User;