// 1. Init module object
var fs = require("fs");
var server = require("http").createServer(function(req, res) {
	var html;
	switch (req.url){
	case '/player.html':
	case '/communicate.html':
	case '/contents.html':
	    html = "." + req.url;
	    break;
	default:
	    html = './index.html';
	    break;
	}
	res.writeHead(200, {"Content-Type":"text/html"});
	var output = fs.readFileSync(html, "utf-8");
	console.log("createserver.");
	res.end(output);
}).listen(8080);
var io = require("socket.io").listen(server);

// Default Player URL
//var default_url = "https://soundcloud.com/furesshu/silent-sirensecret-base";
var default_url = "https://soundcloud.com/lukasgraham/7-years";

// User hash
var userHash = {};

// Member
/*var member = require("./member_manage.js");
var memberManage = member();
*/
// 2. Define event
io.sockets.on("connection", function (socket){
	
	/********************************/
	/* Communicate Event            */
	/********************************/
	// Connect start custom event (save and notify connected user to others)
	socket.on("com connected", function(name) {
	    // Notify new member to all users.	
	    var msg = name + " has been joined.";
	    socket.broadcast.emit("com publish", {value: msg});
	    
	    // Register the name to userHash for the client. 
	    userHash[socket.id] = name;
	    setMemberName(name, socket.id);
        });
	
	// Message send custom event
	socket.on("com publish", function (data) {
		io.sockets.emit("com publish", {value:data.value});
	});
	// Connect end custom event (delete and notify connected user to others)
	socket.on("com disconnect", function () {
		if (userHash[socket.id]) {
			var msg = userHash[socket.id] + " has been out.";
			delete userHash[socket.id];

			io.sockets.emit("com publish", {value: msg});

			// Delete DB member info.
			deleteMemberName(socket.id);
		}
	});

	/********************************/
	/* Player Event                 */
	/********************************/
	socket.on("player connected", function(){
		emitPlayerInfoToYourself(socket);
	});
	
	socket.on("player notify update", function(data){
		setPlayerInfo(data.url, data.pos);	
	});
});
	
/********************************/
/* Communicate Database         */
/********************************/
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var memberSchema = new Schema({
    userName: 	 String,	// User name
    socketId: 	 String,	// Socket ID
    joinedDate:  Date,		// Created data
});

mongoose.model('Member', memberSchema);
var member_connection = mongoose.createConnection('mongodb://localhost/member_db');
//var Member = mongoose.model('Member');
var Member = member_connection.model('Member');

closeDb = function (){
	console.log("Close connection.");
	mongoose.disconnect();
}
setMemberName = function (name, socketId){
    console.log("Set joined member name.");
    console.log("Name : " + name + ", Socket ID : " + socketId);

    var member = new Member();
    member.userName = name;
    member.socketId = socketId;
    member.joinedDate = new Date();
    member.save(function(err) { 
		if(err) { console.log(err); }
		emitMemberName();
    });
};

deleteMemberName = function (socketId){
    console.log("Delete joined member. (" + socketId + ")");

    Member.findOne({socketId: socketId}, function(err, docs){
		if(err) { console.log(err); }
		docs.remove();
		console.log("Delete member. (" + docs.userName + ", " + docs.socketId);	
 		closeDb
	});
};


getMemberName = function (){
    console.log("Get joined member name.");
    
    var nameArray = new Array();

    Member.find(function(err, docs){
		if(err) { console.log(err); }
		docs.forEach(function(element) {
	    	console.log("Name : " + element.userName);
	    	nameArray.push(element.userName);	// Add user name into the tail.
		});
    });
    console.log("nameArray len : " + nameArray.length);
    for(var i=0; i<nameArray.length; i++){
        console.log("Name debug: " + nameArray[i]);
    }
    return nameArray;
};

emitMemberName = function (){
    console.log("Emit joined member name.");
    var nameArray = new Array();

    Member.find(function(err, docs){
	if(err) { console.log(err); }
		docs.forEach(function(element) {
	    	console.log("Name : " + element.userName);
	    	nameArray.push(element.userName);	// Add user name into the tail.
		});
		console.log("nameArray len : " + nameArray.length);
		for(var i=0; i<nameArray.length; i++){
		    console.log("Name debug: " + nameArray[i]);
		}    
		
		io.sockets.emit("com refresh member", {value: nameArray});
	});
};

/********************************/
/* Player Database              */
/********************************/
var playerSchema = new Schema({
    url: 	 { type: String, default: ""},	// Current URL
    position:    Number,			// Current position (msec)
});
mongoose.model('Player', playerSchema);
var player_connection = mongoose.createConnection('mongodb://localhost/player_db');
//var Player = mongoose.model('Player');
var Player = player_connection.model('Player');

setPlayerInfo = function (url, pos){
    console.log("Set player info.");
    console.log("URL : " + url + ", Position(msec) : " + pos);

    var player = new Player();
    player.url = url;
    player.position = pos;
    player.save(function(err) { 
		if(err) { console.log(err); }
		emitPlayerInfoToAll();
    });
};

emitPlayerInfoToYourself = function (socket){
    console.log("Emit current playing content URL to yourself.");

    Player.findOne(function(err, docs){
		if(err) { 
			console.log(err); 
		}
		
		if(docs){
			console.log(docs);
			console.log("URL : " + docs.url);
			console.log("Position : " + docs.position);
			socket.emit("player update", {url: docs.url, pos: docs.position});
		}else{
			// Current Playing Content info is none.
			console.log("No content.");
			setPlayerInfo(default_url, 0);
		}
    });
};

emitPlayerInfoToAll = function (){
    console.log("Emit current playing content URL to all.");

    Player.findOne(function(err, docs){
		if(err) { 
			console.log(err); 
		}
		
		console.log("URL : " + docs.url);
		console.log("Position : " + docs.position);
		io.sockets.emit("player update", {url: docs.url, pos: docs.position});
    });
};


