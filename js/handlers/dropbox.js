//Handles dropbox API stuff.
var DropboxHandler=function(){
	this.ptr=0;
	this.command="";
	this.api_key=null;
	this.api_secret=null;
	this.api_fetched=false;
	this.user="";
	this.api_access_type="";
	this.temp;
	this.api_pref_key="dropbox_api";
};
DropboxHandler.prototype={
	_process:function(inputString){
		var tokens=inputString.split(" ");
		if(this.ptr==0){
			if(tokens.length<2){
				if(!this.user){
					if(handler.subHandlers.user){
						this.user=handler.subHandlers.user.getUser();
					}
				}
				if(!this.user){
					return {result:"Dropbox API Wrapper. Please login first. "};
				}else{
					return {result:"Dropbox API Wrapper. Supported Operations: show, use,login, logout, Supported in Folder Operations: ls, cd, get, put."};
				}
			}else{
				if(this[tokens[1]]){
					return this[tokens[1]](tokens,inputString);
				}else{
					return {result:"Invalid command to dropbox handler."};
				}
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
	show:function(tokens,inputString){
		var here=this;
		if(tokens.length<3){
			if(!this.api_key || !this.api_secret){
				this.getApi(function(err,success){
					if(success){
						handler.postProcessInput(inputString,{result:"API Key: "+here.api_key+"<br />API Secret: "+here.api_secret+"<br/>Login:"});
					}else{
						handler.postProcessInput(inputString,{result:"Error: "+err});	
					}
				});
			}else{
				handler.postProcessInput(inputString,{result:"API Key: "+here.api_key+"<br />API Secret: "+here.api_secret+"<br/>Login:"});
			}
		}
	},
	getApiKey:function(cb){
		var here=this;
		if(this.api_key){
			cb(null,this.api_key);
		}else{
			this.getApi(function(err,success){
				if(success){
					cb(null,this.api_key);
				}else{
					cb("Could not retrieve key: "+err,null);
				}
			});
		}
	},
	getApi:function(cb){
		var here=this;
		handler.subHandlers.user.getPreference(this.api_pref_key,function(err,result){
			if(err){
				cb(err,null);
			}else{
				if(result!=null){
					console.log(result);
					var sp=result.indexOf(" ");
					here.api_key=result.substring(0,sp);
					here.api_secret=result.substring(sp+1);
					cb(null,true);
				}else{
					cb("Could not decrypt the key",null);		
				}
			}
		});
	},
	getApiSecret:function(cb){
		var here=this;
		if(this.api_secret){
			cb(null,this.api_secret);
		}else{
			this.getApi(function(err,success){
				if(success){
					cb(null,this.api_secret);
				}else{
					cb("Could not retrieve secret: "+err,null);
				}
			});
		}
	},
	use:function(tokens,inputString){
		if(tokens.length<4){
			return {result:"Please set your Dropbox API key and secret: \"dropbox use api_key api_secret\". <a href='https://www.dropbox.com/developers/apps' target='_blank'>Get a new one</a>"};
		}else{ 
			handler.subHandlers.user.setPreference(this.api_pref_key,tokens[2]+" "+tokens[3],true,function(err){
				if(err){
					handler.postProcessInput(inputString,{result:"Error: "+err});	
				}else{
					handler.postProcessInput(inputString,{result:"Success."});
				}
			})
			return false;
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
			return {result:"Enables Dropbox commands, you have to login first."};
		}else{
			return false;
		}
	},
	_getDropbox:function(key,secret){
		var db=new Dropbox(key,secret);
		console.log(db);
		return {result:"Dropbox loaded"};
	}
};
//Required to export.
handler.subHandlers["dropbox"]=new DropboxHandler();
if(!handler.subHandlersNames.include("dropbox"))
	handler.subHandlersNames.push("dropbox");