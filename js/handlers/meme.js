var MemeHandler=function(){
	
};
MemeHandler.prototype={
	_process:function(inputString){
		var here=this;
		var tokens=inputString.split(" ");
		if(tokens.length<2){
			return {result:"type meme search_term to get a random image shown."};
		}else{
			tokens[0]="";
			if(tokens[1].indexOf("-")==0){
				var arg1=tokens[1];
				tokens[1]="";
				if(arg1=="-g"){
					this.google(tokens.join(""));
				}
				if(arg1=="-b"){
					var input=tokens.join("");
					for(var i=0;i<20;i++){
						setTimeout(function(){here.google(input)},1000*i);		
					}
				}
			}else{
				this.meme(tokens.join(""));
			}
		}
	},
	meme:function(inputString){
		var here=this;
		$.ajax({    
			type:'get',                                                                                                                                                                      
			url: "http://version1.api.memegenerator.net/Generators_Search?q="+encodeURIComponent(inputString),                                                                                                                                                                                       
			success: function(data) {
				var start=data.responseText.indexOf("<p>")+3;
				var end=data.responseText.indexOf("</p>");
				var value=JSON.parse(data.responseText.substring(start,end));
				if(value && value.success){
					if(value.result.length==0){
						here.google(inputString);
					}else{
						var items=value.result;
						var item = items[Math.floor(Math.random()*items.length)];
						handler.postProcessInput(inputString,{result:item.displayName+" (Source: Meme Generator)",image:item.imageUrl});
					}
				}else{
					handler.postProcessInput(inputString,{result:"Error: Invalid data returned."});
				}
			},                                                                                                                                                                                       
			error: function() { console.log('Uh Oh!'); }                                                                                                          
		});
	},
	google:function(inputString){
		$.getJSON('https://ajax.googleapis.com/ajax/services/search/images?safe=off&v=1.0&q='+encodeURIComponent("meme "+inputString)+"&callback=?", function(data) {
			var items=data.responseData.results;
			var item = items[Math.floor(Math.random()*items.length)];
			if(item){
				handler.postProcessInput(inputString,{result:item.contentNoFormatting+ " (Source: Google)",image:item.url});
			}else{
				handler.postProcessInput(inputString,{result:"No results find or invalid data returned."});
			}
		});
	}
};
//Required to export.
handler.subHandlers["meme"]=new MemeHandler();
if(!handler.subHandlersNames.include("meme")){
	handler.subHandlersNames.push("meme");
}