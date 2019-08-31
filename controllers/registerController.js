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




// sign up routes
router.get("/register", function(req, res) {
	res.render("register.ejs");
});

router.post("/register", function(req, res) {
	/////////////////////// edw prosthes auto to if////// an oi kwdikoi password kai password_again einai diaforetikoi tote se petaei se selida sfalmatos
	if(req.body.password !== req.body.password_again){
		//console.log("Ta password me to password_again einai diaforetika");
		return res.render("user_exists.ejs");
	}
	////////////////////////////////////////


	if(req.body.role === "manager") {
		var newUser = new User({username: req.body.username,
								password_again: req.body.password_again,
								role: req.body.role,
								request: "approved",

								firstName: req.body.firstName,
								lastName: req.body.lastName,
								email: req.body.email,
								phone: req.body.phone,
								address: req.body.address,
								AFM:	req.body.AFM,
								location: req.body.location
							});
		User.register(newUser , req.body.password, function(err, user) {
			if(err) {
				console.log("error is: " + err);
				//return res.render("user_exist.ejs");///// mallon auto xreiazetai kai oxi to apo katw
				res.render("register.ejs");
			}
																			// if the registration of the user is done correctly
			passport.authenticate("local")(req, res , function() { 	// we authenticate the user (here we use the 'local' strategy)
				return res.redirect('/managerPage/' + req.user._id);												// but there are 300 strategies (px twitter, facebook klp)
			});
		});
	}


	var newUser = new User({username: req.body.username,
							password_again: req.body.password_again,
							role: req.body.role,
							request: "pending",

							firstName: req.body.firstName,
							lastName: req.body.lastName,
							email: req.body.email,
							phone: req.body.phone,
							address: req.body.address,
							AFM:	req.body.AFM,
							location: req.body.location
						});

	User.register(newUser, req.body.password, function(err, user) {
		if(err) {
			console.log("error is: " + err);
			return res.render("user_exists.ejs");
			//res.render("register.ejs");
		}
																		// if the registration of the user is done correctly
		passport.authenticate("local")(req, res , function() { 	// we authenticate the user (here we use the 'local' strategy)
			res.redirect("/pendingRequestMessage");												// but there are 300 strategies (px twitter, facebook klp)
		});
	});
});




module.exports = router;