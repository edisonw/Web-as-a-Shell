
		//From: https://github.com/kenotron/sourcekit/blob/master/src/dropbox/dropbox.js
		/*
		 * Copyright 2008 Netflix, Inc.
		 *
		 * Licensed under the Apache License, Version 2.0 (the "License");
		 * you may not use this file except in compliance with the License.
		 * You may obtain a copy of the License at
		 *
		 *     http://www.apache.org/licenses/LICENSE-2.0
		 *
		 * Unless required by applicable law or agreed to in writing, software
		 * distributed under the License is distributed on an "AS IS" BASIS,
		 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
		 * See the License for the specific language governing permissions and
		 * limitations under the License.
		 */

		/* Here's some JavaScript software for implementing OAuth.

		   This isn't as useful as you might hope.  OAuth is based around
		   allowing tools and websites to talk to each other.  However,
		   JavaScript running in web browsers is hampered by security
		   restrictions that prevent code running on one website from
		   accessing data stored or served on another.

		   Before you start hacking, make sure you understand the limitations
		   posed by cross-domain XMLHttpRequest.

		   On the bright side, some platforms use JavaScript as their
		   language, but enable the programmer to access other web sites.
		   Examples include Google Gadgets, and Microsoft Vista Sidebar.
		   For those platforms, this library should come in handy.
		*/

		// The HMAC-SHA1 signature method calls b64_hmac_sha1, defined by
		// http://pajhome.org.uk/crypt/md5/sha1.js

		/* An OAuth message is represented as an object like this:
		   {method: "GET", action: "http://server.com/path", parameters: ...}

		   The parameters may be either a map {name: value, name2: value2}
		   or an Array of name-value pairs [[name, value], [name2, value2]].
		   The latter representation is more powerful: it supports parameters
		   in a specific sequence, or several parameters with the same name;
		   for example [["a", 1], ["b", 2], ["a", 3]].

		   Parameter names and values are NOT percent-encoded in an object.
		   They must be encoded before transmission and decoded after reception.
		   For example, this message object:
		   {method: "GET", action: "http://server/path", parameters: {p: "x y"}}
		   ... can be transmitted as an HTTP request that begins:
		   GET /path?p=x%20y HTTP/1.0
		   (This isn't a valid OAuth request, since it lacks a signature etc.)
		   Note that the object "x y" is transmitted as x%20y.  To encode
		   parameters, you can call OAuth.addToURL, OAuth.formEncode or
		   OAuth.getAuthorization.

		   This message object model harmonizes with the browser object model for
		   input elements of an form, whose value property isn't percent encoded.
		   The browser encodes each value before transmitting it. For example,
		   see consumer.setInputs in example/consumer.js.
		 */

		/* This script needs to know what time it is. By default, it uses the local
		   clock (new Date), which is apt to be inaccurate in browsers. To do
		   better, you can load this script from a URL whose query string contains
		   an oauth_timestamp parameter, whose value is a current Unix timestamp.
		   For example, when generating the enclosing document using PHP:

		   <script src="oauth.js?oauth_timestamp=<?=time()?>" ...

		   Another option is to call OAuth.correctTimestamp with a Unix timestamp.
		 */
		var OAuth; if (OAuth == null) OAuth = {};
		OAuth.setProperties = function setProperties(into, from) {
		    if (into != null && from != null) {
		        for (var key in from) {
		            into[key] = from[key];
		        }
		    }
		    return into;
		}

		OAuth.setProperties(OAuth, // utility functions
		{
		    percentEncode: function percentEncode(s) {
		        if (s == null) {
		            return "";
		        }
		        if (s instanceof Array) {
		            var e = "";
		            for (var i = 0; i < s.length; ++s) {
		                if (e != "") e += '&';
		                e += OAuth.percentEncode(s[i]);
		            }
		            return e;
		        }
		        s = encodeURIComponent(s);
		        // Now replace the values which encodeURIComponent doesn't do
		        // encodeURIComponent ignores: - _ . ! ~ * ' ( )
		        // OAuth dictates the only ones you can ignore are: - _ . ~
		        // Source: http://developer.mozilla.org/en/docs/Core_JavaScript_1.5_Reference:Global_Functions:encodeURIComponent
		        s = s.replace(/\!/g, "%21");
		        s = s.replace(/\*/g, "%2A");
		        s = s.replace(/\'/g, "%27");
		        s = s.replace(/\(/g, "%28");
		        s = s.replace(/\)/g, "%29");
		        return s;
		    }
		,
		    decodePercent: function decodePercent(s) {
		        if (s != null) {
		            // Handle application/x-www-form-urlencoded, which is defined by
		            // http://www.w3.org/TR/html4/interact/forms.html#h-17.13.4.1
		            s = s.replace(/\+/g, " ");
		        }
		        return decodeURIComponent(s);
		    }
		,
		    /** Convert the given parameters to an Array of name-value pairs. */
		    getParameterList: function getParameterList(parameters) {
		        if (parameters == null) {
		            return [];
		        }
		        if (typeof parameters != "object") {
		            return OAuth.decodeForm(parameters + "");
		        }
		        if (parameters instanceof Array) {
		            return parameters;
		        }
		        var list = [];
		        for (var p in parameters) {
		            list.push([p, parameters[p]]);
		        }
		        return list;
		    }
		,
		    /** Convert the given parameters to a map from name to value. */
		    getParameterMap: function getParameterMap(parameters) {
		        if (parameters == null) {
		            return {};
		        }
		        if (typeof parameters != "object") {
		            return OAuth.getParameterMap(OAuth.decodeForm(parameters + ""));
		        }
		        if (parameters instanceof Array) {
		            var map = {};
		            for (var p = 0; p < parameters.length; ++p) {
		                var key = parameters[p][0];
		                if (map[key] === undefined) { // first value wins
		                    map[key] = parameters[p][1];
		                }
		            }
		            return map;
		        }
		        return parameters;
		    }
		,
		    getParameter: function getParameter(parameters, name) {
		        if (parameters instanceof Array) {
		            for (var p = 0; p < parameters.length; ++p) {
		                if (parameters[p][0] == name) {
		                    return parameters[p][1]; // first value wins
		                }
		            }
		        } else {
		            return OAuth.getParameterMap(parameters)[name];
		        }
		        return null;
		    }
		,
		    formEncode: function formEncode(parameters) {
		        var form = "";
		        var list = OAuth.getParameterList(parameters);
		        for (var p = 0; p < list.length; ++p) {
		            var value = list[p][1];
		            if (value == null) value = "";
		            if (form != "") form += '&';
		            form += OAuth.percentEncode(list[p][0])
		              +'='+ OAuth.percentEncode(value);
		        }
		        return form;
		    }
		,
		    decodeForm: function decodeForm(form) {
		        var list = [];
		        var nvps = form.split('&');
		        for (var n = 0; n < nvps.length; ++n) {
		            var nvp = nvps[n];
		            if (nvp == "") {
		                continue;
		            }
		            var equals = nvp.indexOf('=');
		            var name;
		            var value;
		            if (equals < 0) {
		                name = OAuth.decodePercent(nvp);
		                value = null;
		            } else {
		                name = OAuth.decodePercent(nvp.substring(0, equals));
		                value = OAuth.decodePercent(nvp.substring(equals + 1));
		            }
		            list.push([name, value]);
		        }
		        return list;
		    }
		,
		    setParameter: function setParameter(message, name, value) {
		        var parameters = message.parameters;
		        if (parameters instanceof Array) {
		            for (var p = 0; p < parameters.length; ++p) {
		                if (parameters[p][0] == name) {
		                    if (value === undefined) {
		                        parameters.splice(p, 1);
		                    } else {
		                        parameters[p][1] = value;
		                        value = undefined;
		                    }
		                }
		            }
		            if (value !== undefined) {
		                parameters.push([name, value]);
		            }
		        } else {
		            parameters = OAuth.getParameterMap(parameters);
		            parameters[name] = value;
		            message.parameters = parameters;
		        }
		    }
		,
		    setParameters: function setParameters(message, parameters) {
		        var list = OAuth.getParameterList(parameters);
		        for (var i = 0; i < list.length; ++i) {
		            OAuth.setParameter(message, list[i][0], list[i][1]);
		        }
		    }
		,
		    /** Fill in parameters to help construct a request message.
		        This function doesn't fill in every parameter.
		        The accessor object should be like:
		        {consumerKey:'foo', consumerSecret:'bar', accessorSecret:'nurn', token:'krelm', tokenSecret:'blah'}
		        The accessorSecret property is optional.
		     */
		    completeRequest: function completeRequest(message, accessor) {
		        if (message.method == null) {
		            message.method = "GET";
		        }
		        var map = OAuth.getParameterMap(message.parameters);
		        if (map.oauth_consumer_key == null) {
		            OAuth.setParameter(message, "oauth_consumer_key", accessor.consumerKey || "");
		        }
		        if (map.oauth_token == null && accessor.token != null) {
		            OAuth.setParameter(message, "oauth_token", accessor.token);
		        }
		        if (map.oauth_version == null) {
		            OAuth.setParameter(message, "oauth_version", "1.0");
		        }
		        if (map.oauth_timestamp == null) {
		            OAuth.setParameter(message, "oauth_timestamp", OAuth.timestamp());
		        }
		        if (map.oauth_nonce == null) {
		            OAuth.setParameter(message, "oauth_nonce", OAuth.nonce(6));
		        }
		        OAuth.SignatureMethod.sign(message, accessor);
		    }
		,
		    setTimestampAndNonce: function setTimestampAndNonce(message) {
		        OAuth.setParameter(message, "oauth_timestamp", OAuth.timestamp());
		        OAuth.setParameter(message, "oauth_nonce", OAuth.nonce(6));
		    }
		,
		    addToURL: function addToURL(url, parameters) {
		        newURL = url;
		        if (parameters != null) {
		            var toAdd = OAuth.formEncode(parameters);
		            if (toAdd.length > 0) {
		                var q = url.indexOf('?');
		                if (q < 0) newURL += '?';
		                else       newURL += '&';
		                newURL += toAdd;
		            }
		        }
		        return newURL;
		    }
		,
		    /** Construct the value of the Authorization header for an HTTP request. */
		    getAuthorizationHeader: function getAuthorizationHeader(realm, parameters) {
		        var header = 'OAuth realm="' + OAuth.percentEncode(realm) + '"';
		        var list = OAuth.getParameterList(parameters);
		        for (var p = 0; p < list.length; ++p) {
		            var parameter = list[p];
		            var name = parameter[0];
		            if (name.indexOf("oauth_") == 0) {
		                header += ',' + OAuth.percentEncode(name) + '="' + OAuth.percentEncode(parameter[1]) + '"';
		            }
		        }
		        return header;
		    }
		,
		    /** Correct the time using a parameter from the URL from which the last script was loaded. */
		    correctTimestampFromSrc: function correctTimestampFromSrc(parameterName) {
		        parameterName = parameterName || "oauth_timestamp";
		        var scripts = document.getElementsByTagName('script');
		        if (scripts == null || !scripts.length) return;
		        var src = scripts[scripts.length-1].src;
		        if (!src) return;
		        var q = src.indexOf("?");
		        if (q < 0) return;
		        parameters = OAuth.getParameterMap(OAuth.decodeForm(src.substring(q+1)));
		        var t = parameters[parameterName];
		        if (t == null) return;
		        OAuth.correctTimestamp(t);
		    }
		,
		    /** Generate timestamps starting with the given value. */
		    correctTimestamp: function correctTimestamp(timestamp) {
		        OAuth.timeCorrectionMsec = (timestamp * 1000) - (new Date()).getTime();
		    }
		,
		    /** The difference between the correct time and my clock. */
		    timeCorrectionMsec: 0
		,
		    timestamp: function timestamp() {
		        var t = (new Date()).getTime() + OAuth.timeCorrectionMsec;
		        return Math.floor(t / 1000);
		    }
		,
		    nonce: function nonce(length) {
		        var chars = OAuth.nonce.CHARS;
		        var result = "";
		        for (var i = 0; i < length; ++i) {
		            var rnum = Math.floor(Math.random() * chars.length);
		            result += chars.substring(rnum, rnum+1);
		        }
		        return result;
		    }
		});

		OAuth.nonce.CHARS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz";

		/** Define a constructor function,
		    without causing trouble to anyone who was using it as a namespace.
		    That is, if parent[name] already existed and had properties,
		    copy those properties into the new constructor.
		 */
		OAuth.declareClass = function declareClass(parent, name, newConstructor) {
		    var previous = parent[name];
		    parent[name] = newConstructor;
		    if (newConstructor != null && previous != null) {
		        for (var key in previous) {
		            if (key != "prototype") {
		                newConstructor[key] = previous[key];
		            }
		        }
		    }
		    return newConstructor;
		}

		/** An abstract algorithm for signing messages. */
		OAuth.declareClass(OAuth, "SignatureMethod", function OAuthSignatureMethod(){});

		OAuth.setProperties(OAuth.SignatureMethod.prototype, // instance members
		{
		    /** Add a signature to the message. */
		    sign: function sign(message) {
		        var baseString = OAuth.SignatureMethod.getBaseString(message);
		        var signature = this.getSignature(baseString);
		        OAuth.setParameter(message, "oauth_signature", signature);
		        return signature; // just in case someone's interested
		    }
		,
		    /** Set the key string for signing. */
		    initialize: function initialize(name, accessor) {
		        var consumerSecret;
		        if (accessor.accessorSecret != null
		            && name.length > 9
		            && name.substring(name.length-9) == "-Accessor")
		        {
		            consumerSecret = accessor.accessorSecret;
		        } else {
		            consumerSecret = accessor.consumerSecret;
		        }
		        this.key = OAuth.percentEncode(consumerSecret)
		             +"&"+ OAuth.percentEncode(accessor.tokenSecret);
		    }
		});

		/* SignatureMethod expects an accessor object to be like this:
		   {tokenSecret: "lakjsdflkj...", consumerSecret: "QOUEWRI..", accessorSecret: "xcmvzc..."}
		   The accessorSecret property is optional.
		 */
		// Class members:
		OAuth.setProperties(OAuth.SignatureMethod, // class members
		{
		    sign: function sign(message, accessor) {
		        var name = OAuth.getParameterMap(message.parameters).oauth_signature_method;
		        if (name == null || name == "") {
		            name = "HMAC-SHA1";
		            OAuth.setParameter(message, "oauth_signature_method", name);
		        }
		        OAuth.SignatureMethod.newMethod(name, accessor).sign(message);
		    }
		,
		    /** Instantiate a SignatureMethod for the given method name. */
		    newMethod: function newMethod(name, accessor) {
		        var impl = OAuth.SignatureMethod.REGISTERED[name];
		        if (impl != null) {
		            var method = new impl();
		            method.initialize(name, accessor);
		            return method;
		        }
		        var err = new Error("signature_method_rejected");
		        var acceptable = "";
		        for (var r in OAuth.SignatureMethod.REGISTERED) {
		            if (acceptable != "") acceptable += '&';
		            acceptable += OAuth.percentEncode(r);
		        }
		        err.oauth_acceptable_signature_methods = acceptable;
		        throw err;
		    }
		,
		    /** A map from signature method name to constructor. */
		    REGISTERED : {}
		,
		    /** Subsequently, the given constructor will be used for the named methods.
		        The constructor will be called with no parameters.
		        The resulting object should usually implement getSignature(baseString).
		        You can easily define such a constructor by calling makeSubclass, below.
		     */
		    registerMethodClass: function registerMethodClass(names, classConstructor) {
		        for (var n = 0; n < names.length; ++n) {
		            OAuth.SignatureMethod.REGISTERED[names[n]] = classConstructor;
		        }
		    }
		,
		    /** Create a subclass of OAuth.SignatureMethod, with the given getSignature function. */
		    makeSubclass: function makeSubclass(getSignatureFunction) {
		        var superClass = OAuth.SignatureMethod;
		        var subClass = function() {
		            superClass.call(this);
		        };
		        subClass.prototype = new superClass();
		        // Delete instance variables from prototype:
		        // delete subclass.prototype... There aren't any.
		        subClass.prototype.getSignature = getSignatureFunction;
		        subClass.prototype.constructor = subClass;
		        return subClass;
		    }
		,
		    getBaseString: function getBaseString(message) {
		        var URL = message.action;
		        var q = URL.indexOf('?');
		        var parameters;
		        if (q < 0) {
		            parameters = message.parameters;
		        } else {
		            // Combine the URL query string with the other parameters:
		            parameters = OAuth.decodeForm(URL.substring(q + 1));
		            var toAdd = OAuth.getParameterList(message.parameters);
		            for (var a = 0; a < toAdd.length; ++a) {
		                parameters.push(toAdd[a]);
		            }
		        }
		        return OAuth.percentEncode(message.method.toUpperCase())
		         +'&'+ OAuth.percentEncode(OAuth.SignatureMethod.normalizeUrl(URL))
		         +'&'+ OAuth.percentEncode(OAuth.SignatureMethod.normalizeParameters(parameters));
		    }
		,
		    normalizeUrl: function normalizeUrl(url) {
		        var uri = OAuth.SignatureMethod.parseUri(url);
		        var scheme = uri.protocol.toLowerCase();
		        var authority = uri.authority.toLowerCase();
		        var dropPort = (scheme == "http" && uri.port == 80)
		                    || (scheme == "https" && uri.port == 443);
		        if (dropPort) {
		            // find the last : in the authority
		            var index = authority.lastIndexOf(":");
		            if (index >= 0) {
		                authority = authority.substring(0, index);
		            }
		        }
		        var path = uri.path;
		        if (!path) {
		            path = "/"; // conforms to RFC 2616 section 3.2.2
		        }
		        // we know that there is no query and no fragment here.
		        return scheme + "://" + authority + path;
		    }
		,
		    parseUri: function parseUri (str) {
		        /* This function was adapted from parseUri 1.2.1
		           http://stevenlevithan.com/demo/parseuri/js/assets/parseuri.js
		         */
		        var o = {key: ["source","protocol","authority","userInfo","user","password","host","port","relative","path","directory","file","query","anchor"],
		                 parser: {strict: /^(?:([^:\/?#]+):)?(?:\/\/((?:(([^:@\/]*):?([^:@\/]*))?@)?([^:\/?#]*)(?::(\d*))?))?((((?:[^?#\/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/ }};
		        var m = o.parser.strict.exec(str);
		        var uri = {};
		        var i = 14;
		        while (i--) uri[o.key[i]] = m[i] || "";
		        return uri;
		    }
		,
		    normalizeParameters: function normalizeParameters(parameters) {
		        if (parameters == null) {
		            return "";
		        }
		        var list = OAuth.getParameterList(parameters);
		        var sortable = [];
		        for (var p = 0; p < list.length; ++p) {
		            var nvp = list[p];
		            if (nvp[0] != "oauth_signature") {
		                sortable.push([ OAuth.percentEncode(nvp[0])
		                              + " " // because it comes before any character that can appear in a percentEncoded string.
		                              + OAuth.percentEncode(nvp[1])
		                              , nvp]);
		            }
		        }
		        sortable.sort(function(a,b) {
		                          if (a[0] < b[0]) return  -1;
		                          if (a[0] > b[0]) return 1;
		                          return 0;
		                      });
		        var sorted = [];
		        for (var s = 0; s < sortable.length; ++s) {
		            sorted.push(sortable[s][1]);
		        }
		        return OAuth.formEncode(sorted);
		    }
		});

		OAuth.SignatureMethod.registerMethodClass(["PLAINTEXT", "PLAINTEXT-Accessor"],
		    OAuth.SignatureMethod.makeSubclass(
		        function getSignature(baseString) {
		            return this.key;
		        }
		    ));

		OAuth.SignatureMethod.registerMethodClass(["HMAC-SHA1", "HMAC-SHA1-Accessor"],
		    OAuth.SignatureMethod.makeSubclass(
		        function getSignature(baseString) {
		            b64pad = '=';
		            var signature = b64_hmac_sha1(this.key, baseString);
		            return signature;
		        }
		    ));

		try {
		    OAuth.correctTimestampFromSrc();
		} catch(e) {
		}
		var Dropbox = function(consumerKey, consumerSecret) {
				    // Constructor / Private
				    var _consumerKey = consumerKey;
				    var _consumerSecret = consumerSecret;

				    var _tokens = {};
				    var _storagePrefix = "moderndropbox_";
				    var _authCallback = "";
				    var _fileListLimit = 10000;
				    var _dropboxApiVersion = 0;

				    var _serialize = function(a) {
				        serialized = [];

				        for (var key in a) {
				            var value = a[key];
				            serialized[ serialized.length ] = encodeURIComponent(key) + "=" + encodeURIComponent(value);
				        }

				        return serialized.join("&").replace(/%20/g, "+");
				    };

				    var _ajax = function(options) {
				        var serializedData = null;

				        if (!options.type) {
				            options.type = "GET";
				        }

				        if (options.type == "GET") {
				            options.url = options.url + "?" + _serialize(options.data);
				        } else if (options.type == "POST") {
				            serializedData = _serialize(options.data);
				        }

				        if (options.async == null) {
				            options.async = true;
				        }

				        var _xhr = new XMLHttpRequest();

				        _xhr.open(options.type, options.url, options.async);
				        _xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
				        _xhr.setRequestHeader("Accept", "application/json, text/javascript, */*");
				        _xhr.dataType = options.dataType;

				        if (options.async) { // Asynchronous
				            _xhr.onreadystatechange = (function() {
				                if (this.readyState == 4 && this.status == 200) {
				                    var data = this.responseText;
				                    if (this.dataType == "json") {
				                        data = JSON.parse(this.responseText);
				                    }
				                    options.success(data, this.status, this);
				                } else if (this.readState == 4) {
				                    var data = this.responseText;
				                    if (this.dataType == "json") {
				                        data = JSON.parse(this.responseText);
				                    }

				                    options.error(data, this.status, this);
				                }
				            }).bind(_xhr);

				            _xhr.onerror = options.error;

				            _xhr.send(serializedData);
				        } else { // Synchronous
				            _xhr.send(serializedData);
				            var data = _xhr.responseText;
				            if (_xhr.dataType == "json") {
				                data = JSON.parse(_xhr.responseText);
				            }

				            return data;
				        }
				    };

				    var _ajaxSendFileContents = function(options) {
				        var message = options.message;
				        var filename = options.filename;
				        var content = options.content;
				        var success = options.success;
				        var error = options.error;

				        var _xhr = new XMLHttpRequest();
				        _xhr.open("POST", message.action, true);

				        var boundary = '---------------------------';
				        boundary += Math.floor(Math.random() * 32768);
				        boundary += Math.floor(Math.random() * 32768);
				        boundary += Math.floor(Math.random() * 32768);
				        _xhr.setRequestHeader("Content-Type", 'multipart/form-data; boundary=' + boundary);

				        var body = '';

				        for (i in message.parameters) {
				            body += '--' + boundary + '\r\n' + 'Content-Disposition: form-data; name="';
				            body += message.parameters[i][0];
				            body += '"\r\n\r\n';
				            body += message.parameters[i][1];
				            body += '\r\n';
				        }

				        body += '--' + boundary + "\r\n";
				        body += "Content-Disposition: form-data; name=file; filename=" + filename + "\r\n";
				        body += "Content-type: application/octet-stream\r\n\r\n";
				        body += content;
				        body += "\r\n";
				        body += '--' + boundary + '--';

				        _xhr.onreadystatechange = (function() {
				            if (this.readyState == 4 && this.status == 200) {
				                success();
				            } else if (this.readState == 4) {
				                error();
				            }
				        }).bind(_xhr);

				        _xhr.onerror = error;

				        _xhr.send(body);
				    };

				    var _setAuthCallback = function(callback) {
				        _authCallback = callback;
				    };

				    var _setupAuthStorage = function() {
				        keys = ["requestToken", "requestTokenSecret", "accessToken", "accessTokenSecret"];

				        for (i in keys) {
				            var key = keys[i];
				            value = localStorage.getItem(_storagePrefix + key);
				            if (value) {
				                _tokens[key] = value;
				            }
				        }
				    };

				    var _clearAuthStorage = function() {
				        keys = ["requestToken", "requestTokenSecret", "accessToken", "accessTokenSecret"];

				        for (i in keys) {
				            var key = keys[i];
				            localStorage.removeItem(_storagePrefix + key);
				            _tokens = {};
				        }
				    };

				    var _storeAuth = function(valueMap) {
				        keys = ["requestToken", "requestTokenSecret", "accessToken", "accessTokenSecret"];

				        for (i in keys) {
				            var key = keys[i];

				            if (valueMap[key]) {
				                localStorage.setItem(_storagePrefix + key, valueMap[key]);
				                _tokens[key] = valueMap[key];
				            }
				        }
				    };

				    var _createOauthRequest = function(url, options) {
				        if (!options) {
				            options = [];
				        }

				        // Outline the message
				        var message = {
				            action: url,
				            method: "GET",
				            parameters: [
				                ["oauth_consumer_key", _consumerKey],
				                ["oauth_signature_method", "HMAC-SHA1"]
				            ]
				        };

				        // Define the accessor
				        var accessor = {
				            consumerSecret: _consumerSecret,
				        };

				        if (!options.token) { // Token wasn't passed in with the request - look up localStorage
				            if (_tokens["accessToken"]) {  // In case of trying to gain temporary credentials (request token)
				                message.parameters.push(["oauth_token", _tokens["accessToken"]]);
				            } else if (_tokens["requestToken"]) {
				                message.parameters.push(["oauth_token", _tokens["requestToken"]]);
				            }
				        } else {
				            message.parameters.push(["oauth_token", options.token]);
				            delete options.token;
				        }

				        if (!options.tokenSecret) {
				            accessor.tokenSecret = _tokens["accessTokenSecret"];
				        } else {
				            accessor.tokenSecret = options.tokenSecret;
				            delete options.tokenSecret;
				        }

				        if (options.method) {
				            message.method = options.method;
				            delete options.method;
				        }

				        for (key in options) {
				            message.parameters.push([key, options[key]]);
				        }

				        OAuth.setTimestampAndNonce(message);
				        OAuth.SignatureMethod.sign(message, accessor);

				        return message;
				    };

				    var _sendOauthRequest = function(message, options) {
				        if (!options) {
				            options = [];
				        }

				        if (!options.success) {
				            options.success = function() {};
				        }

				        if (!options.error) {
				            options.error = function() {};
				        }

				        if (!options.type) {
				            options.type = "json";
				        }

				        if (options.async === null) {
				            options.async = true;
				        }

				        if (options.multipart) {
				            return _ajaxSendFileContents({
				                message: message,
				                filename: options.filename,
				                content: options.content,
				                success: options.success,
				                error: options.error
				            });
				        } else {
				            return _ajax({
				                async: options.async,
				                url: message.action,
				                type: message.method,
				                data: OAuth.getParameterMap(message.parameters),
				                dataType: options.type,
				                success: options.success,
				                error: options.error            });
				        }
				    };

				    // Public
				    return ({
				        isAccessGranted: function() {
				            return (_tokens["accessToken"] != null) && (_tokens["accessTokenSecret"] != null);
				        },

				        isAuthorized: function() {
				            return (_tokens["requestToken"] != null) && (_tokens["requestTokenSecret"] != null);
				        },

				        initialize: function() {
				            _setupAuthStorage();
				            return this;
				        },

				        authorize: function(callback, error_callback) {
				            if (!_tokens['accessToken'] && !_tokens['accessTokenSecret']) {
				                if (!_tokens['requestToken'] && !_tokens['requestTokenSecret']) { // Step 1
				                    var requestTokenUrl = "https://www.dropbox.com/" + _dropboxApiVersion + "/oauth/request_token";
				                    var authorizeUrl = "https://www.dropbox.com/" + _dropboxApiVersion + "/oauth/authorize";
				                    var message = _createOauthRequest(requestTokenUrl);

				                    _sendOauthRequest(message, {
				                        type: "text",
				                        success: (function(data) {
				                            var pairs = data.split(/\&/);
				                            for (var i in pairs) {
				                                var keyValueArray = pairs[i].split(/\=/);
				                                var key = keyValueArray[0];
				                                var value = keyValueArray[1];

				                                if (key == 'oauth_token') {
				                                    _tokens['requestToken'] = value;
				                                } else if (key == 'oauth_token_secret') {
				                                    _tokens['requestTokenSecret'] = value;
				                                }
				                            }

				                            // Chrome specific things
				                            chrome.tabs.getCurrent((function(tab) {
				                                chrome.tabs.create({ url: authorizeUrl + "?oauth_token=" + _tokens['requestToken'], selected: true }, (function(dropboxTab) {
				                                    chrome.tabs.onUpdated.addListener((function(tabId, changeInfo, tab) {
				                                        if (tabId == dropboxTab.id && tab.title.indexOf("API Request Authorized") != -1) {
				                                            // Recurse, next step!
				                                            this.authorize(callback, error_callback);
				                                            chrome.tabs.remove(tabId);
				                                        }
				                                    }).bind(this));
				                                }).bind(this));
				                            }).bind(this));
				                        }).bind(this),
				                        error: function(data) { if (error_callback) { error_callback(data); } },
				                    });
				                } else { // Step 2
				                    var accessTokenUrl = "https://www.dropbox.com/" + _dropboxApiVersion + "/oauth/access_token";
				                    var message = _createOauthRequest(accessTokenUrl);

				                    _sendOauthRequest(message, {
				                        type: "text",
				                        success: function(data) {
				                            var pairs = data.split(/\&/);
				                            for (var i in pairs) {
				                                var keyValueArray = pairs[i].split(/\=/);
				                                var key = keyValueArray[0];
				                                var value = keyValueArray[1];

				                                if (key == 'oauth_token') {
				                                    _tokens['accessToken'] = value;
				                                } else if (key == 'oauth_token_secret') {
				                                    _tokens['accessTokenSecret'] = value;
				                                }
				                            }

				                            var authTokens = {};
				                            authTokens['accessToken'] = _tokens['accessToken'];
				                            authTokens['accessTokenSecret'] = _tokens['accessTokenSecret'];
				                            _storeAuth(authTokens);
				                            callback();
				                        },
				                        error: function(data) { if (error_callback) { error_callback(data); } },
				                    });
				                }
				            } else {
				                callback();
				            }
				        },

				        deauthorize: function() {
				            _clearAuthStorage();
				        },

				        getAccountInfo: function(callback) {
				            var url = "https://www.dropbox.com/" + _dropboxApiVersion + "/account/info";
				            var message = _createOauthRequest(url);
				            _sendOauthRequest(message, {
				                type: "json",
				                success: (function(data) { callback(data); }).bind(this)
				            });
				        },

				        getDirectoryContents: function(path, callback) {
				            if (path != null) {
				                var filename = path.replace(/^\//, '');
				                var url = "https://www.dropbox.com/" + _dropboxApiVersion + "/metadata/dropbox/" + escape(filename);
				                var message = _createOauthRequest(url, {
				                    file_limit: _fileListLimit,
				                    list: "true"
				                });

				                _sendOauthRequest(message, {
				                    type: "json",
				                    success: (function(data) { callback(data); }).bind(this),
				                    error: this.errorHandler.bind(this)
				                });
				            }
				        },

				        getMetadata: function(path, callback) {
				            var filename = path.replace(/^\//, '');
				            var url = "https://www.dropbox.com/" + _dropboxApiVersion + "/metadata/dropbox/" + escape(filename);
				            var message = _createOauthRequest(url, {
				                list: "false"
				            });

				            _sendOauthRequest(message, {
				                type: "json",
				                success: (function(data) { callback(data); }).bind(this)
				            });
				        },

				        getFileContents: function(path, callback) {
				            var filename = path.replace(/^\//, '');
				            var url = "https://api-content.dropbox.com/" + _dropboxApiVersion + "/files/dropbox/" + escape(filename);
				            var message = _createOauthRequest(url);

				            if (callback) {
				                _sendOauthRequest(message, {
				                    type: "text",
				                    success: (function(data) { callback(data); }).bind(this)
				                });
				            } else {
				                return _sendOauthRequest(message, {
				                    type: "text",
				                    async: false
				                });
				            }
				        },

				        putFileContents: function(path, content, callback) {
				            var filename = path.match(/([^\\\/]+)$/)[1];
				            var file_path = path.match(/^(.*?)[^\\\/]+$/)[1];
				            file_path = file_path.replace(/^\//, '')
				            var url = "https://api-content.dropbox.com/" + _dropboxApiVersion + "/files/dropbox/" + escape(file_path) + "?file=" + escape(filename);
				            var message = _createOauthRequest(url, { method: "POST" });

				            _sendOauthRequest(message, {
				                multipart: true,
				                content: content,
				                filename: filename,
				                success: (function(data) { callback(data); }).bind(this)
				            });
				        },

				        createDirectory: function(path, callback) {
				            var url = "https://www.dropbox.com/" + _dropboxApiVersion + "/fileops/create_folder";
				            var message = _createOauthRequest(url, {
				                path: path,
				                root: 'dropbox'
				            });
				            _sendOauthRequest(message, {
				                type: "json",
				                success: (function(data) { if (callback) { callback(data); } }).bind(this)
				            });
				        },

				        deletePath: function(path, callback) {
				            var url = "https://www.dropbox.com/" + _dropboxApiVersion + "/fileops/delete";
				            var message = _createOauthRequest(url, {
				                path: path,
				                root: 'dropbox'
				            });
				            _sendOauthRequest(message, {
				                type: "json",
				                success: (function(data) { if (callback) { callback(data); } }).bind(this)
				            });
				        },

				        logOutDropbox: function() {
				            _clearAuthStorage();
				        },

				        errorHandler: function(data) {
				            console.error(data);
				        }
				    }).initialize();
		};