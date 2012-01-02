var UserHandler=function(){
	this.ptr=0;
	this.command="";
	this.current_user;
	this.current_hash="";
	this.temp;
};
UserHandler.prototype={
	_process:function(inputString){
		var tokens=inputString.split(" ");
		if(this.ptr==0){
			if(tokens.length<2){
				return {result:"Current User: "+terminal.user.name+". Supported Operations: create, login, logout, help"};
			}else{
				if(this[tokens[1]])
					return this[tokens[1]](tokens,inputString);
				else
					return {result:"Invalid command to user handler."};
			}
		}else{
			return this[this.command](tokens,inputString);
		}
	},
	login:function(tokens,inputString){
		if(tokens.length<3){
			return {result:"Please enter a username."};
		}else{ 
			User.all().filter("name","=",tokens[2]).limit(1).list(null,function(results){
				if(results.length==0){
					//User does not exist.
					terminal.postProcessInput(inputString,{result:tokens[2]+" does not exist, use \"user create "+tokens[2]+"\" if you want to create one."});
				}else{
					//Found user.
					this.command="login";
					this.current_user=results[0];
					this.ptr=1;
				}
				return false;
			});
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
						terminal.postProcessInput(inputString,{result:"Please enter a password for "+name+":",stack:1,more:true,command:"user",promptType:"password"});
					}else{
						terminal.postProcessInput(inputString,{result:name+" already exists.",stack:0});
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
							this.ptr=3;
							return {result:"Would you like to specify a key-phrase (info see help):",stack:3,more:true,command:"user",promptType:"password"};
						}else{
							this.current_hash=sjcl.encrypt(psw,(new Date().getTime()).toString()+":)").ct;
							ResetHandlerStack(this);
								var user=new User(
									{name:this.current_user,
									 stored_hash:this.current_hash,
									 key_phrase:sjcl.encrypt(this.temp,psw).ct,
									 home:"/"+sjcl.encrypt(this.temp,this.current_user).ct,
									 defaultHandlers:"user"
									});
							persistence.add(user);
							this.temp="";
							this.ptr=0;
							persistence.flush(function() {
								terminal.user=handler.subHandlers["user"].current_user;
								terminal.prefix=handler.subHandlers["user"].current_user;
								terminal.postProcessInput(inputString,{result:"User Created.",
									change:{
										
									}
								});
							});
							return false;
						}
					}
				}
				//this.current_hash=sjcl.encrypt("password", "data");
			}
		}
	},
	help:function(){
		if(tokens.length<3){
			return {result:"login: log into a different user.<br />logout: logout of current user, same thing as login as guest.<br />create: create a new user.<br /><br />The user class uses a stored hash as a key to decrypt any stored database information. The stored hash is protected by your password. Please remember your password as there is no reset function yet."};
		}else{
			return false;
		}
	}
};
//Required to export.
handler.subHandlers["user"]=new UserHandler();
if(!handler.subHandlersNames.include("user"))
	handler.subHandlersNames.push("user");