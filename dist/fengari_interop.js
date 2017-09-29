(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory(require("fengari"));
	else if(typeof define === 'function' && define.amd)
		define(["fengari"], factory);
	else if(typeof exports === 'object')
		exports["fengari_interop"] = factory(require("fengari"));
	else
		root["fengari_interop"] = factory(root["fengari"]);
})(this, function(__WEBPACK_EXTERNAL_MODULE_1__) {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var fengari = __webpack_require__(1);
var lua = fengari.lua;
var lauxlib = fengari.lauxlib;
var lualib = fengari.lualib;

var custom_inspect_symbol = void 0;
try {
	/* for node.js */
	custom_inspect_symbol = __webpack_require__(2).inspect.custom;
} catch (e) {}

var apply = Reflect.apply;
var construct = Reflect.construct;

var toString = function toString(o) {
	return "" + o;
};

var isobject = function isobject(o) {
	return (typeof o === 'undefined' ? 'undefined' : _typeof(o)) === "object" ? o !== null : typeof o === "function";
};

var js_tname = lua.to_luastring("js object");

var testjs = function testjs(L, idx) {
	var u = lauxlib.luaL_testudata(L, idx, js_tname);
	if (u) return u.data;else return void 0;
};

var checkjs = function checkjs(L, idx) {
	return lauxlib.luaL_checkudata(L, idx, js_tname).data;
};

var pushjs = function pushjs(L, v) {
	var b = lua.lua_newuserdata(L);
	b.data = v;
	lauxlib.luaL_setmetatable(L, js_tname);
};

var getmainthread = function getmainthread(L) {
	lua.lua_rawgeti(L, lua.LUA_REGISTRYINDEX, lua.LUA_RIDX_MAINTHREAD);
	var mainL = lua.lua_tothread(L, -1);
	lua.lua_pop(L, 1);
	return mainL;
};

/* weak map from states to proxy objects (for each object) in that state */
var states = new WeakMap();

var atnativeerror = function atnativeerror(L) {
	var u = lua.lua_touserdata(L, 1);
	push(L, u);
	return 1;
};

var push = function push(L, v) {
	switch (typeof v === 'undefined' ? 'undefined' : _typeof(v)) {
		case "undefined":
			lua.lua_pushnil(L);
			break;
		case "number":
			lua.lua_pushnumber(L, v);
			break;
		case "string":
			lua.lua_pushstring(L, lua.to_luastring(v));
			break;
		case "boolean":
			lua.lua_pushboolean(L, v);
			break;
		case "symbol":
			lua.lua_pushlightuserdata(L, v);
			break;
		case "function":
			if (lua.lua_isproxy(v, L)) {
				v(L);
				break;
			}
		/* fall through */
		case "object":
			if (v === null) {
				/* can't use null in a WeakMap; grab from registry */
				lua.lua_rawgetp(L, lua.LUA_REGISTRYINDEX, null);
				break;
			}
		/* fall through */
		default:
			/* Try and push same object again */
			var objects_seen = states.get(getmainthread(L));
			var p = objects_seen.get(v);
			if (p) {
				p(L);
			} else {
				pushjs(L, v);
				p = lua.lua_toproxy(L, -1);
				objects_seen.set(v, p);
			}
	}
};

var tojs = function tojs(L, idx) {
	switch (lua.lua_type(L, idx)) {
		case lua.LUA_TNONE:
		case lua.LUA_TNIL:
			return void 0;
		case lua.LUA_TBOOLEAN:
			return lua.lua_toboolean(L, idx);
		case lua.LUA_TLIGHTUSERDATA:
			return lua.lua_touserdata(L, idx);
		case lua.LUA_TNUMBER:
			return lua.lua_tonumber(L, idx);
		case lua.LUA_TSTRING:
			return lua.lua_tojsstring(L, idx);
		case lua.LUA_TUSERDATA:
			var u = testjs(L, idx);
			if (u !== void 0) return u;
		/* fall through */
		case lua.LUA_TTABLE:
		case lua.LUA_TFUNCTION:
		case lua.LUA_TTHREAD:
		/* fall through */
		default:
			return wrap(L, lua.lua_toproxy(L, idx));
	}
};

var invoke = function invoke(L, p, thisarg, args, n_results) {
	lauxlib.luaL_checkstack(L, 2 + args.length);
	if (n_results === void 0 || n_results === null) {
		n_results = lua.LUA_MULTRET;
	}
	var base = lua.lua_gettop(L);
	p(L);
	push(L, thisarg);
	for (var i = 0; i < args.length; i++) {
		push(L, args[i]);
	}
	lua.lua_call(L, 1 + args.length, n_results);
	var nres = lua.lua_gettop(L) - base;
	var res = new Array(nres);
	for (var _i = 0; _i < nres; _i++) {
		res[_i] = tojs(L, base + _i + 1);
	}
	lua.lua_settop(L, base);
	return res;
};

var _get = function _get(L, p, prop) {
	lauxlib.luaL_checkstack(L, 2);
	p(L);
	push(L, prop);
	lua.lua_gettable(L, -2);
	var r = tojs(L, -1);
	lua.lua_pop(L, 2);
	return r;
};

var _has = function _has(L, p, prop) {
	lauxlib.luaL_checkstack(L, 2);
	p(L);
	push(L, prop);
	lua.lua_gettable(L, -2);
	var r = lua.lua_isnil(L, -1);
	lua.lua_pop(L, 2);
	return r;
};

var _set = function _set(L, p, prop, value) {
	lauxlib.luaL_checkstack(L, 3);
	p(L);
	push(L, prop);
	push(L, value);
	lua.lua_settable(L, -3);
	lua.lua_pop(L, 1);
};

var _deleteProperty = function _deleteProperty(L, p, prop) {
	lauxlib.luaL_checkstack(L, 3);
	p(L);
	push(L, prop);
	lua.lua_pushnil(L);
	lua.lua_settable(L, -3);
	lua.lua_pop(L, 1);
};

var tostring = function tostring(L, p) {
	lauxlib.luaL_checkstack(L, 1);
	p(L);
	var r = lauxlib.luaL_tolstring(L, -1);
	lua.lua_pop(L, 2);
	return lua.to_jsstring(r);
};

/* implements lua's "Generic For" protocol */
var iter_next = function iter_next() {
	lauxlib.luaL_checkstack(this.L, 3);
	var top = lua.lua_gettop(this.L);
	this.iter(this.L);
	this.state(this.L);
	this.last(this.L);
	lua.lua_call(this.L, 2, lua.LUA_MULTRET);
	this.last = lua.lua_toproxy(this.L, top + 1);
	var r = void 0;
	if (lua.lua_isnil(this.L, -1)) {
		r = {
			done: true,
			value: void 0
		};
	} else {
		var n_results = lua.lua_gettop(this.L) - top;
		var result = new Array(n_results);
		for (var i = 0; i < n_results; i++) {
			result[i] = tojs(this.L, top + i + 1);
		}
		r = {
			done: false,
			value: result
		};
	}
	lua.lua_settop(this.L, top);
	return r;
};

/* make iteration use pairs() */
var jsiterator = function jsiterator(L, p) {
	lauxlib.luaL_requiref(L, lua.to_luastring("_G"), lualib.luaopen_base, 0);
	lua.lua_getfield(L, -1, lua.to_luastring("pairs"));
	lua.lua_remove(L, -2);
	p(L);
	lua.lua_call(L, 1, 3);
	var iter = lua.lua_toproxy(L, -3);
	var state = lua.lua_toproxy(L, -2);
	var last = lua.lua_toproxy(L, -1);
	lua.lua_pop(L, 3);
	return {
		L: L,
		iter: iter,
		state: state,
		last: last,
		next: iter_next
	};
};

var wrap = function wrap(L1, p) {
	var L = getmainthread(L1);
	/* we need `typeof js_proxy` to be "function" so that it's acceptable to native apis */
	var js_proxy = function js_proxy() {
		/* only get one result */
		return invoke(L, p, this, arguments, 1)[0];
	};
	js_proxy.apply = function (thisarg, args) {
		/* only get one result */
		return invoke(L, p, thisarg, args, 1)[0];
	};
	js_proxy.invoke = function (thisarg, args) {
		return invoke(L, p, thisarg, args, lua.LUA_MULTRET);
	};
	js_proxy.get = function (k) {
		return _get(L, p, k);
	};
	js_proxy.has = function (k) {
		return _has(L, p, k);
	};
	js_proxy.set = function (k, v) {
		return _set(L, p, k, v);
	};
	js_proxy.delete = function (k) {
		return _deleteProperty(L, p, k);
	};
	js_proxy.toString = function () {
		return tostring(L, p);
	};
	js_proxy[Symbol.toStringTag] = "Fengari object";
	js_proxy[Symbol.iterator] = function () {
		return jsiterator(L, p);
	};
	if (Symbol.toPrimitive) {
		js_proxy[Symbol.toPrimitive] = function (hint) {
			if (hint === "string") {
				return tostring(L, p);
			}
		};
	}
	if (custom_inspect_symbol) {
		js_proxy[custom_inspect_symbol] = js_proxy.toString;
	}
	states.get(L).set(js_proxy, p);
	return js_proxy;
};

var proxy_handlers = {
	apply: function apply(target, thisarg, args) {
		return invoke(target.L, target.p, thisarg, args, 1)[0];
	},
	get: function get(target, k) {
		return _get(target.L, target.p, k);
	},
	has: function has(target, k) {
		return _has(target.L, target.p, k);
	},
	set: function set(target, k, v) {
		return _set(target.L, target.p, k, v);
	},
	deleteProperty: function deleteProperty(target, k) {
		return _deleteProperty(target.L, target.p, k);
	}
};

var valid_types = ["function", "object"];
var valid_types_as_luastring = valid_types.map(function (v) {
	return lua.to_luastring(v);
});

var _createproxy = function _createproxy(L1, p, type) {
	var L = getmainthread(L1);
	var target = void 0;
	switch (type) {
		case "function":
			target = function target() {};
			break;
		case "object":
			target = {};
			break;
		default:
			throw TypeError("invalid type to createproxy");
	}
	target.p = p;
	target.L = L;
	var js_proxy = new Proxy(target, proxy_handlers);
	return js_proxy;
};

var get_iterator = function get_iterator(L, idx) {
	var u = checkjs(L, idx);
	var getiter = u[Symbol.iterator];
	if (!getiter) lauxlib.luaL_argerror(L, idx, lua.to_luastring("object not iterable"));
	var iter = apply(getiter, u, []);
	if (!isobject(iter)) lauxlib.luaL_argerror(L, idx, lua.to_luastring("Result of the Symbol.iterator method is not an object"));
	return iter;
};

var next = function next(L) {
	var iter = tojs(L, 1);
	var r = iter.next();
	if (r.done) {
		return 0;
	} else {
		push(L, r.value);
		return 1;
	}
};

var jslib = {
	"new": function _new(L) {
		var u = tojs(L, 1);
		var nargs = lua.lua_gettop(L) - 1;
		var args = new Array(nargs);
		for (var i = 0; i < nargs; i++) {
			args[i] = tojs(L, i + 2);
		}
		push(L, construct(u, args));
		return 1;
	},
	"of": function of(L) {
		var iter = get_iterator(L, 1);
		lua.lua_pushcfunction(L, next);
		push(L, iter);
		return 2;
	},
	"createproxy": function createproxy(L) {
		lauxlib.luaL_checkany(L, 1);
		var type = valid_types[lauxlib.luaL_checkoption(L, 2, valid_types_as_luastring[0], valid_types_as_luastring)];
		var proxy = _createproxy(L, lua.lua_toproxy(L, 1), type);
		push(L, proxy);
		return 1;
	},
	"tonumber": function tonumber(L) {
		var u = tojs(L, 1);
		lua.lua_pushnumber(L, +u);
		return 1;
	},
	"instanceof": function _instanceof(L) {
		var u1 = tojs(L, 1);
		var u2 = tojs(L, 2);
		lua.lua_pushboolean(L, u1 instanceof u2);
		return 1;
	}
};

var jsmt = {
	__index: function __index(L) {
		var u = checkjs(L, 1);
		var k = tojs(L, 2);
		push(L, u[k]);
		return 1;
	},
	__newindex: function __newindex(L) {
		var u = checkjs(L, 1);
		var k = tojs(L, 2);
		var v = tojs(L, 3);
		if (v === void 0) delete u[k];else u[k] = v;
		return 0;
	},
	__tostring: function __tostring(L) {
		var u = checkjs(L, 1);
		var s = toString(u);
		lua.lua_pushstring(L, lua.to_luastring(s));
		return 1;
	},
	__call: function __call(L) {
		var u = checkjs(L, 1);
		var nargs = lua.lua_gettop(L) - 1;
		var thisarg = void 0,
		    args = void 0;
		if (nargs > 0) {
			thisarg = tojs(L, 2);
			if (nargs-- > 0) {
				args = new Array(nargs);
				for (var i = 0; i < nargs; i++) {
					args[i] = tojs(L, i + 3);
				}
			}
		}
		push(L, apply(u, thisarg, args));
		return 1;
	},
	__pairs: function __pairs(L) {
		var u = checkjs(L, 1);
		var f = u[Symbol.for("__pairs")];
		if (f === void 0) lauxlib.luaL_argerror(L, 1, lua.to_luastring("no __pairs Symbol"));
		var r = f.call(u);
		if (r === void 0) lauxlib.luaL_error(L, lua.to_luastring("bad '__pairs' result (object with keys 'iter', 'state', 'first' expected)"));
		var iter = r.iter;
		if (iter === void 0) lauxlib.luaL_error(L, lua.to_luastring("bad '__pairs' result (object.iter is missing)"));
		lua.lua_pushcfunction(L, function () {
			var state = tojs(L, 1);
			var last = tojs(L, 2);
			var r = iter.call(state, last);
			/* returning undefined indicates end of iteration */
			if (r === void 0) return 0;
			/* otherwise it should return an array of results */
			if (!Array.isArray(r)) lauxlib.luaL_error(L, lua.to_luastring("bad iterator result (Array or undefined expected)"));
			lauxlib.luaL_checkstack(L, r.length);
			for (var i = 0; i < r.length; i++) {
				push(L, r[i]);
			}
			return r.length;
		});
		push(L, r.state);
		push(L, r.first);
		return 3;
	}
};

/* Create __pairs for all objects that inherit from Object */
Object.prototype[Symbol.for("__pairs")] = function () {
	return {
		iter: function iter(last) {
			if (this.index >= this.keys.length) return;
			var key = this.keys[this.index++];
			return [key, this.object[key]];
		},
		state: {
			object: this,
			keys: Object.keys(this),
			index: 0
		}
	};
};

var luaopen_js = function luaopen_js(L) {
	/* Add weak map to track objects seen */
	states.set(getmainthread(L), new WeakMap());

	lua.lua_atnativeerror(L, atnativeerror);

	lauxlib.luaL_newlib(L, jslib);

	lauxlib.luaL_newmetatable(L, js_tname);
	lauxlib.luaL_setfuncs(L, jsmt, 0);
	lua.lua_pop(L, 1);

	pushjs(L, null);
	/* Store null object in registry under lightuserdata null */
	lua.lua_pushvalue(L, -1);
	lua.lua_rawsetp(L, lua.LUA_REGISTRYINDEX, null);
	lua.lua_setfield(L, -2, lua.to_luastring("null"));

	if (true) {
		push(L, window);
	} else {
		push(L, global);
	}
	lua.lua_setfield(L, -2, lua.to_luastring("global"));

	return 1;
};

module.exports.checkjs = checkjs;
module.exports.testjs = testjs;
module.exports.pushjs = pushjs;
module.exports.push = push;
module.exports.tojs = tojs;
module.exports.luaopen_js = luaopen_js;

/***/ }),
/* 1 */
/***/ (function(module, exports) {

module.exports = __WEBPACK_EXTERNAL_MODULE_1__;

/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var formatRegExp = /%[sdj%]/g;
exports.format = function (f) {
  if (!isString(f)) {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function (x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s':
        return String(args[i++]);
      case '%d':
        return Number(args[i++]);
      case '%j':
        try {
          return JSON.stringify(args[i++]);
        } catch (_) {
          return '[Circular]';
        }
      default:
        return x;
    }
  });
  for (var x = args[i]; i < len; x = args[++i]) {
    if (isNull(x) || !isObject(x)) {
      str += ' ' + x;
    } else {
      str += ' ' + inspect(x);
    }
  }
  return str;
};

// Mark that a method should not be used.
// Returns a modified function which warns once by default.
// If --no-deprecation is set, then it is a no-op.
exports.deprecate = function (fn, msg) {
  // Allow for deprecating things in the process of starting up.
  if (isUndefined(global.process)) {
    return function () {
      return exports.deprecate(fn, msg).apply(this, arguments);
    };
  }

  if (process.noDeprecation === true) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (process.throwDeprecation) {
        throw new Error(msg);
      } else if (process.traceDeprecation) {
        console.trace(msg);
      } else {
        console.error(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
};

var debugs = {};
var debugEnviron;
exports.debuglog = function (set) {
  if (isUndefined(debugEnviron)) debugEnviron = process.env.NODE_DEBUG || '';
  set = set.toUpperCase();
  if (!debugs[set]) {
    if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
      var pid = process.pid;
      debugs[set] = function () {
        var msg = exports.format.apply(exports, arguments);
        console.error('%s %d: %s', set, pid, msg);
      };
    } else {
      debugs[set] = function () {};
    }
  }
  return debugs[set];
};

/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Object} opts Optional options object that alters the output.
 */
/* legacy: obj, showHidden, depth, colors*/
function inspect(obj, opts) {
  // default options
  var ctx = {
    seen: [],
    stylize: stylizeNoColor
  };
  // legacy...
  if (arguments.length >= 3) ctx.depth = arguments[2];
  if (arguments.length >= 4) ctx.colors = arguments[3];
  if (isBoolean(opts)) {
    // legacy...
    ctx.showHidden = opts;
  } else if (opts) {
    // got an "options" object
    exports._extend(ctx, opts);
  }
  // set default options
  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
  if (isUndefined(ctx.depth)) ctx.depth = 2;
  if (isUndefined(ctx.colors)) ctx.colors = false;
  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
  if (ctx.colors) ctx.stylize = stylizeWithColor;
  return formatValue(ctx, obj, ctx.depth);
}
exports.inspect = inspect;

// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
inspect.colors = {
  'bold': [1, 22],
  'italic': [3, 23],
  'underline': [4, 24],
  'inverse': [7, 27],
  'white': [37, 39],
  'grey': [90, 39],
  'black': [30, 39],
  'blue': [34, 39],
  'cyan': [36, 39],
  'green': [32, 39],
  'magenta': [35, 39],
  'red': [31, 39],
  'yellow': [33, 39]
};

// Don't use 'blue' not visible on cmd.exe
inspect.styles = {
  'special': 'cyan',
  'number': 'yellow',
  'boolean': 'yellow',
  'undefined': 'grey',
  'null': 'bold',
  'string': 'green',
  'date': 'magenta',
  // "name": intentionally not styling
  'regexp': 'red'
};

function stylizeWithColor(str, styleType) {
  var style = inspect.styles[styleType];

  if (style) {
    return '\x1B[' + inspect.colors[style][0] + 'm' + str + '\x1B[' + inspect.colors[style][1] + 'm';
  } else {
    return str;
  }
}

function stylizeNoColor(str, styleType) {
  return str;
}

function arrayToHash(array) {
  var hash = {};

  array.forEach(function (val, idx) {
    hash[val] = true;
  });

  return hash;
}

function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (ctx.customInspect && value && isFunction(value.inspect) &&
  // Filter out the util module, it's inspect function is special
  value.inspect !== exports.inspect &&
  // Also filter out any prototype objects using the circular check.
  !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes, ctx);
    if (!isString(ret)) {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }

  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  // Look up the keys of the object.
  var keys = Object.keys(value);
  var visibleKeys = arrayToHash(keys);

  if (ctx.showHidden) {
    keys = Object.getOwnPropertyNames(value);
  }

  // IE doesn't make error fields non-enumerable
  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
  if (isError(value) && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
    return formatError(value);
  }

  // Some type of object without properties can be shortcutted.
  if (keys.length === 0) {
    if (isFunction(value)) {
      var name = value.name ? ': ' + value.name : '';
      return ctx.stylize('[Function' + name + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = '',
      array = false,
      braces = ['{', '}'];

  // Make Array say that they are Array
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (isFunction(value)) {
    var n = value.name ? ': ' + value.name : '';
    base = ' [Function' + n + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  // Make error with message first say the error
  if (isError(value)) {
    base = ' ' + formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);

  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = keys.map(function (key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}

function formatPrimitive(ctx, value) {
  if (isUndefined(value)) return ctx.stylize('undefined', 'undefined');
  if (isString(value)) {
    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '').replace(/'/g, "\\'").replace(/\\"/g, '"') + '\'';
    return ctx.stylize(simple, 'string');
  }
  if (isNumber(value)) return ctx.stylize('' + value, 'number');
  if (isBoolean(value)) return ctx.stylize('' + value, 'boolean');
  // For some reason typeof null is "object", so special case here.
  if (isNull(value)) return ctx.stylize('null', 'null');
}

function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}

function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (hasOwnProperty(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys, String(i), true));
    } else {
      output.push('');
    }
  }
  keys.forEach(function (key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys, key, true));
    }
  });
  return output;
}

