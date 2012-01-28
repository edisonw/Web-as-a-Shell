//Handles dropbox API stuff.
var DropboxHandler=function(){
	this.ptr=0;
	this.command="";
	this.api_key="";
	this.api_secret="";
	this.user="";
	this.api_access_type="";
	this.temp;
};
DropboxHandler.prototype={
	_process:function(inputString){
		var tokens=inputString.split(" ");
		if(this.ptr==0){
			if(tokens.length<2){
				if(!this.user){
					if(handler.subHandlers["user"]){
						this.user=handler.subHandlers["user"].getUser();
					}
				}
				if(!this.user){
					return {result:"Dropbox API Wrapper. Please login first. "};
				}else{
					return {result:"Dropbox API Wrapper. Supported Operations: use,login, logout, Supported in Folder Operations: ls, cd, get, put."};
				}
			}else{
				if(this[tokens[1]])
					return this[tokens[1]](tokens,inputString);
				else
					return {result:"Invalid command to dropbox handler."};
			}
		}else{
			return this[this.command](tokens,inputString);
		}
	},
	ls:function(){
		
	},
	cd:function(){
		
	},
	get:function(){
		
	},
	put:function(){
		
	},
	login:function(tokens,inputString){
		
	},
	use:function(tokens,inputString){
		var here=this;
		if(this.ptr==0){
			if(tokens.length<4){
				return {result:"Please set your Dropbox API key and secret: \"dropbox use api_key api_secret\". <a href='https://www.dropbox.com/developers/apps' target='_blank'>Get a new one</a>"};
			}else{ 
				User_Preference.all().filter("user","=",this.user.name).filter("key",handler.subHandlers["user"].encrypt("dropbox.api_key")).limit(1).list(null,function(results){
					if(results.length==0){
						//User does not exist.
						handler.postProcessInput(inputString,{result:tokens[2]+" does not exist, use \"user create "+tokens[2]+"\" if you want to create one."});
					}else{
						//Found user.
						here.command="login";
						here.current_user=results[0];
						here.ptr=1;
						handler.postProcessInput(inputString,{result:"Password:",stack:1,more:true,command:"user",promptType:"password"});
					}
					return false;
				});
				return false;
			}
		}else{
			if(this.current_user.key_phrase==Sha1.hash(inputString)){
				here.current_hash=sjcl.decrypt(inputString, this.current_user.stored_hash);
				here.ptr=0;
				console.log("Hash:" +here.current_hash);
				return {result:"Login successful.",location:here.current_user.home,prefix:this.current_user.name};
			}else{
				here.ptr=0;
				this.current_user=null;
				return {result:"Login failed."};	
			}
		}
	},
	create:function(tokens,inputString){
		var here=this;
		if(this.ptr==0){
			if(tokens.length<3){
				return {result:"Please enter a name for the user. e.g. \"user create edison\""};
			}else{
				var name=tokens[2].replace(/ /g,'');
				if(name.length<3){
					return {result:"Please enter a name that is at least 3 charaters."};
				}
				User.all().filter("name","=",tokens[2]).limit(1).list(null,function(results){
					if(results.length==0){
						here.command="create";
						here.current_user=name;
						here.ptr=1;
						handler.postProcessInput(inputString,{result:"Please enter a password for "+name+":",stack:1,more:true,command:"user",promptType:"password"});
					}else{
						handler.postProcessInput(inputString,{result:name+" already exists.",stack:0});
					}
				});
				return false;	
			}
		}else{
			var psw=tokens[0];
			if(tokens.length!=1){
				return {result:"Passwords/Key-Phrase cannot have space in the middle.",stack:1,more:true,command:"user",promptType:"password"};
			}else{
				if(psw.length<6){
					return {result:"Please enter a stronger password (6+).",stack:1,more:true,command:"user",promptType:"password"};
				}
				if(this.ptr==1){
					this.temp=psw;
					this.ptr=2;
					return {result:"Confirm Password:",stack:2,more:true,command:"user",promptType:"password"};
				}else{
					if(this.temp!=psw){
						return {result:"Passwords do not match (\"kill user\" to reset):",stack:2,more:true,command:"user",promptType:"password"};
					}else{
						if(this.ptr==2){
							this.current_hash=sjcl.encrypt(psw,(new Date().getTime()).toString()+here._generateHash());
							ResetHandlerStack(this);
							persistence.add(new User(
								{name:this.current_user,
								 stored_hash:this.current_hash,
								 key_phrase:Sha1.hash(this.temp),
								 home:"/"+this.current_user,
								 defaultHandlers:""
								})
							);
							this.temp="";
							this.ptr=0;
							persistence.flush(function() {
								terminal.user=handler.subHandlers["user"].current_user;
								terminal.prefix=handler.subHandlers["user"].current_user;
								handler.postProcessInput(inputString,{result:"User Created."});
							});
							return false;
						}
					}
				}
			}
		}
	},
	_generateHash: function() {
      /*jshint bitwise:false */
      var S4 = function() {
         return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
      };
      /*jshint bitwise:true */
	      return S4()+S4()+S4()+S4()+S4();
	},
	help:function(tokens,inputString){
		if(tokens.length<3){
			return {result:"Enables Dropbox"};
		}else{
			return false;
		}
	},
	_getDropbox:function(key,secret){
		//From: https://github.com/kenotron/sourcekit/blob/master/src/dropbox/dropbox.js
		var Dropbox = function(consumerKey, consumerSecret) {
		    // Constructor / Private
		    var _consumerKey = consumerKey;
		    var _consumerSecret = consumerSecret;

		    var _tokens = {};
		    var _storagePrefix = "moderndropbox_";
		    var _authCallback = "";
		    var _fileListLimit = 10000;
		    var _dropboxApiVersion = 0;

		    var _serialize = function(a) {
		        serialized = [];

		        for (var key in a) {
		            var value = a[key];
		            serialized[ serialized.length ] = encodeURIComponent(key) + "=" + encodeURIComponent(value);
		        }

		        return serialized.join("&").replace(/%20/g, "+");
		    };

		    var _ajax = function(options) {
		        var serializedData = null;

		        if (!options.type) {
		            options.type = "GET";
		        }

		        if (options.type == "GET") {
		            options.url = options.url + "?" + _serialize(options.data);
		        } else if (options.type == "POST") {
		            serializedData = _serialize(options.data);
		        }

		        if (options.async == null) {
		            options.async = true;
		        }

		        var _xhr = new XMLHttpRequest();

		        _xhr.open(options.type, options.url, options.async);
		        _xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
		        _xhr.setRequestHeader("Accept", "application/json, text/javascript, */*");
		        _xhr.dataType = options.dataType;

		        if (options.async) { // Asynchronous
		            _xhr.onreadystatechange = (function() {
		                if (this.readyState == 4 && this.status == 200) {
		                    var data = this.responseText;
		                    if (this.dataType == "json") {
		                        data = JSON.parse(this.responseText);
		                    }
		                    options.success(data, this.status, this);
		                } else if (this.readState == 4) {
		                    var data = this.responseText;
		                    if (this.dataType == "json") {
		                        data = JSON.parse(this.responseText);
		                    }

		                    options.error(data, this.status, this);
		                }
		            }).bind(_xhr);

		            _xhr.onerror = options.error;

		            _xhr.send(serializedData);
		        } else { // Synchronous
		            _xhr.send(serializedData);
		            var data = _xhr.responseText;
		            if (_xhr.dataType == "json") {
		                data = JSON.parse(_xhr.responseText);
		            }

		            return data;
		        }
		    };

		    var _ajaxSendFileContents = function(options) {
		        var message = options.message;
		        var filename = options.filename;
		        var content = options.content;
		        var success = options.success;
		        var error = options.error;

		        var _xhr = new XMLHttpRequest();
		        _xhr.open("POST", message.action, true);

		        var boundary = '---------------------------';
		        boundary += Math.floor(Math.random() * 32768);
		        boundary += Math.floor(Math.random() * 32768);
		        boundary += Math.floor(Math.random() * 32768);
		        _xhr.setRequestHeader("Content-Type", 'multipart/form-data; boundary=' + boundary);

		        var body = '';

		        for (i in message.parameters) {
		            body += '--' + boundary + '\r\n' + 'Content-Disposition: form-data; name="';
		            body += message.parameters[i][0];
		            body += '"\r\n\r\n';
		            body += message.parameters[i][1];
		            body += '\r\n';
		        }

		        body += '--' + boundary + "\r\n";
		        body += "Content-Disposition: form-data; name=file; filename=" + filename + "\r\n";
		        body += "Content-type: application/octet-stream\r\n\r\n";
		        body += content;
		        body += "\r\n";
		        body += '--' + boundary + '--';

		        _xhr.onreadystatechange = (function() {
		            if (this.readyState == 4 && this.status == 200) {
		                success();
		            } else if (this.readState == 4) {
		                error();
		            }
		        }).bind(_xhr);

		        _xhr.onerror = error;

		        _xhr.send(body);
		    };

		    var _setAuthCallback = function(callback) {
		        _authCallback = callback;
		    };

		    var _setupAuthStorage = function() {
		        keys = ["requestToken", "requestTokenSecret", "accessToken", "accessTokenSecret"];

		        for (i in keys) {
		            var key = keys[i];
		            value = localStorage.getItem(_storagePrefix + key);
		            if (value) {
		                _tokens[key] = value;
		            }
		        }
		    };

		    var _clearAuthStorage = function() {
		        keys = ["requestToken", "requestTokenSecret", "accessToken", "accessTokenSecret"];

		        for (i in keys) {
		            var key = keys[i];
		            localStorage.removeItem(_storagePrefix + key);
		            _tokens = {};
		        }
		    };

		    var _storeAuth = function(valueMap) {
		        keys = ["requestToken", "requestTokenSecret", "accessToken", "accessTokenSecret"];

		        for (i in keys) {
		            var key = keys[i];

		            if (valueMap[key]) {
		                localStorage.setItem(_storagePrefix + key, valueMap[key]);
		                _tokens[key] = valueMap[key];
		            }
		        }
		    };

		    var _createOauthRequest = function(url, options) {
		        if (!options) {
		            options = [];
		        }

		        // Outline the message
		        var message = {
		            action: url,
		            method: "GET",
		            parameters: [
		                ["oauth_consumer_key", _consumerKey],
		                ["oauth_signature_method", "HMAC-SHA1"]
		            ]
		        };

		        // Define the accessor
		        var accessor = {
		            consumerSecret: _consumerSecret,
		        };

		        if (!options.token) { // Token wasn't passed in with the request - look up localStorage
		            if (_tokens["accessToken"]) {  // In case of trying to gain temporary credentials (request token)
		                message.parameters.push(["oauth_token", _tokens["accessToken"]]);
		            } else if (_tokens["requestToken"]) {
		                message.parameters.push(["oauth_token", _tokens["requestToken"]]);
		            }
		        } else {
		            message.parameters.push(["oauth_token", options.token]);
		            delete options.token;
		        }

		        if (!options.tokenSecret) {
		            accessor.tokenSecret = _tokens["accessTokenSecret"];
		        } else {
		            accessor.tokenSecret = options.tokenSecret;
		            delete options.tokenSecret;
		        }

		        if (options.method) {
		            message.method = options.method;
		            delete options.method;
		        }

		        for (key in options) {
		            message.parameters.push([key, options[key]]);
		        }

		        OAuth.setTimestampAndNonce(message);
		        OAuth.SignatureMethod.sign(message, accessor);

		        return message;
		    };

		    var _sendOauthRequest = function(message, options) {
		        if (!options) {
		            options = [];
		        }

		        if (!options.success) {
		            options.success = function() {};
		        }

		        if (!options.error) {
		            options.error = function() {};
		        }

		        if (!options.type) {
		            options.type = "json";
		        }

		        if (options.async === null) {
		            options.async = true;
		        }

		        if (options.multipart) {
		            return _ajaxSendFileContents({
		                message: message,
		                filename: options.filename,
		                content: options.content,
		                success: options.success,
		                error: options.error
		            });
		        } else {
		            return _ajax({
		                async: options.async,
		                url: message.action,
		                type: message.method,
		                data: OAuth.getParameterMap(message.parameters),
		                dataType: options.type,
		                success: options.success,
		                error: options.error            });
		        }
		    };

		    // Public
		    return ({
		        isAccessGranted: function() {
		            return (_tokens["accessToken"] != null) && (_tokens["accessTokenSecret"] != null);
		        },

		        isAuthorized: function() {
		            return (_tokens["requestToken"] != null) && (_tokens["requestTokenSecret"] != null);
		        },

		        initialize: function() {
		            _setupAuthStorage();
		            return this;
		        },

		        authorize: function(callback, error_callback) {
		            if (!_tokens['accessToken'] && !_tokens['accessTokenSecret']) {
		                if (!_tokens['requestToken'] && !_tokens['requestTokenSecret']) { // Step 1
		                    var requestTokenUrl = "https://www.dropbox.com/" + _dropboxApiVersion + "/oauth/request_token";
		                    var authorizeUrl = "https://www.dropbox.com/" + _dropboxApiVersion + "/oauth/authorize";
		                    var message = _createOauthRequest(requestTokenUrl);

		                    _sendOauthRequest(message, {
		                        type: "text",
		                        success: (function(data) {
		                            var pairs = data.split(/\&/);
		                            for (var i in pairs) {
		                                var keyValueArray = pairs[i].split(/\=/);
		                                var key = keyValueArray[0];
		                                var value = keyValueArray[1];

		                                if (key == 'oauth_token') {
		                                    _tokens['requestToken'] = value;
		                                } else if (key == 'oauth_token_secret') {
		                                    _tokens['requestTokenSecret'] = value;
		                                }
		                            }

		                            // Chrome specific things
		                            chrome.tabs.getCurrent((function(tab) {
		                                chrome.tabs.create({ url: authorizeUrl + "?oauth_token=" + _tokens['requestToken'], selected: true }, (function(dropboxTab) {
		                                    chrome.tabs.onUpdated.addListener((function(tabId, changeInfo, tab) {
		                                        if (tabId == dropboxTab.id && tab.title.indexOf("API Request Authorized") != -1) {
		                                            // Recurse, next step!
		                                            this.authorize(callback, error_callback);
		                                            chrome.tabs.remove(tabId);
		                                        }
		                                    }).bind(this));
		                                }).bind(this));
		                            }).bind(this));
		                        }).bind(this),
		                        error: function(data) { if (error_callback) { error_callback(data); } },
		                    });
		                } else { // Step 2
		                    var accessTokenUrl = "https://www.dropbox.com/" + _dropboxApiVersion + "/oauth/access_token";
		                    var message = _createOauthRequest(accessTokenUrl);

		                    _sendOauthRequest(message, {
		                        type: "text",
		                        success: function(data) {
		                            var pairs = data.split(/\&/);
		                            for (var i in pairs) {
		                                var keyValueArray = pairs[i].split(/\=/);
		                                var key = keyValueArray[0];
		                                var value = keyValueArray[1];

		                                if (key == 'oauth_token') {
		                                    _tokens['accessToken'] = value;
		                                } else if (key == 'oauth_token_secret') {
		                                    _tokens['accessTokenSecret'] = value;
		                                }
		                            }

		                            var authTokens = {};
		                            authTokens['accessToken'] = _tokens['accessToken'];
		                            authTokens['accessTokenSecret'] = _tokens['accessTokenSecret'];
		                            _storeAuth(authTokens);
		                            callback();
		                        },
		                        error: function(data) { if (error_callback) { error_callback(data); } },
		                    });
		                }
		            } else {
		                callback();
		            }
		        },

		        deauthorize: function() {
		            _clearAuthStorage();
		        },

		        getAccountInfo: function(callback) {
		            var url = "https://www.dropbox.com/" + _dropboxApiVersion + "/account/info";
		            var message = _createOauthRequest(url);
		            _sendOauthRequest(message, {
		                type: "json",
		                success: (function(data) { callback(data); }).bind(this)
		            });
		        },

		        getDirectoryContents: function(path, callback) {
		            if (path != null) {
		                var filename = path.replace(/^\//, '');
		                var url = "https://www.dropbox.com/" + _dropboxApiVersion + "/metadata/dropbox/" + escape(filename);
		                var message = _createOauthRequest(url, {
		                    file_limit: _fileListLimit,
		                    list: "true"
		                });

		                _sendOauthRequest(message, {
		                    type: "json",
		                    success: (function(data) { callback(data); }).bind(this),
		                    error: this.errorHandler.bind(this)
		                });
		            }
		        },

		        getMetadata: function(path, callback) {
		            var filename = path.replace(/^\//, '');
		            var url = "https://www.dropbox.com/" + _dropboxApiVersion + "/metadata/dropbox/" + escape(filename);
		            var message = _createOauthRequest(url, {
		                list: "false"
		            });

		            _sendOauthRequest(message, {
		                type: "json",
		                success: (function(data) { callback(data); }).bind(this)
		            });
		        },

		        getFileContents: function(path, callback) {
		            var filename = path.replace(/^\//, '');
		            var url = "https://api-content.dropbox.com/" + _dropboxApiVersion + "/files/dropbox/" + escape(filename);
		            var message = _createOauthRequest(url);

		            if (callback) {
		                _sendOauthRequest(message, {
		                    type: "text",
		                    success: (function(data) { callback(data); }).bind(this)
		                });
		            } else {
		                return _sendOauthRequest(message, {
		                    type: "text",
		                    async: false
		                });
		            }
		        },

		        putFileContents: function(path, content, callback) {
		            var filename = path.match(/([^\\\/]+)$/)[1];
		            var file_path = path.match(/^(.*?)[^\\\/]+$/)[1];
		            file_path = file_path.replace(/^\//, '')
		            var url = "https://api-content.dropbox.com/" + _dropboxApiVersion + "/files/dropbox/" + escape(file_path) + "?file=" + escape(filename);
		            var message = _createOauthRequest(url, { method: "POST" });

		            _sendOauthRequest(message, {
		                multipart: true,
		                content: content,
		                filename: filename,
		                success: (function(data) { callback(data); }).bind(this)
		            });
		        },

		        createDirectory: function(path, callback) {
		            var url = "https://www.dropbox.com/" + _dropboxApiVersion + "/fileops/create_folder";
		            var message = _createOauthRequest(url, {
		                path: path,
		                root: 'dropbox'
		            });
		            _sendOauthRequest(message, {
		                type: "json",
		                success: (function(data) { if (callback) { callback(data); } }).bind(this)
		            });
		        },

		        deletePath: function(path, callback) {
		            var url = "https://www.dropbox.com/" + _dropboxApiVersion + "/fileops/delete";
		            var message = _createOauthRequest(url, {
		                path: path,
		                root: 'dropbox'
		            });
		            _sendOauthRequest(message, {
		                type: "json",
		                success: (function(data) { if (callback) { callback(data); } }).bind(this)
		            });
		        },

		        logOutDropbox: function() {
		            _clearAuthStorage();
		        },

		        errorHandler: function(data) {
		            console.error(data);
		        }
		    }).initialize();
		};
		return new Dropbox(key,secret);
	}
};
//Required to export.
handler.subHandlers["dropbox"]=new DropboxHandler();
if(!handler.subHandlersNames.include("dropbox"))
	handler.subHandlersNames.push("dropbox");