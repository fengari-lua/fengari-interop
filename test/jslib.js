"use strict";
global.WEB = false;
const assert = require("assert");
describe("fengari-interop", function() {
	it("loads successfully", function() {
		const jslib = require("../src/jslib.js");
		assert(typeof jslib.luaopen_js === "function");
	});
});
