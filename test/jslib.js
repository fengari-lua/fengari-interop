"use strict";

const {
	lua: {
		LUA_OK,
		lua_pcall,
		lua_tojsstring
	},
	lauxlib: {
		luaL_dostring,
		luaL_loadstring,
		luaL_newstate,
		luaL_requiref
	},
	lualib: {
		luaL_openlibs
	},
	to_luastring
} = require("fengari");
const assert = require("assert");

describe("fengari-interop", function() {
	it("loads successfully", function() {
		const { luaopen_js } = require("../src/jslib.js");
		assert(typeof luaopen_js === "function");
	});

	const new_state = function() {
		const { luaopen_js } = require("../src/jslib.js");

		const L = luaL_newstate();
		luaL_openlibs(L);
		luaL_requiref(L, to_luastring("js"), luaopen_js, 0);
		return L;
	};

	it("can be required from lua", function() {
		const L = new_state();
		if (luaL_dostring(L, to_luastring('require("js")')) !== LUA_OK) {
			throw lua_tojsstring(L, -1);
		}
	});

	it("pushes same null every time", function() {
		const { push, tojs } = require("../src/jslib.js");
		const L = new_state();
		if (luaL_loadstring(L, to_luastring(`
		local null = ...
		local js = require "js"
		assert(null == js.null)
		assert(rawequal(null, js.null))
		`)) !== LUA_OK) {
			throw lua_tojsstring(L, -1);
		}
		push(L, null);
		if (lua_pcall(L, 1, 0, 0) !== LUA_OK) {
			throw tojs(L, -1);
		}
	});

	it("allows calls with no 'this' or arguments", function() {
		const { tojs } = require("../src/jslib.js");
		const L = new_state();
		if (luaL_loadstring(L, to_luastring(`
		local js = require "js"
		js.global.Date.now()
		`)) !== LUA_OK) {
			throw lua_tojsstring(L, -1);
		}
		if (lua_pcall(L, 0, 0, 0) !== LUA_OK) {
			throw tojs(L, -1);
		}
	});
});
