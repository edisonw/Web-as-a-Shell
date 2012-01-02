var db= persistence.store.websql.config(persistence, 'WAAS','Web as a Shell', 5 * 1024 * 1024);

var terminal;
var handler= new MasterHandler();

persistence.schemaSync(null,function(){
	$(function() {
		terminal= new ReadLine({htmlForInput: DefaultInputHtml,handler:handler});
	});
});
