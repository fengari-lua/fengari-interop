# JS library for Fengari

[Fengari](https://github.com/fengari-lua/fengari) is a lua VM written in Javascript.
It's implementation makes use of the JS garbage collector, which means it is fully capable of cross language interop.

## Features

  - Call any JS function from Lua
  - Give Lua tables/functions/userdata to Javascript


## `js` library

```lua
js = require "js"
```

### `null`

A userdata representing JavaScript [`null`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/null)


### `global`

A reference to the JavaScript global context. In the browser, this is usually equivalent to the `window` object. In node.js it's equal to [`global`](https://nodejs.org/api/globals.html#globals_global).


### `new(constructor, ...)`

Invokes the JavaScript [`new` operator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/new) on `constructor` passing the arguments specified.

Returns the created object.


### `of(iterable)`

Returns a iterating function and an iterator state that behave like a JavaScript [for...of](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for...of) loop.
Suitable for use as a lua iterator. e.g.

```lua
for f in js.of(js.global:Array(10,20,30)) do
	print(f)
end
```


### `createproxy(x[, type])`

*Note: Only available if your JS environment has the Proxy constructor*

Creates a JavaScript [Proxy](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy) object. The proxy supports calling (`apply`), indexing (`get` and `has`) and setting (`set` and `deleteProperty`).

`type` is the desired result for `typeof proxy`; it may be `"function"` (the default) or `"object"`.

Note that JavaScript coerces all types except Symbols to strings before using them as a key in an indexing operation.


### `tonumber(x)`

Coerces the value `x` to a number using JavaScript coercion rules.


### `instanceof(x, y)`

Returns if the value `x` is an instance of the class `y` via use of the JavaScript [`instanceof` operator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/instanceof)


## Symbols

### `__pairs`

The `__pairs` Symbol can be used to describe how to iterate over a JavaScript object. Use `Symbol.for("__pairs")` to get the symbol. It should be used as a key on your objects, where the value is a function returning an object with three properties: `"iter"`, `"state"` and `"first"`.

`"iter"` should be a function that follows the standard [Lua generic for protocol](http://www.lua.org/manual/5.3/manual.html#3.3.5), that is, it gets called with your *state* (as `this`) and the previous value produced; it should return an array of values or `undefined` if done.

e.g. to make `pairs` on a [Map](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map) return entries in the map via the [iterator symbol](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map/@@iterator):

```js
Map.prototype[Symbol.for("__pairs")] = function() {
	return {
		iter: function(last) {
			var v = this.next();
			if (v.done) return;
			return v.value;
		},
		state: this[Symbol.iterator]()
	};
};
```

A default `__pairs` is attached to `Object.prototype` that uses [`Object.keys`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/keys).


### `__len`

The `__len` Symbol can be used to describe how to get the length (used by the lua `#` operator) of a JavaScript object.
Use `Symbol.for("__len")` to get the symbol. It should be used as a key on your objects, where the value is a function returning the length of your objects (passed as `this`).

e.g. to have the lua `#` operator applied to a [Map](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map) return the [`size`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map/size) field:

```js
Map.prototype[Symbol.for("__len")] = function() {
	return this.size;
};
```

A default `__len` is attached to `Array.prototype` and [TypedArray](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/TypedArray) prototypes that returns the `.length` field.
