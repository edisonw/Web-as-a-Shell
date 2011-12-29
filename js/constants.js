// Part of this code uses TryMongo: Copyright (c) 2009 Kyle Banker
// Licensed under the MIT Licence.
// http://www.opensource.org/licenses/mit-license.php
// Readline class to handle line input.
// This application itself is also licensed under the same MIT Licence. 

var DefaultInputHtml = function(prefix,stack,location) {
    var linePrompt = "";
    if(stack == 0) {
      linePrompt += "<p class=\"response\">"+prefix+"@127.0.0.1"+ " "+location+"</p>"+
      			"<span class='prompt'> ></span>";
    }
    else {
      for(var i=0; i <= stack; i++) {
        linePrompt += "<span class='prompt'>.</span>";
      }
    }
    return "<div class='line'>" +
           linePrompt +
           "<input type='text' class='readLine active' />" +
           "</div>";
};

var EnterKeyCode     = 13;
var UpArrowKeyCode   = 38;
var DownArrowKeyCode = 40;

var PTAG = function(str) {
  return "<pre>" + str + "</pre>";
};

var BR = function() {
  return "<br/>";
};

