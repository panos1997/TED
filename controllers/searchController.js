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



router.get("/search", function(req, res) {
	res.redirect("/");
});


router.post("/search", function(req, res) {
	var auction = {};
	if(req.body.auction !== undefined) {
		if(req.body.auction.name !== undefined && req.body.auction.name.length !== 0) {
			var searchKey = new RegExp(req.body.auction.name, 'i');
			auction.name = searchKey;	
		}
		if(req.body.auction.category !== undefined && req.body.auction.category.length !== 0 ) {
			auction.category = req.body.auction.category;

		}
	}


	Auction.find( 
		auction
	, function(error, foundAuctions) {
		if(error) {
			console.log(error);
			res.redirect("/");
		}
		else {
			console.log(foundAuctions);
			res.render("auctionsSearched.ejs", {auctions: foundAuctions});
		}
	});
});


module.exports = router;