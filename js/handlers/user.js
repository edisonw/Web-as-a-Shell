var UserHandler=function(){
	this.ptr=0;
	this.command="";
	this.current_user;
	this.current_hash="";
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
		if(this.ptr==0){
			if(tokens.length<3){
				return {result:"Please enter a name for the user. e.g. \"user create edison\""};
			}else{
				var name=tokens[2].replace(/ /g,'');
				if(name.length<4)
					return {result:"Please enter a name that is at least 4 charaters."};
					this.command="create";
					this.current_user=name;
					this.ptr=1;
					return {result:"Please enter a password for "+name+":",stack:1,more:true,command:"user"};
			}
		}else{
			var psw=tokens[0];
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