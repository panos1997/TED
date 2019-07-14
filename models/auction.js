var mongoose = require("mongoose");


var auctionSchema = new mongoose.Schema({
	name: String,
	category: String,
	Currently: Number,
	First_Bid: Number,
	user: [ 
			type = mongoose.Schema.Types.ObjectId,
			ref = "User"
	]
});


var Auction = mongoose.model("Auction", auctionSchema);

module.exports = Auction;