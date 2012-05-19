/**
 * FEATURES:
 *
 * .connect() has to load/init itself if not happened yet
 *
 *
 *
 */


var superbook = function(exports) {

	// Current version of the `superbook` library. Keep in sync with
	// `package.json`.
	var version = '0.0.1';

	// Save a reference to the global object (`window` in the browser,
	// `global` on the server).
	var root = this;

	// Save the previous value of the `superbook` variable, so that it can be,
	// restored later on, if `noConflict` is used.
	var previous_superbook = root.superbook;





	/**
	 * @function noConflict()
	 * @helper
	 * Runs superbook in *noConflict* mode, returning the `superbook` variable
	 * to its previous owner. Returns a reference to this superbook object.
	 */
	function noConflict() {
		root.superbook = previous_superbook;
		return this;
	}

	/**
	 * @function noop()
	 * @helper
	 *
	 * This is the `no callback` function that you wish to pass around as a
	 * function that will do nothing. Useful if `callback` is optional.
	 *
	 */
	function noop() {
	}

	/**
	 * @function isFunction(obj)
	 * @helper
	 * @param mixed
	 *
	 * Checks if incoming `mixed` is actually of type function.
	 *
	 */
	function isFunction(mixed) {
		return typeof(mixed) == 'function';
	}

	/**
	 * @function isObject(obj)
	 * @helper
	 * @param mixed
	 *
	 * Checks if incoming `mixed` is actually of type object (and not empty)
	 *
	 */
	function isObject(mixed) {
		var res = mixed !== null && typeof mixed == 'object';
		if (res) res = !_.isEmpty(mixed);
		return res;
	}

	/**
	 * @function isArray(arr)
	 * @helper
	 * @param mixed
	 *
	 * Checks if incoming `mixed` is actually of type array (and not empty)
	 *
	 */
	function isArray(mixed) {
		return mixed instanceof Array && mixed.length > 0;

	}

	/**
	 * @function inArray(value, array, [i])
	 * @helper
	 * @param value
	 * @param array
	 * @param i
	 *
	 * Checks if incoming `value` is in `array`, returns index if so , otherwise -1
	 *
	 */
	function inArray(value, array, i) {
		var len;
		if (array) {
			if (array.indexOf) {
				return array.indexOf.call(array, value, i);
			}
			len = array.length;
			i = i ? i < 0 ? Math.max(0, len + i) : i : 0;
			for (; i < len; i++) {
				// Skip accessing in sparse arrays
				if (i in array && array[ i ] === value) {
					return i;
				}
			}
		}
		return -1;
	}





	var _connects = {};

	function connectCreate(name) {
		return new Connect(name);
	}

	function connectGet(name, debug) {

		function getIt(name, debug) {

			if (name) {
				if (debug) return _connects[name];
				return _connects[name].connect;
			} else {
				var obj = {};
				_.each(_connects, function(value, key) {
					if (debug) {
						obj[key] = _connects[key]
					} else {
						obj[key] = _connects[key].connect
					}
				});
				return obj;
			}

		}

		if (isArray(name)) {

			// If name is of type array loop through array, call `getIt()`
			// with `debug` param and collects returns.
			var obj = {};
			_.each(name, function(value, key) {
				obj[value] = getIt(value, debug);
			});
			return obj;

		} else {
			return getIt(name, debug);
		}

	}

	function Connect(name) {

		this._name = name;

		this._events = {};

		this._availableEvents = [
			'all'
			, 'ok'
			, 'cancel'

		];

		this.availablePermissions = [

			// add permissions here:
			// https://developers.facebook.com/docs/authentication/permissions/#user_friends_perms

		];

		this._permissions = [];

		this._user = {};

		// ---

		this._connect = function() {

			var that = this
				, FB = _sdks[this._name].sdk.FB;

			superflow
				.seq(function(cb) {

					// skip!
					if (FB) return cb();

					_sdks[that._name].sdk.init(function(err, Facebook) {
						FB = Facebook;
						cb();
					});

				})
				.seq(function(cb) {

					// skip!
					if (!_.isEmpty(that._user)) return cb();

					FB.getLoginStatus(function(res) {
						_.extend(that._user, {
							authResponse : res.authResponse,
							status       : res.status
						});
						cb()
					});

				})
				.seq(function(cb) {

					// skip!
					if (that._user.authResponse !== null) return cb();

					FB.login(function(res) {
						_.extend(that._user, {
							authResponse : res.authResponse,
							status       : res.status
						});
						cb();
					}, {
						scope : that._permissions.join(',')
					});

				})
				.seq(function(cb) {

					FB.api('/me', function(data) {
						_.extend(that._user, data);
						cb();
					});

				})
				.end(function(err, res) {

					switch (that._user.authResponse) {
						case null :
							if (that._events['cancel']) {
								that._events['cancel'](null, that._user, FB);
							}
							break;
						default :
							if (that._events['ok']) {
								that._events['ok'](null, that._user, FB);
							}
							break;
					}

					if (that._events['all']) {
						that._events['all'](null, that._user, FB);
					}

				});

		};

		// ---

		_connects[this._name] = this;

		return this;

	}

	Connect.prototype.end = function() {

		// save internal representation for internal reference
		_connects[this._name] = this;

		// save callbacks for public reference via `connects.get()`
		_.extend(_connects[this._name], {
			connect : {
				name    : this._name,
				user    : this._user,
				connect : this._connect
			}
		});

		this._connect();

		// return fresh instance
		return _connects[this._name].connect;

	};

	Connect.prototype.ask = function(mixed) {

		var that = this;

		if (arguments.length > 1) {

			// ex: 'email', 'manage_pages'
			_.each(arguments, function(value, key) {
				that.ask(value);
			});


		} else {

			if (isArray(mixed)) {

				// ex: ['email', 'manage_pages']
				_.each(mixed, function(value, key) {
					that.ask(value);
				});

			} else {

				// ex: 'email'
				if (inArray(mixed, this._permissions) === -1) {
					// TODO: check if permission is available
					this._permissions.push(mixed);
				}

			}

		}

		return this;

	};

	Connect.prototype.on = function(mixed, callback) {

		var that = this;

		if (isArray(mixed)) {

			// If first param `mixed` is array it might hold a lot of things:
			// objects, key/value, key/functions, key/strings. Best way to find
			// out is looping throgh array and calling `.on()` recursively.
			_.each(mixed, function(value, key) {
				that.on(value);
			});

		} else if (isObject(mixed)) {

			// If first param `mixed` is an object it could be a single key/
			// function pair or an object of key/function pairs or the same with
			// controller strings instead of functions. To find out loop through
			// object keys and call `.on()` recursively.
			_.each(mixed, function(value, key) {
				that.on(key, value);
			});

		} else {

			// The list of allowed events that can be triggered by connect
			// is limited. Check list of allowed events before adding them.
			if (inArray(mixed, this._availableEvents) === -1) {
				console.log('[error] Event `' + evt + '` is no valid connect event. ' +
					'Valid events are: ' + this._availableEvents.join(', ') + '.');
				return false;
			}

			// If first param `mixed` is string, 2nd param must be function,
			// will be registered as event callback.
			if (callback) {
				if (isFunction(callback)) {
					this._events[mixed] = callback;
				} else {
					console.log('[error] Callback must be of type `function`.');
				}
			} else {
				return console.log('[error] Missing callback.');
			}

		}

		return this;

	};





	var _sdks = {};

	function sdkCreate(name) {
		return new Sdk(name);
	}

	function sdkGet(name, debug) {

		function getIt(name, debug) {

			if (name) {
				if (debug) return _sdks[name];
				return _sdks[name].sdk;
			} else {
				var obj = {};
				_.each(_sdks, function(value, key) {
					if (debug) {
						obj[key] = _sdks[key]
					} else {
						obj[key] = _sdks[key].sdk
					}
				});
				return obj;
			}

		}

		if (isArray(name)) {

			// If name is of type array loop through array, call `getIt()`
			// with `debug` param and collects returns.
			var obj = {};
			_.each(name, function(value, key) {
				obj[value] = getIt(value, debug);
			});
			return obj;

		} else {
			return getIt(name, debug);
		}

	}

	function Sdk(name) {

		this._name = name || 'FB';

		this._options = {

			sdkUrl : '//connect.facebook.net/en_US/all.js',
			rootId : 'fb-root'

		};

		this._FB = null;
		this._FB_init = false;
		this._FB_options = {

			appId                : null,
			cookie               : true,
			logging              : true,
			status               : true,
			xfbml                : false,
			oauth                : true,
			channelUrl           : 'fb/channel.html',
			authResponse         : 'authResponse',
			frictionlessRequests : false,
			hideFlashCallback    : null

		};

		// ---

		this._load = function(callback) {

			var that = this;

			function checkSDK() {
				return root.FB
					? true
					: false;
			}

			function checkRoot() {
				return ($('#' + that.options.rootId).length > 0);
			}

			function checkChannel(callback) {
				superagent
					.get(that.FB_options.channelUrl)
					.end(function(res) {
						if (res.ok) return callback(null, true);
						callback(true, null);
					})
			}

			function createSDK(callback) {

				Modernizr.load([
					{
						load     : (that.options.sdkUrl),
						complete : function() {
							if (root.FB.init) {
								that.FB = root.FB;
								callback(null, that.FB);
							}
						}
					}
				]);

			}

			function createRoot() {
				$(document.createElement('div'))
					.attr('id', that.options.rootId)
					.appendTo('body');
				return true;
			}

			// ---

			if (this.FB) {

				return callback(null, this.FB);

			} else {

				superflow
					.seq(function(cb) {

						// skip!
						if (checkSDK()) return cb();

						createSDK(function(err) {
							if (err) {
								console.log('Could not load SDK from ' + that.options.sdkUrl);
							} else {
								cb();
							}
						});

					})
					.seq(function(cb) {

						// skip!
						if (checkRoot()) return cb();

						createRoot();

						cb();

					})
					.seq(function(cb) {

						// skip!
						if (checkChannel(function(err, res) {
							if (err) {
								console.log('[error] No channel file at ' + that.FB_options.channelUrl + 'found. ' +
									'Add `channel.html` file to ' + that.FB_options.channelUrl + ' folder or ' +
									'change location in `.create(..., {channelUrl : "/path/to/channel.html"})`.');
								return false;
							} else {
								return cb();
							}
						}));

					})
					.end(function(err, res) {
						if (callback) callback(err, that.FB);
					});

			}

			return this;

		};

		this._init = function(callback) {

			var that = this;

			function checkSdk() {
				return that.FB;
			}

			function checkInit() {
				return that.FB_init;
			}

			function createInit() {
				that.FB.init(that.FB_options);
				that.FB_init = true;
			}

			// skip!
			if (checkInit()) return callback(null, this.FB);

			if (checkSdk()) {

				createInit();
				callback(null, this.FB);

			} else {

				superflow
					.seq(function(cb) {

						that.load(function(err) {
							if (err) return console.log('Could not load SDK.');
							cb();
						});

					})
					.seq(function(cb) {

						createInit();
						cb();

					})
					.end(function(err, res) {
						callback(null, that.FB);
					});

			}

			return this;

		};

		// ---

		_sdks[this._name] = this;

		return this;

	}

	Sdk.prototype.end = function() {

		// save internal representation for internal reference
		_sdks[this._name] = this;

		// save callbacks for public reference via `sdks.get()`
		_.extend(_sdks[this._name], {
			sdk : {
				name       : this._name,
				options    : this._options,
				load       : this._load,
				init       : this._init,
				FB         : this._FB,
				FB_init    : this._FB_init,
				FB_options : this._FB_options
			}
		});

		// return fresh instance
		return _sdks[this._name].sdk;

	};

	Sdk.prototype.id = function(id) {
		this._FB_options.appId = id;
		return this;
	};

	/**
	 * @method .is(mixed, [value])
	 * @public
	 * @prototype
	 * @param mixed
	 * @param value
	 *
	 * Sets Facebook's init options.
	 *
	 *      // name/value
	 *      .is('status', false);
	 *
	 *      // name/function
	 *      // context is model's `this`
	 *      .is('status', function() {
	 *          return (1 === 1);
	 *      });
	 *
	 *      // obj of name/value or name/function
	 *      .on({
	 *          'status'  : false,
	 *          'logging' : function() {
	 *              return (1 === 1);
	 *          }
	 *      });
	 *
	 *      // arr of obj of name/function
	 *      .on([
	 *          { status  : false },
	 *          { logging : function() {
	 *              return (1 === 1);
	 *          } }
	 *      ])
	 *
	 */

	Sdk.prototype.is = function(mixed, value) {

		var that = this;

		if (isArray(mixed)) {

			// If first param `mixed` is array it might hold a lot of things:
			// objects, key/value, key/functions, key/strings. Best way to find
			// out is looping throgh array and calling `.is()` recursively.
			_.each(mixed, function(value, key) {
				that.is(value);
			});

		} else if (isObject(mixed)) {

			// If first param `mixed` is an object it could be a single key/
			// function pair or an object of key/function pairs or the same with
			// controller strings instead of functions. To find out loop through
			// object keys and call `.is()` recursively.
			_.each(mixed, function(value, key) {
				that.is(key, value);
			});

		} else {

			// Check if incoming attribute name is allowed, just check if attribute
			// name is key in default `_FB_options` object.
			if (!this._FB_options.hasOwnProperty(mixed)) return this;

			// If first param `mixed` is string, next steps depend on type of
			// 2nd param `value`. This might be either a `function` or  something
			// else If it is of type `function`, functions result will be saved
			// as attibute's value.
			if (isFunction(value)) {
				this._FB_options[mixed] = value();
			} else {
				this._FB_options[mixed] = value;
			}

		}

		return this;

	};





	var _uses = {};

	function useCreate(name, callback) {
		return new Use(name, callback);
	}

	function Use(name, callback) {

		this._sdk = _sdks[name].sdk;

		this._sdk.init(function(err, FB) {
			callback(err, FB);
		});

	}

	Use.prototype.end = noop;





	exports = {

		version    : version,
		noConflict : noConflict,

		// ---

		sdks     : {
			get : sdkGet
		},
		SDK      : {
			create : sdkCreate
		},
		connects : {
			get : connectGet
		},
		Connect  : {
			create : connectCreate
		},

		// --- Shortcuts

		connect : connectCreate,
		create  : sdkCreate,
		get     : sdkGet,
		use     : useCreate

	};

	return exports;





}({});
