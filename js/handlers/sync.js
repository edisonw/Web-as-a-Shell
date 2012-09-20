var SyncHandler=function(){
	
};
SyncHandler.prototype={
	_process: function (inputString, cb) {
		'use strict';
		var tokens = inputString.split(" ");
		if (tokens.length < 2) {
			return {result: "<br />You may setup an account with Parse so that you can backup and restore your data on Parse.com."+
			"<p><br />Commands:<br />"+
			"<br />sync backup - backup now. <br />"+
			"<br />sync restore - restore now. <br />"+
			"<br />sync disable - disable sync. <br />"+
			"<br />sync enable - enable sync. <br />"+
			"<br />sync only - do not use local storage. <br />"+
			"<br />sync link \"email\"- link account with Parse (password required).<br /></p>"};
		} else {
			if(tokens[1]=="restore"){
				return this.restore(tokens, cb);
			}

			if(tokens[1]=="backup"){
				return this.backup(tokens, cb);
			}

			if(tokens[1]=="link"){
				return this.link(tokens, cb);
			}
		}
	},
	link:function (tokens,cb){
		if(tokens.length<3){
			
		}
	}
};
//Required to export.
handler.subHandlers["sync"]=new SyncHandler();
if(!handler.subHandlersNames.include("sync")){
	handler.subHandlersNames.push("sync");
}