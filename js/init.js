$htmlFormat = function(obj) {
	return tojson(obj, ' ', ' ', true);
};

var db= persistence.store.websql.config(persistence, 'WAAS','Web as a Shell', 5 * 1024 * 1024);

var User = persistence.define('User', {
  name: "TEXT",
  stored_hash: "TEXT",
  home: "TEXT",
  defaultHandlers: "TEXT"
});


var terminal;
var handler= new MasterHandler();

persistence.schemaSync(null,function(){
	$(function() {
		terminal= new ReadLine({htmlForInput: DefaultInputHtml,handler:handler});
	});
});
