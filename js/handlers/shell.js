/*global handler:true,terminal:true*/
var ShellHandler = function () {
	'use strict';
	this.ptr = 0;
	this.command = "";
	this.current_user = null;
	this.current_hash = "";
};
ShellHandler.prototype = {
	_process: function (inputString) {
		'use strict';
		terminal.status();
		return {result: ""};
	}
};
//Required to export.
handler.subHandlers.shell = new ShellHandler();
if (!handler.subHandlersNames.include("shell")) {
	handler.subHandlersNames.push("shell");
}