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


//MIDDLEWARES
module.exports = {
	isLoggedIn: function isLoggedIn(req, res, next) {
		if(req.isAuthenticated()) {
			return next();
		}
		res.redirect("/login");
	},

	managerIsAuthorised: function managerIsAuthorised (req, res, next) {
		User.findById({
			_id : req.user._id
		}, function(error, foundUser) {
			if(error) {
				console.log(error);
				res.redirect("/login");
			}
			if(foundUser.role === "manager") {
				console.log("He is a manager");
				return next();
			}
			else {
				res.redirect("/login");
			}
		});
	}

}

