var express = require("express");
var mongoose = require("mongoose");
var passport = require("passport");
var ChatStuff = require("./models/chat.js");
var Chat = ChatStuff.Chat;
var User = require("./models/user.js");
var Auction = require("./models/auction.js");
var Bid = require("./models/bid.js");
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

mongoose.connect("mongodb://localhost/auctions_db", { useNewUrlParser: true } );


// =========================================
var privateKey  = fs.readFileSync("./openssl/key.pem", 'utf8');//ssl
var certificate = fs.readFileSync("./openssl/cert.pem", 'utf8');
var credentials = {key: privateKey, cert: certificate};

var app = express();
app.use(bodyParser.urlencoded({extended: true}));
app.use(flash());
app.use(methodOverride("_method"));			/////////////////////////////

app.use(require("express-session")({
	secret: "i worth a lot!!!",
	resave: false,
	saveUninitialized: false,
}));


app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function(req, res, next) {
	res.locals.currentUser = req.user;
	res.locals.error = req.flash("error");
	res.locals.success = req.flash("success");
	next();
});

app.use( function(req, res, next) {
	if(req.user !== undefined) {
		var totalUnread = 0;
		for (var i = 0; i < req.user.chats.length; i++) {
		 	totalUnread = totalUnread + req.user.chats[i].unread;
		}
		console.log("totalUnread are: " + totalUnread);
		res.locals.totalUnread = totalUnread;
	}
	next();
});

//============================================
app.use(express.static("public"));  // tell express to serve the public dir

// clearing browser cache (pushing the back button after logout will now redirect to login page)
app.use(function(req, res, next) {
  res.set('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
  next();
});

var roles = ["manager", "seller", "bidder"];
var categories = ["Home & Garden", "Fashion", "Health","Sports","Books","Games & Consoles","Toys","Electronics","Art","Properties"];



// controllers definitions
var managerController = require("./controllers/managerController.js");
var sellerController  = require("./controllers/sellerController.js");
var bidderController  = require("./controllers/bidderController.js");
var registerController = require("./controllers/registerController.js");
var loginLogoutController = require("./controllers/loginLogoutController.js");
var chatController = require("./controllers/chatController.js");
var accountController = require("./controllers/accountController.js");
var searchController = require("./controllers/searchController.js");
var homeController = require("./controllers/homeController.js");
// use controllers
app.use(managerController);
app.use(sellerController);
app.use(bidderController);
app.use(registerController);
app.use(loginLogoutController);
app.use(chatController);
app.use(accountController);
app.use(searchController);
app.use(homeController);




app.listen(3000, function() {
	console.log("auctions app server has started!!!");
});
