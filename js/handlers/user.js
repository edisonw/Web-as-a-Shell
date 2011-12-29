var UserHandler=function(){
	
};
UserHandler.prototype={
	_process:function(inputString){
		return {result:"This is where you can use web as a shell! Currently you can use the following native commands: help, user, and load. Load allows you to custom handlers to use. "};
	}
};
//Required to export.
handler.subHandlers["user"]=new UserHandler();
if(!handler.subHandlersNames.include("user"))
	handler.subHandlersNames.push("user");