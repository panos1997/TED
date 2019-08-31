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




/////// CHAT ////////////

router.get("/chats", authenticationMiddlewares.isLoggedIn, function(req, res) {
	User.find({
		_id: { $ne: req.user._id},
		 request : { $ne: "pending"  }
	}, function(error, foundUsers) {
			if(error) {
				console.log(error);
			}
			else {
				Chat.findOne({
					messages:  {
						'$elemMatch': {
							'$or': 	[{ sender: req.user._id , receiver: String(foundUsers[0]._id)}, { sender: String(foundUsers[0]._id), receiver: req.user._id }]
						}
					}
				}, function(error, foundChat) {
						if(error) {
							console.log(error)
						}
						else {
							res.redirect( "/chats/" + String(req.user._id) +  "/chat/" + String(foundUsers[0]._id) );
							//return res.render("chat2.ejs", {users: foundUsers, chat: foundChat, selectedUserId: String(foundUsers[0]._id), unreadMessages: 0 });
						}
				});
			}
	});

});


router.post("/chats/:currentUserId/send/:otherUserId", authenticationMiddlewares.isLoggedIn, function(req, res) {
	Chat.findOne({
		messages:  {
			'$elemMatch': {
				'$or': 	[{ sender: req.params.currentUserId , receiver: req.params.otherUserId}, { sender: req.params.otherUserId, receiver: req.params.currentUserId }]
			}
		}
	}, function(error, foundChat) {
		if(error) {
			console.log(error);
		}
		else {
			console.log("CHAT FOUND IS " + foundChat);
			if(foundChat == null) {           // if a chat between the 2 users does not already exist, then create one
				Chat.create({

				}, function(error, createdChat) {
						if(error) {
							console.log(error);
						}
						else {
							console.log("CREATE CHATTTTTTTTTTTT");
							if(createdChat !== null) {
								createdChat.messages.push({
									sender: req.params.currentUserId,
									receiver: req.params.otherUserId,
									content: req.body.content,
									date: new Date()
								});
								createdChat.save();
								console.log("createdChat is " + createdChat);
								// find users and update their chats array
								User.findOne({
									_id: req.params.currentUserId
								}, function(error, foundSeller) {
									if(error) {
										console.log(error)
									}
									else {
										User.findOne({
											_id: req.params.otherUserId
										}, function( error, foundReceiver) {
											if(error) {
												console.log(error)
											}
											else {
												var x = {
													chat: createdChat,
													unread: 0
												};
												foundSeller.chats.push(x);
												var y = {
													chat: createdChat,
													unread: 1
												};
												foundReceiver.chats.push(y);
												foundSeller.save();
												foundReceiver.save();
												res.redirect("/chats/" + req.params.currentUserId + "/chat/" + req.params.otherUserId);
											}
										})
									}
								})
							}
						}
				});
			}
			else {					// if the chat already exists
				foundChat.messages.push({
					sender: req.params.currentUserId,
					receiver: req.params.otherUserId,
					content: req.body.content,
					date: new Date()
				});
				foundChat.save();
				/////////////////////////
				User.findOne({_id: req.params.otherUserId}).populate('chats.chat').exec(function(err, populatedUser) {
					populatedUser.save();
					console.log("results are: " + populatedUser.chats);
					 for (var i = 0; i < populatedUser.chats.length; i++){
					 		//console.log(populatedUser.chats[i]);
					 		console.log("1: " + typeof foundChat._id);
					 		console.log("2: " + typeof populatedUser.chats[i].chat._id);
					 		if(String(populatedUser.chats[i].chat._id) === String(foundChat._id) ) {
					 			populatedUser.chats[i].unread++;
					 			console.log("result isssssssssssss" + populatedUser.chats[i]);
					 		}
					}
					res.redirect("/chats/" + req.params.currentUserId + "/chat/" + req.params.otherUserId);
  				})
  				//////////

			}


		}
	})

});

router.get("/chats/:currentUserId/chat/:otherUserId", authenticationMiddlewares.isLoggedIn, function(req, res) {

	User.find({
		_id: { $ne: req.user._id},
		 request : { $ne: "pending"  }
	}, function(error, foundUsers) {
			if(error) {
				console.log(error);
			}
			else {
				Chat.findOne({
					messages: {
						'$elemMatch': {
							 '$or': [{receiver: req.params.otherUserId, sender: req.params.currentUserId}, {receiver: req.params.currentUserId, sender: req.params.otherUserId }    ]
						}
					}

				}, function(error, foundChat) {
						if(error) {
							console.log(error);
						}
						else {
							/////////////
							User.findOne({_id: req.params.currentUserId}).populate('chats.chat').exec(function(err, populatedUser) {
								populatedUser.save();
								var unreadMessages = 0;
								 for (var i = 0; i < populatedUser.chats.length; i++) {
								 		if(populatedUser.chats[i].chat !== null && foundChat !== null) {
									 		if(String(populatedUser.chats[i].chat._id) === String(foundChat._id) ) {
									 			console.log("UNREAD ARE " + populatedUser.chats[i].unread);
									 			unreadMessages = populatedUser.chats[i].unread;
									 			populatedUser.chats[i].unread = 0;
									 			populatedUser.chats[i].save();
									 		}
								 		}
								}
								return res.render("chat2.ejs", {users: foundUsers , chat: foundChat, selectedUserId: req.params.otherUserId, unreadMessages:unreadMessages });
			  				})
			  				/////////////
							//return res.render("chat2.ejs", {users: foundUsers , chat: foundChat, selectedUserId: req.params.otherUserId });
						}
				});

			}

	});

});

router.get("/chats/:currentUserId/chat/:otherUserId/delete", function(req, res) {
	Chat.findOne({
		messages:  {
			'$elemMatch': {
				'$or': 	[{ sender: req.params.currentUserId , receiver: req.params.otherUserId}, { sender: req.params.otherUserId, receiver: req.params.currentUserId }]
			}
		}
	}, function(error, foundChat) {
		if(error) {
			console.log(error);
		}
		else {
			if(foundChat !== null) {
			Chat.findOneAndDelete({_id : foundChat._id}, {useFindAndModify: false }, function(error, deletedChat) {
				if(error) {
					console.log(error);
				}
				else {
					User.findOne({								 // delete chat from first user
						_id: req.params.currentUserId
					}, function(error, foundUser) {
							if(error) {
								console.log(error)
							}
							else {
								 for (var i = 0; i < foundUser.chats.length; i++) {
								 		console.log("H00000000000000");
								 		if(foundUser.chats[i].chat !== null && deletedChat !== null) {
								 			console.log("HIIIIIIIIIIIIIIIIIIIi");
									 		if(String(foundUser.chats[i].chat._id) === String(deletedChat._id) ) {
									 			console.log("H2222222222222222");
									 			foundUser.chats.splice(i,1);
									 			foundUser.save();
												User.findOne({                     // delete chat from second user
													_id: req.params.otherUserId
												}, function(error, foundUser2) {
														if(error) {
															console.log(error)
														}
														else {
															 for (var i = 0; i < foundUser2.chats.length; i++) {
															 		if(foundUser2.chats[i].chat !== null && deletedChat !== null) {
																 		if(String(foundUser2.chats[i].chat._id) === String(deletedChat._id) ) {
																 			foundUser2.chats.splice(i,1);
																 			foundUser2.save();

																 			res.redirect("/chats");
																 		}
															 		}
															}
														}
												})
									 		}
								 		}
								}
							}
					})


				}
			});
		}
		else
			res.redirect("/chats");
		}
	});
});


module.exports = router;