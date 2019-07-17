var express = require("express");
var mongoose = require("mongoose");
var passport = require("passport");
var User = require("./models/user.js");
var Auction = require("./models/auction.js");
var Bid = require("./models/bid.js");
var LocalStrategy = require("passport-local");
var passportLocalMongoose = require("passport-local-mongoose");
var bodyParser = require("body-parser");

mongoose.connect("mongodb://localhost/auctions_db", { useNewUrlParser: true } ); 


// =========================================

var app = express();
app.use(bodyParser.urlencoded({extended: true}));


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

//============================================
app.use(express.static("public"));  // tell express to serve the public dir

// clearing browser cache (pushing the back button after logout will now redirect to login page)
app.use(function(req, res, next) {
  res.set('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
  next();
});

var roles = ["manager", "seller", "bidder", "visitor"];

// ROUTES
app.get("/", function(req, res) {
	res.render("home.ejs", {currentUser : req.user});
});

app.get("/back", function(req, res) {
	res.redirect("back");
});

app.get("/pendingRequestMessage", isLoggedIn, function(req ,res) {
	res.render("pendingRequestMessage.ejs", {currentUser:req.user} );
});


// MANAGER ROUTES
app.get("/managerPage", isLoggedIn, managerIsAuthorised , function(req, res) {
	console.log(req.user._id);
	console.log("inside managerPage route");
	User.find({}, function(error, foundUsers) { 
		res.render("managerPage.ejs", {foundUsers:foundUsers, currentUser:req.user});
	}); 
});

app.get("/managerPage/:userId", isLoggedIn, managerIsAuthorised , function(req, res) {
	User.findById({
		_id: req.params.userId
	}, function(error, foundUser) {
	  		res.render("userInfo.ejs", {user:foundUser, currentUser:req.user});
	});
});

app.get("/managerPage/:userId/approve", isLoggedIn, managerIsAuthorised , function(req, res) {
	User.findById({
		_id: req.params.userId
	}, function(error, foundUser) {
			console.log(foundUser);
			foundUser.request = "approved";
			foundUser.save(function(error) {
				if(error) {
					console.log(error);
				}
			});
			res.redirect("back");
	});
});

app.get("/managerPage/:userId/disapprove", isLoggedIn, managerIsAuthorised , function(req, res) {
	User.findOneAndRemove({
		_id: req.params.userId
	}, function(error, foundUser) {
			res.redirect("back");
	});
});

// SELLER ROUTES
app.get("/auctions/:id", isLoggedIn, userIsAuthorised, function(req, res) {
	Auction.find({
		seller: req.user._id
	}, function(error, foundAuctions) {
			res.render("auctions.ejs", {currentUser:req.user, auctions:foundAuctions});
	});
});

app.get("/auctions/:id/showBids", isLoggedIn, userIsAuthorised, function(req, res) {
	Auction.findById({
		_id: req.params.id
	}, function(error, foundAuction) {
			Bid.find({
				auction: foundAuction
			}, function(error, foundBids) {
				res.render("showBids.ejs", {currentUser:req.user, bids:foundBids});
			});
	});	
});

app.get("/auctions/:id/new", isLoggedIn, userIsAuthorised, function(req, res) {
	User.findById({
		_id : req.params.id
	}, function(error, foundUser) {
		res.render("newAuction.ejs", {currentUser: foundUser});
	});
});

app.post("/auctions/:id", isLoggedIn, userIsAuthorised, function(req, res) {
	Auction.create({
		name: req.body.name,
		category: req.body.category,
		First_Bid: req.body.First_Bid,
		Currently: req.body.First_Bid,
		Buy_Price: req.body.Buy_Price,
		Number_of_bids: 0,
		Started: new Date()
	}, function(error, newAuction) {
			if(error) {
				console.log(error);
			}
			User.findById({ 
				_id: req.user._id
			}, function(error, foundUser) {
				console.log("found user is :" + foundUser);
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
	res.redirect("/auctions/" + req.params.id);
});


// BIDDER ROUTES
app.get("/allAuctions", isLoggedIn, function(req, res) {
	Auction.find({}, function(error, foundAuctions) {
		if(error) {
			console.log(error);
		}
		console.log(foundAuctions);
		res.render("allAuctions.ejs", {auctions: foundAuctions});
	});
});

app.get("/allAuctions/:auctionId", isLoggedIn, function(req, res) {
	Auction.findById({
		_id: req.params.auctionId
	}, function(error, foundAuction) {
			res.render("auctionInfo.ejs", {auction: foundAuction});
	})
});


app.get("/allAuctions/:auctionId/makeBid", isLoggedIn, function(req, res) {
	Auction.findById({
		_id: req.params.auctionId
	}, function(error, foundAuction) {
			res.render("makeBid.ejs", {auction: foundAuction});
	});
});

app.get("/allAuctions/:auctionId/confirmBid", isLoggedIn, function(req, res) {
	Auction.findById({
		_id: req.params.auctionId
	}, function(error, foundAuction) {
			res.render("confirmBid.ejs", {auction: foundAuction, amount: req.query.amount});
	});	
});

app.post("/allAuctions/:auctionId/makeBid", isLoggedIn, function(req, res) {
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
						console.log("found AUCTION IS: " + foundAuction);
						createdBid.auction.push(foundAuction);
						createdBid.save( function(error, data) {
							if(error) {
								console.log(error);
							}
						});
						foundAuction.bids.push(createdBid);
						foundAuction.Number_of_bids = foundAuction.Number_of_bids + 1;
						foundAuction.save( function(error, data) {
							if(error) {
								console.log(error);
							}
						});

				})

		})

	})	
	res.send("perfect, you made a bid");
});



