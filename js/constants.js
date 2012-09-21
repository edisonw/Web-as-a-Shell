/*jslint undef: false, browser: true, maxerr: 50, indent: 2*/
/*global $htmlFormat*/
// Part of this code uses TryMongo: Copyright (c) 2009 Kyle Banker
// Licensed under the MIT Licence.
// http://www.opensource.org/licenses/mit-license.php
// Readline class to handle line input.
// This application itself is also licensed under the same MIT Licence. 

/*var $htmlFormat = function (obj) {
  'use strict';
  return tojson(obj, ' ', ' ', true);
};*/

var DefaultInputHtml = function (prefix, stack, location, type) {
  'use strict';
  var linePrompt = "", i, t = (type) || 'text';
  if (stack === 0) {
    linePrompt += "<p class=\"response\">" + prefix + "@127.0.0.1" + " " + location + "</p>" +
      "<span class='prompt'> ></span>";
      return "<br /><div class='line'>" + linePrompt + "<input type='" + t + "' class='readLine active' />" + "</div>";
  } else {
    for (i = 0; i <= stack; i += 1) {
      linePrompt += "<span class='prompt'>.</span>";
    }
    return "<div class='line'>" + linePrompt + "<input type='" + t + "' class='readLine active' />" + "</div>";
  }

};

var ResetHandlerStack = function (aHandler) {
  'use strict';
  aHandler.ptr = 0;
  aHandler.current_command = "";
};

var EnterKeyCode     = 13;
var UpArrowKeyCode   = 38;
var DownArrowKeyCode = 40;

var PTAG = function (str) {
  'use strict';
  return "<pre>" + str + "</pre>";
};

var BR = function () {
  'use strict';
  return "<br/>";
};

