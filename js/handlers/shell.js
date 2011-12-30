var ShellHandler=function(){
	this.ptr=0;
	this.command="";
	this.current_user;
	this.current_hash="";
};
ShellHandler.prototype={
	_process:function(inputString){
		terminal.status();
		return {result:""};
	}
};
//Required to export.
handler.subHandlers["shell"]=new ShellHandler();
if(!handler.subHandlersNames.include("shell"))
	handler.subHandlersNames.push("shell");