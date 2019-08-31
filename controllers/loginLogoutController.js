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



// login routes
router.get("/login/request_approved", function(req, res){
	res.render("request_approved.ejs");
});


router.get("/login", function(req, res) {
	res.render("login.ejs", { currentUser: req.user });
});

router.post("/login", passport.authenticate("local", {
	failureRedirect:"/login",
	failureFlash: true
}), function(req, res, next) {
	User.find({username: req.body.username}, function(error, foundUsers) {
		if(error) {
			console.log(error);
		}
		if(foundUsers[0].request === "pending") {
			//res.send("your request has not been approved yet,sorry");
			res.render("request_approved.ejs");				// prosthesa auto
			return;
		}
	});
	passport.authenticate("local", function(error, user){
		req.logIn(user, function(err) {
      		if (err) {
      			return next(err);
      		}
      		if(user.role == "manager") {
      			return res.redirect('/managerPage');
      		}
      		else
      			return res.redirect('/');
    	});
	})(req, res, next);
}
);

router.get("/pendingRequestMessage", authenticationMiddlewares.isLoggedIn, function(req ,res) {
	res.render("pendingRequestMessage.ejs", {currentUser:req.user} );
});

// logout route
router.get("/logout", function(req ,res) {
	req.logout();
	res.redirect("/");
});






module.exports = router;