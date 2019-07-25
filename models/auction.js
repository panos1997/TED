var mongoose = require("mongoose");


var auctionSchema = new mongoose.Schema({
	name: String,
	category: String,
	Currently: Number,
	First_Bid: Number,
	
	ItemId:	Number,
	Location: String,
	Country: String,
	Image:	String,
	
	
	bids: [
		type = mongoose.Schema.Types.ObjectId,
		ref = "Bid"
	],
	seller: [
		type = mongoose.Schema.Types.ObjectId,
		ref = "User"
	],
	Buy_Price: Number,
	Number_of_bids: Number,
	Started: Date,
	Ends: Date,
	Description: String
});


var Auction = mongoose.model("Auction", auctionSchema);

module.exports = Auction;