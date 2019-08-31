var express = require("express");
var mongoose = require("mongoose");
var passport = require("passport");
var ChatStuff = require("../models/chat.js");
var Chat = ChatStuff.Chat;
var User = require("../models/user.js");
var Auction = require("../models/auction.js");
var Bid = require("../models/bid.js");
var LocalStrategy = require("passport-local");
var methodOverride = require("method-override");
var passportLocalMongoose = require("passport-local-mongoose");
var bodyParser = require("body-parser");
var flash = require("connect-flash");
var https = require('https');
var fs = require('fs');
var dateFormat = require('dateformat');
var request=require('request');
var findOrCreate = require('mongoose-find-or-create');
var ObjectId = require('mongodb').ObjectID;
var path = require('path');
var json2xml = require('json2xml');
var authenticationMiddlewares = require("../middlewares/authenticationMiddlewares.js");

var roles = ["manager", "seller", "bidder"];
var categories = ["Home & Garden", "Fashion", "Health","Sports","Books","Games & Consoles","Toys","Electronics","Art","Properties"];


var router = express.Router();
router.use(bodyParser.urlencoded({extended: true}));




// BIDDER ROUTES
router.get("/bids", authenticationMiddlewares.isLoggedIn, function(req, res) {
	var counter=0;
	bidsAuctions = [];
	Bid.find({
		bidder: req.user._id
	}, function(error, foundBids) {
			if(error) {
				console.log(error);
			}
			if(foundBids.length>0){
				foundBids.forEach(function(bid) {
					Auction.findById( {
						_id: bid.auction[0]._id
					},function(error, foundAuction) {
						if(error) {
							console.log(error);
						}
						bidsAuctions.push({
							bid: bid,
							auction: foundAuction
						});
						counter++;
						if(counter==foundBids.length){ //render afou exei teleiwsei i foreach gia ola ta bids
							console.log(bidsAuctions);
							res.render("bids.ejs", {bidsAuctions:bidsAuctions});
						}
					});
				});
	  	}else{
				res.send("you don't have any bids yet");
			}
	});
});


router.get("/categories", function(req, res) {
	Auction.find({}, function(error, foundAuctions) {
		if(error) {
			console.log(error);
		}
		console.log(foundAuctions);
		res.render("categories.ejs", {auctions: foundAuctions, categories: categories});
	});
});

router.get("/categories/:category", function(req, res) {
	Auction.find({

	}, function(error, foundAuctions) {
		if(error) {
			console.log(error);
		}
		else {
			res.render("auctionsInCategory.ejs", { category: req.params.category, auctions: foundAuctions});
		}
	});
});

router.get("/categories/:category/:auctionId", function(req, res) {
	Auction.findById({
		_id: req.params.auctionId
	}, function(error, foundAuction) {
		if(error){
			console.log(error);
		} else {
			 loc=foundAuction.Location+" "+foundAuction.Country;
			 console.log(loc);
			 request('http://open.mapquestapi.com/nominatim/v1/search.php?key=npTGy9v8vWCuVONwdcPe3qJy27GW18Gt&format=json&q='+loc+'&addressdetails=1&limit=3&viewbox=-1.99%2C52.02%2C0.78%2C50.94&exclude_place_ids=41697'
			 ,function(err,response,body){ //request sto nominatim api gia ta coordinates
				 if(error){
					 console.log(err);
				 }else{
						 var parsedData=JSON.parse(body); //parse to string se object
						 var lat=parsedData[0].lat;
			 	 		 var lng=parsedData[0].lon;
						 res.render("auctionInfo.ejs", {auction: foundAuction, category: req.params.category,latitude:lat,longitude:lng});
				 }
			 });
		}
	})
});


router.get("/categories/:category/:auctionId/makeBid", authenticationMiddlewares.isLoggedIn, function(req, res) {
	Auction.findById({
		_id: req.params.auctionId
	}, function(error, foundAuction) {
			res.render("makeBid.ejs", {auction: foundAuction});
	});
});

