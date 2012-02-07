/*global $:true*/
//Part of this code uses TryMongo: Copyright (c) 2009 Kyle Banker
//Licensed under the MIT Licence.
//http://www.opensource.org/licenses/mit-license.php
//Readline class to handle line input.
//This application itself is also licensed under the same MIT Licence. 
var ReadLine = function (options) {
	'use strict';
	this.options      = options || {};
	this.htmlForInput = this.options.htmlForInput;
	this.inputHandler = this.options.handler || this.mockHandler;
	this.terminal     = $(this.options.terminalId || "#terminal");
	this.lineClass    = this.options.lineClass || '.readLine';
	this.history      = [];
	this.prefix		  = "guest";
	this.location	  = "~";
	this.historyPtr   = 0;
	this.initialize();
};

ReadLine.prototype = {

	initialize: function () {
		'use strict';
		this.addInputLine();
	},
	status: function () {
		'use strict';
		/*jslint nomen: false*/
		this.insertResponse("Current Command: " + this.inputHandler.currentCommand);
		/*jslint nomen: true*/
	},
	// Enter a new input line with proper behavior.
	addInputLine: function (stackLevel, type, prefix, location) {
		'use strict';
		stackLevel = stackLevel || 0;
		this.terminal.append(this.htmlForInput(prefix || this.prefix, stackLevel, location || this.location, type));
		var ctx = this;
		ctx.activeLine = $(this.lineClass + '.active');
			// Bind key events for entering and navigting history.
		ctx.activeLine.bind("keydown", function (ev) {
			switch (ev.keyCode) {
			case EnterKeyCode:
				ctx.processInput(this.value);
				break;
			case UpArrowKeyCode:
				ctx.getCommand('previous');
				break;
			case DownArrowKeyCode:
				ctx.getCommand('next');
				break;
			}
		});
		this.activeLine.focus();
	},
	// Returns the 'next' or 'previous' command in this history.
	getCommand: function (direction) {
		if (this.history.length === 0) {
			return;
		}
		this.adjustHistoryPointer(direction);
		this.activeLine[0].value = this.history[this.historyPtr];
		$(this.activeLine[0]).focus();
		//this.activeLine[0].value = this.activeLine[0].value;
	},
	// Moves the history pointer to the 'next' or 'previous' position. 
	adjustHistoryPointer: function (direction) {
		if (direction === 'previous') {
			if (this.historyPtr - 1 >= 0) {
				this.historyPtr -= 1;
			}
		} else {
			if (this.historyPtr + 1 < this.history.length) {
				this.historyPtr += 1;
			}
		}
	},
	// Return the handler's response.
	processInput: function (value) {
		var response = this.inputHandler.apply(value,this);
		if (response !== false)
			this.postProcessInput(value, response);
	},
	postProcessInput: function (value,response){
		if (!response || !this.insertResponse(response.result)) {
			return;
		}
		// Save to the command history...
		if (!response.promptType === "password") {
			if ((lineValue = value.trim()) !== "") {
				this.history.push(lineValue);
				this.historyPtr = this.history.length;
			}
		}
		if(response.prefix)
			this.prefix = response.prefix;
		if(response.location){
			this.location = response.location;
		}
		// deactivate the line...
		this.activeLine.value = "";
		this.activeLine.attr({disabled: true});
		this.activeLine.removeClass('active');
		// and add add a new command line.
		this.addInputLine(response.stack,response.promptType,response.prefix,response.location);
	},
	insertResponse: function (response) {
		console.log(response);
		if (response) {
			if (response.length < 3) {
				this.activeLine.parent().append("<p class='response'></p>");
			} else {
				this.activeLine.parent().append("<p class='response'>" + response + "</p>");
			}
			return true;
		}
		return false;
	},
	mockHandler: function (inputString) {
		return {result: inputString};
	}
};