/*global persistence:true,MasterHandler:true, $:true, ReadLine:true, DefaultInputHtml:true*/
var db = persistence.store.websql.config(persistence, 'WAAS', 'Web as a Shell', 5 * 1024 * 1024);

var terminal = null;
var handler = new MasterHandler();

persistence.schemaSync(null, function () {
	'use strict';
	$(function () {
		terminal = new ReadLine({htmlForInput: DefaultInputHtml, handler: handler});
		if(Parse.User.current()){
			handler.loadSubHandler("user",null,null,function(isSuccessful){
				if(isSuccessful){
					terminal.processInput("sync restore");				
				}
			});
		}
	});
});
