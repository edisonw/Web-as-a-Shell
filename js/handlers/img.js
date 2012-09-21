var ImgHandler=function(){
	
};
ImgHandler.prototype={
	_process:function(inputString){
		var tokens=inputString.split(" ");
		if(tokens.length<2){
			return {result:"type img search_term to get a random image shown."};
		}else{
			tokens[0]="";
			this.google(tokens.join());
		}
	},
	google:function(inputString){
		$.getJSON('https://ajax.googleapis.com/ajax/services/search/images?v=1.0&q='+encodeURIComponent(inputString)+"&callback=?", function(data) {
			var items=data.responseData.results;
			var item = items[Math.floor(Math.random()*items.length)];
			handler.postProcessInput(inputString,{result:item.contentNoFormatting,image:item.url});
		});
	}
};
//Required to export.
handler.subHandlers["img"]=new ImgHandler();
if(!handler.subHandlersNames.include("img")){
	handler.subHandlersNames.push("img");
}