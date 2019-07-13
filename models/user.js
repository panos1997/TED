var mongoose = require("mongoose");
var passportLocalMongoose = require("passport-local-mongoose");


var userSchema = new mongoose.Schema({
	username: String,
	password: String,
	role: String,
	request: String,
	auctions : [
		type = mongoose.Schema.Types.ObjectId,
		ref = "Auction"
	]
});

userSchema.plugin(passportLocalMongoose);

var User = mongoose.model("User", userSchema);


module.exports = User;