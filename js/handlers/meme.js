var MemeHandler=function(){
	
};
MemeHandler.prototype={
	_process:function(inputString){
		var tokens=inputString.split(" ");
		if(tokens.length<2){
			return {result:"type meme search_term to get a random image shown."};
		}else{
			tokens[0]="";
			this.google(tokens.join());
		}
	},
	google:function(inputString){
		$.ajax({
			url:"http://version1.api.memegenerator.net/Generators_Search?callback=?&q="+encodeURIComponent(inputString)+"&pageIndex=0&pageSize=10",
			dataType:'text',
			success:function(data) {
			//console.log(data);
			//var items=data.responseData.results;
			//var item = items[Math.floor(Math.random()*items.length)];
			//handler.postProcessInput(inputString,{result:item.contentNoFormatting,image:item.url});
		}});
	}
};
//Required to export.
handler.subHandlers["meme"]=new MemeHandler();
if(!handler.subHandlersNames.include("meme")){
	handler.subHandlersNames.push("meme");
}