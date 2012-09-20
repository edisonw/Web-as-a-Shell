/*global $:true, handler:true*/
var LoadHandler = function () {
	'use strict';
};

LoadHandler.prototype = {
	_process: function (inputString, cb) {
		'use strict';
		var tokens = inputString.split(" ");
		if (tokens.length < 2) {
			return {result: "Please load an handler using \"load handler-url\"."};
		} else {
			return this.load(tokens[1], cb);
		}
	},
	load: function (type,f, cb) {
		'use strict';
		var name=f;
		f="./js/"+type+"/"+f+".js";
		try {
			$.ajax({
				url: f,
				dataType: "script",
				crossDomain: true,
				success: function () {
					cb(true);
				},
				error: function () {
					cb(false);
				}
			});
		} catch (e) {
			cb("Cannot load " + f + " : " + e);
		}
		return false;
	}
};
//Required to export.
handler.subHandlers.load = new LoadHandler();
if (!handler.subHandlersNames.include("load")) {
	handler.subHandlersNames.push("load");
}