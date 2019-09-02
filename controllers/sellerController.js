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





// SELLER ROUTES
router.get("/auctions", authenticationMiddlewares.isLoggedIn, function(req, res) {
	Auction.find({
		seller: req.user._id,
	}, function(error, foundAuctions) {
		    if(error) {
		    	console.log(error);
		    	res.redirect("/login");
		    }
		    else {
 				res.render("auctions.ejs", {currentUser:req.user, auctions:foundAuctions});
		    }
	});
});

router.get("/auctions/:id/showBids", authenticationMiddlewares.isLoggedIn , function(req, res) {
	bidsUsers=[];
	counter=0;
	Auction.findById({
		 seller: req.user._id,
		 _id: req.params.id
	}, function(error, foundAuction) {
			Bid.find({
				auction: foundAuction
			}, function(error, foundBids) {
			    if(error) {
			    	console.log(error);
			    	res.redirect("/login");
			    }
			    //	res.render("showBids.ejs", {currentUser:req.user, bids:foundBids});
						//console.log(foundBids[0].bidder);
						if(foundBids.length==0) //an den uparxoun bids gurname apeu8eias keno array
						 res.render("showBids.ejs", {currentUser:req.user, bidsUsers:bidsUsers});
							foundBids.forEach(function(bid) {
								User.findById( {
									_id: bid.bidder[0]._id
								},function(error, foundUser) {
									if(error) {
										console.log(error);
									}
									bidsUsers.push({
										bid: bid,
										user: foundUser
									});
									counter++;
									if(counter==foundBids.length){ //render afou exei teleiwsei i foreach gia ola ta bids
										console.log(bidsUsers);
										res.render("showBids.ejs", {currentUser:req.user, bidsUsers:bidsUsers});
									}
								});
							});
	});
});
});





/////////
/////////
// Edit , update , delete	auction 	/////////////////////////////////////

//edit
router.get("/auctions/:id/editAuction", authenticationMiddlewares.isLoggedIn , function(req, res) {
	Auction.findById({
		 seller: req.user._id,
		 _id: req.params.id
	}, function(error, foundAuction) {
		if(error){
			console.log(error);
			res.redirect("/auctions");
		} else {
			res.render("editAuction.ejs", {currentUser:req.user, auction:foundAuction});
		}
	});
});


//update
router.put("/auctions/:id", authenticationMiddlewares.isLoggedIn , function(req, res){

	Auction.findByIdAndUpdate({
		seller: req.user._id,
		 _id: req.params.id
	}, req.body.auction, function(error, updatedAuction){
		if(error){
			console.log(error);
			res.redirect("/auctions");
		} else {
			res.redirect("/auctions");
		}
	});
});


// remove  auction     /////////////////
router.delete("/auctions/:id", authenticationMiddlewares.isLoggedIn, function(req, res){
	Auction.findByIdAndRemove({
		  seller: req.user._id,
		 _id: req.params.id
	},function(error){
		if(error){
			console.log(error);
			res.redirect("/auctions");
		} else {
			res.redirect("/auctions");
		}
	});
});



////////////////////////////////////////////////////////










router.get("/auctions/new", authenticationMiddlewares.isLoggedIn, function(req, res) {
	User.findById({
		 _id: req.user._id
	}, function(error, foundUser) {
		    if(error) {
		    	console.log(error);
		    	res.redirect("/login");
		    }
		    else {
		    	res.render("newAuction.ejs", {currentUser: foundUser});
		    }
	});
});




function take_id(){
	var time =  new Date().getTime();
	var a = parseInt(time, 10);
	a = a + 1;
	return a;
}

router.post("/auctions", authenticationMiddlewares.isLoggedIn, function(req, res) {
	var now = new Date();
	var date = dateFormat(now, "dddd, mmmm dS, yyyy, h:MM:ss TT");


	Auction.create({
		name: 		req.body.name,
		category: 	req.body.category,
		First_Bid: 	req.body.First_Bid,
		Currently: 	req.body.First_Bid,
		Buy_Price: 	req.body.Buy_Price,
		Number_of_bids: 0,
		Started:	 new Date(req.body.Started),	//////////

		Ends: 		 new Date(req.body.Ends),
		ItemId:	  	 take_id(),
		Location: 	 req.body.Location,
		Country:  	 req.body.Country,
		Description: req.body.Description,
		Image:		 req.body.Image


	}, function(error, newAuction) {
			if(error) {
				console.log(error);
			}
			User.findById({
				_id: req.user._id
			}, function(error, foundUser) {
				foundUser.auctions.push(newAuction);
				foundUser.save( function(error, data) {
					console.log("data is : " + data);
				});

				newAuction.seller.push(foundUser);
				newAuction.save( function(error, data) {
					console.log("data is : " + data);
				});
			});
	});
	res.redirect("/auctions");
});


module.exports = router;
