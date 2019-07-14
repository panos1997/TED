var mongoose = require("mongoose");

var bidSchema = new mongoose.Schema({
	amount: Number,
	auction: [
		type = mongoose.Schema.Types.ObjectId,
		ref = "Auction"
	],
	bidder: [
		type = mongoose.Schema.Types.ObjectId,
		ref = "User"
	]
});


var Bid = mongoose.model("Bid", bidSchema);

module.exports = Bid;