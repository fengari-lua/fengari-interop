"use strict";

const util = require('util');

const fengari = require('fengari');
const lua     = fengari.lua;
const lauxlib = fengari.lauxlib;
const lualib  = fengari.lualib;

const apply = (function(){}).apply;
const bind = (function(){}).bind;

const js_tname = lua.to_luastring("js object");

const checkjs = function(L, idx) {
	return lauxlib.luaL_checkudata(L, idx, js_tname).data;
};

const pushjs = function(L, v) {
	let b = lua.lua_newuserdata(L);
	b.data = v;
	lauxlib.luaL_setmetatable(L, js_tname);
};

const getmainthread = function(L) {
	lua.lua_rawgeti(L, lua.LUA_REGISTRYINDEX, lua.LUA_RIDX_MAINTHREAD);
	let mainL = lua.lua_tothread(L, -1);
	lua.lua_pop(L, 1);
	return mainL;
};

/* weak map from states to proxy objects (for each object) in that state */
const states = new WeakMap();

const push = function(L, v) {
	switch (typeof v) {
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
	case "object":
		if (lua.lua_isproxy(v, L)) {
			v(L);
			break;
		}
		/* fall through */
	default:
		if (v === null) {
			/* can't use null in a WeakMap; grab from registry */
			lua.lua_rawgetp(L, lua.LUA_REGISTRYINDEX, null);
			break;
		}

		/* Try and push same object again */
		let objects_seen = states.get(getmainthread(L));
		let p = objects_seen.get(v);
		if (p) {
			p(L);
		} else {
			pushjs(L, v);
			p = lua.lua_toproxy(L, -1);
			objects_seen.set(v, p);
		}
	}
};

const tojs = function(L, idx) {
	switch(lua.lua_type(L, idx)) {
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
	case lua.LUA_TTABLE:
	case lua.LUA_TFUNCTION:
	case lua.LUA_TUSERDATA:
	case lua.LUA_TTHREAD:
		/* fall through */
	default:
		return wrap(getmainthread(L), lua.lua_toproxy(L, idx));
	}
};


const invoke = function(L, p, thisarg, args, n_results) {
	lauxlib.luaL_checkstack(L, 2+args.length);
	if ((n_results === void 0) || (n_results === null)) {
		n_results = lua.LUA_MULTRET;
	}
	let base = lua.lua_gettop(L);
	p(L);
	push(L, thisarg);
	for (let i=0; i<args.length; i++) {
		push(L, args[i]);
	}
	lua.lua_call(L, 1+args.length, n_results);
	let nres = lua.lua_gettop(L)-base;
	let res = new Array(nres);
	for (let i=0; i<nres; i++) {
		res[i] = tojs(L, base+i+1);
	}
	lua.lua_settop(L, base);
	return res;
};

const get = function(L, p, prop) {
	lauxlib.luaL_checkstack(L, 2);
	p(L);
	push(L, prop);
	lua.lua_gettable(L, -2);
	let r = tojs(L, -1);
	lua.lua_pop(L, 2);
	return r;
};

const has = function(L, p, prop) {
	lauxlib.luaL_checkstack(L, 2);
	p(L);
	push(L, prop);
	lua.lua_gettable(L, -2);
	let r = lua.lua_isnil(L, -1);
	lua.lua_pop(L, 2);
	return r;
};

const set = function(L, p, prop, value) {
	lauxlib.luaL_checkstack(L, 3);
	p(L);
	push(L, prop);
	push(L, value);
	lua.lua_settable(L, -3);
	lua.lua_pop(L, 1);
};

const deleteProperty = function(L, p, prop) {
	lauxlib.luaL_checkstack(L, 3);
	p(L);
	push(L, prop);
	lua.lua_pushnil(L);
	lua.lua_settable(L, -3);
	lua.lua_pop(L, 1);
};

const tostring = function(L, p) {
	lauxlib.luaL_checkstack(L, 1);
	p(L);
	let r = lauxlib.luaL_tolstring(L, -1);
	lua.lua_pop(L, 2);
	return lua.to_jsstring(r);
};

