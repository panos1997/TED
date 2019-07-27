var mongoose = require("mongoose");
var passportLocalMongoose = require("passport-local-mongoose");


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
	Country: String
});

userSchema.plugin(passportLocalMongoose);

var User = mongoose.model("User", userSchema);


module.exports = User;