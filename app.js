var express = require("express");
var mongoose = require("mongoose");
var passport = require("passport");
var User = require("./models/user.js");
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
	saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

//============================================

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));  // tell express to serve the public dir

var roles = ["manager", "seller", "bidder", "visitor"];

// ROUTES
app.get("/", function(req, res) {
	console.log(User.username);
	res.render("home.ejs", {currentUser : req.user});
});

app.get("/pendingRequestMessage", isLoggedIn, function(req ,res) {
	res.render("pendingRequestMessage.ejs", {currentUser:req.user} );
});

app.get("/managerPage", isLoggedIn, function(req, res) {
	console.log("inside managerPage route");
	User.find({}, function(error, foundUsers) { 
		res.render("managerPage.ejs", {foundUsers:foundUsers, currentUser:req.user});
	}); 
});

app.get("/managerPage/:id", function(req, res) {
	User.findById({
		_id: req.params.id
	}, function(error, foundUser) {
	  		res.render("userInfo.ejs", {user:foundUser});
	});
});

app.get("/managerPage/:id/approve", function(req, res) {
	User.findById({
		_id: req.params.id
	}, function(error, foundUser) {
			console.log(foundUser);
			foundUser.request = "approved";
			foundUser.save(function(error) {
				if(error) {
					console.log(error);
				}
			});
			res.send("ok");
	});
});

app.get("/managerPage/:id/disapprove", function(req, res) {
	User.findOneAndRemove({
		_id: req.params.id
	}, function(error, foundUser) {
			res.redirect("/managerPage");
	});
});

// sign up routes
app.get("/register", function(req, res) {
	res.render("register.ejs", );
});

app.post("/register", function(req, res) {
	if(!roles.includes(req.body.role)) {
		res.send('<h1> Sorry, this role does not exist </h1> <h3>  <a href = "/register">  Go back to register form </a> </h3>');
		return;
	}

	User.register(new User({ username: req.body.username , role: req.body.role, request: "pending" }), req.body.password, function(err, user) {
		if(err) {
			console.log("error is: " + err);
			res.render("register.ejs");
		}																// if the registration of the user is done correctly 
		passport.authenticate("local")(req, res , function() { 	// we authenticate the user (here we use the 'local' strategy)
			res.redirect("/pendingRequestMessage");												// but there are 300 strategies (px twitter, facebook klp)
		});
	});
});


// login routes
app.get("/login", function(req, res) {
	res.render("login.ejs", {currentUser: req.user});
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

function isLoggedIn(req, res, next) {
	if(req.isAuthenticated()) {
		return next();
	}
	res.redirect("/login");
}

app.listen(3000, function() {
	console.log("auctions app server has started!!!");
});