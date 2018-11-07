(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){

},{}],2:[function(require,module,exports){
(function (process){
// .dirname, .basename, and .extname methods are extracted from Node.js v8.11.1,
// backported and transplited with Babel, with backwards-compat fixes

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

// resolves . and .. elements in a path array with directory names there
// must be no slashes, empty elements, or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
function normalizeArray(parts, allowAboveRoot) {
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = parts.length - 1; i >= 0; i--) {
    var last = parts[i];
    if (last === '.') {
      parts.splice(i, 1);
    } else if (last === '..') {
      parts.splice(i, 1);
      up++;
    } else if (up) {
      parts.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (allowAboveRoot) {
    for (; up--; up) {
      parts.unshift('..');
    }
  }

  return parts;
}

// path.resolve([from ...], to)
// posix version
exports.resolve = function() {
  var resolvedPath = '',
      resolvedAbsolute = false;

  for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
    var path = (i >= 0) ? arguments[i] : process.cwd();

    // Skip empty and invalid entries
    if (typeof path !== 'string') {
      throw new TypeError('Arguments to path.resolve must be strings');
    } else if (!path) {
      continue;
    }

    resolvedPath = path + '/' + resolvedPath;
    resolvedAbsolute = path.charAt(0) === '/';
  }

  // At this point the path should be resolved to a full absolute path, but
  // handle relative paths to be safe (might happen when process.cwd() fails)

  // Normalize the path
  resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
    return !!p;
  }), !resolvedAbsolute).join('/');

  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
};

// path.normalize(path)
// posix version
exports.normalize = function(path) {
  var isAbsolute = exports.isAbsolute(path),
      trailingSlash = substr(path, -1) === '/';

  // Normalize the path
  path = normalizeArray(filter(path.split('/'), function(p) {
    return !!p;
  }), !isAbsolute).join('/');

  if (!path && !isAbsolute) {
    path = '.';
  }
  if (path && trailingSlash) {
    path += '/';
  }

  return (isAbsolute ? '/' : '') + path;
};

// posix version
exports.isAbsolute = function(path) {
  return path.charAt(0) === '/';
};

// posix version
exports.join = function() {
  var paths = Array.prototype.slice.call(arguments, 0);
  return exports.normalize(filter(paths, function(p, index) {
    if (typeof p !== 'string') {
      throw new TypeError('Arguments to path.join must be strings');
    }
    return p;
  }).join('/'));
};


// path.relative(from, to)
// posix version
exports.relative = function(from, to) {
  from = exports.resolve(from).substr(1);
  to = exports.resolve(to).substr(1);

  function trim(arr) {
    var start = 0;
    for (; start < arr.length; start++) {
      if (arr[start] !== '') break;
    }

    var end = arr.length - 1;
    for (; end >= 0; end--) {
      if (arr[end] !== '') break;
    }

    if (start > end) return [];
    return arr.slice(start, end - start + 1);
  }

  var fromParts = trim(from.split('/'));
  var toParts = trim(to.split('/'));

  var length = Math.min(fromParts.length, toParts.length);
  var samePartsLength = length;
  for (var i = 0; i < length; i++) {
    if (fromParts[i] !== toParts[i]) {
      samePartsLength = i;
      break;
    }
  }

  var outputParts = [];
  for (var i = samePartsLength; i < fromParts.length; i++) {
    outputParts.push('..');
  }

  outputParts = outputParts.concat(toParts.slice(samePartsLength));

  return outputParts.join('/');
};

exports.sep = '/';
exports.delimiter = ':';

exports.dirname = function (path) {
  if (typeof path !== 'string') path = path + '';
  if (path.length === 0) return '.';
  var code = path.charCodeAt(0);
  var hasRoot = code === 47 /*/*/;
  var end = -1;
  var matchedSlash = true;
  for (var i = path.length - 1; i >= 1; --i) {
    code = path.charCodeAt(i);
    if (code === 47 /*/*/) {
        if (!matchedSlash) {
          end = i;
          break;
        }
      } else {
      // We saw the first non-path separator
      matchedSlash = false;
    }
  }

  if (end === -1) return hasRoot ? '/' : '.';
  if (hasRoot && end === 1) {
    // return '//';
    // Backwards-compat fix:
    return '/';
  }
  return path.slice(0, end);
};

function basename(path) {
  if (typeof path !== 'string') path = path + '';

  var start = 0;
  var end = -1;
  var matchedSlash = true;
  var i;

  for (i = path.length - 1; i >= 0; --i) {
    if (path.charCodeAt(i) === 47 /*/*/) {
        // If we reached a path separator that was not part of a set of path
        // separators at the end of the string, stop now
        if (!matchedSlash) {
          start = i + 1;
          break;
        }
      } else if (end === -1) {
      // We saw the first non-path separator, mark this as the end of our
      // path component
      matchedSlash = false;
      end = i + 1;
    }
  }

  if (end === -1) return '';
  return path.slice(start, end);
}

// Uses a mixed approach for backwards-compatibility, as ext behavior changed
// in new Node.js versions, so only basename() above is backported here
exports.basename = function (path, ext) {
  var f = basename(path);
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
};

exports.extname = function (path) {
  if (typeof path !== 'string') path = path + '';
  var startDot = -1;
  var startPart = 0;
  var end = -1;
  var matchedSlash = true;
  // Track the state of characters (if any) we see before our first dot and
  // after any path separator we find
  var preDotState = 0;
  for (var i = path.length - 1; i >= 0; --i) {
    var code = path.charCodeAt(i);
    if (code === 47 /*/*/) {
        // If we reached a path separator that was not part of a set of path
        // separators at the end of the string, stop now
        if (!matchedSlash) {
          startPart = i + 1;
          break;
        }
        continue;
      }
    if (end === -1) {
      // We saw the first non-path separator, mark this as the end of our
      // extension
      matchedSlash = false;
      end = i + 1;
    }
    if (code === 46 /*.*/) {
        // If this is our first dot, mark it as the start of our extension
        if (startDot === -1)
          startDot = i;
        else if (preDotState !== 1)
          preDotState = 1;
    } else if (startDot !== -1) {
      // We saw a non-dot and non-path separator before our dot, so we should
      // have a good chance at having a non-empty extension
      preDotState = -1;
    }
  }

  if (startDot === -1 || end === -1 ||
      // We saw a non-dot character immediately before the dot
      preDotState === 0 ||
      // The (right-most) trimmed path component is exactly '..'
      preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) {
    return '';
  }
  return path.slice(startDot, end);
};

function filter (xs, f) {
    if (xs.filter) return xs.filter(f);
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        if (f(xs[i], i, xs)) res.push(xs[i]);
    }
    return res;
}

// String.prototype.substr - negative index don't work in IE8
var substr = 'ab'.substr(-1) === 'b'
    ? function (str, start, len) { return str.substr(start, len) }
    : function (str, start, len) {
        if (start < 0) start = str.length + start;
        return str.substr(start, len);
    }
;

}).call(this,require('_process'))
},{"_process":3}],3:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],4:[function(require,module,exports){
(function (global){
/* ------------ Begin System specific ------------ */
const GLOBAL = typeof window === 'undefined' ? global : window

function get_student_program(){
    return $(".ace_editor")[0].env.editor.getValue();
}
/* ------------- End System specific ------------- */

/* ------------- Begin Exam specific ------------- */
//This is the solutions library.
    //Good luck trying to decipher this.
var PE_solutions = require("./pe_solutions.js");
GLOBAL.PE_solutions = PE_solutions;
const externals = ["PE_solutions", "map_array", "is_array", "accumulate_array", 
    "filter_array", "enum_array", "take_array", "drop_array"];

/* -------------- End Exam specific -------------- */
const _ = {
    isEqual: require("./is_equal")
}
var parser = require("./dist/parser.js");
var context = require("./dist/createContext.js");
var interpreter = require("./dist/interpreter.js");
var schedulers = require("./dist/schedulers.js");
const createContext = context.default;
//createContext imports externalSymbols from global. 
    //This is "global" in Node.Js, or "window" in the browser.
const evaluate = interpreter.evaluate;

//This is copied out off createContext, which does not export it.
const defineSymbol = (context, name, value) => {
    const globalFrame = context.runtime.frames[0];
    globalFrame.environment[name] = value;
}

function display(a, context){
    if(!window){
        return console.log(a);
    }
    const handle_console_log = {
        type: "HANDLE_CONSOLE_LOG",
        payload: { 
            logString: a, 
            workspaceLocation: context || "assessment"
        }
    }
    window.__REDUX_STORE__.dispatch(handle_console_log);
}

function handle_errors(errors, context){
    if(!window){
        return console.error(errors);
    }
    let handle_error_messages = {
        type: "EVAL_INTERPRETER_ERROR",
        payload: { 
            type: 'errors', 
            errors: errors, 
            workspaceLocation: context || "assessment" 
        }
    }
    window.__REDUX_STORE__.dispatch(handle_error_messages);
}

function createAssertContext(currTest){
    const context = createContext(4, externals, "assessment");
	defineSymbol(context, "display", display);
    //In the MCE, replace the assert function
	//With something that performs normally.
    defineSymbol(context, "assert", (testName, fn_to_execute, other_value, mocks) => {
        if(currTest !== testName) return; //Only run tests with the same name.
        const result = _.isEqual(fn_to_execute(), other_value);
        if(result){
            display(testName+": PASS");
        } else {
            display(testName+": FAIL");
        }
    });
	
	defineSymbol(context, "assert_error", (testName, fn_to_execute, other_value, mocks) => {
        if(currTest !== testName) return; //Only run tests with the same name.
		try{
			fn_to_execute()
		} catch(err){
			const result = _.isEqual(err.error.message, JSON.stringify(other_value));
			if(result){
				return display(testName+": PASS");
			} else {
				return display(testName+": FAIL");
			}
		}
		return display(testName+": FAIL (no error thrown)");
    });
    return context;
}

function replace_globals(parse_tree, mocks, context){
    //First, remove all global variable declarations in mock from the global parse tree
    const body = parse_tree.body;
    const filtered_body = body.filter(item => 
        !(item.type === "FunctionDeclaration" 
            && mocks.findIndex(x => x === item.id.name) !== -1));

    //Append mocks with actual code
    const mock_code = mocks.map(name => `const ${name} = PE_solutions.${name};`).join("\n");
    const mocks_parsed = parser.parse(mock_code, context);
    parse_tree.body = mocks_parsed.body.concat(filtered_body);
    return parse_tree;
}

// The "outer" call to this function does nothing.
    //But the signature is as follows.
function assert(testName, fn_to_execute, other_value, mocks){
    const context = createAssertContext(testName);
    const student_submission_string = get_student_program();
    const student_submission = parser.parse(student_submission_string, context);
    
    if(!student_submission) {
        handle_errors(context.errors);
        return Promise.resolve({ status: 'error' });
    }
    //Remove mocks from global of student's submission
    const student_submission_rewrite = replace_globals(student_submission, mocks, context);
        //This will also replace the assert function.
    const it = evaluate(student_submission_rewrite, context);
    const scheduler = new schedulers.PreemptiveScheduler(10000);
   
    //Run the student's submission
    return scheduler.run(it, context)
        .then(x => {
            if(context.errors.length)
                handle_errors(context.errors);
        });
}

global.assert = assert;
global.assert_error = assert;
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./dist/createContext.js":6,"./dist/interpreter.js":10,"./dist/parser.js":11,"./dist/schedulers.js":25,"./is_equal":33,"./pe_solutions.js":87}],5:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Types = {
    NUMBER: { name: 'number' },
    STRING: { name: 'string' },
    UNDEFINED: { name: 'undefined' },
    BOOLEAN: { name: 'boolean' },
    ANY: { name: 'any' }
};
exports.MAX_LIST_DISPLAY_LENGTH = 100;
exports.UNKNOWN_LOCATION = {
    start: {
        line: -1,
        column: -1
    },
    end: {
        line: -1,
        column: -1
    }
};

},{}],6:[function(require,module,exports){
(function (global){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const list = require("./stdlib/list");
const misc = require("./stdlib/misc");
const _1 = require(".");
/** Import meta-circular parser */
const createParserModule = require('./stdlib/parser');
const Parser = createParserModule.Parser;
const GLOBAL = typeof window === 'undefined' ? global : window;
const createEmptyCFG = () => ({
    nodes: {},
    edges: {},
    scopes: []
});
const createEmptyRuntime = () => ({
    isRunning: false,
    frames: [],
    value: undefined,
    nodes: []
});
exports.createEmptyContext = (chapter, externalSymbols, externalContext) => ({
    chapter,
    externalSymbols,
    errors: [],
    externalContext,
    cfg: createEmptyCFG(),
    runtime: createEmptyRuntime(),
    metaCircularParser: new Parser()
});
exports.ensureGlobalEnvironmentExist = (context) => {
    if (!context.runtime) {
        context.runtime = createEmptyRuntime();
    }
    if (!context.runtime.frames) {
        context.runtime.frames = [];
    }
    if (context.runtime.frames.length === 0) {
        context.runtime.frames.push({
            parent: null,
            name: 'global',
            environment: {}
        });
    }
};
const defineSymbol = (context, name, value) => {
    const globalFrame = context.runtime.frames[0];
    globalFrame.environment[name] = value;
};
exports.importExternalSymbols = (context, externalSymbols) => {
    exports.ensureGlobalEnvironmentExist(context);
    externalSymbols.forEach(symbol => {
        defineSymbol(context, symbol, GLOBAL[symbol]);
    });
};
/**
 * Imports builtins from standard and external libraries.
 *
 * For externalBuiltIns that need to be curried, the __SOURCE__
 * property must be defined in the currying function.
 */
exports.importBuiltins = (context, externalBuiltIns) => {
    exports.ensureGlobalEnvironmentExist(context);
    /* Defining the __SOURCE__ property in the curried functions. */
    let display = (v) => externalBuiltIns.display(v, context.externalContext);
    display.__SOURCE__ = externalBuiltIns.display.__SOURCE__;
    let prompt = (v) => externalBuiltIns.prompt(v, context.externalContext);
    prompt.__SOURCE__ = externalBuiltIns.prompt.__SOURCE__;
    let alert = (v) => externalBuiltIns.alert(v, context.externalContext);
    alert.__SOURCE__ = externalBuiltIns.alert.__SOURCE__;
    let visualiseList = (list) => externalBuiltIns.visualiseList(list, context.externalContext);
    visualiseList.__SOURCE__ = externalBuiltIns.visualiseList.__SOURCE__;
    if (context.chapter >= 1) {
        defineSymbol(context, 'runtime', misc.runtime);
        defineSymbol(context, 'display', display);
        defineSymbol(context, 'error', misc.error_message);
        defineSymbol(context, 'prompt', prompt);
        defineSymbol(context, 'parse_int', misc.parse_int);
        defineSymbol(context, 'undefined', undefined);
        defineSymbol(context, 'NaN', NaN);
        defineSymbol(context, 'Infinity', Infinity);
        // Define all Math libraries
        const objs = Object.getOwnPropertyNames(Math);
        for (const i in objs) {
            if (objs.hasOwnProperty(i)) {
                const val = objs[i];
                if (typeof Math[val] === 'function') {
                    defineSymbol(context, 'math_' + val, Math[val].bind());
                }
                else {
                    defineSymbol(context, 'math_' + val, Math[val]);
                }
            }
        }
    }
    if (context.chapter >= 2) {
        // List library
        defineSymbol(context, 'pair', list.pair);
        defineSymbol(context, 'is_pair', list.is_pair);
        defineSymbol(context, 'head', list.head);
        defineSymbol(context, 'tail', list.tail);
        defineSymbol(context, 'is_empty_list', list.is_empty_list);
        defineSymbol(context, 'is_list', list.is_list);
        defineSymbol(context, 'list', list.list);
        defineSymbol(context, 'length', list.length);
        defineSymbol(context, 'map', list.map);
        defineSymbol(context, 'build_list', list.build_list);
        defineSymbol(context, 'for_each', list.for_each);
        defineSymbol(context, 'list_to_string', list.list_to_string);
        defineSymbol(context, 'reverse', list.reverse);
        defineSymbol(context, 'append', list.append);
        defineSymbol(context, 'member', list.member);
        defineSymbol(context, 'remove', list.remove);
        defineSymbol(context, 'remove_all', list.remove_all);
        defineSymbol(context, 'filter', list.filter);
        defineSymbol(context, 'enum_list', list.enum_list);
        defineSymbol(context, 'list_ref', list.list_ref);
        defineSymbol(context, 'accumulate', list.accumulate);
        defineSymbol(context, 'equal', list.equal);
        defineSymbol(context, 'draw_list', visualiseList);
    }
    if (context.chapter >= 3) {
        defineSymbol(context, 'set_head', list.set_head);
        defineSymbol(context, 'set_tail', list.set_tail);
        defineSymbol(context, 'array_length', misc.array_length);
    }
    if (context.chapter >= 4) {
        defineSymbol(context, 'stringify', JSON.stringify);
        defineSymbol(context, 'parse', function () {
            return context.metaCircularParser
                .parse.apply(context.metaCircularParser, arguments);
        });
        defineSymbol(context, 'apply_in_underlying_javascript', function (fun, args) {
            const res = [];
            var i = 0;
            while (!(args.length === 0)) {
                res[i] = args[0];
                i = i + 1;
                args = args[1];
            }
            return fun.apply(fun, res);
        });
        defineSymbol(context, 'is_number', misc.is_number);
        defineSymbol(context, 'is_array', misc.is_array);
        defineSymbol(context, 'is_object', misc.is_object);
        defineSymbol(context, 'is_string', misc.is_string);
        defineSymbol(context, 'is_function', misc.is_function);
        defineSymbol(context, 'is_boolean', misc.is_boolean);
    }
    if (context.chapter >= Infinity) {
        // previously week 4
        defineSymbol(context, 'alert', alert);
        // tslint:disable-next-line:ban-types
        defineSymbol(context, 'timed', (f) => misc.timed(context, f, context.externalContext, externalBuiltIns.display));
        // previously week 5
        defineSymbol(context, 'assoc', list.assoc);
        // previously week 6
    }
};
const defaultBuiltIns = {
    display: misc.display,
    // See issue #5
    prompt: (v, e) => _1.toString(v),
    // See issue #11
    alert: misc.display,
    visualiseList: (list) => {
        throw new Error('List visualizer is not enabled');
    }
};
const createContext = (chapter = 1, externalSymbols = [], externalContext, externalBuiltIns = defaultBuiltIns) => {
    const context = exports.createEmptyContext(chapter, externalSymbols, externalContext);
    exports.importBuiltins(context, externalBuiltIns);
    exports.importExternalSymbols(context, externalSymbols);
    return context;
};
exports.default = createContext;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{".":7,"./stdlib/list":26,"./stdlib/misc":27,"./stdlib/parser":28}],7:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const createContext_1 = require("./createContext");
exports.createContext = createContext_1.default;
const interop_1 = require("./interop");
exports.toString = interop_1.toString;
const interpreter_1 = require("./interpreter");
const interpreter_errors_1 = require("./interpreter-errors");
const parser_1 = require("./parser");
const schedulers_1 = require("./schedulers");
const DEFAULT_OPTIONS = {
    scheduler: 'async',
    steps: 1000
};
function parseError(errors) {
    const errorMessagesArr = errors.map(error => {
        const line = error.location ? error.location.start.line : '<unknown>';
        const explanation = error.explain();
        return `Line ${line}: ${explanation}`;
    });
    return errorMessagesArr.join('\n');
}
exports.parseError = parseError;
function runInContext(code, context, options = {}) {
    const theOptions = Object.assign({}, DEFAULT_OPTIONS, options);
    context.errors = [];
    const program = parser_1.parse(code, context);
    if (program) {
        const it = interpreter_1.evaluate(program, context);
        let scheduler;
        if (theOptions.scheduler === 'async') {
            scheduler = new schedulers_1.AsyncScheduler();
        }
        else {
            scheduler = new schedulers_1.PreemptiveScheduler(theOptions.steps);
        }
        return scheduler.run(it, context);
    }
    else {
        return Promise.resolve({ status: 'error' });
    }
}
exports.runInContext = runInContext;
function resume(result) {
    if (result.status === 'finished' || result.status === 'error') {
        return result;
    }
    else {
        return result.scheduler.run(result.it, result.context);
    }
}
exports.resume = resume;
function interrupt(context) {
    const globalFrame = context.runtime.frames[context.runtime.frames.length - 1];
    context.runtime.frames = [globalFrame];
    context.runtime.isRunning = false;
    context.errors.push(new interpreter_errors_1.InterruptedError(context.runtime.nodes[0]));
}
exports.interrupt = interrupt;

},{"./createContext":6,"./interop":8,"./interpreter":10,"./interpreter-errors":9,"./parser":11,"./schedulers":25}],8:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const astring_1 = require("astring");
const constants_1 = require("./constants");
const interpreter_1 = require("./interpreter");
const types_1 = require("./types");
exports.closureToJS = (value, context, klass) => {
    function DummyClass() {
        const args = Array.prototype.slice.call(arguments);
        const gen = interpreter_1.apply(context, value, args, undefined, this);
        let it = gen.next();
        while (!it.done) {
            it = gen.next();
        }
        return it.value;
    }
    Object.defineProperty(DummyClass, 'name', {
        value: klass
    });
    Object.setPrototypeOf(DummyClass, () => { });
    Object.defineProperty(DummyClass, 'Inherits', {
        value: (Parent) => {
            DummyClass.prototype = Object.create(Parent.prototype);
            DummyClass.prototype.constructor = DummyClass;
        }
    });
    DummyClass.call = (thisArg, ...args) => {
        return DummyClass.apply(thisArg, args);
    };
    return DummyClass;
};
exports.toJS = (value, context, klass) => {
    if (value instanceof types_1.Closure || value instanceof types_1.ArrowClosure) {
        return value.fun;
    }
    else {
        return value;
    }
};
const stripBody = (body) => {
    const lines = body.split(/\n/);
    if (lines.length >= 2) {
        return lines[0] + '\n\t[implementation hidden]\n' + lines[lines.length - 1];
    }
    else {
        return body;
    }
};
const arrayToString = (value, length) => {
    // Normal Array
    if (value.length > 2 || value.length === 1) {
        return `[${value.map(v => exports.toString(v, length + 1)).join(', ')}]`;
    }
    else if (value.length === 0) {
        return '[]';
    }
    else {
        return `[${exports.toString(value[0], length + 1)}, ${exports.toString(value[1], length + 1)}]`;
    }
};
exports.toString = (value, length = 0) => {
    if (value instanceof types_1.ArrowClosure || value instanceof types_1.Closure) {
        return astring_1.generate(value.node);
    }
    else if (Array.isArray(value)) {
        if (length > constants_1.MAX_LIST_DISPLAY_LENGTH) {
            return '...<truncated>';
        }
        else {
            return arrayToString(value, length);
        }
    }
    else if (typeof value === 'string') {
        return `\"${value}\"`;
    }
    else if (typeof value === 'undefined') {
        return 'undefined';
    }
    else if (typeof value === 'function') {
        if (value.__SOURCE__) {
            return `function ${value.__SOURCE__} {\n\t[implementation hidden]\n}`;
        }
        else {
            return stripBody(value.toString());
        }
    }
    else if (value === null) {
        return 'null';
    }
    else {
        return value.toString();
    }
};

},{"./constants":5,"./interpreter":10,"./types":30,"astring":36}],9:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/* tslint:disable: max-classes-per-file */
const astring_1 = require("astring");
const common_tags_1 = require("common-tags");
const constants_1 = require("./constants");
const interop_1 = require("./interop");
const types_1 = require("./types");
class InterruptedError {
    constructor(node) {
        this.type = types_1.ErrorType.RUNTIME;
        this.severity = types_1.ErrorSeverity.ERROR;
        this.location = node.loc;
    }
    explain() {
        return 'Execution aborted by user.';
    }
    elaborate() {
        return 'TODO';
    }
}
exports.InterruptedError = InterruptedError;
class ExceptionError {
    constructor(error, location) {
        this.error = error;
        this.location = location;
        this.type = types_1.ErrorType.RUNTIME;
        this.severity = types_1.ErrorSeverity.ERROR;
    }
    explain() {
        return this.error.toString();
    }
    elaborate() {
        return 'TODO';
    }
}
exports.ExceptionError = ExceptionError;
class MaximumStackLimitExceeded {
    constructor(node, calls) {
        this.calls = calls;
        this.type = types_1.ErrorType.RUNTIME;
        this.severity = types_1.ErrorSeverity.ERROR;
        this.customGenerator = Object.assign({}, astring_1.baseGenerator, { CallExpression(node, state) {
                state.write(node.callee.name);
                state.write('(');
                const argsRepr = node.arguments.map((args) => interop_1.toString(args.value));
                state.write(argsRepr.join(', '));
                state.write(')');
            } });
        this.location = node ? node.loc : constants_1.UNKNOWN_LOCATION;
    }
    explain() {
        const repr = (call) => astring_1.generate(call, { generator: this.customGenerator });
        return common_tags_1.stripIndent `
      Infinite recursion
        ${repr(this.calls[2])}..  ${repr(this.calls[1])}..  ${repr(this.calls[0])}..
    `;
    }
    elaborate() {
        return 'TODO';
    }
}
exports.MaximumStackLimitExceeded = MaximumStackLimitExceeded;
class CallingNonFunctionValue {
    constructor(callee, node) {
        this.callee = callee;
        this.type = types_1.ErrorType.RUNTIME;
        this.severity = types_1.ErrorSeverity.ERROR;
        if (node) {
            this.location = node.loc;
        }
        else {
            this.location = constants_1.UNKNOWN_LOCATION;
        }
    }
    explain() {
        return `Calling non-function value ${interop_1.toString(this.callee)}`;
    }
    elaborate() {
        return 'TODO';
    }
}
exports.CallingNonFunctionValue = CallingNonFunctionValue;
class UndefinedVariable {
    constructor(name, node) {
        this.name = name;
        this.type = types_1.ErrorType.RUNTIME;
        this.severity = types_1.ErrorSeverity.ERROR;
        this.location = node.loc;
    }
    explain() {
        return `Name ${this.name} not declared`;
    }
    elaborate() {
        return 'TODO';
    }
}
exports.UndefinedVariable = UndefinedVariable;
class InvalidNumberOfArguments {
    constructor(node, expected, got) {
        this.expected = expected;
        this.got = got;
        this.type = types_1.ErrorType.RUNTIME;
        this.severity = types_1.ErrorSeverity.ERROR;
        this.location = node.loc;
    }
    explain() {
        return `Expected ${this.expected} arguments, but got ${this.got}`;
    }
    elaborate() {
        return 'TODO';
    }
}
exports.InvalidNumberOfArguments = InvalidNumberOfArguments;
class VariableRedeclaration {
    constructor(node, name) {
        this.name = name;
        this.type = types_1.ErrorType.RUNTIME;
        this.severity = types_1.ErrorSeverity.ERROR;
        this.location = node.loc;
    }
    explain() {
        return `Redeclaring name ${this.name}`;
    }
    elaborate() {
        return 'TODO';
    }
}
exports.VariableRedeclaration = VariableRedeclaration;
class ConstAssignment {
    constructor(node, name) {
        this.name = name;
        this.type = types_1.ErrorType.RUNTIME;
        this.severity = types_1.ErrorSeverity.ERROR;
        this.location = node.loc;
    }
    explain() {
        return `Cannot assign new value to constant ${this.name}`;
    }
    elaborate() {
        return 'TODO';
    }
}
exports.ConstAssignment = ConstAssignment;
class EmptyForExpression {
    constructor(node, missing) {
        this.missing = missing;
        this.type = types_1.ErrorType.RUNTIME;
        this.severity = types_1.ErrorSeverity.ERROR;
        this.location = node.loc;
    }
    explain() {
        const exp = this.missing.length > 1 ? 'expressions' : 'expression';
        return `For statement cannot have empty ${this.missing.join(',')} ${exp}.`;
    }
    elaborate() {
        return 'TODO';
    }
}
exports.EmptyForExpression = EmptyForExpression;

},{"./constants":5,"./interop":8,"./types":30,"astring":36,"common-tags":48}],10:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const constants = require("./constants");
const interop_1 = require("./interop");
const errors = require("./interpreter-errors");
const types_1 = require("./types");
const node_1 = require("./utils/node");
const rttc = require("./utils/rttc");
class ReturnValue {
    constructor(value) {
        this.value = value;
    }
}
class BreakValue {
}
class ContinueValue {
}
class TailCallReturnValue {
    constructor(callee, args, node) {
        this.callee = callee;
        this.args = args;
        this.node = node;
    }
}
const createFrame = (closure, args, callExpression) => {
    const frame = {
        name: closure.name,
        parent: closure.frame,
        environment: {}
    };
    if (callExpression) {
        frame.callExpression = Object.assign({}, callExpression, { arguments: args.map(a => node_1.createNode(a)) });
    }
    closure.node.params.forEach((param, index) => {
        const ident = param;
        frame.environment[ident.name] = args[index];
    });
    return frame;
};
const createBlockFrame = (context, name = "blockFrame", environment = {}) => {
    const frame = {
        name,
        parent: currentFrame(context),
        environment,
        thisContext: context
    };
    return frame;
};
const handleError = (context, error) => {
    context.errors.push(error);
    if (error.severity === types_1.ErrorSeverity.ERROR) {
        const globalFrame = context.runtime.frames[context.runtime.frames.length - 1];
        context.runtime.frames = [globalFrame];
        throw error;
    }
    else {
        return context;
    }
};
function defineVariable(context, name, value, constant = false) {
    const frame = context.runtime.frames[0];
    if (frame.environment.hasOwnProperty(name)) {
        handleError(context, new errors.VariableRedeclaration(context.runtime.nodes[0], name));
    }
    Object.defineProperty(frame.environment, name, {
        value,
        writable: !constant,
        enumerable: true
    });
    return frame;
}
function* visit(context, node) {
    context.runtime.nodes.unshift(node);
    yield context;
}
function* leave(context) {
    context.runtime.nodes.shift();
    yield context;
}
const currentFrame = (context) => context.runtime.frames[0];
const replaceFrame = (context, frame) => (context.runtime.frames[0] = frame);
const popFrame = (context) => context.runtime.frames.shift();
const pushFrame = (context, frame) => context.runtime.frames.unshift(frame);
const getVariable = (context, name) => {
    let frame = context.runtime.frames[0];
    while (frame) {
        if (frame.environment.hasOwnProperty(name)) {
            return frame.environment[name];
        }
        else {
            frame = frame.parent;
        }
    }
    handleError(context, new errors.UndefinedVariable(name, context.runtime.nodes[0]));
};
const setVariable = (context, name, value) => {
    let frame = context.runtime.frames[0];
    while (frame) {
        if (frame.environment.hasOwnProperty(name)) {
            const descriptors = Object.getOwnPropertyDescriptors(frame.environment);
            if (descriptors[name].writable) {
                frame.environment[name] = value;
                return;
            }
            const error = new errors.ConstAssignment(context.runtime.nodes[0], name);
            handleError(context, error);
        }
        else {
            frame = frame.parent;
        }
    }
    handleError(context, new errors.UndefinedVariable(name, context.runtime.nodes[0]));
};
const checkNumberOfArguments = (context, callee, args, exp) => {
    if (callee.node.params.length !== args.length) {
        const error = new errors.InvalidNumberOfArguments(exp, callee.node.params.length, args.length);
        handleError(context, error);
    }
};
function* getArgs(context, call) {
    const args = [];
    for (const arg of call.arguments) {
        args.push(yield* evaluate(arg, context));
    }
    return args;
}
/**
 * WARNING: Do not use object literal shorthands, e.g.
 *   {
 *     *Literal(node: es.Literal, ...) {...},
 *     *ThisExpression(node: es.ThisExpression, ..._ {...},
 *     ...
 *   }
 * They do not minify well, raising uncaught syntax errors in production.
 * See: https://github.com/webpack/webpack/issues/7566
 */
exports.evaluators = {
    /** Simple Values */
    Literal: function* (node, context) {
        return node.value;
    },
    ThisExpression: function* (node, context) {
        return context.runtime.frames[0].thisContext;
    },
    ArrayExpression: function* (node, context) {
        const res = [];
        for (const n of node.elements) {
            res.push(yield* evaluate(n, context));
        }
        return res;
    },
    FunctionExpression: function* (node, context) {
        return new types_1.Closure(node, currentFrame(context), context);
    },
    ArrowFunctionExpression: function* (node, context) {
        return new types_1.ArrowClosure(node, currentFrame(context), context);
    },
    Identifier: function* (node, context) {
        return getVariable(context, node.name);
    },
    CallExpression: function* (node, context) {
        const callee = yield* evaluate(node.callee, context);
        const args = yield* getArgs(context, node);
        let thisContext;
        if (node.callee.type === 'MemberExpression') {
            thisContext = yield* evaluate(node.callee.object, context);
        }
        const result = yield* apply(context, callee, args, node, thisContext);
        return result;
    },
    NewExpression: function* (node, context) {
        const callee = yield* evaluate(node.callee, context);
        const args = [];
        for (const arg of node.arguments) {
            args.push(yield* evaluate(arg, context));
        }
        const obj = {};
        if (callee instanceof types_1.Closure) {
            obj.__proto__ = callee.fun.prototype;
            callee.fun.apply(obj, args);
        }
        else {
            obj.__proto__ = callee.prototype;
            callee.apply(obj, args);
        }
        return obj;
    },
    UnaryExpression: function* (node, context) {
        const value = yield* evaluate(node.argument, context);
        const error = rttc.checkUnaryExpression(context, node.operator, value);
        if (error) {
            handleError(context, error);
            return undefined;
        }
        if (node.operator === '!') {
            return !value;
        }
        else if (node.operator === '-') {
            return -value;
        }
        else {
            return +value;
        }
    },
    BinaryExpression: function* (node, context) {
        let left = yield* evaluate(node.left, context);
        let right = yield* evaluate(node.right, context);
        const error = rttc.checkBinaryExpression(context, node.operator, left, right);
        if (error) {
            handleError(context, error);
            return undefined;
        }
        let result;
        switch (node.operator) {
            case '+':
                let isLeftString = typeof left === 'string';
                let isRightString = typeof right === 'string';
                if (isLeftString && !isRightString) {
                    right = interop_1.toString(right);
                }
                else if (isRightString && !isLeftString) {
                    left = interop_1.toString(left);
                }
                result = left + right;
                break;
            case '-':
                result = left - right;
                break;
            case '*':
                result = left * right;
                break;
            case '/':
                result = left / right;
                break;
            case '%':
                result = left % right;
                break;
            case '===':
                result = left === right;
                break;
            case '!==':
                result = left !== right;
                break;
            case '<=':
                result = left <= right;
                break;
            case '<':
                result = left < right;
                break;
            case '>':
                result = left > right;
                break;
            case '>=':
                result = left >= right;
                break;
            default:
                result = undefined;
        }
        return result;
    },
    ConditionalExpression: function* (node, context) {
        return yield* this.IfStatement(node, context);
    },
    LogicalExpression: function* (node, context) {
        const left = yield* evaluate(node.left, context);
        let error = rttc.checkLogicalExpression(context, left, true);
        if (error) {
            handleError(context, error);
            return undefined;
        }
        else if ((node.operator === '&&' && left) || (node.operator === '||' && !left)) {
            // only evaluate right if required (lazy); but when we do, check typeof right
            const right = yield* evaluate(node.right, context);
            error = rttc.checkLogicalExpression(context, left, right);
            if (error) {
                handleError(context, error);
                return undefined;
            }
            else {
                return right;
            }
        }
        else {
            return left;
        }
    },
    VariableDeclaration: function* (node, context) {
        const declaration = node.declarations[0];
        const constant = (node.kind == "const");
        const id = declaration.id;
        const value = yield* evaluate(declaration.init, context);
        defineVariable(context, id.name, value, constant);
        return undefined;
    },
    ContinueStatement: function* (node, context) {
        return new ContinueValue();
    },
    BreakStatement: function* (node, context) {
        return new BreakValue();
    },
    ForStatement: function* (node, context) {
        // Check that all 3 expressions are not empty in a for loop
        const missing_parts = ["init", "test", "update"].filter(part => node[part] === null);
        if (missing_parts.length > 0) {
            const error = new errors.EmptyForExpression(node, missing_parts);
            handleError(context, error);
        }
        // Create a new block scope for the loop variables
        const loopFrame = createBlockFrame(context, "forLoopFrame");
        pushFrame(context, loopFrame);
        if (node.init) {
            yield* evaluate(node.init, context);
        }
        let test = node.test ? yield* evaluate(node.test, context) : true;
        let value;
        while (test) {
            // create block context and shallow copy loop frame environment
            // see https://www.ecma-international.org/ecma-262/6.0/#sec-for-statement-runtime-semantics-labelledevaluation
            // and https://hacks.mozilla.org/2015/07/es6-in-depth-let-and-const/
            // We copy this as a const to avoid ES6 funkiness when mutating loop vars
            // https://github.com/source-academy/js-slang/issues/65#issuecomment-425618227
            const frame = createBlockFrame(context, "forBlockFrame");
            pushFrame(context, frame);
            for (let name in loopFrame.environment) {
                defineVariable(context, name, loopFrame.environment[name], true);
            }
            value = yield* evaluate(node.body, context);
            // Remove block context
            popFrame(context);
            if (value instanceof ContinueValue) {
                value = undefined;
            }
            if (value instanceof BreakValue) {
                value = undefined;
                break;
            }
            if (value instanceof ReturnValue) {
                break;
            }
            if (node.update) {
                yield* evaluate(node.update, context);
            }
            test = node.test ? yield* evaluate(node.test, context) : true;
        }
        popFrame(context);
        if (value instanceof BreakValue) {
            return undefined;
        }
        return value;
    },
    MemberExpression: function* (node, context) {
        let obj = yield* evaluate(node.object, context);
        if (obj instanceof types_1.Closure) {
            obj = obj.fun;
        }
        if (node.computed) {
            const prop = yield* evaluate(node.property, context);
            return obj[prop];
        }
        else {
            const name = node.property.name;
            if (name === 'prototype') {
                return obj.prototype;
            }
            else {
                return obj[name];
            }
        }
    },
    AssignmentExpression: function* (node, context) {
        if (node.left.type === 'MemberExpression') {
            const left = node.left;
            const obj = yield* evaluate(left.object, context);
            let prop;
            if (left.computed) {
                prop = yield* evaluate(left.property, context);
            }
            else {
                prop = left.property.name;
            }
            const val = yield* evaluate(node.right, context);
            obj[prop] = val;
            return val;
        }
        const id = node.left;
        // Make sure it exist
        const value = yield* evaluate(node.right, context);
        setVariable(context, id.name, value);
        return value;
    },
    FunctionDeclaration: function* (node, context) {
        const id = node.id;
        // tslint:disable-next-line:no-any
        const closure = new types_1.Closure(node, currentFrame(context), context);
        defineVariable(context, id.name, closure, true);
        return undefined;
    },
    *IfStatement(node, context) {
        const test = yield* evaluate(node.test, context);
        const error = rttc.checkIfStatement(context, test);
        if (error) {
            handleError(context, error);
            return undefined;
        }
        if (test) {
            const result = yield* evaluate(node.consequent, context);
            return result;
        }
        else if (node.alternate) {
            const result = yield* evaluate(node.alternate, context);
            return result;
        }
        else {
            return undefined;
        }
    },
    ExpressionStatement: function* (node, context) {
        return yield* evaluate(node.expression, context);
    },
    *ReturnStatement(node, context) {
        if (node.argument) {
            if (node.argument.type === 'CallExpression') {
                const callee = yield* evaluate(node.argument.callee, context);
                const args = yield* getArgs(context, node.argument);
                return new TailCallReturnValue(callee, args, node.argument);
            }
            else {
                return new ReturnValue(yield* evaluate(node.argument, context));
            }
        }
        else {
            return new ReturnValue(undefined);
        }
    },
    WhileStatement: function* (node, context) {
        let value; // tslint:disable-line
        let test;
        while (
        // tslint:disable-next-line
        (test = yield* evaluate(node.test, context)) &&
            !(value instanceof ReturnValue) &&
            !(value instanceof BreakValue) &&
            !(value instanceof TailCallReturnValue)) {
            value = yield* evaluate(node.body, context);
        }
        if (value instanceof BreakValue) {
            return undefined;
        }
        return value;
    },
    ObjectExpression: function* (node, context) {
        const obj = {};
        for (const prop of node.properties) {
            let key;
            if (prop.key.type === 'Identifier') {
                key = prop.key.name;
            }
            else {
                key = yield* evaluate(prop.key, context);
            }
            obj[key] = yield* evaluate(prop.value, context);
        }
        return obj;
    },
    BlockStatement: function* (node, context) {
        let result;
        // Create a new frame (block scoping)
        const frame = createBlockFrame(context, "blockFrame");
        pushFrame(context, frame);
        for (const statement of node.body) {
            result = yield* evaluate(statement, context);
            if (result instanceof ReturnValue ||
                result instanceof BreakValue ||
                result instanceof ContinueValue) {
                break;
            }
        }
        popFrame(context);
        return result;
    },
    Program: function* (node, context) {
        let result;
        for (const statement of node.body) {
            result = yield* evaluate(statement, context);
            if (result instanceof ReturnValue) {
                break;
            }
        }
        return result;
    }
};
function* evaluate(node, context) {
    yield* visit(context, node);
    const result = yield* exports.evaluators[node.type](node, context);
    yield* leave(context);
    return result;
}
exports.evaluate = evaluate;
function* apply(context, fun, args, node, thisContext) {
    let result;
    let total = 0;
    while (!(result instanceof ReturnValue)) {
        if (fun instanceof types_1.Closure) {
            checkNumberOfArguments(context, fun, args, node);
            const frame = createFrame(fun, args, node);
            frame.thisContext = thisContext;
            if (result instanceof TailCallReturnValue) {
                replaceFrame(context, frame);
            }
            else {
                pushFrame(context, frame);
                total++;
            }
            result = yield* evaluate(fun.node.body, context);
            if (result instanceof TailCallReturnValue) {
                fun = result.callee;
                node = result.node;
                args = result.args;
            }
            else if (!(result instanceof ReturnValue)) {
                // No Return Value, set it as undefined
                result = new ReturnValue(undefined);
            }
        }
        else if (fun instanceof types_1.ArrowClosure) {
            checkNumberOfArguments(context, fun, args, node);
            const frame = createFrame(fun, args, node);
            frame.thisContext = thisContext;
            if (result instanceof TailCallReturnValue) {
                replaceFrame(context, frame);
            }
            else {
                pushFrame(context, frame);
                total++;
            }
            result = new ReturnValue(yield* evaluate(fun.node.body, context));
        }
        else if (typeof fun === 'function') {
            try {
                const as = args.map(a => interop_1.toJS(a, context));
                result = fun.apply(thisContext, as);
                break;
            }
            catch (e) {
                // Recover from exception
                const globalFrame = context.runtime.frames[context.runtime.frames.length - 1];
                context.runtime.frames = [globalFrame];
                const loc = node ? node.loc : constants.UNKNOWN_LOCATION;
                handleError(context, new errors.ExceptionError(e, loc));
                result = undefined;
            }
        }
        else {
            handleError(context, new errors.CallingNonFunctionValue(fun, node));
            result = undefined;
            break;
        }
    }
    // Unwraps return value and release stack frame
    if (result instanceof ReturnValue) {
        result = result.value;
    }
    for (let i = 1; i <= total; i++) {
        popFrame(context);
    }
    return result;
}
exports.apply = apply;

},{"./constants":5,"./interop":8,"./interpreter-errors":9,"./types":30,"./utils/node":31,"./utils/rttc":32}],11:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/* tslint:disable: max-classes-per-file */
const acorn_1 = require("acorn");
const walk_1 = require("acorn/dist/walk");
const common_tags_1 = require("common-tags");
const rules_1 = require("./rules");
const syntaxTypes_1 = require("./syntaxTypes");
const types_1 = require("./types");
class DisallowedConstructError {
    constructor(node) {
        this.node = node;
        this.type = types_1.ErrorType.SYNTAX;
        this.severity = types_1.ErrorSeverity.ERROR;
        this.nodeType = this.formatNodeType(this.node.type);
    }
    get location() {
        return this.node.loc;
    }
    explain() {
        return `${this.nodeType} are not allowed`;
    }
    elaborate() {
        return common_tags_1.stripIndent `
      You are trying to use ${this.nodeType}, which is not yet allowed (yet).
    `;
    }
    /**
     * Converts estree node.type into english
     * e.g. ThisExpression -> 'this' expressions
     *      Property -> Properties
     *      EmptyStatement -> Empty Statements
     */
    formatNodeType(nodeType) {
        switch (nodeType) {
            case 'ThisExpression':
                return "'this' expressions";
            case 'Property':
                return 'Properties';
            default:
                const words = nodeType.split(/(?=[A-Z])/);
                return words.map((word, i) => (i === 0 ? word : word.toLowerCase())).join(' ') + 's';
        }
    }
}
exports.DisallowedConstructError = DisallowedConstructError;
class FatalSyntaxError {
    constructor(location, message) {
        this.location = location;
        this.message = message;
        this.type = types_1.ErrorType.SYNTAX;
        this.severity = types_1.ErrorSeverity.ERROR;
    }
    explain() {
        return this.message;
    }
    elaborate() {
        return 'There is a syntax error in your program';
    }
}
exports.FatalSyntaxError = FatalSyntaxError;
class MissingSemicolonError {
    constructor(location) {
        this.location = location;
        this.type = types_1.ErrorType.SYNTAX;
        this.severity = types_1.ErrorSeverity.ERROR;
    }
    explain() {
        return 'Missing semicolon at the end of statement';
    }
    elaborate() {
        return 'Every statement must be terminated by a semicolon.';
    }
}
exports.MissingSemicolonError = MissingSemicolonError;
class TrailingCommaError {
    constructor(location) {
        this.location = location;
    }
    explain() {
        return 'Trailing comma';
    }
    elaborate() {
        return 'Please remove the trailing comma';
    }
}
exports.TrailingCommaError = TrailingCommaError;
function parse(source, context) {
    let program;
    try {
        program = acorn_1.parse(source, createAcornParserOptions(context));
        walk_1.simple(program, walkers, undefined, context);
    }
    catch (error) {
        if (error instanceof SyntaxError) {
            // tslint:disable-next-line:no-any
            const loc = error.loc;
            const location = {
                start: { line: loc.line, column: loc.column },
                end: { line: loc.line, column: loc.column + 1 }
            };
            context.errors.push(new FatalSyntaxError(location, error.toString()));
        }
        else {
            throw error;
        }
    }
    const hasErrors = context.errors.find(m => m.severity === types_1.ErrorSeverity.ERROR);
    if (program && !hasErrors) {
        // context.cfg.scopes[0].node = program
        return program;
    }
    else {
        return undefined;
    }
}
exports.parse = parse;
const createAcornParserOptions = (context) => ({
    sourceType: 'script',
    ecmaVersion: 6,
    locations: true,
    // tslint:disable-next-line:no-any
    onInsertedSemicolon(end, loc) {
        context.errors.push(new MissingSemicolonError({
            end: { line: loc.line, column: loc.column + 1 },
            start: loc
        }));
    },
    // tslint:disable-next-line:no-any
    onTrailingComma(end, loc) {
        context.errors.push(new TrailingCommaError({
            end: { line: loc.line, column: loc.column + 1 },
            start: loc
        }));
    }
});
function createWalkers(allowedSyntaxes, parserRules) {
    const newWalkers = new Map();
    // Provide callbacks checking for disallowed syntaxes, such as case, switch...
    const syntaxPairs = Object.entries(allowedSyntaxes);
    syntaxPairs.map(pair => {
        const syntax = pair[0];
        const allowedChap = pair[1];
        newWalkers.set(syntax, (node, context) => {
            const id = exports.freshId();
            Object.defineProperty(node, '__id', {
                enumerable: true,
                configurable: false,
                writable: false,
                value: id
            });
            context.cfg.nodes[id] = {
                id,
                node,
                scope: undefined,
                usages: []
            };
            context.cfg.edges[id] = [];
            if (context.chapter < allowedChap) {
                context.errors.push(new DisallowedConstructError(node));
            }
        });
    });
    // Provide callbacks checking for rule violations, e.g. no block arrow funcs, non-empty lists...
    parserRules.forEach(rule => {
        const checkers = rule.checkers;
        const syntaxCheckerPair = Object.entries(checkers);
        syntaxCheckerPair.forEach(pair => {
            const syntax = pair[0];
            const checker = pair[1];
            const oldCheck = newWalkers.get(syntax);
            const newCheck = (node, context) => {
                if (typeof rule.disableOn !== 'undefined' && context.chapter >= rule.disableOn) {
                    return;
                }
                const errors = checker(node);
                errors.forEach(e => context.errors.push(e));
            };
            newWalkers.set(syntax, (node, context) => {
                if (oldCheck) {
                    oldCheck(node, context);
                }
                newCheck(node, context);
            });
        });
    });
    return mapToObj(newWalkers);
}
exports.freshId = (() => {
    let id = 0;
    return () => {
        id++;
        return 'node_' + id;
    };
})();
const mapToObj = (map) => Array.from(map).reduce((obj, [k, v]) => Object.assign(obj, { [k]: v }), {});
const walkers = createWalkers(syntaxTypes_1.default, rules_1.default);

},{"./rules":14,"./syntaxTypes":29,"./types":30,"acorn":34,"acorn/dist/walk":35,"common-tags":48}],12:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const astring_1 = require("astring");
const common_tags_1 = require("common-tags");
const types_1 = require("../types");
class BracesAroundIfElseError {
    constructor(node, branch) {
        this.node = node;
        this.branch = branch;
        this.type = types_1.ErrorType.SYNTAX;
        this.severity = types_1.ErrorSeverity.ERROR;
    }
    get location() {
        return this.node.loc;
    }
    explain() {
        if (this.branch === 'consequent') {
            return 'Missing curly braces around "if" block';
        }
        else {
            return 'Missing curly braces around "else" block';
        }
    }
    elaborate() {
        let ifOrElse;
        let header;
        let body;
        if (this.branch === 'consequent') {
            ifOrElse = 'if';
            header = `if (${astring_1.generate(this.node.test)})`;
            body = this.node.consequent;
        }
        else {
            ifOrElse = header = 'else';
            body = this.node.alternate;
        }
        return common_tags_1.stripIndent `
      ${ifOrElse} block need to be enclosed with a pair of curly braces.

      ${header} {
        ${astring_1.generate(body)}
      }

      An exception is when you have an "if" followed by "else if", in this case
      "else if" block does not need to be surrounded by curly braces.

      if (someCondition) {
        // ...
      } else /* notice missing { here */ if (someCondition) {
        // ...
      } else {
        // ...
      }

      Rationale: Readability in dense packed code.

      In the snippet below, for instance, with poor indentation it is easy to
      mistaken hello() and world() to belong to the same branch of logic.

      if (someCondition) {
        2;
      } else
        hello();
      world();

    `;
    }
}
exports.BracesAroundIfElseError = BracesAroundIfElseError;
const bracesAroundIfElse = {
    name: 'braces-around-if-else',
    checkers: {
        IfStatement(node) {
            const errors = [];
            if (node.consequent && node.consequent.type !== 'BlockStatement') {
                errors.push(new BracesAroundIfElseError(node, 'consequent'));
            }
            if (node.alternate) {
                const notBlock = node.alternate.type !== 'BlockStatement';
                const notIf = node.alternate.type !== 'IfStatement';
                if (notBlock && notIf) {
                    errors.push(new BracesAroundIfElseError(node, 'alternate'));
                }
            }
            return errors;
        }
    }
};
exports.default = bracesAroundIfElse;

},{"../types":30,"astring":36,"common-tags":48}],13:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const types_1 = require("../types");
class BracesAroundWhileError {
    constructor(node) {
        this.node = node;
        this.type = types_1.ErrorType.SYNTAX;
        this.severity = types_1.ErrorSeverity.ERROR;
    }
    get location() {
        return this.node.loc;
    }
    explain() {
        return 'Missing curly braces around "while" block';
    }
    elaborate() {
        return 'TODO';
    }
}
exports.BracesAroundWhileError = BracesAroundWhileError;
const bracesAroundWhile = {
    name: 'braces-around-while',
    checkers: {
        WhileStatement(node) {
            if (node.body.type !== 'BlockStatement') {
                return [new BracesAroundWhileError(node)];
            }
            else {
                return [];
            }
        }
    }
};
exports.default = bracesAroundWhile;

},{"../types":30}],14:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bracesAroundIfElse_1 = require("./bracesAroundIfElse");
const bracesAroundWhile_1 = require("./bracesAroundWhile");
const noBlockArrowFunction_1 = require("./noBlockArrowFunction");
const noDeclareMutable_1 = require("./noDeclareMutable");
const noDeclareReserved_1 = require("./noDeclareReserved");
const noIfWithoutElse_1 = require("./noIfWithoutElse");
const noImplicitDeclareUndefined_1 = require("./noImplicitDeclareUndefined");
const noImplicitReturnUndefined_1 = require("./noImplicitReturnUndefined");
const noNonEmptyList_1 = require("./noNonEmptyList");
const noUnspecifiedLiteral_1 = require("./noUnspecifiedLiteral");
const noUnspecifiedOperator_1 = require("./noUnspecifiedOperator");
const singleVariableDeclaration_1 = require("./singleVariableDeclaration");
const rules = [
    bracesAroundIfElse_1.default,
    bracesAroundWhile_1.default,
    singleVariableDeclaration_1.default,
    noIfWithoutElse_1.default,
    noImplicitDeclareUndefined_1.default,
    noImplicitReturnUndefined_1.default,
    noNonEmptyList_1.default,
    noBlockArrowFunction_1.default,
    noDeclareReserved_1.default,
    noDeclareMutable_1.default,
    noUnspecifiedLiteral_1.default,
    noUnspecifiedOperator_1.default
];
exports.default = rules;

},{"./bracesAroundIfElse":12,"./bracesAroundWhile":13,"./noBlockArrowFunction":15,"./noDeclareMutable":16,"./noDeclareReserved":17,"./noIfWithoutElse":18,"./noImplicitDeclareUndefined":19,"./noImplicitReturnUndefined":20,"./noNonEmptyList":21,"./noUnspecifiedLiteral":22,"./noUnspecifiedOperator":23,"./singleVariableDeclaration":24}],15:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const types_1 = require("../types");
class NoBlockArrowFunction {
    constructor(node) {
        this.node = node;
        this.type = types_1.ErrorType.SYNTAX;
        this.severity = types_1.ErrorSeverity.ERROR;
    }
    get location() {
        return this.node.loc;
    }
    explain() {
        return 'Function definition expressions may only end with an expression.';
    }
    elaborate() {
        return this.explain();
    }
}
exports.NoBlockArrowFunction = NoBlockArrowFunction;
const noBlockArrowFunction = {
    name: 'no-block-arrow-function',
    checkers: {
        ArrowFunctionExpression(node) {
            if (node.body.type === 'BlockStatement') {
                return [new NoBlockArrowFunction(node)];
            }
            else {
                return [];
            }
        }
    }
};
exports.default = noBlockArrowFunction;

},{"../types":30}],16:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const types_1 = require("../types");
const mutableDeclarators = ['let', 'var'];
class NoDeclareMutableError {
    constructor(node) {
        this.node = node;
        this.type = types_1.ErrorType.SYNTAX;
        this.severity = types_1.ErrorSeverity.ERROR;
    }
    get location() {
        return this.node.loc;
    }
    explain() {
        return ('Mutable variable declaration using keyword ' + `'${this.node.kind}'` + ' is not allowed.');
    }
    elaborate() {
        return this.explain();
    }
}
exports.NoDeclareMutableError = NoDeclareMutableError;
const noDeclareMutable = {
    name: 'no-declare-mutable',
    disableOn: 3,
    checkers: {
        VariableDeclaration(node) {
            if (mutableDeclarators.includes(node.kind)) {
                return [new NoDeclareMutableError(node)];
            }
            else {
                return [];
            }
        }
    }
};
exports.default = noDeclareMutable;

},{"../types":30}],17:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const types_1 = require("../types");
const reservedNames = [
    'break',
    'case',
    'catch',
    'continue',
    'debugger',
    'default',
    'delete',
    'do',
    'else',
    'finally',
    'for',
    'function',
    'if',
    'in',
    'instanceof',
    'new',
    'return',
    'switch',
    'this',
    'throw',
    'try',
    'typeof',
    'var',
    'void',
    'while',
    'with',
    'class',
    'const',
    'enum',
    'export',
    'extends',
    'import',
    'super',
    'implements',
    'interface',
    'let',
    'package',
    'private',
    'protected',
    'public',
    'static',
    'yield',
    'null',
    'true',
    'false'
];
class NoDeclareReservedError {
    constructor(node) {
        this.node = node;
        this.type = types_1.ErrorType.SYNTAX;
        this.severity = types_1.ErrorSeverity.ERROR;
    }
    get location() {
        return this.node.loc;
    }
    explain() {
        return (`Reserved word '${this.node.declarations[0].id.name}'` + ' is not allowed as a name');
    }
    elaborate() {
        return this.explain();
    }
}
exports.NoDeclareReservedError = NoDeclareReservedError;
const noDeclareReserved = {
    name: 'no-declare-reserved',
    checkers: {
        VariableDeclaration(node) {
            if (reservedNames.includes(node.declarations[0].id.name)) {
                return [new NoDeclareReservedError(node)];
            }
            else {
                return [];
            }
        }
    }
};
exports.default = noDeclareReserved;

},{"../types":30}],18:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const astring_1 = require("astring");
const common_tags_1 = require("common-tags");
const types_1 = require("../types");
class NoIfWithoutElseError {
    constructor(node) {
        this.node = node;
        this.type = types_1.ErrorType.SYNTAX;
        this.severity = types_1.ErrorSeverity.ERROR;
    }
    get location() {
        return this.node.loc;
    }
    explain() {
        return 'Missing "else" in "if-else" statement';
    }
    elaborate() {
        return common_tags_1.stripIndent `
      This "if" block requires corresponding "else" block which will be
      evaluated when ${astring_1.generate(this.node.test)} expression evaluates to false.

      Later in the course we will lift this restriction and allow "if" without
      else.
    `;
    }
}
exports.NoIfWithoutElseError = NoIfWithoutElseError;
const noIfWithoutElse = {
    name: 'no-if-without-else',
    checkers: {
        IfStatement(node) {
            if (!node.alternate) {
                return [new NoIfWithoutElseError(node)];
            }
            else {
                return [];
            }
        }
    }
};
exports.default = noIfWithoutElse;

},{"../types":30,"astring":36,"common-tags":48}],19:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_tags_1 = require("common-tags");
const types_1 = require("../types");
class NoImplicitDeclareUndefinedError {
    constructor(node) {
        this.node = node;
        this.type = types_1.ErrorType.SYNTAX;
        this.severity = types_1.ErrorSeverity.ERROR;
    }
    get location() {
        return this.node.loc;
    }
    explain() {
        return 'Missing value in variable declaration';
    }
    elaborate() {
        return common_tags_1.stripIndent `
      A variable declaration assigns a value to a name.
      For instance, to assign 20 to ${this.node.name}, you can write:

        let ${this.node.name} = 20;

        ${this.node.name} + ${this.node.name}; // 40
    `;
    }
}
exports.NoImplicitDeclareUndefinedError = NoImplicitDeclareUndefinedError;
const noImplicitDeclareUndefined = {
    name: 'no-implicit-declare-undefined',
    checkers: {
        VariableDeclaration(node) {
            const errors = [];
            for (const decl of node.declarations) {
                if (!decl.init) {
                    errors.push(new NoImplicitDeclareUndefinedError(decl.id));
                }
            }
            return errors;
        }
    }
};
exports.default = noImplicitDeclareUndefined;

},{"../types":30,"common-tags":48}],20:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_tags_1 = require("common-tags");
const types_1 = require("../types");
class NoImplicitReturnUndefinedError {
    constructor(node) {
        this.node = node;
        this.type = types_1.ErrorType.SYNTAX;
        this.severity = types_1.ErrorSeverity.ERROR;
    }
    get location() {
        return this.node.loc;
    }
    explain() {
        return 'Missing value in return statement';
    }
    elaborate() {
        return common_tags_1.stripIndent `
      This return statement is missing a value.
      For instance, to return the value 42, you can write

        return 42;
    `;
    }
}
exports.NoImplicitReturnUndefinedError = NoImplicitReturnUndefinedError;
const noImplicitReturnUndefined = {
    name: 'no-implicit-return-undefined',
    checkers: {
        ReturnStatement(node) {
            if (!node.argument) {
                return [new NoImplicitReturnUndefinedError(node)];
            }
            else {
                return [];
            }
        }
    }
};
exports.default = noImplicitReturnUndefined;

},{"../types":30,"common-tags":48}],21:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const types_1 = require("../types");
class NoNonEmptyListError {
    constructor(node) {
        this.node = node;
        this.type = types_1.ErrorType.SYNTAX;
        this.severity = types_1.ErrorSeverity.ERROR;
    }
    get location() {
        return this.node.loc;
    }
    explain() {
        return 'Only empty list notation ([]) is allowed';
    }
    elaborate() {
        return 'TODO';
    }
}
exports.NoNonEmptyListError = NoNonEmptyListError;
const noNonEmptyList = {
    name: 'no-non-empty-list',
    disableOn: 3,
    checkers: {
        ArrayExpression(node) {
            if (node.elements.length > 0) {
                return [new NoNonEmptyListError(node)];
            }
            else {
                return [];
            }
        }
    }
};
exports.default = noNonEmptyList;

},{"../types":30}],22:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const types_1 = require("../types");
const specifiedLiterals = ['boolean', 'string', 'number'];
class NoUnspecifiedLiteral {
    constructor(node) {
        this.node = node;
        this.type = types_1.ErrorType.SYNTAX;
        this.severity = types_1.ErrorSeverity.ERROR;
    }
    get location() {
        return this.node.loc;
    }
    explain() {
        /**
         * A check is used for RegExp to ensure that only null and RegExp are caught.
         * Any other unspecified literal value should not be caught.
         */
        const literal = this.node.value === null ? 'null'
            : this.node.value instanceof RegExp ? 'RegExp'
                : '';
        return (`'${literal}' literals are not allowed`);
    }
    elaborate() {
        return this.explain();
    }
}
exports.NoUnspecifiedLiteral = NoUnspecifiedLiteral;
const noUnspecifiedLiteral = {
    name: 'no-unspecified-literal',
    checkers: {
        Literal(node) {
            if (!specifiedLiterals.includes(typeof node.value)) {
                return [new NoUnspecifiedLiteral(node)];
            }
            else {
                return [];
            }
        }
    }
};
exports.default = noUnspecifiedLiteral;

},{"../types":30}],23:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const types_1 = require("../types");
class NoUnspecifiedOperatorError {
    constructor(node) {
        this.node = node;
        this.type = types_1.ErrorType.SYNTAX;
        this.severity = types_1.ErrorSeverity.ERROR;
        this.unspecifiedOperator = node.operator;
    }
    get location() {
        return this.node.loc;
    }
    explain() {
        return `Operator '${this.unspecifiedOperator}' is not allowed.`;
    }
    elaborate() {
        return this.explain();
    }
}
exports.NoUnspecifiedOperatorError = NoUnspecifiedOperatorError;
const noUnspecifiedOperator = {
    name: 'no-unspecified-operator',
    checkers: {
        BinaryExpression(node) {
            const permittedOperators = [
                '+',
                '-',
                '*',
                '/',
                '%',
                '===',
                '!==',
                '<',
                '>',
                '<=',
                '>=',
                '&&',
                '||',
            ];
            if (!permittedOperators.includes(node.operator)) {
                return [new NoUnspecifiedOperatorError(node)];
            }
            else {
                return [];
            }
        },
        UnaryExpression(node) {
            const permittedOperators = ['-', '!'];
            if (!permittedOperators.includes(node.operator)) {
                return [new NoUnspecifiedOperatorError(node)];
            }
            else {
                return [];
            }
        }
    }
};
exports.default = noUnspecifiedOperator;

},{"../types":30}],24:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const astring_1 = require("astring");
const types_1 = require("../types");
class MultipleDeclarationsError {
    constructor(node) {
        this.node = node;
        this.type = types_1.ErrorType.SYNTAX;
        this.severity = types_1.ErrorSeverity.ERROR;
        this.fixs = node.declarations.map(declaration => ({
            type: 'VariableDeclaration',
            kind: 'var',
            loc: declaration.loc,
            declarations: [declaration]
        }));
    }
    get location() {
        return this.node.loc;
    }
    explain() {
        return 'Multiple declaration in a single statement';
    }
    elaborate() {
        const fixs = this.fixs.map(n => '\t' + astring_1.generate(n)).join('\n');
        return 'Split the variable declaration into multiple lines as follows\n\n' + fixs + '\n';
    }
}
exports.MultipleDeclarationsError = MultipleDeclarationsError;
const singleVariableDeclaration = {
    name: 'single-variable-declaration',
    checkers: {
        VariableDeclaration(node) {
            if (node.declarations.length > 1) {
                return [new MultipleDeclarationsError(node)];
            }
            else {
                return [];
            }
        }
    }
};
exports.default = singleVariableDeclaration;

},{"../types":30,"astring":36}],25:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const interpreter_errors_1 = require("./interpreter-errors");
class AsyncScheduler {
    run(it, context) {
        return new Promise((resolve, reject) => {
            context.runtime.isRunning = true;
            let itValue = it.next();
            try {
                while (!itValue.done) {
                    itValue = it.next();
                }
            }
            catch (e) {
                resolve({ status: 'error' });
            }
            finally {
                context.runtime.isRunning = false;
            }
            resolve({
                status: 'finished',
                value: itValue.value
            });
        });
    }
}
exports.AsyncScheduler = AsyncScheduler;
class PreemptiveScheduler {
    constructor(steps) {
        this.steps = steps;
    }
    run(it, context) {
        return new Promise((resolve, reject) => {
            context.runtime.isRunning = true;
            let itValue = it.next();
            let interval;
            interval = setInterval(() => {
                let step = 0;
                try {
                    while (!itValue.done && step < this.steps) {
                        itValue = it.next();
                        step++;
                    }
                }
                catch (e) {
                    if (/Maximum call stack/.test(e.toString())) {
                        const stacks = [];
                        for (let i = 1; i <= 3; i++) {
                            stacks.push(context.runtime.frames[i - 1].callExpression);
                        }
                        context.errors.push(new interpreter_errors_1.MaximumStackLimitExceeded(context.runtime.nodes[0], stacks));
                    }
                    context.runtime.isRunning = false;
                    clearInterval(interval);
                    resolve({ status: 'error' });
                }
                if (itValue.done) {
                    context.runtime.isRunning = false;
                    clearInterval(interval);
                    resolve({ status: 'finished', value: itValue.value });
                }
            });
        });
    }
}
exports.PreemptiveScheduler = PreemptiveScheduler;

},{"./interpreter-errors":9}],26:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const interop_1 = require("../interop");
// array test works differently for Rhino and
// the Firefox environment (especially Web Console)
function array_test(x) {
    if (Array.isArray === undefined) {
        return x instanceof Array;
    }
    else {
        return Array.isArray(x);
    }
}
array_test.__SOURCE__ = 'array_test(x)';
// pair constructs a pair using a two-element array
// LOW-LEVEL FUNCTION, NOT SOURCE
function pair(x, xs) {
    return [x, xs];
}
exports.pair = pair;
pair.__SOURCE__ = 'pair(x, xs)';
// is_pair returns true iff arg is a two-element array
// LOW-LEVEL FUNCTION, NOT SOURCE
function is_pair(x) {
    return array_test(x) && x.length === 2;
}
exports.is_pair = is_pair;
is_pair.__SOURCE__ = 'is_pair(x)';
// head returns the first component of the given pair,
// throws an exception if the argument is not a pair
// LOW-LEVEL FUNCTION, NOT SOURCE
function head(xs) {
    if (is_pair(xs)) {
        return xs[0];
    }
    else {
        throw new Error('head(xs) expects a pair as ' + 'argument xs, but encountered ' + interop_1.toString(xs));
    }
}
exports.head = head;
head.__SOURCE__ = 'head(xs)';
// tail returns the second component of the given pair
// throws an exception if the argument is not a pair
// LOW-LEVEL FUNCTION, NOT SOURCE
function tail(xs) {
    if (is_pair(xs)) {
        return xs[1];
    }
    else {
        throw new Error('tail(xs) expects a pair as ' + 'argument xs, but encountered ' + interop_1.toString(xs));
    }
}
exports.tail = tail;
tail.__SOURCE__ = 'tail(xs)';
// is_empty_list returns true if arg is []
// LOW-LEVEL FUNCTION, NOT SOURCE
function is_empty_list(xs) {
    if (array_test(xs)) {
        if (xs.length === 0) {
            return true;
        }
        else if (xs.length === 2) {
            return false;
        }
        else {
            return false;
        }
    }
    else {
        return false;
    }
}
exports.is_empty_list = is_empty_list;
is_empty_list.__SOURCE__ = 'is_empty_list(xs)';
// is_list recurses down the list and checks that it ends with the empty list []
// does not throw Value exceptions
// LOW-LEVEL FUNCTION, NOT SOURCE
function is_list(xs) {
    for (;; xs = tail(xs)) {
        if (is_empty_list(xs)) {
            return true;
        }
        else if (!is_pair(xs)) {
            return false;
        }
    }
}
exports.is_list = is_list;
is_list.__SOURCE__ = 'is_list(xs)';
// list makes a list out of its arguments
// LOW-LEVEL FUNCTION, NOT SOURCE
function list() {
    var the_list = [];
    for (var i = arguments.length - 1; i >= 0; i--) {
        the_list = pair(arguments[i], the_list);
    }
    return the_list;
}
exports.list = list;
list.__SOURCE__ = 'list(x, y, ...)';
// list_to_vector returns vector that contains the elements of the argument list
// in the given order.
// list_to_vector throws an exception if the argument is not a list
// LOW-LEVEL FUNCTION, NOT SOURCE
function list_to_vector(lst) {
    var vector = [];
    while (!is_empty_list(lst)) {
        vector.push(head(lst));
        lst = tail(lst);
    }
    return vector;
}
exports.list_to_vector = list_to_vector;
list_to_vector.__SOURCE__ = 'list_to_vector(xs)';
// vector_to_list returns a list that contains the elements of the argument vector
// in the given order.
// vector_to_list throws an exception if the argument is not a vector
// LOW-LEVEL FUNCTION, NOT SOURCE
function vector_to_list(vector) {
    if (vector.length === 0) {
        return [];
    }
    var result = [];
    for (var i = vector.length - 1; i >= 0; i = i - 1) {
        result = pair(vector[i], result);
    }
    return result;
}
exports.vector_to_list = vector_to_list;
vector_to_list.__SOURCE__ = 'vector_to_list(vs)';
// returns the length of a given argument list
// throws an exception if the argument is not a list
function length(xs) {
    for (var i = 0; !is_empty_list(xs); ++i) {
        xs = tail(xs);
    }
    return i;
}
exports.length = length;
length.__SOURCE__ = 'length(xs)';
// map applies first arg f to the elements of the second argument,
// assumed to be a list.
// f is applied element-by-element:
// map(f,[1,[2,[]]]) results in [f(1),[f(2),[]]]
// map throws an exception if the second argument is not a list,
// and if the second argument is a non-empty list and the first
// argument is not a function.
function map(f, xs) {
    return is_empty_list(xs) ? [] : pair(f(head(xs)), map(f, tail(xs)));
}
exports.map = map;
map.__SOURCE__ = 'map(f, xs)';
// build_list takes a non-negative integer n as first argument,
// and a function fun as second argument.
// build_list returns a list of n elements, that results from
// applying fun to the numbers from 0 to n-1.
function build_list(n, fun) {
    function build(i, fun, already_built) {
        if (i < 0) {
            return already_built;
        }
        else {
            return build(i - 1, fun, pair(fun(i), already_built));
        }
    }
    return build(n - 1, fun, []);
}
exports.build_list = build_list;
build_list.__SOURCE__ = 'build_list(n, fun)';
// for_each applies first arg fun to the elements of the list passed as
// second argument. fun is applied element-by-element:
// for_each(fun,[1,[2,[]]]) results in the calls fun(1) and fun(2).
// for_each returns true.
// for_each throws an exception if the second argument is not a list,
// and if the second argument is a non-empty list and the
// first argument is not a function.
function for_each(fun, xs) {
    if (!is_list(xs)) {
        throw new Error('for_each expects a list as argument xs, but ' + 'encountered ' + xs);
    }
    for (; !is_empty_list(xs); xs = tail(xs)) {
        fun(head(xs));
    }
    return true;
}
exports.for_each = for_each;
for_each.__SOURCE__ = 'for_each(fun, xs)';
// list_to_string returns a string that represents the argument list.
// It applies itself recursively on the elements of the given list.
// When it encounters a non-list, it applies toString to it.
function list_to_string(l) {
    return interop_1.toString(l);
}
exports.list_to_string = list_to_string;
list_to_string.__SOURCE__ = 'list_to_string(xs)';
// reverse reverses the argument list
// reverse throws an exception if the argument is not a list.
function reverse(xs) {
    if (!is_list(xs)) {
        throw new Error('reverse(xs) expects a list as argument xs, but ' + 'encountered ' + xs);
    }
    var result = [];
    for (; !is_empty_list(xs); xs = tail(xs)) {
        result = pair(head(xs), result);
    }
    return result;
}
exports.reverse = reverse;
reverse.__SOURCE__ = 'reverse(xs)';
// append first argument list and second argument list.
// In the result, the [] at the end of the first argument list
// is replaced by the second argument list
// append throws an exception if the first argument is not a list
function append(xs, ys) {
    if (is_empty_list(xs)) {
        return ys;
    }
    else {
        return pair(head(xs), append(tail(xs), ys));
    }
}
exports.append = append;
append.__SOURCE__ = 'append(xs, ys)';
// member looks for a given first-argument element in a given
// second argument list. It returns the first postfix sublist
// that starts with the given element. It returns [] if the
// element does not occur in the list
function member(v, xs) {
    for (; !is_empty_list(xs); xs = tail(xs)) {
        if (head(xs) === v) {
            return xs;
        }
    }
    return [];
}
exports.member = member;
member.__SOURCE__ = 'member(x, xs)';
// removes the first occurrence of a given first-argument element
// in a given second-argument list. Returns the original list
// if there is no occurrence.
function remove(v, xs) {
    if (is_empty_list(xs)) {
        return [];
    }
    else {
        if (v === head(xs)) {
            return tail(xs);
        }
        else {
            return pair(head(xs), remove(v, tail(xs)));
        }
    }
}
exports.remove = remove;
remove.__SOURCE__ = 'remove(x, xs)';
// Similar to remove. But removes all instances of v instead of just the first
function remove_all(v, xs) {
    if (is_empty_list(xs)) {
        return [];
    }
    else {
        if (v === head(xs)) {
            return remove_all(v, tail(xs));
        }
        else {
            return pair(head(xs), remove_all(v, tail(xs)));
        }
    }
}
exports.remove_all = remove_all;
remove_all.__SOURCE__ = 'remove_all(x, xs)';
// for backwards-compatibility
exports.removeAll = remove_all;
// equal computes the structural equality
// over its arguments
function equal(item1, item2) {
    if (is_pair(item1) && is_pair(item2)) {
        return equal(head(item1), head(item2)) && equal(tail(item1), tail(item2));
    }
    else if (array_test(item1) && item1.length === 0 && array_test(item2) && item2.length === 0) {
        return true;
    }
    else {
        return item1 === item2;
    }
}
exports.equal = equal;
equal.__SOURCE__ = 'equal(x, y)';
// assoc treats the second argument as an association,
// a list of (index,value) pairs.
// assoc returns the first (index,value) pair whose
// index equal (using structural equality) to the given
// first argument v. Returns false if there is no such
// pair
function assoc(v, xs) {
    if (is_empty_list(xs)) {
        return false;
    }
    else if (equal(v, head(head(xs)))) {
        return head(xs);
    }
    else {
        return assoc(v, tail(xs));
    }
}
exports.assoc = assoc;
assoc.__SOURCE__ = 'assoc(v, xs)';
// filter returns the sublist of elements of given list xs
// for which the given predicate function returns true.
function filter(pred, xs) {
    if (is_empty_list(xs)) {
        return xs;
    }
    else {
        if (pred(head(xs))) {
            return pair(head(xs), filter(pred, tail(xs)));
        }
        else {
            return filter(pred, tail(xs));
        }
    }
}
exports.filter = filter;
filter.__SOURCE__ = 'filter(pred, xs)';
// enumerates numbers starting from start,
// using a step size of 1, until the number
// exceeds end.
function enum_list(start, end) {
    if (start > end) {
        return [];
    }
    else {
        return pair(start, enum_list(start + 1, end));
    }
}
exports.enum_list = enum_list;
enum_list.__SOURCE__ = 'enum_list(start, end)';
// Returns the item in list lst at index n (the first item is at position 0)
function list_ref(xs, n) {
    if (n < 0) {
        throw new Error('list_ref(xs, n) expects a positive integer as ' + 'argument n, but encountered ' + n);
    }
    for (; n > 0; --n) {
        xs = tail(xs);
    }
    return head(xs);
}
exports.list_ref = list_ref;
list_ref.__SOURCE__ = 'list_ref(xs, n)';
// accumulate applies given operation op to elements of a list
// in a right-to-left order, first apply op to the last element
// and an initial element, resulting in r1, then to the
// second-last element and r1, resulting in r2, etc, and finally
// to the first element and r_n-1, where n is the length of the
// list.
// accumulate(op,zero,list(1,2,3)) results in
// op(1, op(2, op(3, zero)))
function accumulate(op, initial, sequence) {
    if (is_empty_list(sequence)) {
        return initial;
    }
    else {
        return op(head(sequence), accumulate(op, initial, tail(sequence)));
    }
}
exports.accumulate = accumulate;
accumulate.__SOURCE__ = 'accumulate(op, initial, xs)';
// set_head(xs,x) changes the head of given pair xs to be x,
// throws an exception if the argument is not a pair
// LOW-LEVEL FUNCTION, NOT SOURCE
function set_head(xs, x) {
    if (is_pair(xs)) {
        xs[0] = x;
        return undefined;
    }
    else {
        throw new Error('set_head(xs,x) expects a pair as ' + 'argument xs, but encountered ' + interop_1.toString(xs));
    }
}
exports.set_head = set_head;
set_head.__SOURCE__ = 'set_head(xs, x)';
// set_tail(xs,x) changes the tail of given pair xs to be x,
// throws an exception if the argument is not a pair
// LOW-LEVEL FUNCTION, NOT SOURCE
function set_tail(xs, x) {
    if (is_pair(xs)) {
        xs[1] = x;
        return undefined;
    }
    else {
        throw new Error('set_tail(xs,x) expects a pair as ' + 'argument xs, but encountered ' + interop_1.toString(xs));
    }
}
exports.set_tail = set_tail;
set_tail.__SOURCE__ = 'set_tail(xs, x)';
// tslint:enable

},{"../interop":8}],27:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/* tslint:disable: ban-types*/
const interop_1 = require("../interop");
/**
 * A function that displays to console.log by default (for a REPL).
 *
 * @param value the value to be represented and displayed.
 * @param externalContext a property of Context that can hold
 *   any information required for external use (optional).
 */
function display(value, externalContext) {
    const output = interop_1.toString(value);
    console.log(output);
}
exports.display = display;
display.__SOURCE__ = 'display(a)';
function error_message(value) {
    const output = interop_1.toString(value);
    throw new Error(output);
}
exports.error_message = error_message;
error_message.__SOURCE__ = 'error(a)';
// tslint:disable-next-line:no-any
function timed(context, f, externalContext, display) {
    return (...args) => {
        const start = runtime();
        const result = f(...args);
        const diff = runtime() - start;
        display('Duration: ' + Math.round(diff) + 'ms', externalContext);
        return result;
    };
}
exports.timed = timed;
timed.__SOURCE__ = 'timed(f)';
function is_number(v) {
    return typeof v === 'number';
}
exports.is_number = is_number;
is_number.__SOURCE__ = 'is_number(v)';
function is_undefined(xs) {
    return typeof xs === 'undefined';
}
exports.is_undefined = is_undefined;
is_undefined.__SOURCE__ = 'is_undefined(xs)';
function is_string(xs) {
    return typeof xs === 'string';
}
exports.is_string = is_string;
is_string.__SOURCE__ = 'is_string(xs)';
function is_boolean(xs) {
    return typeof xs === 'boolean';
}
exports.is_boolean = is_boolean;
is_boolean.__SOURCE__ = 'is_boolean(xs)';
function is_object(xs) {
    return typeof xs === 'object' || is_function(xs);
}
exports.is_object = is_object;
is_object.__SOURCE__ = 'is_object(xs)';
function is_function(xs) {
    return typeof xs === 'function';
}
exports.is_function = is_function;
is_function.__SOURCE__ = 'is_function(xs)';
function is_NaN(x) {
    return is_number(x) && isNaN(x);
}
exports.is_NaN = is_NaN;
is_NaN.__SOURCE__ = 'is_NaN(x)';
function has_own_property(obj, p) {
    return obj.hasOwnProperty(p);
}
exports.has_own_property = has_own_property;
has_own_property.__SOURCE__ = 'has_own_property(obj, p)';
function is_array(a) {
    return a instanceof Array;
}
exports.is_array = is_array;
is_array.__SOURCE__ = 'is_array(a)';
function array_length(xs) {
    return xs.length;
}
exports.array_length = array_length;
array_length.__SOURCE__ = 'array_length(xs)';
/**
 * Source version of parseInt. Both arguments are required.
 *
 * @param str String representation of the integer to be parsed. Required.
 * @param radix Base to parse the given `str`. Required.
 *
 * An error is thrown if `str` is not of type string, or `radix` is not an
 * integer within the range 2, 36 inclusive.
 */
function parse_int(str, radix) {
    if (typeof (str) === 'string' && typeof (radix) === 'number' && Number.isInteger(radix) && 2 <= radix && radix <= 36) {
        return parseInt(str, radix);
    }
    else {
        throw new Error('parse_int expects two arguments a string s, and a positive integer i between 2 and 36, inclusive.');
    }
}
exports.parse_int = parse_int;
parse_int.__SOURCE__ = 'parse_int(s, i)';
function runtime() {
    return new Date().getTime();
}
exports.runtime = runtime;
runtime.__SOURCE__ = 'runtime()';

},{"../interop":8}],28:[function(require,module,exports){
(function (process){
/* parser generated by jison 0.4.18 */
/*
  Returns a Parser object of the following structure:

  Parser: {
    yy: {}
  }

  Parser.prototype: {
    yy: {},
    trace: function(),
    symbols_: {associative list: name ==> number},
    terminals_: {associative list: number ==> name},
    productions_: [...],
    performAction: function anonymous(yytext, yyleng, yylineno, yy, yystate, $$, _$),
    table: [...],
    defaultActions: {...},
    parseError: function(str, hash),
    parse: function(input),

    lexer: {
        EOF: 1,
        parseError: function(str, hash),
        setInput: function(input),
        input: function(),
        unput: function(str),
        more: function(),
        less: function(n),
        pastInput: function(),
        upcomingInput: function(),
        showPosition: function(),
        test_match: function(regex_match_array, rule_index),
        next: function(),
        lex: function(),
        begin: function(condition),
        popState: function(),
        _currentRules: function(),
        topState: function(),
        pushState: function(condition),

        options: {
            ranges: boolean           (optional: true ==> token location info will include a .range[] member)
            flex: boolean             (optional: true ==> flex-like lexing behaviour where the rules are tested exhaustively to find the longest match)
            backtrack_lexer: boolean  (optional: true ==> lexer regexes are tested in order and for each matching regex the action code is invoked; the lexer terminates the scan when a token is returned by the action code)
        },

        performAction: function(yy, yy_, $avoiding_name_collisions, YY_START),
        rules: [...],
        conditions: {associative list: name ==> set},
    }
  }


  token location info (@$, _$, etc.): {
    first_line: n,
    last_line: n,
    first_column: n,
    last_column: n,
    range: [start_number, end_number]       (where the numbers are indexes into the input string, regular zero-based)
  }


  the parseError function receives a 'hash' object with these members for lexer and parser errors: {
    text:        (matched text)
    token:       (the produced terminal token, if any)
    line:        (yylineno)
  }
  while parser (grammar) errors will also provide these members, i.e. parser errors deliver a superset of attributes: {
    loc:         (yylloc)
    expected:    (string describing the set of expected tokens)
    recoverable: (boolean: TRUE when the parser has a error recovery rule available for this particular error)
  }
*/
var parser = (function(){
var o=function(k,v,o,l){for(o=o||{},l=k.length;l--;o[k[l]]=v);return o},$V0=[2,2],$V1=[1,3],$V2=[1,8],$V3=[1,25],$V4=[1,11],$V5=[1,14],$V6=[1,15],$V7=[1,16],$V8=[1,21],$V9=[1,20],$Va=[1,17],$Vb=[1,18],$Vc=[1,19],$Vd=[1,23],$Ve=[1,22],$Vf=[1,24],$Vg=[1,28],$Vh=[1,29],$Vi=[1,30],$Vj=[1,31],$Vk=[1,32],$Vl=[1,33],$Vm=[1,34],$Vn=[1,36],$Vo=[1,38],$Vp=[1,39],$Vq=[1,40],$Vr=[1,37],$Vs=[5,17],$Vt=[5,6,11,13,16,17,22,23,24,25,27,28,30,31,34,35,39,49,57,58,59,60,61,62,64,65,66,67,73],$Vu=[1,51],$Vv=[1,52],$Vw=[1,53],$Vx=[1,54],$Vy=[1,55],$Vz=[1,56],$VA=[1,57],$VB=[1,58],$VC=[1,59],$VD=[1,60],$VE=[1,61],$VF=[1,62],$VG=[1,63],$VH=[1,64],$VI=[1,65],$VJ=[1,66],$VK=[1,67],$VL=[1,68],$VM=[1,70],$VN=[2,78],$VO=[6,15,17,26,34,35,36,37,38,40,41,42,43,44,45,46,47,48,49,50,51,55,56,69],$VP=[2,49],$VQ=[1,85],$VR=[2,69],$VS=[1,95],$VT=[6,15,17,26,34,35,36,37,38,40,41,42,43,44,45,46,47,48,50,55,56,69],$VU=[1,126],$VV=[15,50],$VW=[6,15,17,26,34,35,40,41,42,43,44,45,46,47,48,50,55,56,69],$VX=[6,15,17,26,40,41,42,43,48,50,55,56,69],$VY=[6,15,17,26,40,41,42,43,44,45,46,47,48,50,55,56,69],$VZ=[6,15,17,26,48,50,56,69],$V_=[13,16,34,35,39,49,57,58,59,60,61,62,64,65,66,67,73];
var parser = {trace: function trace() { },
yy: {},
symbols_: {"error":2,"program":3,"statements":4,"EOF":5,";":6,"statement":7,"ifstatement":8,"whilestatement":9,"forstatement":10,"function":11,"identifier":12,"(":13,"identifiers":14,")":15,"{":16,"}":17,"constdeclaration":18,"letdeclaration":19,"assignment":20,"expression":21,"return":22,"break":23,"continue":24,"let":25,"=":26,"const":27,"if":28,"else":29,"while":30,"for":31,"forinitialiser":32,"forfinaliser":33,"+":34,"-":35,"*":36,"/":37,"%":38,"!":39,"&&":40,"||":41,"===":42,"!==":43,">":44,"<":45,">=":46,"<=":47,"=>":48,"[":49,"]":50,".":51,"constants":52,"expressions":53,"pairs":54,"?":55,":":56,"FLOAT_NUMBER":57,"INT_NUMBER":58,"true":59,"false":60,"NaN":61,"Infinity":62,"quotedstring":63,"emptylist":64,"EmptyString":65,"QuotedString":66,"QuotedStringEscape":67,"nonemptyexpressions":68,",":69,"nonemptypairs":70,"pair":71,"nonemptyidentifiers":72,"Identifier":73,"$accept":0,"$end":1},
terminals_: {2:"error",5:"EOF",6:";",11:"function",13:"(",15:")",16:"{",17:"}",22:"return",23:"break",24:"continue",25:"let",26:"=",27:"const",28:"if",29:"else",30:"while",31:"for",34:"+",35:"-",36:"*",37:"/",38:"%",39:"!",40:"&&",41:"||",42:"===",43:"!==",44:">",45:"<",46:">=",47:"<=",48:"=>",49:"[",50:"]",51:".",55:"?",56:":",57:"FLOAT_NUMBER",58:"INT_NUMBER",59:"true",60:"false",61:"NaN",62:"Infinity",64:"emptylist",65:"EmptyString",66:"QuotedString",67:"QuotedStringEscape",69:",",73:"Identifier"},
productions_: [0,[3,2],[4,0],[4,1],[4,2],[7,1],[7,1],[7,1],[7,8],[7,1],[7,1],[7,3],[7,2],[7,2],[7,3],[7,2],[7,2],[19,5],[18,5],[20,3],[8,11],[8,9],[9,7],[10,10],[32,1],[32,2],[33,1],[21,3],[21,3],[21,3],[21,3],[21,3],[21,2],[21,2],[21,2],[21,3],[21,3],[21,3],[21,3],[21,3],[21,3],[21,3],[21,3],[21,5],[21,3],[21,4],[21,3],[21,3],[21,1],[21,1],[21,6],[21,3],[21,3],[21,4],[21,5],[52,1],[52,1],[52,1],[52,1],[52,1],[52,1],[52,1],[52,1],[63,1],[63,1],[63,1],[63,2],[63,2],[53,1],[53,0],[68,3],[68,1],[54,1],[54,0],[70,3],[70,1],[71,3],[14,1],[14,0],[72,3],[72,1],[12,1]],
performAction: function anonymous(yytext, yyleng, yylineno, yy, yystate /* action[1] */, $$ /* vstack */, _$ /* lstack */) {
/* this == yyval */

var $0 = $$.length - 1;
switch (yystate) {
case 1:
 return $$[$0-1];
break;
case 2: case 3: case 69: case 73: case 78:
 this.$ = [];
break;
case 4:
 this.$ = [$$[$0-1], $$[$0]];
break;
case 8:

			this.$ = {
				tag: 'constant_declaration',
				name: $$[$0-6],
				value: {
					tag: 'function_definition',
					parameters: $$[$0-4],
					body: $$[$0-1],
					line: yylineno,
					location: {
						start_line: _$[$0-7].first_line,
						start_col: _$[$0-7].first_column,
						end_line: _$[$0].first_line,
						end_col: _$[$0].first_column
					}
				},
				line: yylineno
			};

break;
case 11:

			this.$ = {
			         tag: 'block',
				 body: $$[$0-1]
 			     };

break;
case 14:

			this.$ = {
				tag: 'return_statement',
				expression: $$[$0-1],
				line: yylineno
			};

break;
case 15:

			this.$ = {
				tag: 'break_statement',
				line: yylineno
			};

break;
case 16:

			this.$ = {
				tag: 'continue_statement',
				line: yylineno
			};

break;
case 17:

			this.$ = {
				tag: 'variable_declaration',
				name: $$[$0-3],
				value: $$[$0-1],
				line: yylineno
			};

break;
case 18:

			this.$ = {
				tag: 'constant_declaration',
				name: $$[$0-3],
				value: $$[$0-1],
				line: yylineno
			};

break;
case 19:

			if ($$[$0-2].tag === 'name') {
				this.$ = {
					tag: 'assignment',
					name: $$[$0-2],
					value: $$[$0],
					line: yylineno
				};

			} else if ($$[$0-2].tag === 'property_access') {
				this.$ = {
					tag: 'property_assignment',
					object: $$[$0-2].object,
					property: $$[$0-2].property,
					value: $$[$0],
					line: yylineno
				};

			} else {
				error('parse error in line ' + yylineno + ": " + yytext);
			}

break;
case 20:

			this.$ = {
				tag: 'conditional_statement',
				predicate: $$[$0-8],
				consequent: { tag: 'block', body: $$[$0-5] },
				alternative: { tag: 'block', body: $$[$0-1] },
				line: yylineno
			};

break;
case 21:

			this.$ = {
				tag: 'conditional_statement',
				predicate: $$[$0-6],
				consequent: { tag: 'block', body: $$[$0-3] },
				alternative: [$$[$0], []],
				line: yylineno
			};

break;
case 22:

			this.$ = {
				tag: 'while_loop',
				predicate: $$[$0-4],
				statements: { tag: 'block', body: $$[$0-1] },
				line: yylineno
			};

break;
case 23:

			this.$ = {
				tag: 'for_loop',
				initialiser: $$[$0-7],
				predicate: $$[$0-6],
				finaliser: $$[$0-4],
				statements: { tag: 'block', body: $$[$0-1] },
				line: yylineno
			};

break;
case 27: case 28: case 29: case 30: case 31: case 37: case 38: case 39: case 40: case 41: case 42:

			this.$ = {
				tag: 'application',
				operator: {
					tag: 'name',
					name: $$[$0-1],
					line: yylineno
				},
				operands: [$$[$0-2], [$$[$0], []]],
				line: yylineno
			};

break;
case 32: case 33:

			this.$ = {
				tag: 'application',
				operator: {
					tag: 'name',
					name: $$[$0-1],
					line: yylineno
				},
				operands: [0, [$$[$0], []]],
				line: yylineno
			};

break;
case 34:

			this.$ = {
				tag: 'application',
				operator: {
					tag: 'name',
					name: $$[$0-1],
					line: yylineno
				},
				operands: [$$[$0], []],
				line: yylineno
			};

break;
case 35: case 36:

			this.$ = {
				tag: 'boolean_operation',
				operator: $$[$0-1],
				operands: [$$[$0-2], [$$[$0], []]],
				line: yylineno
			};

break;
case 43:

			this.$ = {
				tag: 'function_definition',
				parameters: $$[$0-3],
				body: { tag: 'return_statement', expression: $$[$0],
					line: yylineno },
				line: yylineno,
				location: {
					start_line: _$[$0-4].first_line,
					start_col: _$[$0-4].first_column,
					end_line: _$[$0].first_line,
					end_col: _$[$0].first_column
			     	}
			};

break;
case 44:
  if ($$[$0 - 2].tag === "name") {
    this.$ = {
      tag: "function_definition",
      parameters: [$$[$0 - 2], []],
      body: {
        tag: "return_statement",
        expression: $$[$0],
        line: yylineno
      },
      line: yylineno,
      location: {
        start_line: _$[$0 - 2].first_line,
        start_col: _$[$0 - 2].first_column,
        end_line: _$[$0 - 2].first_line,
        end_col: _$[$0 - 2].first_column
      }
    };
  } else {
    error("expecting name before => " + yylineno + ": " + yytext);
}

break;
case 45:

			this.$ = {
				tag: 'property_access',
				object: $$[$0-3],
				property: $$[$0-1],
				line: yylineno
			};

break;
case 46:

			this.$ = {
				tag: 'property_access',
				object: $$[$0-2],
				property: $$[$0],
				line: yylineno
			};

break;
case 47:
this.$ = $$[$0-1];
break;
case 49:

			this.$ = {
				tag: 'name',
				name: $$[$0],
				line: yylineno
			};

break;
case 50:

			this.$ = {
				tag: 'application',
				operator: $$[$0-4],
				operands: $$[$0-1],
				line: yylineno
			};

break;
case 51:

			this.$ = {
				tag: 'array_expression',
				elements: $$[$0-1],
				line: yylineno
			};

break;
case 52:

			this.$ = {
				tag: 'object_expression',
				pairs: $$[$0-1],
				line: yylineno
			};

break;
case 53:

			this.$ = {
				tag: 'application',
				operator: {
					tag: 'name',
					name: $$[$0-3],
					line: yylineno
				},
				operands: $$[$0-1],
				line: yylineno
			};

break;
case 54:

			this.$ = {
				tag: 'conditional_expression',
				predicate: $$[$0-4],
				consequent: $$[$0-2],
				alternative: $$[$0],
				line: yylineno
			};

break;
case 55:
 this.$ = parseFloat(yytext);
break;
case 56:
 this.$ = parseInt(yytext, 10);
break;
case 57:
 this.$ = true;
break;
case 58:
 this.$ = false;
break;
case 59:
 this.$ = NaN;
break;
case 60:
 this.$ = Infinity;
break;
case 62:
 this.$ = { tag: 'empty_list', line: yylineno };
break;
case 63:

		this.$ = '';

break;
case 65:

		switch (yytext)
		{
			case 'b':		this.$ = '\b'; break;
			case 'n':		this.$ = '\n'; break;
			case 'r':		this.$ = '\r'; break;
			case 't':		this.$ = '\t'; break;
			case "'":		this.$ = "'"; break;
			case '"':		this.$ = '"'; break;
			case '\\':		this.$ = '\\'; break;
			case '\n':
			case '\r\n':	this.$ = ''; break;
			default:		this.$ = '\\' + $$[$0]; break;
		}

break;
case 66:

		switch ($$[$0-1])
		{
			case 'b':		this.$ = '\b'; break;
			case 'n':		this.$ = '\n'; break;
			case 'r':		this.$ = '\r'; break;
			case 't':		this.$ = '\t'; break;
			case "'":		this.$ = "'"; break;
			case '"':		this.$ = '"'; break;
			case '\\':		this.$ = '\\'; break;
			case '\n':
			case '\r\n':	this.$ = ''; break;
			default:		this.$ = '\\' + $$[$0-1]; break;
		}
		this.$ += $$[$0];

break;
case 67:

		this.$ = $$[$0-1] + $$[$0];

break;
case 68: case 72: case 77:
 this.$ = $$[$0];
break;
case 70: case 74: case 76: case 79:
 this.$ = [ $$[$0-2], $$[$0] ];
break;
case 71: case 75: case 80:
 this.$ = [ $$[$0], [] ];
break;
case 81:
 this.$ = yytext;
break;
}
},
table: [{3:1,4:2,5:$V0,6:$V1,7:4,8:5,9:6,10:7,11:$V2,12:27,13:$V3,16:$V4,18:9,19:10,20:12,21:13,22:$V5,23:$V6,24:$V7,25:$V8,27:$V9,28:$Va,30:$Vb,31:$Vc,34:$Vd,35:$Ve,39:$Vf,49:$Vg,52:26,57:$Vh,58:$Vi,59:$Vj,60:$Vk,61:$Vl,62:$Vm,63:35,64:$Vn,65:$Vo,66:$Vp,67:$Vq,73:$Vr},{1:[3]},{5:[1,41]},o($Vs,[2,3]),o($Vs,$V0,{7:4,8:5,9:6,10:7,18:9,19:10,20:12,21:13,52:26,12:27,63:35,4:42,6:$V1,11:$V2,13:$V3,16:$V4,22:$V5,23:$V6,24:$V7,25:$V8,27:$V9,28:$Va,30:$Vb,31:$Vc,34:$Vd,35:$Ve,39:$Vf,49:$Vg,57:$Vh,58:$Vi,59:$Vj,60:$Vk,61:$Vl,62:$Vm,64:$Vn,65:$Vo,66:$Vp,67:$Vq,73:$Vr}),o($Vt,[2,5]),o($Vt,[2,6]),o($Vt,[2,7]),{12:43,73:$Vr},o($Vt,[2,9]),o($Vt,[2,10]),{4:44,6:$V1,7:4,8:5,9:6,10:7,11:$V2,12:48,13:$V3,16:$V4,17:$V0,18:9,19:10,20:12,21:13,22:$V5,23:$V6,24:$V7,25:$V8,27:$V9,28:$Va,30:$Vb,31:$Vc,34:$Vd,35:$Ve,39:$Vf,49:$Vg,52:26,54:45,57:$Vh,58:$Vi,59:$Vj,60:$Vk,61:$Vl,62:$Vm,63:35,64:$Vn,65:$Vo,66:$Vp,67:$Vq,70:46,71:47,73:$Vr},{6:[1,49]},{6:[1,50],26:$Vu,34:$Vv,35:$Vw,36:$Vx,37:$Vy,38:$Vz,40:$VA,41:$VB,42:$VC,43:$VD,44:$VE,45:$VF,46:$VG,47:$VH,48:$VI,49:$VJ,51:$VK,55:$VL},{12:27,13:$V3,16:$VM,21:69,34:$Vd,35:$Ve,39:$Vf,49:$Vg,52:26,57:$Vh,58:$Vi,59:$Vj,60:$Vk,61:$Vl,62:$Vm,63:35,64:$Vn,65:$Vo,66:$Vp,67:$Vq,73:$Vr},{6:[1,71]},{6:[1,72]},{13:[1,73]},{13:[1,74]},{13:[1,75]},{12:76,73:$Vr},{12:77,73:$Vr},{12:27,13:$V3,16:$VM,21:78,34:$Vd,35:$Ve,39:$Vf,49:$Vg,52:26,57:$Vh,58:$Vi,59:$Vj,60:$Vk,61:$Vl,62:$Vm,63:35,64:$Vn,65:$Vo,66:$Vp,67:$Vq,73:$Vr},{12:27,13:$V3,16:$VM,21:79,34:$Vd,35:$Ve,39:$Vf,49:$Vg,52:26,57:$Vh,58:$Vi,59:$Vj,60:$Vk,61:$Vl,62:$Vm,63:35,64:$Vn,65:$Vo,66:$Vp,67:$Vq,73:$Vr},{12:27,13:$V3,16:$VM,21:80,34:$Vd,35:$Ve,39:$Vf,49:$Vg,52:26,57:$Vh,58:$Vi,59:$Vj,60:$Vk,61:$Vl,62:$Vm,63:35,64:$Vn,65:$Vo,66:$Vp,67:$Vq,73:$Vr},{12:84,13:$V3,14:81,15:$VN,16:$VM,21:82,34:$Vd,35:$Ve,39:$Vf,49:$Vg,52:26,57:$Vh,58:$Vi,59:$Vj,60:$Vk,61:$Vl,62:$Vm,63:35,64:$Vn,65:$Vo,66:$Vp,67:$Vq,72:83,73:$Vr},o($VO,[2,48]),o($VO,$VP,{13:$VQ}),{12:27,13:$V3,16:$VM,21:88,34:$Vd,35:$Ve,39:$Vf,49:$Vg,50:$VR,52:26,53:86,57:$Vh,58:$Vi,59:$Vj,60:$Vk,61:$Vl,62:$Vm,63:35,64:$Vn,65:$Vo,66:$Vp,67:$Vq,68:87,73:$Vr},o($VO,[2,55]),o($VO,[2,56]),o($VO,[2,57]),o($VO,[2,58]),o($VO,[2,59]),o($VO,[2,60]),o($VO,[2,61]),o($VO,[2,62]),o([6,13,15,17,26,34,35,36,37,38,40,41,42,43,44,45,46,47,48,49,50,51,55,56,69],[2,81]),o($VO,[2,63]),o($VO,[2,64],{63:89,65:$Vo,66:$Vp,67:$Vq}),o($VO,[2,65],{63:90,65:$Vo,66:$Vp,67:$Vq}),{1:[2,1]},o($Vs,[2,4]),{13:[1,91]},{17:[1,92]},{17:[1,93]},{17:[2,72]},{17:[2,75],69:[1,94]},o([6,26,34,35,36,37,38,40,41,42,43,44,45,46,47,48,49,51,55],$VP,{13:$VQ,56:$VS}),o($Vt,[2,12]),o($Vt,[2,13]),{12:27,13:$V3,16:$VM,21:96,34:$Vd,35:$Ve,39:$Vf,49:$Vg,52:26,57:$Vh,58:$Vi,59:$Vj,60:$Vk,61:$Vl,62:$Vm,63:35,64:$Vn,65:$Vo,66:$Vp,67:$Vq,73:$Vr},{12:27,13:$V3,16:$VM,21:97,34:$Vd,35:$Ve,39:$Vf,49:$Vg,52:26,57:$Vh,58:$Vi,59:$Vj,60:$Vk,61:$Vl,62:$Vm,63:35,64:$Vn,65:$Vo,66:$Vp,67:$Vq,73:$Vr},{12:27,13:$V3,16:$VM,21:98,34:$Vd,35:$Ve,39:$Vf,49:$Vg,52:26,57:$Vh,58:$Vi,59:$Vj,60:$Vk,61:$Vl,62:$Vm,63:35,64:$Vn,65:$Vo,66:$Vp,67:$Vq,73:$Vr},{12:27,13:$V3,16:$VM,21:99,34:$Vd,35:$Ve,39:$Vf,49:$Vg,52:26,57:$Vh,58:$Vi,59:$Vj,60:$Vk,61:$Vl,62:$Vm,63:35,64:$Vn,65:$Vo,66:$Vp,67:$Vq,73:$Vr},{12:27,13:$V3,16:$VM,21:100,34:$Vd,35:$Ve,39:$Vf,49:$Vg,52:26,57:$Vh,58:$Vi,59:$Vj,60:$Vk,61:$Vl,62:$Vm,63:35,64:$Vn,65:$Vo,66:$Vp,67:$Vq,73:$Vr},{12:27,13:$V3,16:$VM,21:101,34:$Vd,35:$Ve,39:$Vf,49:$Vg,52:26,57:$Vh,58:$Vi,59:$Vj,60:$Vk,61:$Vl,62:$Vm,63:35,64:$Vn,65:$Vo,66:$Vp,67:$Vq,73:$Vr},{12:27,13:$V3,16:$VM,21:102,34:$Vd,35:$Ve,39:$Vf,49:$Vg,52:26,57:$Vh,58:$Vi,59:$Vj,60:$Vk,61:$Vl,62:$Vm,63:35,64:$Vn,65:$Vo,66:$Vp,67:$Vq,73:$Vr},{12:27,13:$V3,16:$VM,21:103,34:$Vd,35:$Ve,39:$Vf,49:$Vg,52:26,57:$Vh,58:$Vi,59:$Vj,60:$Vk,61:$Vl,62:$Vm,63:35,64:$Vn,65:$Vo,66:$Vp,67:$Vq,73:$Vr},{12:27,13:$V3,16:$VM,21:104,34:$Vd,35:$Ve,39:$Vf,49:$Vg,52:26,57:$Vh,58:$Vi,59:$Vj,60:$Vk,61:$Vl,62:$Vm,63:35,64:$Vn,65:$Vo,66:$Vp,67:$Vq,73:$Vr},{12:27,13:$V3,16:$VM,21:105,34:$Vd,35:$Ve,39:$Vf,49:$Vg,52:26,57:$Vh,58:$Vi,59:$Vj,60:$Vk,61:$Vl,62:$Vm,63:35,64:$Vn,65:$Vo,66:$Vp,67:$Vq,73:$Vr},{12:27,13:$V3,16:$VM,21:106,34:$Vd,35:$Ve,39:$Vf,49:$Vg,52:26,57:$Vh,58:$Vi,59:$Vj,60:$Vk,61:$Vl,62:$Vm,63:35,64:$Vn,65:$Vo,66:$Vp,67:$Vq,73:$Vr},{12:27,13:$V3,16:$VM,21:107,34:$Vd,35:$Ve,39:$Vf,49:$Vg,52:26,57:$Vh,58:$Vi,59:$Vj,60:$Vk,61:$Vl,62:$Vm,63:35,64:$Vn,65:$Vo,66:$Vp,67:$Vq,73:$Vr},{12:27,13:$V3,16:$VM,21:108,34:$Vd,35:$Ve,39:$Vf,49:$Vg,52:26,57:$Vh,58:$Vi,59:$Vj,60:$Vk,61:$Vl,62:$Vm,63:35,64:$Vn,65:$Vo,66:$Vp,67:$Vq,73:$Vr},{12:27,13:$V3,16:$VM,21:109,34:$Vd,35:$Ve,39:$Vf,49:$Vg,52:26,57:$Vh,58:$Vi,59:$Vj,60:$Vk,61:$Vl,62:$Vm,63:35,64:$Vn,65:$Vo,66:$Vp,67:$Vq,73:$Vr},{12:27,13:$V3,16:$VM,21:110,34:$Vd,35:$Ve,39:$Vf,49:$Vg,52:26,57:$Vh,58:$Vi,59:$Vj,60:$Vk,61:$Vl,62:$Vm,63:35,64:$Vn,65:$Vo,66:$Vp,67:$Vq,73:$Vr},{12:27,13:$V3,16:$VM,21:111,34:$Vd,35:$Ve,39:$Vf,49:$Vg,52:26,57:$Vh,58:$Vi,59:$Vj,60:$Vk,61:$Vl,62:$Vm,63:35,64:$Vn,65:$Vo,66:$Vp,67:$Vq,73:$Vr},{12:112,73:$Vr},{12:27,13:$V3,16:$VM,21:113,34:$Vd,35:$Ve,39:$Vf,49:$Vg,52:26,57:$Vh,58:$Vi,59:$Vj,60:$Vk,61:$Vl,62:$Vm,63:35,64:$Vn,65:$Vo,66:$Vp,67:$Vq,73:$Vr},{6:[1,114],34:$Vv,35:$Vw,36:$Vx,37:$Vy,38:$Vz,40:$VA,41:$VB,42:$VC,43:$VD,44:$VE,45:$VF,46:$VG,47:$VH,48:$VI,49:$VJ,51:$VK,55:$VL},{12:115,17:[2,73],54:45,70:46,71:47,73:$Vr},o($Vt,[2,15]),o($Vt,[2,16]),{12:27,13:$V3,16:$VM,21:116,34:$Vd,35:$Ve,39:$Vf,49:$Vg,52:26,57:$Vh,58:$Vi,59:$Vj,60:$Vk,61:$Vl,62:$Vm,63:35,64:$Vn,65:$Vo,66:$Vp,67:$Vq,73:$Vr},{12:27,13:$V3,16:$VM,21:117,34:$Vd,35:$Ve,39:$Vf,49:$Vg,52:26,57:$Vh,58:$Vi,59:$Vj,60:$Vk,61:$Vl,62:$Vm,63:35,64:$Vn,65:$Vo,66:$Vp,67:$Vq,73:$Vr},{12:27,13:$V3,16:$VM,19:119,20:120,21:121,25:$V8,32:118,34:$Vd,35:$Ve,39:$Vf,49:$Vg,52:26,57:$Vh,58:$Vi,59:$Vj,60:$Vk,61:$Vl,62:$Vm,63:35,64:$Vn,65:$Vo,66:$Vp,67:$Vq,73:$Vr},{26:[1,122]},{26:[1,123]},o($VT,[2,32],{49:$VJ,51:$VK}),o($VT,[2,33],{49:$VJ,51:$VK}),o($VT,[2,34],{49:$VJ,51:$VK}),{15:[1,124]},{15:[1,125],34:$Vv,35:$Vw,36:$Vx,37:$Vy,38:$Vz,40:$VA,41:$VB,42:$VC,43:$VD,44:$VE,45:$VF,46:$VG,47:$VH,48:$VI,49:$VJ,51:$VK,55:$VL},{15:[2,77]},o([15,34,35,36,37,38,40,41,42,43,44,45,46,47,48,49,51,55],$VP,{13:$VQ,69:$VU}),{12:27,13:$V3,15:$VR,16:$VM,21:88,34:$Vd,35:$Ve,39:$Vf,49:$Vg,52:26,53:127,57:$Vh,58:$Vi,59:$Vj,60:$Vk,61:$Vl,62:$Vm,63:35,64:$Vn,65:$Vo,66:$Vp,67:$Vq,68:87,73:$Vr},{50:[1,128]},o($VV,[2,68]),o($VV,[2,71],{34:$Vv,35:$Vw,36:$Vx,37:$Vy,38:$Vz,40:$VA,41:$VB,42:$VC,43:$VD,44:$VE,45:$VF,46:$VG,47:$VH,48:$VI,49:$VJ,51:$VK,55:$VL,69:[1,129]}),o($VO,[2,67]),o($VO,[2,66]),{12:131,14:130,15:$VN,72:83,73:$Vr},o($Vt,[2,11]),o($VO,[2,52]),{12:115,70:132,71:47,73:$Vr},{12:27,13:$V3,16:$VM,21:133,34:$Vd,35:$Ve,39:$Vf,49:$Vg,52:26,57:$Vh,58:$Vi,59:$Vj,60:$Vk,61:$Vl,62:$Vm,63:35,64:$Vn,65:$Vo,66:$Vp,67:$Vq,73:$Vr},o([6,15],[2,19],{34:$Vv,35:$Vw,36:$Vx,37:$Vy,38:$Vz,40:$VA,41:$VB,42:$VC,43:$VD,44:$VE,45:$VF,46:$VG,47:$VH,48:$VI,49:$VJ,51:$VK,55:$VL}),o($VW,[2,27],{36:$Vx,37:$Vy,38:$Vz,49:$VJ,51:$VK}),o($VW,[2,28],{36:$Vx,37:$Vy,38:$Vz,49:$VJ,51:$VK}),o($VT,[2,29],{49:$VJ,51:$VK}),o($VT,[2,30],{49:$VJ,51:$VK}),o($VT,[2,31],{49:$VJ,51:$VK}),o([6,15,17,26,40,41,48,50,55,56,69],[2,35],{34:$Vv,35:$Vw,36:$Vx,37:$Vy,38:$Vz,42:$VC,43:$VD,44:$VE,45:$VF,46:$VG,47:$VH,49:$VJ,51:$VK}),o([6,15,17,26,41,48,50,55,56,69],[2,36],{34:$Vv,35:$Vw,36:$Vx,37:$Vy,38:$Vz,40:$VA,42:$VC,43:$VD,44:$VE,45:$VF,46:$VG,47:$VH,49:$VJ,51:$VK}),o($VX,[2,37],{34:$Vv,35:$Vw,36:$Vx,37:$Vy,38:$Vz,44:$VE,45:$VF,46:$VG,47:$VH,49:$VJ,51:$VK}),o($VX,[2,38],{34:$Vv,35:$Vw,36:$Vx,37:$Vy,38:$Vz,44:$VE,45:$VF,46:$VG,47:$VH,49:$VJ,51:$VK}),o($VY,[2,39],{34:$Vv,35:$Vw,36:$Vx,37:$Vy,38:$Vz,49:$VJ,51:$VK}),o($VY,[2,40],{34:$Vv,35:$Vw,36:$Vx,37:$Vy,38:$Vz,49:$VJ,51:$VK}),o($VY,[2,41],{34:$Vv,35:$Vw,36:$Vx,37:$Vy,38:$Vz,49:$VJ,51:$VK}),o($VY,[2,42],{34:$Vv,35:$Vw,36:$Vx,37:$Vy,38:$Vz,49:$VJ,51:$VK}),o($VZ,[2,44],{34:$Vv,35:$Vw,36:$Vx,37:$Vy,38:$Vz,40:$VA,41:$VB,42:$VC,43:$VD,44:$VE,45:$VF,46:$VG,47:$VH,49:$VJ,51:$VK,55:$VL}),{34:$Vv,35:$Vw,36:$Vx,37:$Vy,38:$Vz,40:$VA,41:$VB,42:$VC,43:$VD,44:$VE,45:$VF,46:$VG,47:$VH,48:$VI,49:$VJ,50:[1,134],51:$VK,55:$VL},o($VO,[2,46]),{34:$Vv,35:$Vw,36:$Vx,37:$Vy,38:$Vz,40:$VA,41:$VB,42:$VC,43:$VD,44:$VE,45:$VF,46:$VG,47:$VH,48:$VI,49:$VJ,51:$VK,55:$VL,56:[1,135]},o($Vt,[2,14]),{56:$VS},{15:[1,136],34:$Vv,35:$Vw,36:$Vx,37:$Vy,38:$Vz,40:$VA,41:$VB,42:$VC,43:$VD,44:$VE,45:$VF,46:$VG,47:$VH,48:$VI,49:$VJ,51:$VK,55:$VL},{15:[1,137],34:$Vv,35:$Vw,36:$Vx,37:$Vy,38:$Vz,40:$VA,41:$VB,42:$VC,43:$VD,44:$VE,45:$VF,46:$VG,47:$VH,48:$VI,49:$VJ,51:$VK,55:$VL},{12:27,13:$V3,16:$VM,21:138,34:$Vd,35:$Ve,39:$Vf,49:$Vg,52:26,57:$Vh,58:$Vi,59:$Vj,60:$Vk,61:$Vl,62:$Vm,63:35,64:$Vn,65:$Vo,66:$Vp,67:$Vq,73:$Vr},o($V_,[2,24]),{6:[1,139]},{26:$Vu,34:$Vv,35:$Vw,36:$Vx,37:$Vy,38:$Vz,40:$VA,41:$VB,42:$VC,43:$VD,44:$VE,45:$VF,46:$VG,47:$VH,48:$VI,49:$VJ,51:$VK,55:$VL},{12:27,13:$V3,16:$VM,21:140,34:$Vd,35:$Ve,39:$Vf,49:$Vg,52:26,57:$Vh,58:$Vi,59:$Vj,60:$Vk,61:$Vl,62:$Vm,63:35,64:$Vn,65:$Vo,66:$Vp,67:$Vq,73:$Vr},{12:27,13:$V3,16:$VM,21:141,34:$Vd,35:$Ve,39:$Vf,49:$Vg,52:26,57:$Vh,58:$Vi,59:$Vj,60:$Vk,61:$Vl,62:$Vm,63:35,64:$Vn,65:$Vo,66:$Vp,67:$Vq,73:$Vr},{48:[1,142]},o($VO,[2,47],{13:[1,143]}),{12:131,72:144,73:$Vr},{15:[1,145]},o($VO,[2,51]),{12:27,13:$V3,16:$VM,21:88,34:$Vd,35:$Ve,39:$Vf,49:$Vg,52:26,57:$Vh,58:$Vi,59:$Vj,60:$Vk,61:$Vl,62:$Vm,63:35,64:$Vn,65:$Vo,66:$Vp,67:$Vq,68:146,73:$Vr},{15:[1,147]},{15:[2,80],69:$VU},{17:[2,74]},o([17,69],[2,76],{34:$Vv,35:$Vw,36:$Vx,37:$Vy,38:$Vz,40:$VA,41:$VB,42:$VC,43:$VD,44:$VE,45:$VF,46:$VG,47:$VH,48:$VI,49:$VJ,51:$VK,55:$VL}),o($VO,[2,45]),{12:27,13:$V3,16:$VM,21:148,34:$Vd,35:$Ve,39:$Vf,49:$Vg,52:26,57:$Vh,58:$Vi,59:$Vj,60:$Vk,61:$Vl,62:$Vm,63:35,64:$Vn,65:$Vo,66:$Vp,67:$Vq,73:$Vr},{16:[1,149]},{16:[1,150]},{6:[1,151],34:$Vv,35:$Vw,36:$Vx,37:$Vy,38:$Vz,40:$VA,41:$VB,42:$VC,43:$VD,44:$VE,45:$VF,46:$VG,47:$VH,48:$VI,49:$VJ,51:$VK,55:$VL},o($V_,[2,25]),{6:[1,152],34:$Vv,35:$Vw,36:$Vx,37:$Vy,38:$Vz,40:$VA,41:$VB,42:$VC,43:$VD,44:$VE,45:$VF,46:$VG,47:$VH,48:$VI,49:$VJ,51:$VK,55:$VL},{6:[1,153],34:$Vv,35:$Vw,36:$Vx,37:$Vy,38:$Vz,40:$VA,41:$VB,42:$VC,43:$VD,44:$VE,45:$VF,46:$VG,47:$VH,48:$VI,49:$VJ,51:$VK,55:$VL},{12:27,13:$V3,16:$VM,21:154,34:$Vd,35:$Ve,39:$Vf,49:$Vg,52:26,57:$Vh,58:$Vi,59:$Vj,60:$Vk,61:$Vl,62:$Vm,63:35,64:$Vn,65:$Vo,66:$Vp,67:$Vq,73:$Vr},{12:27,13:$V3,15:$VR,16:$VM,21:88,34:$Vd,35:$Ve,39:$Vf,49:$Vg,52:26,53:155,57:$Vh,58:$Vi,59:$Vj,60:$Vk,61:$Vl,62:$Vm,63:35,64:$Vn,65:$Vo,66:$Vp,67:$Vq,68:87,73:$Vr},{15:[2,79]},o($VO,[2,53]),o($VV,[2,70]),{16:[1,156]},o($VZ,[2,54],{34:$Vv,35:$Vw,36:$Vx,37:$Vy,38:$Vz,40:$VA,41:$VB,42:$VC,43:$VD,44:$VE,45:$VF,46:$VG,47:$VH,49:$VJ,51:$VK,55:$VL}),{4:157,6:$V1,7:4,8:5,9:6,10:7,11:$V2,12:27,13:$V3,16:$V4,17:$V0,18:9,19:10,20:12,21:13,22:$V5,23:$V6,24:$V7,25:$V8,27:$V9,28:$Va,30:$Vb,31:$Vc,34:$Vd,35:$Ve,39:$Vf,49:$Vg,52:26,57:$Vh,58:$Vi,59:$Vj,60:$Vk,61:$Vl,62:$Vm,63:35,64:$Vn,65:$Vo,66:$Vp,67:$Vq,73:$Vr},{4:158,6:$V1,7:4,8:5,9:6,10:7,11:$V2,12:27,13:$V3,16:$V4,17:$V0,18:9,19:10,20:12,21:13,22:$V5,23:$V6,24:$V7,25:$V8,27:$V9,28:$Va,30:$Vb,31:$Vc,34:$Vd,35:$Ve,39:$Vf,49:$Vg,52:26,57:$Vh,58:$Vi,59:$Vj,60:$Vk,61:$Vl,62:$Vm,63:35,64:$Vn,65:$Vo,66:$Vp,67:$Vq,73:$Vr},{12:27,13:$V3,16:$VM,20:160,21:121,33:159,34:$Vd,35:$Ve,39:$Vf,49:$Vg,52:26,57:$Vh,58:$Vi,59:$Vj,60:$Vk,61:$Vl,62:$Vm,63:35,64:$Vn,65:$Vo,66:$Vp,67:$Vq,73:$Vr},o($Vt,[2,18]),o($Vt,[2,17]),o($VZ,[2,43],{34:$Vv,35:$Vw,36:$Vx,37:$Vy,38:$Vz,40:$VA,41:$VB,42:$VC,43:$VD,44:$VE,45:$VF,46:$VG,47:$VH,49:$VJ,51:$VK,55:$VL}),{15:[1,161]},{4:162,6:$V1,7:4,8:5,9:6,10:7,11:$V2,12:27,13:$V3,16:$V4,17:$V0,18:9,19:10,20:12,21:13,22:$V5,23:$V6,24:$V7,25:$V8,27:$V9,28:$Va,30:$Vb,31:$Vc,34:$Vd,35:$Ve,39:$Vf,49:$Vg,52:26,57:$Vh,58:$Vi,59:$Vj,60:$Vk,61:$Vl,62:$Vm,63:35,64:$Vn,65:$Vo,66:$Vp,67:$Vq,73:$Vr},{17:[1,163]},{17:[1,164]},{15:[1,165]},{15:[2,26]},o($VO,[2,50]),{17:[1,166]},{29:[1,167]},o($Vt,[2,22]),{16:[1,168]},o($Vt,[2,8]),{8:170,16:[1,169],28:$Va},{4:171,6:$V1,7:4,8:5,9:6,10:7,11:$V2,12:27,13:$V3,16:$V4,17:$V0,18:9,19:10,20:12,21:13,22:$V5,23:$V6,24:$V7,25:$V8,27:$V9,28:$Va,30:$Vb,31:$Vc,34:$Vd,35:$Ve,39:$Vf,49:$Vg,52:26,57:$Vh,58:$Vi,59:$Vj,60:$Vk,61:$Vl,62:$Vm,63:35,64:$Vn,65:$Vo,66:$Vp,67:$Vq,73:$Vr},{4:172,6:$V1,7:4,8:5,9:6,10:7,11:$V2,12:27,13:$V3,16:$V4,17:$V0,18:9,19:10,20:12,21:13,22:$V5,23:$V6,24:$V7,25:$V8,27:$V9,28:$Va,30:$Vb,31:$Vc,34:$Vd,35:$Ve,39:$Vf,49:$Vg,52:26,57:$Vh,58:$Vi,59:$Vj,60:$Vk,61:$Vl,62:$Vm,63:35,64:$Vn,65:$Vo,66:$Vp,67:$Vq,73:$Vr},o($Vt,[2,21]),{17:[1,173]},{17:[1,174]},o($Vt,[2,23]),o($Vt,[2,20])],
defaultActions: {41:[2,1],46:[2,72],83:[2,77],132:[2,74],144:[2,79],160:[2,26]},
parseError: function parseError(str, hash) {
    if (hash.recoverable) {
        this.trace(str);
    } else if (hash.loc && hash.line) {
        throw new SyntaxError(str, hash.loc, hash.line);
    } else {
        var error = new Error(str);
        error.hash = hash;
        throw error;
    }
},
parse: function parse(input) {
    var self = this, stack = [0], tstack = [], vstack = [null], lstack = [], table = this.table, yytext = '', yylineno = 0, yyleng = 0, recovering = 0, TERROR = 2, EOF = 1;
    var args = lstack.slice.call(arguments, 1);
    var lexer = Object.create(this.lexer);
    var sharedState = { yy: {} };
    for (var k in this.yy) {
        if (Object.prototype.hasOwnProperty.call(this.yy, k)) {
            sharedState.yy[k] = this.yy[k];
        }
    }
    lexer.setInput(input, sharedState.yy);
    sharedState.yy.lexer = lexer;
    sharedState.yy.parser = this;
    if (typeof lexer.yylloc == 'undefined') {
        lexer.yylloc = {};
    }
    var yyloc = lexer.yylloc;
    lstack.push(yyloc);
    var ranges = lexer.options && lexer.options.ranges;
    if (typeof sharedState.yy.parseError === 'function') {
        this.parseError = sharedState.yy.parseError;
    } else {
        this.parseError = Object.getPrototypeOf(this).parseError;
    }
    function popStack(n) {
        stack.length = stack.length - 2 * n;
        vstack.length = vstack.length - n;
        lstack.length = lstack.length - n;
    }
    _token_stack:
        var lex = function () {
            var token;
            token = lexer.lex() || EOF;
            if (typeof token !== 'number') {
                token = self.symbols_[token] || token;
            }
            return token;
        };
    var symbol, preErrorSymbol, state, action, a, r, yyval = {}, p, len, newState, expected;
    while (true) {
        state = stack[stack.length - 1];
        if (this.defaultActions[state]) {
            action = this.defaultActions[state];
        } else {
            if (symbol === null || typeof symbol == 'undefined') {
                symbol = lex();
            }
            action = table[state] && table[state][symbol];
        }
                    if (typeof action === 'undefined' || !action.length || !action[0]) {
                var errStr = '';
                expected = [];
                for (p in table[state]) {
                    if (this.terminals_[p] && p > TERROR) {
                        expected.push('\'' + this.terminals_[p] + '\'');
                    }
                }
                if (lexer.showPosition) {
                    errStr = 'Parse error on line ' + (yylineno + 1) + ':\n' + lexer.showPosition() + '\nExpecting ' + expected.join(', ') + ', got \'' + (this.terminals_[symbol] || symbol) + '\'';
                } else {
                    errStr = 'Parse error on line ' + (yylineno + 1) + ': Unexpected ' + (symbol == EOF ? 'end of input' : '\'' + (this.terminals_[symbol] || symbol) + '\'');
                }
                this.parseError(errStr, {
                    text: lexer.match,
                    token: this.terminals_[symbol] || symbol,
                    line: lexer.yylineno,
                    loc: yyloc,
                    expected: expected
                });
            }
        if (action[0] instanceof Array && action.length > 1) {
            throw new Error('Parse Error: multiple actions possible at state: ' + state + ', token: ' + symbol);
        }
        switch (action[0]) {
        case 1:
            stack.push(symbol);
            vstack.push(lexer.yytext);
            lstack.push(lexer.yylloc);
            stack.push(action[1]);
            symbol = null;
            if (!preErrorSymbol) {
                yyleng = lexer.yyleng;
                yytext = lexer.yytext;
                yylineno = lexer.yylineno;
                yyloc = lexer.yylloc;
                if (recovering > 0) {
                    recovering--;
                }
            } else {
                symbol = preErrorSymbol;
                preErrorSymbol = null;
            }
            break;
        case 2:
            len = this.productions_[action[1]][1];
            yyval.$ = vstack[vstack.length - len];
            yyval._$ = {
                first_line: lstack[lstack.length - (len || 1)].first_line,
                last_line: lstack[lstack.length - 1].last_line,
                first_column: lstack[lstack.length - (len || 1)].first_column,
                last_column: lstack[lstack.length - 1].last_column
            };
            if (ranges) {
                yyval._$.range = [
                    lstack[lstack.length - (len || 1)].range[0],
                    lstack[lstack.length - 1].range[1]
                ];
            }
            r = this.performAction.apply(yyval, [
                yytext,
                yyleng,
                yylineno,
                sharedState.yy,
                action[1],
                vstack,
                lstack
            ].concat(args));
            if (typeof r !== 'undefined') {
                return r;
            }
            if (len) {
                stack = stack.slice(0, -1 * len * 2);
                vstack = vstack.slice(0, -1 * len);
                lstack = lstack.slice(0, -1 * len);
            }
            stack.push(this.productions_[action[1]][0]);
            vstack.push(yyval.$);
            lstack.push(yyval._$);
            newState = table[stack[stack.length - 2]][stack[stack.length - 1]];
            stack.push(newState);
            break;
        case 3:
            return true;
        }
    }
    return true;
}};
/* generated by jison-lex 0.3.4 */
var lexer = (function(){
var lexer = ({

EOF:1,

parseError:function parseError(str, hash) {
        if (this.yy.parser) {
            this.yy.parser.parseError(str, hash);
        } else {
            throw new Error(str);
        }
    },

// resets the lexer, sets new input
setInput:function (input, yy) {
        this.yy = yy || this.yy || {};
        this._input = input;
        this._more = this._backtrack = this.done = false;
        this.yylineno = this.yyleng = 0;
        this.yytext = this.matched = this.match = '';
        this.conditionStack = ['INITIAL'];
        this.yylloc = {
            first_line: 1,
            first_column: 0,
            last_line: 1,
            last_column: 0
        };
        if (this.options.ranges) {
            this.yylloc.range = [0,0];
        }
        this.offset = 0;
        return this;
    },

// consumes and returns one char from the input
input:function () {
        var ch = this._input[0];
        this.yytext += ch;
        this.yyleng++;
        this.offset++;
        this.match += ch;
        this.matched += ch;
        var lines = ch.match(/(?:\r\n?|\n).*/g);
        if (lines) {
            this.yylineno++;
            this.yylloc.last_line++;
        } else {
            this.yylloc.last_column++;
        }
        if (this.options.ranges) {
            this.yylloc.range[1]++;
        }

        this._input = this._input.slice(1);
        return ch;
    },

// unshifts one char (or a string) into the input
unput:function (ch) {
        var len = ch.length;
        var lines = ch.split(/(?:\r\n?|\n)/g);

        this._input = ch + this._input;
        this.yytext = this.yytext.substr(0, this.yytext.length - len);
        //this.yyleng -= len;
        this.offset -= len;
        var oldLines = this.match.split(/(?:\r\n?|\n)/g);
        this.match = this.match.substr(0, this.match.length - 1);
        this.matched = this.matched.substr(0, this.matched.length - 1);

        if (lines.length - 1) {
            this.yylineno -= lines.length - 1;
        }
        var r = this.yylloc.range;

        this.yylloc = {
            first_line: this.yylloc.first_line,
            last_line: this.yylineno + 1,
            first_column: this.yylloc.first_column,
            last_column: lines ?
                (lines.length === oldLines.length ? this.yylloc.first_column : 0)
                 + oldLines[oldLines.length - lines.length].length - lines[0].length :
              this.yylloc.first_column - len
        };

        if (this.options.ranges) {
            this.yylloc.range = [r[0], r[0] + this.yyleng - len];
        }
        this.yyleng = this.yytext.length;
        return this;
    },

// When called from action, caches matched text and appends it on next action
more:function () {
        this._more = true;
        return this;
    },

// When called from action, signals the lexer that this rule fails to match the input, so the next matching rule (regex) should be tested instead.
reject:function () {
        if (this.options.backtrack_lexer) {
            this._backtrack = true;
        } else {
            return this.parseError('Lexical error on line ' + (this.yylineno + 1) + '. You can only invoke reject() in the lexer when the lexer is of the backtracking persuasion (options.backtrack_lexer = true).\n' + this.showPosition(), {
                text: "",
                token: null,
                line: this.yylineno
            });

        }
        return this;
    },

// retain first n characters of the match
less:function (n) {
        this.unput(this.match.slice(n));
    },

// displays already matched input, i.e. for error messages
pastInput:function () {
        var past = this.matched.substr(0, this.matched.length - this.match.length);
        return (past.length > 20 ? '...':'') + past.substr(-20).replace(/\n/g, "");
    },

// displays upcoming input, i.e. for error messages
upcomingInput:function () {
        var next = this.match;
        if (next.length < 20) {
            next += this._input.substr(0, 20-next.length);
        }
        return (next.substr(0,20) + (next.length > 20 ? '...' : '')).replace(/\n/g, "");
    },

// displays the character position where the lexing error occurred, i.e. for error messages
showPosition:function () {
        var pre = this.pastInput();
        var c = new Array(pre.length + 1).join("-");
        return pre + this.upcomingInput() + "\n" + c + "^";
    },

// test the lexed token: return FALSE when not a match, otherwise return token
test_match:function (match, indexed_rule) {
        var token,
            lines,
            backup;

        if (this.options.backtrack_lexer) {
            // save context
            backup = {
                yylineno: this.yylineno,
                yylloc: {
                    first_line: this.yylloc.first_line,
                    last_line: this.last_line,
                    first_column: this.yylloc.first_column,
                    last_column: this.yylloc.last_column
                },
                yytext: this.yytext,
                match: this.match,
                matches: this.matches,
                matched: this.matched,
                yyleng: this.yyleng,
                offset: this.offset,
                _more: this._more,
                _input: this._input,
                yy: this.yy,
                conditionStack: this.conditionStack.slice(0),
                done: this.done
            };
            if (this.options.ranges) {
                backup.yylloc.range = this.yylloc.range.slice(0);
            }
        }

        lines = match[0].match(/(?:\r\n?|\n).*/g);
        if (lines) {
            this.yylineno += lines.length;
        }
        this.yylloc = {
            first_line: this.yylloc.last_line,
            last_line: this.yylineno + 1,
            first_column: this.yylloc.last_column,
            last_column: lines ?
                         lines[lines.length - 1].length - lines[lines.length - 1].match(/\r?\n?/)[0].length :
                         this.yylloc.last_column + match[0].length
        };
        this.yytext += match[0];
        this.match += match[0];
        this.matches = match;
        this.yyleng = this.yytext.length;
        if (this.options.ranges) {
            this.yylloc.range = [this.offset, this.offset += this.yyleng];
        }
        this._more = false;
        this._backtrack = false;
        this._input = this._input.slice(match[0].length);
        this.matched += match[0];
        token = this.performAction.call(this, this.yy, this, indexed_rule, this.conditionStack[this.conditionStack.length - 1]);
        if (this.done && this._input) {
            this.done = false;
        }
        if (token) {
            return token;
        } else if (this._backtrack) {
            // recover context
            for (var k in backup) {
                this[k] = backup[k];
            }
            return false; // rule action called reject() implying the next rule should be tested instead.
        }
        return false;
    },

// return next match in input
next:function () {
        if (this.done) {
            return this.EOF;
        }
        if (!this._input) {
            this.done = true;
        }

        var token,
            match,
            tempMatch,
            index;
        if (!this._more) {
            this.yytext = '';
            this.match = '';
        }
        var rules = this._currentRules();
        for (var i = 0; i < rules.length; i++) {
            tempMatch = this._input.match(this.rules[rules[i]]);
            if (tempMatch && (!match || tempMatch[0].length > match[0].length)) {
                match = tempMatch;
                index = i;
                if (this.options.backtrack_lexer) {
                    token = this.test_match(tempMatch, rules[i]);
                    if (token !== false) {
                        return token;
                    } else if (this._backtrack) {
                        match = false;
                        continue; // rule action called reject() implying a rule MISmatch.
                    } else {
                        // else: this is a lexer rule which consumes input without producing a token (e.g. whitespace)
                        return false;
                    }
                } else if (!this.options.flex) {
                    break;
                }
            }
        }
        if (match) {
            token = this.test_match(match, rules[index]);
            if (token !== false) {
                return token;
            }
            // else: this is a lexer rule which consumes input without producing a token (e.g. whitespace)
            return false;
        }
        if (this._input === "") {
            return this.EOF;
        } else {
            return this.parseError('Lexical error on line ' + (this.yylineno + 1) + '. Unrecognized text.\n' + this.showPosition(), {
                text: "",
                token: null,
                line: this.yylineno
            });
        }
    },

// return next match that has a token
lex:function lex() {
        var r = this.next();
        if (r) {
            return r;
        } else {
            return this.lex();
        }
    },

// activates a new lexer condition state (pushes the new lexer condition state onto the condition stack)
begin:function begin(condition) {
        this.conditionStack.push(condition);
    },

// pop the previously active lexer condition state off the condition stack
popState:function popState() {
        var n = this.conditionStack.length - 1;
        if (n > 0) {
            return this.conditionStack.pop();
        } else {
            return this.conditionStack[0];
        }
    },

// produce the lexer rule set which is active for the currently active lexer condition state
_currentRules:function _currentRules() {
        if (this.conditionStack.length && this.conditionStack[this.conditionStack.length - 1]) {
            return this.conditions[this.conditionStack[this.conditionStack.length - 1]].rules;
        } else {
            return this.conditions["INITIAL"].rules;
        }
    },

// return the currently active lexer condition state; when an index argument is provided it produces the N-th previous condition state, if available
topState:function topState(n) {
        n = this.conditionStack.length - 1 - Math.abs(n || 0);
        if (n >= 0) {
            return this.conditionStack[n];
        } else {
            return "INITIAL";
        }
    },

// alias for begin(condition)
pushState:function pushState(condition) {
        this.begin(condition);
    },

// return the number of states currently on the stack
stateStackSize:function stateStackSize() {
        return this.conditionStack.length;
    },
options: {},
performAction: function anonymous(yy,yy_,$avoiding_name_collisions,YY_START) {
var YYSTATE=YY_START;
switch($avoiding_name_collisions) {
case 0:/* skip single-line comments */
break;
case 1:/* skip multi-line comments */
break;
case 2:/* skip whitespace */
break;
case 3:return 11
break;
case 4:return 22
break;
case 5:return 28
break;
case 6:return 29
break;
case 7:return 30
break;
case 8:return 31
break;
case 9:return 23
break;
case 10:return 24
break;
case 11:return 25
break;
case 12:return 27
break;
case 13:return 42
break;
case 14:return 48
break;
case 15:return 26
break;
case 16:return 16
break;
case 17:return 17
break;
case 18:return 6
break;
case 19:return 69
break;
case 20:return 59
break;
case 21:return 60
break;
case 22:return 61
break;
case 23:return 62
break;
case 24:return 64
break;
case 25:return 49
break;
case 26:return 50
break;
case 27:return 51
break;
case 28:return 65
break;
case 29:return 65
break;
case 30:this.begin('DoubleQuotedString');
break;
case 31:this.begin('SingleQuotedString');
break;
case 32:this.begin('QuotedStringEscape');
break;
case 33:this.popState();
break;
case 34:this.popState();
break;
case 35: this.popState(); return 67;
break;
case 36:return 66;
break;
case 37:return 66;
break;
case 38:return 73 /* TODO: non-ASCII identifiers */
break;
case 39:return 57 /* 3.1, 3.1e-7 */
break;
case 40:return 58
break;
case 41:return 34
break;
case 42:return 35
break;
case 43:return 36
break;
case 44:return 37
break;
case 45:return 38
break;
case 46:return 43
break;
case 47:return 47
break;
case 48:return 46
break;
case 49:return 45
break;
case 50:return 44
break;
case 51:return 39
break;
case 52:return 40
break;
case 53:return 41
break;
case 54:return 13
break;
case 55:return 15
break;
case 56:return 55
break;
case 57:return 56
break;
case 58:return 5
break;
case 59:return 'INVALID'
break;
}
},
rules: [/^(?:\/\/([^\n\r]*))/,/^(?:\/\*([\u0000-\uffff]*?)\*\/)/,/^(?:\s+)/,/^(?:function\b)/,/^(?:return\b)/,/^(?:if\b)/,/^(?:else\b)/,/^(?:while\b)/,/^(?:for\b)/,/^(?:break\b)/,/^(?:continue\b)/,/^(?:let\b)/,/^(?:const\b)/,/^(?:===)/,/^(?:=>)/,/^(?:=)/,/^(?:\{)/,/^(?:\})/,/^(?:;)/,/^(?:,)/,/^(?:true\b)/,/^(?:false\b)/,/^(?:NaN\b)/,/^(?:Infinity\b)/,/^(?:\[\])/,/^(?:\[)/,/^(?:\])/,/^(?:\.)/,/^(?:"")/,/^(?:'')/,/^(?:")/,/^(?:')/,/^(?:\\)/,/^(?:")/,/^(?:')/,/^(?:(.|\r\n|\n))/,/^(?:[^"\\]*)/,/^(?:[^'\\]*)/,/^(?:[A-Za-z_][A-Za-z0-9_]*)/,/^(?:[0-9]+(\.[0-9]+)?([eE][\-+]?[0-9]+)?\b)/,/^(?:[0-9]+\b)/,/^(?:\+)/,/^(?:-)/,/^(?:\*)/,/^(?:\/)/,/^(?:%)/,/^(?:!==)/,/^(?:<=)/,/^(?:>=)/,/^(?:<)/,/^(?:>)/,/^(?:!)/,/^(?:&&)/,/^(?:\|\|)/,/^(?:\()/,/^(?:\))/,/^(?:\?)/,/^(?::)/,/^(?:$)/,/^(?:.)/],
conditions: {"QuotedStringEscape":{"rules":[35],"inclusive":false},"SingleQuotedString":{"rules":[32,34,37],"inclusive":false},"DoubleQuotedString":{"rules":[32,33,36],"inclusive":false},"INITIAL":{"rules":[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59],"inclusive":true}}
});
return lexer;
})();
parser.lexer = lexer;
function Parser () {
  this.yy = {};
}
Parser.prototype = parser;parser.Parser = Parser;
return new Parser;
})();


if (typeof require !== 'undefined' && typeof exports !== 'undefined') {
exports.parser = parser;
exports.Parser = parser.Parser;
exports.parse = function () { return parser.parse.apply(parser, arguments); };
exports.main = function commonjsMain(args) {
    if (!args[1]) {
        console.log('Usage: '+args[0]+' FILE');
        process.exit(1);
    }
    var source = require('fs').readFileSync(require('path').normalize(args[1]), "utf8");
    return exports.parser.parse(source);
};
if (typeof module !== 'undefined' && require.main === module) {
  exports.main(process.argv.slice(1));
}
}
}).call(this,require('_process'))
},{"_process":3,"fs":1,"path":2}],29:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const syntaxTypes = {
    // Chapter 1
    Program: 1,
    ExpressionStatement: 1,
    IfStatement: 1,
    FunctionDeclaration: 1,
    VariableDeclaration: 1,
    ReturnStatement: 1,
    CallExpression: 1,
    UnaryExpression: 1,
    BinaryExpression: 1,
    LogicalExpression: 1,
    ConditionalExpression: 1,
    FunctionExpression: 1,
    ArrowFunctionExpression: 1,
    Identifier: 1,
    Literal: 1,
    // Chapter 2
    ArrayExpression: 2,
    // Chapter 3
    AssignmentExpression: 3,
    ForStatement: 3,
    WhileStatement: 3,
    BreakStatement: 3,
    ContinueStatement: 3,
    ThisExpression: 3,
    ObjectExpression: 3,
    MemberExpression: 3,
    Property: 3,
    // Week 5
    UpdateExpression: 5,
    EmptyStatement: 5,
    // previously Week 10
    NewExpression: 10,
    // Disallowed Forever
    SwitchStatement: Infinity,
    DebuggerStatement: Infinity,
    WithStatement: Infinity,
    LabeledStatement: Infinity,
    SwitchCase: Infinity,
    ThrowStatement: Infinity,
    CatchClause: Infinity,
    DoWhileStatement: Infinity,
    ForInStatement: Infinity,
    SequenceExpression: Infinity
};
exports.default = syntaxTypes;

},{}],30:[function(require,module,exports){
"use strict";
/* tslint:disable:interface-name max-classes-per-file */
Object.defineProperty(exports, "__esModule", { value: true });
const interop_1 = require("./interop");
var ErrorType;
(function (ErrorType) {
    ErrorType["SYNTAX"] = "Syntax";
    ErrorType["TYPE"] = "Type";
    ErrorType["RUNTIME"] = "Runtime";
})(ErrorType = exports.ErrorType || (exports.ErrorType = {}));
var ErrorSeverity;
(function (ErrorSeverity) {
    ErrorSeverity["WARNING"] = "Warning";
    ErrorSeverity["ERROR"] = "Error";
})(ErrorSeverity = exports.ErrorSeverity || (exports.ErrorSeverity = {}));
/**
 * Models function value in the interpreter environment.
 */
class Closure {
    constructor(node, frame, context) {
        this.node = node;
        this.frame = frame;
        this.node = node;
        try {
            if (this.node.id) {
                this.name = this.node.id.name;
            }
        }
        catch (e) {
            this.name = `Anonymous${++Closure.lambdaCtr}`;
        }
        this.fun = interop_1.closureToJS(this, context, this.name);
    }
}
/** Keep track how many lambdas are created */
Closure.lambdaCtr = 0;
exports.Closure = Closure;
/**
 * Modified from class Closure, for construction of arrow functions.
 */
class ArrowClosure {
    constructor(node, frame, context) {
        this.node = node;
        this.frame = frame;
        this.name = `Anonymous${++ArrowClosure.arrowCtr}`;
        this.fun = interop_1.closureToJS(this, context, this.name);
    }
}
/** Keep track how many lambdas are created */
ArrowClosure.arrowCtr = 0;
exports.ArrowClosure = ArrowClosure;

},{"./interop":8}],31:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const types_1 = require("../types");
/**
 * Check whether two nodes are equal.
 *
 * Two nodes are equal if their `__id` field are equal, or
 * if they have `__call`, the `__call` field is checked instead.
 *
 * @param n1 First node
 * @param n2 Second node
 */
exports.isNodeEqual = (n1, n2) => {
    if (n1.hasOwnProperty('__id') && n2.hasOwnProperty('__id')) {
        const first = n1.__id === n2.__id;
        if (!first) {
            return false;
        }
        if (n1.hasOwnProperty('__call') && n2.hasOwnProperty('__call')) {
            return n1.__call === n2.__call;
        }
        else {
            return true;
        }
    }
    else {
        return n1 === n2;
    }
};
/**
 * Non-destructively search for a node in a parent node and replace it with another node.
 *
 * @param node The root node to be searched
 * @param before Node to be replaced
 * @param after Replacement node
 */
exports.replaceAST = (node, before, after) => {
    let found = false;
    const go = (n) => {
        if (found) {
            return n;
        }
        if (exports.isNodeEqual(n, before)) {
            found = true;
            return after;
        }
        if (n.type === 'CallExpression') {
            return Object.assign({}, n, { callee: go(n.callee), arguments: n.arguments.map(go) });
        }
        else if (n.type === 'ConditionalExpression') {
            return Object.assign({}, n, { test: go(n.test), consequent: go(n.consequent), alternate: go(n.alternate) });
        }
        else if (n.type === 'UnaryExpression') {
            return Object.assign({}, n, { argument: go(n.argument) });
        }
        else if (n.type === 'BinaryExpression' || n.type === 'LogicalExpression') {
            return Object.assign({}, n, { left: go(n.left), right: go(n.right) });
        }
        else {
            return n;
        }
    };
    return go(node);
};
const createLiteralNode = (value) => {
    if (typeof value === 'undefined') {
        return {
            type: 'Identifier',
            name: 'undefined',
            __id: freshId()
        };
    }
    else {
        return {
            type: 'Literal',
            value,
            raw: value,
            __id: freshId()
        };
    }
};
const freshId = (() => {
    let id = 0;
    return () => {
        id++;
        return '__syn' + id;
    };
})();
/**
 * Create an AST node from a Source value.
 *
 * @param value any valid Source value (number/string/boolean/Closure)
 * @returns {Node}
 */
exports.createNode = (value) => {
    if (value instanceof types_1.Closure) {
        return value.node;
    }
    return createLiteralNode(value);
};
exports.composeWalker = (w1, w2) => {
    return (node, state, recurse) => {
        w1(node, state, recurse);
        w2(node, state, recurse);
    };
};

},{"../types":30}],32:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const types_1 = require("../types");
const LHS = ' on left hand side of operation';
const RHS = ' on right hand side of operation';
class TypeError {
    constructor(node, side, expected, got) {
        this.side = side;
        this.expected = expected;
        this.got = got;
        this.type = types_1.ErrorType.RUNTIME;
        this.severity = types_1.ErrorSeverity.ERROR;
        this.location = node.loc;
    }
    explain() {
        return `Expected ${this.expected}${this.side}, got ${this.got}.`;
    }
    elaborate() {
        return this.explain();
    }
}
exports.TypeError = TypeError;
/**
 * We need to define our own typeof in order for source functions to be
 * identifed as functions
 */
const typeOf = (v) => {
    if (v instanceof types_1.Closure || v instanceof types_1.ArrowClosure || typeof v === 'function') {
        return 'function';
    }
    else {
        return typeof v;
    }
};
const isNumber = (v) => typeOf(v) === 'number';
const isString = (v) => typeOf(v) === 'string';
const isBool = (v) => typeOf(v) === 'boolean';
exports.checkUnaryExpression = (context, operator, value) => {
    const node = context.runtime.nodes[0];
    if ((operator === '+' || operator === '-') && !isNumber(value)) {
        return new TypeError(node, '', 'number', typeOf(value));
    }
    else if (operator === '!' && !isBool(value)) {
        return new TypeError(node, '', 'boolean', typeOf(value));
    }
    else {
        return undefined;
    }
};
exports.checkBinaryExpression = (context, operator, left, right) => {
    const node = context.runtime.nodes[0];
    switch (operator) {
        case '-':
        case '*':
        case '/':
        case '%':
            if (!isNumber(left)) {
                return new TypeError(node, LHS, 'number', typeOf(left));
            }
            else if (!isNumber(right)) {
                return new TypeError(node, RHS, 'number', typeOf(right));
            }
            else {
                return;
            }
        case '<':
        case '<=':
        case '>':
        case '>=':
            if (isNumber(left)) {
                return isNumber(right) ? undefined : new TypeError(node, RHS, 'number', typeOf(right));
            }
            else if (isString(left)) {
                return isString(right) ? undefined : new TypeError(node, RHS, 'string', typeOf(right));
            }
            else {
                return new TypeError(node, LHS, 'string or number', typeOf(left));
            }
        case '+':
            if (isNumber(left)) {
                return isNumber(right) || isString(right)
                    ? undefined
                    : new TypeError(node, RHS, 'number', typeOf(right));
            }
            else if (!isString(left) && !isString(right)) {
                // must have at least one side that is a string
                return new TypeError(node, LHS, 'string', typeOf(left));
            }
            else {
                return;
            }
        case '!==':
        case '===':
        default:
            return;
    }
};
exports.checkLogicalExpression = (context, left, right) => {
    const node = context.runtime.nodes[0];
    if (!isBool(left)) {
        return new TypeError(node, LHS, 'boolean', typeOf(left));
    }
    else if (!isBool(right)) {
        return new TypeError(node, RHS, 'boolean', typeOf(right));
    }
    else {
        return;
    }
};
exports.checkIfStatement = (context, test) => {
    const node = context.runtime.nodes[0];
    return isBool(test) ? undefined : new TypeError(node, ' as condition', 'boolean', typeOf(test));
};

},{"../types":30}],33:[function(require,module,exports){
(function (global){
/**
 * lodash (Custom Build) <https://lodash.com/>
 * Build: `lodash modularize exports="npm" -o ./`
 * Copyright jQuery Foundation and other contributors <https://jquery.org/>
 * Released under MIT license <https://lodash.com/license>
 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
 * Copyright Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 */

/** Used as the size to enable large array optimizations. */
var LARGE_ARRAY_SIZE = 200;

/** Used to stand-in for `undefined` hash values. */
var HASH_UNDEFINED = '__lodash_hash_undefined__';

/** Used to compose bitmasks for comparison styles. */
var UNORDERED_COMPARE_FLAG = 1,
    PARTIAL_COMPARE_FLAG = 2;

/** Used as references for various `Number` constants. */
var MAX_SAFE_INTEGER = 9007199254740991;

/** `Object#toString` result references. */
var argsTag = '[object Arguments]',
    arrayTag = '[object Array]',
    boolTag = '[object Boolean]',
    dateTag = '[object Date]',
    errorTag = '[object Error]',
    funcTag = '[object Function]',
    genTag = '[object GeneratorFunction]',
    mapTag = '[object Map]',
    numberTag = '[object Number]',
    objectTag = '[object Object]',
    promiseTag = '[object Promise]',
    regexpTag = '[object RegExp]',
    setTag = '[object Set]',
    stringTag = '[object String]',
    symbolTag = '[object Symbol]',
    weakMapTag = '[object WeakMap]';

var arrayBufferTag = '[object ArrayBuffer]',
    dataViewTag = '[object DataView]',
    float32Tag = '[object Float32Array]',
    float64Tag = '[object Float64Array]',
    int8Tag = '[object Int8Array]',
    int16Tag = '[object Int16Array]',
    int32Tag = '[object Int32Array]',
    uint8Tag = '[object Uint8Array]',
    uint8ClampedTag = '[object Uint8ClampedArray]',
    uint16Tag = '[object Uint16Array]',
    uint32Tag = '[object Uint32Array]';

/**
 * Used to match `RegExp`
 * [syntax characters](http://ecma-international.org/ecma-262/7.0/#sec-patterns).
 */
var reRegExpChar = /[\\^$.*+?()[\]{}|]/g;

/** Used to detect host constructors (Safari). */
var reIsHostCtor = /^\[object .+?Constructor\]$/;

/** Used to detect unsigned integer values. */
var reIsUint = /^(?:0|[1-9]\d*)$/;

/** Used to identify `toStringTag` values of typed arrays. */
var typedArrayTags = {};
typedArrayTags[float32Tag] = typedArrayTags[float64Tag] =
typedArrayTags[int8Tag] = typedArrayTags[int16Tag] =
typedArrayTags[int32Tag] = typedArrayTags[uint8Tag] =
typedArrayTags[uint8ClampedTag] = typedArrayTags[uint16Tag] =
typedArrayTags[uint32Tag] = true;
typedArrayTags[argsTag] = typedArrayTags[arrayTag] =
typedArrayTags[arrayBufferTag] = typedArrayTags[boolTag] =
typedArrayTags[dataViewTag] = typedArrayTags[dateTag] =
typedArrayTags[errorTag] = typedArrayTags[funcTag] =
typedArrayTags[mapTag] = typedArrayTags[numberTag] =
typedArrayTags[objectTag] = typedArrayTags[regexpTag] =
typedArrayTags[setTag] = typedArrayTags[stringTag] =
typedArrayTags[weakMapTag] = false;

/** Detect free variable `global` from Node.js. */
var freeGlobal = typeof global == 'object' && global && global.Object === Object && global;

/** Detect free variable `self`. */
var freeSelf = typeof self == 'object' && self && self.Object === Object && self;

/** Used as a reference to the global object. */
var root = freeGlobal || freeSelf || Function('return this')();

/** Detect free variable `exports`. */
var freeExports = typeof exports == 'object' && exports && !exports.nodeType && exports;

/** Detect free variable `module`. */
var freeModule = freeExports && typeof module == 'object' && module && !module.nodeType && module;

/** Detect the popular CommonJS extension `module.exports`. */
var moduleExports = freeModule && freeModule.exports === freeExports;

/** Detect free variable `process` from Node.js. */
var freeProcess = moduleExports && freeGlobal.process;

/** Used to access faster Node.js helpers. */
var nodeUtil = (function() {
  try {
    return freeProcess && freeProcess.binding('util');
  } catch (e) {}
}());

/* Node.js helper references. */
var nodeIsTypedArray = nodeUtil && nodeUtil.isTypedArray;

/**
 * A specialized version of `_.some` for arrays without support for iteratee
 * shorthands.
 *
 * @private
 * @param {Array} [array] The array to iterate over.
 * @param {Function} predicate The function invoked per iteration.
 * @returns {boolean} Returns `true` if any element passes the predicate check,
 *  else `false`.
 */
function arraySome(array, predicate) {
  var index = -1,
      length = array ? array.length : 0;

  while (++index < length) {
    if (predicate(array[index], index, array)) {
      return true;
    }
  }
  return false;
}

/**
 * The base implementation of `_.times` without support for iteratee shorthands
 * or max array length checks.
 *
 * @private
 * @param {number} n The number of times to invoke `iteratee`.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Array} Returns the array of results.
 */
function baseTimes(n, iteratee) {
  var index = -1,
      result = Array(n);

  while (++index < n) {
    result[index] = iteratee(index);
  }
  return result;
}

/**
 * The base implementation of `_.unary` without support for storing metadata.
 *
 * @private
 * @param {Function} func The function to cap arguments for.
 * @returns {Function} Returns the new capped function.
 */
function baseUnary(func) {
  return function(value) {
    return func(value);
  };
}

/**
 * Gets the value at `key` of `object`.
 *
 * @private
 * @param {Object} [object] The object to query.
 * @param {string} key The key of the property to get.
 * @returns {*} Returns the property value.
 */
function getValue(object, key) {
  return object == null ? undefined : object[key];
}

/**
 * Checks if `value` is a host object in IE < 9.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a host object, else `false`.
 */
function isHostObject(value) {
  // Many host objects are `Object` objects that can coerce to strings
  // despite having improperly defined `toString` methods.
  var result = false;
  if (value != null && typeof value.toString != 'function') {
    try {
      result = !!(value + '');
    } catch (e) {}
  }
  return result;
}

/**
 * Converts `map` to its key-value pairs.
 *
 * @private
 * @param {Object} map The map to convert.
 * @returns {Array} Returns the key-value pairs.
 */
function mapToArray(map) {
  var index = -1,
      result = Array(map.size);

  map.forEach(function(value, key) {
    result[++index] = [key, value];
  });
  return result;
}

/**
 * Creates a unary function that invokes `func` with its argument transformed.
 *
 * @private
 * @param {Function} func The function to wrap.
 * @param {Function} transform The argument transform.
 * @returns {Function} Returns the new function.
 */
function overArg(func, transform) {
  return function(arg) {
    return func(transform(arg));
  };
}

/**
 * Converts `set` to an array of its values.
 *
 * @private
 * @param {Object} set The set to convert.
 * @returns {Array} Returns the values.
 */
function setToArray(set) {
  var index = -1,
      result = Array(set.size);

  set.forEach(function(value) {
    result[++index] = value;
  });
  return result;
}

/** Used for built-in method references. */
var arrayProto = Array.prototype,
    funcProto = Function.prototype,
    objectProto = Object.prototype;

/** Used to detect overreaching core-js shims. */
var coreJsData = root['__core-js_shared__'];

/** Used to detect methods masquerading as native. */
var maskSrcKey = (function() {
  var uid = /[^.]+$/.exec(coreJsData && coreJsData.keys && coreJsData.keys.IE_PROTO || '');
  return uid ? ('Symbol(src)_1.' + uid) : '';
}());

/** Used to resolve the decompiled source of functions. */
var funcToString = funcProto.toString;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * Used to resolve the
 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
 * of values.
 */
var objectToString = objectProto.toString;

/** Used to detect if a method is native. */
var reIsNative = RegExp('^' +
  funcToString.call(hasOwnProperty).replace(reRegExpChar, '\\$&')
  .replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, '$1.*?') + '$'
);

/** Built-in value references. */
var Symbol = root.Symbol,
    Uint8Array = root.Uint8Array,
    propertyIsEnumerable = objectProto.propertyIsEnumerable,
    splice = arrayProto.splice;

/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeKeys = overArg(Object.keys, Object);

/* Built-in method references that are verified to be native. */
var DataView = getNative(root, 'DataView'),
    Map = getNative(root, 'Map'),
    Promise = getNative(root, 'Promise'),
    Set = getNative(root, 'Set'),
    WeakMap = getNative(root, 'WeakMap'),
    nativeCreate = getNative(Object, 'create');

/** Used to detect maps, sets, and weakmaps. */
var dataViewCtorString = toSource(DataView),
    mapCtorString = toSource(Map),
    promiseCtorString = toSource(Promise),
    setCtorString = toSource(Set),
    weakMapCtorString = toSource(WeakMap);

/** Used to convert symbols to primitives and strings. */
var symbolProto = Symbol ? Symbol.prototype : undefined,
    symbolValueOf = symbolProto ? symbolProto.valueOf : undefined;

/**
 * Creates a hash object.
 *
 * @private
 * @constructor
 * @param {Array} [entries] The key-value pairs to cache.
 */
function Hash(entries) {
  var index = -1,
      length = entries ? entries.length : 0;

  this.clear();
  while (++index < length) {
    var entry = entries[index];
    this.set(entry[0], entry[1]);
  }
}

/**
 * Removes all key-value entries from the hash.
 *
 * @private
 * @name clear
 * @memberOf Hash
 */
function hashClear() {
  this.__data__ = nativeCreate ? nativeCreate(null) : {};
}

/**
 * Removes `key` and its value from the hash.
 *
 * @private
 * @name delete
 * @memberOf Hash
 * @param {Object} hash The hash to modify.
 * @param {string} key The key of the value to remove.
 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
 */
function hashDelete(key) {
  return this.has(key) && delete this.__data__[key];
}

/**
 * Gets the hash value for `key`.
 *
 * @private
 * @name get
 * @memberOf Hash
 * @param {string} key The key of the value to get.
 * @returns {*} Returns the entry value.
 */
function hashGet(key) {
  var data = this.__data__;
  if (nativeCreate) {
    var result = data[key];
    return result === HASH_UNDEFINED ? undefined : result;
  }
  return hasOwnProperty.call(data, key) ? data[key] : undefined;
}

/**
 * Checks if a hash value for `key` exists.
 *
 * @private
 * @name has
 * @memberOf Hash
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */
function hashHas(key) {
  var data = this.__data__;
  return nativeCreate ? data[key] !== undefined : hasOwnProperty.call(data, key);
}

/**
 * Sets the hash `key` to `value`.
 *
 * @private
 * @name set
 * @memberOf Hash
 * @param {string} key The key of the value to set.
 * @param {*} value The value to set.
 * @returns {Object} Returns the hash instance.
 */
function hashSet(key, value) {
  var data = this.__data__;
  data[key] = (nativeCreate && value === undefined) ? HASH_UNDEFINED : value;
  return this;
}

// Add methods to `Hash`.
Hash.prototype.clear = hashClear;
Hash.prototype['delete'] = hashDelete;
Hash.prototype.get = hashGet;
Hash.prototype.has = hashHas;
Hash.prototype.set = hashSet;

/**
 * Creates an list cache object.
 *
 * @private
 * @constructor
 * @param {Array} [entries] The key-value pairs to cache.
 */
function ListCache(entries) {
  var index = -1,
      length = entries ? entries.length : 0;

  this.clear();
  while (++index < length) {
    var entry = entries[index];
    this.set(entry[0], entry[1]);
  }
}

/**
 * Removes all key-value entries from the list cache.
 *
 * @private
 * @name clear
 * @memberOf ListCache
 */
function listCacheClear() {
  this.__data__ = [];
}

/**
 * Removes `key` and its value from the list cache.
 *
 * @private
 * @name delete
 * @memberOf ListCache
 * @param {string} key The key of the value to remove.
 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
 */
function listCacheDelete(key) {
  var data = this.__data__,
      index = assocIndexOf(data, key);

  if (index < 0) {
    return false;
  }
  var lastIndex = data.length - 1;
  if (index == lastIndex) {
    data.pop();
  } else {
    splice.call(data, index, 1);
  }
  return true;
}

/**
 * Gets the list cache value for `key`.
 *
 * @private
 * @name get
 * @memberOf ListCache
 * @param {string} key The key of the value to get.
 * @returns {*} Returns the entry value.
 */
function listCacheGet(key) {
  var data = this.__data__,
      index = assocIndexOf(data, key);

  return index < 0 ? undefined : data[index][1];
}

/**
 * Checks if a list cache value for `key` exists.
 *
 * @private
 * @name has
 * @memberOf ListCache
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */
function listCacheHas(key) {
  return assocIndexOf(this.__data__, key) > -1;
}

/**
 * Sets the list cache `key` to `value`.
 *
 * @private
 * @name set
 * @memberOf ListCache
 * @param {string} key The key of the value to set.
 * @param {*} value The value to set.
 * @returns {Object} Returns the list cache instance.
 */
function listCacheSet(key, value) {
  var data = this.__data__,
      index = assocIndexOf(data, key);

  if (index < 0) {
    data.push([key, value]);
  } else {
    data[index][1] = value;
  }
  return this;
}

// Add methods to `ListCache`.
ListCache.prototype.clear = listCacheClear;
ListCache.prototype['delete'] = listCacheDelete;
ListCache.prototype.get = listCacheGet;
ListCache.prototype.has = listCacheHas;
ListCache.prototype.set = listCacheSet;

/**
 * Creates a map cache object to store key-value pairs.
 *
 * @private
 * @constructor
 * @param {Array} [entries] The key-value pairs to cache.
 */
function MapCache(entries) {
  var index = -1,
      length = entries ? entries.length : 0;

  this.clear();
  while (++index < length) {
    var entry = entries[index];
    this.set(entry[0], entry[1]);
  }
}

/**
 * Removes all key-value entries from the map.
 *
 * @private
 * @name clear
 * @memberOf MapCache
 */
function mapCacheClear() {
  this.__data__ = {
    'hash': new Hash,
    'map': new (Map || ListCache),
    'string': new Hash
  };
}

/**
 * Removes `key` and its value from the map.
 *
 * @private
 * @name delete
 * @memberOf MapCache
 * @param {string} key The key of the value to remove.
 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
 */
function mapCacheDelete(key) {
  return getMapData(this, key)['delete'](key);
}

/**
 * Gets the map value for `key`.
 *
 * @private
 * @name get
 * @memberOf MapCache
 * @param {string} key The key of the value to get.
 * @returns {*} Returns the entry value.
 */
function mapCacheGet(key) {
  return getMapData(this, key).get(key);
}

/**
 * Checks if a map value for `key` exists.
 *
 * @private
 * @name has
 * @memberOf MapCache
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */
function mapCacheHas(key) {
  return getMapData(this, key).has(key);
}

/**
 * Sets the map `key` to `value`.
 *
 * @private
 * @name set
 * @memberOf MapCache
 * @param {string} key The key of the value to set.
 * @param {*} value The value to set.
 * @returns {Object} Returns the map cache instance.
 */
function mapCacheSet(key, value) {
  getMapData(this, key).set(key, value);
  return this;
}

// Add methods to `MapCache`.
MapCache.prototype.clear = mapCacheClear;
MapCache.prototype['delete'] = mapCacheDelete;
MapCache.prototype.get = mapCacheGet;
MapCache.prototype.has = mapCacheHas;
MapCache.prototype.set = mapCacheSet;

/**
 *
 * Creates an array cache object to store unique values.
 *
 * @private
 * @constructor
 * @param {Array} [values] The values to cache.
 */
function SetCache(values) {
  var index = -1,
      length = values ? values.length : 0;

  this.__data__ = new MapCache;
  while (++index < length) {
    this.add(values[index]);
  }
}

/**
 * Adds `value` to the array cache.
 *
 * @private
 * @name add
 * @memberOf SetCache
 * @alias push
 * @param {*} value The value to cache.
 * @returns {Object} Returns the cache instance.
 */
function setCacheAdd(value) {
  this.__data__.set(value, HASH_UNDEFINED);
  return this;
}

/**
 * Checks if `value` is in the array cache.
 *
 * @private
 * @name has
 * @memberOf SetCache
 * @param {*} value The value to search for.
 * @returns {number} Returns `true` if `value` is found, else `false`.
 */
function setCacheHas(value) {
  return this.__data__.has(value);
}

// Add methods to `SetCache`.
SetCache.prototype.add = SetCache.prototype.push = setCacheAdd;
SetCache.prototype.has = setCacheHas;

/**
 * Creates a stack cache object to store key-value pairs.
 *
 * @private
 * @constructor
 * @param {Array} [entries] The key-value pairs to cache.
 */
function Stack(entries) {
  this.__data__ = new ListCache(entries);
}

/**
 * Removes all key-value entries from the stack.
 *
 * @private
 * @name clear
 * @memberOf Stack
 */
function stackClear() {
  this.__data__ = new ListCache;
}

/**
 * Removes `key` and its value from the stack.
 *
 * @private
 * @name delete
 * @memberOf Stack
 * @param {string} key The key of the value to remove.
 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
 */
function stackDelete(key) {
  return this.__data__['delete'](key);
}

/**
 * Gets the stack value for `key`.
 *
 * @private
 * @name get
 * @memberOf Stack
 * @param {string} key The key of the value to get.
 * @returns {*} Returns the entry value.
 */
function stackGet(key) {
  return this.__data__.get(key);
}

/**
 * Checks if a stack value for `key` exists.
 *
 * @private
 * @name has
 * @memberOf Stack
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */
function stackHas(key) {
  return this.__data__.has(key);
}

/**
 * Sets the stack `key` to `value`.
 *
 * @private
 * @name set
 * @memberOf Stack
 * @param {string} key The key of the value to set.
 * @param {*} value The value to set.
 * @returns {Object} Returns the stack cache instance.
 */
function stackSet(key, value) {
  var cache = this.__data__;
  if (cache instanceof ListCache) {
    var pairs = cache.__data__;
    if (!Map || (pairs.length < LARGE_ARRAY_SIZE - 1)) {
      pairs.push([key, value]);
      return this;
    }
    cache = this.__data__ = new MapCache(pairs);
  }
  cache.set(key, value);
  return this;
}

// Add methods to `Stack`.
Stack.prototype.clear = stackClear;
Stack.prototype['delete'] = stackDelete;
Stack.prototype.get = stackGet;
Stack.prototype.has = stackHas;
Stack.prototype.set = stackSet;

/**
 * Creates an array of the enumerable property names of the array-like `value`.
 *
 * @private
 * @param {*} value The value to query.
 * @param {boolean} inherited Specify returning inherited property names.
 * @returns {Array} Returns the array of property names.
 */
function arrayLikeKeys(value, inherited) {
  // Safari 8.1 makes `arguments.callee` enumerable in strict mode.
  // Safari 9 makes `arguments.length` enumerable in strict mode.
  var result = (isArray(value) || isArguments(value))
    ? baseTimes(value.length, String)
    : [];

  var length = result.length,
      skipIndexes = !!length;

  for (var key in value) {
    if ((inherited || hasOwnProperty.call(value, key)) &&
        !(skipIndexes && (key == 'length' || isIndex(key, length)))) {
      result.push(key);
    }
  }
  return result;
}

/**
 * Gets the index at which the `key` is found in `array` of key-value pairs.
 *
 * @private
 * @param {Array} array The array to inspect.
 * @param {*} key The key to search for.
 * @returns {number} Returns the index of the matched value, else `-1`.
 */
function assocIndexOf(array, key) {
  var length = array.length;
  while (length--) {
    if (eq(array[length][0], key)) {
      return length;
    }
  }
  return -1;
}

/**
 * The base implementation of `getTag`.
 *
 * @private
 * @param {*} value The value to query.
 * @returns {string} Returns the `toStringTag`.
 */
function baseGetTag(value) {
  return objectToString.call(value);
}

/**
 * The base implementation of `_.isEqual` which supports partial comparisons
 * and tracks traversed objects.
 *
 * @private
 * @param {*} value The value to compare.
 * @param {*} other The other value to compare.
 * @param {Function} [customizer] The function to customize comparisons.
 * @param {boolean} [bitmask] The bitmask of comparison flags.
 *  The bitmask may be composed of the following flags:
 *     1 - Unordered comparison
 *     2 - Partial comparison
 * @param {Object} [stack] Tracks traversed `value` and `other` objects.
 * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
 */
function baseIsEqual(value, other, customizer, bitmask, stack) {
  if (value === other) {
    return true;
  }
  if (value == null || other == null || (!isObject(value) && !isObjectLike(other))) {
    return value !== value && other !== other;
  }
  return baseIsEqualDeep(value, other, baseIsEqual, customizer, bitmask, stack);
}

/**
 * A specialized version of `baseIsEqual` for arrays and objects which performs
 * deep comparisons and tracks traversed objects enabling objects with circular
 * references to be compared.
 *
 * @private
 * @param {Object} object The object to compare.
 * @param {Object} other The other object to compare.
 * @param {Function} equalFunc The function to determine equivalents of values.
 * @param {Function} [customizer] The function to customize comparisons.
 * @param {number} [bitmask] The bitmask of comparison flags. See `baseIsEqual`
 *  for more details.
 * @param {Object} [stack] Tracks traversed `object` and `other` objects.
 * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
 */
function baseIsEqualDeep(object, other, equalFunc, customizer, bitmask, stack) {
  var objIsArr = isArray(object),
      othIsArr = isArray(other),
      objTag = arrayTag,
      othTag = arrayTag;

  if (!objIsArr) {
    objTag = getTag(object);
    objTag = objTag == argsTag ? objectTag : objTag;
  }
  if (!othIsArr) {
    othTag = getTag(other);
    othTag = othTag == argsTag ? objectTag : othTag;
  }
  var objIsObj = objTag == objectTag && !isHostObject(object),
      othIsObj = othTag == objectTag && !isHostObject(other),
      isSameTag = objTag == othTag;

  if (isSameTag && !objIsObj) {
    stack || (stack = new Stack);
    return (objIsArr || isTypedArray(object))
      ? equalArrays(object, other, equalFunc, customizer, bitmask, stack)
      : equalByTag(object, other, objTag, equalFunc, customizer, bitmask, stack);
  }
  if (!(bitmask & PARTIAL_COMPARE_FLAG)) {
    var objIsWrapped = objIsObj && hasOwnProperty.call(object, '__wrapped__'),
        othIsWrapped = othIsObj && hasOwnProperty.call(other, '__wrapped__');

    if (objIsWrapped || othIsWrapped) {
      var objUnwrapped = objIsWrapped ? object.value() : object,
          othUnwrapped = othIsWrapped ? other.value() : other;

      stack || (stack = new Stack);
      return equalFunc(objUnwrapped, othUnwrapped, customizer, bitmask, stack);
    }
  }
  if (!isSameTag) {
    return false;
  }
  stack || (stack = new Stack);
  return equalObjects(object, other, equalFunc, customizer, bitmask, stack);
}

/**
 * The base implementation of `_.isNative` without bad shim checks.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a native function,
 *  else `false`.
 */
function baseIsNative(value) {
  if (!isObject(value) || isMasked(value)) {
    return false;
  }
  var pattern = (isFunction(value) || isHostObject(value)) ? reIsNative : reIsHostCtor;
  return pattern.test(toSource(value));
}

/**
 * The base implementation of `_.isTypedArray` without Node.js optimizations.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a typed array, else `false`.
 */
function baseIsTypedArray(value) {
  return isObjectLike(value) &&
    isLength(value.length) && !!typedArrayTags[objectToString.call(value)];
}

/**
 * The base implementation of `_.keys` which doesn't treat sparse arrays as dense.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names.
 */
function baseKeys(object) {
  if (!isPrototype(object)) {
    return nativeKeys(object);
  }
  var result = [];
  for (var key in Object(object)) {
    if (hasOwnProperty.call(object, key) && key != 'constructor') {
      result.push(key);
    }
  }
  return result;
}

/**
 * A specialized version of `baseIsEqualDeep` for arrays with support for
 * partial deep comparisons.
 *
 * @private
 * @param {Array} array The array to compare.
 * @param {Array} other The other array to compare.
 * @param {Function} equalFunc The function to determine equivalents of values.
 * @param {Function} customizer The function to customize comparisons.
 * @param {number} bitmask The bitmask of comparison flags. See `baseIsEqual`
 *  for more details.
 * @param {Object} stack Tracks traversed `array` and `other` objects.
 * @returns {boolean} Returns `true` if the arrays are equivalent, else `false`.
 */
function equalArrays(array, other, equalFunc, customizer, bitmask, stack) {
  var isPartial = bitmask & PARTIAL_COMPARE_FLAG,
      arrLength = array.length,
      othLength = other.length;

  if (arrLength != othLength && !(isPartial && othLength > arrLength)) {
    return false;
  }
  // Assume cyclic values are equal.
  var stacked = stack.get(array);
  if (stacked && stack.get(other)) {
    return stacked == other;
  }
  var index = -1,
      result = true,
      seen = (bitmask & UNORDERED_COMPARE_FLAG) ? new SetCache : undefined;

  stack.set(array, other);
  stack.set(other, array);

  // Ignore non-index properties.
  while (++index < arrLength) {
    var arrValue = array[index],
        othValue = other[index];

    if (customizer) {
      var compared = isPartial
        ? customizer(othValue, arrValue, index, other, array, stack)
        : customizer(arrValue, othValue, index, array, other, stack);
    }
    if (compared !== undefined) {
      if (compared) {
        continue;
      }
      result = false;
      break;
    }
    // Recursively compare arrays (susceptible to call stack limits).
    if (seen) {
      if (!arraySome(other, function(othValue, othIndex) {
            if (!seen.has(othIndex) &&
                (arrValue === othValue || equalFunc(arrValue, othValue, customizer, bitmask, stack))) {
              return seen.add(othIndex);
            }
          })) {
        result = false;
        break;
      }
    } else if (!(
          arrValue === othValue ||
            equalFunc(arrValue, othValue, customizer, bitmask, stack)
        )) {
      result = false;
      break;
    }
  }
  stack['delete'](array);
  stack['delete'](other);
  return result;
}

/**
 * A specialized version of `baseIsEqualDeep` for comparing objects of
 * the same `toStringTag`.
 *
 * **Note:** This function only supports comparing values with tags of
 * `Boolean`, `Date`, `Error`, `Number`, `RegExp`, or `String`.
 *
 * @private
 * @param {Object} object The object to compare.
 * @param {Object} other The other object to compare.
 * @param {string} tag The `toStringTag` of the objects to compare.
 * @param {Function} equalFunc The function to determine equivalents of values.
 * @param {Function} customizer The function to customize comparisons.
 * @param {number} bitmask The bitmask of comparison flags. See `baseIsEqual`
 *  for more details.
 * @param {Object} stack Tracks traversed `object` and `other` objects.
 * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
 */
function equalByTag(object, other, tag, equalFunc, customizer, bitmask, stack) {
  switch (tag) {
    case dataViewTag:
      if ((object.byteLength != other.byteLength) ||
          (object.byteOffset != other.byteOffset)) {
        return false;
      }
      object = object.buffer;
      other = other.buffer;

    case arrayBufferTag:
      if ((object.byteLength != other.byteLength) ||
          !equalFunc(new Uint8Array(object), new Uint8Array(other))) {
        return false;
      }
      return true;

    case boolTag:
    case dateTag:
    case numberTag:
      // Coerce booleans to `1` or `0` and dates to milliseconds.
      // Invalid dates are coerced to `NaN`.
      return eq(+object, +other);

    case errorTag:
      return object.name == other.name && object.message == other.message;

    case regexpTag:
    case stringTag:
      // Coerce regexes to strings and treat strings, primitives and objects,
      // as equal. See http://www.ecma-international.org/ecma-262/7.0/#sec-regexp.prototype.tostring
      // for more details.
      return object == (other + '');

    case mapTag:
      var convert = mapToArray;

    case setTag:
      var isPartial = bitmask & PARTIAL_COMPARE_FLAG;
      convert || (convert = setToArray);

      if (object.size != other.size && !isPartial) {
        return false;
      }
      // Assume cyclic values are equal.
      var stacked = stack.get(object);
      if (stacked) {
        return stacked == other;
      }
      bitmask |= UNORDERED_COMPARE_FLAG;

      // Recursively compare objects (susceptible to call stack limits).
      stack.set(object, other);
      var result = equalArrays(convert(object), convert(other), equalFunc, customizer, bitmask, stack);
      stack['delete'](object);
      return result;

    case symbolTag:
      if (symbolValueOf) {
        return symbolValueOf.call(object) == symbolValueOf.call(other);
      }
  }
  return false;
}

/**
 * A specialized version of `baseIsEqualDeep` for objects with support for
 * partial deep comparisons.
 *
 * @private
 * @param {Object} object The object to compare.
 * @param {Object} other The other object to compare.
 * @param {Function} equalFunc The function to determine equivalents of values.
 * @param {Function} customizer The function to customize comparisons.
 * @param {number} bitmask The bitmask of comparison flags. See `baseIsEqual`
 *  for more details.
 * @param {Object} stack Tracks traversed `object` and `other` objects.
 * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
 */
function equalObjects(object, other, equalFunc, customizer, bitmask, stack) {
  var isPartial = bitmask & PARTIAL_COMPARE_FLAG,
      objProps = keys(object),
      objLength = objProps.length,
      othProps = keys(other),
      othLength = othProps.length;

  if (objLength != othLength && !isPartial) {
    return false;
  }
  var index = objLength;
  while (index--) {
    var key = objProps[index];
    if (!(isPartial ? key in other : hasOwnProperty.call(other, key))) {
      return false;
    }
  }
  // Assume cyclic values are equal.
  var stacked = stack.get(object);
  if (stacked && stack.get(other)) {
    return stacked == other;
  }
  var result = true;
  stack.set(object, other);
  stack.set(other, object);

  var skipCtor = isPartial;
  while (++index < objLength) {
    key = objProps[index];
    var objValue = object[key],
        othValue = other[key];

    if (customizer) {
      var compared = isPartial
        ? customizer(othValue, objValue, key, other, object, stack)
        : customizer(objValue, othValue, key, object, other, stack);
    }
    // Recursively compare objects (susceptible to call stack limits).
    if (!(compared === undefined
          ? (objValue === othValue || equalFunc(objValue, othValue, customizer, bitmask, stack))
          : compared
        )) {
      result = false;
      break;
    }
    skipCtor || (skipCtor = key == 'constructor');
  }
  if (result && !skipCtor) {
    var objCtor = object.constructor,
        othCtor = other.constructor;

    // Non `Object` object instances with different constructors are not equal.
    if (objCtor != othCtor &&
        ('constructor' in object && 'constructor' in other) &&
        !(typeof objCtor == 'function' && objCtor instanceof objCtor &&
          typeof othCtor == 'function' && othCtor instanceof othCtor)) {
      result = false;
    }
  }
  stack['delete'](object);
  stack['delete'](other);
  return result;
}

/**
 * Gets the data for `map`.
 *
 * @private
 * @param {Object} map The map to query.
 * @param {string} key The reference key.
 * @returns {*} Returns the map data.
 */
function getMapData(map, key) {
  var data = map.__data__;
  return isKeyable(key)
    ? data[typeof key == 'string' ? 'string' : 'hash']
    : data.map;
}

/**
 * Gets the native function at `key` of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @param {string} key The key of the method to get.
 * @returns {*} Returns the function if it's native, else `undefined`.
 */
function getNative(object, key) {
  var value = getValue(object, key);
  return baseIsNative(value) ? value : undefined;
}

/**
 * Gets the `toStringTag` of `value`.
 *
 * @private
 * @param {*} value The value to query.
 * @returns {string} Returns the `toStringTag`.
 */
var getTag = baseGetTag;

// Fallback for data views, maps, sets, and weak maps in IE 11,
// for data views in Edge < 14, and promises in Node.js.
if ((DataView && getTag(new DataView(new ArrayBuffer(1))) != dataViewTag) ||
    (Map && getTag(new Map) != mapTag) ||
    (Promise && getTag(Promise.resolve()) != promiseTag) ||
    (Set && getTag(new Set) != setTag) ||
    (WeakMap && getTag(new WeakMap) != weakMapTag)) {
  getTag = function(value) {
    var result = objectToString.call(value),
        Ctor = result == objectTag ? value.constructor : undefined,
        ctorString = Ctor ? toSource(Ctor) : undefined;

    if (ctorString) {
      switch (ctorString) {
        case dataViewCtorString: return dataViewTag;
        case mapCtorString: return mapTag;
        case promiseCtorString: return promiseTag;
        case setCtorString: return setTag;
        case weakMapCtorString: return weakMapTag;
      }
    }
    return result;
  };
}

/**
 * Checks if `value` is a valid array-like index.
 *
 * @private
 * @param {*} value The value to check.
 * @param {number} [length=MAX_SAFE_INTEGER] The upper bounds of a valid index.
 * @returns {boolean} Returns `true` if `value` is a valid index, else `false`.
 */
function isIndex(value, length) {
  length = length == null ? MAX_SAFE_INTEGER : length;
  return !!length &&
    (typeof value == 'number' || reIsUint.test(value)) &&
    (value > -1 && value % 1 == 0 && value < length);
}

/**
 * Checks if `value` is suitable for use as unique object key.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is suitable, else `false`.
 */
function isKeyable(value) {
  var type = typeof value;
  return (type == 'string' || type == 'number' || type == 'symbol' || type == 'boolean')
    ? (value !== '__proto__')
    : (value === null);
}

/**
 * Checks if `func` has its source masked.
 *
 * @private
 * @param {Function} func The function to check.
 * @returns {boolean} Returns `true` if `func` is masked, else `false`.
 */
function isMasked(func) {
  return !!maskSrcKey && (maskSrcKey in func);
}

/**
 * Checks if `value` is likely a prototype object.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a prototype, else `false`.
 */
function isPrototype(value) {
  var Ctor = value && value.constructor,
      proto = (typeof Ctor == 'function' && Ctor.prototype) || objectProto;

  return value === proto;
}

/**
 * Converts `func` to its source code.
 *
 * @private
 * @param {Function} func The function to process.
 * @returns {string} Returns the source code.
 */
function toSource(func) {
  if (func != null) {
    try {
      return funcToString.call(func);
    } catch (e) {}
    try {
      return (func + '');
    } catch (e) {}
  }
  return '';
}

/**
 * Performs a
 * [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
 * comparison between two values to determine if they are equivalent.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to compare.
 * @param {*} other The other value to compare.
 * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
 * @example
 *
 * var object = { 'a': 1 };
 * var other = { 'a': 1 };
 *
 * _.eq(object, object);
 * // => true
 *
 * _.eq(object, other);
 * // => false
 *
 * _.eq('a', 'a');
 * // => true
 *
 * _.eq('a', Object('a'));
 * // => false
 *
 * _.eq(NaN, NaN);
 * // => true
 */
function eq(value, other) {
  return value === other || (value !== value && other !== other);
}

/**
 * Checks if `value` is likely an `arguments` object.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an `arguments` object,
 *  else `false`.
 * @example
 *
 * _.isArguments(function() { return arguments; }());
 * // => true
 *
 * _.isArguments([1, 2, 3]);
 * // => false
 */
function isArguments(value) {
  // Safari 8.1 makes `arguments.callee` enumerable in strict mode.
  return isArrayLikeObject(value) && hasOwnProperty.call(value, 'callee') &&
    (!propertyIsEnumerable.call(value, 'callee') || objectToString.call(value) == argsTag);
}

/**
 * Checks if `value` is classified as an `Array` object.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an array, else `false`.
 * @example
 *
 * _.isArray([1, 2, 3]);
 * // => true
 *
 * _.isArray(document.body.children);
 * // => false
 *
 * _.isArray('abc');
 * // => false
 *
 * _.isArray(_.noop);
 * // => false
 */
var isArray = Array.isArray;

/**
 * Checks if `value` is array-like. A value is considered array-like if it's
 * not a function and has a `value.length` that's an integer greater than or
 * equal to `0` and less than or equal to `Number.MAX_SAFE_INTEGER`.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is array-like, else `false`.
 * @example
 *
 * _.isArrayLike([1, 2, 3]);
 * // => true
 *
 * _.isArrayLike(document.body.children);
 * // => true
 *
 * _.isArrayLike('abc');
 * // => true
 *
 * _.isArrayLike(_.noop);
 * // => false
 */
function isArrayLike(value) {
  return value != null && isLength(value.length) && !isFunction(value);
}

/**
 * This method is like `_.isArrayLike` except that it also checks if `value`
 * is an object.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an array-like object,
 *  else `false`.
 * @example
 *
 * _.isArrayLikeObject([1, 2, 3]);
 * // => true
 *
 * _.isArrayLikeObject(document.body.children);
 * // => true
 *
 * _.isArrayLikeObject('abc');
 * // => false
 *
 * _.isArrayLikeObject(_.noop);
 * // => false
 */
function isArrayLikeObject(value) {
  return isObjectLike(value) && isArrayLike(value);
}

/**
 * Performs a deep comparison between two values to determine if they are
 * equivalent.
 *
 * **Note:** This method supports comparing arrays, array buffers, booleans,
 * date objects, error objects, maps, numbers, `Object` objects, regexes,
 * sets, strings, symbols, and typed arrays. `Object` objects are compared
 * by their own, not inherited, enumerable properties. Functions and DOM
 * nodes are **not** supported.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to compare.
 * @param {*} other The other value to compare.
 * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
 * @example
 *
 * var object = { 'a': 1 };
 * var other = { 'a': 1 };
 *
 * _.isEqual(object, other);
 * // => true
 *
 * object === other;
 * // => false
 */
function isEqual(value, other) {
  return baseIsEqual(value, other);
}

/**
 * Checks if `value` is classified as a `Function` object.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a function, else `false`.
 * @example
 *
 * _.isFunction(_);
 * // => true
 *
 * _.isFunction(/abc/);
 * // => false
 */
function isFunction(value) {
  // The use of `Object#toString` avoids issues with the `typeof` operator
  // in Safari 8-9 which returns 'object' for typed array and other constructors.
  var tag = isObject(value) ? objectToString.call(value) : '';
  return tag == funcTag || tag == genTag;
}

/**
 * Checks if `value` is a valid array-like length.
 *
 * **Note:** This method is loosely based on
 * [`ToLength`](http://ecma-international.org/ecma-262/7.0/#sec-tolength).
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a valid length, else `false`.
 * @example
 *
 * _.isLength(3);
 * // => true
 *
 * _.isLength(Number.MIN_VALUE);
 * // => false
 *
 * _.isLength(Infinity);
 * // => false
 *
 * _.isLength('3');
 * // => false
 */
function isLength(value) {
  return typeof value == 'number' &&
    value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER;
}

/**
 * Checks if `value` is the
 * [language type](http://www.ecma-international.org/ecma-262/7.0/#sec-ecmascript-language-types)
 * of `Object`. (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an object, else `false`.
 * @example
 *
 * _.isObject({});
 * // => true
 *
 * _.isObject([1, 2, 3]);
 * // => true
 *
 * _.isObject(_.noop);
 * // => true
 *
 * _.isObject(null);
 * // => false
 */
function isObject(value) {
  var type = typeof value;
  return !!value && (type == 'object' || type == 'function');
}

/**
 * Checks if `value` is object-like. A value is object-like if it's not `null`
 * and has a `typeof` result of "object".
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
 * @example
 *
 * _.isObjectLike({});
 * // => true
 *
 * _.isObjectLike([1, 2, 3]);
 * // => true
 *
 * _.isObjectLike(_.noop);
 * // => false
 *
 * _.isObjectLike(null);
 * // => false
 */
function isObjectLike(value) {
  return !!value && typeof value == 'object';
}

/**
 * Checks if `value` is classified as a typed array.
 *
 * @static
 * @memberOf _
 * @since 3.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a typed array, else `false`.
 * @example
 *
 * _.isTypedArray(new Uint8Array);
 * // => true
 *
 * _.isTypedArray([]);
 * // => false
 */
var isTypedArray = nodeIsTypedArray ? baseUnary(nodeIsTypedArray) : baseIsTypedArray;

/**
 * Creates an array of the own enumerable property names of `object`.
 *
 * **Note:** Non-object values are coerced to objects. See the
 * [ES spec](http://ecma-international.org/ecma-262/7.0/#sec-object.keys)
 * for more details.
 *
 * @static
 * @since 0.1.0
 * @memberOf _
 * @category Object
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names.
 * @example
 *
 * function Foo() {
 *   this.a = 1;
 *   this.b = 2;
 * }
 *
 * Foo.prototype.c = 3;
 *
 * _.keys(new Foo);
 * // => ['a', 'b'] (iteration order is not guaranteed)
 *
 * _.keys('hi');
 * // => ['0', '1']
 */
function keys(object) {
  return isArrayLike(object) ? arrayLikeKeys(object) : baseKeys(object);
}

module.exports = isEqual;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],34:[function(require,module,exports){
(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(factory((global.acorn = {})));
}(this, (function (exports) { 'use strict';

// Reserved word lists for various dialects of the language

var reservedWords = {
  3: "abstract boolean byte char class double enum export extends final float goto implements import int interface long native package private protected public short static super synchronized throws transient volatile",
  5: "class enum extends super const export import",
  6: "enum",
  strict: "implements interface let package private protected public static yield",
  strictBind: "eval arguments"
};

// And the keywords

var ecma5AndLessKeywords = "break case catch continue debugger default do else finally for function if return switch throw try var while with null true false instanceof typeof void delete new in this";

var keywords = {
  5: ecma5AndLessKeywords,
  6: ecma5AndLessKeywords + " const class extends export import super"
};

var keywordRelationalOperator = /^in(stanceof)?$/;

// ## Character categories

// Big ugly regular expressions that match characters in the
// whitespace, identifier, and identifier-start categories. These
// are only applied when a character is found to actually have a
// code point above 128.
// Generated by `bin/generate-identifier-regex.js`.

var nonASCIIidentifierStartChars = "\xaa\xb5\xba\xc0-\xd6\xd8-\xf6\xf8-\u02c1\u02c6-\u02d1\u02e0-\u02e4\u02ec\u02ee\u0370-\u0374\u0376\u0377\u037a-\u037d\u037f\u0386\u0388-\u038a\u038c\u038e-\u03a1\u03a3-\u03f5\u03f7-\u0481\u048a-\u052f\u0531-\u0556\u0559\u0560-\u0588\u05d0-\u05ea\u05ef-\u05f2\u0620-\u064a\u066e\u066f\u0671-\u06d3\u06d5\u06e5\u06e6\u06ee\u06ef\u06fa-\u06fc\u06ff\u0710\u0712-\u072f\u074d-\u07a5\u07b1\u07ca-\u07ea\u07f4\u07f5\u07fa\u0800-\u0815\u081a\u0824\u0828\u0840-\u0858\u0860-\u086a\u08a0-\u08b4\u08b6-\u08bd\u0904-\u0939\u093d\u0950\u0958-\u0961\u0971-\u0980\u0985-\u098c\u098f\u0990\u0993-\u09a8\u09aa-\u09b0\u09b2\u09b6-\u09b9\u09bd\u09ce\u09dc\u09dd\u09df-\u09e1\u09f0\u09f1\u09fc\u0a05-\u0a0a\u0a0f\u0a10\u0a13-\u0a28\u0a2a-\u0a30\u0a32\u0a33\u0a35\u0a36\u0a38\u0a39\u0a59-\u0a5c\u0a5e\u0a72-\u0a74\u0a85-\u0a8d\u0a8f-\u0a91\u0a93-\u0aa8\u0aaa-\u0ab0\u0ab2\u0ab3\u0ab5-\u0ab9\u0abd\u0ad0\u0ae0\u0ae1\u0af9\u0b05-\u0b0c\u0b0f\u0b10\u0b13-\u0b28\u0b2a-\u0b30\u0b32\u0b33\u0b35-\u0b39\u0b3d\u0b5c\u0b5d\u0b5f-\u0b61\u0b71\u0b83\u0b85-\u0b8a\u0b8e-\u0b90\u0b92-\u0b95\u0b99\u0b9a\u0b9c\u0b9e\u0b9f\u0ba3\u0ba4\u0ba8-\u0baa\u0bae-\u0bb9\u0bd0\u0c05-\u0c0c\u0c0e-\u0c10\u0c12-\u0c28\u0c2a-\u0c39\u0c3d\u0c58-\u0c5a\u0c60\u0c61\u0c80\u0c85-\u0c8c\u0c8e-\u0c90\u0c92-\u0ca8\u0caa-\u0cb3\u0cb5-\u0cb9\u0cbd\u0cde\u0ce0\u0ce1\u0cf1\u0cf2\u0d05-\u0d0c\u0d0e-\u0d10\u0d12-\u0d3a\u0d3d\u0d4e\u0d54-\u0d56\u0d5f-\u0d61\u0d7a-\u0d7f\u0d85-\u0d96\u0d9a-\u0db1\u0db3-\u0dbb\u0dbd\u0dc0-\u0dc6\u0e01-\u0e30\u0e32\u0e33\u0e40-\u0e46\u0e81\u0e82\u0e84\u0e87\u0e88\u0e8a\u0e8d\u0e94-\u0e97\u0e99-\u0e9f\u0ea1-\u0ea3\u0ea5\u0ea7\u0eaa\u0eab\u0ead-\u0eb0\u0eb2\u0eb3\u0ebd\u0ec0-\u0ec4\u0ec6\u0edc-\u0edf\u0f00\u0f40-\u0f47\u0f49-\u0f6c\u0f88-\u0f8c\u1000-\u102a\u103f\u1050-\u1055\u105a-\u105d\u1061\u1065\u1066\u106e-\u1070\u1075-\u1081\u108e\u10a0-\u10c5\u10c7\u10cd\u10d0-\u10fa\u10fc-\u1248\u124a-\u124d\u1250-\u1256\u1258\u125a-\u125d\u1260-\u1288\u128a-\u128d\u1290-\u12b0\u12b2-\u12b5\u12b8-\u12be\u12c0\u12c2-\u12c5\u12c8-\u12d6\u12d8-\u1310\u1312-\u1315\u1318-\u135a\u1380-\u138f\u13a0-\u13f5\u13f8-\u13fd\u1401-\u166c\u166f-\u167f\u1681-\u169a\u16a0-\u16ea\u16ee-\u16f8\u1700-\u170c\u170e-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176c\u176e-\u1770\u1780-\u17b3\u17d7\u17dc\u1820-\u1878\u1880-\u18a8\u18aa\u18b0-\u18f5\u1900-\u191e\u1950-\u196d\u1970-\u1974\u1980-\u19ab\u19b0-\u19c9\u1a00-\u1a16\u1a20-\u1a54\u1aa7\u1b05-\u1b33\u1b45-\u1b4b\u1b83-\u1ba0\u1bae\u1baf\u1bba-\u1be5\u1c00-\u1c23\u1c4d-\u1c4f\u1c5a-\u1c7d\u1c80-\u1c88\u1c90-\u1cba\u1cbd-\u1cbf\u1ce9-\u1cec\u1cee-\u1cf1\u1cf5\u1cf6\u1d00-\u1dbf\u1e00-\u1f15\u1f18-\u1f1d\u1f20-\u1f45\u1f48-\u1f4d\u1f50-\u1f57\u1f59\u1f5b\u1f5d\u1f5f-\u1f7d\u1f80-\u1fb4\u1fb6-\u1fbc\u1fbe\u1fc2-\u1fc4\u1fc6-\u1fcc\u1fd0-\u1fd3\u1fd6-\u1fdb\u1fe0-\u1fec\u1ff2-\u1ff4\u1ff6-\u1ffc\u2071\u207f\u2090-\u209c\u2102\u2107\u210a-\u2113\u2115\u2118-\u211d\u2124\u2126\u2128\u212a-\u2139\u213c-\u213f\u2145-\u2149\u214e\u2160-\u2188\u2c00-\u2c2e\u2c30-\u2c5e\u2c60-\u2ce4\u2ceb-\u2cee\u2cf2\u2cf3\u2d00-\u2d25\u2d27\u2d2d\u2d30-\u2d67\u2d6f\u2d80-\u2d96\u2da0-\u2da6\u2da8-\u2dae\u2db0-\u2db6\u2db8-\u2dbe\u2dc0-\u2dc6\u2dc8-\u2dce\u2dd0-\u2dd6\u2dd8-\u2dde\u3005-\u3007\u3021-\u3029\u3031-\u3035\u3038-\u303c\u3041-\u3096\u309b-\u309f\u30a1-\u30fa\u30fc-\u30ff\u3105-\u312f\u3131-\u318e\u31a0-\u31ba\u31f0-\u31ff\u3400-\u4db5\u4e00-\u9fef\ua000-\ua48c\ua4d0-\ua4fd\ua500-\ua60c\ua610-\ua61f\ua62a\ua62b\ua640-\ua66e\ua67f-\ua69d\ua6a0-\ua6ef\ua717-\ua71f\ua722-\ua788\ua78b-\ua7b9\ua7f7-\ua801\ua803-\ua805\ua807-\ua80a\ua80c-\ua822\ua840-\ua873\ua882-\ua8b3\ua8f2-\ua8f7\ua8fb\ua8fd\ua8fe\ua90a-\ua925\ua930-\ua946\ua960-\ua97c\ua984-\ua9b2\ua9cf\ua9e0-\ua9e4\ua9e6-\ua9ef\ua9fa-\ua9fe\uaa00-\uaa28\uaa40-\uaa42\uaa44-\uaa4b\uaa60-\uaa76\uaa7a\uaa7e-\uaaaf\uaab1\uaab5\uaab6\uaab9-\uaabd\uaac0\uaac2\uaadb-\uaadd\uaae0-\uaaea\uaaf2-\uaaf4\uab01-\uab06\uab09-\uab0e\uab11-\uab16\uab20-\uab26\uab28-\uab2e\uab30-\uab5a\uab5c-\uab65\uab70-\uabe2\uac00-\ud7a3\ud7b0-\ud7c6\ud7cb-\ud7fb\uf900-\ufa6d\ufa70-\ufad9\ufb00-\ufb06\ufb13-\ufb17\ufb1d\ufb1f-\ufb28\ufb2a-\ufb36\ufb38-\ufb3c\ufb3e\ufb40\ufb41\ufb43\ufb44\ufb46-\ufbb1\ufbd3-\ufd3d\ufd50-\ufd8f\ufd92-\ufdc7\ufdf0-\ufdfb\ufe70-\ufe74\ufe76-\ufefc\uff21-\uff3a\uff41-\uff5a\uff66-\uffbe\uffc2-\uffc7\uffca-\uffcf\uffd2-\uffd7\uffda-\uffdc";
var nonASCIIidentifierChars = "\u200c\u200d\xb7\u0300-\u036f\u0387\u0483-\u0487\u0591-\u05bd\u05bf\u05c1\u05c2\u05c4\u05c5\u05c7\u0610-\u061a\u064b-\u0669\u0670\u06d6-\u06dc\u06df-\u06e4\u06e7\u06e8\u06ea-\u06ed\u06f0-\u06f9\u0711\u0730-\u074a\u07a6-\u07b0\u07c0-\u07c9\u07eb-\u07f3\u07fd\u0816-\u0819\u081b-\u0823\u0825-\u0827\u0829-\u082d\u0859-\u085b\u08d3-\u08e1\u08e3-\u0903\u093a-\u093c\u093e-\u094f\u0951-\u0957\u0962\u0963\u0966-\u096f\u0981-\u0983\u09bc\u09be-\u09c4\u09c7\u09c8\u09cb-\u09cd\u09d7\u09e2\u09e3\u09e6-\u09ef\u09fe\u0a01-\u0a03\u0a3c\u0a3e-\u0a42\u0a47\u0a48\u0a4b-\u0a4d\u0a51\u0a66-\u0a71\u0a75\u0a81-\u0a83\u0abc\u0abe-\u0ac5\u0ac7-\u0ac9\u0acb-\u0acd\u0ae2\u0ae3\u0ae6-\u0aef\u0afa-\u0aff\u0b01-\u0b03\u0b3c\u0b3e-\u0b44\u0b47\u0b48\u0b4b-\u0b4d\u0b56\u0b57\u0b62\u0b63\u0b66-\u0b6f\u0b82\u0bbe-\u0bc2\u0bc6-\u0bc8\u0bca-\u0bcd\u0bd7\u0be6-\u0bef\u0c00-\u0c04\u0c3e-\u0c44\u0c46-\u0c48\u0c4a-\u0c4d\u0c55\u0c56\u0c62\u0c63\u0c66-\u0c6f\u0c81-\u0c83\u0cbc\u0cbe-\u0cc4\u0cc6-\u0cc8\u0cca-\u0ccd\u0cd5\u0cd6\u0ce2\u0ce3\u0ce6-\u0cef\u0d00-\u0d03\u0d3b\u0d3c\u0d3e-\u0d44\u0d46-\u0d48\u0d4a-\u0d4d\u0d57\u0d62\u0d63\u0d66-\u0d6f\u0d82\u0d83\u0dca\u0dcf-\u0dd4\u0dd6\u0dd8-\u0ddf\u0de6-\u0def\u0df2\u0df3\u0e31\u0e34-\u0e3a\u0e47-\u0e4e\u0e50-\u0e59\u0eb1\u0eb4-\u0eb9\u0ebb\u0ebc\u0ec8-\u0ecd\u0ed0-\u0ed9\u0f18\u0f19\u0f20-\u0f29\u0f35\u0f37\u0f39\u0f3e\u0f3f\u0f71-\u0f84\u0f86\u0f87\u0f8d-\u0f97\u0f99-\u0fbc\u0fc6\u102b-\u103e\u1040-\u1049\u1056-\u1059\u105e-\u1060\u1062-\u1064\u1067-\u106d\u1071-\u1074\u1082-\u108d\u108f-\u109d\u135d-\u135f\u1369-\u1371\u1712-\u1714\u1732-\u1734\u1752\u1753\u1772\u1773\u17b4-\u17d3\u17dd\u17e0-\u17e9\u180b-\u180d\u1810-\u1819\u18a9\u1920-\u192b\u1930-\u193b\u1946-\u194f\u19d0-\u19da\u1a17-\u1a1b\u1a55-\u1a5e\u1a60-\u1a7c\u1a7f-\u1a89\u1a90-\u1a99\u1ab0-\u1abd\u1b00-\u1b04\u1b34-\u1b44\u1b50-\u1b59\u1b6b-\u1b73\u1b80-\u1b82\u1ba1-\u1bad\u1bb0-\u1bb9\u1be6-\u1bf3\u1c24-\u1c37\u1c40-\u1c49\u1c50-\u1c59\u1cd0-\u1cd2\u1cd4-\u1ce8\u1ced\u1cf2-\u1cf4\u1cf7-\u1cf9\u1dc0-\u1df9\u1dfb-\u1dff\u203f\u2040\u2054\u20d0-\u20dc\u20e1\u20e5-\u20f0\u2cef-\u2cf1\u2d7f\u2de0-\u2dff\u302a-\u302f\u3099\u309a\ua620-\ua629\ua66f\ua674-\ua67d\ua69e\ua69f\ua6f0\ua6f1\ua802\ua806\ua80b\ua823-\ua827\ua880\ua881\ua8b4-\ua8c5\ua8d0-\ua8d9\ua8e0-\ua8f1\ua8ff-\ua909\ua926-\ua92d\ua947-\ua953\ua980-\ua983\ua9b3-\ua9c0\ua9d0-\ua9d9\ua9e5\ua9f0-\ua9f9\uaa29-\uaa36\uaa43\uaa4c\uaa4d\uaa50-\uaa59\uaa7b-\uaa7d\uaab0\uaab2-\uaab4\uaab7\uaab8\uaabe\uaabf\uaac1\uaaeb-\uaaef\uaaf5\uaaf6\uabe3-\uabea\uabec\uabed\uabf0-\uabf9\ufb1e\ufe00-\ufe0f\ufe20-\ufe2f\ufe33\ufe34\ufe4d-\ufe4f\uff10-\uff19\uff3f";

var nonASCIIidentifierStart = new RegExp("[" + nonASCIIidentifierStartChars + "]");
var nonASCIIidentifier = new RegExp("[" + nonASCIIidentifierStartChars + nonASCIIidentifierChars + "]");

nonASCIIidentifierStartChars = nonASCIIidentifierChars = null;

// These are a run-length and offset encoded representation of the
// >0xffff code points that are a valid part of identifiers. The
// offset starts at 0x10000, and each pair of numbers represents an
// offset to the next range, and then a size of the range. They were
// generated by bin/generate-identifier-regex.js

// eslint-disable-next-line comma-spacing
var astralIdentifierStartCodes = [0,11,2,25,2,18,2,1,2,14,3,13,35,122,70,52,268,28,4,48,48,31,14,29,6,37,11,29,3,35,5,7,2,4,43,157,19,35,5,35,5,39,9,51,157,310,10,21,11,7,153,5,3,0,2,43,2,1,4,0,3,22,11,22,10,30,66,18,2,1,11,21,11,25,71,55,7,1,65,0,16,3,2,2,2,28,43,28,4,28,36,7,2,27,28,53,11,21,11,18,14,17,111,72,56,50,14,50,14,35,477,28,11,0,9,21,190,52,76,44,33,24,27,35,30,0,12,34,4,0,13,47,15,3,22,0,2,0,36,17,2,24,85,6,2,0,2,3,2,14,2,9,8,46,39,7,3,1,3,21,2,6,2,1,2,4,4,0,19,0,13,4,159,52,19,3,54,47,21,1,2,0,185,46,42,3,37,47,21,0,60,42,86,26,230,43,117,63,32,0,257,0,11,39,8,0,22,0,12,39,3,3,20,0,35,56,264,8,2,36,18,0,50,29,113,6,2,1,2,37,22,0,26,5,2,1,2,31,15,0,328,18,270,921,103,110,18,195,2749,1070,4050,582,8634,568,8,30,114,29,19,47,17,3,32,20,6,18,689,63,129,68,12,0,67,12,65,1,31,6129,15,754,9486,286,82,395,2309,106,6,12,4,8,8,9,5991,84,2,70,2,1,3,0,3,1,3,3,2,11,2,0,2,6,2,64,2,3,3,7,2,6,2,27,2,3,2,4,2,0,4,6,2,339,3,24,2,24,2,30,2,24,2,30,2,24,2,30,2,24,2,30,2,24,2,7,4149,196,60,67,1213,3,2,26,2,1,2,0,3,0,2,9,2,3,2,0,2,0,7,0,5,0,2,0,2,0,2,2,2,1,2,0,3,0,2,0,2,0,2,0,2,0,2,1,2,0,3,3,2,6,2,3,2,3,2,0,2,9,2,16,6,2,2,4,2,16,4421,42710,42,4148,12,221,3,5761,15,7472,3104,541];

// eslint-disable-next-line comma-spacing
var astralIdentifierCodes = [509,0,227,0,150,4,294,9,1368,2,2,1,6,3,41,2,5,0,166,1,574,3,9,9,525,10,176,2,54,14,32,9,16,3,46,10,54,9,7,2,37,13,2,9,6,1,45,0,13,2,49,13,9,3,4,9,83,11,7,0,161,11,6,9,7,3,56,1,2,6,3,1,3,2,10,0,11,1,3,6,4,4,193,17,10,9,5,0,82,19,13,9,214,6,3,8,28,1,83,16,16,9,82,12,9,9,84,14,5,9,243,14,166,9,280,9,41,6,2,3,9,0,10,10,47,15,406,7,2,7,17,9,57,21,2,13,123,5,4,0,2,1,2,6,2,0,9,9,49,4,2,1,2,4,9,9,330,3,19306,9,135,4,60,6,26,9,1016,45,17,3,19723,1,5319,4,4,5,9,7,3,6,31,3,149,2,1418,49,513,54,5,49,9,0,15,0,23,4,2,14,1361,6,2,16,3,6,2,1,2,4,2214,6,110,6,6,9,792487,239];

// This has a complexity linear to the value of the code. The
// assumption is that looking up astral identifier characters is
// rare.
function isInAstralSet(code, set) {
  var pos = 0x10000;
  for (var i = 0; i < set.length; i += 2) {
    pos += set[i];
    if (pos > code) { return false }
    pos += set[i + 1];
    if (pos >= code) { return true }
  }
}

// Test whether a given character code starts an identifier.

function isIdentifierStart(code, astral) {
  if (code < 65) { return code === 36 }
  if (code < 91) { return true }
  if (code < 97) { return code === 95 }
  if (code < 123) { return true }
  if (code <= 0xffff) { return code >= 0xaa && nonASCIIidentifierStart.test(String.fromCharCode(code)) }
  if (astral === false) { return false }
  return isInAstralSet(code, astralIdentifierStartCodes)
}

// Test whether a given character is part of an identifier.

function isIdentifierChar(code, astral) {
  if (code < 48) { return code === 36 }
  if (code < 58) { return true }
  if (code < 65) { return false }
  if (code < 91) { return true }
  if (code < 97) { return code === 95 }
  if (code < 123) { return true }
  if (code <= 0xffff) { return code >= 0xaa && nonASCIIidentifier.test(String.fromCharCode(code)) }
  if (astral === false) { return false }
  return isInAstralSet(code, astralIdentifierStartCodes) || isInAstralSet(code, astralIdentifierCodes)
}

// ## Token types

// The assignment of fine-grained, information-carrying type objects
// allows the tokenizer to store the information it has about a
// token in a way that is very cheap for the parser to look up.

// All token type variables start with an underscore, to make them
// easy to recognize.

// The `beforeExpr` property is used to disambiguate between regular
// expressions and divisions. It is set on all token types that can
// be followed by an expression (thus, a slash after them would be a
// regular expression).
//
// The `startsExpr` property is used to check if the token ends a
// `yield` expression. It is set on all token types that either can
// directly start an expression (like a quotation mark) or can
// continue an expression (like the body of a string).
//
// `isLoop` marks a keyword as starting a loop, which is important
// to know when parsing a label, in order to allow or disallow
// continue jumps to that label.

var TokenType = function TokenType(label, conf) {
  if ( conf === void 0 ) conf = {};

  this.label = label;
  this.keyword = conf.keyword;
  this.beforeExpr = !!conf.beforeExpr;
  this.startsExpr = !!conf.startsExpr;
  this.isLoop = !!conf.isLoop;
  this.isAssign = !!conf.isAssign;
  this.prefix = !!conf.prefix;
  this.postfix = !!conf.postfix;
  this.binop = conf.binop || null;
  this.updateContext = null;
};

function binop(name, prec) {
  return new TokenType(name, {beforeExpr: true, binop: prec})
}
var beforeExpr = {beforeExpr: true};
var startsExpr = {startsExpr: true};

// Map keyword names to token types.

var keywords$1 = {};

// Succinct definitions of keyword token types
function kw(name, options) {
  if ( options === void 0 ) options = {};

  options.keyword = name;
  return keywords$1[name] = new TokenType(name, options)
}

var types = {
  num: new TokenType("num", startsExpr),
  regexp: new TokenType("regexp", startsExpr),
  string: new TokenType("string", startsExpr),
  name: new TokenType("name", startsExpr),
  eof: new TokenType("eof"),

  // Punctuation token types.
  bracketL: new TokenType("[", {beforeExpr: true, startsExpr: true}),
  bracketR: new TokenType("]"),
  braceL: new TokenType("{", {beforeExpr: true, startsExpr: true}),
  braceR: new TokenType("}"),
  parenL: new TokenType("(", {beforeExpr: true, startsExpr: true}),
  parenR: new TokenType(")"),
  comma: new TokenType(",", beforeExpr),
  semi: new TokenType(";", beforeExpr),
  colon: new TokenType(":", beforeExpr),
  dot: new TokenType("."),
  question: new TokenType("?", beforeExpr),
  arrow: new TokenType("=>", beforeExpr),
  template: new TokenType("template"),
  invalidTemplate: new TokenType("invalidTemplate"),
  ellipsis: new TokenType("...", beforeExpr),
  backQuote: new TokenType("`", startsExpr),
  dollarBraceL: new TokenType("${", {beforeExpr: true, startsExpr: true}),

  // Operators. These carry several kinds of properties to help the
  // parser use them properly (the presence of these properties is
  // what categorizes them as operators).
  //
  // `binop`, when present, specifies that this operator is a binary
  // operator, and will refer to its precedence.
  //
  // `prefix` and `postfix` mark the operator as a prefix or postfix
  // unary operator.
  //
  // `isAssign` marks all of `=`, `+=`, `-=` etcetera, which act as
  // binary operators with a very low precedence, that should result
  // in AssignmentExpression nodes.

  eq: new TokenType("=", {beforeExpr: true, isAssign: true}),
  assign: new TokenType("_=", {beforeExpr: true, isAssign: true}),
  incDec: new TokenType("++/--", {prefix: true, postfix: true, startsExpr: true}),
  prefix: new TokenType("!/~", {beforeExpr: true, prefix: true, startsExpr: true}),
  logicalOR: binop("||", 1),
  logicalAND: binop("&&", 2),
  bitwiseOR: binop("|", 3),
  bitwiseXOR: binop("^", 4),
  bitwiseAND: binop("&", 5),
  equality: binop("==/!=/===/!==", 6),
  relational: binop("</>/<=/>=", 7),
  bitShift: binop("<</>>/>>>", 8),
  plusMin: new TokenType("+/-", {beforeExpr: true, binop: 9, prefix: true, startsExpr: true}),
  modulo: binop("%", 10),
  star: binop("*", 10),
  slash: binop("/", 10),
  starstar: new TokenType("**", {beforeExpr: true}),

  // Keyword token types.
  _break: kw("break"),
  _case: kw("case", beforeExpr),
  _catch: kw("catch"),
  _continue: kw("continue"),
  _debugger: kw("debugger"),
  _default: kw("default", beforeExpr),
  _do: kw("do", {isLoop: true, beforeExpr: true}),
  _else: kw("else", beforeExpr),
  _finally: kw("finally"),
  _for: kw("for", {isLoop: true}),
  _function: kw("function", startsExpr),
  _if: kw("if"),
  _return: kw("return", beforeExpr),
  _switch: kw("switch"),
  _throw: kw("throw", beforeExpr),
  _try: kw("try"),
  _var: kw("var"),
  _const: kw("const"),
  _while: kw("while", {isLoop: true}),
  _with: kw("with"),
  _new: kw("new", {beforeExpr: true, startsExpr: true}),
  _this: kw("this", startsExpr),
  _super: kw("super", startsExpr),
  _class: kw("class", startsExpr),
  _extends: kw("extends", beforeExpr),
  _export: kw("export"),
  _import: kw("import"),
  _null: kw("null", startsExpr),
  _true: kw("true", startsExpr),
  _false: kw("false", startsExpr),
  _in: kw("in", {beforeExpr: true, binop: 7}),
  _instanceof: kw("instanceof", {beforeExpr: true, binop: 7}),
  _typeof: kw("typeof", {beforeExpr: true, prefix: true, startsExpr: true}),
  _void: kw("void", {beforeExpr: true, prefix: true, startsExpr: true}),
  _delete: kw("delete", {beforeExpr: true, prefix: true, startsExpr: true})
};

// Matches a whole line break (where CRLF is considered a single
// line break). Used to count lines.

var lineBreak = /\r\n?|\n|\u2028|\u2029/;
var lineBreakG = new RegExp(lineBreak.source, "g");

function isNewLine(code, ecma2019String) {
  return code === 10 || code === 13 || (!ecma2019String && (code === 0x2028 || code === 0x2029))
}

var nonASCIIwhitespace = /[\u1680\u180e\u2000-\u200a\u202f\u205f\u3000\ufeff]/;

var skipWhiteSpace = /(?:\s|\/\/.*|\/\*[^]*?\*\/)*/g;

var ref = Object.prototype;
var hasOwnProperty = ref.hasOwnProperty;
var toString = ref.toString;

// Checks if an object has a property.

function has(obj, propName) {
  return hasOwnProperty.call(obj, propName)
}

var isArray = Array.isArray || (function (obj) { return (
  toString.call(obj) === "[object Array]"
); });

// These are used when `options.locations` is on, for the
// `startLoc` and `endLoc` properties.

var Position = function Position(line, col) {
  this.line = line;
  this.column = col;
};

Position.prototype.offset = function offset (n) {
  return new Position(this.line, this.column + n)
};

var SourceLocation = function SourceLocation(p, start, end) {
  this.start = start;
  this.end = end;
  if (p.sourceFile !== null) { this.source = p.sourceFile; }
};

// The `getLineInfo` function is mostly useful when the
// `locations` option is off (for performance reasons) and you
// want to find the line/column position for a given character
// offset. `input` should be the code string that the offset refers
// into.

function getLineInfo(input, offset) {
  for (var line = 1, cur = 0;;) {
    lineBreakG.lastIndex = cur;
    var match = lineBreakG.exec(input);
    if (match && match.index < offset) {
      ++line;
      cur = match.index + match[0].length;
    } else {
      return new Position(line, offset - cur)
    }
  }
}

// A second optional argument can be given to further configure
// the parser process. These options are recognized:

var defaultOptions = {
  // `ecmaVersion` indicates the ECMAScript version to parse. Must
  // be either 3, 5, 6 (2015), 7 (2016), or 8 (2017). This influences support
  // for strict mode, the set of reserved words, and support for
  // new syntax features. The default is 7.
  ecmaVersion: 7,
  // `sourceType` indicates the mode the code should be parsed in.
  // Can be either `"script"` or `"module"`. This influences global
  // strict mode and parsing of `import` and `export` declarations.
  sourceType: "script",
  // `onInsertedSemicolon` can be a callback that will be called
  // when a semicolon is automatically inserted. It will be passed
  // th position of the comma as an offset, and if `locations` is
  // enabled, it is given the location as a `{line, column}` object
  // as second argument.
  onInsertedSemicolon: null,
  // `onTrailingComma` is similar to `onInsertedSemicolon`, but for
  // trailing commas.
  onTrailingComma: null,
  // By default, reserved words are only enforced if ecmaVersion >= 5.
  // Set `allowReserved` to a boolean value to explicitly turn this on
  // an off. When this option has the value "never", reserved words
  // and keywords can also not be used as property names.
  allowReserved: null,
  // When enabled, a return at the top level is not considered an
  // error.
  allowReturnOutsideFunction: false,
  // When enabled, import/export statements are not constrained to
  // appearing at the top of the program.
  allowImportExportEverywhere: false,
  // When enabled, await identifiers are allowed to appear at the top-level scope,
  // but they are still not allowed in non-async functions.
  allowAwaitOutsideFunction: false,
  // When enabled, hashbang directive in the beginning of file
  // is allowed and treated as a line comment.
  allowHashBang: false,
  // When `locations` is on, `loc` properties holding objects with
  // `start` and `end` properties in `{line, column}` form (with
  // line being 1-based and column 0-based) will be attached to the
  // nodes.
  locations: false,
  // A function can be passed as `onToken` option, which will
  // cause Acorn to call that function with object in the same
  // format as tokens returned from `tokenizer().getToken()`. Note
  // that you are not allowed to call the parser from the
  // callbackΓÇöthat will corrupt its internal state.
  onToken: null,
  // A function can be passed as `onComment` option, which will
  // cause Acorn to call that function with `(block, text, start,
  // end)` parameters whenever a comment is skipped. `block` is a
  // boolean indicating whether this is a block (`/* */`) comment,
  // `text` is the content of the comment, and `start` and `end` are
  // character offsets that denote the start and end of the comment.
  // When the `locations` option is on, two more parameters are
  // passed, the full `{line, column}` locations of the start and
  // end of the comments. Note that you are not allowed to call the
  // parser from the callbackΓÇöthat will corrupt its internal state.
  onComment: null,
  // Nodes have their start and end characters offsets recorded in
  // `start` and `end` properties (directly on the node, rather than
  // the `loc` object, which holds line/column data. To also add a
  // [semi-standardized][range] `range` property holding a `[start,
  // end]` array with the same numbers, set the `ranges` option to
  // `true`.
  //
  // [range]: https://bugzilla.mozilla.org/show_bug.cgi?id=745678
  ranges: false,
  // It is possible to parse multiple files into a single AST by
  // passing the tree produced by parsing the first file as
  // `program` option in subsequent parses. This will add the
  // toplevel forms of the parsed file to the `Program` (top) node
  // of an existing parse tree.
  program: null,
  // When `locations` is on, you can pass this to record the source
  // file in every node's `loc` object.
  sourceFile: null,
  // This value, if given, is stored in every node, whether
  // `locations` is on or off.
  directSourceFile: null,
  // When enabled, parenthesized expressions are represented by
  // (non-standard) ParenthesizedExpression nodes
  preserveParens: false,
  plugins: {}
};

// Interpret and default an options object

function getOptions(opts) {
  var options = {};

  for (var opt in defaultOptions)
    { options[opt] = opts && has(opts, opt) ? opts[opt] : defaultOptions[opt]; }

  if (options.ecmaVersion >= 2015)
    { options.ecmaVersion -= 2009; }

  if (options.allowReserved == null)
    { options.allowReserved = options.ecmaVersion < 5; }

  if (isArray(options.onToken)) {
    var tokens = options.onToken;
    options.onToken = function (token) { return tokens.push(token); };
  }
  if (isArray(options.onComment))
    { options.onComment = pushComment(options, options.onComment); }

  return options
}

function pushComment(options, array) {
  return function(block, text, start, end, startLoc, endLoc) {
    var comment = {
      type: block ? "Block" : "Line",
      value: text,
      start: start,
      end: end
    };
    if (options.locations)
      { comment.loc = new SourceLocation(this, startLoc, endLoc); }
    if (options.ranges)
      { comment.range = [start, end]; }
    array.push(comment);
  }
}

// Registered plugins
var plugins = {};

function keywordRegexp(words) {
  return new RegExp("^(?:" + words.replace(/ /g, "|") + ")$")
}

var Parser = function Parser(options, input, startPos) {
  this.options = options = getOptions(options);
  this.sourceFile = options.sourceFile;
  this.keywords = keywordRegexp(keywords[options.ecmaVersion >= 6 ? 6 : 5]);
  var reserved = "";
  if (!options.allowReserved) {
    for (var v = options.ecmaVersion;; v--)
      { if (reserved = reservedWords[v]) { break } }
    if (options.sourceType === "module") { reserved += " await"; }
  }
  this.reservedWords = keywordRegexp(reserved);
  var reservedStrict = (reserved ? reserved + " " : "") + reservedWords.strict;
  this.reservedWordsStrict = keywordRegexp(reservedStrict);
  this.reservedWordsStrictBind = keywordRegexp(reservedStrict + " " + reservedWords.strictBind);
  this.input = String(input);

  // Used to signal to callers of `readWord1` whether the word
  // contained any escape sequences. This is needed because words with
  // escape sequences must not be interpreted as keywords.
  this.containsEsc = false;

  // Load plugins
  this.loadPlugins(options.plugins);

  // Set up token state

  // The current position of the tokenizer in the input.
  if (startPos) {
    this.pos = startPos;
    this.lineStart = this.input.lastIndexOf("\n", startPos - 1) + 1;
    this.curLine = this.input.slice(0, this.lineStart).split(lineBreak).length;
  } else {
    this.pos = this.lineStart = 0;
    this.curLine = 1;
  }

  // Properties of the current token:
  // Its type
  this.type = types.eof;
  // For tokens that include more information than their type, the value
  this.value = null;
  // Its start and end offset
  this.start = this.end = this.pos;
  // And, if locations are used, the {line, column} object
  // corresponding to those offsets
  this.startLoc = this.endLoc = this.curPosition();

  // Position information for the previous token
  this.lastTokEndLoc = this.lastTokStartLoc = null;
  this.lastTokStart = this.lastTokEnd = this.pos;

  // The context stack is used to superficially track syntactic
  // context to predict whether a regular expression is allowed in a
  // given position.
  this.context = this.initialContext();
  this.exprAllowed = true;

  // Figure out if it's a module code.
  this.inModule = options.sourceType === "module";
  this.strict = this.inModule || this.strictDirective(this.pos);

  // Used to signify the start of a potential arrow function
  this.potentialArrowAt = -1;

  // Flags to track whether we are in a function, a generator, an async function.
  this.inFunction = this.inGenerator = this.inAsync = false;
  // Positions to delayed-check that yield/await does not exist in default parameters.
  this.yieldPos = this.awaitPos = 0;
  // Labels in scope.
  this.labels = [];

  // If enabled, skip leading hashbang line.
  if (this.pos === 0 && options.allowHashBang && this.input.slice(0, 2) === "#!")
    { this.skipLineComment(2); }

  // Scope tracking for duplicate variable names (see scope.js)
  this.scopeStack = [];
  this.enterFunctionScope();

  // For RegExp validation
  this.regexpState = null;
};

// DEPRECATED Kept for backwards compatibility until 3.0 in case a plugin uses them
Parser.prototype.isKeyword = function isKeyword (word) { return this.keywords.test(word) };
Parser.prototype.isReservedWord = function isReservedWord (word) { return this.reservedWords.test(word) };

Parser.prototype.extend = function extend (name, f) {
  this[name] = f(this[name]);
};

Parser.prototype.loadPlugins = function loadPlugins (pluginConfigs) {
    var this$1 = this;

  for (var name in pluginConfigs) {
    var plugin = plugins[name];
    if (!plugin) { throw new Error("Plugin '" + name + "' not found") }
    plugin(this$1, pluginConfigs[name]);
  }
};

Parser.prototype.parse = function parse () {
  var node = this.options.program || this.startNode();
  this.nextToken();
  return this.parseTopLevel(node)
};

var pp = Parser.prototype;

// ## Parser utilities

var literal = /^(?:'((?:\\.|[^'])*?)'|"((?:\\.|[^"])*?)"|;)/;
pp.strictDirective = function(start) {
  var this$1 = this;

  for (;;) {
    skipWhiteSpace.lastIndex = start;
    start += skipWhiteSpace.exec(this$1.input)[0].length;
    var match = literal.exec(this$1.input.slice(start));
    if (!match) { return false }
    if ((match[1] || match[2]) === "use strict") { return true }
    start += match[0].length;
  }
};

// Predicate that tests whether the next token is of the given
// type, and if yes, consumes it as a side effect.

pp.eat = function(type) {
  if (this.type === type) {
    this.next();
    return true
  } else {
    return false
  }
};

// Tests whether parsed token is a contextual keyword.

pp.isContextual = function(name) {
  return this.type === types.name && this.value === name && !this.containsEsc
};

// Consumes contextual keyword if possible.

pp.eatContextual = function(name) {
  if (!this.isContextual(name)) { return false }
  this.next();
  return true
};

// Asserts that following token is given contextual keyword.

pp.expectContextual = function(name) {
  if (!this.eatContextual(name)) { this.unexpected(); }
};

// Test whether a semicolon can be inserted at the current position.

pp.canInsertSemicolon = function() {
  return this.type === types.eof ||
    this.type === types.braceR ||
    lineBreak.test(this.input.slice(this.lastTokEnd, this.start))
};

pp.insertSemicolon = function() {
  if (this.canInsertSemicolon()) {
    if (this.options.onInsertedSemicolon)
      { this.options.onInsertedSemicolon(this.lastTokEnd, this.lastTokEndLoc); }
    return true
  }
};

// Consume a semicolon, or, failing that, see if we are allowed to
// pretend that there is a semicolon at this position.

pp.semicolon = function() {
  if (!this.eat(types.semi) && !this.insertSemicolon()) { this.unexpected(); }
};

pp.afterTrailingComma = function(tokType, notNext) {
  if (this.type === tokType) {
    if (this.options.onTrailingComma)
      { this.options.onTrailingComma(this.lastTokStart, this.lastTokStartLoc); }
    if (!notNext)
      { this.next(); }
    return true
  }
};

// Expect a token of a given type. If found, consume it, otherwise,
// raise an unexpected token error.

pp.expect = function(type) {
  this.eat(type) || this.unexpected();
};

// Raise an unexpected token error.

pp.unexpected = function(pos) {
  this.raise(pos != null ? pos : this.start, "Unexpected token");
};

function DestructuringErrors() {
  this.shorthandAssign =
  this.trailingComma =
  this.parenthesizedAssign =
  this.parenthesizedBind =
  this.doubleProto =
    -1;
}

pp.checkPatternErrors = function(refDestructuringErrors, isAssign) {
  if (!refDestructuringErrors) { return }
  if (refDestructuringErrors.trailingComma > -1)
    { this.raiseRecoverable(refDestructuringErrors.trailingComma, "Comma is not permitted after the rest element"); }
  var parens = isAssign ? refDestructuringErrors.parenthesizedAssign : refDestructuringErrors.parenthesizedBind;
  if (parens > -1) { this.raiseRecoverable(parens, "Parenthesized pattern"); }
};

pp.checkExpressionErrors = function(refDestructuringErrors, andThrow) {
  if (!refDestructuringErrors) { return false }
  var shorthandAssign = refDestructuringErrors.shorthandAssign;
  var doubleProto = refDestructuringErrors.doubleProto;
  if (!andThrow) { return shorthandAssign >= 0 || doubleProto >= 0 }
  if (shorthandAssign >= 0)
    { this.raise(shorthandAssign, "Shorthand property assignments are valid only in destructuring patterns"); }
  if (doubleProto >= 0)
    { this.raiseRecoverable(doubleProto, "Redefinition of __proto__ property"); }
};

pp.checkYieldAwaitInDefaultParams = function() {
  if (this.yieldPos && (!this.awaitPos || this.yieldPos < this.awaitPos))
    { this.raise(this.yieldPos, "Yield expression cannot be a default value"); }
  if (this.awaitPos)
    { this.raise(this.awaitPos, "Await expression cannot be a default value"); }
};

pp.isSimpleAssignTarget = function(expr) {
  if (expr.type === "ParenthesizedExpression")
    { return this.isSimpleAssignTarget(expr.expression) }
  return expr.type === "Identifier" || expr.type === "MemberExpression"
};

var pp$1 = Parser.prototype;

// ### Statement parsing

// Parse a program. Initializes the parser, reads any number of
// statements, and wraps them in a Program node.  Optionally takes a
// `program` argument.  If present, the statements will be appended
// to its body instead of creating a new node.

pp$1.parseTopLevel = function(node) {
  var this$1 = this;

  var exports = {};
  if (!node.body) { node.body = []; }
  while (this.type !== types.eof) {
    var stmt = this$1.parseStatement(true, true, exports);
    node.body.push(stmt);
  }
  this.adaptDirectivePrologue(node.body);
  this.next();
  if (this.options.ecmaVersion >= 6) {
    node.sourceType = this.options.sourceType;
  }
  return this.finishNode(node, "Program")
};

var loopLabel = {kind: "loop"};
var switchLabel = {kind: "switch"};

pp$1.isLet = function() {
  if (this.options.ecmaVersion < 6 || !this.isContextual("let")) { return false }
  skipWhiteSpace.lastIndex = this.pos;
  var skip = skipWhiteSpace.exec(this.input);
  var next = this.pos + skip[0].length, nextCh = this.input.charCodeAt(next);
  if (nextCh === 91 || nextCh === 123) { return true } // '{' and '['
  if (isIdentifierStart(nextCh, true)) {
    var pos = next + 1;
    while (isIdentifierChar(this.input.charCodeAt(pos), true)) { ++pos; }
    var ident = this.input.slice(next, pos);
    if (!keywordRelationalOperator.test(ident)) { return true }
  }
  return false
};

// check 'async [no LineTerminator here] function'
// - 'async /*foo*/ function' is OK.
// - 'async /*\n*/ function' is invalid.
pp$1.isAsyncFunction = function() {
  if (this.options.ecmaVersion < 8 || !this.isContextual("async"))
    { return false }

  skipWhiteSpace.lastIndex = this.pos;
  var skip = skipWhiteSpace.exec(this.input);
  var next = this.pos + skip[0].length;
  return !lineBreak.test(this.input.slice(this.pos, next)) &&
    this.input.slice(next, next + 8) === "function" &&
    (next + 8 === this.input.length || !isIdentifierChar(this.input.charAt(next + 8)))
};

// Parse a single statement.
//
// If expecting a statement and finding a slash operator, parse a
// regular expression literal. This is to handle cases like
// `if (foo) /blah/.exec(foo)`, where looking at the previous token
// does not help.

pp$1.parseStatement = function(declaration, topLevel, exports) {
  var starttype = this.type, node = this.startNode(), kind;

  if (this.isLet()) {
    starttype = types._var;
    kind = "let";
  }

  // Most types of statements are recognized by the keyword they
  // start with. Many are trivial to parse, some require a bit of
  // complexity.

  switch (starttype) {
  case types._break: case types._continue: return this.parseBreakContinueStatement(node, starttype.keyword)
  case types._debugger: return this.parseDebuggerStatement(node)
  case types._do: return this.parseDoStatement(node)
  case types._for: return this.parseForStatement(node)
  case types._function:
    if (!declaration && this.options.ecmaVersion >= 6) { this.unexpected(); }
    return this.parseFunctionStatement(node, false)
  case types._class:
    if (!declaration) { this.unexpected(); }
    return this.parseClass(node, true)
  case types._if: return this.parseIfStatement(node)
  case types._return: return this.parseReturnStatement(node)
  case types._switch: return this.parseSwitchStatement(node)
  case types._throw: return this.parseThrowStatement(node)
  case types._try: return this.parseTryStatement(node)
  case types._const: case types._var:
    kind = kind || this.value;
    if (!declaration && kind !== "var") { this.unexpected(); }
    return this.parseVarStatement(node, kind)
  case types._while: return this.parseWhileStatement(node)
  case types._with: return this.parseWithStatement(node)
  case types.braceL: return this.parseBlock()
  case types.semi: return this.parseEmptyStatement(node)
  case types._export:
  case types._import:
    if (!this.options.allowImportExportEverywhere) {
      if (!topLevel)
        { this.raise(this.start, "'import' and 'export' may only appear at the top level"); }
      if (!this.inModule)
        { this.raise(this.start, "'import' and 'export' may appear only with 'sourceType: module'"); }
    }
    return starttype === types._import ? this.parseImport(node) : this.parseExport(node, exports)

    // If the statement does not start with a statement keyword or a
    // brace, it's an ExpressionStatement or LabeledStatement. We
    // simply start parsing an expression, and afterwards, if the
    // next token is a colon and the expression was a simple
    // Identifier node, we switch to interpreting it as a label.
  default:
    if (this.isAsyncFunction()) {
      if (!declaration) { this.unexpected(); }
      this.next();
      return this.parseFunctionStatement(node, true)
    }

    var maybeName = this.value, expr = this.parseExpression();
    if (starttype === types.name && expr.type === "Identifier" && this.eat(types.colon))
      { return this.parseLabeledStatement(node, maybeName, expr) }
    else { return this.parseExpressionStatement(node, expr) }
  }
};

pp$1.parseBreakContinueStatement = function(node, keyword) {
  var this$1 = this;

  var isBreak = keyword === "break";
  this.next();
  if (this.eat(types.semi) || this.insertSemicolon()) { node.label = null; }
  else if (this.type !== types.name) { this.unexpected(); }
  else {
    node.label = this.parseIdent();
    this.semicolon();
  }

  // Verify that there is an actual destination to break or
  // continue to.
  var i = 0;
  for (; i < this.labels.length; ++i) {
    var lab = this$1.labels[i];
    if (node.label == null || lab.name === node.label.name) {
      if (lab.kind != null && (isBreak || lab.kind === "loop")) { break }
      if (node.label && isBreak) { break }
    }
  }
  if (i === this.labels.length) { this.raise(node.start, "Unsyntactic " + keyword); }
  return this.finishNode(node, isBreak ? "BreakStatement" : "ContinueStatement")
};

pp$1.parseDebuggerStatement = function(node) {
  this.next();
  this.semicolon();
  return this.finishNode(node, "DebuggerStatement")
};

pp$1.parseDoStatement = function(node) {
  this.next();
  this.labels.push(loopLabel);
  node.body = this.parseStatement(false);
  this.labels.pop();
  this.expect(types._while);
  node.test = this.parseParenExpression();
  if (this.options.ecmaVersion >= 6)
    { this.eat(types.semi); }
  else
    { this.semicolon(); }
  return this.finishNode(node, "DoWhileStatement")
};

// Disambiguating between a `for` and a `for`/`in` or `for`/`of`
// loop is non-trivial. Basically, we have to parse the init `var`
// statement or expression, disallowing the `in` operator (see
// the second parameter to `parseExpression`), and then check
// whether the next token is `in` or `of`. When there is no init
// part (semicolon immediately after the opening parenthesis), it
// is a regular `for` loop.

pp$1.parseForStatement = function(node) {
  this.next();
  var awaitAt = (this.options.ecmaVersion >= 9 && this.inAsync && this.eatContextual("await")) ? this.lastTokStart : -1;
  this.labels.push(loopLabel);
  this.enterLexicalScope();
  this.expect(types.parenL);
  if (this.type === types.semi) {
    if (awaitAt > -1) { this.unexpected(awaitAt); }
    return this.parseFor(node, null)
  }
  var isLet = this.isLet();
  if (this.type === types._var || this.type === types._const || isLet) {
    var init$1 = this.startNode(), kind = isLet ? "let" : this.value;
    this.next();
    this.parseVar(init$1, true, kind);
    this.finishNode(init$1, "VariableDeclaration");
    if ((this.type === types._in || (this.options.ecmaVersion >= 6 && this.isContextual("of"))) && init$1.declarations.length === 1 &&
        !(kind !== "var" && init$1.declarations[0].init)) {
      if (this.options.ecmaVersion >= 9) {
        if (this.type === types._in) {
          if (awaitAt > -1) { this.unexpected(awaitAt); }
        } else { node.await = awaitAt > -1; }
      }
      return this.parseForIn(node, init$1)
    }
    if (awaitAt > -1) { this.unexpected(awaitAt); }
    return this.parseFor(node, init$1)
  }
  var refDestructuringErrors = new DestructuringErrors;
  var init = this.parseExpression(true, refDestructuringErrors);
  if (this.type === types._in || (this.options.ecmaVersion >= 6 && this.isContextual("of"))) {
    if (this.options.ecmaVersion >= 9) {
      if (this.type === types._in) {
        if (awaitAt > -1) { this.unexpected(awaitAt); }
      } else { node.await = awaitAt > -1; }
    }
    this.toAssignable(init, false, refDestructuringErrors);
    this.checkLVal(init);
    return this.parseForIn(node, init)
  } else {
    this.checkExpressionErrors(refDestructuringErrors, true);
  }
  if (awaitAt > -1) { this.unexpected(awaitAt); }
  return this.parseFor(node, init)
};

pp$1.parseFunctionStatement = function(node, isAsync) {
  this.next();
  return this.parseFunction(node, true, false, isAsync)
};

pp$1.parseIfStatement = function(node) {
  this.next();
  node.test = this.parseParenExpression();
  // allow function declarations in branches, but only in non-strict mode
  node.consequent = this.parseStatement(!this.strict && this.type === types._function);
  node.alternate = this.eat(types._else) ? this.parseStatement(!this.strict && this.type === types._function) : null;
  return this.finishNode(node, "IfStatement")
};

pp$1.parseReturnStatement = function(node) {
  if (!this.inFunction && !this.options.allowReturnOutsideFunction)
    { this.raise(this.start, "'return' outside of function"); }
  this.next();

  // In `return` (and `break`/`continue`), the keywords with
  // optional arguments, we eagerly look for a semicolon or the
  // possibility to insert one.

  if (this.eat(types.semi) || this.insertSemicolon()) { node.argument = null; }
  else { node.argument = this.parseExpression(); this.semicolon(); }
  return this.finishNode(node, "ReturnStatement")
};

pp$1.parseSwitchStatement = function(node) {
  var this$1 = this;

  this.next();
  node.discriminant = this.parseParenExpression();
  node.cases = [];
  this.expect(types.braceL);
  this.labels.push(switchLabel);
  this.enterLexicalScope();

  // Statements under must be grouped (by label) in SwitchCase
  // nodes. `cur` is used to keep the node that we are currently
  // adding statements to.

  var cur;
  for (var sawDefault = false; this.type !== types.braceR;) {
    if (this$1.type === types._case || this$1.type === types._default) {
      var isCase = this$1.type === types._case;
      if (cur) { this$1.finishNode(cur, "SwitchCase"); }
      node.cases.push(cur = this$1.startNode());
      cur.consequent = [];
      this$1.next();
      if (isCase) {
        cur.test = this$1.parseExpression();
      } else {
        if (sawDefault) { this$1.raiseRecoverable(this$1.lastTokStart, "Multiple default clauses"); }
        sawDefault = true;
        cur.test = null;
      }
      this$1.expect(types.colon);
    } else {
      if (!cur) { this$1.unexpected(); }
      cur.consequent.push(this$1.parseStatement(true));
    }
  }
  this.exitLexicalScope();
  if (cur) { this.finishNode(cur, "SwitchCase"); }
  this.next(); // Closing brace
  this.labels.pop();
  return this.finishNode(node, "SwitchStatement")
};

pp$1.parseThrowStatement = function(node) {
  this.next();
  if (lineBreak.test(this.input.slice(this.lastTokEnd, this.start)))
    { this.raise(this.lastTokEnd, "Illegal newline after throw"); }
  node.argument = this.parseExpression();
  this.semicolon();
  return this.finishNode(node, "ThrowStatement")
};

// Reused empty array added for node fields that are always empty.

var empty = [];

pp$1.parseTryStatement = function(node) {
  this.next();
  node.block = this.parseBlock();
  node.handler = null;
  if (this.type === types._catch) {
    var clause = this.startNode();
    this.next();
    if (this.eat(types.parenL)) {
      clause.param = this.parseBindingAtom();
      this.enterLexicalScope();
      this.checkLVal(clause.param, "let");
      this.expect(types.parenR);
    } else {
      if (this.options.ecmaVersion < 10) { this.unexpected(); }
      clause.param = null;
      this.enterLexicalScope();
    }
    clause.body = this.parseBlock(false);
    this.exitLexicalScope();
    node.handler = this.finishNode(clause, "CatchClause");
  }
  node.finalizer = this.eat(types._finally) ? this.parseBlock() : null;
  if (!node.handler && !node.finalizer)
    { this.raise(node.start, "Missing catch or finally clause"); }
  return this.finishNode(node, "TryStatement")
};

pp$1.parseVarStatement = function(node, kind) {
  this.next();
  this.parseVar(node, false, kind);
  this.semicolon();
  return this.finishNode(node, "VariableDeclaration")
};

pp$1.parseWhileStatement = function(node) {
  this.next();
  node.test = this.parseParenExpression();
  this.labels.push(loopLabel);
  node.body = this.parseStatement(false);
  this.labels.pop();
  return this.finishNode(node, "WhileStatement")
};

pp$1.parseWithStatement = function(node) {
  if (this.strict) { this.raise(this.start, "'with' in strict mode"); }
  this.next();
  node.object = this.parseParenExpression();
  node.body = this.parseStatement(false);
  return this.finishNode(node, "WithStatement")
};

pp$1.parseEmptyStatement = function(node) {
  this.next();
  return this.finishNode(node, "EmptyStatement")
};

pp$1.parseLabeledStatement = function(node, maybeName, expr) {
  var this$1 = this;

  for (var i$1 = 0, list = this$1.labels; i$1 < list.length; i$1 += 1)
    {
    var label = list[i$1];

    if (label.name === maybeName)
      { this$1.raise(expr.start, "Label '" + maybeName + "' is already declared");
  } }
  var kind = this.type.isLoop ? "loop" : this.type === types._switch ? "switch" : null;
  for (var i = this.labels.length - 1; i >= 0; i--) {
    var label$1 = this$1.labels[i];
    if (label$1.statementStart === node.start) {
      // Update information about previous labels on this node
      label$1.statementStart = this$1.start;
      label$1.kind = kind;
    } else { break }
  }
  this.labels.push({name: maybeName, kind: kind, statementStart: this.start});
  node.body = this.parseStatement(true);
  if (node.body.type === "ClassDeclaration" ||
      node.body.type === "VariableDeclaration" && node.body.kind !== "var" ||
      node.body.type === "FunctionDeclaration" && (this.strict || node.body.generator))
    { this.raiseRecoverable(node.body.start, "Invalid labeled declaration"); }
  this.labels.pop();
  node.label = expr;
  return this.finishNode(node, "LabeledStatement")
};

pp$1.parseExpressionStatement = function(node, expr) {
  node.expression = expr;
  this.semicolon();
  return this.finishNode(node, "ExpressionStatement")
};

// Parse a semicolon-enclosed block of statements, handling `"use
// strict"` declarations when `allowStrict` is true (used for
// function bodies).

pp$1.parseBlock = function(createNewLexicalScope) {
  var this$1 = this;
  if ( createNewLexicalScope === void 0 ) createNewLexicalScope = true;

  var node = this.startNode();
  node.body = [];
  this.expect(types.braceL);
  if (createNewLexicalScope) {
    this.enterLexicalScope();
  }
  while (!this.eat(types.braceR)) {
    var stmt = this$1.parseStatement(true);
    node.body.push(stmt);
  }
  if (createNewLexicalScope) {
    this.exitLexicalScope();
  }
  return this.finishNode(node, "BlockStatement")
};

// Parse a regular `for` loop. The disambiguation code in
// `parseStatement` will already have parsed the init statement or
// expression.

pp$1.parseFor = function(node, init) {
  node.init = init;
  this.expect(types.semi);
  node.test = this.type === types.semi ? null : this.parseExpression();
  this.expect(types.semi);
  node.update = this.type === types.parenR ? null : this.parseExpression();
  this.expect(types.parenR);
  this.exitLexicalScope();
  node.body = this.parseStatement(false);
  this.labels.pop();
  return this.finishNode(node, "ForStatement")
};

// Parse a `for`/`in` and `for`/`of` loop, which are almost
// same from parser's perspective.

pp$1.parseForIn = function(node, init) {
  var type = this.type === types._in ? "ForInStatement" : "ForOfStatement";
  this.next();
  if (type === "ForInStatement") {
    if (init.type === "AssignmentPattern" ||
      (init.type === "VariableDeclaration" && init.declarations[0].init != null &&
       (this.strict || init.declarations[0].id.type !== "Identifier")))
      { this.raise(init.start, "Invalid assignment in for-in loop head"); }
  }
  node.left = init;
  node.right = type === "ForInStatement" ? this.parseExpression() : this.parseMaybeAssign();
  this.expect(types.parenR);
  this.exitLexicalScope();
  node.body = this.parseStatement(false);
  this.labels.pop();
  return this.finishNode(node, type)
};

// Parse a list of variable declarations.

pp$1.parseVar = function(node, isFor, kind) {
  var this$1 = this;

  node.declarations = [];
  node.kind = kind;
  for (;;) {
    var decl = this$1.startNode();
    this$1.parseVarId(decl, kind);
    if (this$1.eat(types.eq)) {
      decl.init = this$1.parseMaybeAssign(isFor);
    } else if (kind === "const" && !(this$1.type === types._in || (this$1.options.ecmaVersion >= 6 && this$1.isContextual("of")))) {
      this$1.unexpected();
    } else if (decl.id.type !== "Identifier" && !(isFor && (this$1.type === types._in || this$1.isContextual("of")))) {
      this$1.raise(this$1.lastTokEnd, "Complex binding patterns require an initialization value");
    } else {
      decl.init = null;
    }
    node.declarations.push(this$1.finishNode(decl, "VariableDeclarator"));
    if (!this$1.eat(types.comma)) { break }
  }
  return node
};

pp$1.parseVarId = function(decl, kind) {
  decl.id = this.parseBindingAtom(kind);
  this.checkLVal(decl.id, kind, false);
};

// Parse a function declaration or literal (depending on the
// `isStatement` parameter).

pp$1.parseFunction = function(node, isStatement, allowExpressionBody, isAsync) {
  this.initFunction(node);
  if (this.options.ecmaVersion >= 9 || this.options.ecmaVersion >= 6 && !isAsync)
    { node.generator = this.eat(types.star); }
  if (this.options.ecmaVersion >= 8)
    { node.async = !!isAsync; }

  if (isStatement) {
    node.id = isStatement === "nullableID" && this.type !== types.name ? null : this.parseIdent();
    if (node.id) {
      this.checkLVal(node.id, "var");
    }
  }

  var oldInGen = this.inGenerator, oldInAsync = this.inAsync,
      oldYieldPos = this.yieldPos, oldAwaitPos = this.awaitPos, oldInFunc = this.inFunction;
  this.inGenerator = node.generator;
  this.inAsync = node.async;
  this.yieldPos = 0;
  this.awaitPos = 0;
  this.inFunction = true;
  this.enterFunctionScope();

  if (!isStatement)
    { node.id = this.type === types.name ? this.parseIdent() : null; }

  this.parseFunctionParams(node);
  this.parseFunctionBody(node, allowExpressionBody);

  this.inGenerator = oldInGen;
  this.inAsync = oldInAsync;
  this.yieldPos = oldYieldPos;
  this.awaitPos = oldAwaitPos;
  this.inFunction = oldInFunc;
  return this.finishNode(node, isStatement ? "FunctionDeclaration" : "FunctionExpression")
};

pp$1.parseFunctionParams = function(node) {
  this.expect(types.parenL);
  node.params = this.parseBindingList(types.parenR, false, this.options.ecmaVersion >= 8);
  this.checkYieldAwaitInDefaultParams();
};

// Parse a class declaration or literal (depending on the
// `isStatement` parameter).

pp$1.parseClass = function(node, isStatement) {
  var this$1 = this;

  this.next();

  this.parseClassId(node, isStatement);
  this.parseClassSuper(node);
  var classBody = this.startNode();
  var hadConstructor = false;
  classBody.body = [];
  this.expect(types.braceL);
  while (!this.eat(types.braceR)) {
    var member = this$1.parseClassMember(classBody);
    if (member && member.type === "MethodDefinition" && member.kind === "constructor") {
      if (hadConstructor) { this$1.raise(member.start, "Duplicate constructor in the same class"); }
      hadConstructor = true;
    }
  }
  node.body = this.finishNode(classBody, "ClassBody");
  return this.finishNode(node, isStatement ? "ClassDeclaration" : "ClassExpression")
};

pp$1.parseClassMember = function(classBody) {
  var this$1 = this;

  if (this.eat(types.semi)) { return null }

  var method = this.startNode();
  var tryContextual = function (k, noLineBreak) {
    if ( noLineBreak === void 0 ) noLineBreak = false;

    var start = this$1.start, startLoc = this$1.startLoc;
    if (!this$1.eatContextual(k)) { return false }
    if (this$1.type !== types.parenL && (!noLineBreak || !this$1.canInsertSemicolon())) { return true }
    if (method.key) { this$1.unexpected(); }
    method.computed = false;
    method.key = this$1.startNodeAt(start, startLoc);
    method.key.name = k;
    this$1.finishNode(method.key, "Identifier");
    return false
  };

  method.kind = "method";
  method.static = tryContextual("static");
  var isGenerator = this.eat(types.star);
  var isAsync = false;
  if (!isGenerator) {
    if (this.options.ecmaVersion >= 8 && tryContextual("async", true)) {
      isAsync = true;
      isGenerator = this.options.ecmaVersion >= 9 && this.eat(types.star);
    } else if (tryContextual("get")) {
      method.kind = "get";
    } else if (tryContextual("set")) {
      method.kind = "set";
    }
  }
  if (!method.key) { this.parsePropertyName(method); }
  var key = method.key;
  if (!method.computed && !method.static && (key.type === "Identifier" && key.name === "constructor" ||
      key.type === "Literal" && key.value === "constructor")) {
    if (method.kind !== "method") { this.raise(key.start, "Constructor can't have get/set modifier"); }
    if (isGenerator) { this.raise(key.start, "Constructor can't be a generator"); }
    if (isAsync) { this.raise(key.start, "Constructor can't be an async method"); }
    method.kind = "constructor";
  } else if (method.static && key.type === "Identifier" && key.name === "prototype") {
    this.raise(key.start, "Classes may not have a static property named prototype");
  }
  this.parseClassMethod(classBody, method, isGenerator, isAsync);
  if (method.kind === "get" && method.value.params.length !== 0)
    { this.raiseRecoverable(method.value.start, "getter should have no params"); }
  if (method.kind === "set" && method.value.params.length !== 1)
    { this.raiseRecoverable(method.value.start, "setter should have exactly one param"); }
  if (method.kind === "set" && method.value.params[0].type === "RestElement")
    { this.raiseRecoverable(method.value.params[0].start, "Setter cannot use rest params"); }
  return method
};

pp$1.parseClassMethod = function(classBody, method, isGenerator, isAsync) {
  method.value = this.parseMethod(isGenerator, isAsync);
  classBody.body.push(this.finishNode(method, "MethodDefinition"));
};

pp$1.parseClassId = function(node, isStatement) {
  node.id = this.type === types.name ? this.parseIdent() : isStatement === true ? this.unexpected() : null;
};

pp$1.parseClassSuper = function(node) {
  node.superClass = this.eat(types._extends) ? this.parseExprSubscripts() : null;
};

// Parses module export declaration.

pp$1.parseExport = function(node, exports) {
  var this$1 = this;

  this.next();
  // export * from '...'
  if (this.eat(types.star)) {
    this.expectContextual("from");
    if (this.type !== types.string) { this.unexpected(); }
    node.source = this.parseExprAtom();
    this.semicolon();
    return this.finishNode(node, "ExportAllDeclaration")
  }
  if (this.eat(types._default)) { // export default ...
    this.checkExport(exports, "default", this.lastTokStart);
    var isAsync;
    if (this.type === types._function || (isAsync = this.isAsyncFunction())) {
      var fNode = this.startNode();
      this.next();
      if (isAsync) { this.next(); }
      node.declaration = this.parseFunction(fNode, "nullableID", false, isAsync);
    } else if (this.type === types._class) {
      var cNode = this.startNode();
      node.declaration = this.parseClass(cNode, "nullableID");
    } else {
      node.declaration = this.parseMaybeAssign();
      this.semicolon();
    }
    return this.finishNode(node, "ExportDefaultDeclaration")
  }
  // export var|const|let|function|class ...
  if (this.shouldParseExportStatement()) {
    node.declaration = this.parseStatement(true);
    if (node.declaration.type === "VariableDeclaration")
      { this.checkVariableExport(exports, node.declaration.declarations); }
    else
      { this.checkExport(exports, node.declaration.id.name, node.declaration.id.start); }
    node.specifiers = [];
    node.source = null;
  } else { // export { x, y as z } [from '...']
    node.declaration = null;
    node.specifiers = this.parseExportSpecifiers(exports);
    if (this.eatContextual("from")) {
      if (this.type !== types.string) { this.unexpected(); }
      node.source = this.parseExprAtom();
    } else {
      // check for keywords used as local names
      for (var i = 0, list = node.specifiers; i < list.length; i += 1) {
        var spec = list[i];

        this$1.checkUnreserved(spec.local);
      }

      node.source = null;
    }
    this.semicolon();
  }
  return this.finishNode(node, "ExportNamedDeclaration")
};

pp$1.checkExport = function(exports, name, pos) {
  if (!exports) { return }
  if (has(exports, name))
    { this.raiseRecoverable(pos, "Duplicate export '" + name + "'"); }
  exports[name] = true;
};

pp$1.checkPatternExport = function(exports, pat) {
  var this$1 = this;

  var type = pat.type;
  if (type === "Identifier")
    { this.checkExport(exports, pat.name, pat.start); }
  else if (type === "ObjectPattern")
    { for (var i = 0, list = pat.properties; i < list.length; i += 1)
      {
        var prop = list[i];

        this$1.checkPatternExport(exports, prop);
      } }
  else if (type === "ArrayPattern")
    { for (var i$1 = 0, list$1 = pat.elements; i$1 < list$1.length; i$1 += 1) {
      var elt = list$1[i$1];

        if (elt) { this$1.checkPatternExport(exports, elt); }
    } }
  else if (type === "Property")
    { this.checkPatternExport(exports, pat.value); }
  else if (type === "AssignmentPattern")
    { this.checkPatternExport(exports, pat.left); }
  else if (type === "RestElement")
    { this.checkPatternExport(exports, pat.argument); }
  else if (type === "ParenthesizedExpression")
    { this.checkPatternExport(exports, pat.expression); }
};

pp$1.checkVariableExport = function(exports, decls) {
  var this$1 = this;

  if (!exports) { return }
  for (var i = 0, list = decls; i < list.length; i += 1)
    {
    var decl = list[i];

    this$1.checkPatternExport(exports, decl.id);
  }
};

pp$1.shouldParseExportStatement = function() {
  return this.type.keyword === "var" ||
    this.type.keyword === "const" ||
    this.type.keyword === "class" ||
    this.type.keyword === "function" ||
    this.isLet() ||
    this.isAsyncFunction()
};

// Parses a comma-separated list of module exports.

pp$1.parseExportSpecifiers = function(exports) {
  var this$1 = this;

  var nodes = [], first = true;
  // export { x, y as z } [from '...']
  this.expect(types.braceL);
  while (!this.eat(types.braceR)) {
    if (!first) {
      this$1.expect(types.comma);
      if (this$1.afterTrailingComma(types.braceR)) { break }
    } else { first = false; }

    var node = this$1.startNode();
    node.local = this$1.parseIdent(true);
    node.exported = this$1.eatContextual("as") ? this$1.parseIdent(true) : node.local;
    this$1.checkExport(exports, node.exported.name, node.exported.start);
    nodes.push(this$1.finishNode(node, "ExportSpecifier"));
  }
  return nodes
};

// Parses import declaration.

pp$1.parseImport = function(node) {
  this.next();
  // import '...'
  if (this.type === types.string) {
    node.specifiers = empty;
    node.source = this.parseExprAtom();
  } else {
    node.specifiers = this.parseImportSpecifiers();
    this.expectContextual("from");
    node.source = this.type === types.string ? this.parseExprAtom() : this.unexpected();
  }
  this.semicolon();
  return this.finishNode(node, "ImportDeclaration")
};

// Parses a comma-separated list of module imports.

pp$1.parseImportSpecifiers = function() {
  var this$1 = this;

  var nodes = [], first = true;
  if (this.type === types.name) {
    // import defaultObj, { x, y as z } from '...'
    var node = this.startNode();
    node.local = this.parseIdent();
    this.checkLVal(node.local, "let");
    nodes.push(this.finishNode(node, "ImportDefaultSpecifier"));
    if (!this.eat(types.comma)) { return nodes }
  }
  if (this.type === types.star) {
    var node$1 = this.startNode();
    this.next();
    this.expectContextual("as");
    node$1.local = this.parseIdent();
    this.checkLVal(node$1.local, "let");
    nodes.push(this.finishNode(node$1, "ImportNamespaceSpecifier"));
    return nodes
  }
  this.expect(types.braceL);
  while (!this.eat(types.braceR)) {
    if (!first) {
      this$1.expect(types.comma);
      if (this$1.afterTrailingComma(types.braceR)) { break }
    } else { first = false; }

    var node$2 = this$1.startNode();
    node$2.imported = this$1.parseIdent(true);
    if (this$1.eatContextual("as")) {
      node$2.local = this$1.parseIdent();
    } else {
      this$1.checkUnreserved(node$2.imported);
      node$2.local = node$2.imported;
    }
    this$1.checkLVal(node$2.local, "let");
    nodes.push(this$1.finishNode(node$2, "ImportSpecifier"));
  }
  return nodes
};

// Set `ExpressionStatement#directive` property for directive prologues.
pp$1.adaptDirectivePrologue = function(statements) {
  for (var i = 0; i < statements.length && this.isDirectiveCandidate(statements[i]); ++i) {
    statements[i].directive = statements[i].expression.raw.slice(1, -1);
  }
};
pp$1.isDirectiveCandidate = function(statement) {
  return (
    statement.type === "ExpressionStatement" &&
    statement.expression.type === "Literal" &&
    typeof statement.expression.value === "string" &&
    // Reject parenthesized strings.
    (this.input[statement.start] === "\"" || this.input[statement.start] === "'")
  )
};

var pp$2 = Parser.prototype;

// Convert existing expression atom to assignable pattern
// if possible.

pp$2.toAssignable = function(node, isBinding, refDestructuringErrors) {
  var this$1 = this;

  if (this.options.ecmaVersion >= 6 && node) {
    switch (node.type) {
    case "Identifier":
      if (this.inAsync && node.name === "await")
        { this.raise(node.start, "Can not use 'await' as identifier inside an async function"); }
      break

    case "ObjectPattern":
    case "ArrayPattern":
    case "RestElement":
      break

    case "ObjectExpression":
      node.type = "ObjectPattern";
      if (refDestructuringErrors) { this.checkPatternErrors(refDestructuringErrors, true); }
      for (var i = 0, list = node.properties; i < list.length; i += 1) {
        var prop = list[i];

      this$1.toAssignable(prop, isBinding);
        // Early error:
        //   AssignmentRestProperty[Yield, Await] :
        //     `...` DestructuringAssignmentTarget[Yield, Await]
        //
        //   It is a Syntax Error if |DestructuringAssignmentTarget| is an |ArrayLiteral| or an |ObjectLiteral|.
        if (
          prop.type === "RestElement" &&
          (prop.argument.type === "ArrayPattern" || prop.argument.type === "ObjectPattern")
        ) {
          this$1.raise(prop.argument.start, "Unexpected token");
        }
      }
      break

    case "Property":
      // AssignmentProperty has type === "Property"
      if (node.kind !== "init") { this.raise(node.key.start, "Object pattern can't contain getter or setter"); }
      this.toAssignable(node.value, isBinding);
      break

    case "ArrayExpression":
      node.type = "ArrayPattern";
      if (refDestructuringErrors) { this.checkPatternErrors(refDestructuringErrors, true); }
      this.toAssignableList(node.elements, isBinding);
      break

    case "SpreadElement":
      node.type = "RestElement";
      this.toAssignable(node.argument, isBinding);
      if (node.argument.type === "AssignmentPattern")
        { this.raise(node.argument.start, "Rest elements cannot have a default value"); }
      break

    case "AssignmentExpression":
      if (node.operator !== "=") { this.raise(node.left.end, "Only '=' operator can be used for specifying default value."); }
      node.type = "AssignmentPattern";
      delete node.operator;
      this.toAssignable(node.left, isBinding);
      // falls through to AssignmentPattern

    case "AssignmentPattern":
      break

    case "ParenthesizedExpression":
      this.toAssignable(node.expression, isBinding);
      break

    case "MemberExpression":
      if (!isBinding) { break }

    default:
      this.raise(node.start, "Assigning to rvalue");
    }
  } else if (refDestructuringErrors) { this.checkPatternErrors(refDestructuringErrors, true); }
  return node
};

// Convert list of expression atoms to binding list.

pp$2.toAssignableList = function(exprList, isBinding) {
  var this$1 = this;

  var end = exprList.length;
  for (var i = 0; i < end; i++) {
    var elt = exprList[i];
    if (elt) { this$1.toAssignable(elt, isBinding); }
  }
  if (end) {
    var last = exprList[end - 1];
    if (this.options.ecmaVersion === 6 && isBinding && last && last.type === "RestElement" && last.argument.type !== "Identifier")
      { this.unexpected(last.argument.start); }
  }
  return exprList
};

// Parses spread element.

pp$2.parseSpread = function(refDestructuringErrors) {
  var node = this.startNode();
  this.next();
  node.argument = this.parseMaybeAssign(false, refDestructuringErrors);
  return this.finishNode(node, "SpreadElement")
};

pp$2.parseRestBinding = function() {
  var node = this.startNode();
  this.next();

  // RestElement inside of a function parameter must be an identifier
  if (this.options.ecmaVersion === 6 && this.type !== types.name)
    { this.unexpected(); }

  node.argument = this.parseBindingAtom();

  return this.finishNode(node, "RestElement")
};

// Parses lvalue (assignable) atom.

pp$2.parseBindingAtom = function() {
  if (this.options.ecmaVersion >= 6) {
    switch (this.type) {
    case types.bracketL:
      var node = this.startNode();
      this.next();
      node.elements = this.parseBindingList(types.bracketR, true, true);
      return this.finishNode(node, "ArrayPattern")

    case types.braceL:
      return this.parseObj(true)
    }
  }
  return this.parseIdent()
};

pp$2.parseBindingList = function(close, allowEmpty, allowTrailingComma) {
  var this$1 = this;

  var elts = [], first = true;
  while (!this.eat(close)) {
    if (first) { first = false; }
    else { this$1.expect(types.comma); }
    if (allowEmpty && this$1.type === types.comma) {
      elts.push(null);
    } else if (allowTrailingComma && this$1.afterTrailingComma(close)) {
      break
    } else if (this$1.type === types.ellipsis) {
      var rest = this$1.parseRestBinding();
      this$1.parseBindingListItem(rest);
      elts.push(rest);
      if (this$1.type === types.comma) { this$1.raise(this$1.start, "Comma is not permitted after the rest element"); }
      this$1.expect(close);
      break
    } else {
      var elem = this$1.parseMaybeDefault(this$1.start, this$1.startLoc);
      this$1.parseBindingListItem(elem);
      elts.push(elem);
    }
  }
  return elts
};

pp$2.parseBindingListItem = function(param) {
  return param
};

// Parses assignment pattern around given atom if possible.

pp$2.parseMaybeDefault = function(startPos, startLoc, left) {
  left = left || this.parseBindingAtom();
  if (this.options.ecmaVersion < 6 || !this.eat(types.eq)) { return left }
  var node = this.startNodeAt(startPos, startLoc);
  node.left = left;
  node.right = this.parseMaybeAssign();
  return this.finishNode(node, "AssignmentPattern")
};

// Verify that a node is an lval ΓÇö something that can be assigned
// to.
// bindingType can be either:
// 'var' indicating that the lval creates a 'var' binding
// 'let' indicating that the lval creates a lexical ('let' or 'const') binding
// 'none' indicating that the binding should be checked for illegal identifiers, but not for duplicate references

pp$2.checkLVal = function(expr, bindingType, checkClashes) {
  var this$1 = this;

  switch (expr.type) {
  case "Identifier":
    if (this.strict && this.reservedWordsStrictBind.test(expr.name))
      { this.raiseRecoverable(expr.start, (bindingType ? "Binding " : "Assigning to ") + expr.name + " in strict mode"); }
    if (checkClashes) {
      if (has(checkClashes, expr.name))
        { this.raiseRecoverable(expr.start, "Argument name clash"); }
      checkClashes[expr.name] = true;
    }
    if (bindingType && bindingType !== "none") {
      if (
        bindingType === "var" && !this.canDeclareVarName(expr.name) ||
        bindingType !== "var" && !this.canDeclareLexicalName(expr.name)
      ) {
        this.raiseRecoverable(expr.start, ("Identifier '" + (expr.name) + "' has already been declared"));
      }
      if (bindingType === "var") {
        this.declareVarName(expr.name);
      } else {
        this.declareLexicalName(expr.name);
      }
    }
    break

  case "MemberExpression":
    if (bindingType) { this.raiseRecoverable(expr.start, "Binding member expression"); }
    break

  case "ObjectPattern":
    for (var i = 0, list = expr.properties; i < list.length; i += 1)
      {
    var prop = list[i];

    this$1.checkLVal(prop, bindingType, checkClashes);
  }
    break

  case "Property":
    // AssignmentProperty has type === "Property"
    this.checkLVal(expr.value, bindingType, checkClashes);
    break

  case "ArrayPattern":
    for (var i$1 = 0, list$1 = expr.elements; i$1 < list$1.length; i$1 += 1) {
      var elem = list$1[i$1];

    if (elem) { this$1.checkLVal(elem, bindingType, checkClashes); }
    }
    break

  case "AssignmentPattern":
    this.checkLVal(expr.left, bindingType, checkClashes);
    break

  case "RestElement":
    this.checkLVal(expr.argument, bindingType, checkClashes);
    break

  case "ParenthesizedExpression":
    this.checkLVal(expr.expression, bindingType, checkClashes);
    break

  default:
    this.raise(expr.start, (bindingType ? "Binding" : "Assigning to") + " rvalue");
  }
};

// A recursive descent parser operates by defining functions for all
// syntactic elements, and recursively calling those, each function
// advancing the input stream and returning an AST node. Precedence
// of constructs (for example, the fact that `!x[1]` means `!(x[1])`
// instead of `(!x)[1]` is handled by the fact that the parser
// function that parses unary prefix operators is called first, and
// in turn calls the function that parses `[]` subscripts ΓÇö that
// way, it'll receive the node for `x[1]` already parsed, and wraps
// *that* in the unary operator node.
//
// Acorn uses an [operator precedence parser][opp] to handle binary
// operator precedence, because it is much more compact than using
// the technique outlined above, which uses different, nesting
// functions to specify precedence, for all of the ten binary
// precedence levels that JavaScript defines.
//
// [opp]: http://en.wikipedia.org/wiki/Operator-precedence_parser

var pp$3 = Parser.prototype;

// Check if property name clashes with already added.
// Object/class getters and setters are not allowed to clash ΓÇö
// either with each other or with an init property ΓÇö and in
// strict mode, init properties are also not allowed to be repeated.

pp$3.checkPropClash = function(prop, propHash, refDestructuringErrors) {
  if (this.options.ecmaVersion >= 9 && prop.type === "SpreadElement")
    { return }
  if (this.options.ecmaVersion >= 6 && (prop.computed || prop.method || prop.shorthand))
    { return }
  var key = prop.key;
  var name;
  switch (key.type) {
  case "Identifier": name = key.name; break
  case "Literal": name = String(key.value); break
  default: return
  }
  var kind = prop.kind;
  if (this.options.ecmaVersion >= 6) {
    if (name === "__proto__" && kind === "init") {
      if (propHash.proto) {
        if (refDestructuringErrors && refDestructuringErrors.doubleProto < 0) { refDestructuringErrors.doubleProto = key.start; }
        // Backwards-compat kludge. Can be removed in version 6.0
        else { this.raiseRecoverable(key.start, "Redefinition of __proto__ property"); }
      }
      propHash.proto = true;
    }
    return
  }
  name = "$" + name;
  var other = propHash[name];
  if (other) {
    var redefinition;
    if (kind === "init") {
      redefinition = this.strict && other.init || other.get || other.set;
    } else {
      redefinition = other.init || other[kind];
    }
    if (redefinition)
      { this.raiseRecoverable(key.start, "Redefinition of property"); }
  } else {
    other = propHash[name] = {
      init: false,
      get: false,
      set: false
    };
  }
  other[kind] = true;
};

// ### Expression parsing

// These nest, from the most general expression type at the top to
// 'atomic', nondivisible expression types at the bottom. Most of
// the functions will simply let the function(s) below them parse,
// and, *if* the syntactic construct they handle is present, wrap
// the AST node that the inner parser gave them in another node.

// Parse a full expression. The optional arguments are used to
// forbid the `in` operator (in for loops initalization expressions)
// and provide reference for storing '=' operator inside shorthand
// property assignment in contexts where both object expression
// and object pattern might appear (so it's possible to raise
// delayed syntax error at correct position).

pp$3.parseExpression = function(noIn, refDestructuringErrors) {
  var this$1 = this;

  var startPos = this.start, startLoc = this.startLoc;
  var expr = this.parseMaybeAssign(noIn, refDestructuringErrors);
  if (this.type === types.comma) {
    var node = this.startNodeAt(startPos, startLoc);
    node.expressions = [expr];
    while (this.eat(types.comma)) { node.expressions.push(this$1.parseMaybeAssign(noIn, refDestructuringErrors)); }
    return this.finishNode(node, "SequenceExpression")
  }
  return expr
};

// Parse an assignment expression. This includes applications of
// operators like `+=`.

pp$3.parseMaybeAssign = function(noIn, refDestructuringErrors, afterLeftParse) {
  if (this.inGenerator && this.isContextual("yield")) { return this.parseYield() }

  var ownDestructuringErrors = false, oldParenAssign = -1, oldTrailingComma = -1;
  if (refDestructuringErrors) {
    oldParenAssign = refDestructuringErrors.parenthesizedAssign;
    oldTrailingComma = refDestructuringErrors.trailingComma;
    refDestructuringErrors.parenthesizedAssign = refDestructuringErrors.trailingComma = -1;
  } else {
    refDestructuringErrors = new DestructuringErrors;
    ownDestructuringErrors = true;
  }

  var startPos = this.start, startLoc = this.startLoc;
  if (this.type === types.parenL || this.type === types.name)
    { this.potentialArrowAt = this.start; }
  var left = this.parseMaybeConditional(noIn, refDestructuringErrors);
  if (afterLeftParse) { left = afterLeftParse.call(this, left, startPos, startLoc); }
  if (this.type.isAssign) {
    var node = this.startNodeAt(startPos, startLoc);
    node.operator = this.value;
    node.left = this.type === types.eq ? this.toAssignable(left, false, refDestructuringErrors) : left;
    if (!ownDestructuringErrors) { DestructuringErrors.call(refDestructuringErrors); }
    refDestructuringErrors.shorthandAssign = -1; // reset because shorthand default was used correctly
    this.checkLVal(left);
    this.next();
    node.right = this.parseMaybeAssign(noIn);
    return this.finishNode(node, "AssignmentExpression")
  } else {
    if (ownDestructuringErrors) { this.checkExpressionErrors(refDestructuringErrors, true); }
  }
  if (oldParenAssign > -1) { refDestructuringErrors.parenthesizedAssign = oldParenAssign; }
  if (oldTrailingComma > -1) { refDestructuringErrors.trailingComma = oldTrailingComma; }
  return left
};

// Parse a ternary conditional (`?:`) operator.

pp$3.parseMaybeConditional = function(noIn, refDestructuringErrors) {
  var startPos = this.start, startLoc = this.startLoc;
  var expr = this.parseExprOps(noIn, refDestructuringErrors);
  if (this.checkExpressionErrors(refDestructuringErrors)) { return expr }
  if (this.eat(types.question)) {
    var node = this.startNodeAt(startPos, startLoc);
    node.test = expr;
    node.consequent = this.parseMaybeAssign();
    this.expect(types.colon);
    node.alternate = this.parseMaybeAssign(noIn);
    return this.finishNode(node, "ConditionalExpression")
  }
  return expr
};

// Start the precedence parser.

pp$3.parseExprOps = function(noIn, refDestructuringErrors) {
  var startPos = this.start, startLoc = this.startLoc;
  var expr = this.parseMaybeUnary(refDestructuringErrors, false);
  if (this.checkExpressionErrors(refDestructuringErrors)) { return expr }
  return expr.start === startPos && expr.type === "ArrowFunctionExpression" ? expr : this.parseExprOp(expr, startPos, startLoc, -1, noIn)
};

// Parse binary operators with the operator precedence parsing
// algorithm. `left` is the left-hand side of the operator.
// `minPrec` provides context that allows the function to stop and
// defer further parser to one of its callers when it encounters an
// operator that has a lower precedence than the set it is parsing.

pp$3.parseExprOp = function(left, leftStartPos, leftStartLoc, minPrec, noIn) {
  var prec = this.type.binop;
  if (prec != null && (!noIn || this.type !== types._in)) {
    if (prec > minPrec) {
      var logical = this.type === types.logicalOR || this.type === types.logicalAND;
      var op = this.value;
      this.next();
      var startPos = this.start, startLoc = this.startLoc;
      var right = this.parseExprOp(this.parseMaybeUnary(null, false), startPos, startLoc, prec, noIn);
      var node = this.buildBinary(leftStartPos, leftStartLoc, left, right, op, logical);
      return this.parseExprOp(node, leftStartPos, leftStartLoc, minPrec, noIn)
    }
  }
  return left
};

pp$3.buildBinary = function(startPos, startLoc, left, right, op, logical) {
  var node = this.startNodeAt(startPos, startLoc);
  node.left = left;
  node.operator = op;
  node.right = right;
  return this.finishNode(node, logical ? "LogicalExpression" : "BinaryExpression")
};

// Parse unary operators, both prefix and postfix.

pp$3.parseMaybeUnary = function(refDestructuringErrors, sawUnary) {
  var this$1 = this;

  var startPos = this.start, startLoc = this.startLoc, expr;
  if (this.isContextual("await") && (this.inAsync || (!this.inFunction && this.options.allowAwaitOutsideFunction))) {
    expr = this.parseAwait();
    sawUnary = true;
  } else if (this.type.prefix) {
    var node = this.startNode(), update = this.type === types.incDec;
    node.operator = this.value;
    node.prefix = true;
    this.next();
    node.argument = this.parseMaybeUnary(null, true);
    this.checkExpressionErrors(refDestructuringErrors, true);
    if (update) { this.checkLVal(node.argument); }
    else if (this.strict && node.operator === "delete" &&
             node.argument.type === "Identifier")
      { this.raiseRecoverable(node.start, "Deleting local variable in strict mode"); }
    else { sawUnary = true; }
    expr = this.finishNode(node, update ? "UpdateExpression" : "UnaryExpression");
  } else {
    expr = this.parseExprSubscripts(refDestructuringErrors);
    if (this.checkExpressionErrors(refDestructuringErrors)) { return expr }
    while (this.type.postfix && !this.canInsertSemicolon()) {
      var node$1 = this$1.startNodeAt(startPos, startLoc);
      node$1.operator = this$1.value;
      node$1.prefix = false;
      node$1.argument = expr;
      this$1.checkLVal(expr);
      this$1.next();
      expr = this$1.finishNode(node$1, "UpdateExpression");
    }
  }

  if (!sawUnary && this.eat(types.starstar))
    { return this.buildBinary(startPos, startLoc, expr, this.parseMaybeUnary(null, false), "**", false) }
  else
    { return expr }
};

// Parse call, dot, and `[]`-subscript expressions.

pp$3.parseExprSubscripts = function(refDestructuringErrors) {
  var startPos = this.start, startLoc = this.startLoc;
  var expr = this.parseExprAtom(refDestructuringErrors);
  var skipArrowSubscripts = expr.type === "ArrowFunctionExpression" && this.input.slice(this.lastTokStart, this.lastTokEnd) !== ")";
  if (this.checkExpressionErrors(refDestructuringErrors) || skipArrowSubscripts) { return expr }
  var result = this.parseSubscripts(expr, startPos, startLoc);
  if (refDestructuringErrors && result.type === "MemberExpression") {
    if (refDestructuringErrors.parenthesizedAssign >= result.start) { refDestructuringErrors.parenthesizedAssign = -1; }
    if (refDestructuringErrors.parenthesizedBind >= result.start) { refDestructuringErrors.parenthesizedBind = -1; }
  }
  return result
};

pp$3.parseSubscripts = function(base, startPos, startLoc, noCalls) {
  var this$1 = this;

  var maybeAsyncArrow = this.options.ecmaVersion >= 8 && base.type === "Identifier" && base.name === "async" &&
      this.lastTokEnd === base.end && !this.canInsertSemicolon() && this.input.slice(base.start, base.end) === "async";
  for (var computed = (void 0);;) {
    if ((computed = this$1.eat(types.bracketL)) || this$1.eat(types.dot)) {
      var node = this$1.startNodeAt(startPos, startLoc);
      node.object = base;
      node.property = computed ? this$1.parseExpression() : this$1.parseIdent(true);
      node.computed = !!computed;
      if (computed) { this$1.expect(types.bracketR); }
      base = this$1.finishNode(node, "MemberExpression");
    } else if (!noCalls && this$1.eat(types.parenL)) {
      var refDestructuringErrors = new DestructuringErrors, oldYieldPos = this$1.yieldPos, oldAwaitPos = this$1.awaitPos;
      this$1.yieldPos = 0;
      this$1.awaitPos = 0;
      var exprList = this$1.parseExprList(types.parenR, this$1.options.ecmaVersion >= 8, false, refDestructuringErrors);
      if (maybeAsyncArrow && !this$1.canInsertSemicolon() && this$1.eat(types.arrow)) {
        this$1.checkPatternErrors(refDestructuringErrors, false);
        this$1.checkYieldAwaitInDefaultParams();
        this$1.yieldPos = oldYieldPos;
        this$1.awaitPos = oldAwaitPos;
        return this$1.parseArrowExpression(this$1.startNodeAt(startPos, startLoc), exprList, true)
      }
      this$1.checkExpressionErrors(refDestructuringErrors, true);
      this$1.yieldPos = oldYieldPos || this$1.yieldPos;
      this$1.awaitPos = oldAwaitPos || this$1.awaitPos;
      var node$1 = this$1.startNodeAt(startPos, startLoc);
      node$1.callee = base;
      node$1.arguments = exprList;
      base = this$1.finishNode(node$1, "CallExpression");
    } else if (this$1.type === types.backQuote) {
      var node$2 = this$1.startNodeAt(startPos, startLoc);
      node$2.tag = base;
      node$2.quasi = this$1.parseTemplate({isTagged: true});
      base = this$1.finishNode(node$2, "TaggedTemplateExpression");
    } else {
      return base
    }
  }
};

// Parse an atomic expression ΓÇö either a single token that is an
// expression, an expression started by a keyword like `function` or
// `new`, or an expression wrapped in punctuation like `()`, `[]`,
// or `{}`.

pp$3.parseExprAtom = function(refDestructuringErrors) {
  var node, canBeArrow = this.potentialArrowAt === this.start;
  switch (this.type) {
  case types._super:
    if (!this.inFunction)
      { this.raise(this.start, "'super' outside of function or class"); }
    node = this.startNode();
    this.next();
    // The `super` keyword can appear at below:
    // SuperProperty:
    //     super [ Expression ]
    //     super . IdentifierName
    // SuperCall:
    //     super Arguments
    if (this.type !== types.dot && this.type !== types.bracketL && this.type !== types.parenL)
      { this.unexpected(); }
    return this.finishNode(node, "Super")

  case types._this:
    node = this.startNode();
    this.next();
    return this.finishNode(node, "ThisExpression")

  case types.name:
    var startPos = this.start, startLoc = this.startLoc, containsEsc = this.containsEsc;
    var id = this.parseIdent(this.type !== types.name);
    if (this.options.ecmaVersion >= 8 && !containsEsc && id.name === "async" && !this.canInsertSemicolon() && this.eat(types._function))
      { return this.parseFunction(this.startNodeAt(startPos, startLoc), false, false, true) }
    if (canBeArrow && !this.canInsertSemicolon()) {
      if (this.eat(types.arrow))
        { return this.parseArrowExpression(this.startNodeAt(startPos, startLoc), [id], false) }
      if (this.options.ecmaVersion >= 8 && id.name === "async" && this.type === types.name && !containsEsc) {
        id = this.parseIdent();
        if (this.canInsertSemicolon() || !this.eat(types.arrow))
          { this.unexpected(); }
        return this.parseArrowExpression(this.startNodeAt(startPos, startLoc), [id], true)
      }
    }
    return id

  case types.regexp:
    var value = this.value;
    node = this.parseLiteral(value.value);
    node.regex = {pattern: value.pattern, flags: value.flags};
    return node

  case types.num: case types.string:
    return this.parseLiteral(this.value)

  case types._null: case types._true: case types._false:
    node = this.startNode();
    node.value = this.type === types._null ? null : this.type === types._true;
    node.raw = this.type.keyword;
    this.next();
    return this.finishNode(node, "Literal")

  case types.parenL:
    var start = this.start, expr = this.parseParenAndDistinguishExpression(canBeArrow);
    if (refDestructuringErrors) {
      if (refDestructuringErrors.parenthesizedAssign < 0 && !this.isSimpleAssignTarget(expr))
        { refDestructuringErrors.parenthesizedAssign = start; }
      if (refDestructuringErrors.parenthesizedBind < 0)
        { refDestructuringErrors.parenthesizedBind = start; }
    }
    return expr

  case types.bracketL:
    node = this.startNode();
    this.next();
    node.elements = this.parseExprList(types.bracketR, true, true, refDestructuringErrors);
    return this.finishNode(node, "ArrayExpression")

  case types.braceL:
    return this.parseObj(false, refDestructuringErrors)

  case types._function:
    node = this.startNode();
    this.next();
    return this.parseFunction(node, false)

  case types._class:
    return this.parseClass(this.startNode(), false)

  case types._new:
    return this.parseNew()

  case types.backQuote:
    return this.parseTemplate()

  default:
    this.unexpected();
  }
};

pp$3.parseLiteral = function(value) {
  var node = this.startNode();
  node.value = value;
  node.raw = this.input.slice(this.start, this.end);
  this.next();
  return this.finishNode(node, "Literal")
};

pp$3.parseParenExpression = function() {
  this.expect(types.parenL);
  var val = this.parseExpression();
  this.expect(types.parenR);
  return val
};

pp$3.parseParenAndDistinguishExpression = function(canBeArrow) {
  var this$1 = this;

  var startPos = this.start, startLoc = this.startLoc, val, allowTrailingComma = this.options.ecmaVersion >= 8;
  if (this.options.ecmaVersion >= 6) {
    this.next();

    var innerStartPos = this.start, innerStartLoc = this.startLoc;
    var exprList = [], first = true, lastIsComma = false;
    var refDestructuringErrors = new DestructuringErrors, oldYieldPos = this.yieldPos, oldAwaitPos = this.awaitPos, spreadStart;
    this.yieldPos = 0;
    this.awaitPos = 0;
    while (this.type !== types.parenR) {
      first ? first = false : this$1.expect(types.comma);
      if (allowTrailingComma && this$1.afterTrailingComma(types.parenR, true)) {
        lastIsComma = true;
        break
      } else if (this$1.type === types.ellipsis) {
        spreadStart = this$1.start;
        exprList.push(this$1.parseParenItem(this$1.parseRestBinding()));
        if (this$1.type === types.comma) { this$1.raise(this$1.start, "Comma is not permitted after the rest element"); }
        break
      } else {
        exprList.push(this$1.parseMaybeAssign(false, refDestructuringErrors, this$1.parseParenItem));
      }
    }
    var innerEndPos = this.start, innerEndLoc = this.startLoc;
    this.expect(types.parenR);

    if (canBeArrow && !this.canInsertSemicolon() && this.eat(types.arrow)) {
      this.checkPatternErrors(refDestructuringErrors, false);
      this.checkYieldAwaitInDefaultParams();
      this.yieldPos = oldYieldPos;
      this.awaitPos = oldAwaitPos;
      return this.parseParenArrowList(startPos, startLoc, exprList)
    }

    if (!exprList.length || lastIsComma) { this.unexpected(this.lastTokStart); }
    if (spreadStart) { this.unexpected(spreadStart); }
    this.checkExpressionErrors(refDestructuringErrors, true);
    this.yieldPos = oldYieldPos || this.yieldPos;
    this.awaitPos = oldAwaitPos || this.awaitPos;

    if (exprList.length > 1) {
      val = this.startNodeAt(innerStartPos, innerStartLoc);
      val.expressions = exprList;
      this.finishNodeAt(val, "SequenceExpression", innerEndPos, innerEndLoc);
    } else {
      val = exprList[0];
    }
  } else {
    val = this.parseParenExpression();
  }

  if (this.options.preserveParens) {
    var par = this.startNodeAt(startPos, startLoc);
    par.expression = val;
    return this.finishNode(par, "ParenthesizedExpression")
  } else {
    return val
  }
};

pp$3.parseParenItem = function(item) {
  return item
};

pp$3.parseParenArrowList = function(startPos, startLoc, exprList) {
  return this.parseArrowExpression(this.startNodeAt(startPos, startLoc), exprList)
};

// New's precedence is slightly tricky. It must allow its argument to
// be a `[]` or dot subscript expression, but not a call ΓÇö at least,
// not without wrapping it in parentheses. Thus, it uses the noCalls
// argument to parseSubscripts to prevent it from consuming the
// argument list.

var empty$1 = [];

pp$3.parseNew = function() {
  var node = this.startNode();
  var meta = this.parseIdent(true);
  if (this.options.ecmaVersion >= 6 && this.eat(types.dot)) {
    node.meta = meta;
    var containsEsc = this.containsEsc;
    node.property = this.parseIdent(true);
    if (node.property.name !== "target" || containsEsc)
      { this.raiseRecoverable(node.property.start, "The only valid meta property for new is new.target"); }
    if (!this.inFunction)
      { this.raiseRecoverable(node.start, "new.target can only be used in functions"); }
    return this.finishNode(node, "MetaProperty")
  }
  var startPos = this.start, startLoc = this.startLoc;
  node.callee = this.parseSubscripts(this.parseExprAtom(), startPos, startLoc, true);
  if (this.eat(types.parenL)) { node.arguments = this.parseExprList(types.parenR, this.options.ecmaVersion >= 8, false); }
  else { node.arguments = empty$1; }
  return this.finishNode(node, "NewExpression")
};

// Parse template expression.

pp$3.parseTemplateElement = function(ref) {
  var isTagged = ref.isTagged;

  var elem = this.startNode();
  if (this.type === types.invalidTemplate) {
    if (!isTagged) {
      this.raiseRecoverable(this.start, "Bad escape sequence in untagged template literal");
    }
    elem.value = {
      raw: this.value,
      cooked: null
    };
  } else {
    elem.value = {
      raw: this.input.slice(this.start, this.end).replace(/\r\n?/g, "\n"),
      cooked: this.value
    };
  }
  this.next();
  elem.tail = this.type === types.backQuote;
  return this.finishNode(elem, "TemplateElement")
};

pp$3.parseTemplate = function(ref) {
  var this$1 = this;
  if ( ref === void 0 ) ref = {};
  var isTagged = ref.isTagged; if ( isTagged === void 0 ) isTagged = false;

  var node = this.startNode();
  this.next();
  node.expressions = [];
  var curElt = this.parseTemplateElement({isTagged: isTagged});
  node.quasis = [curElt];
  while (!curElt.tail) {
    this$1.expect(types.dollarBraceL);
    node.expressions.push(this$1.parseExpression());
    this$1.expect(types.braceR);
    node.quasis.push(curElt = this$1.parseTemplateElement({isTagged: isTagged}));
  }
  this.next();
  return this.finishNode(node, "TemplateLiteral")
};

pp$3.isAsyncProp = function(prop) {
  return !prop.computed && prop.key.type === "Identifier" && prop.key.name === "async" &&
    (this.type === types.name || this.type === types.num || this.type === types.string || this.type === types.bracketL || this.type.keyword || (this.options.ecmaVersion >= 9 && this.type === types.star)) &&
    !lineBreak.test(this.input.slice(this.lastTokEnd, this.start))
};

// Parse an object literal or binding pattern.

pp$3.parseObj = function(isPattern, refDestructuringErrors) {
  var this$1 = this;

  var node = this.startNode(), first = true, propHash = {};
  node.properties = [];
  this.next();
  while (!this.eat(types.braceR)) {
    if (!first) {
      this$1.expect(types.comma);
      if (this$1.afterTrailingComma(types.braceR)) { break }
    } else { first = false; }

    var prop = this$1.parseProperty(isPattern, refDestructuringErrors);
    if (!isPattern) { this$1.checkPropClash(prop, propHash, refDestructuringErrors); }
    node.properties.push(prop);
  }
  return this.finishNode(node, isPattern ? "ObjectPattern" : "ObjectExpression")
};

pp$3.parseProperty = function(isPattern, refDestructuringErrors) {
  var prop = this.startNode(), isGenerator, isAsync, startPos, startLoc;
  if (this.options.ecmaVersion >= 9 && this.eat(types.ellipsis)) {
    if (isPattern) {
      prop.argument = this.parseIdent(false);
      if (this.type === types.comma) {
        this.raise(this.start, "Comma is not permitted after the rest element");
      }
      return this.finishNode(prop, "RestElement")
    }
    // To disallow parenthesized identifier via `this.toAssignable()`.
    if (this.type === types.parenL && refDestructuringErrors) {
      if (refDestructuringErrors.parenthesizedAssign < 0) {
        refDestructuringErrors.parenthesizedAssign = this.start;
      }
      if (refDestructuringErrors.parenthesizedBind < 0) {
        refDestructuringErrors.parenthesizedBind = this.start;
      }
    }
    // Parse argument.
    prop.argument = this.parseMaybeAssign(false, refDestructuringErrors);
    // To disallow trailing comma via `this.toAssignable()`.
    if (this.type === types.comma && refDestructuringErrors && refDestructuringErrors.trailingComma < 0) {
      refDestructuringErrors.trailingComma = this.start;
    }
    // Finish
    return this.finishNode(prop, "SpreadElement")
  }
  if (this.options.ecmaVersion >= 6) {
    prop.method = false;
    prop.shorthand = false;
    if (isPattern || refDestructuringErrors) {
      startPos = this.start;
      startLoc = this.startLoc;
    }
    if (!isPattern)
      { isGenerator = this.eat(types.star); }
  }
  var containsEsc = this.containsEsc;
  this.parsePropertyName(prop);
  if (!isPattern && !containsEsc && this.options.ecmaVersion >= 8 && !isGenerator && this.isAsyncProp(prop)) {
    isAsync = true;
    isGenerator = this.options.ecmaVersion >= 9 && this.eat(types.star);
    this.parsePropertyName(prop, refDestructuringErrors);
  } else {
    isAsync = false;
  }
  this.parsePropertyValue(prop, isPattern, isGenerator, isAsync, startPos, startLoc, refDestructuringErrors, containsEsc);
  return this.finishNode(prop, "Property")
};

pp$3.parsePropertyValue = function(prop, isPattern, isGenerator, isAsync, startPos, startLoc, refDestructuringErrors, containsEsc) {
  if ((isGenerator || isAsync) && this.type === types.colon)
    { this.unexpected(); }

  if (this.eat(types.colon)) {
    prop.value = isPattern ? this.parseMaybeDefault(this.start, this.startLoc) : this.parseMaybeAssign(false, refDestructuringErrors);
    prop.kind = "init";
  } else if (this.options.ecmaVersion >= 6 && this.type === types.parenL) {
    if (isPattern) { this.unexpected(); }
    prop.kind = "init";
    prop.method = true;
    prop.value = this.parseMethod(isGenerator, isAsync);
  } else if (!isPattern && !containsEsc &&
             this.options.ecmaVersion >= 5 && !prop.computed && prop.key.type === "Identifier" &&
             (prop.key.name === "get" || prop.key.name === "set") &&
             (this.type !== types.comma && this.type !== types.braceR)) {
    if (isGenerator || isAsync) { this.unexpected(); }
    prop.kind = prop.key.name;
    this.parsePropertyName(prop);
    prop.value = this.parseMethod(false);
    var paramCount = prop.kind === "get" ? 0 : 1;
    if (prop.value.params.length !== paramCount) {
      var start = prop.value.start;
      if (prop.kind === "get")
        { this.raiseRecoverable(start, "getter should have no params"); }
      else
        { this.raiseRecoverable(start, "setter should have exactly one param"); }
    } else {
      if (prop.kind === "set" && prop.value.params[0].type === "RestElement")
        { this.raiseRecoverable(prop.value.params[0].start, "Setter cannot use rest params"); }
    }
  } else if (this.options.ecmaVersion >= 6 && !prop.computed && prop.key.type === "Identifier") {
    this.checkUnreserved(prop.key);
    prop.kind = "init";
    if (isPattern) {
      prop.value = this.parseMaybeDefault(startPos, startLoc, prop.key);
    } else if (this.type === types.eq && refDestructuringErrors) {
      if (refDestructuringErrors.shorthandAssign < 0)
        { refDestructuringErrors.shorthandAssign = this.start; }
      prop.value = this.parseMaybeDefault(startPos, startLoc, prop.key);
    } else {
      prop.value = prop.key;
    }
    prop.shorthand = true;
  } else { this.unexpected(); }
};

pp$3.parsePropertyName = function(prop) {
  if (this.options.ecmaVersion >= 6) {
    if (this.eat(types.bracketL)) {
      prop.computed = true;
      prop.key = this.parseMaybeAssign();
      this.expect(types.bracketR);
      return prop.key
    } else {
      prop.computed = false;
    }
  }
  return prop.key = this.type === types.num || this.type === types.string ? this.parseExprAtom() : this.parseIdent(true)
};

// Initialize empty function node.

pp$3.initFunction = function(node) {
  node.id = null;
  if (this.options.ecmaVersion >= 6) {
    node.generator = false;
    node.expression = false;
  }
  if (this.options.ecmaVersion >= 8)
    { node.async = false; }
};

// Parse object or class method.

pp$3.parseMethod = function(isGenerator, isAsync) {
  var node = this.startNode(), oldInGen = this.inGenerator, oldInAsync = this.inAsync,
      oldYieldPos = this.yieldPos, oldAwaitPos = this.awaitPos, oldInFunc = this.inFunction;

  this.initFunction(node);
  if (this.options.ecmaVersion >= 6)
    { node.generator = isGenerator; }
  if (this.options.ecmaVersion >= 8)
    { node.async = !!isAsync; }

  this.inGenerator = node.generator;
  this.inAsync = node.async;
  this.yieldPos = 0;
  this.awaitPos = 0;
  this.inFunction = true;
  this.enterFunctionScope();

  this.expect(types.parenL);
  node.params = this.parseBindingList(types.parenR, false, this.options.ecmaVersion >= 8);
  this.checkYieldAwaitInDefaultParams();
  this.parseFunctionBody(node, false);

  this.inGenerator = oldInGen;
  this.inAsync = oldInAsync;
  this.yieldPos = oldYieldPos;
  this.awaitPos = oldAwaitPos;
  this.inFunction = oldInFunc;
  return this.finishNode(node, "FunctionExpression")
};

// Parse arrow function expression with given parameters.

pp$3.parseArrowExpression = function(node, params, isAsync) {
  var oldInGen = this.inGenerator, oldInAsync = this.inAsync,
      oldYieldPos = this.yieldPos, oldAwaitPos = this.awaitPos, oldInFunc = this.inFunction;

  this.enterFunctionScope();
  this.initFunction(node);
  if (this.options.ecmaVersion >= 8)
    { node.async = !!isAsync; }

  this.inGenerator = false;
  this.inAsync = node.async;
  this.yieldPos = 0;
  this.awaitPos = 0;
  this.inFunction = true;

  node.params = this.toAssignableList(params, true);
  this.parseFunctionBody(node, true);

  this.inGenerator = oldInGen;
  this.inAsync = oldInAsync;
  this.yieldPos = oldYieldPos;
  this.awaitPos = oldAwaitPos;
  this.inFunction = oldInFunc;
  return this.finishNode(node, "ArrowFunctionExpression")
};

// Parse function body and check parameters.

pp$3.parseFunctionBody = function(node, isArrowFunction) {
  var isExpression = isArrowFunction && this.type !== types.braceL;
  var oldStrict = this.strict, useStrict = false;

  if (isExpression) {
    node.body = this.parseMaybeAssign();
    node.expression = true;
    this.checkParams(node, false);
  } else {
    var nonSimple = this.options.ecmaVersion >= 7 && !this.isSimpleParamList(node.params);
    if (!oldStrict || nonSimple) {
      useStrict = this.strictDirective(this.end);
      // If this is a strict mode function, verify that argument names
      // are not repeated, and it does not try to bind the words `eval`
      // or `arguments`.
      if (useStrict && nonSimple)
        { this.raiseRecoverable(node.start, "Illegal 'use strict' directive in function with non-simple parameter list"); }
    }
    // Start a new scope with regard to labels and the `inFunction`
    // flag (restore them to their old value afterwards).
    var oldLabels = this.labels;
    this.labels = [];
    if (useStrict) { this.strict = true; }

    // Add the params to varDeclaredNames to ensure that an error is thrown
    // if a let/const declaration in the function clashes with one of the params.
    this.checkParams(node, !oldStrict && !useStrict && !isArrowFunction && this.isSimpleParamList(node.params));
    node.body = this.parseBlock(false);
    node.expression = false;
    this.adaptDirectivePrologue(node.body.body);
    this.labels = oldLabels;
  }
  this.exitFunctionScope();

  if (this.strict && node.id) {
    // Ensure the function name isn't a forbidden identifier in strict mode, e.g. 'eval'
    this.checkLVal(node.id, "none");
  }
  this.strict = oldStrict;
};

pp$3.isSimpleParamList = function(params) {
  for (var i = 0, list = params; i < list.length; i += 1)
    {
    var param = list[i];

    if (param.type !== "Identifier") { return false
  } }
  return true
};

// Checks function params for various disallowed patterns such as using "eval"
// or "arguments" and duplicate parameters.

pp$3.checkParams = function(node, allowDuplicates) {
  var this$1 = this;

  var nameHash = {};
  for (var i = 0, list = node.params; i < list.length; i += 1)
    {
    var param = list[i];

    this$1.checkLVal(param, "var", allowDuplicates ? null : nameHash);
  }
};

// Parses a comma-separated list of expressions, and returns them as
// an array. `close` is the token type that ends the list, and
// `allowEmpty` can be turned on to allow subsequent commas with
// nothing in between them to be parsed as `null` (which is needed
// for array literals).

pp$3.parseExprList = function(close, allowTrailingComma, allowEmpty, refDestructuringErrors) {
  var this$1 = this;

  var elts = [], first = true;
  while (!this.eat(close)) {
    if (!first) {
      this$1.expect(types.comma);
      if (allowTrailingComma && this$1.afterTrailingComma(close)) { break }
    } else { first = false; }

    var elt = (void 0);
    if (allowEmpty && this$1.type === types.comma)
      { elt = null; }
    else if (this$1.type === types.ellipsis) {
      elt = this$1.parseSpread(refDestructuringErrors);
      if (refDestructuringErrors && this$1.type === types.comma && refDestructuringErrors.trailingComma < 0)
        { refDestructuringErrors.trailingComma = this$1.start; }
    } else {
      elt = this$1.parseMaybeAssign(false, refDestructuringErrors);
    }
    elts.push(elt);
  }
  return elts
};

pp$3.checkUnreserved = function(ref) {
  var start = ref.start;
  var end = ref.end;
  var name = ref.name;

  if (this.inGenerator && name === "yield")
    { this.raiseRecoverable(start, "Can not use 'yield' as identifier inside a generator"); }
  if (this.inAsync && name === "await")
    { this.raiseRecoverable(start, "Can not use 'await' as identifier inside an async function"); }
  if (this.isKeyword(name))
    { this.raise(start, ("Unexpected keyword '" + name + "'")); }
  if (this.options.ecmaVersion < 6 &&
    this.input.slice(start, end).indexOf("\\") !== -1) { return }
  var re = this.strict ? this.reservedWordsStrict : this.reservedWords;
  if (re.test(name)) {
    if (!this.inAsync && name === "await")
      { this.raiseRecoverable(start, "Can not use keyword 'await' outside an async function"); }
    this.raiseRecoverable(start, ("The keyword '" + name + "' is reserved"));
  }
};

// Parse the next token as an identifier. If `liberal` is true (used
// when parsing properties), it will also convert keywords into
// identifiers.

pp$3.parseIdent = function(liberal, isBinding) {
  var node = this.startNode();
  if (liberal && this.options.allowReserved === "never") { liberal = false; }
  if (this.type === types.name) {
    node.name = this.value;
  } else if (this.type.keyword) {
    node.name = this.type.keyword;

    // To fix https://github.com/acornjs/acorn/issues/575
    // `class` and `function` keywords push new context into this.context.
    // But there is no chance to pop the context if the keyword is consumed as an identifier such as a property name.
    // If the previous token is a dot, this does not apply because the context-managing code already ignored the keyword
    if ((node.name === "class" || node.name === "function") &&
        (this.lastTokEnd !== this.lastTokStart + 1 || this.input.charCodeAt(this.lastTokStart) !== 46)) {
      this.context.pop();
    }
  } else {
    this.unexpected();
  }
  this.next();
  this.finishNode(node, "Identifier");
  if (!liberal) { this.checkUnreserved(node); }
  return node
};

// Parses yield expression inside generator.

pp$3.parseYield = function() {
  if (!this.yieldPos) { this.yieldPos = this.start; }

  var node = this.startNode();
  this.next();
  if (this.type === types.semi || this.canInsertSemicolon() || (this.type !== types.star && !this.type.startsExpr)) {
    node.delegate = false;
    node.argument = null;
  } else {
    node.delegate = this.eat(types.star);
    node.argument = this.parseMaybeAssign();
  }
  return this.finishNode(node, "YieldExpression")
};

pp$3.parseAwait = function() {
  if (!this.awaitPos) { this.awaitPos = this.start; }

  var node = this.startNode();
  this.next();
  node.argument = this.parseMaybeUnary(null, true);
  return this.finishNode(node, "AwaitExpression")
};

var pp$4 = Parser.prototype;

// This function is used to raise exceptions on parse errors. It
// takes an offset integer (into the current `input`) to indicate
// the location of the error, attaches the position to the end
// of the error message, and then raises a `SyntaxError` with that
// message.

pp$4.raise = function(pos, message) {
  var loc = getLineInfo(this.input, pos);
  message += " (" + loc.line + ":" + loc.column + ")";
  var err = new SyntaxError(message);
  err.pos = pos; err.loc = loc; err.raisedAt = this.pos;
  throw err
};

pp$4.raiseRecoverable = pp$4.raise;

pp$4.curPosition = function() {
  if (this.options.locations) {
    return new Position(this.curLine, this.pos - this.lineStart)
  }
};

var pp$5 = Parser.prototype;

// Object.assign polyfill
var assign = Object.assign || function(target) {
  var sources = [], len = arguments.length - 1;
  while ( len-- > 0 ) sources[ len ] = arguments[ len + 1 ];

  for (var i = 0, list = sources; i < list.length; i += 1) {
    var source = list[i];

    for (var key in source) {
      if (has(source, key)) {
        target[key] = source[key];
      }
    }
  }
  return target
};

// The functions in this module keep track of declared variables in the current scope in order to detect duplicate variable names.

pp$5.enterFunctionScope = function() {
  // var: a hash of var-declared names in the current lexical scope
  // lexical: a hash of lexically-declared names in the current lexical scope
  // childVar: a hash of var-declared names in all child lexical scopes of the current lexical scope (within the current function scope)
  // parentLexical: a hash of lexically-declared names in all parent lexical scopes of the current lexical scope (within the current function scope)
  this.scopeStack.push({var: {}, lexical: {}, childVar: {}, parentLexical: {}});
};

pp$5.exitFunctionScope = function() {
  this.scopeStack.pop();
};

pp$5.enterLexicalScope = function() {
  var parentScope = this.scopeStack[this.scopeStack.length - 1];
  var childScope = {var: {}, lexical: {}, childVar: {}, parentLexical: {}};

  this.scopeStack.push(childScope);
  assign(childScope.parentLexical, parentScope.lexical, parentScope.parentLexical);
};

pp$5.exitLexicalScope = function() {
  var childScope = this.scopeStack.pop();
  var parentScope = this.scopeStack[this.scopeStack.length - 1];

  assign(parentScope.childVar, childScope.var, childScope.childVar);
};

/**
 * A name can be declared with `var` if there are no variables with the same name declared with `let`/`const`
 * in the current lexical scope or any of the parent lexical scopes in this function.
 */
pp$5.canDeclareVarName = function(name) {
  var currentScope = this.scopeStack[this.scopeStack.length - 1];

  return !has(currentScope.lexical, name) && !has(currentScope.parentLexical, name)
};

/**
 * A name can be declared with `let`/`const` if there are no variables with the same name declared with `let`/`const`
 * in the current scope, and there are no variables with the same name declared with `var` in the current scope or in
 * any child lexical scopes in this function.
 */
pp$5.canDeclareLexicalName = function(name) {
  var currentScope = this.scopeStack[this.scopeStack.length - 1];

  return !has(currentScope.lexical, name) && !has(currentScope.var, name) && !has(currentScope.childVar, name)
};

pp$5.declareVarName = function(name) {
  this.scopeStack[this.scopeStack.length - 1].var[name] = true;
};

pp$5.declareLexicalName = function(name) {
  this.scopeStack[this.scopeStack.length - 1].lexical[name] = true;
};

var Node = function Node(parser, pos, loc) {
  this.type = "";
  this.start = pos;
  this.end = 0;
  if (parser.options.locations)
    { this.loc = new SourceLocation(parser, loc); }
  if (parser.options.directSourceFile)
    { this.sourceFile = parser.options.directSourceFile; }
  if (parser.options.ranges)
    { this.range = [pos, 0]; }
};

// Start an AST node, attaching a start offset.

var pp$6 = Parser.prototype;

pp$6.startNode = function() {
  return new Node(this, this.start, this.startLoc)
};

pp$6.startNodeAt = function(pos, loc) {
  return new Node(this, pos, loc)
};

// Finish an AST node, adding `type` and `end` properties.

function finishNodeAt(node, type, pos, loc) {
  node.type = type;
  node.end = pos;
  if (this.options.locations)
    { node.loc.end = loc; }
  if (this.options.ranges)
    { node.range[1] = pos; }
  return node
}

pp$6.finishNode = function(node, type) {
  return finishNodeAt.call(this, node, type, this.lastTokEnd, this.lastTokEndLoc)
};

// Finish node at given position

pp$6.finishNodeAt = function(node, type, pos, loc) {
  return finishNodeAt.call(this, node, type, pos, loc)
};

// The algorithm used to determine whether a regexp can appear at a
// given point in the program is loosely based on sweet.js' approach.
// See https://github.com/mozilla/sweet.js/wiki/design

var TokContext = function TokContext(token, isExpr, preserveSpace, override, generator) {
  this.token = token;
  this.isExpr = !!isExpr;
  this.preserveSpace = !!preserveSpace;
  this.override = override;
  this.generator = !!generator;
};

var types$1 = {
  b_stat: new TokContext("{", false),
  b_expr: new TokContext("{", true),
  b_tmpl: new TokContext("${", false),
  p_stat: new TokContext("(", false),
  p_expr: new TokContext("(", true),
  q_tmpl: new TokContext("`", true, true, function (p) { return p.tryReadTemplateToken(); }),
  f_stat: new TokContext("function", false),
  f_expr: new TokContext("function", true),
  f_expr_gen: new TokContext("function", true, false, null, true),
  f_gen: new TokContext("function", false, false, null, true)
};

var pp$7 = Parser.prototype;

pp$7.initialContext = function() {
  return [types$1.b_stat]
};

pp$7.braceIsBlock = function(prevType) {
  var parent = this.curContext();
  if (parent === types$1.f_expr || parent === types$1.f_stat)
    { return true }
  if (prevType === types.colon && (parent === types$1.b_stat || parent === types$1.b_expr))
    { return !parent.isExpr }

  // The check for `tt.name && exprAllowed` detects whether we are
  // after a `yield` or `of` construct. See the `updateContext` for
  // `tt.name`.
  if (prevType === types._return || prevType === types.name && this.exprAllowed)
    { return lineBreak.test(this.input.slice(this.lastTokEnd, this.start)) }
  if (prevType === types._else || prevType === types.semi || prevType === types.eof || prevType === types.parenR || prevType === types.arrow)
    { return true }
  if (prevType === types.braceL)
    { return parent === types$1.b_stat }
  if (prevType === types._var || prevType === types.name)
    { return false }
  return !this.exprAllowed
};

pp$7.inGeneratorContext = function() {
  var this$1 = this;

  for (var i = this.context.length - 1; i >= 1; i--) {
    var context = this$1.context[i];
    if (context.token === "function")
      { return context.generator }
  }
  return false
};

pp$7.updateContext = function(prevType) {
  var update, type = this.type;
  if (type.keyword && prevType === types.dot)
    { this.exprAllowed = false; }
  else if (update = type.updateContext)
    { update.call(this, prevType); }
  else
    { this.exprAllowed = type.beforeExpr; }
};

// Token-specific context update code

types.parenR.updateContext = types.braceR.updateContext = function() {
  if (this.context.length === 1) {
    this.exprAllowed = true;
    return
  }
  var out = this.context.pop();
  if (out === types$1.b_stat && this.curContext().token === "function") {
    out = this.context.pop();
  }
  this.exprAllowed = !out.isExpr;
};

types.braceL.updateContext = function(prevType) {
  this.context.push(this.braceIsBlock(prevType) ? types$1.b_stat : types$1.b_expr);
  this.exprAllowed = true;
};

types.dollarBraceL.updateContext = function() {
  this.context.push(types$1.b_tmpl);
  this.exprAllowed = true;
};

types.parenL.updateContext = function(prevType) {
  var statementParens = prevType === types._if || prevType === types._for || prevType === types._with || prevType === types._while;
  this.context.push(statementParens ? types$1.p_stat : types$1.p_expr);
  this.exprAllowed = true;
};

types.incDec.updateContext = function() {
  // tokExprAllowed stays unchanged
};

types._function.updateContext = types._class.updateContext = function(prevType) {
  if (prevType.beforeExpr && prevType !== types.semi && prevType !== types._else &&
      !((prevType === types.colon || prevType === types.braceL) && this.curContext() === types$1.b_stat))
    { this.context.push(types$1.f_expr); }
  else
    { this.context.push(types$1.f_stat); }
  this.exprAllowed = false;
};

types.backQuote.updateContext = function() {
  if (this.curContext() === types$1.q_tmpl)
    { this.context.pop(); }
  else
    { this.context.push(types$1.q_tmpl); }
  this.exprAllowed = false;
};

types.star.updateContext = function(prevType) {
  if (prevType === types._function) {
    var index = this.context.length - 1;
    if (this.context[index] === types$1.f_expr)
      { this.context[index] = types$1.f_expr_gen; }
    else
      { this.context[index] = types$1.f_gen; }
  }
  this.exprAllowed = true;
};

types.name.updateContext = function(prevType) {
  var allowed = false;
  if (this.options.ecmaVersion >= 6) {
    if (this.value === "of" && !this.exprAllowed ||
        this.value === "yield" && this.inGeneratorContext())
      { allowed = true; }
  }
  this.exprAllowed = allowed;
};

var data = {
  "$LONE": [
    "ASCII",
    "ASCII_Hex_Digit",
    "AHex",
    "Alphabetic",
    "Alpha",
    "Any",
    "Assigned",
    "Bidi_Control",
    "Bidi_C",
    "Bidi_Mirrored",
    "Bidi_M",
    "Case_Ignorable",
    "CI",
    "Cased",
    "Changes_When_Casefolded",
    "CWCF",
    "Changes_When_Casemapped",
    "CWCM",
    "Changes_When_Lowercased",
    "CWL",
    "Changes_When_NFKC_Casefolded",
    "CWKCF",
    "Changes_When_Titlecased",
    "CWT",
    "Changes_When_Uppercased",
    "CWU",
    "Dash",
    "Default_Ignorable_Code_Point",
    "DI",
    "Deprecated",
    "Dep",
    "Diacritic",
    "Dia",
    "Emoji",
    "Emoji_Component",
    "Emoji_Modifier",
    "Emoji_Modifier_Base",
    "Emoji_Presentation",
    "Extender",
    "Ext",
    "Grapheme_Base",
    "Gr_Base",
    "Grapheme_Extend",
    "Gr_Ext",
    "Hex_Digit",
    "Hex",
    "IDS_Binary_Operator",
    "IDSB",
    "IDS_Trinary_Operator",
    "IDST",
    "ID_Continue",
    "IDC",
    "ID_Start",
    "IDS",
    "Ideographic",
    "Ideo",
    "Join_Control",
    "Join_C",
    "Logical_Order_Exception",
    "LOE",
    "Lowercase",
    "Lower",
    "Math",
    "Noncharacter_Code_Point",
    "NChar",
    "Pattern_Syntax",
    "Pat_Syn",
    "Pattern_White_Space",
    "Pat_WS",
    "Quotation_Mark",
    "QMark",
    "Radical",
    "Regional_Indicator",
    "RI",
    "Sentence_Terminal",
    "STerm",
    "Soft_Dotted",
    "SD",
    "Terminal_Punctuation",
    "Term",
    "Unified_Ideograph",
    "UIdeo",
    "Uppercase",
    "Upper",
    "Variation_Selector",
    "VS",
    "White_Space",
    "space",
    "XID_Continue",
    "XIDC",
    "XID_Start",
    "XIDS"
  ],
  "General_Category": [
    "Cased_Letter",
    "LC",
    "Close_Punctuation",
    "Pe",
    "Connector_Punctuation",
    "Pc",
    "Control",
    "Cc",
    "cntrl",
    "Currency_Symbol",
    "Sc",
    "Dash_Punctuation",
    "Pd",
    "Decimal_Number",
    "Nd",
    "digit",
    "Enclosing_Mark",
    "Me",
    "Final_Punctuation",
    "Pf",
    "Format",
    "Cf",
    "Initial_Punctuation",
    "Pi",
    "Letter",
    "L",
    "Letter_Number",
    "Nl",
    "Line_Separator",
    "Zl",
    "Lowercase_Letter",
    "Ll",
    "Mark",
    "M",
    "Combining_Mark",
    "Math_Symbol",
    "Sm",
    "Modifier_Letter",
    "Lm",
    "Modifier_Symbol",
    "Sk",
    "Nonspacing_Mark",
    "Mn",
    "Number",
    "N",
    "Open_Punctuation",
    "Ps",
    "Other",
    "C",
    "Other_Letter",
    "Lo",
    "Other_Number",
    "No",
    "Other_Punctuation",
    "Po",
    "Other_Symbol",
    "So",
    "Paragraph_Separator",
    "Zp",
    "Private_Use",
    "Co",
    "Punctuation",
    "P",
    "punct",
    "Separator",
    "Z",
    "Space_Separator",
    "Zs",
    "Spacing_Mark",
    "Mc",
    "Surrogate",
    "Cs",
    "Symbol",
    "S",
    "Titlecase_Letter",
    "Lt",
    "Unassigned",
    "Cn",
    "Uppercase_Letter",
    "Lu"
  ],
  "Script": [
    "Adlam",
    "Adlm",
    "Ahom",
    "Anatolian_Hieroglyphs",
    "Hluw",
    "Arabic",
    "Arab",
    "Armenian",
    "Armn",
    "Avestan",
    "Avst",
    "Balinese",
    "Bali",
    "Bamum",
    "Bamu",
    "Bassa_Vah",
    "Bass",
    "Batak",
    "Batk",
    "Bengali",
    "Beng",
    "Bhaiksuki",
    "Bhks",
    "Bopomofo",
    "Bopo",
    "Brahmi",
    "Brah",
    "Braille",
    "Brai",
    "Buginese",
    "Bugi",
    "Buhid",
    "Buhd",
    "Canadian_Aboriginal",
    "Cans",
    "Carian",
    "Cari",
    "Caucasian_Albanian",
    "Aghb",
    "Chakma",
    "Cakm",
    "Cham",
    "Cherokee",
    "Cher",
    "Common",
    "Zyyy",
    "Coptic",
    "Copt",
    "Qaac",
    "Cuneiform",
    "Xsux",
    "Cypriot",
    "Cprt",
    "Cyrillic",
    "Cyrl",
    "Deseret",
    "Dsrt",
    "Devanagari",
    "Deva",
    "Duployan",
    "Dupl",
    "Egyptian_Hieroglyphs",
    "Egyp",
    "Elbasan",
    "Elba",
    "Ethiopic",
    "Ethi",
    "Georgian",
    "Geor",
    "Glagolitic",
    "Glag",
    "Gothic",
    "Goth",
    "Grantha",
    "Gran",
    "Greek",
    "Grek",
    "Gujarati",
    "Gujr",
    "Gurmukhi",
    "Guru",
    "Han",
    "Hani",
    "Hangul",
    "Hang",
    "Hanunoo",
    "Hano",
    "Hatran",
    "Hatr",
    "Hebrew",
    "Hebr",
    "Hiragana",
    "Hira",
    "Imperial_Aramaic",
    "Armi",
    "Inherited",
    "Zinh",
    "Qaai",
    "Inscriptional_Pahlavi",
    "Phli",
    "Inscriptional_Parthian",
    "Prti",
    "Javanese",
    "Java",
    "Kaithi",
    "Kthi",
    "Kannada",
    "Knda",
    "Katakana",
    "Kana",
    "Kayah_Li",
    "Kali",
    "Kharoshthi",
    "Khar",
    "Khmer",
    "Khmr",
    "Khojki",
    "Khoj",
    "Khudawadi",
    "Sind",
    "Lao",
    "Laoo",
    "Latin",
    "Latn",
    "Lepcha",
    "Lepc",
    "Limbu",
    "Limb",
    "Linear_A",
    "Lina",
    "Linear_B",
    "Linb",
    "Lisu",
    "Lycian",
    "Lyci",
    "Lydian",
    "Lydi",
    "Mahajani",
    "Mahj",
    "Malayalam",
    "Mlym",
    "Mandaic",
    "Mand",
    "Manichaean",
    "Mani",
    "Marchen",
    "Marc",
    "Masaram_Gondi",
    "Gonm",
    "Meetei_Mayek",
    "Mtei",
    "Mende_Kikakui",
    "Mend",
    "Meroitic_Cursive",
    "Merc",
    "Meroitic_Hieroglyphs",
    "Mero",
    "Miao",
    "Plrd",
    "Modi",
    "Mongolian",
    "Mong",
    "Mro",
    "Mroo",
    "Multani",
    "Mult",
    "Myanmar",
    "Mymr",
    "Nabataean",
    "Nbat",
    "New_Tai_Lue",
    "Talu",
    "Newa",
    "Nko",
    "Nkoo",
    "Nushu",
    "Nshu",
    "Ogham",
    "Ogam",
    "Ol_Chiki",
    "Olck",
    "Old_Hungarian",
    "Hung",
    "Old_Italic",
    "Ital",
    "Old_North_Arabian",
    "Narb",
    "Old_Permic",
    "Perm",
    "Old_Persian",
    "Xpeo",
    "Old_South_Arabian",
    "Sarb",
    "Old_Turkic",
    "Orkh",
    "Oriya",
    "Orya",
    "Osage",
    "Osge",
    "Osmanya",
    "Osma",
    "Pahawh_Hmong",
    "Hmng",
    "Palmyrene",
    "Palm",
    "Pau_Cin_Hau",
    "Pauc",
    "Phags_Pa",
    "Phag",
    "Phoenician",
    "Phnx",
    "Psalter_Pahlavi",
    "Phlp",
    "Rejang",
    "Rjng",
    "Runic",
    "Runr",
    "Samaritan",
    "Samr",
    "Saurashtra",
    "Saur",
    "Sharada",
    "Shrd",
    "Shavian",
    "Shaw",
    "Siddham",
    "Sidd",
    "SignWriting",
    "Sgnw",
    "Sinhala",
    "Sinh",
    "Sora_Sompeng",
    "Sora",
    "Soyombo",
    "Soyo",
    "Sundanese",
    "Sund",
    "Syloti_Nagri",
    "Sylo",
    "Syriac",
    "Syrc",
    "Tagalog",
    "Tglg",
    "Tagbanwa",
    "Tagb",
    "Tai_Le",
    "Tale",
    "Tai_Tham",
    "Lana",
    "Tai_Viet",
    "Tavt",
    "Takri",
    "Takr",
    "Tamil",
    "Taml",
    "Tangut",
    "Tang",
    "Telugu",
    "Telu",
    "Thaana",
    "Thaa",
    "Thai",
    "Tibetan",
    "Tibt",
    "Tifinagh",
    "Tfng",
    "Tirhuta",
    "Tirh",
    "Ugaritic",
    "Ugar",
    "Vai",
    "Vaii",
    "Warang_Citi",
    "Wara",
    "Yi",
    "Yiii",
    "Zanabazar_Square",
    "Zanb"
  ]
};
Array.prototype.push.apply(data.$LONE, data.General_Category);
data.gc = data.General_Category;
data.sc = data.Script_Extensions = data.scx = data.Script;

var pp$9 = Parser.prototype;

var RegExpValidationState = function RegExpValidationState(parser) {
  this.parser = parser;
  this.validFlags = "gim" + (parser.options.ecmaVersion >= 6 ? "uy" : "") + (parser.options.ecmaVersion >= 9 ? "s" : "");
  this.source = "";
  this.flags = "";
  this.start = 0;
  this.switchU = false;
  this.switchN = false;
  this.pos = 0;
  this.lastIntValue = 0;
  this.lastStringValue = "";
  this.lastAssertionIsQuantifiable = false;
  this.numCapturingParens = 0;
  this.maxBackReference = 0;
  this.groupNames = [];
  this.backReferenceNames = [];
};

RegExpValidationState.prototype.reset = function reset (start, pattern, flags) {
  var unicode = flags.indexOf("u") !== -1;
  this.start = start | 0;
  this.source = pattern + "";
  this.flags = flags;
  this.switchU = unicode && this.parser.options.ecmaVersion >= 6;
  this.switchN = unicode && this.parser.options.ecmaVersion >= 9;
};

RegExpValidationState.prototype.raise = function raise (message) {
  this.parser.raiseRecoverable(this.start, ("Invalid regular expression: /" + (this.source) + "/: " + message));
};

// If u flag is given, this returns the code point at the index (it combines a surrogate pair).
// Otherwise, this returns the code unit of the index (can be a part of a surrogate pair).
RegExpValidationState.prototype.at = function at (i) {
  var s = this.source;
  var l = s.length;
  if (i >= l) {
    return -1
  }
  var c = s.charCodeAt(i);
  if (!this.switchU || c <= 0xD7FF || c >= 0xE000 || i + 1 >= l) {
    return c
  }
  return (c << 10) + s.charCodeAt(i + 1) - 0x35FDC00
};

RegExpValidationState.prototype.nextIndex = function nextIndex (i) {
  var s = this.source;
  var l = s.length;
  if (i >= l) {
    return l
  }
  var c = s.charCodeAt(i);
  if (!this.switchU || c <= 0xD7FF || c >= 0xE000 || i + 1 >= l) {
    return i + 1
  }
  return i + 2
};

RegExpValidationState.prototype.current = function current () {
  return this.at(this.pos)
};

RegExpValidationState.prototype.lookahead = function lookahead () {
  return this.at(this.nextIndex(this.pos))
};

RegExpValidationState.prototype.advance = function advance () {
  this.pos = this.nextIndex(this.pos);
};

RegExpValidationState.prototype.eat = function eat (ch) {
  if (this.current() === ch) {
    this.advance();
    return true
  }
  return false
};

function codePointToString$1(ch) {
  if (ch <= 0xFFFF) { return String.fromCharCode(ch) }
  ch -= 0x10000;
  return String.fromCharCode((ch >> 10) + 0xD800, (ch & 0x03FF) + 0xDC00)
}

/**
 * Validate the flags part of a given RegExpLiteral.
 *
 * @param {RegExpValidationState} state The state to validate RegExp.
 * @returns {void}
 */
pp$9.validateRegExpFlags = function(state) {
  var this$1 = this;

  var validFlags = state.validFlags;
  var flags = state.flags;

  for (var i = 0; i < flags.length; i++) {
    var flag = flags.charAt(i);
    if (validFlags.indexOf(flag) === -1) {
      this$1.raise(state.start, "Invalid regular expression flag");
    }
    if (flags.indexOf(flag, i + 1) > -1) {
      this$1.raise(state.start, "Duplicate regular expression flag");
    }
  }
};

/**
 * Validate the pattern part of a given RegExpLiteral.
 *
 * @param {RegExpValidationState} state The state to validate RegExp.
 * @returns {void}
 */
pp$9.validateRegExpPattern = function(state) {
  this.regexp_pattern(state);

  // The goal symbol for the parse is |Pattern[~U, ~N]|. If the result of
  // parsing contains a |GroupName|, reparse with the goal symbol
  // |Pattern[~U, +N]| and use this result instead. Throw a *SyntaxError*
  // exception if _P_ did not conform to the grammar, if any elements of _P_
  // were not matched by the parse, or if any Early Error conditions exist.
  if (!state.switchN && this.options.ecmaVersion >= 9 && state.groupNames.length > 0) {
    state.switchN = true;
    this.regexp_pattern(state);
  }
};

// https://www.ecma-international.org/ecma-262/8.0/#prod-Pattern
pp$9.regexp_pattern = function(state) {
  state.pos = 0;
  state.lastIntValue = 0;
  state.lastStringValue = "";
  state.lastAssertionIsQuantifiable = false;
  state.numCapturingParens = 0;
  state.maxBackReference = 0;
  state.groupNames.length = 0;
  state.backReferenceNames.length = 0;

  this.regexp_disjunction(state);

  if (state.pos !== state.source.length) {
    // Make the same messages as V8.
    if (state.eat(0x29 /* ) */)) {
      state.raise("Unmatched ')'");
    }
    if (state.eat(0x5D /* [ */) || state.eat(0x7D /* } */)) {
      state.raise("Lone quantifier brackets");
    }
  }
  if (state.maxBackReference > state.numCapturingParens) {
    state.raise("Invalid escape");
  }
  for (var i = 0, list = state.backReferenceNames; i < list.length; i += 1) {
    var name = list[i];

    if (state.groupNames.indexOf(name) === -1) {
      state.raise("Invalid named capture referenced");
    }
  }
};

// https://www.ecma-international.org/ecma-262/8.0/#prod-Disjunction
pp$9.regexp_disjunction = function(state) {
  var this$1 = this;

  this.regexp_alternative(state);
  while (state.eat(0x7C /* | */)) {
    this$1.regexp_alternative(state);
  }

  // Make the same message as V8.
  if (this.regexp_eatQuantifier(state, true)) {
    state.raise("Nothing to repeat");
  }
  if (state.eat(0x7B /* { */)) {
    state.raise("Lone quantifier brackets");
  }
};

// https://www.ecma-international.org/ecma-262/8.0/#prod-Alternative
pp$9.regexp_alternative = function(state) {
  while (state.pos < state.source.length && this.regexp_eatTerm(state))
    {  }
};

// https://www.ecma-international.org/ecma-262/8.0/#prod-annexB-Term
pp$9.regexp_eatTerm = function(state) {
  if (this.regexp_eatAssertion(state)) {
    // Handle `QuantifiableAssertion Quantifier` alternative.
    // `state.lastAssertionIsQuantifiable` is true if the last eaten Assertion
    // is a QuantifiableAssertion.
    if (state.lastAssertionIsQuantifiable && this.regexp_eatQuantifier(state)) {
      // Make the same message as V8.
      if (state.switchU) {
        state.raise("Invalid quantifier");
      }
    }
    return true
  }

  if (state.switchU ? this.regexp_eatAtom(state) : this.regexp_eatExtendedAtom(state)) {
    this.regexp_eatQuantifier(state);
    return true
  }

  return false
};

// https://www.ecma-international.org/ecma-262/8.0/#prod-annexB-Assertion
pp$9.regexp_eatAssertion = function(state) {
  var start = state.pos;
  state.lastAssertionIsQuantifiable = false;

  // ^, $
  if (state.eat(0x5E /* ^ */) || state.eat(0x24 /* $ */)) {
    return true
  }

  // \b \B
  if (state.eat(0x5C /* \ */)) {
    if (state.eat(0x42 /* B */) || state.eat(0x62 /* b */)) {
      return true
    }
    state.pos = start;
  }

  // Lookahead / Lookbehind
  if (state.eat(0x28 /* ( */) && state.eat(0x3F /* ? */)) {
    var lookbehind = false;
    if (this.options.ecmaVersion >= 9) {
      lookbehind = state.eat(0x3C /* < */);
    }
    if (state.eat(0x3D /* = */) || state.eat(0x21 /* ! */)) {
      this.regexp_disjunction(state);
      if (!state.eat(0x29 /* ) */)) {
        state.raise("Unterminated group");
      }
      state.lastAssertionIsQuantifiable = !lookbehind;
      return true
    }
  }

  state.pos = start;
  return false
};

// https://www.ecma-international.org/ecma-262/8.0/#prod-Quantifier
pp$9.regexp_eatQuantifier = function(state, noError) {
  if ( noError === void 0 ) noError = false;

  if (this.regexp_eatQuantifierPrefix(state, noError)) {
    state.eat(0x3F /* ? */);
    return true
  }
  return false
};

// https://www.ecma-international.org/ecma-262/8.0/#prod-QuantifierPrefix
pp$9.regexp_eatQuantifierPrefix = function(state, noError) {
  return (
    state.eat(0x2A /* * */) ||
    state.eat(0x2B /* + */) ||
    state.eat(0x3F /* ? */) ||
    this.regexp_eatBracedQuantifier(state, noError)
  )
};
pp$9.regexp_eatBracedQuantifier = function(state, noError) {
  var start = state.pos;
  if (state.eat(0x7B /* { */)) {
    var min = 0, max = -1;
    if (this.regexp_eatDecimalDigits(state)) {
      min = state.lastIntValue;
      if (state.eat(0x2C /* , */) && this.regexp_eatDecimalDigits(state)) {
        max = state.lastIntValue;
      }
      if (state.eat(0x7D /* } */)) {
        // SyntaxError in https://www.ecma-international.org/ecma-262/8.0/#sec-term
        if (max !== -1 && max < min && !noError) {
          state.raise("numbers out of order in {} quantifier");
        }
        return true
      }
    }
    if (state.switchU && !noError) {
      state.raise("Incomplete quantifier");
    }
    state.pos = start;
  }
  return false
};

// https://www.ecma-international.org/ecma-262/8.0/#prod-Atom
pp$9.regexp_eatAtom = function(state) {
  return (
    this.regexp_eatPatternCharacters(state) ||
    state.eat(0x2E /* . */) ||
    this.regexp_eatReverseSolidusAtomEscape(state) ||
    this.regexp_eatCharacterClass(state) ||
    this.regexp_eatUncapturingGroup(state) ||
    this.regexp_eatCapturingGroup(state)
  )
};
pp$9.regexp_eatReverseSolidusAtomEscape = function(state) {
  var start = state.pos;
  if (state.eat(0x5C /* \ */)) {
    if (this.regexp_eatAtomEscape(state)) {
      return true
    }
    state.pos = start;
  }
  return false
};
pp$9.regexp_eatUncapturingGroup = function(state) {
  var start = state.pos;
  if (state.eat(0x28 /* ( */)) {
    if (state.eat(0x3F /* ? */) && state.eat(0x3A /* : */)) {
      this.regexp_disjunction(state);
      if (state.eat(0x29 /* ) */)) {
        return true
      }
      state.raise("Unterminated group");
    }
    state.pos = start;
  }
  return false
};
pp$9.regexp_eatCapturingGroup = function(state) {
  if (state.eat(0x28 /* ( */)) {
    if (this.options.ecmaVersion >= 9) {
      this.regexp_groupSpecifier(state);
    } else if (state.current() === 0x3F /* ? */) {
      state.raise("Invalid group");
    }
    this.regexp_disjunction(state);
    if (state.eat(0x29 /* ) */)) {
      state.numCapturingParens += 1;
      return true
    }
    state.raise("Unterminated group");
  }
  return false
};

// https://www.ecma-international.org/ecma-262/8.0/#prod-annexB-ExtendedAtom
pp$9.regexp_eatExtendedAtom = function(state) {
  return (
    state.eat(0x2E /* . */) ||
    this.regexp_eatReverseSolidusAtomEscape(state) ||
    this.regexp_eatCharacterClass(state) ||
    this.regexp_eatUncapturingGroup(state) ||
    this.regexp_eatCapturingGroup(state) ||
    this.regexp_eatInvalidBracedQuantifier(state) ||
    this.regexp_eatExtendedPatternCharacter(state)
  )
};

// https://www.ecma-international.org/ecma-262/8.0/#prod-annexB-InvalidBracedQuantifier
pp$9.regexp_eatInvalidBracedQuantifier = function(state) {
  if (this.regexp_eatBracedQuantifier(state, true)) {
    state.raise("Nothing to repeat");
  }
  return false
};

// https://www.ecma-international.org/ecma-262/8.0/#prod-SyntaxCharacter
pp$9.regexp_eatSyntaxCharacter = function(state) {
  var ch = state.current();
  if (isSyntaxCharacter(ch)) {
    state.lastIntValue = ch;
    state.advance();
    return true
  }
  return false
};
function isSyntaxCharacter(ch) {
  return (
    ch === 0x24 /* $ */ ||
    ch >= 0x28 /* ( */ && ch <= 0x2B /* + */ ||
    ch === 0x2E /* . */ ||
    ch === 0x3F /* ? */ ||
    ch >= 0x5B /* [ */ && ch <= 0x5E /* ^ */ ||
    ch >= 0x7B /* { */ && ch <= 0x7D /* } */
  )
}

// https://www.ecma-international.org/ecma-262/8.0/#prod-PatternCharacter
// But eat eager.
pp$9.regexp_eatPatternCharacters = function(state) {
  var start = state.pos;
  var ch = 0;
  while ((ch = state.current()) !== -1 && !isSyntaxCharacter(ch)) {
    state.advance();
  }
  return state.pos !== start
};

// https://www.ecma-international.org/ecma-262/8.0/#prod-annexB-ExtendedPatternCharacter
pp$9.regexp_eatExtendedPatternCharacter = function(state) {
  var ch = state.current();
  if (
    ch !== -1 &&
    ch !== 0x24 /* $ */ &&
    !(ch >= 0x28 /* ( */ && ch <= 0x2B /* + */) &&
    ch !== 0x2E /* . */ &&
    ch !== 0x3F /* ? */ &&
    ch !== 0x5B /* [ */ &&
    ch !== 0x5E /* ^ */ &&
    ch !== 0x7C /* | */
  ) {
    state.advance();
    return true
  }
  return false
};

// GroupSpecifier[U] ::
//   [empty]
//   `?` GroupName[?U]
pp$9.regexp_groupSpecifier = function(state) {
  if (state.eat(0x3F /* ? */)) {
    if (this.regexp_eatGroupName(state)) {
      if (state.groupNames.indexOf(state.lastStringValue) !== -1) {
        state.raise("Duplicate capture group name");
      }
      state.groupNames.push(state.lastStringValue);
      return
    }
    state.raise("Invalid group");
  }
};

// GroupName[U] ::
//   `<` RegExpIdentifierName[?U] `>`
// Note: this updates `state.lastStringValue` property with the eaten name.
pp$9.regexp_eatGroupName = function(state) {
  state.lastStringValue = "";
  if (state.eat(0x3C /* < */)) {
    if (this.regexp_eatRegExpIdentifierName(state) && state.eat(0x3E /* > */)) {
      return true
    }
    state.raise("Invalid capture group name");
  }
  return false
};

// RegExpIdentifierName[U] ::
//   RegExpIdentifierStart[?U]
//   RegExpIdentifierName[?U] RegExpIdentifierPart[?U]
// Note: this updates `state.lastStringValue` property with the eaten name.
pp$9.regexp_eatRegExpIdentifierName = function(state) {
  state.lastStringValue = "";
  if (this.regexp_eatRegExpIdentifierStart(state)) {
    state.lastStringValue += codePointToString$1(state.lastIntValue);
    while (this.regexp_eatRegExpIdentifierPart(state)) {
      state.lastStringValue += codePointToString$1(state.lastIntValue);
    }
    return true
  }
  return false
};

// RegExpIdentifierStart[U] ::
//   UnicodeIDStart
//   `$`
//   `_`
//   `\` RegExpUnicodeEscapeSequence[?U]
pp$9.regexp_eatRegExpIdentifierStart = function(state) {
  var start = state.pos;
  var ch = state.current();
  state.advance();

  if (ch === 0x5C /* \ */ && this.regexp_eatRegExpUnicodeEscapeSequence(state)) {
    ch = state.lastIntValue;
  }
  if (isRegExpIdentifierStart(ch)) {
    state.lastIntValue = ch;
    return true
  }

  state.pos = start;
  return false
};
function isRegExpIdentifierStart(ch) {
  return isIdentifierStart(ch, true) || ch === 0x24 /* $ */ || ch === 0x5F /* _ */
}

// RegExpIdentifierPart[U] ::
//   UnicodeIDContinue
//   `$`
//   `_`
//   `\` RegExpUnicodeEscapeSequence[?U]
//   <ZWNJ>
//   <ZWJ>
pp$9.regexp_eatRegExpIdentifierPart = function(state) {
  var start = state.pos;
  var ch = state.current();
  state.advance();

  if (ch === 0x5C /* \ */ && this.regexp_eatRegExpUnicodeEscapeSequence(state)) {
    ch = state.lastIntValue;
  }
  if (isRegExpIdentifierPart(ch)) {
    state.lastIntValue = ch;
    return true
  }

  state.pos = start;
  return false
};
function isRegExpIdentifierPart(ch) {
  return isIdentifierChar(ch, true) || ch === 0x24 /* $ */ || ch === 0x5F /* _ */ || ch === 0x200C /* <ZWNJ> */ || ch === 0x200D /* <ZWJ> */
}

// https://www.ecma-international.org/ecma-262/8.0/#prod-annexB-AtomEscape
pp$9.regexp_eatAtomEscape = function(state) {
  if (
    this.regexp_eatBackReference(state) ||
    this.regexp_eatCharacterClassEscape(state) ||
    this.regexp_eatCharacterEscape(state) ||
    (state.switchN && this.regexp_eatKGroupName(state))
  ) {
    return true
  }
  if (state.switchU) {
    // Make the same message as V8.
    if (state.current() === 0x63 /* c */) {
      state.raise("Invalid unicode escape");
    }
    state.raise("Invalid escape");
  }
  return false
};
pp$9.regexp_eatBackReference = function(state) {
  var start = state.pos;
  if (this.regexp_eatDecimalEscape(state)) {
    var n = state.lastIntValue;
    if (state.switchU) {
      // For SyntaxError in https://www.ecma-international.org/ecma-262/8.0/#sec-atomescape
      if (n > state.maxBackReference) {
        state.maxBackReference = n;
      }
      return true
    }
    if (n <= state.numCapturingParens) {
      return true
    }
    state.pos = start;
  }
  return false
};
pp$9.regexp_eatKGroupName = function(state) {
  if (state.eat(0x6B /* k */)) {
    if (this.regexp_eatGroupName(state)) {
      state.backReferenceNames.push(state.lastStringValue);
      return true
    }
    state.raise("Invalid named reference");
  }
  return false
};

// https://www.ecma-international.org/ecma-262/8.0/#prod-annexB-CharacterEscape
pp$9.regexp_eatCharacterEscape = function(state) {
  return (
    this.regexp_eatControlEscape(state) ||
    this.regexp_eatCControlLetter(state) ||
    this.regexp_eatZero(state) ||
    this.regexp_eatHexEscapeSequence(state) ||
    this.regexp_eatRegExpUnicodeEscapeSequence(state) ||
    (!state.switchU && this.regexp_eatLegacyOctalEscapeSequence(state)) ||
    this.regexp_eatIdentityEscape(state)
  )
};
pp$9.regexp_eatCControlLetter = function(state) {
  var start = state.pos;
  if (state.eat(0x63 /* c */)) {
    if (this.regexp_eatControlLetter(state)) {
      return true
    }
    state.pos = start;
  }
  return false
};
pp$9.regexp_eatZero = function(state) {
  if (state.current() === 0x30 /* 0 */ && !isDecimalDigit(state.lookahead())) {
    state.lastIntValue = 0;
    state.advance();
    return true
  }
  return false
};

// https://www.ecma-international.org/ecma-262/8.0/#prod-ControlEscape
pp$9.regexp_eatControlEscape = function(state) {
  var ch = state.current();
  if (ch === 0x74 /* t */) {
    state.lastIntValue = 0x09; /* \t */
    state.advance();
    return true
  }
  if (ch === 0x6E /* n */) {
    state.lastIntValue = 0x0A; /* \n */
    state.advance();
    return true
  }
  if (ch === 0x76 /* v */) {
    state.lastIntValue = 0x0B; /* \v */
    state.advance();
    return true
  }
  if (ch === 0x66 /* f */) {
    state.lastIntValue = 0x0C; /* \f */
    state.advance();
    return true
  }
  if (ch === 0x72 /* r */) {
    state.lastIntValue = 0x0D; /* \r */
    state.advance();
    return true
  }
  return false
};

// https://www.ecma-international.org/ecma-262/8.0/#prod-ControlLetter
pp$9.regexp_eatControlLetter = function(state) {
  var ch = state.current();
  if (isControlLetter(ch)) {
    state.lastIntValue = ch % 0x20;
    state.advance();
    return true
  }
  return false
};
function isControlLetter(ch) {
  return (
    (ch >= 0x41 /* A */ && ch <= 0x5A /* Z */) ||
    (ch >= 0x61 /* a */ && ch <= 0x7A /* z */)
  )
}

// https://www.ecma-international.org/ecma-262/8.0/#prod-RegExpUnicodeEscapeSequence
pp$9.regexp_eatRegExpUnicodeEscapeSequence = function(state) {
  var start = state.pos;

  if (state.eat(0x75 /* u */)) {
    if (this.regexp_eatFixedHexDigits(state, 4)) {
      var lead = state.lastIntValue;
      if (state.switchU && lead >= 0xD800 && lead <= 0xDBFF) {
        var leadSurrogateEnd = state.pos;
        if (state.eat(0x5C /* \ */) && state.eat(0x75 /* u */) && this.regexp_eatFixedHexDigits(state, 4)) {
          var trail = state.lastIntValue;
          if (trail >= 0xDC00 && trail <= 0xDFFF) {
            state.lastIntValue = (lead - 0xD800) * 0x400 + (trail - 0xDC00) + 0x10000;
            return true
          }
        }
        state.pos = leadSurrogateEnd;
        state.lastIntValue = lead;
      }
      return true
    }
    if (
      state.switchU &&
      state.eat(0x7B /* { */) &&
      this.regexp_eatHexDigits(state) &&
      state.eat(0x7D /* } */) &&
      isValidUnicode(state.lastIntValue)
    ) {
      return true
    }
    if (state.switchU) {
      state.raise("Invalid unicode escape");
    }
    state.pos = start;
  }

  return false
};
function isValidUnicode(ch) {
  return ch >= 0 && ch <= 0x10FFFF
}

// https://www.ecma-international.org/ecma-262/8.0/#prod-annexB-IdentityEscape
pp$9.regexp_eatIdentityEscape = function(state) {
  if (state.switchU) {
    if (this.regexp_eatSyntaxCharacter(state)) {
      return true
    }
    if (state.eat(0x2F /* / */)) {
      state.lastIntValue = 0x2F; /* / */
      return true
    }
    return false
  }

  var ch = state.current();
  if (ch !== 0x63 /* c */ && (!state.switchN || ch !== 0x6B /* k */)) {
    state.lastIntValue = ch;
    state.advance();
    return true
  }

  return false
};

// https://www.ecma-international.org/ecma-262/8.0/#prod-DecimalEscape
pp$9.regexp_eatDecimalEscape = function(state) {
  state.lastIntValue = 0;
  var ch = state.current();
  if (ch >= 0x31 /* 1 */ && ch <= 0x39 /* 9 */) {
    do {
      state.lastIntValue = 10 * state.lastIntValue + (ch - 0x30 /* 0 */);
      state.advance();
    } while ((ch = state.current()) >= 0x30 /* 0 */ && ch <= 0x39 /* 9 */)
    return true
  }
  return false
};

// https://www.ecma-international.org/ecma-262/8.0/#prod-CharacterClassEscape
pp$9.regexp_eatCharacterClassEscape = function(state) {
  var ch = state.current();

  if (isCharacterClassEscape(ch)) {
    state.lastIntValue = -1;
    state.advance();
    return true
  }

  if (
    state.switchU &&
    this.options.ecmaVersion >= 9 &&
    (ch === 0x50 /* P */ || ch === 0x70 /* p */)
  ) {
    state.lastIntValue = -1;
    state.advance();
    if (
      state.eat(0x7B /* { */) &&
      this.regexp_eatUnicodePropertyValueExpression(state) &&
      state.eat(0x7D /* } */)
    ) {
      return true
    }
    state.raise("Invalid property name");
  }

  return false
};
function isCharacterClassEscape(ch) {
  return (
    ch === 0x64 /* d */ ||
    ch === 0x44 /* D */ ||
    ch === 0x73 /* s */ ||
    ch === 0x53 /* S */ ||
    ch === 0x77 /* w */ ||
    ch === 0x57 /* W */
  )
}

// UnicodePropertyValueExpression ::
//   UnicodePropertyName `=` UnicodePropertyValue
//   LoneUnicodePropertyNameOrValue
pp$9.regexp_eatUnicodePropertyValueExpression = function(state) {
  var start = state.pos;

  // UnicodePropertyName `=` UnicodePropertyValue
  if (this.regexp_eatUnicodePropertyName(state) && state.eat(0x3D /* = */)) {
    var name = state.lastStringValue;
    if (this.regexp_eatUnicodePropertyValue(state)) {
      var value = state.lastStringValue;
      this.regexp_validateUnicodePropertyNameAndValue(state, name, value);
      return true
    }
  }
  state.pos = start;

  // LoneUnicodePropertyNameOrValue
  if (this.regexp_eatLoneUnicodePropertyNameOrValue(state)) {
    var nameOrValue = state.lastStringValue;
    this.regexp_validateUnicodePropertyNameOrValue(state, nameOrValue);
    return true
  }
  return false
};
pp$9.regexp_validateUnicodePropertyNameAndValue = function(state, name, value) {
  if (!data.hasOwnProperty(name) || data[name].indexOf(value) === -1) {
    state.raise("Invalid property name");
  }
};
pp$9.regexp_validateUnicodePropertyNameOrValue = function(state, nameOrValue) {
  if (data.$LONE.indexOf(nameOrValue) === -1) {
    state.raise("Invalid property name");
  }
};

// UnicodePropertyName ::
//   UnicodePropertyNameCharacters
pp$9.regexp_eatUnicodePropertyName = function(state) {
  var ch = 0;
  state.lastStringValue = "";
  while (isUnicodePropertyNameCharacter(ch = state.current())) {
    state.lastStringValue += codePointToString$1(ch);
    state.advance();
  }
  return state.lastStringValue !== ""
};
function isUnicodePropertyNameCharacter(ch) {
  return isControlLetter(ch) || ch === 0x5F /* _ */
}

// UnicodePropertyValue ::
//   UnicodePropertyValueCharacters
pp$9.regexp_eatUnicodePropertyValue = function(state) {
  var ch = 0;
  state.lastStringValue = "";
  while (isUnicodePropertyValueCharacter(ch = state.current())) {
    state.lastStringValue += codePointToString$1(ch);
    state.advance();
  }
  return state.lastStringValue !== ""
};
function isUnicodePropertyValueCharacter(ch) {
  return isUnicodePropertyNameCharacter(ch) || isDecimalDigit(ch)
}

// LoneUnicodePropertyNameOrValue ::
//   UnicodePropertyValueCharacters
pp$9.regexp_eatLoneUnicodePropertyNameOrValue = function(state) {
  return this.regexp_eatUnicodePropertyValue(state)
};

// https://www.ecma-international.org/ecma-262/8.0/#prod-CharacterClass
pp$9.regexp_eatCharacterClass = function(state) {
  if (state.eat(0x5B /* [ */)) {
    state.eat(0x5E /* ^ */);
    this.regexp_classRanges(state);
    if (state.eat(0x5D /* [ */)) {
      return true
    }
    // Unreachable since it threw "unterminated regular expression" error before.
    state.raise("Unterminated character class");
  }
  return false
};

// https://www.ecma-international.org/ecma-262/8.0/#prod-ClassRanges
// https://www.ecma-international.org/ecma-262/8.0/#prod-NonemptyClassRanges
// https://www.ecma-international.org/ecma-262/8.0/#prod-NonemptyClassRangesNoDash
pp$9.regexp_classRanges = function(state) {
  var this$1 = this;

  while (this.regexp_eatClassAtom(state)) {
    var left = state.lastIntValue;
    if (state.eat(0x2D /* - */) && this$1.regexp_eatClassAtom(state)) {
      var right = state.lastIntValue;
      if (state.switchU && (left === -1 || right === -1)) {
        state.raise("Invalid character class");
      }
      if (left !== -1 && right !== -1 && left > right) {
        state.raise("Range out of order in character class");
      }
    }
  }
};

// https://www.ecma-international.org/ecma-262/8.0/#prod-ClassAtom
// https://www.ecma-international.org/ecma-262/8.0/#prod-ClassAtomNoDash
pp$9.regexp_eatClassAtom = function(state) {
  var start = state.pos;

  if (state.eat(0x5C /* \ */)) {
    if (this.regexp_eatClassEscape(state)) {
      return true
    }
    if (state.switchU) {
      // Make the same message as V8.
      var ch$1 = state.current();
      if (ch$1 === 0x63 /* c */ || isOctalDigit(ch$1)) {
        state.raise("Invalid class escape");
      }
      state.raise("Invalid escape");
    }
    state.pos = start;
  }

  var ch = state.current();
  if (ch !== 0x5D /* [ */) {
    state.lastIntValue = ch;
    state.advance();
    return true
  }

  return false
};

// https://www.ecma-international.org/ecma-262/8.0/#prod-annexB-ClassEscape
pp$9.regexp_eatClassEscape = function(state) {
  var start = state.pos;

  if (state.eat(0x62 /* b */)) {
    state.lastIntValue = 0x08; /* <BS> */
    return true
  }

  if (state.switchU && state.eat(0x2D /* - */)) {
    state.lastIntValue = 0x2D; /* - */
    return true
  }

  if (!state.switchU && state.eat(0x63 /* c */)) {
    if (this.regexp_eatClassControlLetter(state)) {
      return true
    }
    state.pos = start;
  }

  return (
    this.regexp_eatCharacterClassEscape(state) ||
    this.regexp_eatCharacterEscape(state)
  )
};

// https://www.ecma-international.org/ecma-262/8.0/#prod-annexB-ClassControlLetter
pp$9.regexp_eatClassControlLetter = function(state) {
  var ch = state.current();
  if (isDecimalDigit(ch) || ch === 0x5F /* _ */) {
    state.lastIntValue = ch % 0x20;
    state.advance();
    return true
  }
  return false
};

// https://www.ecma-international.org/ecma-262/8.0/#prod-HexEscapeSequence
pp$9.regexp_eatHexEscapeSequence = function(state) {
  var start = state.pos;
  if (state.eat(0x78 /* x */)) {
    if (this.regexp_eatFixedHexDigits(state, 2)) {
      return true
    }
    if (state.switchU) {
      state.raise("Invalid escape");
    }
    state.pos = start;
  }
  return false
};

// https://www.ecma-international.org/ecma-262/8.0/#prod-DecimalDigits
pp$9.regexp_eatDecimalDigits = function(state) {
  var start = state.pos;
  var ch = 0;
  state.lastIntValue = 0;
  while (isDecimalDigit(ch = state.current())) {
    state.lastIntValue = 10 * state.lastIntValue + (ch - 0x30 /* 0 */);
    state.advance();
  }
  return state.pos !== start
};
function isDecimalDigit(ch) {
  return ch >= 0x30 /* 0 */ && ch <= 0x39 /* 9 */
}

// https://www.ecma-international.org/ecma-262/8.0/#prod-HexDigits
pp$9.regexp_eatHexDigits = function(state) {
  var start = state.pos;
  var ch = 0;
  state.lastIntValue = 0;
  while (isHexDigit(ch = state.current())) {
    state.lastIntValue = 16 * state.lastIntValue + hexToInt(ch);
    state.advance();
  }
  return state.pos !== start
};
function isHexDigit(ch) {
  return (
    (ch >= 0x30 /* 0 */ && ch <= 0x39 /* 9 */) ||
    (ch >= 0x41 /* A */ && ch <= 0x46 /* F */) ||
    (ch >= 0x61 /* a */ && ch <= 0x66 /* f */)
  )
}
function hexToInt(ch) {
  if (ch >= 0x41 /* A */ && ch <= 0x46 /* F */) {
    return 10 + (ch - 0x41 /* A */)
  }
  if (ch >= 0x61 /* a */ && ch <= 0x66 /* f */) {
    return 10 + (ch - 0x61 /* a */)
  }
  return ch - 0x30 /* 0 */
}

// https://www.ecma-international.org/ecma-262/8.0/#prod-annexB-LegacyOctalEscapeSequence
// Allows only 0-377(octal) i.e. 0-255(decimal).
pp$9.regexp_eatLegacyOctalEscapeSequence = function(state) {
  if (this.regexp_eatOctalDigit(state)) {
    var n1 = state.lastIntValue;
    if (this.regexp_eatOctalDigit(state)) {
      var n2 = state.lastIntValue;
      if (n1 <= 3 && this.regexp_eatOctalDigit(state)) {
        state.lastIntValue = n1 * 64 + n2 * 8 + state.lastIntValue;
      } else {
        state.lastIntValue = n1 * 8 + n2;
      }
    } else {
      state.lastIntValue = n1;
    }
    return true
  }
  return false
};

// https://www.ecma-international.org/ecma-262/8.0/#prod-OctalDigit
pp$9.regexp_eatOctalDigit = function(state) {
  var ch = state.current();
  if (isOctalDigit(ch)) {
    state.lastIntValue = ch - 0x30; /* 0 */
    state.advance();
    return true
  }
  state.lastIntValue = 0;
  return false
};
function isOctalDigit(ch) {
  return ch >= 0x30 /* 0 */ && ch <= 0x37 /* 7 */
}

// https://www.ecma-international.org/ecma-262/8.0/#prod-Hex4Digits
// https://www.ecma-international.org/ecma-262/8.0/#prod-HexDigit
// And HexDigit HexDigit in https://www.ecma-international.org/ecma-262/8.0/#prod-HexEscapeSequence
pp$9.regexp_eatFixedHexDigits = function(state, length) {
  var start = state.pos;
  state.lastIntValue = 0;
  for (var i = 0; i < length; ++i) {
    var ch = state.current();
    if (!isHexDigit(ch)) {
      state.pos = start;
      return false
    }
    state.lastIntValue = 16 * state.lastIntValue + hexToInt(ch);
    state.advance();
  }
  return true
};

// Object type used to represent tokens. Note that normally, tokens
// simply exist as properties on the parser object. This is only
// used for the onToken callback and the external tokenizer.

var Token = function Token(p) {
  this.type = p.type;
  this.value = p.value;
  this.start = p.start;
  this.end = p.end;
  if (p.options.locations)
    { this.loc = new SourceLocation(p, p.startLoc, p.endLoc); }
  if (p.options.ranges)
    { this.range = [p.start, p.end]; }
};

// ## Tokenizer

var pp$8 = Parser.prototype;

// Move to the next token

pp$8.next = function() {
  if (this.options.onToken)
    { this.options.onToken(new Token(this)); }

  this.lastTokEnd = this.end;
  this.lastTokStart = this.start;
  this.lastTokEndLoc = this.endLoc;
  this.lastTokStartLoc = this.startLoc;
  this.nextToken();
};

pp$8.getToken = function() {
  this.next();
  return new Token(this)
};

// If we're in an ES6 environment, make parsers iterable
if (typeof Symbol !== "undefined")
  { pp$8[Symbol.iterator] = function() {
    var this$1 = this;

    return {
      next: function () {
        var token = this$1.getToken();
        return {
          done: token.type === types.eof,
          value: token
        }
      }
    }
  }; }

// Toggle strict mode. Re-reads the next number or string to please
// pedantic tests (`"use strict"; 010;` should fail).

pp$8.curContext = function() {
  return this.context[this.context.length - 1]
};

// Read a single token, updating the parser object's token-related
// properties.

pp$8.nextToken = function() {
  var curContext = this.curContext();
  if (!curContext || !curContext.preserveSpace) { this.skipSpace(); }

  this.start = this.pos;
  if (this.options.locations) { this.startLoc = this.curPosition(); }
  if (this.pos >= this.input.length) { return this.finishToken(types.eof) }

  if (curContext.override) { return curContext.override(this) }
  else { this.readToken(this.fullCharCodeAtPos()); }
};

pp$8.readToken = function(code) {
  // Identifier or keyword. '\uXXXX' sequences are allowed in
  // identifiers, so '\' also dispatches to that.
  if (isIdentifierStart(code, this.options.ecmaVersion >= 6) || code === 92 /* '\' */)
    { return this.readWord() }

  return this.getTokenFromCode(code)
};

pp$8.fullCharCodeAtPos = function() {
  var code = this.input.charCodeAt(this.pos);
  if (code <= 0xd7ff || code >= 0xe000) { return code }
  var next = this.input.charCodeAt(this.pos + 1);
  return (code << 10) + next - 0x35fdc00
};

pp$8.skipBlockComment = function() {
  var this$1 = this;

  var startLoc = this.options.onComment && this.curPosition();
  var start = this.pos, end = this.input.indexOf("*/", this.pos += 2);
  if (end === -1) { this.raise(this.pos - 2, "Unterminated comment"); }
  this.pos = end + 2;
  if (this.options.locations) {
    lineBreakG.lastIndex = start;
    var match;
    while ((match = lineBreakG.exec(this.input)) && match.index < this.pos) {
      ++this$1.curLine;
      this$1.lineStart = match.index + match[0].length;
    }
  }
  if (this.options.onComment)
    { this.options.onComment(true, this.input.slice(start + 2, end), start, this.pos,
                           startLoc, this.curPosition()); }
};

pp$8.skipLineComment = function(startSkip) {
  var this$1 = this;

  var start = this.pos;
  var startLoc = this.options.onComment && this.curPosition();
  var ch = this.input.charCodeAt(this.pos += startSkip);
  while (this.pos < this.input.length && !isNewLine(ch)) {
    ch = this$1.input.charCodeAt(++this$1.pos);
  }
  if (this.options.onComment)
    { this.options.onComment(false, this.input.slice(start + startSkip, this.pos), start, this.pos,
                           startLoc, this.curPosition()); }
};

// Called at the start of the parse and after every token. Skips
// whitespace and comments, and.

pp$8.skipSpace = function() {
  var this$1 = this;

  loop: while (this.pos < this.input.length) {
    var ch = this$1.input.charCodeAt(this$1.pos);
    switch (ch) {
    case 32: case 160: // ' '
      ++this$1.pos;
      break
    case 13:
      if (this$1.input.charCodeAt(this$1.pos + 1) === 10) {
        ++this$1.pos;
      }
    case 10: case 8232: case 8233:
      ++this$1.pos;
      if (this$1.options.locations) {
        ++this$1.curLine;
        this$1.lineStart = this$1.pos;
      }
      break
    case 47: // '/'
      switch (this$1.input.charCodeAt(this$1.pos + 1)) {
      case 42: // '*'
        this$1.skipBlockComment();
        break
      case 47:
        this$1.skipLineComment(2);
        break
      default:
        break loop
      }
      break
    default:
      if (ch > 8 && ch < 14 || ch >= 5760 && nonASCIIwhitespace.test(String.fromCharCode(ch))) {
        ++this$1.pos;
      } else {
        break loop
      }
    }
  }
};

// Called at the end of every token. Sets `end`, `val`, and
// maintains `context` and `exprAllowed`, and skips the space after
// the token, so that the next one's `start` will point at the
// right position.

pp$8.finishToken = function(type, val) {
  this.end = this.pos;
  if (this.options.locations) { this.endLoc = this.curPosition(); }
  var prevType = this.type;
  this.type = type;
  this.value = val;

  this.updateContext(prevType);
};

// ### Token reading

// This is the function that is called to fetch the next token. It
// is somewhat obscure, because it works in character codes rather
// than characters, and because operator parsing has been inlined
// into it.
//
// All in the name of speed.
//
pp$8.readToken_dot = function() {
  var next = this.input.charCodeAt(this.pos + 1);
  if (next >= 48 && next <= 57) { return this.readNumber(true) }
  var next2 = this.input.charCodeAt(this.pos + 2);
  if (this.options.ecmaVersion >= 6 && next === 46 && next2 === 46) { // 46 = dot '.'
    this.pos += 3;
    return this.finishToken(types.ellipsis)
  } else {
    ++this.pos;
    return this.finishToken(types.dot)
  }
};

pp$8.readToken_slash = function() { // '/'
  var next = this.input.charCodeAt(this.pos + 1);
  if (this.exprAllowed) { ++this.pos; return this.readRegexp() }
  if (next === 61) { return this.finishOp(types.assign, 2) }
  return this.finishOp(types.slash, 1)
};

pp$8.readToken_mult_modulo_exp = function(code) { // '%*'
  var next = this.input.charCodeAt(this.pos + 1);
  var size = 1;
  var tokentype = code === 42 ? types.star : types.modulo;

  // exponentiation operator ** and **=
  if (this.options.ecmaVersion >= 7 && code === 42 && next === 42) {
    ++size;
    tokentype = types.starstar;
    next = this.input.charCodeAt(this.pos + 2);
  }

  if (next === 61) { return this.finishOp(types.assign, size + 1) }
  return this.finishOp(tokentype, size)
};

pp$8.readToken_pipe_amp = function(code) { // '|&'
  var next = this.input.charCodeAt(this.pos + 1);
  if (next === code) { return this.finishOp(code === 124 ? types.logicalOR : types.logicalAND, 2) }
  if (next === 61) { return this.finishOp(types.assign, 2) }
  return this.finishOp(code === 124 ? types.bitwiseOR : types.bitwiseAND, 1)
};

pp$8.readToken_caret = function() { // '^'
  var next = this.input.charCodeAt(this.pos + 1);
  if (next === 61) { return this.finishOp(types.assign, 2) }
  return this.finishOp(types.bitwiseXOR, 1)
};

pp$8.readToken_plus_min = function(code) { // '+-'
  var next = this.input.charCodeAt(this.pos + 1);
  if (next === code) {
    if (next === 45 && !this.inModule && this.input.charCodeAt(this.pos + 2) === 62 &&
        (this.lastTokEnd === 0 || lineBreak.test(this.input.slice(this.lastTokEnd, this.pos)))) {
      // A `-->` line comment
      this.skipLineComment(3);
      this.skipSpace();
      return this.nextToken()
    }
    return this.finishOp(types.incDec, 2)
  }
  if (next === 61) { return this.finishOp(types.assign, 2) }
  return this.finishOp(types.plusMin, 1)
};

pp$8.readToken_lt_gt = function(code) { // '<>'
  var next = this.input.charCodeAt(this.pos + 1);
  var size = 1;
  if (next === code) {
    size = code === 62 && this.input.charCodeAt(this.pos + 2) === 62 ? 3 : 2;
    if (this.input.charCodeAt(this.pos + size) === 61) { return this.finishOp(types.assign, size + 1) }
    return this.finishOp(types.bitShift, size)
  }
  if (next === 33 && code === 60 && !this.inModule && this.input.charCodeAt(this.pos + 2) === 45 &&
      this.input.charCodeAt(this.pos + 3) === 45) {
    // `<!--`, an XML-style comment that should be interpreted as a line comment
    this.skipLineComment(4);
    this.skipSpace();
    return this.nextToken()
  }
  if (next === 61) { size = 2; }
  return this.finishOp(types.relational, size)
};

pp$8.readToken_eq_excl = function(code) { // '=!'
  var next = this.input.charCodeAt(this.pos + 1);
  if (next === 61) { return this.finishOp(types.equality, this.input.charCodeAt(this.pos + 2) === 61 ? 3 : 2) }
  if (code === 61 && next === 62 && this.options.ecmaVersion >= 6) { // '=>'
    this.pos += 2;
    return this.finishToken(types.arrow)
  }
  return this.finishOp(code === 61 ? types.eq : types.prefix, 1)
};

pp$8.getTokenFromCode = function(code) {
  switch (code) {
  // The interpretation of a dot depends on whether it is followed
  // by a digit or another two dots.
  case 46: // '.'
    return this.readToken_dot()

  // Punctuation tokens.
  case 40: ++this.pos; return this.finishToken(types.parenL)
  case 41: ++this.pos; return this.finishToken(types.parenR)
  case 59: ++this.pos; return this.finishToken(types.semi)
  case 44: ++this.pos; return this.finishToken(types.comma)
  case 91: ++this.pos; return this.finishToken(types.bracketL)
  case 93: ++this.pos; return this.finishToken(types.bracketR)
  case 123: ++this.pos; return this.finishToken(types.braceL)
  case 125: ++this.pos; return this.finishToken(types.braceR)
  case 58: ++this.pos; return this.finishToken(types.colon)
  case 63: ++this.pos; return this.finishToken(types.question)

  case 96: // '`'
    if (this.options.ecmaVersion < 6) { break }
    ++this.pos;
    return this.finishToken(types.backQuote)

  case 48: // '0'
    var next = this.input.charCodeAt(this.pos + 1);
    if (next === 120 || next === 88) { return this.readRadixNumber(16) } // '0x', '0X' - hex number
    if (this.options.ecmaVersion >= 6) {
      if (next === 111 || next === 79) { return this.readRadixNumber(8) } // '0o', '0O' - octal number
      if (next === 98 || next === 66) { return this.readRadixNumber(2) } // '0b', '0B' - binary number
    }

  // Anything else beginning with a digit is an integer, octal
  // number, or float.
  case 49: case 50: case 51: case 52: case 53: case 54: case 55: case 56: case 57: // 1-9
    return this.readNumber(false)

  // Quotes produce strings.
  case 34: case 39: // '"', "'"
    return this.readString(code)

  // Operators are parsed inline in tiny state machines. '=' (61) is
  // often referred to. `finishOp` simply skips the amount of
  // characters it is given as second argument, and returns a token
  // of the type given by its first argument.

  case 47: // '/'
    return this.readToken_slash()

  case 37: case 42: // '%*'
    return this.readToken_mult_modulo_exp(code)

  case 124: case 38: // '|&'
    return this.readToken_pipe_amp(code)

  case 94: // '^'
    return this.readToken_caret()

  case 43: case 45: // '+-'
    return this.readToken_plus_min(code)

  case 60: case 62: // '<>'
    return this.readToken_lt_gt(code)

  case 61: case 33: // '=!'
    return this.readToken_eq_excl(code)

  case 126: // '~'
    return this.finishOp(types.prefix, 1)
  }

  this.raise(this.pos, "Unexpected character '" + codePointToString(code) + "'");
};

pp$8.finishOp = function(type, size) {
  var str = this.input.slice(this.pos, this.pos + size);
  this.pos += size;
  return this.finishToken(type, str)
};

pp$8.readRegexp = function() {
  var this$1 = this;

  var escaped, inClass, start = this.pos;
  for (;;) {
    if (this$1.pos >= this$1.input.length) { this$1.raise(start, "Unterminated regular expression"); }
    var ch = this$1.input.charAt(this$1.pos);
    if (lineBreak.test(ch)) { this$1.raise(start, "Unterminated regular expression"); }
    if (!escaped) {
      if (ch === "[") { inClass = true; }
      else if (ch === "]" && inClass) { inClass = false; }
      else if (ch === "/" && !inClass) { break }
      escaped = ch === "\\";
    } else { escaped = false; }
    ++this$1.pos;
  }
  var pattern = this.input.slice(start, this.pos);
  ++this.pos;
  var flagsStart = this.pos;
  var flags = this.readWord1();
  if (this.containsEsc) { this.unexpected(flagsStart); }

  // Validate pattern
  var state = this.regexpState || (this.regexpState = new RegExpValidationState(this));
  state.reset(start, pattern, flags);
  this.validateRegExpFlags(state);
  this.validateRegExpPattern(state);

  // Create Literal#value property value.
  var value = null;
  try {
    value = new RegExp(pattern, flags);
  } catch (e) {
    // ESTree requires null if it failed to instantiate RegExp object.
    // https://github.com/estree/estree/blob/a27003adf4fd7bfad44de9cef372a2eacd527b1c/es5.md#regexpliteral
  }

  return this.finishToken(types.regexp, {pattern: pattern, flags: flags, value: value})
};

// Read an integer in the given radix. Return null if zero digits
// were read, the integer value otherwise. When `len` is given, this
// will return `null` unless the integer has exactly `len` digits.

pp$8.readInt = function(radix, len) {
  var this$1 = this;

  var start = this.pos, total = 0;
  for (var i = 0, e = len == null ? Infinity : len; i < e; ++i) {
    var code = this$1.input.charCodeAt(this$1.pos), val = (void 0);
    if (code >= 97) { val = code - 97 + 10; } // a
    else if (code >= 65) { val = code - 65 + 10; } // A
    else if (code >= 48 && code <= 57) { val = code - 48; } // 0-9
    else { val = Infinity; }
    if (val >= radix) { break }
    ++this$1.pos;
    total = total * radix + val;
  }
  if (this.pos === start || len != null && this.pos - start !== len) { return null }

  return total
};

pp$8.readRadixNumber = function(radix) {
  this.pos += 2; // 0x
  var val = this.readInt(radix);
  if (val == null) { this.raise(this.start + 2, "Expected number in radix " + radix); }
  if (isIdentifierStart(this.fullCharCodeAtPos())) { this.raise(this.pos, "Identifier directly after number"); }
  return this.finishToken(types.num, val)
};

// Read an integer, octal integer, or floating-point number.

pp$8.readNumber = function(startsWithDot) {
  var start = this.pos;
  if (!startsWithDot && this.readInt(10) === null) { this.raise(start, "Invalid number"); }
  var octal = this.pos - start >= 2 && this.input.charCodeAt(start) === 48;
  if (octal && this.strict) { this.raise(start, "Invalid number"); }
  if (octal && /[89]/.test(this.input.slice(start, this.pos))) { octal = false; }
  var next = this.input.charCodeAt(this.pos);
  if (next === 46 && !octal) { // '.'
    ++this.pos;
    this.readInt(10);
    next = this.input.charCodeAt(this.pos);
  }
  if ((next === 69 || next === 101) && !octal) { // 'eE'
    next = this.input.charCodeAt(++this.pos);
    if (next === 43 || next === 45) { ++this.pos; } // '+-'
    if (this.readInt(10) === null) { this.raise(start, "Invalid number"); }
  }
  if (isIdentifierStart(this.fullCharCodeAtPos())) { this.raise(this.pos, "Identifier directly after number"); }

  var str = this.input.slice(start, this.pos);
  var val = octal ? parseInt(str, 8) : parseFloat(str);
  return this.finishToken(types.num, val)
};

// Read a string value, interpreting backslash-escapes.

pp$8.readCodePoint = function() {
  var ch = this.input.charCodeAt(this.pos), code;

  if (ch === 123) { // '{'
    if (this.options.ecmaVersion < 6) { this.unexpected(); }
    var codePos = ++this.pos;
    code = this.readHexChar(this.input.indexOf("}", this.pos) - this.pos);
    ++this.pos;
    if (code > 0x10FFFF) { this.invalidStringToken(codePos, "Code point out of bounds"); }
  } else {
    code = this.readHexChar(4);
  }
  return code
};

function codePointToString(code) {
  // UTF-16 Decoding
  if (code <= 0xFFFF) { return String.fromCharCode(code) }
  code -= 0x10000;
  return String.fromCharCode((code >> 10) + 0xD800, (code & 1023) + 0xDC00)
}

pp$8.readString = function(quote) {
  var this$1 = this;

  var out = "", chunkStart = ++this.pos;
  for (;;) {
    if (this$1.pos >= this$1.input.length) { this$1.raise(this$1.start, "Unterminated string constant"); }
    var ch = this$1.input.charCodeAt(this$1.pos);
    if (ch === quote) { break }
    if (ch === 92) { // '\'
      out += this$1.input.slice(chunkStart, this$1.pos);
      out += this$1.readEscapedChar(false);
      chunkStart = this$1.pos;
    } else {
      if (isNewLine(ch, this$1.options.ecmaVersion >= 10)) { this$1.raise(this$1.start, "Unterminated string constant"); }
      ++this$1.pos;
    }
  }
  out += this.input.slice(chunkStart, this.pos++);
  return this.finishToken(types.string, out)
};

// Reads template string tokens.

var INVALID_TEMPLATE_ESCAPE_ERROR = {};

pp$8.tryReadTemplateToken = function() {
  this.inTemplateElement = true;
  try {
    this.readTmplToken();
  } catch (err) {
    if (err === INVALID_TEMPLATE_ESCAPE_ERROR) {
      this.readInvalidTemplateToken();
    } else {
      throw err
    }
  }

  this.inTemplateElement = false;
};

pp$8.invalidStringToken = function(position, message) {
  if (this.inTemplateElement && this.options.ecmaVersion >= 9) {
    throw INVALID_TEMPLATE_ESCAPE_ERROR
  } else {
    this.raise(position, message);
  }
};

pp$8.readTmplToken = function() {
  var this$1 = this;

  var out = "", chunkStart = this.pos;
  for (;;) {
    if (this$1.pos >= this$1.input.length) { this$1.raise(this$1.start, "Unterminated template"); }
    var ch = this$1.input.charCodeAt(this$1.pos);
    if (ch === 96 || ch === 36 && this$1.input.charCodeAt(this$1.pos + 1) === 123) { // '`', '${'
      if (this$1.pos === this$1.start && (this$1.type === types.template || this$1.type === types.invalidTemplate)) {
        if (ch === 36) {
          this$1.pos += 2;
          return this$1.finishToken(types.dollarBraceL)
        } else {
          ++this$1.pos;
          return this$1.finishToken(types.backQuote)
        }
      }
      out += this$1.input.slice(chunkStart, this$1.pos);
      return this$1.finishToken(types.template, out)
    }
    if (ch === 92) { // '\'
      out += this$1.input.slice(chunkStart, this$1.pos);
      out += this$1.readEscapedChar(true);
      chunkStart = this$1.pos;
    } else if (isNewLine(ch)) {
      out += this$1.input.slice(chunkStart, this$1.pos);
      ++this$1.pos;
      switch (ch) {
      case 13:
        if (this$1.input.charCodeAt(this$1.pos) === 10) { ++this$1.pos; }
      case 10:
        out += "\n";
        break
      default:
        out += String.fromCharCode(ch);
        break
      }
      if (this$1.options.locations) {
        ++this$1.curLine;
        this$1.lineStart = this$1.pos;
      }
      chunkStart = this$1.pos;
    } else {
      ++this$1.pos;
    }
  }
};

// Reads a template token to search for the end, without validating any escape sequences
pp$8.readInvalidTemplateToken = function() {
  var this$1 = this;

  for (; this.pos < this.input.length; this.pos++) {
    switch (this$1.input[this$1.pos]) {
    case "\\":
      ++this$1.pos;
      break

    case "$":
      if (this$1.input[this$1.pos + 1] !== "{") {
        break
      }
    // falls through

    case "`":
      return this$1.finishToken(types.invalidTemplate, this$1.input.slice(this$1.start, this$1.pos))

    // no default
    }
  }
  this.raise(this.start, "Unterminated template");
};

// Used to read escaped characters

pp$8.readEscapedChar = function(inTemplate) {
  var ch = this.input.charCodeAt(++this.pos);
  ++this.pos;
  switch (ch) {
  case 110: return "\n" // 'n' -> '\n'
  case 114: return "\r" // 'r' -> '\r'
  case 120: return String.fromCharCode(this.readHexChar(2)) // 'x'
  case 117: return codePointToString(this.readCodePoint()) // 'u'
  case 116: return "\t" // 't' -> '\t'
  case 98: return "\b" // 'b' -> '\b'
  case 118: return "\u000b" // 'v' -> '\u000b'
  case 102: return "\f" // 'f' -> '\f'
  case 13: if (this.input.charCodeAt(this.pos) === 10) { ++this.pos; } // '\r\n'
  case 10: // ' \n'
    if (this.options.locations) { this.lineStart = this.pos; ++this.curLine; }
    return ""
  default:
    if (ch >= 48 && ch <= 55) {
      var octalStr = this.input.substr(this.pos - 1, 3).match(/^[0-7]+/)[0];
      var octal = parseInt(octalStr, 8);
      if (octal > 255) {
        octalStr = octalStr.slice(0, -1);
        octal = parseInt(octalStr, 8);
      }
      this.pos += octalStr.length - 1;
      ch = this.input.charCodeAt(this.pos);
      if ((octalStr !== "0" || ch === 56 || ch === 57) && (this.strict || inTemplate)) {
        this.invalidStringToken(
          this.pos - 1 - octalStr.length,
          inTemplate
            ? "Octal literal in template string"
            : "Octal literal in strict mode"
        );
      }
      return String.fromCharCode(octal)
    }
    return String.fromCharCode(ch)
  }
};

// Used to read character escape sequences ('\x', '\u', '\U').

pp$8.readHexChar = function(len) {
  var codePos = this.pos;
  var n = this.readInt(16, len);
  if (n === null) { this.invalidStringToken(codePos, "Bad character escape sequence"); }
  return n
};

// Read an identifier, and return it as a string. Sets `this.containsEsc`
// to whether the word contained a '\u' escape.
//
// Incrementally adds only escaped chars, adding other chunks as-is
// as a micro-optimization.

pp$8.readWord1 = function() {
  var this$1 = this;

  this.containsEsc = false;
  var word = "", first = true, chunkStart = this.pos;
  var astral = this.options.ecmaVersion >= 6;
  while (this.pos < this.input.length) {
    var ch = this$1.fullCharCodeAtPos();
    if (isIdentifierChar(ch, astral)) {
      this$1.pos += ch <= 0xffff ? 1 : 2;
    } else if (ch === 92) { // "\"
      this$1.containsEsc = true;
      word += this$1.input.slice(chunkStart, this$1.pos);
      var escStart = this$1.pos;
      if (this$1.input.charCodeAt(++this$1.pos) !== 117) // "u"
        { this$1.invalidStringToken(this$1.pos, "Expecting Unicode escape sequence \\uXXXX"); }
      ++this$1.pos;
      var esc = this$1.readCodePoint();
      if (!(first ? isIdentifierStart : isIdentifierChar)(esc, astral))
        { this$1.invalidStringToken(escStart, "Invalid Unicode escape"); }
      word += codePointToString(esc);
      chunkStart = this$1.pos;
    } else {
      break
    }
    first = false;
  }
  return word + this.input.slice(chunkStart, this.pos)
};

// Read an identifier or keyword token. Will check for reserved
// words when necessary.

pp$8.readWord = function() {
  var word = this.readWord1();
  var type = types.name;
  if (this.keywords.test(word)) {
    if (this.containsEsc) { this.raiseRecoverable(this.start, "Escape sequence in keyword " + word); }
    type = keywords$1[word];
  }
  return this.finishToken(type, word)
};

// Acorn is a tiny, fast JavaScript parser written in JavaScript.
//
// Acorn was written by Marijn Haverbeke, Ingvar Stepanyan, and
// various contributors and released under an MIT license.
//
// Git repositories for Acorn are available at
//
//     http://marijnhaverbeke.nl/git/acorn
//     https://github.com/acornjs/acorn.git
//
// Please use the [github bug tracker][ghbt] to report issues.
//
// [ghbt]: https://github.com/acornjs/acorn/issues
//
// This file defines the main parser interface. The library also comes
// with a [error-tolerant parser][dammit] and an
// [abstract syntax tree walker][walk], defined in other files.
//
// [dammit]: acorn_loose.js
// [walk]: util/walk.js

var version = "5.7.1";

// The main exported interface (under `self.acorn` when in the
// browser) is a `parse` function that takes a code string and
// returns an abstract syntax tree as specified by [Mozilla parser
// API][api].
//
// [api]: https://developer.mozilla.org/en-US/docs/SpiderMonkey/Parser_API

function parse(input, options) {
  return new Parser(options, input).parse()
}

// This function tries to parse a single expression at a given
// offset in a string. Useful for parsing mixed-language formats
// that embed JavaScript expressions.

function parseExpressionAt(input, pos, options) {
  var p = new Parser(options, input, pos);
  p.nextToken();
  return p.parseExpression()
}

// Acorn is organized as a tokenizer and a recursive-descent parser.
// The `tokenizer` export provides an interface to the tokenizer.

function tokenizer(input, options) {
  return new Parser(options, input)
}

// This is a terrible kludge to support the existing, pre-ES6
// interface where the loose parser module retroactively adds exports
// to this module.
 // eslint-disable-line camelcase
function addLooseExports(parse, Parser$$1, plugins$$1) {
  exports.parse_dammit = parse; // eslint-disable-line camelcase
  exports.LooseParser = Parser$$1;
  exports.pluginsLoose = plugins$$1;
}

exports.version = version;
exports.parse = parse;
exports.parseExpressionAt = parseExpressionAt;
exports.tokenizer = tokenizer;
exports.addLooseExports = addLooseExports;
exports.Parser = Parser;
exports.plugins = plugins;
exports.defaultOptions = defaultOptions;
exports.Position = Position;
exports.SourceLocation = SourceLocation;
exports.getLineInfo = getLineInfo;
exports.Node = Node;
exports.TokenType = TokenType;
exports.tokTypes = types;
exports.keywordTypes = keywords$1;
exports.TokContext = TokContext;
exports.tokContexts = types$1;
exports.isIdentifierChar = isIdentifierChar;
exports.isIdentifierStart = isIdentifierStart;
exports.Token = Token;
exports.isNewLine = isNewLine;
exports.lineBreak = lineBreak;
exports.lineBreakG = lineBreakG;
exports.nonASCIIwhitespace = nonASCIIwhitespace;

Object.defineProperty(exports, '__esModule', { value: true });

})));

},{}],35:[function(require,module,exports){
(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(factory((global.acorn = global.acorn || {}, global.acorn.walk = {})));
}(this, (function (exports) { 'use strict';

// AST walker module for Mozilla Parser API compatible trees

// A simple walk is one where you simply specify callbacks to be
// called on specific nodes. The last two arguments are optional. A
// simple use would be
//
//     walk.simple(myTree, {
//         Expression: function(node) { ... }
//     });
//
// to do something with all expressions. All Parser API node types
// can be used to identify node types, as well as Expression,
// Statement, and ScopeBody, which denote categories of nodes.
//
// The base argument can be used to pass a custom (recursive)
// walker, and state can be used to give this walked an initial
// state.

function simple(node, visitors, baseVisitor, state, override) {
  if (!baseVisitor) { baseVisitor = base
  ; }(function c(node, st, override) {
    var type = override || node.type, found = visitors[type];
    baseVisitor[type](node, st, c);
    if (found) { found(node, st); }
  })(node, state, override);
}

// An ancestor walk keeps an array of ancestor nodes (including the
// current node) and passes them to the callback as third parameter
// (and also as state parameter when no other state is present).
function ancestor(node, visitors, baseVisitor, state) {
  var ancestors = [];
  if (!baseVisitor) { baseVisitor = base
  ; }(function c(node, st, override) {
    var type = override || node.type, found = visitors[type];
    var isNew = node !== ancestors[ancestors.length - 1];
    if (isNew) { ancestors.push(node); }
    baseVisitor[type](node, st, c);
    if (found) { found(node, st || ancestors, ancestors); }
    if (isNew) { ancestors.pop(); }
  })(node, state);
}

// A recursive walk is one where your functions override the default
// walkers. They can modify and replace the state parameter that's
// threaded through the walk, and can opt how and whether to walk
// their child nodes (by calling their third argument on these
// nodes).
function recursive(node, state, funcs, baseVisitor, override) {
  var visitor = funcs ? make(funcs, baseVisitor || undefined) : baseVisitor;(function c(node, st, override) {
    visitor[override || node.type](node, st, c);
  })(node, state, override);
}

function makeTest(test) {
  if (typeof test === "string")
    { return function (type) { return type === test; } }
  else if (!test)
    { return function () { return true; } }
  else
    { return test }
}

var Found = function Found(node, state) { this.node = node; this.state = state; };

// A full walk triggers the callback on each node
function full(node, callback, baseVisitor, state, override) {
  if (!baseVisitor) { baseVisitor = base
  ; }(function c(node, st, override) {
    var type = override || node.type;
    baseVisitor[type](node, st, c);
    if (!override) { callback(node, st, type); }
  })(node, state, override);
}

// An fullAncestor walk is like an ancestor walk, but triggers
// the callback on each node
function fullAncestor(node, callback, baseVisitor, state) {
  if (!baseVisitor) { baseVisitor = base; }
  var ancestors = [];(function c(node, st, override) {
    var type = override || node.type;
    var isNew = node !== ancestors[ancestors.length - 1];
    if (isNew) { ancestors.push(node); }
    baseVisitor[type](node, st, c);
    if (!override) { callback(node, st || ancestors, ancestors, type); }
    if (isNew) { ancestors.pop(); }
  })(node, state);
}

// Find a node with a given start, end, and type (all are optional,
// null can be used as wildcard). Returns a {node, state} object, or
// undefined when it doesn't find a matching node.
function findNodeAt(node, start, end, test, baseVisitor, state) {
  if (!baseVisitor) { baseVisitor = base; }
  test = makeTest(test);
  try {
    (function c(node, st, override) {
      var type = override || node.type;
      if ((start == null || node.start <= start) &&
          (end == null || node.end >= end))
        { baseVisitor[type](node, st, c); }
      if ((start == null || node.start === start) &&
          (end == null || node.end === end) &&
          test(type, node))
        { throw new Found(node, st) }
    })(node, state);
  } catch (e) {
    if (e instanceof Found) { return e }
    throw e
  }
}

// Find the innermost node of a given type that contains the given
// position. Interface similar to findNodeAt.
function findNodeAround(node, pos, test, baseVisitor, state) {
  test = makeTest(test);
  if (!baseVisitor) { baseVisitor = base; }
  try {
    (function c(node, st, override) {
      var type = override || node.type;
      if (node.start > pos || node.end < pos) { return }
      baseVisitor[type](node, st, c);
      if (test(type, node)) { throw new Found(node, st) }
    })(node, state);
  } catch (e) {
    if (e instanceof Found) { return e }
    throw e
  }
}

// Find the outermost matching node after a given position.
function findNodeAfter(node, pos, test, baseVisitor, state) {
  test = makeTest(test);
  if (!baseVisitor) { baseVisitor = base; }
  try {
    (function c(node, st, override) {
      if (node.end < pos) { return }
      var type = override || node.type;
      if (node.start >= pos && test(type, node)) { throw new Found(node, st) }
      baseVisitor[type](node, st, c);
    })(node, state);
  } catch (e) {
    if (e instanceof Found) { return e }
    throw e
  }
}

// Find the outermost matching node before a given position.
function findNodeBefore(node, pos, test, baseVisitor, state) {
  test = makeTest(test);
  if (!baseVisitor) { baseVisitor = base; }
  var max;(function c(node, st, override) {
    if (node.start > pos) { return }
    var type = override || node.type;
    if (node.end <= pos && (!max || max.node.end < node.end) && test(type, node))
      { max = new Found(node, st); }
    baseVisitor[type](node, st, c);
  })(node, state);
  return max
}

// Fallback to an Object.create polyfill for older environments.
var create = Object.create || function(proto) {
  function Ctor() {}
  Ctor.prototype = proto;
  return new Ctor
};

// Used to create a custom walker. Will fill in all missing node
// type properties with the defaults.
function make(funcs, baseVisitor) {
  var visitor = create(baseVisitor || base);
  for (var type in funcs) { visitor[type] = funcs[type]; }
  return visitor
}

function skipThrough(node, st, c) { c(node, st); }
function ignore(_node, _st, _c) {}

// Node walkers.

var base = {};

base.Program = base.BlockStatement = function (node, st, c) {
  for (var i = 0, list = node.body; i < list.length; i += 1)
    {
    var stmt = list[i];

    c(stmt, st, "Statement");
  }
};
base.Statement = skipThrough;
base.EmptyStatement = ignore;
base.ExpressionStatement = base.ParenthesizedExpression =
  function (node, st, c) { return c(node.expression, st, "Expression"); };
base.IfStatement = function (node, st, c) {
  c(node.test, st, "Expression");
  c(node.consequent, st, "Statement");
  if (node.alternate) { c(node.alternate, st, "Statement"); }
};
base.LabeledStatement = function (node, st, c) { return c(node.body, st, "Statement"); };
base.BreakStatement = base.ContinueStatement = ignore;
base.WithStatement = function (node, st, c) {
  c(node.object, st, "Expression");
  c(node.body, st, "Statement");
};
base.SwitchStatement = function (node, st, c) {
  c(node.discriminant, st, "Expression");
  for (var i = 0, list = node.cases; i < list.length; i += 1) {
    var cs = list[i];

    if (cs.test) { c(cs.test, st, "Expression"); }
    for (var i$1 = 0, list$1 = cs.consequent; i$1 < list$1.length; i$1 += 1)
      {
      var cons = list$1[i$1];

      c(cons, st, "Statement");
    }
  }
};
base.SwitchCase = function (node, st, c) {
  if (node.test) { c(node.test, st, "Expression"); }
  for (var i = 0, list = node.consequent; i < list.length; i += 1)
    {
    var cons = list[i];

    c(cons, st, "Statement");
  }
};
base.ReturnStatement = base.YieldExpression = base.AwaitExpression = function (node, st, c) {
  if (node.argument) { c(node.argument, st, "Expression"); }
};
base.ThrowStatement = base.SpreadElement =
  function (node, st, c) { return c(node.argument, st, "Expression"); };
base.TryStatement = function (node, st, c) {
  c(node.block, st, "Statement");
  if (node.handler) { c(node.handler, st); }
  if (node.finalizer) { c(node.finalizer, st, "Statement"); }
};
base.CatchClause = function (node, st, c) {
  if (node.param) { c(node.param, st, "Pattern"); }
  c(node.body, st, "ScopeBody");
};
base.WhileStatement = base.DoWhileStatement = function (node, st, c) {
  c(node.test, st, "Expression");
  c(node.body, st, "Statement");
};
base.ForStatement = function (node, st, c) {
  if (node.init) { c(node.init, st, "ForInit"); }
  if (node.test) { c(node.test, st, "Expression"); }
  if (node.update) { c(node.update, st, "Expression"); }
  c(node.body, st, "Statement");
};
base.ForInStatement = base.ForOfStatement = function (node, st, c) {
  c(node.left, st, "ForInit");
  c(node.right, st, "Expression");
  c(node.body, st, "Statement");
};
base.ForInit = function (node, st, c) {
  if (node.type === "VariableDeclaration") { c(node, st); }
  else { c(node, st, "Expression"); }
};
base.DebuggerStatement = ignore;

base.FunctionDeclaration = function (node, st, c) { return c(node, st, "Function"); };
base.VariableDeclaration = function (node, st, c) {
  for (var i = 0, list = node.declarations; i < list.length; i += 1)
    {
    var decl = list[i];

    c(decl, st);
  }
};
base.VariableDeclarator = function (node, st, c) {
  c(node.id, st, "Pattern");
  if (node.init) { c(node.init, st, "Expression"); }
};

base.Function = function (node, st, c) {
  if (node.id) { c(node.id, st, "Pattern"); }
  for (var i = 0, list = node.params; i < list.length; i += 1)
    {
    var param = list[i];

    c(param, st, "Pattern");
  }
  c(node.body, st, node.expression ? "ScopeExpression" : "ScopeBody");
};
// FIXME drop these node types in next major version
// (They are awkward, and in ES6 every block can be a scope.)
base.ScopeBody = function (node, st, c) { return c(node, st, "Statement"); };
base.ScopeExpression = function (node, st, c) { return c(node, st, "Expression"); };

base.Pattern = function (node, st, c) {
  if (node.type === "Identifier")
    { c(node, st, "VariablePattern"); }
  else if (node.type === "MemberExpression")
    { c(node, st, "MemberPattern"); }
  else
    { c(node, st); }
};
base.VariablePattern = ignore;
base.MemberPattern = skipThrough;
base.RestElement = function (node, st, c) { return c(node.argument, st, "Pattern"); };
base.ArrayPattern = function (node, st, c) {
  for (var i = 0, list = node.elements; i < list.length; i += 1) {
    var elt = list[i];

    if (elt) { c(elt, st, "Pattern"); }
  }
};
base.ObjectPattern = function (node, st, c) {
  for (var i = 0, list = node.properties; i < list.length; i += 1) {
    var prop = list[i];

    if (prop.type === "Property") {
      if (prop.computed) { c(prop.key, st, "Expression"); }
      c(prop.value, st, "Pattern");
    } else if (prop.type === "RestElement") {
      c(prop.argument, st, "Pattern");
    }
  }
};

base.Expression = skipThrough;
base.ThisExpression = base.Super = base.MetaProperty = ignore;
base.ArrayExpression = function (node, st, c) {
  for (var i = 0, list = node.elements; i < list.length; i += 1) {
    var elt = list[i];

    if (elt) { c(elt, st, "Expression"); }
  }
};
base.ObjectExpression = function (node, st, c) {
  for (var i = 0, list = node.properties; i < list.length; i += 1)
    {
    var prop = list[i];

    c(prop, st);
  }
};
base.FunctionExpression = base.ArrowFunctionExpression = base.FunctionDeclaration;
base.SequenceExpression = base.TemplateLiteral = function (node, st, c) {
  for (var i = 0, list = node.expressions; i < list.length; i += 1)
    {
    var expr = list[i];

    c(expr, st, "Expression");
  }
};
base.UnaryExpression = base.UpdateExpression = function (node, st, c) {
  c(node.argument, st, "Expression");
};
base.BinaryExpression = base.LogicalExpression = function (node, st, c) {
  c(node.left, st, "Expression");
  c(node.right, st, "Expression");
};
base.AssignmentExpression = base.AssignmentPattern = function (node, st, c) {
  c(node.left, st, "Pattern");
  c(node.right, st, "Expression");
};
base.ConditionalExpression = function (node, st, c) {
  c(node.test, st, "Expression");
  c(node.consequent, st, "Expression");
  c(node.alternate, st, "Expression");
};
base.NewExpression = base.CallExpression = function (node, st, c) {
  c(node.callee, st, "Expression");
  if (node.arguments)
    { for (var i = 0, list = node.arguments; i < list.length; i += 1)
      {
        var arg = list[i];

        c(arg, st, "Expression");
      } }
};
base.MemberExpression = function (node, st, c) {
  c(node.object, st, "Expression");
  if (node.computed) { c(node.property, st, "Expression"); }
};
base.ExportNamedDeclaration = base.ExportDefaultDeclaration = function (node, st, c) {
  if (node.declaration)
    { c(node.declaration, st, node.type === "ExportNamedDeclaration" || node.declaration.id ? "Statement" : "Expression"); }
  if (node.source) { c(node.source, st, "Expression"); }
};
base.ExportAllDeclaration = function (node, st, c) {
  c(node.source, st, "Expression");
};
base.ImportDeclaration = function (node, st, c) {
  for (var i = 0, list = node.specifiers; i < list.length; i += 1)
    {
    var spec = list[i];

    c(spec, st);
  }
  c(node.source, st, "Expression");
};
base.ImportSpecifier = base.ImportDefaultSpecifier = base.ImportNamespaceSpecifier = base.Identifier = base.Literal = ignore;

base.TaggedTemplateExpression = function (node, st, c) {
  c(node.tag, st, "Expression");
  c(node.quasi, st, "Expression");
};
base.ClassDeclaration = base.ClassExpression = function (node, st, c) { return c(node, st, "Class"); };
base.Class = function (node, st, c) {
  if (node.id) { c(node.id, st, "Pattern"); }
  if (node.superClass) { c(node.superClass, st, "Expression"); }
  c(node.body, st);
};
base.ClassBody = function (node, st, c) {
  for (var i = 0, list = node.body; i < list.length; i += 1)
    {
    var elt = list[i];

    c(elt, st);
  }
};
base.MethodDefinition = base.Property = function (node, st, c) {
  if (node.computed) { c(node.key, st, "Expression"); }
  c(node.value, st, "Expression");
};

exports.simple = simple;
exports.ancestor = ancestor;
exports.recursive = recursive;
exports.full = full;
exports.fullAncestor = fullAncestor;
exports.findNodeAt = findNodeAt;
exports.findNodeAround = findNodeAround;
exports.findNodeAfter = findNodeAfter;
exports.findNodeBefore = findNodeBefore;
exports.make = make;
exports.base = base;

Object.defineProperty(exports, '__esModule', { value: true });

})));

},{}],36:[function(require,module,exports){
(function (global, factory) {
  if (typeof define === "function" && define.amd) {
    define(['exports'], factory);
  } else if (typeof exports !== "undefined") {
    factory(exports);
  } else {
    var mod = {
      exports: {}
    };
    factory(mod.exports);
    global.astring = mod.exports;
  }
})(this, function (exports) {
  'use strict';

  exports.__esModule = true;
  exports.generate = generate;

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  var stringify = JSON.stringify;


  /* istanbul ignore if */
  if (!String.prototype.repeat) {
    /* istanbul ignore next */
    throw new Error('String.prototype.repeat is undefined, see https://github.com/davidbonnet/astring#installation');
  }

  /* istanbul ignore if */
  if (!String.prototype.endsWith) {
    /* istanbul ignore next */
    throw new Error('String.prototype.endsWith is undefined, see https://github.com/davidbonnet/astring#installation');
  }

  var OPERATOR_PRECEDENCE = {
    '||': 3,
    '&&': 4,
    '|': 5,
    '^': 6,
    '&': 7,
    '==': 8,
    '!=': 8,
    '===': 8,
    '!==': 8,
    '<': 9,
    '>': 9,
    '<=': 9,
    '>=': 9,
    in: 9,
    instanceof: 9,
    '<<': 10,
    '>>': 10,
    '>>>': 10,
    '+': 11,
    '-': 11,
    '*': 12,
    '%': 12,
    '/': 12,
    '**': 13

    // Enables parenthesis regardless of precedence
  };var NEEDS_PARENTHESES = 17;

  var EXPRESSIONS_PRECEDENCE = {
    // Definitions
    ArrayExpression: 20,
    TaggedTemplateExpression: 20,
    ThisExpression: 20,
    Identifier: 20,
    Literal: 18,
    TemplateLiteral: 20,
    Super: 20,
    SequenceExpression: 20,
    // Operations
    MemberExpression: 19,
    CallExpression: 19,
    NewExpression: 19,
    // Other definitions
    ArrowFunctionExpression: NEEDS_PARENTHESES,
    ClassExpression: NEEDS_PARENTHESES,
    FunctionExpression: NEEDS_PARENTHESES,
    ObjectExpression: NEEDS_PARENTHESES,
    // Other operations
    UpdateExpression: 16,
    UnaryExpression: 15,
    BinaryExpression: 14,
    LogicalExpression: 13,
    ConditionalExpression: 4,
    AssignmentExpression: 3,
    AwaitExpression: 2,
    YieldExpression: 2,
    RestElement: 1
  };

  function formatSequence(state, nodes) {
    var generator = state.generator;

    state.write('(');
    if (nodes != null && nodes.length > 0) {
      generator[nodes[0].type](nodes[0], state);
      var length = nodes.length;

      for (var i = 1; i < length; i++) {
        var param = nodes[i];
        state.write(', ');
        generator[param.type](param, state);
      }
    }
    state.write(')');
  }

  function expressionNeedsParenthesis(node, parentNode, isRightHand) {
    var nodePrecedence = EXPRESSIONS_PRECEDENCE[node.type];
    if (nodePrecedence === NEEDS_PARENTHESES) {
      return true;
    }
    var parentNodePrecedence = EXPRESSIONS_PRECEDENCE[parentNode.type];
    if (nodePrecedence !== parentNodePrecedence) {
      // Different node types
      return nodePrecedence < parentNodePrecedence;
    }
    if (nodePrecedence !== 13 && nodePrecedence !== 14) {
      // Not a `LogicalExpression` or `BinaryExpression`
      return false;
    }
    if (node.operator === '**' && parentNode.operator === '**') {
      // Exponentiation operator has right-to-left associativity
      return !isRightHand;
    }
    if (isRightHand) {
      // Parenthesis are used if both operators have the same precedence
      return OPERATOR_PRECEDENCE[node.operator] <= OPERATOR_PRECEDENCE[parentNode.operator];
    }
    return OPERATOR_PRECEDENCE[node.operator] < OPERATOR_PRECEDENCE[parentNode.operator];
  }

  function formatBinaryExpressionPart(state, node, parentNode, isRightHand) {
    var generator = state.generator;

    if (expressionNeedsParenthesis(node, parentNode, isRightHand)) {
      state.write('(');
      generator[node.type](node, state);
      state.write(')');
    } else {
      generator[node.type](node, state);
    }
  }

  function reindent(state, text, indent, lineEnd) {
    /*
    Writes into `state` the `text` string reindented with the provided `indent`.
    */
    var lines = text.split('\n');
    var end = lines.length - 1;
    state.write(lines[0].trim());
    if (end > 0) {
      state.write(lineEnd);
      for (var i = 1; i < end; i++) {
        state.write(indent + lines[i].trim() + lineEnd);
      }
      state.write(indent + lines[end].trim());
    }
  }

  function formatComments(state, comments, indent, lineEnd) {
    var length = comments.length;

    for (var i = 0; i < length; i++) {
      var comment = comments[i];
      state.write(indent);
      if (comment.type[0] === 'L') {
        // Line comment
        state.write('// ' + comment.value.trim() + '\n');
      } else {
        // Block comment
        state.write('/*');
        reindent(state, comment.value, indent, lineEnd);
        state.write('*/' + lineEnd);
      }
    }
  }

  function hasCallExpression(node) {
    /*
    Returns `true` if the provided `node` contains a call expression and `false` otherwise.
    */
    var currentNode = node;
    while (currentNode != null) {
      var _currentNode = currentNode,
          type = _currentNode.type;

      if (type[0] === 'C' && type[1] === 'a') {
        // Is CallExpression
        return true;
      } else if (type[0] === 'M' && type[1] === 'e' && type[2] === 'm') {
        // Is MemberExpression
        currentNode = currentNode.object;
      } else {
        return false;
      }
    }
  }

  function formatVariableDeclaration(state, node) {
    var generator = state.generator;
    var declarations = node.declarations;

    state.write(node.kind + ' ');
    var length = declarations.length;

    if (length > 0) {
      generator.VariableDeclarator(declarations[0], state);
      for (var i = 1; i < length; i++) {
        state.write(', ');
        generator.VariableDeclarator(declarations[i], state);
      }
    }
  }

  var ForInStatement = void 0,
      FunctionDeclaration = void 0,
      RestElement = void 0,
      BinaryExpression = void 0,
      ArrayExpression = void 0,
      BlockStatement = void 0;

  var baseGenerator = exports.baseGenerator = {
    Program: function Program(node, state) {
      var indent = state.indent.repeat(state.indentLevel);
      var lineEnd = state.lineEnd,
          writeComments = state.writeComments;

      if (writeComments && node.comments != null) {
        formatComments(state, node.comments, indent, lineEnd);
      }
      var statements = node.body;
      var length = statements.length;

      for (var i = 0; i < length; i++) {
        var statement = statements[i];
        if (writeComments && statement.comments != null) {
          formatComments(state, statement.comments, indent, lineEnd);
        }
        state.write(indent);
        this[statement.type](statement, state);
        state.write(lineEnd);
      }
      if (writeComments && node.trailingComments != null) {
        formatComments(state, node.trailingComments, indent, lineEnd);
      }
    },

    BlockStatement: BlockStatement = function BlockStatement(node, state) {
      var indent = state.indent.repeat(state.indentLevel++);
      var lineEnd = state.lineEnd,
          writeComments = state.writeComments;

      var statementIndent = indent + state.indent;
      state.write('{');
      var statements = node.body;
      if (statements != null && statements.length > 0) {
        state.write(lineEnd);
        if (writeComments && node.comments != null) {
          formatComments(state, node.comments, statementIndent, lineEnd);
        }
        var length = statements.length;

        for (var i = 0; i < length; i++) {
          var statement = statements[i];
          if (writeComments && statement.comments != null) {
            formatComments(state, statement.comments, statementIndent, lineEnd);
          }
          state.write(statementIndent);
          this[statement.type](statement, state);
          state.write(lineEnd);
        }
        state.write(indent);
      } else {
        if (writeComments && node.comments != null) {
          state.write(lineEnd);
          formatComments(state, node.comments, statementIndent, lineEnd);
          state.write(indent);
        }
      }
      if (writeComments && node.trailingComments != null) {
        formatComments(state, node.trailingComments, statementIndent, lineEnd);
      }
      state.write('}');
      state.indentLevel--;
    },
    ClassBody: BlockStatement,
    EmptyStatement: function EmptyStatement(node, state) {
      state.write(';');
    },
    ExpressionStatement: function ExpressionStatement(node, state) {
      var precedence = EXPRESSIONS_PRECEDENCE[node.expression.type];
      if (precedence === NEEDS_PARENTHESES || precedence === 3 && node.expression.left.type[0] === 'O') {
        // Should always have parentheses or is an AssignmentExpression to an ObjectPattern
        state.write('(');
        this[node.expression.type](node.expression, state);
        state.write(')');
      } else {
        this[node.expression.type](node.expression, state);
      }
      state.write(';');
    },
    IfStatement: function IfStatement(node, state) {
      state.write('if (');
      this[node.test.type](node.test, state);
      state.write(') ');
      this[node.consequent.type](node.consequent, state);
      if (node.alternate != null) {
        state.write(' else ');
        this[node.alternate.type](node.alternate, state);
      }
    },
    LabeledStatement: function LabeledStatement(node, state) {
      this[node.label.type](node.label, state);
      state.write(': ');
      this[node.body.type](node.body, state);
    },
    BreakStatement: function BreakStatement(node, state) {
      state.write('break');
      if (node.label != null) {
        state.write(' ');
        this[node.label.type](node.label, state);
      }
      state.write(';');
    },
    ContinueStatement: function ContinueStatement(node, state) {
      state.write('continue');
      if (node.label != null) {
        state.write(' ');
        this[node.label.type](node.label, state);
      }
      state.write(';');
    },
    WithStatement: function WithStatement(node, state) {
      state.write('with (');
      this[node.object.type](node.object, state);
      state.write(') ');
      this[node.body.type](node.body, state);
    },
    SwitchStatement: function SwitchStatement(node, state) {
      var indent = state.indent.repeat(state.indentLevel++);
      var lineEnd = state.lineEnd,
          writeComments = state.writeComments;

      state.indentLevel++;
      var caseIndent = indent + state.indent;
      var statementIndent = caseIndent + state.indent;
      state.write('switch (');
      this[node.discriminant.type](node.discriminant, state);
      state.write(') {' + lineEnd);
      var occurences = node.cases;
      var occurencesCount = occurences.length;

      for (var i = 0; i < occurencesCount; i++) {
        var occurence = occurences[i];
        if (writeComments && occurence.comments != null) {
          formatComments(state, occurence.comments, caseIndent, lineEnd);
        }
        if (occurence.test) {
          state.write(caseIndent + 'case ');
          this[occurence.test.type](occurence.test, state);
          state.write(':' + lineEnd);
        } else {
          state.write(caseIndent + 'default:' + lineEnd);
        }
        var consequent = occurence.consequent;
        var consequentCount = consequent.length;

        for (var _i = 0; _i < consequentCount; _i++) {
          var statement = consequent[_i];
          if (writeComments && statement.comments != null) {
            formatComments(state, statement.comments, statementIndent, lineEnd);
          }
          state.write(statementIndent);
          this[statement.type](statement, state);
          state.write(lineEnd);
        }
      }
      state.indentLevel -= 2;
      state.write(indent + '}');
    },
    ReturnStatement: function ReturnStatement(node, state) {
      state.write('return');
      if (node.argument) {
        state.write(' ');
        this[node.argument.type](node.argument, state);
      }
      state.write(';');
    },
    ThrowStatement: function ThrowStatement(node, state) {
      state.write('throw ');
      this[node.argument.type](node.argument, state);
      state.write(';');
    },
    TryStatement: function TryStatement(node, state) {
      state.write('try ');
      this[node.block.type](node.block, state);
      if (node.handler) {
        var handler = node.handler;

        state.write(' catch (');
        this[handler.param.type](handler.param, state);
        state.write(') ');
        this[handler.body.type](handler.body, state);
      }
      if (node.finalizer) {
        state.write(' finally ');
        this[node.finalizer.type](node.finalizer, state);
      }
    },
    WhileStatement: function WhileStatement(node, state) {
      state.write('while (');
      this[node.test.type](node.test, state);
      state.write(') ');
      this[node.body.type](node.body, state);
    },
    DoWhileStatement: function DoWhileStatement(node, state) {
      state.write('do ');
      this[node.body.type](node.body, state);
      state.write(' while (');
      this[node.test.type](node.test, state);
      state.write(');');
    },
    ForStatement: function ForStatement(node, state) {
      state.write('for (');
      if (node.init != null) {
        var init = node.init;

        if (init.type[0] === 'V') {
          formatVariableDeclaration(state, init);
        } else {
          this[init.type](init, state);
        }
      }
      state.write('; ');
      if (node.test) {
        this[node.test.type](node.test, state);
      }
      state.write('; ');
      if (node.update) {
        this[node.update.type](node.update, state);
      }
      state.write(') ');
      this[node.body.type](node.body, state);
    },

    ForInStatement: ForInStatement = function ForInStatement(node, state) {
      state.write('for (');
      var left = node.left;

      if (left.type[0] === 'V') {
        formatVariableDeclaration(state, left);
      } else {
        this[left.type](left, state);
      }
      // Identifying whether node.type is `ForInStatement` or `ForOfStatement`
      state.write(node.type[3] === 'I' ? ' in ' : ' of ');
      this[node.right.type](node.right, state);
      state.write(') ');
      this[node.body.type](node.body, state);
    },
    ForOfStatement: ForInStatement,
    DebuggerStatement: function DebuggerStatement(node, state) {
      state.write('debugger;' + state.lineEnd);
    },

    FunctionDeclaration: FunctionDeclaration = function FunctionDeclaration(node, state) {
      state.write((node.async ? 'async ' : '') + (node.generator ? 'function* ' : 'function ') + (node.id ? node.id.name : ''), node);
      formatSequence(state, node.params);
      state.write(' ');
      this[node.body.type](node.body, state);
    },
    FunctionExpression: FunctionDeclaration,
    VariableDeclaration: function VariableDeclaration(node, state) {
      formatVariableDeclaration(state, node);
      state.write(';');
    },
    VariableDeclarator: function VariableDeclarator(node, state) {
      this[node.id.type](node.id, state);
      if (node.init != null) {
        state.write(' = ');
        this[node.init.type](node.init, state);
      }
    },
    ClassDeclaration: function ClassDeclaration(node, state) {
      state.write('class ' + (node.id ? node.id.name + ' ' : ''), node);
      if (node.superClass) {
        state.write('extends ');
        this[node.superClass.type](node.superClass, state);
        state.write(' ');
      }
      this.ClassBody(node.body, state);
    },
    ImportDeclaration: function ImportDeclaration(node, state) {
      state.write('import ');
      var specifiers = node.specifiers;
      var length = specifiers.length;
      // NOTE: Once babili is fixed, put this after condition
      // https://github.com/babel/babili/issues/430

      var i = 0;
      if (length > 0) {
        for (; i < length;) {
          if (i > 0) {
            state.write(', ');
          }
          var specifier = specifiers[i];
          var type = specifier.type[6];
          if (type === 'D') {
            // ImportDefaultSpecifier
            state.write(specifier.local.name, specifier);
            i++;
          } else if (type === 'N') {
            // ImportNamespaceSpecifier
            state.write('* as ' + specifier.local.name, specifier);
            i++;
          } else {
            // ImportSpecifier
            break;
          }
        }
        if (i < length) {
          state.write('{');
          for (;;) {
            var _specifier = specifiers[i];
            var name = _specifier.imported.name;

            state.write(name, _specifier);
            if (name !== _specifier.local.name) {
              state.write(' as ' + _specifier.local.name);
            }
            if (++i < length) {
              state.write(', ');
            } else {
              break;
            }
          }
          state.write('}');
        }
        state.write(' from ');
      }
      this.Literal(node.source, state);
      state.write(';');
    },
    ExportDefaultDeclaration: function ExportDefaultDeclaration(node, state) {
      state.write('export default ');
      this[node.declaration.type](node.declaration, state);
      if (EXPRESSIONS_PRECEDENCE[node.declaration.type] && node.declaration.type[0] !== 'F') {
        // All expression nodes except `FunctionExpression`
        state.write(';');
      }
    },
    ExportNamedDeclaration: function ExportNamedDeclaration(node, state) {
      state.write('export ');
      if (node.declaration) {
        this[node.declaration.type](node.declaration, state);
      } else {
        state.write('{');
        var specifiers = node.specifiers,
            length = specifiers.length;

        if (length > 0) {
          for (var i = 0;;) {
            var specifier = specifiers[i];
            var name = specifier.local.name;

            state.write(name, specifier);
            if (name !== specifier.exported.name) {
              state.write(' as ' + specifier.exported.name);
            }
            if (++i < length) {
              state.write(', ');
            } else {
              break;
            }
          }
        }
        state.write('}');
        if (node.source) {
          state.write(' from ');
          this.Literal(node.source, state);
        }
        state.write(';');
      }
    },
    ExportAllDeclaration: function ExportAllDeclaration(node, state) {
      state.write('export * from ');
      this.Literal(node.source, state);
      state.write(';');
    },
    MethodDefinition: function MethodDefinition(node, state) {
      if (node.static) {
        state.write('static ');
      }
      var kind = node.kind[0];
      if (kind === 'g' || kind === 's') {
        // Getter or setter
        state.write(node.kind + ' ');
      }
      if (node.value.async) {
        state.write('async ');
      }
      if (node.value.generator) {
        state.write('*');
      }
      if (node.computed) {
        state.write('[');
        this[node.key.type](node.key, state);
        state.write(']');
      } else {
        this[node.key.type](node.key, state);
      }
      formatSequence(state, node.value.params);
      state.write(' ');
      this[node.value.body.type](node.value.body, state);
    },
    ClassExpression: function ClassExpression(node, state) {
      this.ClassDeclaration(node, state);
    },
    ArrowFunctionExpression: function ArrowFunctionExpression(node, state) {
      state.write(node.async ? 'async ' : '', node);
      var params = node.params;

      if (params != null) {
        // Omit parenthesis if only one named parameter
        if (params.length === 1 && params[0].type[0] === 'I') {
          // If params[0].type[0] starts with 'I', it can't be `ImportDeclaration` nor `IfStatement` and thus is `Identifier`
          state.write(params[0].name, params[0]);
        } else {
          formatSequence(state, node.params);
        }
      }
      state.write(' => ');
      if (node.body.type[0] === 'O') {
        // Body is an object expression
        state.write('(');
        this.ObjectExpression(node.body, state);
        state.write(')');
      } else {
        this[node.body.type](node.body, state);
      }
    },
    ThisExpression: function ThisExpression(node, state) {
      state.write('this', node);
    },
    Super: function Super(node, state) {
      state.write('super', node);
    },

    RestElement: RestElement = function RestElement(node, state) {
      state.write('...');
      this[node.argument.type](node.argument, state);
    },
    SpreadElement: RestElement,
    YieldExpression: function YieldExpression(node, state) {
      state.write(node.delegate ? 'yield*' : 'yield');
      if (node.argument) {
        state.write(' ');
        this[node.argument.type](node.argument, state);
      }
    },
    AwaitExpression: function AwaitExpression(node, state) {
      state.write('await ');
      if (node.argument) {
        this[node.argument.type](node.argument, state);
      }
    },
    TemplateLiteral: function TemplateLiteral(node, state) {
      var quasis = node.quasis,
          expressions = node.expressions;

      state.write('`');
      var length = expressions.length;

      for (var i = 0; i < length; i++) {
        var expression = expressions[i];
        state.write(quasis[i].value.raw);
        state.write('${');
        this[expression.type](expression, state);
        state.write('}');
      }
      state.write(quasis[quasis.length - 1].value.raw);
      state.write('`');
    },
    TaggedTemplateExpression: function TaggedTemplateExpression(node, state) {
      this[node.tag.type](node.tag, state);
      this[node.quasi.type](node.quasi, state);
    },

    ArrayExpression: ArrayExpression = function ArrayExpression(node, state) {
      state.write('[');
      if (node.elements.length > 0) {
        var elements = node.elements,
            length = elements.length;

        for (var i = 0;;) {
          var element = elements[i];
          if (element != null) {
            this[element.type](element, state);
          }
          if (++i < length) {
            state.write(', ');
          } else {
            if (element == null) {
              state.write(', ');
            }
            break;
          }
        }
      }
      state.write(']');
    },
    ArrayPattern: ArrayExpression,
    ObjectExpression: function ObjectExpression(node, state) {
      var indent = state.indent.repeat(state.indentLevel++);
      var lineEnd = state.lineEnd,
          writeComments = state.writeComments;

      var propertyIndent = indent + state.indent;
      state.write('{');
      if (node.properties.length > 0) {
        state.write(lineEnd);
        if (writeComments && node.comments != null) {
          formatComments(state, node.comments, propertyIndent, lineEnd);
        }
        var comma = ',' + lineEnd;
        var properties = node.properties,
            length = properties.length;

        for (var i = 0;;) {
          var property = properties[i];
          if (writeComments && property.comments != null) {
            formatComments(state, property.comments, propertyIndent, lineEnd);
          }
          state.write(propertyIndent);
          this.Property(property, state);
          if (++i < length) {
            state.write(comma);
          } else {
            break;
          }
        }
        state.write(lineEnd);
        if (writeComments && node.trailingComments != null) {
          formatComments(state, node.trailingComments, propertyIndent, lineEnd);
        }
        state.write(indent + '}');
      } else if (writeComments) {
        if (node.comments != null) {
          state.write(lineEnd);
          formatComments(state, node.comments, propertyIndent, lineEnd);
          if (node.trailingComments != null) {
            formatComments(state, node.trailingComments, propertyIndent, lineEnd);
          }
          state.write(indent + '}');
        } else if (node.trailingComments != null) {
          state.write(lineEnd);
          formatComments(state, node.trailingComments, propertyIndent, lineEnd);
          state.write(indent + '}');
        } else {
          state.write('}');
        }
      } else {
        state.write('}');
      }
      state.indentLevel--;
    },
    Property: function Property(node, state) {
      if (node.method || node.kind[0] !== 'i') {
        // Either a method or of kind `set` or `get` (not `init`)
        this.MethodDefinition(node, state);
      } else {
        if (!node.shorthand) {
          if (node.computed) {
            state.write('[');
            this[node.key.type](node.key, state);
            state.write(']');
          } else {
            this[node.key.type](node.key, state);
          }
          state.write(': ');
        }
        this[node.value.type](node.value, state);
      }
    },
    ObjectPattern: function ObjectPattern(node, state) {
      state.write('{');
      if (node.properties.length > 0) {
        var properties = node.properties,
            length = properties.length;

        for (var i = 0;;) {
          this[properties[i].type](properties[i], state);
          if (++i < length) {
            state.write(', ');
          } else {
            break;
          }
        }
      }
      state.write('}');
    },
    SequenceExpression: function SequenceExpression(node, state) {
      formatSequence(state, node.expressions);
    },
    UnaryExpression: function UnaryExpression(node, state) {
      if (node.prefix) {
        state.write(node.operator);
        if (node.operator.length > 1) {
          state.write(' ');
        }
        if (EXPRESSIONS_PRECEDENCE[node.argument.type] < EXPRESSIONS_PRECEDENCE.UnaryExpression) {
          state.write('(');
          this[node.argument.type](node.argument, state);
          state.write(')');
        } else {
          this[node.argument.type](node.argument, state);
        }
      } else {
        // FIXME: This case never occurs
        this[node.argument.type](node.argument, state);
        state.write(node.operator);
      }
    },
    UpdateExpression: function UpdateExpression(node, state) {
      // Always applied to identifiers or members, no parenthesis check needed
      if (node.prefix) {
        state.write(node.operator);
        this[node.argument.type](node.argument, state);
      } else {
        this[node.argument.type](node.argument, state);
        state.write(node.operator);
      }
    },
    AssignmentExpression: function AssignmentExpression(node, state) {
      this[node.left.type](node.left, state);
      state.write(' ' + node.operator + ' ');
      this[node.right.type](node.right, state);
    },
    AssignmentPattern: function AssignmentPattern(node, state) {
      this[node.left.type](node.left, state);
      state.write(' = ');
      this[node.right.type](node.right, state);
    },

    BinaryExpression: BinaryExpression = function BinaryExpression(node, state) {
      if (node.operator === 'in') {
        // Avoids confusion in `for` loops initializers
        state.write('(');
        formatBinaryExpressionPart(state, node.left, node, false);
        state.write(' ' + node.operator + ' ');
        formatBinaryExpressionPart(state, node.right, node, true);
        state.write(')');
      } else {
        formatBinaryExpressionPart(state, node.left, node, false);
        state.write(' ' + node.operator + ' ');
        formatBinaryExpressionPart(state, node.right, node, true);
      }
    },
    LogicalExpression: BinaryExpression,
    ConditionalExpression: function ConditionalExpression(node, state) {
      if (EXPRESSIONS_PRECEDENCE[node.test.type] > EXPRESSIONS_PRECEDENCE.ConditionalExpression) {
        this[node.test.type](node.test, state);
      } else {
        state.write('(');
        this[node.test.type](node.test, state);
        state.write(')');
      }
      state.write(' ? ');
      this[node.consequent.type](node.consequent, state);
      state.write(' : ');
      this[node.alternate.type](node.alternate, state);
    },
    NewExpression: function NewExpression(node, state) {
      state.write('new ');
      if (EXPRESSIONS_PRECEDENCE[node.callee.type] < EXPRESSIONS_PRECEDENCE.CallExpression || hasCallExpression(node.callee)) {
        state.write('(');
        this[node.callee.type](node.callee, state);
        state.write(')');
      } else {
        this[node.callee.type](node.callee, state);
      }
      formatSequence(state, node['arguments']);
    },
    CallExpression: function CallExpression(node, state) {
      if (EXPRESSIONS_PRECEDENCE[node.callee.type] < EXPRESSIONS_PRECEDENCE.CallExpression) {
        state.write('(');
        this[node.callee.type](node.callee, state);
        state.write(')');
      } else {
        this[node.callee.type](node.callee, state);
      }
      formatSequence(state, node['arguments']);
    },
    MemberExpression: function MemberExpression(node, state) {
      if (EXPRESSIONS_PRECEDENCE[node.object.type] < EXPRESSIONS_PRECEDENCE.MemberExpression) {
        state.write('(');
        this[node.object.type](node.object, state);
        state.write(')');
      } else {
        this[node.object.type](node.object, state);
      }
      if (node.computed) {
        state.write('[');
        this[node.property.type](node.property, state);
        state.write(']');
      } else {
        state.write('.');
        this[node.property.type](node.property, state);
      }
    },
    MetaProperty: function MetaProperty(node, state) {
      state.write(node.meta.name + '.' + node.property.name, node);
    },
    Identifier: function Identifier(node, state) {
      state.write(node.name, node);
    },
    Literal: function Literal(node, state) {
      if (node.raw != null) {
        state.write(node.raw, node);
      } else if (node.regex != null) {
        this.RegExpLiteral(node, state);
      } else {
        state.write(stringify(node.value), node);
      }
    },
    RegExpLiteral: function RegExpLiteral(node, state) {
      var regex = node.regex;

      state.write('/' + regex.pattern + '/' + regex.flags, node);
    }
  };

  var EMPTY_OBJECT = {};

  var State = function () {
    function State(options) {
      _classCallCheck(this, State);

      var setup = options == null ? EMPTY_OBJECT : options;
      this.output = '';
      // Functional options
      if (setup.output != null) {
        this.output = setup.output;
        this.write = this.writeToStream;
      } else {
        this.output = '';
      }
      this.generator = setup.generator != null ? setup.generator : baseGenerator;
      // Formating setup
      this.indent = setup.indent != null ? setup.indent : '  ';
      this.lineEnd = setup.lineEnd != null ? setup.lineEnd : '\n';
      this.indentLevel = setup.startingIndentLevel != null ? setup.startingIndentLevel : 0;
      this.writeComments = setup.comments ? setup.comments : false;
      // Source map
      if (setup.sourceMap != null) {
        this.write = setup.output == null ? this.writeAndMap : this.writeToStreamAndMap;
        this.sourceMap = setup.sourceMap;
        this.line = 1;
        this.column = 0;
        this.lineEndSize = this.lineEnd.split('\n').length - 1;
        this.mapping = {
          original: null,
          generated: this,
          name: undefined,
          source: setup.sourceMap.file || setup.sourceMap._file
        };
      }
    }

    State.prototype.write = function write(code) {
      this.output += code;
    };

    State.prototype.writeToStream = function writeToStream(code) {
      this.output.write(code);
    };

    State.prototype.writeAndMap = function writeAndMap(code, node) {
      this.output += code;
      this.map(code, node);
    };

    State.prototype.writeToStreamAndMap = function writeToStreamAndMap(code, node) {
      this.output.write(code);
      this.map(code, node);
    };

    State.prototype.map = function map(code, node) {
      if (node != null && node.loc != null) {
        var mapping = this.mapping;

        mapping.original = node.loc.start;
        mapping.name = node.name;
        this.sourceMap.addMapping(mapping);
      }
      if (code.length > 0) {
        if (this.lineEndSize > 0) {
          if (code.endsWith(this.lineEnd)) {
            this.line += this.lineEndSize;
            this.column = 0;
          } else if (code[code.length - 1] === '\n') {
            // Case of inline comment
            this.line++;
            this.column = 0;
          } else {
            this.column += code.length;
          }
        } else {
          if (code[code.length - 1] === '\n') {
            // Case of inline comment
            this.line++;
            this.column = 0;
          } else {
            this.column += code.length;
          }
        }
      }
    };

    State.prototype.toString = function toString() {
      return this.output;
    };

    return State;
  }();

  function generate(node, options) {
    /*
    Returns a string representing the rendered code of the provided AST `node`.
    The `options` are:
     - `indent`: string to use for indentation (defaults to `ΓÉúΓÉú`)
    - `lineEnd`: string to use for line endings (defaults to `\n`)
    - `startingIndentLevel`: indent level to start from (defaults to `0`)
    - `comments`: generate comments if `true` (defaults to `false`)
    - `output`: output stream to write the rendered code to (defaults to `null`)
    - `generator`: custom code generator (defaults to `baseGenerator`)
    */
    var state = new State(options);
    // Travel through the AST node and generate the code
    state.generator[node.type](node, state);
    return state.output;
  }
});


},{}],37:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _templateObject = _taggedTemplateLiteral(['', ''], ['', '']);

function _taggedTemplateLiteral(strings, raw) { return Object.freeze(Object.defineProperties(strings, { raw: { value: Object.freeze(raw) } })); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * @class TemplateTag
 * @classdesc Consumes a pipeline of composable transformer plugins and produces a template tag.
 */
var TemplateTag = function () {
  /**
   * constructs a template tag
   * @constructs TemplateTag
   * @param  {...Object} [...transformers] - an array or arguments list of transformers
   * @return {Function}                    - a template tag
   */
  function TemplateTag() {
    var _this = this;

    for (var _len = arguments.length, transformers = Array(_len), _key = 0; _key < _len; _key++) {
      transformers[_key] = arguments[_key];
    }

    _classCallCheck(this, TemplateTag);

    this.tag = function (strings) {
      for (var _len2 = arguments.length, expressions = Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
        expressions[_key2 - 1] = arguments[_key2];
      }

      if (typeof strings === 'function') {
        // if the first argument passed is a function, assume it is a template tag and return
        // an intermediary tag that processes the template using the aforementioned tag, passing the
        // result to our tag
        return _this.interimTag.bind(_this, strings);
      }

      if (typeof strings === 'string') {
        // if the first argument passed is a string, just transform it
        return _this.transformEndResult(strings);
      }

      // else, return a transformed end result of processing the template with our tag
      strings = strings.map(_this.transformString.bind(_this));
      return _this.transformEndResult(strings.reduce(_this.processSubstitutions.bind(_this, expressions)));
    };

    // if first argument is an array, extrude it as a list of transformers
    if (transformers.length > 0 && Array.isArray(transformers[0])) {
      transformers = transformers[0];
    }

    // if any transformers are functions, this means they are not initiated - automatically initiate them
    this.transformers = transformers.map(function (transformer) {
      return typeof transformer === 'function' ? transformer() : transformer;
    });

    // return an ES2015 template tag
    return this.tag;
  }

  /**
   * Applies all transformers to a template literal tagged with this method.
   * If a function is passed as the first argument, assumes the function is a template tag
   * and applies it to the template, returning a template tag.
   * @param  {(Function|String|Array<String>)} strings        - Either a template tag or an array containing template strings separated by identifier
   * @param  {...*}                            ...expressions - Optional list of substitution values.
   * @return {(String|Function)}                              - Either an intermediary tag function or the results of processing the template.
   */


  _createClass(TemplateTag, [{
    key: 'interimTag',


    /**
     * An intermediary template tag that receives a template tag and passes the result of calling the template with the received
     * template tag to our own template tag.
     * @param  {Function}        nextTag          - the received template tag
     * @param  {Array<String>}   template         - the template to process
     * @param  {...*}            ...substitutions - `substitutions` is an array of all substitutions in the template
     * @return {*}                                - the final processed value
     */
    value: function interimTag(previousTag, template) {
      for (var _len3 = arguments.length, substitutions = Array(_len3 > 2 ? _len3 - 2 : 0), _key3 = 2; _key3 < _len3; _key3++) {
        substitutions[_key3 - 2] = arguments[_key3];
      }

      return this.tag(_templateObject, previousTag.apply(undefined, [template].concat(substitutions)));
    }

    /**
     * Performs bulk processing on the tagged template, transforming each substitution and then
     * concatenating the resulting values into a string.
     * @param  {Array<*>} substitutions - an array of all remaining substitutions present in this template
     * @param  {String}   resultSoFar   - this iteration's result string so far
     * @param  {String}   remainingPart - the template chunk after the current substitution
     * @return {String}                 - the result of joining this iteration's processed substitution with the result
     */

  }, {
    key: 'processSubstitutions',
    value: function processSubstitutions(substitutions, resultSoFar, remainingPart) {
      var substitution = this.transformSubstitution(substitutions.shift(), resultSoFar);
      return ''.concat(resultSoFar, substitution, remainingPart);
    }

    /**
     * Iterate through each transformer, applying the transformer's `onString` method to the template
     * strings before all substitutions are processed.
     * @param {String}  str - The input string
     * @return {String}     - The final results of processing each transformer
     */

  }, {
    key: 'transformString',
    value: function transformString(str) {
      var cb = function cb(res, transform) {
        return transform.onString ? transform.onString(res) : res;
      };
      return this.transformers.reduce(cb, str);
    }

    /**
     * When a substitution is encountered, iterates through each transformer and applies the transformer's
     * `onSubstitution` method to the substitution.
     * @param  {*}      substitution - The current substitution
     * @param  {String} resultSoFar  - The result up to and excluding this substitution.
     * @return {*}                   - The final result of applying all substitution transformations.
     */

  }, {
    key: 'transformSubstitution',
    value: function transformSubstitution(substitution, resultSoFar) {
      var cb = function cb(res, transform) {
        return transform.onSubstitution ? transform.onSubstitution(res, resultSoFar) : res;
      };
      return this.transformers.reduce(cb, substitution);
    }

    /**
     * Iterates through each transformer, applying the transformer's `onEndResult` method to the
     * template literal after all substitutions have finished processing.
     * @param  {String} endResult - The processed template, just before it is returned from the tag
     * @return {String}           - The final results of processing each transformer
     */

  }, {
    key: 'transformEndResult',
    value: function transformEndResult(endResult) {
      var cb = function cb(res, transform) {
        return transform.onEndResult ? transform.onEndResult(res) : res;
      };
      return this.transformers.reduce(cb, endResult);
    }
  }]);

  return TemplateTag;
}();

exports.default = TemplateTag;
module.exports = exports['default'];

},{}],38:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = undefined;

var _TemplateTag = require('./TemplateTag');

var _TemplateTag2 = _interopRequireDefault(_TemplateTag);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = _TemplateTag2.default;
module.exports = exports['default'];

},{"./TemplateTag":37}],39:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = undefined;

var _html = require('../html');

var _html2 = _interopRequireDefault(_html);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = _html2.default;
module.exports = exports['default'];

},{"../html":47}],40:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _TemplateTag = require('../TemplateTag');

var _TemplateTag2 = _interopRequireDefault(_TemplateTag);

var _stripIndentTransformer = require('../stripIndentTransformer');

var _stripIndentTransformer2 = _interopRequireDefault(_stripIndentTransformer);

var _inlineArrayTransformer = require('../inlineArrayTransformer');

var _inlineArrayTransformer2 = _interopRequireDefault(_inlineArrayTransformer);

var _trimResultTransformer = require('../trimResultTransformer');

var _trimResultTransformer2 = _interopRequireDefault(_trimResultTransformer);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var commaListsAnd = new _TemplateTag2.default((0, _inlineArrayTransformer2.default)({ separator: ',', conjunction: 'and' }), _stripIndentTransformer2.default, _trimResultTransformer2.default);

exports.default = commaListsAnd;
module.exports = exports['default'];

},{"../TemplateTag":38,"../inlineArrayTransformer":49,"../stripIndentTransformer":78,"../trimResultTransformer":84}],41:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = undefined;

var _commaListsAnd = require('./commaListsAnd');

var _commaListsAnd2 = _interopRequireDefault(_commaListsAnd);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = _commaListsAnd2.default;
module.exports = exports['default'];

},{"./commaListsAnd":40}],42:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _TemplateTag = require('../TemplateTag');

var _TemplateTag2 = _interopRequireDefault(_TemplateTag);

var _stripIndentTransformer = require('../stripIndentTransformer');

var _stripIndentTransformer2 = _interopRequireDefault(_stripIndentTransformer);

var _inlineArrayTransformer = require('../inlineArrayTransformer');

var _inlineArrayTransformer2 = _interopRequireDefault(_inlineArrayTransformer);

var _trimResultTransformer = require('../trimResultTransformer');

var _trimResultTransformer2 = _interopRequireDefault(_trimResultTransformer);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var commaListsOr = new _TemplateTag2.default((0, _inlineArrayTransformer2.default)({ separator: ',', conjunction: 'or' }), _stripIndentTransformer2.default, _trimResultTransformer2.default);

exports.default = commaListsOr;
module.exports = exports['default'];

},{"../TemplateTag":38,"../inlineArrayTransformer":49,"../stripIndentTransformer":78,"../trimResultTransformer":84}],43:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = undefined;

var _commaListsOr = require('./commaListsOr');

var _commaListsOr2 = _interopRequireDefault(_commaListsOr);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = _commaListsOr2.default;
module.exports = exports['default'];

},{"./commaListsOr":42}],44:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _TemplateTag = require('../TemplateTag');

var _TemplateTag2 = _interopRequireDefault(_TemplateTag);

var _stripIndentTransformer = require('../stripIndentTransformer');

var _stripIndentTransformer2 = _interopRequireDefault(_stripIndentTransformer);

var _inlineArrayTransformer = require('../inlineArrayTransformer');

var _inlineArrayTransformer2 = _interopRequireDefault(_inlineArrayTransformer);

var _trimResultTransformer = require('../trimResultTransformer');

var _trimResultTransformer2 = _interopRequireDefault(_trimResultTransformer);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var commaLists = new _TemplateTag2.default((0, _inlineArrayTransformer2.default)({ separator: ',' }), _stripIndentTransformer2.default, _trimResultTransformer2.default);

exports.default = commaLists;
module.exports = exports['default'];

},{"../TemplateTag":38,"../inlineArrayTransformer":49,"../stripIndentTransformer":78,"../trimResultTransformer":84}],45:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = undefined;

var _commaLists = require('./commaLists');

var _commaLists2 = _interopRequireDefault(_commaLists);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = _commaLists2.default;
module.exports = exports['default'];

},{"./commaLists":44}],46:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _TemplateTag = require('../TemplateTag');

var _TemplateTag2 = _interopRequireDefault(_TemplateTag);

var _stripIndentTransformer = require('../stripIndentTransformer');

var _stripIndentTransformer2 = _interopRequireDefault(_stripIndentTransformer);

var _inlineArrayTransformer = require('../inlineArrayTransformer');

var _inlineArrayTransformer2 = _interopRequireDefault(_inlineArrayTransformer);

var _trimResultTransformer = require('../trimResultTransformer');

var _trimResultTransformer2 = _interopRequireDefault(_trimResultTransformer);

var _splitStringTransformer = require('../splitStringTransformer');

var _splitStringTransformer2 = _interopRequireDefault(_splitStringTransformer);

var _removeNonPrintingValuesTransformer = require('../removeNonPrintingValuesTransformer');

var _removeNonPrintingValuesTransformer2 = _interopRequireDefault(_removeNonPrintingValuesTransformer);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var html = new _TemplateTag2.default((0, _splitStringTransformer2.default)('\n'), _removeNonPrintingValuesTransformer2.default, _inlineArrayTransformer2.default, _stripIndentTransformer2.default, _trimResultTransformer2.default);

exports.default = html;
module.exports = exports['default'];

},{"../TemplateTag":38,"../inlineArrayTransformer":49,"../removeNonPrintingValuesTransformer":65,"../splitStringTransformer":76,"../stripIndentTransformer":78,"../trimResultTransformer":84}],47:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = undefined;

var _html = require('./html');

var _html2 = _interopRequireDefault(_html);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = _html2.default;
module.exports = exports['default'];

},{"./html":46}],48:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.stripIndents = exports.stripIndent = exports.oneLineInlineLists = exports.inlineLists = exports.oneLineCommaListsAnd = exports.oneLineCommaListsOr = exports.oneLineCommaLists = exports.oneLineTrim = exports.oneLine = exports.safeHtml = exports.source = exports.codeBlock = exports.html = exports.commaListsOr = exports.commaListsAnd = exports.commaLists = exports.removeNonPrintingValuesTransformer = exports.splitStringTransformer = exports.inlineArrayTransformer = exports.replaceStringTransformer = exports.replaceSubstitutionTransformer = exports.replaceResultTransformer = exports.stripIndentTransformer = exports.trimResultTransformer = exports.TemplateTag = undefined;

var _TemplateTag2 = require('./TemplateTag');

var _TemplateTag3 = _interopRequireDefault(_TemplateTag2);

var _trimResultTransformer2 = require('./trimResultTransformer');

var _trimResultTransformer3 = _interopRequireDefault(_trimResultTransformer2);

var _stripIndentTransformer2 = require('./stripIndentTransformer');

var _stripIndentTransformer3 = _interopRequireDefault(_stripIndentTransformer2);

var _replaceResultTransformer2 = require('./replaceResultTransformer');

var _replaceResultTransformer3 = _interopRequireDefault(_replaceResultTransformer2);

var _replaceSubstitutionTransformer2 = require('./replaceSubstitutionTransformer');

var _replaceSubstitutionTransformer3 = _interopRequireDefault(_replaceSubstitutionTransformer2);

var _replaceStringTransformer2 = require('./replaceStringTransformer');

var _replaceStringTransformer3 = _interopRequireDefault(_replaceStringTransformer2);

var _inlineArrayTransformer2 = require('./inlineArrayTransformer');

var _inlineArrayTransformer3 = _interopRequireDefault(_inlineArrayTransformer2);

var _splitStringTransformer2 = require('./splitStringTransformer');

var _splitStringTransformer3 = _interopRequireDefault(_splitStringTransformer2);

var _removeNonPrintingValuesTransformer2 = require('./removeNonPrintingValuesTransformer');

var _removeNonPrintingValuesTransformer3 = _interopRequireDefault(_removeNonPrintingValuesTransformer2);

var _commaLists2 = require('./commaLists');

var _commaLists3 = _interopRequireDefault(_commaLists2);

var _commaListsAnd2 = require('./commaListsAnd');

var _commaListsAnd3 = _interopRequireDefault(_commaListsAnd2);

var _commaListsOr2 = require('./commaListsOr');

var _commaListsOr3 = _interopRequireDefault(_commaListsOr2);

var _html2 = require('./html');

var _html3 = _interopRequireDefault(_html2);

var _codeBlock2 = require('./codeBlock');

var _codeBlock3 = _interopRequireDefault(_codeBlock2);

var _source2 = require('./source');

var _source3 = _interopRequireDefault(_source2);

var _safeHtml2 = require('./safeHtml');

var _safeHtml3 = _interopRequireDefault(_safeHtml2);

var _oneLine2 = require('./oneLine');

var _oneLine3 = _interopRequireDefault(_oneLine2);

var _oneLineTrim2 = require('./oneLineTrim');

var _oneLineTrim3 = _interopRequireDefault(_oneLineTrim2);

var _oneLineCommaLists2 = require('./oneLineCommaLists');

var _oneLineCommaLists3 = _interopRequireDefault(_oneLineCommaLists2);

var _oneLineCommaListsOr2 = require('./oneLineCommaListsOr');

var _oneLineCommaListsOr3 = _interopRequireDefault(_oneLineCommaListsOr2);

var _oneLineCommaListsAnd2 = require('./oneLineCommaListsAnd');

var _oneLineCommaListsAnd3 = _interopRequireDefault(_oneLineCommaListsAnd2);

var _inlineLists2 = require('./inlineLists');

var _inlineLists3 = _interopRequireDefault(_inlineLists2);

var _oneLineInlineLists2 = require('./oneLineInlineLists');

var _oneLineInlineLists3 = _interopRequireDefault(_oneLineInlineLists2);

var _stripIndent2 = require('./stripIndent');

var _stripIndent3 = _interopRequireDefault(_stripIndent2);

var _stripIndents2 = require('./stripIndents');

var _stripIndents3 = _interopRequireDefault(_stripIndents2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.TemplateTag = _TemplateTag3.default;

// transformers
// core

exports.trimResultTransformer = _trimResultTransformer3.default;
exports.stripIndentTransformer = _stripIndentTransformer3.default;
exports.replaceResultTransformer = _replaceResultTransformer3.default;
exports.replaceSubstitutionTransformer = _replaceSubstitutionTransformer3.default;
exports.replaceStringTransformer = _replaceStringTransformer3.default;
exports.inlineArrayTransformer = _inlineArrayTransformer3.default;
exports.splitStringTransformer = _splitStringTransformer3.default;
exports.removeNonPrintingValuesTransformer = _removeNonPrintingValuesTransformer3.default;

// tags

exports.commaLists = _commaLists3.default;
exports.commaListsAnd = _commaListsAnd3.default;
exports.commaListsOr = _commaListsOr3.default;
exports.html = _html3.default;
exports.codeBlock = _codeBlock3.default;
exports.source = _source3.default;
exports.safeHtml = _safeHtml3.default;
exports.oneLine = _oneLine3.default;
exports.oneLineTrim = _oneLineTrim3.default;
exports.oneLineCommaLists = _oneLineCommaLists3.default;
exports.oneLineCommaListsOr = _oneLineCommaListsOr3.default;
exports.oneLineCommaListsAnd = _oneLineCommaListsAnd3.default;
exports.inlineLists = _inlineLists3.default;
exports.oneLineInlineLists = _oneLineInlineLists3.default;
exports.stripIndent = _stripIndent3.default;
exports.stripIndents = _stripIndents3.default;

},{"./TemplateTag":38,"./codeBlock":39,"./commaLists":45,"./commaListsAnd":41,"./commaListsOr":43,"./html":47,"./inlineArrayTransformer":49,"./inlineLists":51,"./oneLine":63,"./oneLineCommaLists":57,"./oneLineCommaListsAnd":53,"./oneLineCommaListsOr":55,"./oneLineInlineLists":59,"./oneLineTrim":61,"./removeNonPrintingValuesTransformer":65,"./replaceResultTransformer":67,"./replaceStringTransformer":69,"./replaceSubstitutionTransformer":71,"./safeHtml":73,"./source":75,"./splitStringTransformer":76,"./stripIndent":80,"./stripIndentTransformer":78,"./stripIndents":82,"./trimResultTransformer":84}],49:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = undefined;

var _inlineArrayTransformer = require('./inlineArrayTransformer');

var _inlineArrayTransformer2 = _interopRequireDefault(_inlineArrayTransformer);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = _inlineArrayTransformer2.default;
module.exports = exports['default'];

},{"./inlineArrayTransformer":50}],50:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
var defaults = {
  separator: '',
  conjunction: '',
  serial: false
};

/**
 * Converts an array substitution to a string containing a list
 * @param  {String} [opts.separator = ''] - the character that separates each item
 * @param  {String} [opts.conjunction = '']  - replace the last separator with this
 * @param  {Boolean} [opts.serial = false] - include the separator before the conjunction? (Oxford comma use-case)
 *
 * @return {Object}                     - a TemplateTag transformer
 */
var inlineArrayTransformer = function inlineArrayTransformer() {
  var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : defaults;
  return {
    onSubstitution: function onSubstitution(substitution, resultSoFar) {
      // only operate on arrays
      if (Array.isArray(substitution)) {
        var arrayLength = substitution.length;
        var separator = opts.separator;
        var conjunction = opts.conjunction;
        var serial = opts.serial;
        // join each item in the array into a string where each item is separated by separator
        // be sure to maintain indentation
        var indent = resultSoFar.match(/(\n?[^\S\n]+)$/);
        if (indent) {
          substitution = substitution.join(separator + indent[1]);
        } else {
          substitution = substitution.join(separator + ' ');
        }
        // if conjunction is set, replace the last separator with conjunction, but only if there is more than one substitution
        if (conjunction && arrayLength > 1) {
          var separatorIndex = substitution.lastIndexOf(separator);
          substitution = substitution.slice(0, separatorIndex) + (serial ? separator : '') + ' ' + conjunction + substitution.slice(separatorIndex + 1);
        }
      }
      return substitution;
    }
  };
};

exports.default = inlineArrayTransformer;
module.exports = exports['default'];

},{}],51:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = undefined;

var _inlineLists = require('./inlineLists');

var _inlineLists2 = _interopRequireDefault(_inlineLists);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = _inlineLists2.default;
module.exports = exports['default'];

},{"./inlineLists":52}],52:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _TemplateTag = require('../TemplateTag');

var _TemplateTag2 = _interopRequireDefault(_TemplateTag);

var _stripIndentTransformer = require('../stripIndentTransformer');

var _stripIndentTransformer2 = _interopRequireDefault(_stripIndentTransformer);

var _inlineArrayTransformer = require('../inlineArrayTransformer');

var _inlineArrayTransformer2 = _interopRequireDefault(_inlineArrayTransformer);

var _trimResultTransformer = require('../trimResultTransformer');

var _trimResultTransformer2 = _interopRequireDefault(_trimResultTransformer);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var inlineLists = new _TemplateTag2.default(_inlineArrayTransformer2.default, _stripIndentTransformer2.default, _trimResultTransformer2.default);

exports.default = inlineLists;
module.exports = exports['default'];

},{"../TemplateTag":38,"../inlineArrayTransformer":49,"../stripIndentTransformer":78,"../trimResultTransformer":84}],53:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = undefined;

var _oneLineCommaListsAnd = require('./oneLineCommaListsAnd');

var _oneLineCommaListsAnd2 = _interopRequireDefault(_oneLineCommaListsAnd);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = _oneLineCommaListsAnd2.default;
module.exports = exports['default'];

},{"./oneLineCommaListsAnd":54}],54:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _TemplateTag = require('../TemplateTag');

var _TemplateTag2 = _interopRequireDefault(_TemplateTag);

var _inlineArrayTransformer = require('../inlineArrayTransformer');

var _inlineArrayTransformer2 = _interopRequireDefault(_inlineArrayTransformer);

var _trimResultTransformer = require('../trimResultTransformer');

var _trimResultTransformer2 = _interopRequireDefault(_trimResultTransformer);

var _replaceResultTransformer = require('../replaceResultTransformer');

var _replaceResultTransformer2 = _interopRequireDefault(_replaceResultTransformer);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var oneLineCommaListsAnd = new _TemplateTag2.default((0, _inlineArrayTransformer2.default)({ separator: ',', conjunction: 'and' }), (0, _replaceResultTransformer2.default)(/(?:\s+)/g, ' '), _trimResultTransformer2.default);

exports.default = oneLineCommaListsAnd;
module.exports = exports['default'];

},{"../TemplateTag":38,"../inlineArrayTransformer":49,"../replaceResultTransformer":67,"../trimResultTransformer":84}],55:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = undefined;

var _oneLineCommaListsOr = require('./oneLineCommaListsOr');

var _oneLineCommaListsOr2 = _interopRequireDefault(_oneLineCommaListsOr);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = _oneLineCommaListsOr2.default;
module.exports = exports['default'];

},{"./oneLineCommaListsOr":56}],56:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _TemplateTag = require('../TemplateTag');

var _TemplateTag2 = _interopRequireDefault(_TemplateTag);

var _inlineArrayTransformer = require('../inlineArrayTransformer');

var _inlineArrayTransformer2 = _interopRequireDefault(_inlineArrayTransformer);

var _trimResultTransformer = require('../trimResultTransformer');

var _trimResultTransformer2 = _interopRequireDefault(_trimResultTransformer);

var _replaceResultTransformer = require('../replaceResultTransformer');

var _replaceResultTransformer2 = _interopRequireDefault(_replaceResultTransformer);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var oneLineCommaListsOr = new _TemplateTag2.default((0, _inlineArrayTransformer2.default)({ separator: ',', conjunction: 'or' }), (0, _replaceResultTransformer2.default)(/(?:\s+)/g, ' '), _trimResultTransformer2.default);

exports.default = oneLineCommaListsOr;
module.exports = exports['default'];

},{"../TemplateTag":38,"../inlineArrayTransformer":49,"../replaceResultTransformer":67,"../trimResultTransformer":84}],57:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = undefined;

var _oneLineCommaLists = require('./oneLineCommaLists');

var _oneLineCommaLists2 = _interopRequireDefault(_oneLineCommaLists);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = _oneLineCommaLists2.default;
module.exports = exports['default'];

},{"./oneLineCommaLists":58}],58:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _TemplateTag = require('../TemplateTag');

var _TemplateTag2 = _interopRequireDefault(_TemplateTag);

var _inlineArrayTransformer = require('../inlineArrayTransformer');

var _inlineArrayTransformer2 = _interopRequireDefault(_inlineArrayTransformer);

var _trimResultTransformer = require('../trimResultTransformer');

var _trimResultTransformer2 = _interopRequireDefault(_trimResultTransformer);

var _replaceResultTransformer = require('../replaceResultTransformer');

var _replaceResultTransformer2 = _interopRequireDefault(_replaceResultTransformer);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var oneLineCommaLists = new _TemplateTag2.default((0, _inlineArrayTransformer2.default)({ separator: ',' }), (0, _replaceResultTransformer2.default)(/(?:\s+)/g, ' '), _trimResultTransformer2.default);

exports.default = oneLineCommaLists;
module.exports = exports['default'];

},{"../TemplateTag":38,"../inlineArrayTransformer":49,"../replaceResultTransformer":67,"../trimResultTransformer":84}],59:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = undefined;

var _oneLineInlineLists = require('./oneLineInlineLists');

var _oneLineInlineLists2 = _interopRequireDefault(_oneLineInlineLists);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = _oneLineInlineLists2.default;
module.exports = exports['default'];

},{"./oneLineInlineLists":60}],60:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _TemplateTag = require('../TemplateTag');

var _TemplateTag2 = _interopRequireDefault(_TemplateTag);

var _inlineArrayTransformer = require('../inlineArrayTransformer');

var _inlineArrayTransformer2 = _interopRequireDefault(_inlineArrayTransformer);

var _trimResultTransformer = require('../trimResultTransformer');

var _trimResultTransformer2 = _interopRequireDefault(_trimResultTransformer);

var _replaceResultTransformer = require('../replaceResultTransformer');

var _replaceResultTransformer2 = _interopRequireDefault(_replaceResultTransformer);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var oneLineInlineLists = new _TemplateTag2.default(_inlineArrayTransformer2.default, (0, _replaceResultTransformer2.default)(/(?:\s+)/g, ' '), _trimResultTransformer2.default);

exports.default = oneLineInlineLists;
module.exports = exports['default'];

},{"../TemplateTag":38,"../inlineArrayTransformer":49,"../replaceResultTransformer":67,"../trimResultTransformer":84}],61:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = undefined;

var _oneLineTrim = require('./oneLineTrim');

var _oneLineTrim2 = _interopRequireDefault(_oneLineTrim);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = _oneLineTrim2.default;
module.exports = exports['default'];

},{"./oneLineTrim":62}],62:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _TemplateTag = require('../TemplateTag');

var _TemplateTag2 = _interopRequireDefault(_TemplateTag);

var _trimResultTransformer = require('../trimResultTransformer');

var _trimResultTransformer2 = _interopRequireDefault(_trimResultTransformer);

var _replaceResultTransformer = require('../replaceResultTransformer');

var _replaceResultTransformer2 = _interopRequireDefault(_replaceResultTransformer);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var oneLineTrim = new _TemplateTag2.default((0, _replaceResultTransformer2.default)(/(?:\n\s*)/g, ''), _trimResultTransformer2.default);

exports.default = oneLineTrim;
module.exports = exports['default'];

},{"../TemplateTag":38,"../replaceResultTransformer":67,"../trimResultTransformer":84}],63:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = undefined;

var _oneLine = require('./oneLine');

var _oneLine2 = _interopRequireDefault(_oneLine);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = _oneLine2.default;
module.exports = exports['default'];

},{"./oneLine":64}],64:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _TemplateTag = require('../TemplateTag');

var _TemplateTag2 = _interopRequireDefault(_TemplateTag);

var _trimResultTransformer = require('../trimResultTransformer');

var _trimResultTransformer2 = _interopRequireDefault(_trimResultTransformer);

var _replaceResultTransformer = require('../replaceResultTransformer');

var _replaceResultTransformer2 = _interopRequireDefault(_replaceResultTransformer);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var oneLine = new _TemplateTag2.default((0, _replaceResultTransformer2.default)(/(?:\n(?:\s*))+/g, ' '), _trimResultTransformer2.default);

exports.default = oneLine;
module.exports = exports['default'];

},{"../TemplateTag":38,"../replaceResultTransformer":67,"../trimResultTransformer":84}],65:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = undefined;

var _removeNonPrintingValuesTransformer = require('./removeNonPrintingValuesTransformer');

var _removeNonPrintingValuesTransformer2 = _interopRequireDefault(_removeNonPrintingValuesTransformer);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = _removeNonPrintingValuesTransformer2.default;
module.exports = exports['default'];

},{"./removeNonPrintingValuesTransformer":66}],66:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
var isValidValue = function isValidValue(x) {
  return x != null && !Number.isNaN(x) && typeof x !== 'boolean';
};

var removeNonPrintingValuesTransformer = function removeNonPrintingValuesTransformer() {
  return {
    onSubstitution: function onSubstitution(substitution) {
      if (Array.isArray(substitution)) {
        return substitution.filter(isValidValue);
      }
      if (isValidValue(substitution)) {
        return substitution;
      }
      return '';
    }
  };
};

exports.default = removeNonPrintingValuesTransformer;
module.exports = exports['default'];

},{}],67:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = undefined;

var _replaceResultTransformer = require('./replaceResultTransformer');

var _replaceResultTransformer2 = _interopRequireDefault(_replaceResultTransformer);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = _replaceResultTransformer2.default;
module.exports = exports['default'];

},{"./replaceResultTransformer":68}],68:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
/**
 * Replaces tabs, newlines and spaces with the chosen value when they occur in sequences
 * @param  {(String|RegExp)} replaceWhat - the value or pattern that should be replaced
 * @param  {*}               replaceWith - the replacement value
 * @return {Object}                      - a TemplateTag transformer
 */
var replaceResultTransformer = function replaceResultTransformer(replaceWhat, replaceWith) {
  return {
    onEndResult: function onEndResult(endResult) {
      if (replaceWhat == null || replaceWith == null) {
        throw new Error('replaceResultTransformer requires at least 2 arguments.');
      }
      return endResult.replace(replaceWhat, replaceWith);
    }
  };
};

exports.default = replaceResultTransformer;
module.exports = exports['default'];

},{}],69:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = undefined;

var _replaceStringTransformer = require('./replaceStringTransformer');

var _replaceStringTransformer2 = _interopRequireDefault(_replaceStringTransformer);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = _replaceStringTransformer2.default;
module.exports = exports['default'];

},{"./replaceStringTransformer":70}],70:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
var replaceStringTransformer = function replaceStringTransformer(replaceWhat, replaceWith) {
  return {
    onString: function onString(str) {
      if (replaceWhat == null || replaceWith == null) {
        throw new Error('replaceStringTransformer requires at least 2 arguments.');
      }

      return str.replace(replaceWhat, replaceWith);
    }
  };
};

exports.default = replaceStringTransformer;
module.exports = exports['default'];

},{}],71:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = undefined;

var _replaceSubstitutionTransformer = require('./replaceSubstitutionTransformer');

var _replaceSubstitutionTransformer2 = _interopRequireDefault(_replaceSubstitutionTransformer);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = _replaceSubstitutionTransformer2.default;
module.exports = exports['default'];

},{"./replaceSubstitutionTransformer":72}],72:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
var replaceSubstitutionTransformer = function replaceSubstitutionTransformer(replaceWhat, replaceWith) {
  return {
    onSubstitution: function onSubstitution(substitution, resultSoFar) {
      if (replaceWhat == null || replaceWith == null) {
        throw new Error('replaceSubstitutionTransformer requires at least 2 arguments.');
      }

      // Do not touch if null or undefined
      if (substitution == null) {
        return substitution;
      } else {
        return substitution.toString().replace(replaceWhat, replaceWith);
      }
    }
  };
};

exports.default = replaceSubstitutionTransformer;
module.exports = exports['default'];

},{}],73:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = undefined;

var _safeHtml = require('./safeHtml');

var _safeHtml2 = _interopRequireDefault(_safeHtml);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = _safeHtml2.default;
module.exports = exports['default'];

},{"./safeHtml":74}],74:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _TemplateTag = require('../TemplateTag');

var _TemplateTag2 = _interopRequireDefault(_TemplateTag);

var _stripIndentTransformer = require('../stripIndentTransformer');

var _stripIndentTransformer2 = _interopRequireDefault(_stripIndentTransformer);

var _inlineArrayTransformer = require('../inlineArrayTransformer');

var _inlineArrayTransformer2 = _interopRequireDefault(_inlineArrayTransformer);

var _trimResultTransformer = require('../trimResultTransformer');

var _trimResultTransformer2 = _interopRequireDefault(_trimResultTransformer);

var _splitStringTransformer = require('../splitStringTransformer');

var _splitStringTransformer2 = _interopRequireDefault(_splitStringTransformer);

var _replaceSubstitutionTransformer = require('../replaceSubstitutionTransformer');

var _replaceSubstitutionTransformer2 = _interopRequireDefault(_replaceSubstitutionTransformer);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var safeHtml = new _TemplateTag2.default((0, _splitStringTransformer2.default)('\n'), _inlineArrayTransformer2.default, _stripIndentTransformer2.default, _trimResultTransformer2.default, (0, _replaceSubstitutionTransformer2.default)(/&/g, '&amp;'), (0, _replaceSubstitutionTransformer2.default)(/</g, '&lt;'), (0, _replaceSubstitutionTransformer2.default)(/>/g, '&gt;'), (0, _replaceSubstitutionTransformer2.default)(/"/g, '&quot;'), (0, _replaceSubstitutionTransformer2.default)(/'/g, '&#x27;'), (0, _replaceSubstitutionTransformer2.default)(/`/g, '&#x60;'));

exports.default = safeHtml;
module.exports = exports['default'];

},{"../TemplateTag":38,"../inlineArrayTransformer":49,"../replaceSubstitutionTransformer":71,"../splitStringTransformer":76,"../stripIndentTransformer":78,"../trimResultTransformer":84}],75:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = undefined;

var _html = require('../html');

var _html2 = _interopRequireDefault(_html);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = _html2.default;
module.exports = exports['default'];

},{"../html":47}],76:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = undefined;

var _splitStringTransformer = require('./splitStringTransformer');

var _splitStringTransformer2 = _interopRequireDefault(_splitStringTransformer);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = _splitStringTransformer2.default;
module.exports = exports['default'];

},{"./splitStringTransformer":77}],77:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
var splitStringTransformer = function splitStringTransformer(splitBy) {
  return {
    onSubstitution: function onSubstitution(substitution, resultSoFar) {
      if (splitBy != null && typeof splitBy === 'string') {
        if (typeof substitution === 'string' && substitution.includes(splitBy)) {
          substitution = substitution.split(splitBy);
        }
      } else {
        throw new Error('You need to specify a string character to split by.');
      }
      return substitution;
    }
  };
};

exports.default = splitStringTransformer;
module.exports = exports['default'];

},{}],78:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = undefined;

var _stripIndentTransformer = require('./stripIndentTransformer');

var _stripIndentTransformer2 = _interopRequireDefault(_stripIndentTransformer);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = _stripIndentTransformer2.default;
module.exports = exports['default'];

},{"./stripIndentTransformer":79}],79:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

/**
 * strips indentation from a template literal
 * @param  {String} type = 'initial' - whether to remove all indentation or just leading indentation. can be 'all' or 'initial'
 * @return {Object}                  - a TemplateTag transformer
 */
var stripIndentTransformer = function stripIndentTransformer() {
  var type = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'initial';
  return {
    onEndResult: function onEndResult(endResult) {
      if (type === 'initial') {
        // remove the shortest leading indentation from each line
        var match = endResult.match(/^[^\S\n]*(?=\S)/gm);
        var indent = match && Math.min.apply(Math, _toConsumableArray(match.map(function (el) {
          return el.length;
        })));
        if (indent) {
          var regexp = new RegExp('^.{' + indent + '}', 'gm');
          return endResult.replace(regexp, '');
        }
        return endResult;
      }
      if (type === 'all') {
        // remove all indentation from each line
        return endResult.replace(/^[^\S\n]+/gm, '');
      }
      throw new Error('Unknown type: ' + type);
    }
  };
};

exports.default = stripIndentTransformer;
module.exports = exports['default'];

},{}],80:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = undefined;

var _stripIndent = require('./stripIndent');

var _stripIndent2 = _interopRequireDefault(_stripIndent);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = _stripIndent2.default;
module.exports = exports['default'];

},{"./stripIndent":81}],81:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _TemplateTag = require('../TemplateTag');

var _TemplateTag2 = _interopRequireDefault(_TemplateTag);

var _stripIndentTransformer = require('../stripIndentTransformer');

var _stripIndentTransformer2 = _interopRequireDefault(_stripIndentTransformer);

var _trimResultTransformer = require('../trimResultTransformer');

var _trimResultTransformer2 = _interopRequireDefault(_trimResultTransformer);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var stripIndent = new _TemplateTag2.default(_stripIndentTransformer2.default, _trimResultTransformer2.default);

exports.default = stripIndent;
module.exports = exports['default'];

},{"../TemplateTag":38,"../stripIndentTransformer":78,"../trimResultTransformer":84}],82:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = undefined;

var _stripIndents = require('./stripIndents');

var _stripIndents2 = _interopRequireDefault(_stripIndents);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = _stripIndents2.default;
module.exports = exports['default'];

},{"./stripIndents":83}],83:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _TemplateTag = require('../TemplateTag');

var _TemplateTag2 = _interopRequireDefault(_TemplateTag);

var _stripIndentTransformer = require('../stripIndentTransformer');

var _stripIndentTransformer2 = _interopRequireDefault(_stripIndentTransformer);

var _trimResultTransformer = require('../trimResultTransformer');

var _trimResultTransformer2 = _interopRequireDefault(_trimResultTransformer);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var stripIndents = new _TemplateTag2.default((0, _stripIndentTransformer2.default)('all'), _trimResultTransformer2.default);

exports.default = stripIndents;
module.exports = exports['default'];

},{"../TemplateTag":38,"../stripIndentTransformer":78,"../trimResultTransformer":84}],84:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = undefined;

var _trimResultTransformer = require('./trimResultTransformer');

var _trimResultTransformer2 = _interopRequireDefault(_trimResultTransformer);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = _trimResultTransformer2.default;
module.exports = exports['default'];

},{"./trimResultTransformer":85}],85:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
/**
 * TemplateTag transformer that trims whitespace on the end result of a tagged template
 * @param  {String} side = '' - The side of the string to trim. Can be 'start' or 'end' (alternatively 'left' or 'right')
 * @return {Object}           - a TemplateTag transformer
 */
var trimResultTransformer = function trimResultTransformer() {
  var side = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';
  return {
    onEndResult: function onEndResult(endResult) {
      if (side === '') {
        return endResult.trim();
      }

      side = side.toLowerCase();

      if (side === 'start' || side === 'left') {
        return endResult.replace(/^\s*/, '');
      }

      if (side === 'end' || side === 'right') {
        return endResult.replace(/\s*$/, '');
      }

      throw new Error('Side not supported: ' + side);
    }
  };
};

exports.default = trimResultTransformer;
module.exports = exports['default'];

},{}],86:[function(require,module,exports){
function is_array(x) {
    if (Array.isArray === undefined) {
        return x instanceof Array;
    } else {
        return Array.isArray(x);
    }
}

function map_array(f, ls){
    let res = [];
    let len = ls.length;
    for(let i = 0; i < len; i++){
        res.push(f(ls[i]));
    }
    return res;
}
function accumulate_array(op, init, ls){
    for(let i = 0; i < ls.length; i++){
        init = op(ls[i], init);
    }
    return init;
}

function filter_array(f, ls){
    let res = [];
    for(let i = 0; i < ls.length; i++){
        if(f(ls[i])){
            res.push(ls[i]);
        }
    }
    return res;
}

function enum_array(a,b){
    let res = [];
    for(let i = a; a <= b; a++){
        res.push(a);
    }
    return res;
}

function take_array(xs, n){
    let res = [];
    let arr_len = xs.length;
    for(let i = 0; i < n; i = i + 1){
        res[i] = xs[i];
    }
    return res;
}

function drop_array(xs, n){
    let res = [];
    let arr_len = xs.length;
    for(let i = n; i < arr_len; i = i + 1){
        res.push(xs[i]);
    }
    return res;
}

if((typeof module !== 'undefined' && module.exports)){
	exports.is_array = is_array;
	exports.is_array = is_array;
	exports.map_array = map_array;
	exports.accumulate_array = accumulate_array;
	exports.filter_array = filter_array;
	exports.take_array = take_array;
	exports.drop_array = drop_array;
}
},{}],87:[function(require,module,exports){
Object.defineProperty(exports, "__esModule", { value: true });

let q1 = require("./q1.js");
let q2 = require("./q2.js");
let q3 = require("./q3.js");

function merge_into(src, dst){
    for(const key in src){
        dst[key] = src[key];
    }
}

merge_into(q1, exports);
merge_into(q2, exports);
merge_into(q3, exports);
},{"./q1.js":88,"./q2.js":89,"./q3.js":90}],88:[function(require,module,exports){
Object.defineProperty(exports, "__esModule", { value: true });

exports.fizzbuzz = function fizzbuzz(n){
    function helper(k){
        if(k > n){
            return [];
        } else {
            if(k % 3 === 0 && k % 5 === 0){
                return pair("FizzBuzz", helper(k+1));
            } else if (k % 3 === 0){
                return pair("Fizz", helper(k+1));
            } else if (k % 5 === 0){
                return pair("Buzz", helper(k+1));
            } else {
                return pair(k, helper(k+1));
            }
        }
    }
    return helper(1);
}

//display(fizzbuzz(15));


exports.fizzbuzzer = function fizzbuzzer(n, ls){
    return map(function(k){
        const match = filter(x => k % head(x) === 0, ls);
        const str = accumulate((x, y) => tail(x) + y, "", match);
        return str === "" ? k : str;
    }, enum_list(1, n));
}

/*let fizzbuzz_alt = n => fizzbuzzer(n, list(pair(3, "Fizz"), pair(5, "Buzz"))); 
display(fizzbuzz_alt(15));

display(fizzbuzzer(6, list(pair(1, "a"), pair(2, "ha"), pair(3, "haha"))));*/
},{}],89:[function(require,module,exports){
const pe_library = require("./pe_library");
const drop_array = pe_library.drop_array;
const is_array = pe_library.is_array;
const map_array = pe_library.map_array;
let assert, assert_error, error, is_function, is_object, is_number, is_undefined, is_string, is_boolean;
if((typeof module !== 'undefined' && module.exports)){
    assert = function (testName, fn_to_run, value, mocks){
        if(fn_to_run() === value){
            console.log(`${testName}: PASS`);
        } else {
            console.log(`${testName}: FAIL`);
        }
    }
    assert_error = function (testName, fn_to_run, value, mocks){
        try {
            fn_to_run();
        } catch (e) {
            if(e.message === JSON.stringify(value)){
                return console.log(`${testName}: PASS`);
            } else {
                return console.log(`${testName}: FAIL`);
            }
        }
        return console.log(`${testName}: FAIL (no error found)`);
    }

    error = function (value) {
        throw new Error(JSON.stringify(value));
    }

    is_function = function (xs) {
        return typeof xs === 'function';
    }

    is_object = function(xs){
        return typeof xs === 'object' || is_function(xs);
    }

    is_number = function (v) {
        return typeof v === 'number';
    }

    is_undefined = function(xs) {
        return typeof xs === 'undefined';
    }

    is_string = function (xs) {
        return typeof xs === 'string';
    }
    is_boolean = function (xs) {
        return typeof xs === 'boolean';
    }
}

Object.defineProperty(exports, "__esModule", { value: true });

function eval(expr, frame){
    if(is_self_evaluating(expr)){
        return expr;
    } else if(is_variable(expr)){
        return get(frame, expr);
    } else if (is_let_expr(expr)) {
        return eval_let(expr, frame);
    } else if (is_if_expr(expr)){
        return eval_if_expr(expr, frame);
    } else if (is_fn_defn(expr)){
        return eval_fn_defn(expr, frame);
    } else if (is_fn_expr(expr)){
        const literal_function_expr = eval_fn_parameters(expr, frame);
        return apply(literal_function_expr);
    } else { 
        return error("Unknown expression: " + stringify(expr));
    }
}

function is_self_evaluating(expr){
    return is_number(expr) || is_boolean(expr);
}


// Multiple statements are only possible if
    // They are define statements.
    // The last statement is the return value.
    // This is true both in program and function definitions.
function eval_stmts(stmts, frame){
    if(stmts.length === 0){
        return error("expected expression, got " + stringify(stmts));
    } else {
        //Evaluate statements in order
        for(let i = 0; i<stmts.length - 1; i = i + 1){
            let stmt = stmts[i];
            if(!is_fn_defn(stmt)){
                return error("expected function definition, got " + stringify(stmt));
            } else {
                frame = eval_fn_defn(stmt, frame);
            }
        }
        const expr = stmts[stmts.length - 1];
        return eval(expr, frame);
    }
    
}

// Pass in frame = false if you have no frame.
// That will force global frame to be loaded
function evaluate(expr, frame){
    frame = is_object(frame) ? frame : make_global_frame();
    return eval(expr,frame);
}

function evaluate_program(stmts){
    return eval_stmts(stmts, make_global_frame());
}

// ================ AST DEFINITIONS ================
function is_variable(expr){
    return is_string(expr);
}

//Format: [let*, [[var, expr]], expr]
function is_let_expr(expr){
    return is_array(expr) && expr[0] === "let*";
}

//Format: [if cond true-branch false-branch]
function is_if_expr(expr){
    return is_array(expr) && expr[0] === "if";
}

//Format: [define [fname a1 a2 ... an] ... fn-defn ... body]
function is_fn_defn(expr){
    return is_array(expr) && expr[0] === "define";
}

//Format: [fn a1 a2 ... an]
function is_fn_expr(expr){
    return is_array(expr);
}

// ================= LET EXPRESSION ================
// ==================== Example ====================
//Format: [let*, [[var, expr]], expr]

function eval_let(expr, frame){
    const defns = expr[1];
    const nexpr = expr[2];
    const newframe = accumulate_array(function(item, frame){
        let [varname, expr] = item;
        return insert(frame, varname, eval(expr, frame));
    }, make_child_frame(frame), defns);
    return eval(nexpr, newframe);
}

// ==================== Task 2A ====================
// ============== ENVIRONMENT FRAMES ===============

function make_empty_frame(){
    return { 
        _parent: undefined,
        values: {}
    };
}

function insert(frame, name, value){
    frame.values[name] = value;
    return frame;
}

// Return error(name + " is not defined") in case name cannot be found.
function get(frame, name){
    if(frame.values[name] !== undefined){
        return frame.values[name];
    } else if (frame._parent !== undefined) {
        return get(frame._parent, name);
    } else {
        return error(name + " is not defined");
    }
}

function make_child_frame(parent){
    let frame = make_empty_frame();
    frame._parent = parent;
    return frame;
}

// Exports
exports.make_empty_frame = make_empty_frame;
exports.insert = insert;
exports.get = get;
exports.make_child_frame = make_child_frame;

//Task 2a Tests
/*let base_frame = make_empty_frame();
insert(base_frame, "x", 5);
assert("2A_1", () => get(base_frame, "x"), 5, []);

let child_frame = make_child_frame(base_frame);
assert("2A_2", () => get(child_frame, "x"), 5, []);

insert(base_frame, "y", 10);
assert("2A_3", () => get(child_frame, "y"), 10, []);

insert(child_frame, "z", 15);
assert("2A_4", () => get(child_frame, "z"), 15, []);

//There's supposed to be an error here.
assert_error("2A_5", () => get(base_frame, "z"),  "z is not defined", []);

let child_child_frame = make_child_frame(child_frame);
insert(child_child_frame, "z", 11);
assert("2A_6", () => get(child_frame, "z"), 15, []);
assert("2A_7", () => get(child_child_frame, "z"), 11, []);*/



// =============== STANDARD LIBRARY ================

function make_global_frame(){
    let frame = make_empty_frame();
    frame = add_not_function(frame);
    frame = add_plus_function(frame);
    frame = add_minus_function(frame);
    frame = add_mul_function(frame);
    frame = add_equals_function(frame);
    return frame;
}

// ==================== Example ====================
function add_not_function(frame){
    return insert(frame, "not", function(params){
        const val = params[0];
        return !val;
    });
}

// ==================== Task 2B ====================

function add_plus_function(frame){
    return insert(frame, "+", function(params){
        const x = params[0];
        const y = params[1];
        return x + y;
    });
}

function add_minus_function(frame){
    return insert(frame, "-", function(params){
        const x = params[0];
        const y = params[1];
        return x - y;
    });
}

function add_mul_function(frame){
    return insert(frame, "*", function(params){
        const x = params[0];
        const y = params[1];
        return x * y;
    });
}

function add_equals_function(frame){
    return insert(frame, "=", function(params){
        const x = params[0];
        const y = params[1];
        return x === y;
    });
}

exports.make_global_frame = make_global_frame;
exports.add_not_function = add_not_function;
exports.add_plus_function = add_plus_function;
exports.add_minus_function = add_minus_function;
exports.add_mul_function = add_mul_function;
exports.add_equals_function = add_equals_function;

//Task 2B Tests
/*const _2B_assumptions = ["make_empty_frame", "insert", "get", "make_child_frame"];

const global_frame = make_global_frame();
assert("2B_1", () => get(global_frame, "not")([false]), true, _2B_assumptions);
assert("2B_2", () => get(global_frame, "+")([3,4]), 7, _2B_assumptions);
assert("2B_3", () => get(global_frame, "-")([3,4]), -1, _2B_assumptions);
assert("2B_4", () => get(global_frame, "=")([3,4]), false, _2B_assumptions);
assert("2B_5", () => get(global_frame, "=")([1,1]), true, _2B_assumptions);*/


// ==================== Task 2C ====================
// ============= CONDITIONAL EXPRESSION ============
//Format: [if cond true-branch false-branch]

function eval_if_expr(expr, frame){
    const cond = expr[1];
    const true_branch = expr[2];
    const false_branch = expr[3];
    if(eval(cond, frame)){
        return eval(true_branch, frame);
    } else {
        return eval(false_branch, frame);
    }
}

exports.eval_if_expr = eval_if_expr;

//Task 2C Tests
/*const _2C_assumptions = ["make_empty_frame", "insert", "get", "make_child_frame",
"add_plus_function", "add_minus_function", "add_mul_function", "add_equals_function"];

assert("2C_1", () => evaluate(["if", true, 1, 2], false), 1, _2C_assumptions);
assert("2C_1", () => evaluate(["if", false, 1, 2], false), 2, _2C_assumptions);*/
//Further mistakes, if any, will pop up when testing recursion.


// ==================== Task 2D ====================
// ============== FUNCTION APPLICATION =============
//Format: [fn a1 a2 ... an]

//Is a Source function, not defined by user.
function is_simple_function(x){
    return is_function(x);
}

//Hint: check the appendix
function eval_fn_parameters(expr, frame){
    return map_array(x => eval(x, frame), expr);
}

function apply(literal_function_expr){
    // --------- YOUR ANSWER HERE ---------
    const fn = literal_function_expr[0];
    const params = drop_array(literal_function_expr, 1);


    // DO NOT MODIFY BELOW
    if(is_simple_function(fn)){
        return fn(params);
    } else {
        return apply_user_function(fn, params);
    }
}

//Task 2D Tests
/*const _2D_assumptions = ["make_empty_frame", "insert", "get", "make_child_frame",
"add_plus_function", "add_minus_function", "add_mul_function", "add_equals_function",
"eval_if_expr"];

assert("2D_1", () => evaluate(["not", true], false), false, _2D_assumptions);
assert("2D_2", () => evaluate(["not", ["not", true]], false), true, _2D_assumptions);

let custom_frame = make_global_frame();
custom_frame = insert(custom_frame, "f", x => y => x[0] + y[0]);

assert("2D_3", () => evaluate([["f", 3], 7], custom_frame), 10, _2D_assumptions);*/


// ==================== Task 2E ====================
// ============= USER DEFINED FUNCTIONS ============
//Format: [define [fname a1 a2 ... an] ... fn-defn ... body]

//Create a function object and insert it into frame.
function eval_fn_defn(expr, frame){
    const fname_and_params = expr[1];
    const fname = fname_and_params[0];
    const params = drop_array(fname_and_params, 1);
    const body = drop_array(expr, 2);
    const fn_object = {
        params: params,
        body: body,
        frame: frame
    }
    return insert(frame, fname, fn_object);
}

//Hint: eval_stmts
function apply_user_function(user_function, literal_call_params){
    const params = user_function.params;
    let cframe = make_child_frame(user_function.frame);
    for(var i = 0; i<params.length; i++){
        cframe = insert(cframe, params[i], literal_call_params[i]);
    }
    return eval_stmts(user_function.body, cframe);
}

//Task 2E Tests
/*const _2E_assumptions = ["make_empty_frame", "insert", "get", "make_child_frame",
"add_plus_function", "add_minus_function", "add_mul_function", "add_equals_function",
"eval_if_expr", "eval_fn_parameters", "apply"];

const f = 
["define", ["f", "x"], 
    ["+", "x", "x"]];

assert("2E_1", () => evaluate_program([f, ["f", 10] ]), 20, _2E_assumptions);

const neg = 
["define", ["neg", "x"], 
    ["-", 0, "x"]];

assert("2E_2", () => evaluate_program([neg, ["neg", 5] ]), -5, _2E_assumptions);

const fact_fn = 
["define", ["fact", "n"], 
    ["if", ["=", "n", 0],
        1, 
        ["*", "n", ["fact", ["-", "n", 1]]]]];

assert("2E_3", () => evaluate_program([fact_fn, ["fact", 10] ]), 3628800, _2E_assumptions);

const thrice = 
["define", ["thrice", "f"], 
    ["define", ["g", "x"],
        ["f", ["f", ["f", "x"]]]],
    "g"];

const add_one = 
["define", ["add_one", "x"],
    ["+", "x", 1]];

assert("2E_4", () => evaluate_program([thrice, add_one, [[["thrice", "thrice"],"add_one"], 6]]), 
    33, _2E_assumptions);*/
},{"./pe_library":86}],90:[function(require,module,exports){
Object.defineProperty(exports, "__esModule", { value: true });

// Task A

function get_left_column(row){
    let len = array_length(row);
    for(let i = 0; i < len; i++){
        if(row[i] !== 0){
            return i;
        }
    }
    return len;
}

function swap(matrix, k){
    //look for correct rows to swap.
    let left_most_row = k;
    for(let i = k+1; i<array_length(matrix); i++){
        if(get_left_column(matrix[i]) < get_left_column(matrix[left_most_row])){
            left_most_row = i;
        }
    }
    //actually swap.
    let temp = matrix[left_most_row];
    matrix[left_most_row] = matrix[k];
    matrix[k] = temp;
    return matrix;
}
exports.swap = swap;

let test_matrix1 = 
    [[0, 2, 1, -8],
    [1, -2, -3, 0],
    [-1, 1, 2, 3]];

//display(swap(test_matrix1, 0));


// Task B
function add_rows(row1, row2){
    return map_array(n => row1[n] + row2[n], 
        enum_array(0, array_length(row1) - 1));
}

function scale_rows(row, k){
    return map_array(x => k * x, row);
}

function eliminate_row(row, eliminator, k){
    if(row[k] === 0 || eliminator[k] === 0){
        return row;
    }
    const scale_factor = -(row[k]/eliminator[k]);
    return add_rows(row,
            scale_rows(eliminator, scale_factor));
}

function eliminate(matrix, k){
    let n = array_length(matrix);
    for(let row = k+1; row<n; row++){
        matrix[row] = eliminate_row(matrix[row], matrix[k], k);
    }
    return matrix;
}
exports.eliminate = eliminate;

let test_matrix2 = [[1, -2, -3, 0],
    [0, 2, 1, -8],
    [-1, 1, 2, 3]];

//display(eliminate(test_matrix2, 0));

// Task C

function gaussian_elimination(matrix){
    let num_rows = array_length(matrix)
    for(let i = 0; i < num_rows; i++){
        matrix = swap(matrix, i);
        matrix = eliminate(matrix, i);
    }
    return matrix;
}
exports.gaussian_elimination = gaussian_elimination;

let test_matrix6 = [[0, 2, 1, -8],
    [1, -2, -3, 0],
    [-1, 1, 2, 3]];

//display(gaussian_elimination(test_matrix6));
},{}]},{},[4]);
