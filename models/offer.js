var mongoose = require("mongoose");

var offerSchema = new mongoose.Schema({
	amount: Number,
	auction: [
		type = mongoose.Schema.Types.ObjectId,
		ref = "Auction"
	],
	user: [
		type = mongoose.Schema.Types.ObjectId,
		ref = "User"
	]
});


var Offer = mongoose.model("Offer", offerSchema);

module.exports = Offer;