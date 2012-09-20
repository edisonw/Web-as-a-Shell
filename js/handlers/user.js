/*global terminal:true, sjcl:true, User:true, handler:true, Sha1:true, persistence:true, ResetHandlerStack:true*/
var UserHandler = function () {
	'use strict';
	this.ptr = 0;
	this.command = "";
	this.current_user = null;
	this.current_hash = "";
	this.temp = null;
};
UserHandler.prototype = {
	_process: function (inputString) {
		'use strict';
		var tokens = inputString.split(" ");
		if (this.ptr === 0) {
			if (tokens.length < 2) {
				return {result: "Current User: " + terminal.prefix + ". Supported Operations: create, login, logout, help"};
			} else {
				if (this[tokens[1]]) {
					return this[tokens[1]](tokens, inputString);
				} else {
					return {result: "Invalid command to user handler."};
				}
			}
		} else {
			return this[this.command](tokens, inputString);
		}
	},
	getUser: function () {
		'use strict';
		return this.current_user;
	},
	encrypt: function (value) {
		'use strict';
		if (this.current_hash) {
			try {
				return sjcl.encrypt(this.current_hash, value);
			} catch (e) {
				return null;
			}
		} else {
			return null;
		}
	},
	decrypt: function (value) {
		'use strict';
		if (this.current_hash) {
			try {
				return sjcl.decrypt(this.current_hash, value);
			} catch (e) {
				return null;
			}
		} else {
			return null;
		}
	},
	login: function (tokens, inputString) {
		'use strict';
		var here = this;
		if (this.ptr === 0) {
			if (tokens.length < 3) {
				return {result: "Please enter a username."};
			} else {
				User.all().filter("name", "=", tokens[2]).limit(1).list(null, function (err,results) {
					if (!results|| results.length === 0) {
						//User does not exist.
						handler.postProcessInput(inputString, {result: tokens[2] + " does not exist, use \"user create "
							+ tokens[2] + "\" if you want to create one. Error: "+err});
					} else {
						//Found user.
						here.command = "login";
						here.current_user = results[0];
						here.ptr = 1;
						handler.postProcessInput(inputString,
							{result: "Password:", stack: 1, more: true, command: "user", promptType: "password"});
					}
					return false;
				});
				return false;
			}
		} else {
			if (this.current_user.key_phrase === Sha1.hash(inputString)) {
				here.current_hash = sjcl.decrypt(inputString, this.current_user.stored_hash);
				here.ptr = 0;
				return {result: "Login successful.", location: here.current_user.home, prefix: this.current_user.name};
			} else {
				here.ptr = 0;
				this.current_user = null;
				return {result: "Login failed."};
			}
		}
	},
	create: function (tokens, inputString) {
		'use strict';
		var here = this, name, psw;
		if (this.ptr === 0) {
			if (tokens.length < 3) {
				return {result: "Please enter a name for the user. e.g. \"user create edison\""};
			} else {
				name = tokens[2].replace(/ /g, '');
				if (name.length < 3) {
					return {result: "Please enter a name that is at least 3 charaters."};
				}
				User.all().filter("name", "=", tokens[2]).limit(1).list(null, function (err,results) {
					if(err){
						handler.postProcessInput(inputString, {result: "Cannot access the database: "+err, stack: 0});
					}else{
						if (results.length === 0) {
							here.command = "create";
							here.current_user = name;
							here.ptr = 1;
							handler.postProcessInput(inputString,
								{result: "Please enter a password for " + name + ":", stack: 1, more: true, command: "user", promptType: "password"});
						} else {
							handler.postProcessInput(inputString, {result: name + " already exists.", stack: 0});
						}
					}
				});
				return false;
			}
		} else {
			psw = tokens[0];
			if (tokens.length !== 1) {
				return {result: "Passwords/Key-Phrase cannot have space in the middle.", stack: 1, more: true, command: "user", promptType: "password"};
			} else {
				if (psw.length < 6) {
					return {result: "Please enter a stronger password (6+).", stack: 1, more: true, command: "user", promptType: "password"};
				}
				if (this.ptr === 1) {
					this.temp = psw;
					this.ptr = 2;
					return {result: "Confirm Password:", stack: 2, more: true, command: "user", promptType: "password"};
				} else {
					if (this.temp !== psw) {
						return {result: "Passwords do not match (\"kill user\" to reset):",
							stack: 2, more: true, command: "user", promptType: "password"};
					} else {
						if (this.ptr === 2) {
							this.current_hash = sjcl.encrypt(psw, (new Date().getTime()).toString() + here._generateHash());
							ResetHandlerStack(this);
							persistence.add(new User(
								{
									name: this.current_user,
									stored_hash: this.current_hash,
									key_phrase: Sha1.hash(this.temp),
									home: "/" + this.current_user,
									defaultHandlers: ""
								}
							));
							this.temp = "";
							this.ptr = 0;
							persistence.flush(function (err) {
								//terminal.user = handler.subHandlers.user.current_user;
								//terminal.prefix = handler.subHandlers.user.current_user;
								if(!err){
									handler.postProcessInput(inputString, {result: "User Created; You may use it to login now."});
								}else{
									handler.postProcessInput(inputString, {result: "User cannot be created: "+err});
								}
							});
							return false;
						}
					}
				}
			}
		}
	},
	setPreference:function(key,val,replace,cb){
		var r_val=handler.subHandlers.user.encrypt(val);
		var here=this;
		if(!val || !key){
			return {result:"Cannot encrypt api information."};
		}
		if(!here.current_user.name){
			return {result:"User not logged in."}
		}
		this.getPreference(key,function(err,result){
			if(!err){
				if(!result){
					if(replace){
						persistence.add(new User_Preference({
							user:here.current_user.name,
							key:key,
							val:r_val
						}));
					}else{
						cb("Preference already exists.");
						return;
					}
				}else{
					result.key=key;
					result.val=r_val;
				}
				persistence.flush(function (err) {
					cb(err);	
				});
			}else{
				cb(err);
			}
		});
	},
	getPreference:function(key,cb){
		var here=this;
		User_Preference.all().filter("key", "=", key).filter("user","=",this.current_user.name).limit(1).list(null, function (err,results) {
			if (err) {
				cb(err,null);
			} else {
				if(results.length===0){
					cb(null,null);
				}else{
					console.log("Pre-decrypting: "+results[0].val);
					cb(null,here.decrypt(results[0].val));
				}
			}
			return false;
		});
	},
	show:function(tokens,inputString){
		if(this.current_hash===null || this.current_user===null)
			return {result:"You are not logged in."};	
		else{
			if(tokens.length==3){
				if(tokens[2]=="preference"){
					User_Preference.all().filter("name", "=", this.current_user.name).list(null, 
						function (results) {
							console.log("Found: "+results.length);
							if (results.length === 0) {
								handler.postProcessInput(inputString, {result: "Nothing was found."});
							} else {
								results.forEach(function (r) {
									console.log(r);
								});
								handler.postProcessInput(inputString, {result: "results found: "+results});
							}
						}
					);
					return false;
				}
			}else{
				console.log(this.current_user);
			}
		}
	},
	_generateHash: function () {
		'use strict';
		var S4 = function () {
			return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
		};
		return S4() + S4() + S4() + S4() + S4();
	},
	help: function (tokens, inputString) {
		'use strict';
		if (tokens.length < 3) {
			return {result: "login: log into a different user."
						+"<br />logout: logout of current user, same thing as login as guest."
						+"<br />create: create a new user.<br />"
						+"<br />show: show the stored data for this user."
						+"<br />The user class uses a stored hash as a key to decrypt any stored database information. The stored hash is protected by your password. Please remember your password as there is no reset function yet."
					};
		} else {
			return false;
		}
	}
};
//Required to export.
handler.subHandlers.user = new UserHandler();
if (!handler.subHandlersNames.include("user")) {
	handler.subHandlersNames.push("user");
}