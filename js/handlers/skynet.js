var SkynetHandler=function(){
	this.ptr=0;
	this.command="";
};
SkynetHandler.prototype={
	_process:function(inputString){
		var tokens=inputString.split(" ");
		if(tokens.length==1){
			return;
		}else{
			this.talk(inputString);
		}	
	},
	talk:function(inputString){
		if(inputString.indexOf("hi")!=-1){
			return {result:"Hi!"};
		}
		return null;
	}
};
//Required to export.
handler.subHandlers["skynet"]=new SkynetHandler();
if(!handler.subHandlersNames.include("skynet")){
	handler.subHandlersNames.push("skynet");
}