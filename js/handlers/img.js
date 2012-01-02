var ImgHandler=function(){
	
};
ImgHandler.prototype={
	_process:function(inputString){
		return {result:"This is where you can use web as a shell! Currently you can use the following native commands: help, user, and load. Load allows you to custom handlers to use. "};
	}
};
//Required to export.
handler.subHandlers["img"]=new ImgHandler();
if(!handler.subHandlersNames.include("img"))
	handler.subHandlersNames.push("img");