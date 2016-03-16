
// Database management
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var memberSchema = new Schema({
    userName: 	 String,	// User name
    joinedDate:  Date,		// Created data
});
var Member;

// Module exports.
module.exports = MemberManage;

// Constructor
function MemberManage(){
    mongoose.model('Member', memberSchema);
    mongoose.connect('mongodb://localhost/member_db');
    this.Schema = mongoose.Schema;
    this.memberSchema = new Schema({
        userName: String,	// user name
        joinedDate: Date	// created date
    });
    this.Member = mongoose.model('Member');
}

// API
exports.setMemberName = function (name){
    console.log("Set joined member name. (" + name + ")");

    var member = new Member();
    member.userName = name;
    member.joinedDate = new Date();
    member.save(function(err) { 
	if(err) { console.log(err); }
    });
};

exports.getMemberName = function (){
    console.log("Get joined member name.");
    
    var nameArray = new Array();

    var member = new Member();
    member.find(function(err, docs){
	if(err) { console.log(err); }
	docs.forEach(function(element) {
	    console.log("Name : " + element.userName);
	    nameArray.push(element.userName);	// Add user name into the tail.
	});
    });
    return nameArray;
};