function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str, desc;
  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
  if (desc.get) {
    if (desc.set) {
      str = ctx.stylize('[Getter/Setter]', 'special');
    } else {
      str = ctx.stylize('[Getter]', 'special');
    }
  } else {
    if (desc.set) {
      str = ctx.stylize('[Setter]', 'special');
    }
  }
  if (!hasOwnProperty(visibleKeys, key)) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (ctx.seen.indexOf(desc.value) < 0) {
      if (isNull(recurseTimes)) {
        str = formatValue(ctx, desc.value, null);
      } else {
        str = formatValue(ctx, desc.value, recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function (line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function (line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (isUndefined(name)) {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'").replace(/\\"/g, '"').replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}

function reduceToSingleString(output, base, braces) {
  var numLinesEst = 0;
  var length = output.reduce(function (prev, cur) {
    numLinesEst++;
    if (cur.indexOf('\n') >= 0) numLinesEst++;
    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] + (base === '' ? '' : base + '\n ') + ' ' + output.join(',\n  ') + ' ' + braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}

// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.
function isArray(ar) {
  return Array.isArray(ar);
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return (typeof arg === 'undefined' ? 'undefined' : _typeof(arg)) === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return isObject(re) && objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return (typeof arg === 'undefined' ? 'undefined' : _typeof(arg)) === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return isObject(e) && (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null || typeof arg === 'boolean' || typeof arg === 'number' || typeof arg === 'string' || (typeof arg === 'undefined' ? 'undefined' : _typeof(arg)) === 'symbol' || // ES6 symbol
  typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = __webpack_require__(3);

function objectToString(o) {
  return Object.prototype.toString.call(o);
}

function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}

var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()), pad(d.getMinutes()), pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}

// log is just a thin wrapper to console.log that prepends a timestamp
exports.log = function () {
  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
};

/**
 * Inherit the prototype methods from one constructor into another.
 *
 * The Function.prototype.inherits from lang.js rewritten as a standalone
 * function (not on Function.prototype). NOTE: If this file is to be loaded
 * during bootstrapping this function needs to be rewritten using some native
 * functions as prototype setup using normal JavaScript does not work as
 * expected during bootstrapping (see mirror.js in r114903).
 *
 * @param {function} ctor Constructor function which needs to inherit the
 *     prototype.
 * @param {function} superCtor Constructor function to inherit prototype from.
 */
exports.inherits = __webpack_require__(4);

exports._extend = function (origin, add) {
  // Don't do anything if add isn't an object
  if (!add || !isObject(add)) return origin;

  var keys = Object.keys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
};

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

/***/ }),
/* 3 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

module.exports = function isBuffer(arg) {
  return arg && (typeof arg === 'undefined' ? 'undefined' : _typeof(arg)) === 'object' && typeof arg.copy === 'function' && typeof arg.fill === 'function' && typeof arg.readUInt8 === 'function';
};

/***/ }),
/* 4 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor;
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor;
    var TempCtor = function TempCtor() {};
    TempCtor.prototype = superCtor.prototype;
    ctor.prototype = new TempCtor();
    ctor.prototype.constructor = ctor;
  };
}

/***/ })
/******/ ]);
});