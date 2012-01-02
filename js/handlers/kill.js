var KillHandler=function(){
	this.ptr=0;
	this.command="";
	this.current_user;
	this.current_hash="";
};
KillHandler.prototype={
	_process:function(inputString){
		var tokens=inputString.split(" ");
		if(tokens.length<2){
			return {result:"\"kill handler_name\" can reset a handler that is hanging."};
		}
			
	}
};
//Required to export.
handler.subHandlers["kill"]=new KillHandler();
if(!handler.subHandlersNames.include("kill"))
	handler.subHandlersNames.push("kill");