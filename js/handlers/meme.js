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
		$.ajax({    
			type:'get',                                                                                                                                                                      
			url: "http://version1.api.memegenerator.net/Generators_Search?q="+encodeURIComponent(inputString),                                                                                                                                                                                       
			success: function(data) { console.log(data.responseText);},                                                                                                                                                                                       
			error: function() { console.log('Uh Oh!'); }                                                                                                          
		});
	},
	google:function(inputString){
		$.getJSON('https://ajax.googleapis.com/ajax/services/search/images?safe=off&v=1.0&q='+encodeURIComponent("meme "+inputString)+"&callback=?", function(data) {
			var items=data.responseData.results;
			var item = items[Math.floor(Math.random()*items.length)];
			handler.postProcessInput(inputString,{result:item.contentNoFormatting,image:item.url});
		});
	}
};
//Required to export.
handler.subHandlers["meme"]=new MemeHandler();
if(!handler.subHandlersNames.include("meme")){
	handler.subHandlersNames.push("meme");
}