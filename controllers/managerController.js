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

// MANAGER ROUTES
router.get("/managerPage", authenticationMiddlewares.isLoggedIn, authenticationMiddlewares.managerIsAuthorised , function(req, res) {
	User.find({}, function(error, foundUsers) {
		res.render("managerPage.ejs", {foundUsers:foundUsers, currentUser:req.user, role: req.body.role});
	});
});


router.get("/managerPage/:userId", authenticationMiddlewares.isLoggedIn, authenticationMiddlewares.managerIsAuthorised , function(req, res) {
	User.findById({
		_id: req.params.userId
	}, function(error, foundUser) {
	  		res.render("userInfo.ejs", {user:foundUser, currentUser:req.user});
	});
});

router.get("/managerPage/:userId/approve", authenticationMiddlewares.isLoggedIn, authenticationMiddlewares.managerIsAuthorised , function(req, res) {
	User.findById({
		_id: req.params.userId
	}, function(error, foundUser) {
			foundUser.request = "approved";
			foundUser.save(function(error) {
				if(error) {
					console.log(error);
				}
			});
			res.redirect("back");
	});
});

router.get("/managerPage/:userId/disapprove", authenticationMiddlewares.isLoggedIn, authenticationMiddlewares.managerIsAuthorised , function(req, res) {
	User.findOneAndRemove({
		_id: req.params.userId
	}, function(error, foundUser) {
			res.redirect("/managerPage");
	});
});



router.get('/exportJSON', function(req, res) {
	Auction.find().lean().exec(function (err, auctions) {
			//var dateNow2 = dateNow.toString();
			const filePath = path.join(__dirname, "auctions" + new Date() + ".json")
	        fs.writeFile(filePath, JSON.stringify(auctions), function (err) {
	        if (err) {
	        	console.log(err);
	          return res.json(err).status(500);
	        }
	        else {
	          return res.download(filePath, function(error) {
		          //setTimeout(function () {
		            fs.unlinkSync(filePath); // delete this file after 30 seconds
		          //}, 30000);
	          });
	        }
	      });			
	});
});


router.get('/exportXML', function(req, res) {
	Auction.find().lean().exec(function (err, auctions) {
			//var dateNow2 = dateNow.toString();
			const filePath = path.join(__dirname, "auctions" + new Date() + ".xml")
	        fs.writeFile(filePath, json2xml(auctions), function (err) {
	        if (err) {
	          console.log(err);
	        }
	        else {
	          return res.download(filePath, function(error) {
		          //setTimeout(function () {
		            fs.unlinkSync(filePath); // delete this file after 30 seconds
		          //}, 30000);	          	
	          });
	        }
	      });			
	});
});





module.exports = router;