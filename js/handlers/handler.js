var MasterHandler = function (subHandlers) {
	'use strict';
	this.currentCommand = "";
	this._rawCommand     = "";
	this._commandStack   = 0;
	this.subHandlersNames = subHandlers || [];
	this.subHandlersNames = this.subHandlersNames.concat(["handler"]);
	this.timeout = 500;
	this.subHandlers = {handler:this};
	this.currentHandler		= {};
	this.ptr				= 0;
	this.allowCustomOptions = false;
	this.version			= "v.0.0.0";
};

MasterHandler.prototype = {
		_process:function(inputString){
			var tokens=inputString.split(" ");
			if(this.ptr==0){
				if(tokens.length<2){
					return {result:"You can use \"handler set property value\" to set options for the master handler for this session."};
				}else{
					if(this[tokens[1]]){
						return this[tokens[1]](tokens,inputString);
					}else{
						return {result:"Invalid command to handler."};
					}
				}
			}else{
				return this[this.command](tokens,inputString);
			}
		},
		set:function(tokens,inputString){
			if(tokens.length<4){
				return {result:"Missing property or value"};
			}else{
				console.log(this[tokens[2]]);
				if(typeof this[tokens[2]] !="undefined"){
					this[tokens[2]]=tokens[3];
					return {result:"Handler: Set "+tokens[2]+" to "+tokens[3]};
				}else{
					if(!this.allowCustomOptions)
						return {result:"Cannot set an unknown option, use \"set allowCustomOptions true\" first to set custom values."};
					return {result:"Handler: Set "+tokens[2]+" to "+tokens[3]+" (Custom)"};
				}
			}
		},
		loadSubHandler:function(name,inputString,handlerCallBack,onFinishCallBack){
			var here=this;
			this.loadHandlerResourceFile("./js/handlers/"+name+".js",
					function(){
				if(here.subHandlers[name]){
					if(handlerCallBack){
						handlerCallBack.postProcessInput(inputString,here.apply(inputString,false));
					}else{
						console.log(name+" handler loaded.");
					}
					if(onFinishCallBack){
						onFinishCallBack(true);
					}
				}else{
					handlerCallBack.postProcessInput(inputString,{result:"Command "+name+" handler failed to load"});
					if(onFinishCallBack){
						onFinishCallBack(false);
					}
				}
			},
			function(){
				handlerCallBack.postProcessInput(inputString,{result:"shell: command \""+name+"\" not found."});
			}
			);
		},
		postProcessInput:function(inputString,response){
			if(response){
				this._commandStack=response.stack||0;
				this.currentCommand=response.command||this.currentCommand;
			}else{
				this._commandStack=0;
			}
			if(this._commandStack===0){
				this.currentCommand="";
			}
			terminal.postProcessInput(inputString,response);
		},
		apply: function(inputString,callbackObj){
			//try{
				if(this._commandStack===0){
					if(inputString.length===0)
						return {result:""};
						var tokens=inputString.split(" ");
						var v=tokens[0].indexOf(".");
						if(v!=-1){
							var obj=this.subHandlers[tokens[0].substring(0,v)];
							if(v!=tokens[0].length-1 && obj){
								obj=this.subHandlers[tokens[0].substring(0,v)][tokens[0].substring(v+1)];
							}
							if(typeof obj!="undefined"){
								return {result:obj.toString()+" ("+(typeof obj)+")"};
							}else{
								return {result:"undefined"};
							}
						}
						if(this.subHandlersNames.include(tokens[0])){
							if(this.subHandlers[tokens[0]]){
								var response=this.subHandlers[tokens[0]]._process(inputString,callbackObj);
								if(response)
									this._commandStack=response.stack||0;
								else
									this._commandStack=0;
								console.log("Stack Size: "+this._commandStack);
								if(this._commandStack>0){
									this.currentCommand=tokens[0];
								}else{
									this.currentCommand="";
								}
								return response;
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
							this.loadSubHandler(tokens[0],inputString,callbackObj);
							return false;
						}
				}else{
					var response=this.subHandlers[this.currentCommand]._process(inputString,callbackObj);
					if(response){
						this._commandStack=response.stack||0;
					}else{
						this._commandStack=0;
					}
					if(this._commandStack===0){
						this.currentCommand="";
					}
					return response;
				}
			//}catch(e){
			//	return {result:"Error: "+e};
			//}
		},
		loadHandlerResourceFile:function(f,success,error){
			$.ajax({
				url: f,
				dataType: "script",
				crossDomain: true,
				success: success,
			    timeout : this.timeout,
			    error:error
			});
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
