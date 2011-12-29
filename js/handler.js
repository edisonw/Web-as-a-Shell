
var MasterHandler = function(subHandlers) {
	this._currentCommand = "";
	this._rawCommand     = "";
	this._commandStack   = 0;
	this.subHandlersNames = subHandlers|| [];
	this.subHandlersNames = this.subHandlersNames.concat(["help","load","user"]);
	this.subHandlers		={};
};

MasterHandler.prototype = {
		loadSubHandler:function(name,inputString,callbackObj){
			var here=this;
			this.loadHandlerResourceFile("./js/handlers/"+name+".js",
				function(){
					if(here.subHandlers[name]){
						callbackObj.postProcessInput(inputString,here.apply(inputString,false));
					}else
						callbackObj.postProcessInput(inputString,{result:"Command "+name+" handler failed to load"});
				},
				function(){
					callbackObj.postProcessInput(inputString,{result:"Command "+name+" handler failed to load"});
				}
			);
		},
		apply: function(inputString,callbackObj){
			try{
				var tokens=inputString.split(" ");
				if(this.subHandlersNames.include(tokens[0])){
					if(this.subHandlers[tokens[0]]){
						return this.subHandlers[tokens[0]]._process(inputString,callbackObj);
					}else{
						if(callbackObj!==false){
							this.loadSubHandler(tokens[0],inputString,callbackObj);
							console.log("Loading Handler "+tokens[0]);
						}else{
							throw "Failed to load handler"; 
						}
						return false;
					}
				}else{
					return {result:"shell: command not found."};
				}
			}catch(e){
				return {result:"Error: "+e};
			}
		},
		loadHandlerResourceFile:function(f,success,error){
			$.ajax({
				url: f,
				dataType: "script",
				crossDomain: true,
				success: success,
				error: error
			});
		},
		_process: function(inputString, errorCheck) {
			this._rawCommand += ' ' + inputString;

			try {
				inputString += '  '; // fixes certain bugs with the tokenizer.
				var tokens    = inputString.tokens();
				var mongoFunc = this._getCommand(tokens);
				if(this._commandStack === 0 && inputString.match(/^\s*$/)) {
					return {stack: 0, result: ''};
				}
				else if(this._commandStack === 0 && mongoFunc) {
					this._resetCurrentCommand();
					return {stack: 0, result: mongoFunc.apply(this, [tokens])};
				}
				else {
					return this._evaluator(tokens);
				}
			}

			catch(err) {

				// Allows for dynamic creation of db collections.
				// We catch the exception, create the collection, then try the command again.
				matches = this._currentCommand.match(/db\.(\w+)/);
				if(matches && matches.length == 2 && 
						errorCheck !== true && !this.collections.include(matches[1])) {
					this._currentCommand = "";
					this._createCollection(matches[1]);
					return this._process(this._rawCommand, true);
				}

				// Catch js errors.
				else {
					this._resetCurrentCommand();
					return {stack: 0, result: "JS Error: " + err};
				}
			}
		},

		// Calls eval on the input string when ready.
		_evaluator: function(tokens) {
			this._currentCommand += " " + this._massageTokens(tokens);
			if(this._shouldEvaluateCommand(tokens))  {
				db    = this.db;
				print = this.print;

				// So this eval statement is the heart of the REPL.
				var result = eval(this._currentCommand.trim());
				if(result === undefined) {
					throw('result is undefined');
				}
				else if(result.toString().match(/DBCursor/)) {
					if(this._currentCommand.match(/=/)) {
						result = "Cursor";
					}
					else {
						result = $htmlFormat(result.iterate());
					}
				}
				else {
					result = $htmlFormat(result);
				}
				this._resetCurrentCommand();
				return {stack: this._commandStack, result: result};
			}

			else {
				return {stack: this._commandStack, result: ""};
			}
		},

		_resetCurrentCommand: function() {
			this._currentCommand = '';
			this._rawCommand     = '';
		},

		// Evaluate only when we've exited any blocks.
		_shouldEvaluateCommand: function(tokens) {
			for(var i=0; i < tokens.length; i++) {
				var token = tokens[i];
				if(token.type == 'operator') {
					if(token.value == '(' || token.value == '{') {
						this._commandStack += 1;
					}
					else if(token.value == ')' || token.value == '}') {
						this._commandStack -= 1;
					}
				}
			}

			if(this._commandStack === 0) {
				return true;
			}
			else {
				return false;
			}
		},

		_massageTokens: function(tokens) {
			for(var i=0; i < tokens.length; i++) {
				if(tokens[i].type == 'name') {
					if(tokens[i].value == 'var') {
						tokens[i].value = '';
					}
				}
			}
			return this._collectTokens(tokens);
		},

		// Collects tokens into a string, placing spaces between variables.
		// This methods is called after we scope the vars.
		_collectTokens: function(tokens) {
			var result = "";
			for(var i=0; i < tokens.length; i++) {
				if(tokens[i].type == "name" && tokens[i+1] && tokens[i+1].type == 'name') {
					result += tokens[i].value + ' ';
				}
				else if (tokens[i].type == 'string') {
					result += "'" + tokens[i].value + "'";
				}
				else {
					result += tokens[i].value;
				}
			}
			return result;
		},

		// print output to the screen, e.g., in a loop
		// TODO: remove dependency here
		print: function() {
			$('.readLine.active').parent().append('<p>' + arguments[0] + '</p>');
			return "";
		},
};