/* implements lua's "Generic For" protocol */
const iter_next = function() {
	lauxlib.luaL_checkstack(this.L, 3);
	let top = lua.lua_gettop(this.L);
	this.iter(this.L);
	this.state(this.L);
	this.last(this.L);
	lua.lua_call(this.L, 2, lua.LUA_MULTRET);
	this.last = lua.lua_toproxy(this.L, top+1);
	let r;
	if (lua.lua_isnil(this.L, -1)) {
		r = {
			done: true,
			value: void 0
		};
	} else {
		let n_results = lua.lua_gettop(this.L) - top;
		let result = new Array(n_results);
		for (let i=0; i<n_results; i++) {
			result[i] = tojs(this.L, top+i+1);
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
const jsiterator = function(L, p) {
	lauxlib.luaL_requiref(L, lua.to_luastring("_G"), lualib.luaopen_base, 0);
	lua.lua_getfield(L, -1, lua.to_luastring("pairs"));
	lua.lua_remove(L, -2);
	p(L);
	lua.lua_call(L, 1, 3);
	let iter = lua.lua_toproxy(L, -3);
	let state = lua.lua_toproxy(L, -2);
	let last = lua.lua_toproxy(L, -1);
	lua.lua_pop(L, 3);
	return {
		L: L,
		iter: iter,
		state: state,
		last: last,
		next: iter_next
	};
};

const wrap = function(L, p) {
	/* we need `typeof js_proxy` to be "function" so that it's acceptable to native apis */
	let js_proxy = function() {
		/* only get one result */
		return invoke(L, p, this, arguments, 1)[0];
	};
	js_proxy.apply = function(thisarg, args) {
		/* only get one result */
		return invoke(L, p, thisarg, args, 1)[0];
	};
	js_proxy.invoke = function(thisarg, args) {
		return invoke(L, p, thisarg, args, lua.LUA_MULTRET);
	};
	js_proxy.get = function(k) {
		return get(L, p, k);
	};
	js_proxy.has = function(k) {
		return has(L, p, k);
	};
	js_proxy.set = function(k, v) {
		if (v == void 0)
			return deleteProperty(L, p, k);
		else
			return set(L, p, k, v);
	};
	js_proxy.delete = function(k) {
		return deleteProperty(L, p, k);
	};
	js_proxy.toString = function() {
		return tostring(L, p);
	};
	js_proxy[Symbol.iterator] = function() {
		return jsiterator(L, p);
	};
	js_proxy[Symbol.toStringTag] = js_proxy.toString;
	/* for node */
	js_proxy[util.inspect.custom] = js_proxy.toString;
	return js_proxy;
};

let jslib = {
	"new": function(L) {
		let u = checkjs(L, 1);
		let top = lua.lua_gettop(L);
		let args = new Array(top);
		args[0] = null;
		for (let i = 1; i < top; i++) {
			args[i] = tojs(L, i+1);
		}
		push(L, new (bind.apply(u, args))());
		return 1;
	}
};

let jsmt = {
	__index: function(L) {
		let u = checkjs(L, 1);
		let k = tojs(L, 2);
		push(L, u[k]);
		return 1;
	},
	__newindex: function(L) {
		let u = checkjs(L, 1);
		let k = tojs(L, 2);
		let v = tojs(L, 3);
		if (v == void 0)
			delete u[k];
		else
			u[k] = v;
		return 0;
	},
	__tostring: function(L) {
		let u = checkjs(L, 1);
		lua.lua_pushliteral(L, util.inspect(u));
		return 1;
	},
	__call: function(L) {
		let u = checkjs(L, 1);
		let nargs = lua.lua_gettop(L)-1;
		let thisarg, args;
		if (nargs > 0) {
			thisarg = tojs(L, 2);
			if (nargs-- > 0) {
				args = new Array(nargs);
				for (let i = 0; i < nargs; i++) {
					args[i] = tojs(L, i+3);
				}
			}
		}
		push(L, apply.call(u, thisarg, args));
		return 1;
	}
};

const luaopen_js = function(L) {
	/* Add weak map to track objects seen */
	states.set(getmainthread(L), new WeakMap());

	lauxlib.luaL_newlib(L, jslib);

	lauxlib.luaL_newmetatable(L, js_tname);
	lauxlib.luaL_setfuncs(L, jsmt, 0);
	lua.lua_pop(L, 1);

	pushjs(L, null);
	/* Store null object in registry under lightuserdata null */
	lua.lua_pushvalue(L, -1);
	lua.lua_rawsetp(L, lua.LUA_REGISTRYINDEX, null);
	lua.lua_setfield(L, -2, lua.to_luastring("null"));

	push(L, global);
	lua.lua_setfield(L, -2, lua.to_luastring("global"));

	return 1;
};

module.exports.checkjs = checkjs;
module.exports.pushjs = pushjs;
module.exports.push = push;
module.exports.tojs = tojs;
module.exports.luaopen_js = luaopen_js;
