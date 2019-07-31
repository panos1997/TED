var express = require("express");
var mongoose = require("mongoose");
var passport = require("passport");
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


//============================================
app.use(express.static("public"));  // tell express to serve the public dir

// clearing browser cache (pushing the back button after logout will now redirect to login page)
app.use(function(req, res, next) {
  res.set('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
  next();
});

var roles = ["manager", "seller", "bidder"];
var categories = ["Home & Garden", "Fashion", "Health","Sports","Books","Games & Consoles","Toys","Electronics","Art","Properties"];


// ROUTES
app.get("/index", function(req, res) {
	res.render("index.ejs");
});

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
	User.find({}, function(error, foundUsers) {
		res.render("managerPage.ejs", {foundUsers:foundUsers, currentUser:req.user, role: req.body.role});
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
app.get("/auctions", isLoggedIn, function(req, res) {
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

app.get("/auctions/:id/showBids", isLoggedIn , function(req, res) {
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
			    else {
			    	res.render("showBids.ejs", {currentUser:req.user, bids:foundBids});
			    }
			});
	});
});







/////////
/////////
// Edit , update , delete	auction 	/////////////////////////////////////

//edit
app.get("/auctions/:id/editAuction", isLoggedIn , function(req, res) {
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
app.put("/auctions/:id", isLoggedIn , function(req, res){

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
app.delete("/auctions/:id", isLoggedIn, function(req, res){
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










app.get("/auctions/new", isLoggedIn, function(req, res) {
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

app.post("/auctions", isLoggedIn, function(req, res) {
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


// BIDDER ROUTES

app.get("/bids", isLoggedIn, function(req, res) {
	var counter=0;
	bidsAuctions = [];
	Bid.find({
		bidder: req.user._id
	}, function(error, foundBids) {
			if(error) {
				console.log(error);
			}
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
	});
});


app.get("/categories", function(req, res) {
	Auction.find({}, function(error, foundAuctions) {
		if(error) {
			console.log(error);
		}
		console.log(foundAuctions);
		res.render("categories.ejs", {auctions: foundAuctions, categories: categories});
	});
});

app.get("/categories/:category", function(req, res) {
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

app.get("/categories/:category/:auctionId", function(req, res) {
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


app.get("/categories/:category/:auctionId/makeBid", isLoggedIn, function(req, res) {
	Auction.findById({
		_id: req.params.auctionId
	}, function(error, foundAuction) {
			res.render("makeBid.ejs", {auction: foundAuction});
	});
});

app.get("/categories/:category/:auctionId/buyNow",isLoggedIn, function(req,res){
	Auction.findById({
		_id: req.params.auctionId
	}, function(error, foundAuction){
		res.render("buyNow.ejs",{auction: foundAuction});
	});
});

app.get("/categories/:category/:auctionId/confirmBid", isLoggedIn, function(req, res) {
	Auction.findById({
		_id: req.params.auctionId
	}, function(error, foundAuction) {
			res.render("confirmBid.ejs", {auction: foundAuction, amount: req.query.amount});
	});
});

app.get("/categories/:category/:auctionId/confirmBuy", isLoggedIn, function(req, res) {
	Auction.findById({
		_id: req.params.auctionId
	}, function(error, foundAuction) {
			res.render("confirmBuy.ejs", {auction: foundAuction});
	});
});

app.post("/categories/:category/:auctionId/makeBid", isLoggedIn, function(req, res) {
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
	//res.send("perfect, you made a bid");
	res.render("succes_bid.ejs");
});
app.post("/categories/:category/:auctionId/makeBuy", isLoggedIn, function(req, res) {
	res.send("hi");
});

app.get("/search", function(req, res) {
	res.redirect("/");
});


app.post("/search", function(req, res) {
	var auction = {};
	if(req.body.auction !== undefined) {
		if(req.body.auction.name !== undefined && req.body.auction.name.length !== 0) {
			auction.name = req.body.auction.name;
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


app.get("/register/user_exist", function(req, res){
	res.render("user_exist.ejs");
});

// sign up routes
app.get("/register", function(req, res) {
	res.render("register.ejs");
});

app.post("/register", function(req, res) {
	/////////////////////// edw prosthes auto to if////// an oi kwdikoi password kai password_again einai diaforetikoi tote se petaei se selida sfalmatos
	if(req.body.password !== req.body.password_again){
		//console.log("Ta password me to password_again einai diaforetika");
		return res.render("user_exist.ejs");
	}
	////////////////////////////////////////


	if(req.body.role === "manager") {
		var newUser = new User({username: req.body.username,
								password_again: req.body.password_again,
								role: req.body.role,
								request: "approved",

								firstname: req.body.firstname,
								lastname: req.body.lastname,
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

							firstname: req.body.firstname,
							lastname: req.body.lastname,
							email: req.body.email,
							phone: req.body.phone,
							address: req.body.address,
							AFM:	req.body.AFM,
							location: req.body.location
						});

	User.register(newUser, req.body.password, function(err, user) {
		if(err) {
			console.log("error is: " + err);
			return res.render("user_exist.ejs");
			//res.render("register.ejs");
		}
																		// if the registration of the user is done correctly
		passport.authenticate("local")(req, res , function() { 	// we authenticate the user (here we use the 'local' strategy)
			res.redirect("/pendingRequestMessage");												// but there are 300 strategies (px twitter, facebook klp)
		});
	});
});



app.get("/login/request_approved", function(req, res){
	res.render("request_approved.ejs");
});


// login routes
app.get("/login", function(req, res) {
	res.render("login.ejs", { currentUser: req.user });
});

app.post("/login", passport.authenticate("local", {
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
	User.findById({
		_id : req.params.id
	}, function(error, foundUser) {
		if(error) {
			console.log(error);
			res.redirect("/login");
			return;
		}
		if(foundUser._id === req.user._id) {
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