// sign up routes
app.get("/register", function(req, res) {
	res.render("register.ejs");
});

app.post("/register", function(req, res) {
	User.find({
		username: req.body.username
	}, function(error, foundUser) {
			if(error) {
				res.render("error.ejs", {error: "user already exists, please choose a different username"});
				return;
			}
	});
	if(!roles.includes(req.body.role)) {
		res.render("error.ejs", {error: "Sorry, this role does not exist"});
		return;
	}
	if(req.body.role === "manager") {
		User.register(new User({ username: req.body.username , role: req.body.role, request: "approved" }), req.body.password, function(err, user) {
			if(err) {
				console.log("error is: " + err);
				res.render("register.ejs");
			}
																			// if the registration of the user is done correctly 
			passport.authenticate("local")(req, res , function() { 	// we authenticate the user (here we use the 'local' strategy)
				return res.redirect('/managerPage');												// but there are 300 strategies (px twitter, facebook klp)
			});
		});		
	}
	else {
		User.register(new User({ username: req.body.username , role: req.body.role, request: "pending" }), req.body.password, function(err, user) {
			if(err) {
				console.log("error is: " + err);
				res.render("register.ejs");
			}
																			// if the registration of the user is done correctly 
			passport.authenticate("local")(req, res , function() { 	// we authenticate the user (here we use the 'local' strategy)
				res.redirect("/pendingRequestMessage");												// but there are 300 strategies (px twitter, facebook klp)
			});
		});
	}
});


// login routes
app.get("/login", function(req, res) {
	res.render("login.ejs", { currentUser: req.user });
});

app.post("/login", function(req, res, next) {
	User.find({username: req.body.username}, function(error, foundUsers) {
		if(error) {
			console.log(error);
		} 
		if(foundUsers[0].request === "pending") {
			res.send("your request has not been approved yet,sorry");
			return;
		}
	});
	passport.authenticate("local", function(error, user){
		req.logIn(user, function(err) {
      		if (err) { 
      			return next(err); 
      		}
      		console.log(user);
      		if(user.role == "manager") {
      			return res.redirect('/managerPage');
      		}
      		else  
      			return res.redirect('/');
    	});
	})(req, res, next);
}
);

// logout route
app.get("/logout", function(req ,res) {
	req.logout();
	res.redirect("/");
});



//MIDDLEWARES
function isLoggedIn(req, res, next) {
	if(req.isAuthenticated()) {
		return next();
	}
	res.redirect("/login");
}


function managerIsAuthorised (req, res, next) {
	console.log("req.user is:" + req.user);
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

function userIsAuthorised(req, res, next) {
	console.log("req.user is:" + req.user);
	User.findById({
		_id : req.params.id
	}, function(error, foundUser) {
		if(error) {
			console.log(error);
			res.redirect("/login");
			return;
		}
		if(foundUser._id.equals(req.user._id)) {
			return next();
		}
		else {
			res.redirect("/login");
		}
	});	
}


app.listen(3000, function() {
	console.log("auctions app server has started!!!");
});