router.get("/categories/:category/:auctionId/buyNow", authenticationMiddlewares.isLoggedIn, function(req,res){
	Auction.findById({
		_id: req.params.auctionId
	}, function(error, foundAuction){
		res.render("buyNow.ejs",{auction: foundAuction});
	});
});

router.get("/categories/:category/:auctionId/confirmBid", authenticationMiddlewares.isLoggedIn, function(req, res) {
	Auction.findById({
		_id: req.params.auctionId
	}, function(error, foundAuction) {
			res.render("confirmBid.ejs", {auction: foundAuction, amount: req.query.amount});
	});
});

router.get("/categories/:category/:auctionId/confirmBuy", authenticationMiddlewares.isLoggedIn, function(req, res) {
	Auction.findById({
		_id: req.params.auctionId
	}, function(error, foundAuction) {
			res.render("confirmBuy.ejs", {auction: foundAuction});
	});
});

router.post("/categories/:category/:auctionId/makeBid", authenticationMiddlewares.isLoggedIn, function(req, res) {
	Bid.remove({ $and: [ { bidder: req.user._id }, { auction:  req.params.auctionId  } ] },function(err,removedbid){
		if(err) //diagrafoume proigoumeno bid tou xristi sto auction,an upirxe
			console.log("failed to remove the previous bid,or there was none\n");

	Bid.create({
		amount: req.query.amount,
		time: new Date()
	}, function(error, createdBid) {
		if(error) {
			console.log(error);
		}
		User.findById({
			_id: req.user._id
		}, function(error, foundUser) {
				if(error) {
					console.log(error);
				}
				createdBid.bidder.push(foundUser);
				Auction.findById({
					_id: req.params.auctionId
				}, function( error, foundAuction) {
						if(error) {
							console.log(error)
						}

						foundAuction.bids.push(createdBid);
						foundAuction.Number_of_bids = foundAuction.Number_of_bids + 1;
						if(req.query.amount > foundAuction.Currently){
							foundAuction.Currently = req.query.amount;}
						foundAuction.save( function(error, data) {
							if(error) {
								console.log(error);
							}
						});
						createdBid.auction.push(foundAuction);
						createdBid.save( function(error, data) {
							if(error) {
								console.log(error);
							}
						});
				})
		})

	})
	})
	res.render("succes_bid.ejs");
});
router.post("/categories/:category/:auctionId/makeBuy", authenticationMiddlewares.isLoggedIn, function(req, res) {
	Bid.remove({ $and: [ { bidder: req.user._id }, { auction:  req.params.auctionId  } ] },function(err,removedbid){
		if(err) //diagrafoume proigoumeno bid tou xristi sto auction,an upirxe
			console.log("failed to remove the previous bid,or there was none\n");
	Bid.create({
		amount: req.query.amount,
		time: new Date()
	}, function(error, createdBid) {
		if(error) {
			console.log(error);
		}
		User.findById({
			_id: req.user._id
		}, function(error, foundUser) {
				if(error) {
					console.log(error);
				}
				createdBid.bidder.push(foundUser);
				Auction.findById({
					_id: req.params.auctionId
				}, function( error, foundAuction) {
						if(error) {
							console.log(error)
						}
						foundAuction.Currently=req.query.amount; //currently = buy price
						foundAuction.Ends=new Date(); //telos to auction timer
						foundAuction.bids.push(createdBid);
						foundAuction.Number_of_bids = foundAuction.Number_of_bids + 1;
						foundAuction.save( function(error, data) {
							if(error) {
								console.log(error);
							}
						});
						createdBid.auction.push(foundAuction);
						createdBid.save( function(error, data) {
							if(error) {
								console.log(error);
							}
						});

				})
		})

	})
	})
	res.render("successBuy.ejs");
});







module.exports = router;