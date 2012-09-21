var HelpHandler=function(){
	
};
HelpHandler.prototype={
	_process:function(inputString){
		return {result:"This is where you can use web as a shell! Currently you can use the following native commands: help, user, and load. Load allows you to custom handlers to use. "};
	}
};
//Required to export.
handler.subHandlers["help"]=new HelpHandler();
if(!handler.subHandlersNames.include("help")){
	handler.subHandlersNames.push("help");
}