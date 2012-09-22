var WikiHandler=function(){
	
};
WikiHandler.prototype={
	_process:function(inputString){
		var tokens=inputString.split(" ");
		if(tokens.length<2){
			return {result:"type img search_term to get a random image shown."};
		}else{
			tokens[0]="";
			this.getSummary(tokens.join(""));
		}
	},
	getSummary:function(inputString){
		var url="http://en.wikipedia.org/w/api.php?action=parse&format=json&prop=text&section=0&page="+encodeURIComponent(inputString)+"&callback=?";
		$.getJSON(url, function(data) {
			if(data.parse){
				var text=data.parse.text["*"];
				text=text.match("/<p>(.*)</p>/gi");
				if(text){
					handler.postProcessInput(inputString,{result:text.join("<p>")});
				}else{
					handler.postProcessInput(inputString,{result:data.parse.text["*"]});
				}
			}else{
				handler.postProcessInput(inputString,{result:"Error; Probably can't find the page."});
			}
		});
	}
};
//Required to export.
handler.subHandlers["wiki"]=new WikiHandler();
if(!handler.subHandlersNames.include("wiki")){
	handler.subHandlersNames.push("wiki");
}