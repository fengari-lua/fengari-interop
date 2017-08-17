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


### `createproxy(x)`

Creates a JavaScript [Proxy](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy) object. The proxy supports calling (`apply`), indexing (`get` and `has`) and setting (`set` and `deleteProperty`).

Note that JavaScript coerces all types except Symbols to strings before using them as a key in an indexing operation.


### `tonumber(x)`

Coerces the value `x` to a number using JavaScript coercion rules.


### `instanceof(x, y)`

Returns if the value `x` is an instance of the class `y` via use of the JavaScript [`instanceof` operator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/instanceof)
