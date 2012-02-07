/*global $:true, handler:true*/
var ReloadHandler = function () {
	'use strict';
};

ReloadHandler.prototype = {
	_process: function (inputString, cb) {
		'use strict';
		var tokens = inputString.split(" ");
		if (tokens.length < 2) {
			return {result: "Please load an handler using \"load handler-url\"."};
		} else {
			return this.reload(tokens[1], cb);
		}
	},
	reload: function (f, cb) {
		'use strict';
		var name=f;
		f="./js/handlers/"+f+".js";
		try {
			$.ajax({
				url: f,
				dataType: "script",
				crossDomain: true,
				success: function () {
					if (handler.subHandlers[name]) {
						handler.postProcessInput("",{result: "Handler reloaded."});
					} else {
						console.log(handler);
						handler.postProcessInput("", {result: name+ " handler failed to load"});
					}
				},
				error: function () {
					handler.postProcessInput("", {result: "crossDomainmand " + f + " handler failed to load"});
				}
			});
		} catch (e) {
			return {result: "Cannot load " + f + " : " + e};
		}
		return false;
	}
};
//Required to export.
handler.subHandlers.reload = new ReloadHandler();
if (!handler.subHandlersNames.include("reload")) {
	handler.subHandlersNames.push("reload");
}