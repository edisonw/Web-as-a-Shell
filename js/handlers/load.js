var LoadHandler=function(){
	
};
LoadHandler.prototype={
	_process:function(inputString,cb){
		var tokens=inputString.split(" ");
		if(tokens.length<2){
			return {result:"Please load an handler using \"load handler-url\"."};
		} else{
			return this._load(tokens[1],cb);
		}
	},
	_load:function(f,cb){
		try{
		$.ajax({
			url: f,
			dataType: "script",
			crossDomain: true,
			success:function(){
				if(handler.subHandlers[name]){
					cb.postProcessInput(inputString,handler.apply(inputString,false));
				}else
					cb.postProcessInput(inputString,{result:"Command "+f+" handler failed to load"});
			},
			error:function(){
				cb.postProcessInput(inputString,{result:"Command "+f+" handler failed to load"});
			}
		});
		}catch(e){
			return {result:"Cannot load "+f+" : "+e};
		}
		return false;
	}
};
//Required to export.
handler.subHandlers["load"]=new LoadHandler();
if(!handler.subHandlersNames.include("load"))
	handler.subHandlersNames.push("load");