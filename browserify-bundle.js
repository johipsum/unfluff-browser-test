(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var unfluff = require('unfluff');
var fetch = require('fetch-everywhere');

document.addEventListener('DOMContentLoaded', function () {
  var fetchBtn = document.getElementById('fetch-btn');
  var urlInput = document.getElementById('url-input');
  var titleDisplay = document.getElementById('title-display');
  var descDisplay = document.getElementById('desc-display');
  var linkDisplay = document.getElementById('link-display');
  var textDisplay = document.getElementById('text-display');

  fetchBtn.addEventListener('click', _asyncToGenerator(regeneratorRuntime.mark(function _callee() {
    var html, _unfluff, title, description, canonicalLink, text;

    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.next = 2;
            return fetch(urlInput.value).then(function (res) {
              return res.text();
            });

          case 2:
            html = _context.sent;
            _unfluff = unfluff(html), title = _unfluff.title, description = _unfluff.description, canonicalLink = _unfluff.canonicalLink, text = _unfluff.text;


            titleDisplay.innerHTML = title;
            descDisplay.innerHTML = description;
            linkDisplay.innerHTML = canonicalLink;
            linkDisplay.href = canonicalLink;
            textDisplay.innerHTML = text;

          case 9:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, undefined);
  })));
});

},{"fetch-everywhere":43,"unfluff":102}],2:[function(require,module,exports){
"use strict";

module.exports = CSSselect;

var Pseudos       = require("./lib/pseudos.js"),
    DomUtils      = require("domutils"),
    findOne       = DomUtils.findOne,
    findAll       = DomUtils.findAll,
    getChildren   = DomUtils.getChildren,
    removeSubsets = DomUtils.removeSubsets,
    falseFunc     = require("./lib/basefunctions.js").falseFunc,
    compile       = require("./lib/compile.js"),
    compileUnsafe = compile.compileUnsafe;

function getSelectorFunc(searchFunc){
	return function select(query, elems, options){
		if(typeof query !== "function") query = compileUnsafe(query, options);
		if(!Array.isArray(elems)) elems = getChildren(elems);
		else elems = removeSubsets(elems);
		return searchFunc(query, elems);
	};
}

var selectAll = getSelectorFunc(function selectAll(query, elems){
	return (query === falseFunc || !elems || elems.length === 0) ? [] : findAll(query, elems);
});

var selectOne = getSelectorFunc(function selectOne(query, elems){
	return (query === falseFunc || !elems || elems.length === 0) ? null : findOne(query, elems);
});

function is(elem, query, options){
	return (typeof query === "function" ? query : compile(query, options))(elem);
}

/*
	the exported interface
*/
function CSSselect(query, elems, options){
	return selectAll(query, elems, options);
}

CSSselect.compile = compile;
CSSselect.filters = Pseudos.filters;
CSSselect.pseudos = Pseudos.pseudos;

CSSselect.selectAll = selectAll;
CSSselect.selectOne = selectOne;

CSSselect.is = is;

//legacy methods (might be removed)
CSSselect.parse = compile;
CSSselect.iterate = selectAll;

},{"./lib/basefunctions.js":4,"./lib/compile.js":5,"./lib/pseudos.js":8,"domutils":28}],3:[function(require,module,exports){
var DomUtils  = require("domutils"),
    hasAttrib = DomUtils.hasAttrib,
    getAttributeValue = DomUtils.getAttributeValue,
    falseFunc = require("./basefunctions.js").falseFunc;

//https://github.com/slevithan/XRegExp/blob/master/src/xregexp.js#L469
var reChars = /[-[\]{}()*+?.,\\^$|#\s]/g;

/*
	attribute selectors
*/

var attributeRules = {
	__proto__: null,
	equals: function(next, data){
		var name  = data.name,
		    value = data.value;

		if(data.ignoreCase){
			value = value.toLowerCase();

			return function equalsIC(elem){
				var attr = getAttributeValue(elem, name);
				return attr != null && attr.toLowerCase() === value && next(elem);
			};
		}

		return function equals(elem){
			return getAttributeValue(elem, name) === value && next(elem);
		};
	},
	hyphen: function(next, data){
		var name  = data.name,
		    value = data.value,
		    len = value.length;

		if(data.ignoreCase){
			value = value.toLowerCase();

			return function hyphenIC(elem){
				var attr = getAttributeValue(elem, name);
				return attr != null &&
						(attr.length === len || attr.charAt(len) === "-") &&
						attr.substr(0, len).toLowerCase() === value &&
						next(elem);
			};
		}

		return function hyphen(elem){
			var attr = getAttributeValue(elem, name);
			return attr != null &&
					attr.substr(0, len) === value &&
					(attr.length === len || attr.charAt(len) === "-") &&
					next(elem);
		};
	},
	element: function(next, data){
		var name = data.name,
		    value = data.value;

		if(/\s/.test(value)){
			return falseFunc;
		}

		value = value.replace(reChars, "\\$&");

		var pattern = "(?:^|\\s)" + value + "(?:$|\\s)",
		    flags = data.ignoreCase ? "i" : "",
		    regex = new RegExp(pattern, flags);

		return function element(elem){
			var attr = getAttributeValue(elem, name);
			return attr != null && regex.test(attr) && next(elem);
		};
	},
	exists: function(next, data){
		var name = data.name;
		return function exists(elem){
			return hasAttrib(elem, name) && next(elem);
		};
	},
	start: function(next, data){
		var name  = data.name,
		    value = data.value,
		    len = value.length;

		if(len === 0){
			return falseFunc;
		}
		
		if(data.ignoreCase){
			value = value.toLowerCase();

			return function startIC(elem){
				var attr = getAttributeValue(elem, name);
				return attr != null && attr.substr(0, len).toLowerCase() === value && next(elem);
			};
		}

		return function start(elem){
			var attr = getAttributeValue(elem, name);
			return attr != null && attr.substr(0, len) === value && next(elem);
		};
	},
	end: function(next, data){
		var name  = data.name,
		    value = data.value,
		    len   = -value.length;

		if(len === 0){
			return falseFunc;
		}

		if(data.ignoreCase){
			value = value.toLowerCase();

			return function endIC(elem){
				var attr = getAttributeValue(elem, name);
				return attr != null && attr.substr(len).toLowerCase() === value && next(elem);
			};
		}

		return function end(elem){
			var attr = getAttributeValue(elem, name);
			return attr != null && attr.substr(len) === value && next(elem);
		};
	},
	any: function(next, data){
		var name  = data.name,
		    value = data.value;

		if(value === ""){
			return falseFunc;
		}

		if(data.ignoreCase){
			var regex = new RegExp(value.replace(reChars, "\\$&"), "i");

			return function anyIC(elem){
				var attr = getAttributeValue(elem, name);
				return attr != null && regex.test(attr) && next(elem);
			};
		}

		return function any(elem){
			var attr = getAttributeValue(elem, name);
			return attr != null && attr.indexOf(value) >= 0 && next(elem);
		};
	},
	not: function(next, data){
		var name  = data.name,
		    value = data.value;

		if(value === ""){
			return function notEmpty(elem){
				return !!getAttributeValue(elem, name) && next(elem);
			};
		} else if(data.ignoreCase){
			value = value.toLowerCase();

			return function notIC(elem){
				var attr = getAttributeValue(elem, name);
				return attr != null && attr.toLowerCase() !== value && next(elem);
			};
		}

		return function not(elem){
			return getAttributeValue(elem, name) !== value && next(elem);
		};
	}
};

module.exports = {
	compile: function(next, data){
		return attributeRules[data.action](next, data);
	},
	rules: attributeRules
};

},{"./basefunctions.js":4,"domutils":28}],4:[function(require,module,exports){
module.exports = {
	trueFunc: function trueFunc(){
		return true;
	},
	falseFunc: function falseFunc(){
		return false;
	}
};
},{}],5:[function(require,module,exports){
/*
	compiles a selector to an executable function
*/

module.exports = compile;
module.exports.compileUnsafe = compileUnsafe;

var parse       = require("CSSwhat"),
    DomUtils    = require("domutils"),
    isTag       = DomUtils.isTag,
    Rules       = require("./general.js"),
    sortRules   = require("./sort.js"),
    BaseFuncs   = require("./basefunctions.js"),
    trueFunc    = BaseFuncs.trueFunc,
    falseFunc   = BaseFuncs.falseFunc;

function compile(selector, options){
	var next = compileUnsafe(selector, options);

	return function base(elem){
		return isTag(elem) && next(elem);
	};
}

function compileUnsafe(selector, options){
	return parse(selector, options)
		.map(compileRules)
		.reduce(reduceRules, falseFunc);
}

function compileRules(arr){
	if(arr.length === 0) return falseFunc;
	return sortRules(arr).reduce(function(func, rule){
		if(func === falseFunc) return func;
		return Rules[rule.type](func, rule);
	}, trueFunc);
}

function reduceRules(a, b){
	if(b === falseFunc || a === trueFunc){
		return a;
	}
	if(a === falseFunc || b === trueFunc){
		return b;
	}

	return function combine(elem){
		return a(elem) || b(elem);
	};	
}

//:not and :has have to compile selectors
//doing this in lib/pseudos.js would lead to circular dependencies,
//so we add them here

var Pseudos     = require("./pseudos.js"),
    filters     = Pseudos.filters,
    isParent    = Pseudos.pseudos.parent,
    existsOne   = DomUtils.existsOne,
    getChildren = DomUtils.getChildren;

filters.not = function(next, select){
	var func = compileUnsafe(select);

	if(func === falseFunc) return next;
	if(func === trueFunc)  return falseFunc;

	return function(elem){
		return !func(elem) && next(elem);
	};
};

filters.has = function(next, selector){
	var func = compile(selector);

	if(func === falseFunc) return falseFunc;
	if(func === trueFunc)  return function(elem){
			return isParent(elem) && next(elem);
		};

	return function has(elem){
		return next(elem) && existsOne(func, getChildren(elem));
	};
};

},{"./basefunctions.js":4,"./general.js":6,"./pseudos.js":8,"./sort.js":9,"CSSwhat":10,"domutils":28}],6:[function(require,module,exports){
var DomUtils    = require("domutils"),
    isTag       = DomUtils.isTag,
    getParent   = DomUtils.getParent,
    getChildren = DomUtils.getChildren,
    getSiblings = DomUtils.getSiblings,
    getName     = DomUtils.getName;

/*
	all available rules
*/
module.exports = {
	__proto__: null,

	attribute: require("./attributes.js").compile,
	pseudo: require("./pseudos.js").compile,

	//tags
	tag: function(next, data){
		var name = data.name;
		return function tag(elem){
			return getName(elem) === name && next(elem);
		};
	},

	//traversal
	descendant: function(next){
		return function descendant(elem){
			var found = false;

			while(!found && (elem = getParent(elem))){
				found = next(elem);
			}

			return found;
		};
	},
	parent: function(next){
		return function parent(elem){
			return getChildren(elem).some(next);
		};
	},
	child: function(next){
		return function child(elem){
			var parent = getParent(elem);
			return !!parent && next(parent);
		};
	},
	sibling: function(next){
		return function sibling(elem){
			var siblings = getSiblings(elem);

			for(var i = 0; i < siblings.length; i++){
				if(isTag(siblings[i])){
					if(siblings[i] === elem) break;
					if(next(siblings[i])) return true;
				}
			}

			return false;
		};
	},
	adjacent: function(next){
		return function adjacent(elem){
			var siblings = getSiblings(elem),
			    lastElement;

			for(var i = 0; i < siblings.length; i++){
				if(isTag(siblings[i])){
					if(siblings[i] === elem) break;
					lastElement = siblings[i];
				}
			}

			return !!lastElement && next(lastElement);
		};
	},
	universal: function(next){
		return next;
	}
};
},{"./attributes.js":3,"./pseudos.js":8,"domutils":28}],7:[function(require,module,exports){
var BaseFuncs = require("./basefunctions.js"),
    trueFunc  = BaseFuncs.trueFunc,
    falseFunc = BaseFuncs.falseFunc;

module.exports = function nthCheck(formula){
	return compile(parse(formula));
};

module.exports.parse = parse;
module.exports.compile = compile;

//following http://www.w3.org/TR/css3-selectors/#nth-child-pseudo

//[ ['-'|'+']? INTEGER? {N} [ S* ['-'|'+'] S* INTEGER ]?
var re_nthElement = /^([+\-]?\d*n)?\s*(?:([+\-]?)\s*(\d+))?$/;

/*
	parses a nth-check formula, returns an array of two numbers
*/
function parse(formula){
	formula = formula.trim().toLowerCase();

	if(formula === "even"){
		return [2, 0];
	} else if(formula === "odd"){
		return [2, 1];
	} else {
		var parsed = formula.match(re_nthElement);

		if(!parsed){
			throw new SyntaxError("n-th rule couldn't be parsed ('" + formula + "')");
		}

		var a;

		if(parsed[1]){
			a = parseInt(parsed[1], 10);
			if(!a){
				if(parsed[1].charAt(0) === "-") a = -1;
				else a = 1;
			}
		} else a = 0;

		return [
			a,
			parsed[3] ? parseInt((parsed[2] || "") + parsed[3], 10) : 0
		];
	}
}

/*
	returns a function that checks if an elements index matches the given rule
	highly optimized to return the fastest solution
*/
function compile(parsed){
	var a = parsed[0],
	    b = parsed[1] - 1;

	//when b <= 0, a*n won't be possible for any matches when a < 0
	//besides, the specification says that no element is matched when a and b are 0
	if(b < 0 && a <= 0) return falseFunc;

	//when a is in the range -1..1, it matches any element (so only b is checked)
	if(a ===-1) return function(pos){ return pos <= b; };
	if(a === 0) return function(pos){ return pos === b; };
	//when b <= 0 and a === 1, they match any element
	if(a === 1) return b < 0 ? trueFunc : function(pos){ return pos >= b; };

	//when a > 0, modulo can be used to check if there is a match
	var bMod = b % a;
	if(bMod < 0) bMod += a;

	if(a > 1){
		return function(pos){
			return pos >= b && pos % a === bMod;
		};
	}

	a *= -1; //make `a` positive

	return function(pos){
		return pos <= b && pos % a === bMod;
	};
}
},{"./basefunctions.js":4}],8:[function(require,module,exports){
/*
	pseudo selectors
	
	---
	
	they are available in two forms:
	* filters called when the selector 
	  is compiled and return a function
	  that needs to return next()
	* pseudos get called on execution
	  they need to return a boolean
*/

var DomUtils    = require("domutils"),
    isTag       = DomUtils.isTag,
    getText     = DomUtils.getText,
    getParent   = DomUtils.getParent,
    getChildren = DomUtils.getChildren,
    getSiblings = DomUtils.getSiblings,
    hasAttrib   = DomUtils.hasAttrib,
    getName     = DomUtils.getName,
    getAttribute= DomUtils.getAttributeValue,
    getNCheck   = require("./nth-check.js"),
    checkAttrib = require("./attributes.js").rules.equals,
    BaseFuncs   = require("./basefunctions.js"),
    trueFunc    = BaseFuncs.trueFunc,
    falseFunc   = BaseFuncs.falseFunc;

//helper methods
function getFirstElement(elems){
	for(var i = 0; elems && i < elems.length; i++){
		if(isTag(elems[i])) return elems[i];
	}
}

function getAttribFunc(name, value){
	var data = {name: name, value: value};
	return function attribFunc(next){
		return checkAttrib(next, data);
	};
}

function getChildFunc(next){
	return function(elem){
		return !!getParent(elem) && next(elem);
	};
}

var filters = {
	contains: function(next, text){
		if(
			(text.charAt(0) === "\"" || text.charAt(0) === "'") &&
			text.charAt(0) === text.substr(-1)
		){
			text = text.slice(1, -1);
		}
		return function contains(elem){
			return getText(elem).indexOf(text) >= 0 && next(elem);
		};
	},

	//location specific methods
	//first- and last-child methods return as soon as they find another element
	"first-child": function(next){
		return function firstChild(elem){
			return getFirstElement(getSiblings(elem)) === elem && next(elem);
		};
	},
	"last-child": function(next){
		return function lastChild(elem){
			var siblings = getSiblings(elem);

			for(var i = siblings.length - 1; i >= 0; i--){
				if(siblings[i] === elem) return next(elem);
				if(isTag(siblings[i])) break;
			}

			return false;
		};
	},
	"first-of-type": function(next){
		return function firstOfType(elem){
			var siblings = getSiblings(elem);

			for(var i = 0; i < siblings.length; i++){
				if(isTag(siblings[i])){
					if(siblings[i] === elem) return next(elem);
					if(getName(siblings[i]) === getName(elem)) break;
				}
			}

			return false;
		};
	},
	"last-of-type": function(next){
		return function lastOfType(elem){
			var siblings = getSiblings(elem);

			for(var i = siblings.length-1; i >= 0; i--){
				if(isTag(siblings[i])){
					if(siblings[i] === elem) return next(elem);
					if(getName(siblings[i]) === getName(elem)) break;
				}
			}

			return false;
		};
	},
	"only-of-type": function(next){
		return function onlyOfType(elem){
			var siblings = getSiblings(elem);

			for(var i = 0, j = siblings.length; i < j; i++){
				if(isTag(siblings[i])){
					if(siblings[i] === elem) continue;
					if(getName(siblings[i]) === getName(elem)) return false;
				}
			}

			return next(elem);
		};
	},
	"only-child": function(next){
		return function onlyChild(elem){
			var siblings = getSiblings(elem);

			for(var i = 0; i < siblings.length; i++){
				if(isTag(siblings[i]) && siblings[i] !== elem) return false;
			}

			return next(elem);
		};
	},
	"nth-child": function(next, rule){
		var func = getNCheck(rule);

		if(func === falseFunc) return func;
		if(func === trueFunc)  return getChildFunc(next);

		return function nthChild(elem){
			var siblings = getSiblings(elem);

			for(var i = 0, pos = 0; i < siblings.length; i++){
				if(isTag(siblings[i])){
					if(siblings[i] === elem) break;
					else pos++;
				}
			}

			return func(pos) && next(elem);
		};
	},
	"nth-last-child": function(next, rule){
		var func = getNCheck(rule);

		if(func === falseFunc) return func;
		if(func === trueFunc)  return getChildFunc(next);

		return function nthLastChild(elem){
			var siblings = getSiblings(elem);

			for(var pos = 0, i = siblings.length - 1; i >= 0; i--){
				if(isTag(siblings[i])){
					if(siblings[i] === elem) break;
					else pos++;
				}
			}

			return func(pos) && next(elem);
		};
	},
	"nth-of-type": function(next, rule){
		var func = getNCheck(rule);

		if(func === falseFunc) return func;
		if(func === trueFunc)  return getChildFunc(next);

		return function nthOfType(elem){
			var siblings = getSiblings(elem);

			for(var pos = 0, i = 0; i < siblings.length; i++){
				if(isTag(siblings[i])){
					if(siblings[i] === elem) break;
					if(getName(siblings[i]) === getName(elem)) pos++;
				}
			}

			return func(pos) && next(elem);
		};
	},
	"nth-last-of-type": function(next, rule){
		var func = getNCheck(rule);

		if(func === falseFunc) return func;
		if(func === trueFunc)  return getChildFunc(next);

		return function nthLastOfType(elem){
			var siblings = getSiblings(elem);

			for(var pos = 0, i = siblings.length - 1; i >= 0; i--){
				if(siblings[i] === elem) break;
				if(getName(siblings[i]) === getName(elem)) pos++;
			}

			return func(pos) && next(elem);
		};
	},

	//jQuery extensions (others follow as pseudos)
	checkbox: getAttribFunc("type", "checkbox"),
	file: getAttribFunc("type", "file"),
	password: getAttribFunc("type", "password"),
	radio: getAttribFunc("type", "radio"),
	reset: getAttribFunc("type", "reset"),
	image: getAttribFunc("type", "image"),
	submit: getAttribFunc("type", "submit")
};

//while filters are precompiled, pseudos get called when they are needed
var pseudos = {
	root: function(elem){
		return !getParent(elem);
	},
	empty: function(elem){
		return !getChildren(elem).some(function(elem){
			return isTag(elem) || elem.type === "text";
		});
	},

	//forms
	//to consider: :target, :enabled
	selected: function(elem){
		if(hasAttrib(elem, "selected")) return true;
		else if(getName(elem) !== "option") return false;

		//the first <option> in a <select> is also selected
		var parent = getParent(elem);

		if(!parent || getName(parent) !== "select") return false;

		var siblings = getChildren(parent),
			sawElem  = false;

		for(var i = 0; i < siblings.length; i++){
			if(isTag(siblings[i])){
				if(siblings[i] === elem){
					sawElem = true;
				} else if(!sawElem){
					return false;
				} else if(hasAttrib(siblings[i], "selected")){
					return false;
				}
			}
		}

		return sawElem;
	},
	disabled: function(elem){
		return hasAttrib(elem, "disabled");
	},
	enabled: function(elem){
		return !hasAttrib(elem, "disabled");
	},
	checked: function(elem){
		return hasAttrib(elem, "checked") || pseudos.selected(elem);
	},

	//jQuery extensions

	//:parent is the inverse of :empty
	parent: function(elem){
		return !pseudos.empty(elem);
	},
	header: function(elem){
		var name = getName(elem);
		return name === "h1" ||
		       name === "h2" ||
		       name === "h3" ||
		       name === "h4" ||
		       name === "h5" ||
		       name === "h6";
	},

	button: function(elem){
		var name = getName(elem);
		return name === "button" ||
		       name === "input" &&
		       getAttribute(elem, "type") === "button";
	},
	input: function(elem){
		var name = getName(elem);
		return name === "input" ||
		       name === "textarea" ||
		       name === "select" ||
		       name === "button";
	},
	text: function(elem){
		var attr;
		return getName(elem) === "input" && (
			!(attr = getAttribute(elem, "type")) ||
			attr.toLowerCase() === "text"
		);
	}
};

function verifyArgs(func, name, subselect){
	if(subselect === null){
		if(func.length > 1){
			throw new SyntaxError("pseudo-selector :" + name + " requires an argument");
		}
	} else {
		if(func.length === 1){
			throw new SyntaxError("pseudo-selector :" + name + " doesn't have any arguments");
		}	
	}
}

module.exports = {
	compile: function(next, data){
		var name = data.name,
			subselect = data.data;

		if(typeof filters[name] === "function"){
			verifyArgs(filters[name], name,  subselect);
			return filters[name](next, subselect);
		} else if(typeof pseudos[name] === "function"){
			var func = pseudos[name];
			verifyArgs(func, name, subselect);
			return function pseudoArgs(elem){
				return func(elem, subselect) && next(elem);
			};
		} else {
			throw new SyntaxError("unmatched pseudo-class :" + name);
		}
	},
	filters: filters,
	pseudos: pseudos
};

},{"./attributes.js":3,"./basefunctions.js":4,"./nth-check.js":7,"domutils":28}],9:[function(require,module,exports){
module.exports = sortByProcedure;

/*
	sort the parts of the passed selector,
	as there is potential for optimization
	(some types of selectors are faster than others)
*/

var ATTRIBUTE = 1;

var procedure = {
	__proto__: null,
	universal: 5, //should be last so that it can be ignored
	tag: 3, //very quick test
	attribute: ATTRIBUTE,
	pseudo: 0, //can be pretty expensive (especially :has)

	//everything else shouldn't be moved
	descendant: -1,
	child: -1,
	parent: -1,
	sibling: -1,
	adjacent: -1
};

var attributes = {
	__proto__: null,
	exists: 8,
	equals: 7,
	not: 6,
	start: 5,
	end: 4,
	any: 3,
	hyphen: 2,
	element: 1
};

function sortByProcedure(arr){
	for(var i = 1; i < arr.length; i++){
		var procNew = procedure[arr[i].type];

		if(procNew < 0) continue;

		for(var j = i - 1; j >= 0; j--){
			if(
				procNew > procedure[arr[j].type] || !(
					procNew === ATTRIBUTE &&
					procedure[arr[j].type] === ATTRIBUTE &&
					attributes[arr[i].action] <= attributes[arr[j].action]
				)
			) break;

			var tmp = arr[j + 1];
			arr[j + 1] = arr[j];
			arr[j] = tmp;
		}
	}
	return arr;
}
},{}],10:[function(require,module,exports){
"use strict";

module.exports = parse;

var re_ws = /^\s/,
    re_name = /^(?:\\.|[\w\-\u00c0-\uFFFF])+/,
    re_escape = /\\([\da-f]{1,6}\s?|(\s)|.)/ig,
    //modified version of https://github.com/jquery/sizzle/blob/master/src/sizzle.js#L87
    re_attr = /^\s*((?:\\.|[\w\u00c0-\uFFFF\-])+)\s*(?:(\S?)=\s*(?:(['"])(.*?)\3|(#?(?:\\.|[\w\u00c0-\uFFFF\-])*)|)|)\s*(i)?\]/;

var actionTypes = {
	__proto__: null,
	"undefined": "exists",
	"":  "equals",
	"~": "element",
	"^": "start",
	"$": "end",
	"*": "any",
	"!": "not",
	"|": "hyphen"
};

var simpleSelectors = {
	__proto__: null,
	">": "child",
	"<": "parent",
	"~": "sibling",
	"+": "adjacent"
};

var attribSelectors = {
	__proto__: null,
	"#": ["id", "equals"],
	".": ["class", "element"]
};

//unescape function taken from https://github.com/jquery/sizzle/blob/master/src/sizzle.js#L139
function funescape( _, escaped, escapedWhitespace ) {
	var high = "0x" + escaped - 0x10000;
	// NaN means non-codepoint
	// Support: Firefox
	// Workaround erroneous numeric interpretation of +"0x"
	return high !== high || escapedWhitespace ?
		escaped :
		// BMP codepoint
		high < 0 ?
			String.fromCharCode( high + 0x10000 ) :
			// Supplemental Plane codepoint (surrogate pair)
			String.fromCharCode( high >> 10 | 0xD800, high & 0x3FF | 0xDC00 );
}

function unescapeCSS(str){
	return str.replace(re_escape, funescape);
}

function getClosingPos(selector){
	var pos = 1, counter = 1, len = selector.length;

	for(; counter > 0 && pos < len; pos++){
		if(selector.charAt(pos) === "(") counter++;
		else if(selector.charAt(pos) === ")") counter--;
	}

	return pos;
}

function parse(selector, options){
	selector = (selector + "").trimLeft();

	var subselects = [],
	    tokens = [],
	    sawWS = false,
	    data, firstChar, name;
	
	function getName(){
		var sub = selector.match(re_name)[0];
		selector = selector.substr(sub.length);
		return unescapeCSS(sub);
	}

	while(selector !== ""){
		if(re_name.test(selector)){
			if(sawWS){
				tokens.push({type: "descendant"});
				sawWS = false;
			}

			name = getName();

			if(!options || ("lowerCaseTags" in options ? options.lowerCaseTags : !options.xmlMode)){
				name = name.toLowerCase();
			}

			tokens.push({type: "tag", name: name});
		} else if(re_ws.test(selector)){
			sawWS = true;
			selector = selector.trimLeft();
		} else {
			firstChar = selector.charAt(0);
			selector = selector.substr(1);

			if(firstChar in simpleSelectors){
				tokens.push({type: simpleSelectors[firstChar]});
				selector = selector.trimLeft();
				sawWS = false;
				continue;
			} else if(firstChar === ","){
				if(tokens.length === 0){
					throw new SyntaxError("empty sub-selector");
				}
				subselects.push(tokens);
				tokens = [];

				selector = selector.trimLeft();
				sawWS = false;
				continue;
			} else if(sawWS){
				tokens.push({type: "descendant"});
				sawWS = false;
			}

			if(firstChar === "*"){
				tokens.push({type: "universal"});
			} else if(firstChar in attribSelectors){
				tokens.push({
					type: "attribute",
					name: attribSelectors[firstChar][0],
					action: attribSelectors[firstChar][1],
					value: getName(),
					ignoreCase: false
				});
			} else if(firstChar === "["){
				data = selector.match(re_attr);
				if(!data){
					throw new SyntaxError("Malformed attribute selector: " + selector);
				}
				selector = selector.substr(data[0].length);
				name = unescapeCSS(data[1]);

				if(
					!options || (
						"lowerCaseAttributeNames" in options ?
							options.lowerCaseAttributeNames :
							!options.xmlMode
					)
				){
					name = name.toLowerCase();
				}

				tokens.push({
					type: "attribute",
					name: name,
					action: actionTypes[data[2]],
					value: unescapeCSS(data[4] || data[5] || ""),
					ignoreCase: !!data[6]
				});
				
			} else if(firstChar === ":"){
				//if(selector.charAt(0) === ":"){} //TODO pseudo-element
				name = getName().toLowerCase();
				data = null;
				
				if(selector.charAt(0) === "("){
					var pos = getClosingPos(selector);
					data = selector.substr(1, pos - 2);
					selector = selector.substr(pos);
				}
				
				tokens.push({type: "pseudo", name: name, data: data});
			} else {
				//otherwise, the parser needs to throw or it would enter an infinite loop
				throw new SyntaxError("Unmatched selector: " + firstChar + selector);
			}
		}
	}
	
	if(subselects.length > 0 && tokens.length === 0){
		throw new SyntaxError("empty sub-selector");
	}
	subselects.push(tokens);
	return subselects;
}
},{}],11:[function(require,module,exports){
/**
 * Export cheerio (with )
 */

exports = module.exports = require('./lib/cheerio');

/*
  Export the version
*/

exports.version = require('./package').version;

},{"./lib/cheerio":16,"./package":20}],12:[function(require,module,exports){
var _ = require('lodash'),
  utils = require('../utils'),
  isTag = utils.isTag,
  domEach = utils.domEach,
  hasOwn = Object.prototype.hasOwnProperty,
  camelCase = utils.camelCase,
  cssCase = utils.cssCase,
  rspace = /\s+/,
  dataAttrPrefix = 'data-',

  // Lookup table for coercing string data-* attributes to their corresponding
  // JavaScript primitives
  primitives = {
    null: null,
    true: true,
    false: false
  },

  // Attributes that are booleans
  rboolean = /^(?:autofocus|autoplay|async|checked|controls|defer|disabled|hidden|loop|multiple|open|readonly|required|scoped|selected)$/i,
  // Matches strings that look like JSON objects or arrays
  rbrace = /^(?:\{[\w\W]*\}|\[[\w\W]*\])$/;


var getAttr = function(elem, name) {
  if (!elem || !isTag(elem)) return;

  if (!elem.attribs) {
    elem.attribs = {};
  }

  // Return the entire attribs object if no attribute specified
  if (!name) {
    return elem.attribs;
  }

  if (hasOwn.call(elem.attribs, name)) {
    // Get the (decoded) attribute
    return elem.attribs[name];
  }
};

var setAttr = function(el, name, value) {

  if (value === null) {
    removeAttribute(el, name);
  } else {
    el.attribs[name] = value+'';
  }
};

var attr = exports.attr = function(name, value) {
  // Set the value (with attr map support)
  if (typeof name === 'object' || value !== undefined) {
    if (typeof value === 'function') {
      return domEach(this, function(i, el) {
        setAttr(el, name, value.call(el, i, el.attribs[name]));
      });
    }
    return domEach(this, function(i, el) {
      if (!isTag(el)) return;

      if (typeof name === 'object') {
        _.each(name, function(name, key) {
          el.attribs[key] = name+'';
        });
      } else {
        setAttr(el, name, value);
      }
    });
  }

  return getAttr(this[0], name);
};

var setData = function(el, name, value) {
  if (typeof name === 'object') return _.extend(el.data, name);
  if (typeof name === 'string' && value !== undefined) {
    el.data[name] = value;
  } else if (typeof name === 'object') {
    _.exend(el.data, name);
  }
};

// Read the specified attribute from the equivalent HTML5 `data-*` attribute,
// and (if present) cache the value in the node's internal data store. If no
// attribute name is specified, read *all* HTML5 `data-*` attributes in this
// manner.
var readData = function(el, name) {
  var readAll = arguments.length === 1;
  var domNames, domName, jsNames, jsName, value, idx, length;

  if (readAll) {
    domNames = Object.keys(el.attribs).filter(function(attrName) {
      return attrName.slice(0, dataAttrPrefix.length) === dataAttrPrefix;
    });
    jsNames = domNames.map(function(domName) {
      return camelCase(domName.slice(dataAttrPrefix.length));
    });
  } else {
    domNames = [dataAttrPrefix + cssCase(name)];
    jsNames = [name];
  }

  for (idx = 0, length = domNames.length; idx < length; ++idx) {
    domName = domNames[idx];
    jsName = jsNames[idx];
    if (hasOwn.call(el.attribs, domName)) {
      value = el.attribs[domName];

      if (hasOwn.call(primitives, value)) {
        value = primitives[value];
      } else if (value === String(Number(value))) {
        value = Number(value);
      } else if (rbrace.test(value)) {
        value = JSON.parse(value);
      }

      el.data[jsName] = value;
    }
  }

  return readAll ? el.data : value;
};

var data = exports.data = function(name, value) {
  var elem = this[0];

  if (!elem || !isTag(elem)) return;

  if (!elem.data) {
    elem.data = {};
  }

  // Return the entire data object if no data specified
  if (!name) {
    return readData(elem);
  }

  // Set the value (with attr map support)
  if (typeof name === 'object' || value !== undefined) {
    domEach(this, function(i, el) {
      setData(el, name, value);
    });
    return this;
  } else if (hasOwn.call(elem.data, name)) {
    return elem.data[name];
  }

  return readData(elem, name);
};

/**
 * Get the value of an element
 */

var val = exports.val = function(value) {
  var querying = arguments.length === 0,
      element = this[0];

  if(!element) return;

  switch (element.name) {
    case 'textarea':
      return this.text(value);
    case 'input':
      switch (this.attr('type')) {
        case 'radio':
          var queryString = 'input[type=radio][name=' + this.attr('name') + ']:checked';
          var parentEl, root;

          // Go up until we hit a form or root
          parentEl = this.closest('form');
          if (parentEl.length === 0) {
            root = (this.parents().last()[0] || this[0]).root;
            parentEl = this._make(root);
          }

          if (querying) {
            return parentEl.find(queryString).attr('value');
          } else {
            parentEl.find(':checked').removeAttr('checked');
            parentEl.find('input[type=radio][value="' + value + '"]').attr('checked', '');
            return this;
          }
          break;
        default:
          return this.attr('value', value);
      }
      return;
    case 'select':
      var option = this.find('option:selected'),
          returnValue;
      if (option === undefined) return undefined;
      if (!querying) {
        if (!this.attr().hasOwnProperty('multiple') && typeof value == 'object') {
          return this;
        }
        if (typeof value != 'object') {
          value = [value];
        }
        this.find('option').removeAttr('selected');
        for (var i = 0; i < value.length; i++) {
          this.find('option[value="' + value[i] + '"]').attr('selected', '');
        }
        return this;
      }
      returnValue = option.attr('value');
      if (this.attr().hasOwnProperty('multiple')) {
        returnValue = [];
        domEach(option, function(i, el) {
          returnValue.push(el.attribs.value);
        });
      }
      return returnValue;
    case 'option':
      if (!querying) {
        this.attr('value', value);
        return this;
      }
      return this.attr('value');
  }
};

/**
 * Remove an attribute
 */

var removeAttribute = function(elem, name) {
  if (!elem.attribs || !hasOwn.call(elem.attribs, name))
    return;

  if (name === elem.attribs[name] && rboolean.test(elem.attribs[name]))
    elem.attribs[name] = false;
  else
    delete elem.attribs[name];
};


var removeAttr = exports.removeAttr = function(name) {
  domEach(this, function(i, elem) {
    removeAttribute(elem, name);
  });

  return this;
};

var hasClass = exports.hasClass = function(className) {
  return _.any(this, function(elem) {
    var attrs = elem.attribs,
        clazz = attrs && attrs['class'],
        idx = -1,
        end;

    if (clazz) {
      while ((idx = clazz.indexOf(className, idx+1)) > -1) {
        end = idx + className.length;

        if ((idx === 0 || rspace.test(clazz[idx-1]))
            && (end === clazz.length || rspace.test(clazz[end]))) {
          return true;
        }
      }
    }
  });
};

var addClass = exports.addClass = function(value) {
  // Support functions
  if (typeof value === 'function') {
    return domEach(this, function(i, el) {
      var className = el.attribs['class'] || '';
      addClass.call([el], value.call(el, i, className));
    });
  }

  // Return if no value or not a string or function
  if (!value || typeof value !== 'string') return this;

  var classNames = value.split(rspace),
      numElements = this.length;


  for (var i = 0; i < numElements; i++) {
    // If selected element isn't a tag, move on
    if (!isTag(this[i])) continue;

    // If we don't already have classes
    var className = getAttr(this[i], 'class'),
        numClasses,
        setClass;

    if (!className) {
      setAttr(this[i], 'class', classNames.join(' ').trim());
    } else {
      setClass = ' ' + className + ' ';
      numClasses = classNames.length;

      // Check if class already exists
      for (var j = 0; j < numClasses; j++) {
        var appendClass = classNames[j] + ' ';
        if (!~setClass.indexOf(' ' + appendClass))
          setClass += appendClass;
      }

      setAttr(this[i], 'class', setClass.trim());
    }
  }

  return this;
};

var splitClass = function(className) {
  return className ? className.trim().split(rspace) : [];
};

var removeClass = exports.removeClass = function(value) {
  var classes,
      numClasses,
      removeAll;

  // Handle if value is a function
  if (typeof value === 'function') {
    return domEach(this, function(i, el) {
      removeClass.call([el], value.call(el, i, el.attribs['class'] || ''));
    });
  }

  classes = splitClass(value);
  numClasses = classes.length;
  removeAll = arguments.length === 0;

  return domEach(this, function(i, el) {
    if (!isTag(el)) return;

    if (removeAll) {
      // Short circuit the remove all case as this is the nice one
      el.attribs.class = '';
    } else {
      var elClasses = splitClass(el.attribs.class),
          index,
          changed;

      for (var j = 0; j < numClasses; j++) {
        index = elClasses.indexOf(classes[j]);

        if (index >= 0) {
          elClasses.splice(index, 1);
          changed = true;

          // We have to do another pass to ensure that there are not duplicate
          // classes listed
          j--;
        }
      }
      if (changed) {
        el.attribs.class = elClasses.join(' ');
      }
    }
  });
};

var toggleClass = exports.toggleClass = function(value, stateVal) {
  // Support functions
  if (typeof value === 'function') {
    return domEach(this, function(i, el) {
      toggleClass.call([el], value.call(el, i, el.attribs['class'] || '', stateVal), stateVal);
    });
  }

  // Return if no value or not a string or function
  if (!value || typeof value !== 'string') return this;

  var classNames = value.split(rspace),
    numClasses = classNames.length,
    state = typeof stateVal === 'boolean' ? stateVal ? 1 : -1 : 0,
    numElements = this.length,
    elementClasses,
    index;

  for (var i = 0; i < numElements; i++) {
    // If selected element isn't a tag, move on
    if (!isTag(this[i])) continue;

    elementClasses = splitClass(this[i].attribs.class);

    // Check if class already exists
    for (var j = 0; j < numClasses; j++) {
      // Check if the class name is currently defined
      index = elementClasses.indexOf(classNames[j]);

      // Add if stateValue === true or we are toggling and there is no value
      if (state >= 0 && index < 0) {
        elementClasses.push(classNames[j]);
      } else if (state <= 0 && index >= 0) {
        // Otherwise remove but only if the item exists
        elementClasses.splice(index, 1);
      }
    }

    this[i].attribs.class = elementClasses.join(' ');
  }

  return this;
};

var is = exports.is = function (selector) {
  if (selector) {
    return this.filter(selector).length > 0;
  }
  return false;
};


},{"../utils":19,"lodash":66}],13:[function(require,module,exports){
var _ = require('lodash'),
    domEach = require('../utils').domEach;
var toString = Object.prototype.toString;

/**
 * Set / Get css.
 *
 * @param {String|Object} prop
 * @param {String} val
 * @return {self}
 * @api public
 */

exports.css = function(prop, val) {
  if (arguments.length === 2 ||
    // When `prop` is a "plain" object
    (toString.call(prop) === '[object Object]')) {
    return domEach(this, function(idx, el) {
      setCss(el, prop, val, idx);
    });
  } else {
    return getCss(this[0], prop);
  }
};

/**
 * Set styles of all elements.
 *
 * @param {String|Object} prop
 * @param {String} val
 * @param {Number} idx - optional index within the selection
 * @return {self}
 * @api private
 */

function setCss(el, prop, val, idx) {
  if ('string' == typeof prop) {
    var styles = getCss(el);
    if (typeof val === 'function') {
      val = val.call(el, idx, el);
    }

    if (val === '') {
      delete styles[prop];
    } else if (val != null) {
      styles[prop] = val;
    }

    el.attribs.style = stringify(styles);
  } else if ('object' == typeof prop) {
    Object.keys(prop).forEach(function(k){
      setCss(el, k, prop[k]);
    });
  }
}

/**
 * Get parsed styles of the first element.
 *
 * @param {String} prop
 * @return {Object}
 * @api private
 */

function getCss(el, prop) {
  var styles = parse(el.attribs.style);
  if (typeof prop === 'string') {
    return styles[prop];
  } else if (Array.isArray(prop)) {
    return _.pick(styles, prop);
  } else {
    return styles;
  }
}

/**
 * Stringify `obj` to styles.
 *
 * @param {Object} obj
 * @return {Object}
 * @api private
 */

function stringify(obj) {
  return Object.keys(obj || {})
    .reduce(function(str, prop){
      return str += ''
        + (str ? ' ' : '')
        + prop
        + ': '
        + obj[prop]
        + ';';
    }, '');
}

/**
 * Parse `styles`.
 *
 * @param {String} styles
 * @return {Object}
 * @api private
 */

function parse(styles) {
  styles = (styles || '').trim();

  if (!styles) return {};

  return styles
    .split(';')
    .reduce(function(obj, str){
      var n = str.indexOf(':');
      // skip if there is no :, or if it is the first/last character
      if (n < 1 || n === str.length-1) return obj;
      obj[str.slice(0,n).trim()] = str.slice(n+1).trim();
      return obj;
    }, {});
}

},{"../utils":19,"lodash":66}],14:[function(require,module,exports){
var _ = require('lodash'),
    parse = require('../parse'),
    $ = require('../static'),
    updateDOM = parse.update,
    evaluate = parse.evaluate,
    utils = require('../utils'),
    domEach = utils.domEach,
    encode = utils.encode,
    slice = Array.prototype.slice;

// Create an array of nodes, recursing into arrays and parsing strings if
// necessary
exports._makeDomArray = function makeDomArray(elem) {
  if (elem == null) {
    return [];
  } else if (elem.cheerio) {
    return elem.get();
  } else if (Array.isArray(elem)) {
    return _.flatten(elem.map(makeDomArray, this));
  } else if (typeof elem === 'string') {
    return evaluate(elem, this.options);
  } else {
    return [elem];
  }
};

var _insert = function(concatenator) {
  return function() {
    var self = this,
        elems = slice.call(arguments),
        dom = this._makeDomArray(elems);

    if (typeof elems[0] === 'function') {
      return domEach(this, function(i, el) {
        dom = self._makeDomArray(elems[0].call(el, i, $.html(el.children)));
        concatenator(dom, el.children, el);
      });
    } else {
      return domEach(this, function(i, el) {
        concatenator(dom, el.children, el);
      });
    }
  };
};

/*
 * Modify an array in-place, removing some number of elements and adding new
 * elements directly following them.
 *
 * @param {Array} array Target array to splice.
 * @param {Number} spliceIdx Index at which to begin changing the array.
 * @param {Number} spliceCount Number of elements to remove from the array.
 * @param {Array} newElems Elements to insert into the array.
 *
 * @api private
 */
var uniqueSplice = function(array, spliceIdx, spliceCount, newElems, parent) {
  var spliceArgs = [spliceIdx, spliceCount].concat(newElems),
      prev = array[spliceIdx - 1] || null,
      next = array[spliceIdx] || null;
  var idx, len, prevIdx, node, oldParent;

  // Before splicing in new elements, ensure they do not already appear in the
  // current array.
  for (idx = 0, len = newElems.length; idx < len; ++idx) {
    node = newElems[idx];
    oldParent = node.parent || node.root;
    prevIdx = oldParent && oldParent.children.indexOf(newElems[idx]);

    if (oldParent && prevIdx > -1) {
      oldParent.children.splice(prevIdx, 1);
      if (parent === oldParent && spliceIdx > prevIdx) {
        spliceArgs[0]--;
      }
    }

    node.root = null;
    node.parent = parent;

    if (node.prev) {
      node.prev.next = node.next || null;
    }

    if (node.next) {
      node.next.prev = node.prev || null;
    }

    node.prev = newElems[idx - 1] || prev;
    node.next = newElems[idx + 1] || next;
  }

  if (prev) {
    prev.next = newElems[0];
  }
  if (next) {
    next.prev = newElems[newElems.length - 1];
  }

  return array.splice.apply(array, spliceArgs);
};

var append = exports.append = _insert(function(dom, children, parent) {
  uniqueSplice(children, children.length, 0, dom, parent);
});

var prepend = exports.prepend = _insert(function(dom, children, parent) {
  uniqueSplice(children, 0, 0, dom, parent);
});

var after = exports.after = function() {
  var elems = slice.call(arguments),
      dom = this._makeDomArray(elems),
      self = this;

  domEach(this, function(i, el) {
    var parent = el.parent || el.root;
    if (!parent) {
      return;
    }

    var siblings = parent.children,
        index = siblings.indexOf(el);

    // If not found, move on
    if (!~index) return;

    if (typeof elems[0] === 'function') {
      dom = self._makeDomArray(elems[0].call(el, i));
    }

    // Add element after `this` element
    uniqueSplice(siblings, ++index, 0, dom, parent);
  });

  return this;
};

var before = exports.before = function() {
  var elems = slice.call(arguments),
      dom = this._makeDomArray(elems),
      self = this;

  domEach(this, function(i, el) {
    var parent = el.parent || el.root;
    if (!parent) {
      return;
    }

    var siblings = parent.children,
        index = siblings.indexOf(el);

    // If not found, move on
    if (!~index) return;

    if (typeof elems[0] === 'function') {
      dom = self._makeDomArray(elems[0].call(el, i));
    }

    // Add element before `el` element
    uniqueSplice(siblings, index, 0, dom, parent);
  });

  return this;
};

/*
  remove([selector])
*/
var remove = exports.remove = function(selector) {
  var elems = this;

  // Filter if we have selector
  if (selector)
    elems = elems.filter(selector);

  domEach(elems, function(i, el) {
    var parent = el.parent || el.root;
    if (!parent) {
      return;
    }

    var siblings = parent.children,
        index = siblings.indexOf(el);

    if (!~index) return;


    siblings.splice(index, 1);
    if (el.prev) {
      el.prev.next = el.next;
    }
    if (el.next) {
      el.next.prev = el.prev;
    }
    el.prev = el.next = el.parent = el.root = null;
  });

  return this;
};

var replaceWith = exports.replaceWith = function(content) {
  var self = this;

  domEach(this, function(i, el) {
    var parent = el.parent || el.root;
    if (!parent) {
      return;
    }

    var siblings = parent.children,
        dom = self._makeDomArray(typeof content === 'function' ? content.call(el, i, el) : content),
        index;

    // In the case that `dom` contains nodes that already exist in other
    // structures, ensure those nodes are properly removed.
    updateDOM(dom, null);

    index = siblings.indexOf(el);

    // Completely remove old element
    uniqueSplice(siblings, index, 1, dom, parent);
    el.parent = el.prev = el.next = el.root = null;
  });

  return this;
};

var empty = exports.empty = function() {
  domEach(this, function(i, el) {
    _.each(el.children, function(el) {
      el.next = el.prev = el.parent = null;
    });

    el.children.length = 0;
  });
  return this;
};

/**
 * Set/Get the HTML
 */
var html = exports.html = function(str) {
  if (str === undefined) {
    if (!this[0] || !this[0].children) return null;
    return $.html(this[0].children, this.options);
  }

  var opts = this.options;

  domEach(this, function(i, el) {
    _.each(el.children, function(el) {
      el.next = el.prev = el.parent = null;
    });

    var content = str.cheerio ? str.clone().get() : evaluate(str, opts);

    updateDOM(content, el);
  });

  return this;
};

var toString = exports.toString = function() {
  return $.html(this);
};

var text = exports.text = function(str) {
  // If `str` is undefined, act as a "getter"
  if (str === undefined) {
    return $.text(this);
  } else if (typeof str === 'function') {
    // Function support
    return domEach(this, function(i, el) {
      var $el = [el];
      return text.call($el, str.call(el, i, $.text($el)));
    });
  }

  // Append text node to each selected elements
  domEach(this, function(i, el) {
    _.each(el.children, function(el) {
      el.next = el.prev = el.parent = null;
    });

    var elem = {
      data: str,
      type: 'text',
      parent: el,
      prev: null,
      next: null,
      children: []
    };

    updateDOM(elem, el);
  });

  return this;
};

var clone = exports.clone = function() {
  // Turn it into HTML, then recreate it,
  // Seems to be the easiest way to reconnect everything correctly
  return this._make($.html(this));
};

},{"../parse":17,"../static":18,"../utils":19,"lodash":66}],15:[function(require,module,exports){
var _ = require('lodash'),
    select = require('CSSselect'),
    utils = require('../utils'),
    domEach = utils.domEach,
    uniqueSort = require('htmlparser2').DomUtils.uniqueSort,
    isTag = utils.isTag;

var find = exports.find = function(selector) {
  var elems = _.reduce(this, function(memo, elem) {
    return memo.concat(_.filter(elem.children, isTag));
  }, []);

  return this._make(select(selector, elems, this.options));
};

// Get the parent of each element in the current set of matched elements,
// optionally filtered by a selector.
var parent = exports.parent = function(selector) {
  var set = [];
  var $set;

  domEach(this, function(idx, elem) {
    var parentElem = elem.parent;
    if (parentElem && set.indexOf(parentElem) < 0) {
      set.push(parentElem);
    }
  });

  if (arguments.length) {
    set = filter.call(set, selector, this);
  }

  return this._make(set);
};

var parents = exports.parents = function(selector) {
  var parentNodes = [];

  // When multiple DOM elements are in the original set, the resulting set will
  // be in *reverse* order of the original elements as well, with duplicates
  // removed.
  this.get().reverse().forEach(function(elem) {
    traverseParents(this, elem.parent, selector, Infinity)
      .forEach(function(node) {
        if (parentNodes.indexOf(node) === -1) {
          parentNodes.push(node);
        }
      }
    );
  }, this);

  return this._make(parentNodes);
};

var parentsUntil = exports.parentsUntil = function(selector, filter) {
  var parentNodes = [], untilNode, untilNodes;

  if (typeof selector === 'string') {
    untilNode = select(selector, this.parents().toArray(), this.options)[0];
  } else if (selector && selector.cheerio) {
    untilNodes = selector.toArray();
  } else if (selector) {
    untilNode = selector;
  }

  // When multiple DOM elements are in the original set, the resulting set will
  // be in *reverse* order of the original elements as well, with duplicates
  // removed.

  this.toArray().reverse().forEach(function(elem) {
    while ((elem = elem.parent)) {
      if ((untilNode && elem !== untilNode) ||
        (untilNodes && untilNodes.indexOf(elem) === -1) ||
        (!untilNode && !untilNodes)) {
        if (isTag(elem) && parentNodes.indexOf(elem) === -1) { parentNodes.push(elem); }
      } else {
        break;
      }
    }
  }, this);

  return this._make(filter ? select(filter, parentNodes, this.options) : parentNodes);
};

// For each element in the set, get the first element that matches the selector
// by testing the element itself and traversing up through its ancestors in the
// DOM tree.
var closest = exports.closest = function(selector) {
  var set = [];

  if (!selector) {
    return this._make(set);
  }

  domEach(this, function(idx, elem) {
    var closestElem = traverseParents(this, elem, selector, 1)[0];

    // Do not add duplicate elements to the set
    if (closestElem && set.indexOf(closestElem) < 0) {
      set.push(closestElem);
    }
  }.bind(this));

  return this._make(set);
};

var next = exports.next = function(selector) {
  if (!this[0]) { return this; }
  var elems = [];

  _.forEach(this, function(elem) {
    while ((elem = elem.next)) {
      if (isTag(elem)) {
        elems.push(elem);
        return;
      }
    }
  });

  return selector ? filter.call(elems, selector, this) : this._make(elems);
};

var nextAll = exports.nextAll = function(selector) {
  if (!this[0]) { return this; }
  var elems = [];

  _.forEach(this, function(elem) {
    while ((elem = elem.next)) {
      if (isTag(elem) && elems.indexOf(elem) === -1) {
        elems.push(elem);
      }
    }
  });

  return selector ? filter.call(elems, selector, this) : this._make(elems);
};

var nextUntil = exports.nextUntil = function(selector, filterSelector) {
  if (!this[0]) { return this; }
  var elems = [], untilNode, untilNodes;

  if (typeof selector === 'string') {
    untilNode = select(selector, this.nextAll().get(), this.options)[0];
  } else if (selector && selector.cheerio) {
    untilNodes = selector.get();
  } else if (selector) {
    untilNode = selector;
  }

  _.forEach(this, function(elem) {
    while ((elem = elem.next)) {
      if ((untilNode && elem !== untilNode) ||
        (untilNodes && untilNodes.indexOf(elem) === -1) ||
        (!untilNode && !untilNodes)) {
        if (isTag(elem) && elems.indexOf(elem) === -1) {
          elems.push(elem);
        }
      } else {
        break;
      }
    }
  });

  return filterSelector ?
    filter.call(elems, filterSelector, this) :
    this._make(elems);
};

var prev = exports.prev = function(selector) {
  if (!this[0]) { return this; }
  var elems = [];

  _.forEach(this, function(elem) {
    while ((elem = elem.prev)) {
      if (isTag(elem)) {
        elems.push(elem);
        return;
      }
    }
  });

  return selector ? filter.call(elems, selector, this) : this._make(elems);
};

var prevAll = exports.prevAll = function(selector) {
  if (!this[0]) { return this; }
  var elems = [];

  _.forEach(this, function(elem) {
    while ((elem = elem.prev)) {
      if (isTag(elem) && elems.indexOf(elem) === -1) {
        elems.push(elem);
      }
    }
  });

  return selector ? filter.call(elems, selector, this) : this._make(elems);
};

var prevUntil = exports.prevUntil = function(selector, filterSelector) {
  if (!this[0]) { return this; }
  var elems = [], untilNode, untilNodes;

  if (typeof selector === 'string') {
    untilNode = select(selector, this.prevAll().get(), this.options)[0];
  } else if (selector && selector.cheerio) {
    untilNodes = selector.get();
  } else if (selector) {
    untilNode = selector;
  }

  _.forEach(this, function(elem) {
    while ((elem = elem.prev)) {
      if ((untilNode && elem !== untilNode) ||
        (untilNodes && untilNodes.indexOf(elem) === -1) ||
        (!untilNode && !untilNodes)) {
        if (isTag(elem) && elems.indexOf(elem) === -1) {
          elems.push(elem);
        }
      } else {
        break;
      }
    }
  });

  return filterSelector ?
    filter.call(elems, filterSelector, this) :
    this._make(elems);
};

var siblings = exports.siblings = function(selector) {
  var parent = this.parent();

  var elems = _.filter(
    parent ? parent.children() : this.siblingsAndMe(),
    function(elem) { return isTag(elem) && !this.is(elem); },
    this
  );

  if (selector !== undefined) {
    return filter.call(elems, selector, this);
  } else {
    return this._make(elems);
  }
};

var children = exports.children = function(selector) {

  var elems = _.reduce(this, function(memo, elem) {
    return memo.concat(_.filter(elem.children, isTag));
  }, []);

  if (selector === undefined) return this._make(elems);
  else if (typeof selector === 'number') return this._make(elems[selector]);

  return filter.call(elems, selector, this);
};

var contents = exports.contents = function() {
  return this._make(_.reduce(this, function(all, elem) {
    all.push.apply(all, elem.children);
    return all;
  }, []));
};

var each = exports.each = function(fn) {
  var i = 0, len = this.length;
  while (i < len && fn.call(this[i], i, this[i]) !== false) ++i;
  return this;
};

var map = exports.map = function(fn) {
  return this._make(_.reduce(this, function(memo, el, i) {
    var val = fn.call(el, i, el);
    return val == null ? memo : memo.concat(val);
  }, []));
};

var filter = exports.filter = function(match, container) {
  container = container || this;

  var make = _.bind(container._make, container);
  var filterFn;

  if (typeof match === 'string') {
    filterFn = select.compile(match, container.options);
  } else if (typeof match === 'function') {
    filterFn = function(el, i) {
      return match.call(el, i, el);
    };
  } else if (match.cheerio) {
    filterFn = match.is.bind(match);
  } else {
    filterFn = function(el) {
      return match === el;
    };
  }

  return make(_.filter(this, filterFn));
};

var first = exports.first = function() {
  return this.length > 1 ? this._make(this[0]) : this;
};

var last = exports.last = function() {
  return this.length > 1 ? this._make(this[this.length - 1]) : this;
};

// Reduce the set of matched elements to the one at the specified index.
var eq = exports.eq = function(i) {
  i = +i;

  // Use the first identity optimization if possible
  if (i === 0 && this.length <= 1) return this;

  if (i < 0) i = this.length + i;
  return this[i] ? this._make(this[i]) : this._make([]);
};

// Retrieve the DOM elements matched by the jQuery object.
var get = exports.get = function(i) {
  if (i == null) {
    return Array.prototype.slice.call(this);
  } else {
    return this[i < 0 ? (this.length + i) : i];
  }
};

var slice = exports.slice = function() {
  return this._make([].slice.apply(this, arguments));
};

function traverseParents(self, elem, selector, limit) {
  var elems = [];
  while (elem && elems.length < limit) {
    if (!selector || filter.call([elem], selector, self).length) {
      elems.push(elem);
    }
    elem = elem.parent;
  }
  return elems;
}

// End the most recent filtering operation in the current chain and return the
// set of matched elements to its previous state.
var end = exports.end = function() {
  return this.prevObject || this._make([]);
};

var add = exports.add = function(other, context) {
  var selection = this._make(other, context);
  var contents = uniqueSort(selection.get().concat(this.get()));

  for (var i = 0; i < contents.length; ++i) {
    selection[i] = contents[i];
  }
  selection.length = contents.length;

  return selection;
};

},{"../utils":19,"CSSselect":2,"htmlparser2":51,"lodash":66}],16:[function(require,module,exports){
/*
  Module dependencies
*/

var path = require('path'),
    parse = require('./parse'),
    _ = require('lodash');

/*
 * The API
 */

var api = [
  require('./api/attributes'),
  require('./api/traversing'),
  require('./api/manipulation'),
  require('./api/css')
];

/*
 * A simple way to check for HTML strings or ID strings
 */

var quickExpr = /^(?:[^#<]*(<[\w\W]+>)[^>]*$|#([\w\-]*)$)/;

/*
 * Instance of cheerio
 */

var Cheerio = module.exports = function(selector, context, root, options) {
  if (!(this instanceof Cheerio)) return new Cheerio(selector, context, root, options);

  this.options = _.defaults(options || {}, this.options);

  // $(), $(null), $(undefined), $(false)
  if (!selector) return this;

  if (root) {
    if (typeof root === 'string') root = parse(root, this.options);
    this._root = Cheerio.call(this, root);
  }

  // $($)
  if (selector.cheerio) return selector;

  // $(dom)
  if (isNode(selector))
    selector = [selector];

  // $([dom])
  if (Array.isArray(selector)) {
    _.forEach(selector, function(elem, idx) {
      this[idx] = elem;
    }, this);
    this.length = selector.length;
    return this;
  }

  // $(<html>)
  if (typeof selector === 'string' && isHtml(selector)) {
    return Cheerio.call(this, parse(selector, this.options).children);
  }

  // If we don't have a context, maybe we have a root, from loading
  if (!context) {
    context = this._root;
  } else if (typeof context === 'string') {
    if (isHtml(context)) {
      // $('li', '<ul>...</ul>')
      context = parse(context, this.options);
      context = Cheerio.call(this, context);
    } else {
      // $('li', 'ul')
      selector = [context, selector].join(' ');
      context = this._root;
    }
  // $('li', node), $('li', [nodes])
  } else if (!context.cheerio) {
    context = Cheerio.call(this, context);
  }

  // If we still don't have a context, return
  if (!context) return this;

  // #id, .class, tag
  return context.find(selector);
};

/**
 * Mix in `static`
 */

_.extend(Cheerio, require('./static'));

/*
 * Set a signature of the object
 */

Cheerio.prototype.cheerio = '[cheerio object]';

/*
 * Cheerio default options
 */

Cheerio.prototype.options = {
  normalizeWhitespace: false,
  xmlMode: false,
  decodeEntities: true
};

/*
 * Make cheerio an array-like object
 */

Cheerio.prototype.length = 0;
Cheerio.prototype.splice = Array.prototype.splice;

/*
 * Check if string is HTML
 */
var isHtml = function(str) {
  // Faster than running regex, if str starts with `<` and ends with `>`, assume it's HTML
  if (str.charAt(0) === '<' && str.charAt(str.length - 1) === '>' && str.length >= 3) return true;

  // Run the regex
  var match = quickExpr.exec(str);
  return !!(match && match[1]);
};

/*
 * Make a cheerio object
 *
 * @api private
 */

Cheerio.prototype._make = function(dom, context) {
  var cheerio = new Cheerio(dom, context, this._root, this.options);
  cheerio.prevObject = this;
  return cheerio;
};

/**
 * Turn a cheerio object into an array
 *
 * @deprecated
 */

Cheerio.prototype.toArray = function() {
  return this.get();
};

/**
 * Plug in the API
 */
api.forEach(function(mod) {
  _.extend(Cheerio.prototype, mod);
});

var isNode = function(obj) {
  return obj.name || obj.type === 'text' || obj.type === 'comment';
};

},{"./api/attributes":12,"./api/css":13,"./api/manipulation":14,"./api/traversing":15,"./parse":17,"./static":18,"lodash":66,"path":115}],17:[function(require,module,exports){
(function (Buffer){
/*
  Module Dependencies
*/
var htmlparser = require('htmlparser2'),
    utils = require('./utils');

/*
  Parser
*/
exports = module.exports = function(content, options) {
  var dom = evaluate(content, options);

  // Generic root element
  var root = {
    type: 'root',
    name: 'root',
    parent: null,
    prev: null,
    next: null,
    children: []
  };

  // Update the dom using the root
  update(dom, root);

  return root;
};

var evaluate = exports.evaluate = function(content, options) {
  // options = options || $.fn.options;

  var dom;

  if (typeof content === 'string' || Buffer.isBuffer(content)) {
    dom = htmlparser.parseDOM(content, options);
  } else {
    dom = content;
  }

  return dom;
};

/*
  Update the dom structure, for one changed layer
*/
var update = exports.update = function(arr, parent) {
  // normalize
  if (!Array.isArray(arr)) arr = [arr];

  // Update parent
  if (parent) {
    parent.children = arr;
  } else {
    parent = null;
  }

  // Update neighbors
  for (var i = 0; i < arr.length; i++) {
    var node = arr[i];

    // Cleanly remove existing nodes from their previous structures.
    var oldParent = node.parent || node.root,
        oldSiblings = oldParent && oldParent.children;
    if (oldSiblings && oldSiblings !== arr) {
      oldSiblings.splice(oldSiblings.indexOf(node), 1);
      if (node.prev) {
        node.prev.next = node.next;
      }
      if (node.next) {
        node.next.prev = node.prev;
      }
    }

    if (parent) {
      node.prev = arr[i - 1] || null;
      node.next = arr[i + 1] || null;
    } else {
      node.prev = node.next = null;
    }

    if (parent && parent.type === 'root') {
      node.root = parent;
      node.parent = null;
    } else {
      node.root = null;
      node.parent = parent;
    }
  }

  return parent;
};

// module.exports = $.extend(exports);

}).call(this,{"isBuffer":require("../../../../../../../usr/local/lib/node_modules/browserify/node_modules/is-buffer/index.js")})
},{"../../../../../../../usr/local/lib/node_modules/browserify/node_modules/is-buffer/index.js":113,"./utils":19,"htmlparser2":51}],18:[function(require,module,exports){
/**
 * Module dependencies
 */

var select = require('CSSselect'),
    parse = require('./parse'),
    render = require('dom-serializer'),
    _ = require('lodash');

/**
 * $.load(str)
 */

var load = exports.load = function(content, options) {
  var Cheerio = require('./cheerio');

  options = _.defaults(options || {}, Cheerio.prototype.options);

  var root = parse(content, options);

  var initialize = function(selector, context, r, opts) {
    opts = _.defaults(opts || {}, options);
    return new Cheerio(selector, context, r || root, opts);
  };

  // Add in the static methods
  initialize.__proto__ = exports;

  // Add in the root
  initialize._root = root;
  // store options
  initialize._options = options;

  return initialize;
};

/**
 * $.html([selector | dom])
 */

var html = exports.html = function(dom, options) {
  var Cheerio = require('./cheerio');

  // be flexible about parameters, sometimes we call html(),
  // with options as only parameter
  // check dom argument for dom element specific properties
  // assume there is no 'length' or 'type' properties in the options object
  if (Object.prototype.toString.call(dom) === '[object Object]' && !options && !('length' in dom) && !('type' in dom))
  {
    options = dom;
    dom = undefined;
  }

  // sometimes $.html() used without preloading html
  // so fallback non existing options to the default ones
  options = _.defaults(options || {}, this._options, Cheerio.prototype.options);

  if (dom) {
    dom = (typeof dom === 'string') ? select(dom, this._root, options) : dom;
    return render(dom, options);
  } else if (this._root && this._root.children) {
    return render(this._root.children, options);
  } else {
    return '';
  }
};

/**
 * $.xml([selector | dom])
 */

var xml = exports.xml = function(dom) {
  if (dom) {
    dom = (typeof dom === 'string') ? select(dom, this._root, this.options) : dom;
    return render(dom, { xmlMode: true });
  } else if (this._root && this._root.children) {
    return render(this._root.children, { xmlMode: true });
  } else {
    return '';
  }
};

/**
 * $.text(dom)
 */

var text = exports.text = function(elems) {
  if (!elems) return '';

  var ret = '',
      len = elems.length,
      elem;

  for (var i = 0; i < len; i ++) {
    elem = elems[i];
    if (elem.type === 'text') ret += elem.data;
    else if (elem.children && elem.type !== 'comment') {
      ret += text(elem.children);
    }
  }

  return ret;
};

/**
 * $.parseHTML(data [, context ] [, keepScripts ])
 * Parses a string into an array of DOM nodes. The `context` argument has no
 * meaning for Cheerio, but it is maintained for API compatibility with jQuery.
 */
var parseHTML = exports.parseHTML = function(data, context, keepScripts) {
  var parsed;

  if (!data || typeof data !== 'string') {
    return null;
  }

  if (typeof context === 'boolean') {
    keepScripts = context;
  }

  parsed = this.load(data);
  if (!keepScripts) {
    parsed('script').remove();
  }

  return parsed.root()[0].children;
};

/**
 * $.root()
 */
var root = exports.root = function() {
  return this(this._root);
};

/**
 * $.contains()
 */
var contains = exports.contains = function(container, contained) {

  // According to the jQuery API, an element does not "contain" itself
  if (contained === container) {
    return false;
  }

  // Step up the descendants, stopping when the root element is reached
  // (signaled by `.parent` returning a reference to the same object)
  while (contained && contained !== contained.parent) {
    contained = contained.parent;
    if (contained === container) {
      return true;
    }
  }

  return false;
};

},{"./cheerio":16,"./parse":17,"CSSselect":2,"dom-serializer":22,"lodash":66}],19:[function(require,module,exports){
/**
 * HTML Tags
 */

var tags = { tag: true, script: true, style: true };

/**
 * Check if the DOM element is a tag
 *
 * isTag(type) includes <script> and <style> tags
 */

exports.isTag = function(type) {
  if (type.type) type = type.type;
  return tags[type] || false;
};

/**
 * Convert a string to camel case notation.
 * @param  {String} str String to be converted.
 * @return {String}     String in camel case notation.
 */

exports.camelCase = function(str) {
  return str.replace(/[_.-](\w|$)/g, function(_, x) {
    return x.toUpperCase();
  });
};

/**
 * Convert a string from camel case to "CSS case", where word boundaries are
 * described by hyphens ("-") and all characters are lower-case.
 * @param  {String} str String to be converted.
 * @return {string}     String in "CSS case".
 */
exports.cssCase = function(str) {
  return str.replace(/[A-Z]/g, '-$&').toLowerCase();
};

/**
 * Iterate over each DOM element without creating intermediary Cheerio instances.
 *
 * This is indented for use internally to avoid otherwise unnecessary memory pressure introduced
 * by _make.
 */

exports.domEach = function(cheerio, fn) {
  var i = 0, len = cheerio.length;
  while (i < len && fn(i, cheerio[i]) !== false) ++i;
  return cheerio;
};

},{}],20:[function(require,module,exports){
module.exports={
  "_args": [
    [
      {
        "raw": "cheerio@~0.17.0",
        "scope": null,
        "escapedName": "cheerio",
        "name": "cheerio",
        "rawSpec": "~0.17.0",
        "spec": ">=0.17.0 <0.18.0",
        "type": "range"
      },
      "/Users/johannes/Developer/node-unfluff"
    ]
  ],
  "_from": "cheerio@>=0.17.0 <0.18.0",
  "_id": "cheerio@0.17.0",
  "_inCache": true,
  "_location": "/cheerio",
  "_npmUser": {
    "name": "davidchambers",
    "email": "dc@davidchambers.me"
  },
  "_npmVersion": "1.4.14",
  "_phantomChildren": {},
  "_requested": {
    "raw": "cheerio@~0.17.0",
    "scope": null,
    "escapedName": "cheerio",
    "name": "cheerio",
    "rawSpec": "~0.17.0",
    "spec": ">=0.17.0 <0.18.0",
    "type": "range"
  },
  "_requiredBy": [
    "/unfluff"
  ],
  "_resolved": "https://registry.npmjs.org/cheerio/-/cheerio-0.17.0.tgz",
  "_shasum": "fa5ae42cc60121133d296d0b46d983215f7268ea",
  "_shrinkwrap": null,
  "_spec": "cheerio@~0.17.0",
  "_where": "/Users/johannes/Developer/node-unfluff",
  "author": {
    "name": "Matt Mueller",
    "email": "mattmuelle@gmail.com",
    "url": "mat.io"
  },
  "bugs": {
    "url": "https://github.com/MatthewMueller/cheerio/issues"
  },
  "dependencies": {
    "CSSselect": "~0.4.0",
    "dom-serializer": "~0.0.0",
    "entities": "~1.1.1",
    "htmlparser2": "~3.7.2",
    "lodash": "~2.4.1"
  },
  "description": "Tiny, fast, and elegant implementation of core jQuery designed specifically for the server",
  "devDependencies": {
    "benchmark": "~1.0.0",
    "expect.js": "~0.3.1",
    "jsdom": "~0.8.9",
    "jshint": "~2.3.0",
    "mocha": "*",
    "xyz": "~0.3.0"
  },
  "directories": {},
  "dist": {
    "shasum": "fa5ae42cc60121133d296d0b46d983215f7268ea",
    "tarball": "https://registry.npmjs.org/cheerio/-/cheerio-0.17.0.tgz"
  },
  "engines": {
    "node": ">= 0.6"
  },
  "gitHead": "3210b2287a9fd3b1ec0bcc656092b12c08c2916c",
  "homepage": "https://github.com/MatthewMueller/cheerio",
  "keywords": [
    "htmlparser",
    "jquery",
    "selector",
    "scraper",
    "parser",
    "html"
  ],
  "main": "./index.js",
  "maintainers": [
    {
      "name": "mattmueller",
      "email": "mattmuelle@gmail.com"
    },
    {
      "name": "davidchambers",
      "email": "dc@davidchambers.me"
    }
  ],
  "name": "cheerio",
  "optionalDependencies": {},
  "readme": "ERROR: No README data found!",
  "repository": {
    "type": "git",
    "url": "git://github.com/MatthewMueller/cheerio.git"
  },
  "scripts": {
    "test": "make test"
  },
  "version": "0.17.0"
}

},{}],21:[function(require,module,exports){
(function (Buffer){
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

// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.

function isArray(arg) {
  if (Array.isArray) {
    return Array.isArray(arg);
  }
  return objectToString(arg) === '[object Array]';
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
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = Buffer.isBuffer;

function objectToString(o) {
  return Object.prototype.toString.call(o);
}

}).call(this,{"isBuffer":require("../../../../../../../usr/local/lib/node_modules/browserify/node_modules/is-buffer/index.js")})
},{"../../../../../../../usr/local/lib/node_modules/browserify/node_modules/is-buffer/index.js":113}],22:[function(require,module,exports){
/*
  Module dependencies
*/
var ElementType = require('domelementtype');
var entities = require('entities');

/*
  Boolean Attributes
*/
var booleanAttributes = {
  __proto__: null,
  allowfullscreen: true,
  async: true,
  autofocus: true,
  autoplay: true,
  checked: true,
  controls: true,
  default: true,
  defer: true,
  disabled: true,
  hidden: true,
  ismap: true,
  loop: true,
  multiple: true,
  muted: true,
  open: true,
  readonly: true,
  required: true,
  reversed: true,
  scoped: true,
  seamless: true,
  selected: true,
  typemustmatch: true
};

var unencodedElements = {
  __proto__: null,
  style: true,
  script: true,
  xmp: true,
  iframe: true,
  noembed: true,
  noframes: true,
  plaintext: true,
  noscript: true
};

/*
  Format attributes
*/
function formatAttrs(attributes, opts) {
  if (!attributes) return;

  var output = '',
      value;

  // Loop through the attributes
  for (var key in attributes) {
    value = attributes[key];
    if (output) {
      output += ' ';
    }

    if (!value && booleanAttributes[key]) {
      output += key;
    } else {
      output += key + '="' + (opts.decodeEntities ? entities.encodeXML(value) : value) + '"';
    }
  }

  return output;
}

/*
  Self-enclosing tags (stolen from node-htmlparser)
*/
var singleTag = {
  __proto__: null,
  area: true,
  base: true,
  basefont: true,
  br: true,
  col: true,
  command: true,
  embed: true,
  frame: true,
  hr: true,
  img: true,
  input: true,
  isindex: true,
  keygen: true,
  link: true,
  meta: true,
  param: true,
  source: true,
  track: true,
  wbr: true,

  //common self closing svg elements
  path: true,
  circle: true,
  ellipse: true,
  line: true,
  rect: true,
  use: true
};

var render = module.exports = function(dom, opts) {
  if (!Array.isArray(dom) && !dom.cheerio) dom = [dom];
  opts = opts || {};

  var output = '';

  for(var i = 0; i < dom.length; i++){
    var elem = dom[i];

    if (elem.type === 'root')
      output += render(elem.children, opts);
    else if (ElementType.isTag(elem))
      output += renderTag(elem, opts);
    else if (elem.type === ElementType.Directive)
      output += renderDirective(elem);
    else if (elem.type === ElementType.Comment)
      output += renderComment(elem);
    else if (elem.type === ElementType.CDATA)
      output += renderCdata(elem);
    else
      output += renderText(elem, opts);
  }

  return output;
};

function renderTag(elem, opts) {
  var tag = '<' + elem.name,
      attribs = formatAttrs(elem.attribs, opts);

  if (attribs) {
    tag += ' ' + attribs;
  }

  if (
    opts.xmlMode &&
    (!elem.children || elem.children.length === 0)
  ) {
    tag += '/>';
  } else {
    tag += '>';
    tag += render(elem.children, opts);

    if (!singleTag[elem.name] || opts.xmlMode) {
      tag += '</' + elem.name + '>';
    }
  }



  return tag;
}

function renderDirective(elem) {
  return '<' + elem.data + '>';
}

function renderText(elem, opts) {
  var data = elem.data || '';

  // if entities weren't decoded, no need to encode them back
  if (opts.decodeEntities && !(elem.parent && elem.parent.name in unencodedElements)) {
    data = entities.encodeXML(data);
  }

  return data;
}

function renderCdata(elem) {
  return '<![CDATA[' + elem.children[0].data + ']]>';
}

function renderComment(elem) {
  return '<!--' + elem.data + '-->';
}

},{"domelementtype":23,"entities":35}],23:[function(require,module,exports){
//Types of elements found in the DOM
module.exports = {
	Text: "text", //Text
	Directive: "directive", //<? ... ?>
	Comment: "comment", //<!-- ... -->
	Script: "script", //<script> tags
	Style: "style", //<style> tags
	Tag: "tag", //Any tag
	CDATA: "cdata", //<![CDATA[ ... ]]>

	isTag: function(elem){
		return elem.type === "tag" || elem.type === "script" || elem.type === "style";
	}
};
},{}],24:[function(require,module,exports){
//Types of elements found in the DOM
module.exports = {
	Text: "text", //Text
	Directive: "directive", //<? ... ?>
	Comment: "comment", //<!-- ... -->
	Script: "script", //<script> tags
	Style: "style", //<style> tags
	Tag: "tag", //Any tag
	CDATA: "cdata", //<![CDATA[ ... ]]>
	Doctype: "doctype",

	isTag: function(elem){
		return elem.type === "tag" || elem.type === "script" || elem.type === "style";
	}
};

},{}],25:[function(require,module,exports){
var ElementType = require("domelementtype");

var re_whitespace = /\s+/g;
var NodePrototype = require("./lib/node");
var ElementPrototype = require("./lib/element");

function DomHandler(callback, options, elementCB){
	if(typeof callback === "object"){
		elementCB = options;
		options = callback;
		callback = null;
	} else if(typeof options === "function"){
		elementCB = options;
		options = defaultOpts;
	}
	this._callback = callback;
	this._options = options || defaultOpts;
	this._elementCB = elementCB;
	this.dom = [];
	this._done = false;
	this._tagStack = [];
}

//default options
var defaultOpts = {
	normalizeWhitespace: false //Replace all whitespace with single spaces
};

//Resets the handler back to starting state
DomHandler.prototype.onreset = function(){
	DomHandler.call(this, this._callback, this._options, this._elementCB);
};

//Signals the handler that parsing is done
DomHandler.prototype.onend = function(){
	if(this._done) return;
	this._done = true;
	this._handleCallback(null);
};

DomHandler.prototype._handleCallback =
DomHandler.prototype.onerror = function(error){
	if(typeof this._callback === "function"){
		this._callback(error, this.dom);
	} else {
		if(error) throw error;
	}
};

DomHandler.prototype.onclosetag = function(){
	//if(this._tagStack.pop().name !== name) this._handleCallback(Error("Tagname didn't match!"));
	var elem = this._tagStack.pop();
	if(this._elementCB) this._elementCB(elem);
};

DomHandler.prototype._addDomElement = function(element){
	var parent = this._tagStack[this._tagStack.length - 1];
	var siblings = parent ? parent.children : this.dom;
	var previousSibling = siblings[siblings.length - 1];

	element.next = null;

	if (this._options.withDomLvl1) {
		element.__proto__ = element.type === "tag" ? ElementPrototype : NodePrototype;
	}

	if(previousSibling){
		element.prev = previousSibling;
		previousSibling.next = element;
	} else {
		element.prev = null;
	}

	siblings.push(element);
	element.parent = parent || null;
};

DomHandler.prototype.onopentag = function(name, attribs){
	var element = {
		type: name === "script" ? ElementType.Script : name === "style" ? ElementType.Style : ElementType.Tag,
		name: name,
		attribs: attribs,
		children: []
	};

	this._addDomElement(element);

	this._tagStack.push(element);
};

DomHandler.prototype.ontext = function(data){
	//the ignoreWhitespace is officially dropped, but for now,
	//it's an alias for normalizeWhitespace
	var normalize = this._options.normalizeWhitespace || this._options.ignoreWhitespace;

	var lastTag;

	if(!this._tagStack.length && this.dom.length && (lastTag = this.dom[this.dom.length-1]).type === ElementType.Text){
		if(normalize){
			lastTag.data = (lastTag.data + data).replace(re_whitespace, " ");
		} else {
			lastTag.data += data;
		}
	} else {
		if(
			this._tagStack.length &&
			(lastTag = this._tagStack[this._tagStack.length - 1]) &&
			(lastTag = lastTag.children[lastTag.children.length - 1]) &&
			lastTag.type === ElementType.Text
		){
			if(normalize){
				lastTag.data = (lastTag.data + data).replace(re_whitespace, " ");
			} else {
				lastTag.data += data;
			}
		} else {
			if(normalize){
				data = data.replace(re_whitespace, " ");
			}

			this._addDomElement({
				data: data,
				type: ElementType.Text
			});
		}
	}
};

DomHandler.prototype.oncomment = function(data){
	var lastTag = this._tagStack[this._tagStack.length - 1];

	if(lastTag && lastTag.type === ElementType.Comment){
		lastTag.data += data;
		return;
	}

	var element = {
		data: data,
		type: ElementType.Comment
	};

	this._addDomElement(element);
	this._tagStack.push(element);
};

DomHandler.prototype.oncdatastart = function(){
	var element = {
		children: [{
			data: "",
			type: ElementType.Text
		}],
		type: ElementType.CDATA
	};

	this._addDomElement(element);
	this._tagStack.push(element);
};

DomHandler.prototype.oncommentend = DomHandler.prototype.oncdataend = function(){
	this._tagStack.pop();
};

DomHandler.prototype.onprocessinginstruction = function(name, data){
	this._addDomElement({
		name: name,
		data: data,
		type: ElementType.Directive
	});
};

module.exports = DomHandler;

},{"./lib/element":26,"./lib/node":27,"domelementtype":24}],26:[function(require,module,exports){
// DOM-Level-1-compliant structure
var NodePrototype = require('./node');
var ElementPrototype = module.exports = Object.create(NodePrototype);

var domLvl1 = {
	tagName: "name"
};

Object.keys(domLvl1).forEach(function(key) {
	var shorthand = domLvl1[key];
	Object.defineProperty(ElementPrototype, key, {
		get: function() {
			return this[shorthand] || null;
		},
		set: function(val) {
			this[shorthand] = val;
			return val;
		}
	});
});

},{"./node":27}],27:[function(require,module,exports){
// This object will be used as the prototype for Nodes when creating a
// DOM-Level-1-compliant structure.
var NodePrototype = module.exports = {
	get firstChild() {
		var children = this.children;
		return children && children[0] || null;
	},
	get lastChild() {
		var children = this.children;
		return children && children[children.length - 1] || null;
	},
	get nodeType() {
		return nodeTypes[this.type] || nodeTypes.element;
	}
};

var domLvl1 = {
	tagName: "name",
	childNodes: "children",
	parentNode: "parent",
	previousSibling: "prev",
	nextSibling: "next",
	nodeValue: "data"
};

var nodeTypes = {
	element: 1,
	text: 3,
	cdata: 4,
	comment: 8
};

Object.keys(domLvl1).forEach(function(key) {
	var shorthand = domLvl1[key];
	Object.defineProperty(NodePrototype, key, {
		get: function() {
			return this[shorthand] || null;
		},
		set: function(val) {
			this[shorthand] = val;
			return val;
		}
	});
});

},{}],28:[function(require,module,exports){
var DomUtils = module.exports;

[
	require("./lib/stringify"),
	require("./lib/traversal"),
	require("./lib/manipulation"),
	require("./lib/querying"),
	require("./lib/legacy"),
	require("./lib/helpers")
].forEach(function(ext){
	Object.keys(ext).forEach(function(key){
		DomUtils[key] = ext[key].bind(DomUtils);
	});
});

},{"./lib/helpers":29,"./lib/legacy":30,"./lib/manipulation":31,"./lib/querying":32,"./lib/stringify":33,"./lib/traversal":34}],29:[function(require,module,exports){
// removeSubsets
// Given an array of nodes, remove any member that is contained by another.
exports.removeSubsets = function(nodes) {
	var idx = nodes.length, node, ancestor, replace;

	// Check if each node (or one of its ancestors) is already contained in the
	// array.
	while (--idx > -1) {
		node = ancestor = nodes[idx];

		// Temporarily remove the node under consideration
		nodes[idx] = null;
		replace = true;

		while (ancestor) {
			if (nodes.indexOf(ancestor) > -1) {
				replace = false;
				nodes.splice(idx, 1);
				break;
			}
			ancestor = ancestor.parent;
		}

		// If the node has been found to be unique, re-insert it.
		if (replace) {
			nodes[idx] = node;
		}
	}

	return nodes;
};

},{}],30:[function(require,module,exports){
var ElementType = require("domelementtype");
var isTag = exports.isTag = ElementType.isTag;

exports.testElement = function(options, element){
	for(var key in options){
		if(!options.hasOwnProperty(key));
		else if(key === "tag_name"){
			if(!isTag(element) || !options.tag_name(element.name)){
				return false;
			}
		} else if(key === "tag_type"){
			if(!options.tag_type(element.type)) return false;
		} else if(key === "tag_contains"){
			if(isTag(element) || !options.tag_contains(element.data)){
				return false;
			}
		} else if(!element.attribs || !options[key](element.attribs[key])){
			return false;
		}
	}
	return true;
};

var Checks = {
	tag_name: function(name){
		if(typeof name === "function"){
			return function(elem){ return isTag(elem) && name(elem.name); };
		} else if(name === "*"){
			return isTag;
		} else {
			return function(elem){ return isTag(elem) && elem.name === name; };
		}
	},
	tag_type: function(type){
		if(typeof type === "function"){
			return function(elem){ return type(elem.type); };
		} else {
			return function(elem){ return elem.type === type; };
		}
	},
	tag_contains: function(data){
		if(typeof data === "function"){
			return function(elem){ return !isTag(elem) && data(elem.data); };
		} else {
			return function(elem){ return !isTag(elem) && elem.data === data; };
		}
	}
};

function getAttribCheck(attrib, value){
	if(typeof value === "function"){
		return function(elem){ return elem.attribs && value(elem.attribs[attrib]); };
	} else {
		return function(elem){ return elem.attribs && elem.attribs[attrib] === value; };
	}
}

function combineFuncs(a, b){
	return function(elem){
		return a(elem) || b(elem);
	};
}

exports.getElements = function(options, element, recurse, limit){
	var funcs = Object.keys(options).map(function(key){
		var value = options[key];
		return key in Checks ? Checks[key](value) : getAttribCheck(key, value);
	});

	return funcs.length === 0 ? [] : this.filter(
		funcs.reduce(combineFuncs),
		element, recurse, limit
	);
};

exports.getElementById = function(id, element, recurse){
	if(!Array.isArray(element)) element = [element];
	return this.findOne(getAttribCheck("id", id), element, recurse !== false);
};

exports.getElementsByTagName = function(name, element, recurse, limit){
	return this.filter(Checks.tag_name(name), element, recurse, limit);
};

exports.getElementsByTagType = function(type, element, recurse, limit){
	return this.filter(Checks.tag_type(type), element, recurse, limit);
};

},{"domelementtype":24}],31:[function(require,module,exports){
exports.removeElement = function(elem){
	if(elem.prev) elem.prev.next = elem.next;
	if(elem.next) elem.next.prev = elem.prev;

	if(elem.parent){
		var childs = elem.parent.children;
		childs.splice(childs.lastIndexOf(elem), 1);
	}
};

exports.replaceElement = function(elem, replacement){
	var prev = replacement.prev = elem.prev;
	if(prev){
		prev.next = replacement;
	}

	var next = replacement.next = elem.next;
	if(next){
		next.prev = replacement;
	}

	var parent = replacement.parent = elem.parent;
	if(parent){
		var childs = parent.children;
		childs[childs.lastIndexOf(elem)] = replacement;
	}
};

exports.appendChild = function(elem, child){
	child.parent = elem;

	if(elem.children.push(child) !== 1){
		var sibling = elem.children[elem.children.length - 2];
		sibling.next = child;
		child.prev = sibling;
		child.next = null;
	}
};

exports.append = function(elem, next){
	var parent = elem.parent,
		currNext = elem.next;

	next.next = currNext;
	next.prev = elem;
	elem.next = next;
	next.parent = parent;

	if(currNext){
		currNext.prev = next;
		if(parent){
			var childs = parent.children;
			childs.splice(childs.lastIndexOf(currNext), 0, next);
		}
	} else if(parent){
		parent.children.push(next);
	}
};

exports.prepend = function(elem, prev){
	var parent = elem.parent;
	if(parent){
		var childs = parent.children;
		childs.splice(childs.lastIndexOf(elem), 0, prev);
	}

	if(elem.prev){
		elem.prev.next = prev;
	}
	
	prev.parent = parent;
	prev.prev = elem.prev;
	prev.next = elem;
	elem.prev = prev;
};



},{}],32:[function(require,module,exports){
var isTag = require("domelementtype").isTag;

module.exports = {
	filter: filter,
	find: find,
	findOneChild: findOneChild,
	findOne: findOne,
	existsOne: existsOne,
	findAll: findAll
};

function filter(test, element, recurse, limit){
	if(!Array.isArray(element)) element = [element];

	if(typeof limit !== "number" || !isFinite(limit)){
		limit = Infinity;
	}
	return find(test, element, recurse !== false, limit);
}

function find(test, elems, recurse, limit){
	var result = [], childs;

	for(var i = 0, j = elems.length; i < j; i++){
		if(test(elems[i])){
			result.push(elems[i]);
			if(--limit <= 0) break;
		}

		childs = elems[i].children;
		if(recurse && childs && childs.length > 0){
			childs = find(test, childs, recurse, limit);
			result = result.concat(childs);
			limit -= childs.length;
			if(limit <= 0) break;
		}
	}

	return result;
}

function findOneChild(test, elems){
	for(var i = 0, l = elems.length; i < l; i++){
		if(test(elems[i])) return elems[i];
	}

	return null;
}

function findOne(test, elems){
	var elem = null;

	for(var i = 0, l = elems.length; i < l && !elem; i++){
		if(!isTag(elems[i])){
			continue;
		} else if(test(elems[i])){
			elem = elems[i];
		} else if(elems[i].children.length > 0){
			elem = findOne(test, elems[i].children);
		}
	}

	return elem;
}

function existsOne(test, elems){
	for(var i = 0, l = elems.length; i < l; i++){
		if(
			isTag(elems[i]) && (
				test(elems[i]) || (
					elems[i].children.length > 0 &&
					existsOne(test, elems[i].children)
				)
			)
		){
			return true;
		}
	}

	return false;
}

function findAll(test, elems){
	var result = [];
	for(var i = 0, j = elems.length; i < j; i++){
		if(!isTag(elems[i])) continue;
		if(test(elems[i])) result.push(elems[i]);

		if(elems[i].children.length > 0){
			result = result.concat(findAll(test, elems[i].children));
		}
	}
	return result;
}

},{"domelementtype":24}],33:[function(require,module,exports){
var ElementType = require("domelementtype"),
    isTag = ElementType.isTag;

module.exports = {
	getInnerHTML: getInnerHTML,
	getOuterHTML: getOuterHTML,
	getText: getText
};

function getInnerHTML(elem){
	return elem.children ? elem.children.map(getOuterHTML).join("") : "";
}

//boolean attributes without a value (taken from MatthewMueller/cheerio)
var booleanAttribs = {
	__proto__: null,
	async: true,
	autofocus: true,
	autoplay: true,
	checked: true,
	controls: true,
	defer: true,
	disabled: true,
	hidden: true,
	loop: true,
	multiple: true,
	open: true,
	readonly: true,
	required: true,
	scoped: true,
	selected: true
};

var emptyTags = {
	__proto__: null,
	area: true,
	base: true,
	basefont: true,
	br: true,
	col: true,
	frame: true,
	hr: true,
	img: true,
	input: true,
	isindex: true,
	link: true,
	meta: true,
	param: true,
	embed: true
};

function getOuterHTML(elem){
	switch(elem.type){
	case ElementType.Text:
		return elem.data;
	case ElementType.Comment:
		return "<!--" + elem.data + "-->";
	case ElementType.Directive:
		return "<" + elem.data + ">";
	case ElementType.CDATA:
		return "<!CDATA " + getInnerHTML(elem) + "]]>";
	}

	var ret = "<" + elem.name;
	if("attribs" in elem){
		for(var attr in elem.attribs){
			if(elem.attribs.hasOwnProperty(attr)){
				ret += " " + attr;
				var value = elem.attribs[attr];
				if(value == null){
					if( !(attr in booleanAttribs) ){
						ret += "=\"\"";
					}
				} else {
					ret += "=\"" + value + "\"";
				}
			}
		}
	}

	if (elem.name in emptyTags && elem.children.length === 0) {
		return ret + " />";
	} else {
		return ret + ">" + getInnerHTML(elem) + "</" + elem.name + ">";
	}
}

function getText(elem){
	if(Array.isArray(elem)) return elem.map(getText).join("");
	if(isTag(elem) || elem.type === ElementType.CDATA) return getText(elem.children);
	if(elem.type === ElementType.Text) return elem.data;
	return "";
}
},{"domelementtype":24}],34:[function(require,module,exports){
var getChildren = exports.getChildren = function(elem){
	return elem.children;
};

var getParent = exports.getParent = function(elem){
	return elem.parent;
};

exports.getSiblings = function(elem){
	var parent = getParent(elem);
	return parent ? getChildren(parent) : [elem];
};

exports.getAttributeValue = function(elem, name){
	return elem.attribs && elem.attribs[name];
};

exports.hasAttrib = function(elem, name){
	return hasOwnProperty.call(elem.attribs, name);
};

exports.getName = function(elem){
	return elem.name;
};

},{}],35:[function(require,module,exports){
var encode = require("./lib/encode.js"),
    decode = require("./lib/decode.js");

exports.decode = function(data, level){
	return (!level || level <= 0 ? decode.XML : decode.HTML)(data);
};

exports.decodeStrict = function(data, level){
	return (!level || level <= 0 ? decode.XML : decode.HTMLStrict)(data);
};

exports.encode = function(data, level){
	return (!level || level <= 0 ? encode.XML : encode.HTML)(data);
};

exports.encodeXML = encode.XML;

exports.encodeHTML4 =
exports.encodeHTML5 =
exports.encodeHTML  = encode.HTML;

exports.decodeXML =
exports.decodeXMLStrict = decode.XML;

exports.decodeHTML4 =
exports.decodeHTML5 =
exports.decodeHTML = decode.HTML;

exports.decodeHTML4Strict =
exports.decodeHTML5Strict =
exports.decodeHTMLStrict = decode.HTMLStrict;

exports.escape = encode.escape;

},{"./lib/decode.js":36,"./lib/encode.js":38}],36:[function(require,module,exports){
var entityMap = require("../maps/entities.json"),
    legacyMap = require("../maps/legacy.json"),
    xmlMap    = require("../maps/xml.json"),
    decodeCodePoint = require("./decode_codepoint.js");

var decodeXMLStrict  = getStrictDecoder(xmlMap),
    decodeHTMLStrict = getStrictDecoder(entityMap);

function getStrictDecoder(map){
	var keys = Object.keys(map).join("|"),
	    replace = getReplacer(map);

	keys += "|#[xX][\\da-fA-F]+|#\\d+";

	var re = new RegExp("&(?:" + keys + ");", "g");

	return function(str){
		return String(str).replace(re, replace);
	};
}

var decodeHTML = (function(){
	var legacy = Object.keys(legacyMap)
		.sort(sorter);

	var keys = Object.keys(entityMap)
		.sort(sorter);

	for(var i = 0, j = 0; i < keys.length; i++){
		if(legacy[j] === keys[i]){
			keys[i] += ";?";
			j++;
		} else {
			keys[i] += ";";
		}
	}

	var re = new RegExp("&(?:" + keys.join("|") + "|#[xX][\\da-fA-F]+;?|#\\d+;?)", "g"),
	    replace = getReplacer(entityMap);

	function replacer(str){
		if(str.substr(-1) !== ";") str += ";";
		return replace(str);
	}

	//TODO consider creating a merged map
	return function(str){
		return String(str).replace(re, replacer);
	};
}());

function sorter(a, b){
	return a < b ? 1 : -1;
}

function getReplacer(map){
	return function replace(str){
		if(str.charAt(1) === "#"){
			if(str.charAt(2) === "X" || str.charAt(2) === "x"){
				return decodeCodePoint(parseInt(str.substr(3), 16));
			}
			return decodeCodePoint(parseInt(str.substr(2), 10));
		}
		return map[str.slice(1, -1)];
	};
}

module.exports = {
	XML: decodeXMLStrict,
	HTML: decodeHTML,
	HTMLStrict: decodeHTMLStrict
};
},{"../maps/entities.json":40,"../maps/legacy.json":41,"../maps/xml.json":42,"./decode_codepoint.js":37}],37:[function(require,module,exports){
var decodeMap = require("../maps/decode.json");

module.exports = decodeCodePoint;

// modified version of https://github.com/mathiasbynens/he/blob/master/src/he.js#L94-L119
function decodeCodePoint(codePoint){

	if((codePoint >= 0xD800 && codePoint <= 0xDFFF) || codePoint > 0x10FFFF){
		return "\uFFFD";
	}

	if(codePoint in decodeMap){
		codePoint = decodeMap[codePoint];
	}

	var output = "";

	if(codePoint > 0xFFFF){
		codePoint -= 0x10000;
		output += String.fromCharCode(codePoint >>> 10 & 0x3FF | 0xD800);
		codePoint = 0xDC00 | codePoint & 0x3FF;
	}

	output += String.fromCharCode(codePoint);
	return output;
}

},{"../maps/decode.json":39}],38:[function(require,module,exports){
var inverseXML = getInverseObj(require("../maps/xml.json")),
    xmlReplacer = getInverseReplacer(inverseXML);

exports.XML = getInverse(inverseXML, xmlReplacer);

var inverseHTML = getInverseObj(require("../maps/entities.json")),
    htmlReplacer = getInverseReplacer(inverseHTML);

exports.HTML = getInverse(inverseHTML, htmlReplacer);

function getInverseObj(obj){
	return Object.keys(obj).sort().reduce(function(inverse, name){
		inverse[obj[name]] = "&" + name + ";";
		return inverse;
	}, {});
}

function getInverseReplacer(inverse){
	var single = [],
	    multiple = [];

	Object.keys(inverse).forEach(function(k){
		if(k.length === 1){
			single.push("\\" + k);
		} else {
			multiple.push(k);
		}
	});

	//TODO add ranges
	multiple.unshift("[" + single.join("") + "]");

	return new RegExp(multiple.join("|"), "g");
}

var re_nonASCII = /[^\0-\x7F]/g,
    re_astralSymbols = /[\uD800-\uDBFF][\uDC00-\uDFFF]/g;

function singleCharReplacer(c){
	return "&#x" + c.charCodeAt(0).toString(16).toUpperCase() + ";";
}

function astralReplacer(c){
	// http://mathiasbynens.be/notes/javascript-encoding#surrogate-formulae
	var high = c.charCodeAt(0);
	var low  = c.charCodeAt(1);
	var codePoint = (high - 0xD800) * 0x400 + low - 0xDC00 + 0x10000;
	return "&#x" + codePoint.toString(16).toUpperCase() + ";";
}

function getInverse(inverse, re){
	function func(name){
		return inverse[name];
	}

	return function(data){
		return data
				.replace(re, func)
				.replace(re_astralSymbols, astralReplacer)
				.replace(re_nonASCII, singleCharReplacer);
	};
}

var re_xmlChars = getInverseReplacer(inverseXML);

function escapeXML(data){
	return data
			.replace(re_xmlChars, singleCharReplacer)
			.replace(re_astralSymbols, astralReplacer)
			.replace(re_nonASCII, singleCharReplacer);
}

exports.escape = escapeXML;

},{"../maps/entities.json":40,"../maps/xml.json":42}],39:[function(require,module,exports){
module.exports={"0":65533,"128":8364,"130":8218,"131":402,"132":8222,"133":8230,"134":8224,"135":8225,"136":710,"137":8240,"138":352,"139":8249,"140":338,"142":381,"145":8216,"146":8217,"147":8220,"148":8221,"149":8226,"150":8211,"151":8212,"152":732,"153":8482,"154":353,"155":8250,"156":339,"158":382,"159":376}
},{}],40:[function(require,module,exports){
module.exports={"Aacute":"\u00C1","aacute":"\u00E1","Abreve":"\u0102","abreve":"\u0103","ac":"\u223E","acd":"\u223F","acE":"\u223E\u0333","Acirc":"\u00C2","acirc":"\u00E2","acute":"\u00B4","Acy":"\u0410","acy":"\u0430","AElig":"\u00C6","aelig":"\u00E6","af":"\u2061","Afr":"\uD835\uDD04","afr":"\uD835\uDD1E","Agrave":"\u00C0","agrave":"\u00E0","alefsym":"\u2135","aleph":"\u2135","Alpha":"\u0391","alpha":"\u03B1","Amacr":"\u0100","amacr":"\u0101","amalg":"\u2A3F","amp":"&","AMP":"&","andand":"\u2A55","And":"\u2A53","and":"\u2227","andd":"\u2A5C","andslope":"\u2A58","andv":"\u2A5A","ang":"\u2220","ange":"\u29A4","angle":"\u2220","angmsdaa":"\u29A8","angmsdab":"\u29A9","angmsdac":"\u29AA","angmsdad":"\u29AB","angmsdae":"\u29AC","angmsdaf":"\u29AD","angmsdag":"\u29AE","angmsdah":"\u29AF","angmsd":"\u2221","angrt":"\u221F","angrtvb":"\u22BE","angrtvbd":"\u299D","angsph":"\u2222","angst":"\u00C5","angzarr":"\u237C","Aogon":"\u0104","aogon":"\u0105","Aopf":"\uD835\uDD38","aopf":"\uD835\uDD52","apacir":"\u2A6F","ap":"\u2248","apE":"\u2A70","ape":"\u224A","apid":"\u224B","apos":"'","ApplyFunction":"\u2061","approx":"\u2248","approxeq":"\u224A","Aring":"\u00C5","aring":"\u00E5","Ascr":"\uD835\uDC9C","ascr":"\uD835\uDCB6","Assign":"\u2254","ast":"*","asymp":"\u2248","asympeq":"\u224D","Atilde":"\u00C3","atilde":"\u00E3","Auml":"\u00C4","auml":"\u00E4","awconint":"\u2233","awint":"\u2A11","backcong":"\u224C","backepsilon":"\u03F6","backprime":"\u2035","backsim":"\u223D","backsimeq":"\u22CD","Backslash":"\u2216","Barv":"\u2AE7","barvee":"\u22BD","barwed":"\u2305","Barwed":"\u2306","barwedge":"\u2305","bbrk":"\u23B5","bbrktbrk":"\u23B6","bcong":"\u224C","Bcy":"\u0411","bcy":"\u0431","bdquo":"\u201E","becaus":"\u2235","because":"\u2235","Because":"\u2235","bemptyv":"\u29B0","bepsi":"\u03F6","bernou":"\u212C","Bernoullis":"\u212C","Beta":"\u0392","beta":"\u03B2","beth":"\u2136","between":"\u226C","Bfr":"\uD835\uDD05","bfr":"\uD835\uDD1F","bigcap":"\u22C2","bigcirc":"\u25EF","bigcup":"\u22C3","bigodot":"\u2A00","bigoplus":"\u2A01","bigotimes":"\u2A02","bigsqcup":"\u2A06","bigstar":"\u2605","bigtriangledown":"\u25BD","bigtriangleup":"\u25B3","biguplus":"\u2A04","bigvee":"\u22C1","bigwedge":"\u22C0","bkarow":"\u290D","blacklozenge":"\u29EB","blacksquare":"\u25AA","blacktriangle":"\u25B4","blacktriangledown":"\u25BE","blacktriangleleft":"\u25C2","blacktriangleright":"\u25B8","blank":"\u2423","blk12":"\u2592","blk14":"\u2591","blk34":"\u2593","block":"\u2588","bne":"=\u20E5","bnequiv":"\u2261\u20E5","bNot":"\u2AED","bnot":"\u2310","Bopf":"\uD835\uDD39","bopf":"\uD835\uDD53","bot":"\u22A5","bottom":"\u22A5","bowtie":"\u22C8","boxbox":"\u29C9","boxdl":"\u2510","boxdL":"\u2555","boxDl":"\u2556","boxDL":"\u2557","boxdr":"\u250C","boxdR":"\u2552","boxDr":"\u2553","boxDR":"\u2554","boxh":"\u2500","boxH":"\u2550","boxhd":"\u252C","boxHd":"\u2564","boxhD":"\u2565","boxHD":"\u2566","boxhu":"\u2534","boxHu":"\u2567","boxhU":"\u2568","boxHU":"\u2569","boxminus":"\u229F","boxplus":"\u229E","boxtimes":"\u22A0","boxul":"\u2518","boxuL":"\u255B","boxUl":"\u255C","boxUL":"\u255D","boxur":"\u2514","boxuR":"\u2558","boxUr":"\u2559","boxUR":"\u255A","boxv":"\u2502","boxV":"\u2551","boxvh":"\u253C","boxvH":"\u256A","boxVh":"\u256B","boxVH":"\u256C","boxvl":"\u2524","boxvL":"\u2561","boxVl":"\u2562","boxVL":"\u2563","boxvr":"\u251C","boxvR":"\u255E","boxVr":"\u255F","boxVR":"\u2560","bprime":"\u2035","breve":"\u02D8","Breve":"\u02D8","brvbar":"\u00A6","bscr":"\uD835\uDCB7","Bscr":"\u212C","bsemi":"\u204F","bsim":"\u223D","bsime":"\u22CD","bsolb":"\u29C5","bsol":"\\","bsolhsub":"\u27C8","bull":"\u2022","bullet":"\u2022","bump":"\u224E","bumpE":"\u2AAE","bumpe":"\u224F","Bumpeq":"\u224E","bumpeq":"\u224F","Cacute":"\u0106","cacute":"\u0107","capand":"\u2A44","capbrcup":"\u2A49","capcap":"\u2A4B","cap":"\u2229","Cap":"\u22D2","capcup":"\u2A47","capdot":"\u2A40","CapitalDifferentialD":"\u2145","caps":"\u2229\uFE00","caret":"\u2041","caron":"\u02C7","Cayleys":"\u212D","ccaps":"\u2A4D","Ccaron":"\u010C","ccaron":"\u010D","Ccedil":"\u00C7","ccedil":"\u00E7","Ccirc":"\u0108","ccirc":"\u0109","Cconint":"\u2230","ccups":"\u2A4C","ccupssm":"\u2A50","Cdot":"\u010A","cdot":"\u010B","cedil":"\u00B8","Cedilla":"\u00B8","cemptyv":"\u29B2","cent":"\u00A2","centerdot":"\u00B7","CenterDot":"\u00B7","cfr":"\uD835\uDD20","Cfr":"\u212D","CHcy":"\u0427","chcy":"\u0447","check":"\u2713","checkmark":"\u2713","Chi":"\u03A7","chi":"\u03C7","circ":"\u02C6","circeq":"\u2257","circlearrowleft":"\u21BA","circlearrowright":"\u21BB","circledast":"\u229B","circledcirc":"\u229A","circleddash":"\u229D","CircleDot":"\u2299","circledR":"\u00AE","circledS":"\u24C8","CircleMinus":"\u2296","CirclePlus":"\u2295","CircleTimes":"\u2297","cir":"\u25CB","cirE":"\u29C3","cire":"\u2257","cirfnint":"\u2A10","cirmid":"\u2AEF","cirscir":"\u29C2","ClockwiseContourIntegral":"\u2232","CloseCurlyDoubleQuote":"\u201D","CloseCurlyQuote":"\u2019","clubs":"\u2663","clubsuit":"\u2663","colon":":","Colon":"\u2237","Colone":"\u2A74","colone":"\u2254","coloneq":"\u2254","comma":",","commat":"@","comp":"\u2201","compfn":"\u2218","complement":"\u2201","complexes":"\u2102","cong":"\u2245","congdot":"\u2A6D","Congruent":"\u2261","conint":"\u222E","Conint":"\u222F","ContourIntegral":"\u222E","copf":"\uD835\uDD54","Copf":"\u2102","coprod":"\u2210","Coproduct":"\u2210","copy":"\u00A9","COPY":"\u00A9","copysr":"\u2117","CounterClockwiseContourIntegral":"\u2233","crarr":"\u21B5","cross":"\u2717","Cross":"\u2A2F","Cscr":"\uD835\uDC9E","cscr":"\uD835\uDCB8","csub":"\u2ACF","csube":"\u2AD1","csup":"\u2AD0","csupe":"\u2AD2","ctdot":"\u22EF","cudarrl":"\u2938","cudarrr":"\u2935","cuepr":"\u22DE","cuesc":"\u22DF","cularr":"\u21B6","cularrp":"\u293D","cupbrcap":"\u2A48","cupcap":"\u2A46","CupCap":"\u224D","cup":"\u222A","Cup":"\u22D3","cupcup":"\u2A4A","cupdot":"\u228D","cupor":"\u2A45","cups":"\u222A\uFE00","curarr":"\u21B7","curarrm":"\u293C","curlyeqprec":"\u22DE","curlyeqsucc":"\u22DF","curlyvee":"\u22CE","curlywedge":"\u22CF","curren":"\u00A4","curvearrowleft":"\u21B6","curvearrowright":"\u21B7","cuvee":"\u22CE","cuwed":"\u22CF","cwconint":"\u2232","cwint":"\u2231","cylcty":"\u232D","dagger":"\u2020","Dagger":"\u2021","daleth":"\u2138","darr":"\u2193","Darr":"\u21A1","dArr":"\u21D3","dash":"\u2010","Dashv":"\u2AE4","dashv":"\u22A3","dbkarow":"\u290F","dblac":"\u02DD","Dcaron":"\u010E","dcaron":"\u010F","Dcy":"\u0414","dcy":"\u0434","ddagger":"\u2021","ddarr":"\u21CA","DD":"\u2145","dd":"\u2146","DDotrahd":"\u2911","ddotseq":"\u2A77","deg":"\u00B0","Del":"\u2207","Delta":"\u0394","delta":"\u03B4","demptyv":"\u29B1","dfisht":"\u297F","Dfr":"\uD835\uDD07","dfr":"\uD835\uDD21","dHar":"\u2965","dharl":"\u21C3","dharr":"\u21C2","DiacriticalAcute":"\u00B4","DiacriticalDot":"\u02D9","DiacriticalDoubleAcute":"\u02DD","DiacriticalGrave":"`","DiacriticalTilde":"\u02DC","diam":"\u22C4","diamond":"\u22C4","Diamond":"\u22C4","diamondsuit":"\u2666","diams":"\u2666","die":"\u00A8","DifferentialD":"\u2146","digamma":"\u03DD","disin":"\u22F2","div":"\u00F7","divide":"\u00F7","divideontimes":"\u22C7","divonx":"\u22C7","DJcy":"\u0402","djcy":"\u0452","dlcorn":"\u231E","dlcrop":"\u230D","dollar":"$","Dopf":"\uD835\uDD3B","dopf":"\uD835\uDD55","Dot":"\u00A8","dot":"\u02D9","DotDot":"\u20DC","doteq":"\u2250","doteqdot":"\u2251","DotEqual":"\u2250","dotminus":"\u2238","dotplus":"\u2214","dotsquare":"\u22A1","doublebarwedge":"\u2306","DoubleContourIntegral":"\u222F","DoubleDot":"\u00A8","DoubleDownArrow":"\u21D3","DoubleLeftArrow":"\u21D0","DoubleLeftRightArrow":"\u21D4","DoubleLeftTee":"\u2AE4","DoubleLongLeftArrow":"\u27F8","DoubleLongLeftRightArrow":"\u27FA","DoubleLongRightArrow":"\u27F9","DoubleRightArrow":"\u21D2","DoubleRightTee":"\u22A8","DoubleUpArrow":"\u21D1","DoubleUpDownArrow":"\u21D5","DoubleVerticalBar":"\u2225","DownArrowBar":"\u2913","downarrow":"\u2193","DownArrow":"\u2193","Downarrow":"\u21D3","DownArrowUpArrow":"\u21F5","DownBreve":"\u0311","downdownarrows":"\u21CA","downharpoonleft":"\u21C3","downharpoonright":"\u21C2","DownLeftRightVector":"\u2950","DownLeftTeeVector":"\u295E","DownLeftVectorBar":"\u2956","DownLeftVector":"\u21BD","DownRightTeeVector":"\u295F","DownRightVectorBar":"\u2957","DownRightVector":"\u21C1","DownTeeArrow":"\u21A7","DownTee":"\u22A4","drbkarow":"\u2910","drcorn":"\u231F","drcrop":"\u230C","Dscr":"\uD835\uDC9F","dscr":"\uD835\uDCB9","DScy":"\u0405","dscy":"\u0455","dsol":"\u29F6","Dstrok":"\u0110","dstrok":"\u0111","dtdot":"\u22F1","dtri":"\u25BF","dtrif":"\u25BE","duarr":"\u21F5","duhar":"\u296F","dwangle":"\u29A6","DZcy":"\u040F","dzcy":"\u045F","dzigrarr":"\u27FF","Eacute":"\u00C9","eacute":"\u00E9","easter":"\u2A6E","Ecaron":"\u011A","ecaron":"\u011B","Ecirc":"\u00CA","ecirc":"\u00EA","ecir":"\u2256","ecolon":"\u2255","Ecy":"\u042D","ecy":"\u044D","eDDot":"\u2A77","Edot":"\u0116","edot":"\u0117","eDot":"\u2251","ee":"\u2147","efDot":"\u2252","Efr":"\uD835\uDD08","efr":"\uD835\uDD22","eg":"\u2A9A","Egrave":"\u00C8","egrave":"\u00E8","egs":"\u2A96","egsdot":"\u2A98","el":"\u2A99","Element":"\u2208","elinters":"\u23E7","ell":"\u2113","els":"\u2A95","elsdot":"\u2A97","Emacr":"\u0112","emacr":"\u0113","empty":"\u2205","emptyset":"\u2205","EmptySmallSquare":"\u25FB","emptyv":"\u2205","EmptyVerySmallSquare":"\u25AB","emsp13":"\u2004","emsp14":"\u2005","emsp":"\u2003","ENG":"\u014A","eng":"\u014B","ensp":"\u2002","Eogon":"\u0118","eogon":"\u0119","Eopf":"\uD835\uDD3C","eopf":"\uD835\uDD56","epar":"\u22D5","eparsl":"\u29E3","eplus":"\u2A71","epsi":"\u03B5","Epsilon":"\u0395","epsilon":"\u03B5","epsiv":"\u03F5","eqcirc":"\u2256","eqcolon":"\u2255","eqsim":"\u2242","eqslantgtr":"\u2A96","eqslantless":"\u2A95","Equal":"\u2A75","equals":"=","EqualTilde":"\u2242","equest":"\u225F","Equilibrium":"\u21CC","equiv":"\u2261","equivDD":"\u2A78","eqvparsl":"\u29E5","erarr":"\u2971","erDot":"\u2253","escr":"\u212F","Escr":"\u2130","esdot":"\u2250","Esim":"\u2A73","esim":"\u2242","Eta":"\u0397","eta":"\u03B7","ETH":"\u00D0","eth":"\u00F0","Euml":"\u00CB","euml":"\u00EB","euro":"\u20AC","excl":"!","exist":"\u2203","Exists":"\u2203","expectation":"\u2130","exponentiale":"\u2147","ExponentialE":"\u2147","fallingdotseq":"\u2252","Fcy":"\u0424","fcy":"\u0444","female":"\u2640","ffilig":"\uFB03","fflig":"\uFB00","ffllig":"\uFB04","Ffr":"\uD835\uDD09","ffr":"\uD835\uDD23","filig":"\uFB01","FilledSmallSquare":"\u25FC","FilledVerySmallSquare":"\u25AA","fjlig":"fj","flat":"\u266D","fllig":"\uFB02","fltns":"\u25B1","fnof":"\u0192","Fopf":"\uD835\uDD3D","fopf":"\uD835\uDD57","forall":"\u2200","ForAll":"\u2200","fork":"\u22D4","forkv":"\u2AD9","Fouriertrf":"\u2131","fpartint":"\u2A0D","frac12":"\u00BD","frac13":"\u2153","frac14":"\u00BC","frac15":"\u2155","frac16":"\u2159","frac18":"\u215B","frac23":"\u2154","frac25":"\u2156","frac34":"\u00BE","frac35":"\u2157","frac38":"\u215C","frac45":"\u2158","frac56":"\u215A","frac58":"\u215D","frac78":"\u215E","frasl":"\u2044","frown":"\u2322","fscr":"\uD835\uDCBB","Fscr":"\u2131","gacute":"\u01F5","Gamma":"\u0393","gamma":"\u03B3","Gammad":"\u03DC","gammad":"\u03DD","gap":"\u2A86","Gbreve":"\u011E","gbreve":"\u011F","Gcedil":"\u0122","Gcirc":"\u011C","gcirc":"\u011D","Gcy":"\u0413","gcy":"\u0433","Gdot":"\u0120","gdot":"\u0121","ge":"\u2265","gE":"\u2267","gEl":"\u2A8C","gel":"\u22DB","geq":"\u2265","geqq":"\u2267","geqslant":"\u2A7E","gescc":"\u2AA9","ges":"\u2A7E","gesdot":"\u2A80","gesdoto":"\u2A82","gesdotol":"\u2A84","gesl":"\u22DB\uFE00","gesles":"\u2A94","Gfr":"\uD835\uDD0A","gfr":"\uD835\uDD24","gg":"\u226B","Gg":"\u22D9","ggg":"\u22D9","gimel":"\u2137","GJcy":"\u0403","gjcy":"\u0453","gla":"\u2AA5","gl":"\u2277","glE":"\u2A92","glj":"\u2AA4","gnap":"\u2A8A","gnapprox":"\u2A8A","gne":"\u2A88","gnE":"\u2269","gneq":"\u2A88","gneqq":"\u2269","gnsim":"\u22E7","Gopf":"\uD835\uDD3E","gopf":"\uD835\uDD58","grave":"`","GreaterEqual":"\u2265","GreaterEqualLess":"\u22DB","GreaterFullEqual":"\u2267","GreaterGreater":"\u2AA2","GreaterLess":"\u2277","GreaterSlantEqual":"\u2A7E","GreaterTilde":"\u2273","Gscr":"\uD835\uDCA2","gscr":"\u210A","gsim":"\u2273","gsime":"\u2A8E","gsiml":"\u2A90","gtcc":"\u2AA7","gtcir":"\u2A7A","gt":">","GT":">","Gt":"\u226B","gtdot":"\u22D7","gtlPar":"\u2995","gtquest":"\u2A7C","gtrapprox":"\u2A86","gtrarr":"\u2978","gtrdot":"\u22D7","gtreqless":"\u22DB","gtreqqless":"\u2A8C","gtrless":"\u2277","gtrsim":"\u2273","gvertneqq":"\u2269\uFE00","gvnE":"\u2269\uFE00","Hacek":"\u02C7","hairsp":"\u200A","half":"\u00BD","hamilt":"\u210B","HARDcy":"\u042A","hardcy":"\u044A","harrcir":"\u2948","harr":"\u2194","hArr":"\u21D4","harrw":"\u21AD","Hat":"^","hbar":"\u210F","Hcirc":"\u0124","hcirc":"\u0125","hearts":"\u2665","heartsuit":"\u2665","hellip":"\u2026","hercon":"\u22B9","hfr":"\uD835\uDD25","Hfr":"\u210C","HilbertSpace":"\u210B","hksearow":"\u2925","hkswarow":"\u2926","hoarr":"\u21FF","homtht":"\u223B","hookleftarrow":"\u21A9","hookrightarrow":"\u21AA","hopf":"\uD835\uDD59","Hopf":"\u210D","horbar":"\u2015","HorizontalLine":"\u2500","hscr":"\uD835\uDCBD","Hscr":"\u210B","hslash":"\u210F","Hstrok":"\u0126","hstrok":"\u0127","HumpDownHump":"\u224E","HumpEqual":"\u224F","hybull":"\u2043","hyphen":"\u2010","Iacute":"\u00CD","iacute":"\u00ED","ic":"\u2063","Icirc":"\u00CE","icirc":"\u00EE","Icy":"\u0418","icy":"\u0438","Idot":"\u0130","IEcy":"\u0415","iecy":"\u0435","iexcl":"\u00A1","iff":"\u21D4","ifr":"\uD835\uDD26","Ifr":"\u2111","Igrave":"\u00CC","igrave":"\u00EC","ii":"\u2148","iiiint":"\u2A0C","iiint":"\u222D","iinfin":"\u29DC","iiota":"\u2129","IJlig":"\u0132","ijlig":"\u0133","Imacr":"\u012A","imacr":"\u012B","image":"\u2111","ImaginaryI":"\u2148","imagline":"\u2110","imagpart":"\u2111","imath":"\u0131","Im":"\u2111","imof":"\u22B7","imped":"\u01B5","Implies":"\u21D2","incare":"\u2105","in":"\u2208","infin":"\u221E","infintie":"\u29DD","inodot":"\u0131","intcal":"\u22BA","int":"\u222B","Int":"\u222C","integers":"\u2124","Integral":"\u222B","intercal":"\u22BA","Intersection":"\u22C2","intlarhk":"\u2A17","intprod":"\u2A3C","InvisibleComma":"\u2063","InvisibleTimes":"\u2062","IOcy":"\u0401","iocy":"\u0451","Iogon":"\u012E","iogon":"\u012F","Iopf":"\uD835\uDD40","iopf":"\uD835\uDD5A","Iota":"\u0399","iota":"\u03B9","iprod":"\u2A3C","iquest":"\u00BF","iscr":"\uD835\uDCBE","Iscr":"\u2110","isin":"\u2208","isindot":"\u22F5","isinE":"\u22F9","isins":"\u22F4","isinsv":"\u22F3","isinv":"\u2208","it":"\u2062","Itilde":"\u0128","itilde":"\u0129","Iukcy":"\u0406","iukcy":"\u0456","Iuml":"\u00CF","iuml":"\u00EF","Jcirc":"\u0134","jcirc":"\u0135","Jcy":"\u0419","jcy":"\u0439","Jfr":"\uD835\uDD0D","jfr":"\uD835\uDD27","jmath":"\u0237","Jopf":"\uD835\uDD41","jopf":"\uD835\uDD5B","Jscr":"\uD835\uDCA5","jscr":"\uD835\uDCBF","Jsercy":"\u0408","jsercy":"\u0458","Jukcy":"\u0404","jukcy":"\u0454","Kappa":"\u039A","kappa":"\u03BA","kappav":"\u03F0","Kcedil":"\u0136","kcedil":"\u0137","Kcy":"\u041A","kcy":"\u043A","Kfr":"\uD835\uDD0E","kfr":"\uD835\uDD28","kgreen":"\u0138","KHcy":"\u0425","khcy":"\u0445","KJcy":"\u040C","kjcy":"\u045C","Kopf":"\uD835\uDD42","kopf":"\uD835\uDD5C","Kscr":"\uD835\uDCA6","kscr":"\uD835\uDCC0","lAarr":"\u21DA","Lacute":"\u0139","lacute":"\u013A","laemptyv":"\u29B4","lagran":"\u2112","Lambda":"\u039B","lambda":"\u03BB","lang":"\u27E8","Lang":"\u27EA","langd":"\u2991","langle":"\u27E8","lap":"\u2A85","Laplacetrf":"\u2112","laquo":"\u00AB","larrb":"\u21E4","larrbfs":"\u291F","larr":"\u2190","Larr":"\u219E","lArr":"\u21D0","larrfs":"\u291D","larrhk":"\u21A9","larrlp":"\u21AB","larrpl":"\u2939","larrsim":"\u2973","larrtl":"\u21A2","latail":"\u2919","lAtail":"\u291B","lat":"\u2AAB","late":"\u2AAD","lates":"\u2AAD\uFE00","lbarr":"\u290C","lBarr":"\u290E","lbbrk":"\u2772","lbrace":"{","lbrack":"[","lbrke":"\u298B","lbrksld":"\u298F","lbrkslu":"\u298D","Lcaron":"\u013D","lcaron":"\u013E","Lcedil":"\u013B","lcedil":"\u013C","lceil":"\u2308","lcub":"{","Lcy":"\u041B","lcy":"\u043B","ldca":"\u2936","ldquo":"\u201C","ldquor":"\u201E","ldrdhar":"\u2967","ldrushar":"\u294B","ldsh":"\u21B2","le":"\u2264","lE":"\u2266","LeftAngleBracket":"\u27E8","LeftArrowBar":"\u21E4","leftarrow":"\u2190","LeftArrow":"\u2190","Leftarrow":"\u21D0","LeftArrowRightArrow":"\u21C6","leftarrowtail":"\u21A2","LeftCeiling":"\u2308","LeftDoubleBracket":"\u27E6","LeftDownTeeVector":"\u2961","LeftDownVectorBar":"\u2959","LeftDownVector":"\u21C3","LeftFloor":"\u230A","leftharpoondown":"\u21BD","leftharpoonup":"\u21BC","leftleftarrows":"\u21C7","leftrightarrow":"\u2194","LeftRightArrow":"\u2194","Leftrightarrow":"\u21D4","leftrightarrows":"\u21C6","leftrightharpoons":"\u21CB","leftrightsquigarrow":"\u21AD","LeftRightVector":"\u294E","LeftTeeArrow":"\u21A4","LeftTee":"\u22A3","LeftTeeVector":"\u295A","leftthreetimes":"\u22CB","LeftTriangleBar":"\u29CF","LeftTriangle":"\u22B2","LeftTriangleEqual":"\u22B4","LeftUpDownVector":"\u2951","LeftUpTeeVector":"\u2960","LeftUpVectorBar":"\u2958","LeftUpVector":"\u21BF","LeftVectorBar":"\u2952","LeftVector":"\u21BC","lEg":"\u2A8B","leg":"\u22DA","leq":"\u2264","leqq":"\u2266","leqslant":"\u2A7D","lescc":"\u2AA8","les":"\u2A7D","lesdot":"\u2A7F","lesdoto":"\u2A81","lesdotor":"\u2A83","lesg":"\u22DA\uFE00","lesges":"\u2A93","lessapprox":"\u2A85","lessdot":"\u22D6","lesseqgtr":"\u22DA","lesseqqgtr":"\u2A8B","LessEqualGreater":"\u22DA","LessFullEqual":"\u2266","LessGreater":"\u2276","lessgtr":"\u2276","LessLess":"\u2AA1","lesssim":"\u2272","LessSlantEqual":"\u2A7D","LessTilde":"\u2272","lfisht":"\u297C","lfloor":"\u230A","Lfr":"\uD835\uDD0F","lfr":"\uD835\uDD29","lg":"\u2276","lgE":"\u2A91","lHar":"\u2962","lhard":"\u21BD","lharu":"\u21BC","lharul":"\u296A","lhblk":"\u2584","LJcy":"\u0409","ljcy":"\u0459","llarr":"\u21C7","ll":"\u226A","Ll":"\u22D8","llcorner":"\u231E","Lleftarrow":"\u21DA","llhard":"\u296B","lltri":"\u25FA","Lmidot":"\u013F","lmidot":"\u0140","lmoustache":"\u23B0","lmoust":"\u23B0","lnap":"\u2A89","lnapprox":"\u2A89","lne":"\u2A87","lnE":"\u2268","lneq":"\u2A87","lneqq":"\u2268","lnsim":"\u22E6","loang":"\u27EC","loarr":"\u21FD","lobrk":"\u27E6","longleftarrow":"\u27F5","LongLeftArrow":"\u27F5","Longleftarrow":"\u27F8","longleftrightarrow":"\u27F7","LongLeftRightArrow":"\u27F7","Longleftrightarrow":"\u27FA","longmapsto":"\u27FC","longrightarrow":"\u27F6","LongRightArrow":"\u27F6","Longrightarrow":"\u27F9","looparrowleft":"\u21AB","looparrowright":"\u21AC","lopar":"\u2985","Lopf":"\uD835\uDD43","lopf":"\uD835\uDD5D","loplus":"\u2A2D","lotimes":"\u2A34","lowast":"\u2217","lowbar":"_","LowerLeftArrow":"\u2199","LowerRightArrow":"\u2198","loz":"\u25CA","lozenge":"\u25CA","lozf":"\u29EB","lpar":"(","lparlt":"\u2993","lrarr":"\u21C6","lrcorner":"\u231F","lrhar":"\u21CB","lrhard":"\u296D","lrm":"\u200E","lrtri":"\u22BF","lsaquo":"\u2039","lscr":"\uD835\uDCC1","Lscr":"\u2112","lsh":"\u21B0","Lsh":"\u21B0","lsim":"\u2272","lsime":"\u2A8D","lsimg":"\u2A8F","lsqb":"[","lsquo":"\u2018","lsquor":"\u201A","Lstrok":"\u0141","lstrok":"\u0142","ltcc":"\u2AA6","ltcir":"\u2A79","lt":"<","LT":"<","Lt":"\u226A","ltdot":"\u22D6","lthree":"\u22CB","ltimes":"\u22C9","ltlarr":"\u2976","ltquest":"\u2A7B","ltri":"\u25C3","ltrie":"\u22B4","ltrif":"\u25C2","ltrPar":"\u2996","lurdshar":"\u294A","luruhar":"\u2966","lvertneqq":"\u2268\uFE00","lvnE":"\u2268\uFE00","macr":"\u00AF","male":"\u2642","malt":"\u2720","maltese":"\u2720","Map":"\u2905","map":"\u21A6","mapsto":"\u21A6","mapstodown":"\u21A7","mapstoleft":"\u21A4","mapstoup":"\u21A5","marker":"\u25AE","mcomma":"\u2A29","Mcy":"\u041C","mcy":"\u043C","mdash":"\u2014","mDDot":"\u223A","measuredangle":"\u2221","MediumSpace":"\u205F","Mellintrf":"\u2133","Mfr":"\uD835\uDD10","mfr":"\uD835\uDD2A","mho":"\u2127","micro":"\u00B5","midast":"*","midcir":"\u2AF0","mid":"\u2223","middot":"\u00B7","minusb":"\u229F","minus":"\u2212","minusd":"\u2238","minusdu":"\u2A2A","MinusPlus":"\u2213","mlcp":"\u2ADB","mldr":"\u2026","mnplus":"\u2213","models":"\u22A7","Mopf":"\uD835\uDD44","mopf":"\uD835\uDD5E","mp":"\u2213","mscr":"\uD835\uDCC2","Mscr":"\u2133","mstpos":"\u223E","Mu":"\u039C","mu":"\u03BC","multimap":"\u22B8","mumap":"\u22B8","nabla":"\u2207","Nacute":"\u0143","nacute":"\u0144","nang":"\u2220\u20D2","nap":"\u2249","napE":"\u2A70\u0338","napid":"\u224B\u0338","napos":"\u0149","napprox":"\u2249","natural":"\u266E","naturals":"\u2115","natur":"\u266E","nbsp":"\u00A0","nbump":"\u224E\u0338","nbumpe":"\u224F\u0338","ncap":"\u2A43","Ncaron":"\u0147","ncaron":"\u0148","Ncedil":"\u0145","ncedil":"\u0146","ncong":"\u2247","ncongdot":"\u2A6D\u0338","ncup":"\u2A42","Ncy":"\u041D","ncy":"\u043D","ndash":"\u2013","nearhk":"\u2924","nearr":"\u2197","neArr":"\u21D7","nearrow":"\u2197","ne":"\u2260","nedot":"\u2250\u0338","NegativeMediumSpace":"\u200B","NegativeThickSpace":"\u200B","NegativeThinSpace":"\u200B","NegativeVeryThinSpace":"\u200B","nequiv":"\u2262","nesear":"\u2928","nesim":"\u2242\u0338","NestedGreaterGreater":"\u226B","NestedLessLess":"\u226A","NewLine":"\n","nexist":"\u2204","nexists":"\u2204","Nfr":"\uD835\uDD11","nfr":"\uD835\uDD2B","ngE":"\u2267\u0338","nge":"\u2271","ngeq":"\u2271","ngeqq":"\u2267\u0338","ngeqslant":"\u2A7E\u0338","nges":"\u2A7E\u0338","nGg":"\u22D9\u0338","ngsim":"\u2275","nGt":"\u226B\u20D2","ngt":"\u226F","ngtr":"\u226F","nGtv":"\u226B\u0338","nharr":"\u21AE","nhArr":"\u21CE","nhpar":"\u2AF2","ni":"\u220B","nis":"\u22FC","nisd":"\u22FA","niv":"\u220B","NJcy":"\u040A","njcy":"\u045A","nlarr":"\u219A","nlArr":"\u21CD","nldr":"\u2025","nlE":"\u2266\u0338","nle":"\u2270","nleftarrow":"\u219A","nLeftarrow":"\u21CD","nleftrightarrow":"\u21AE","nLeftrightarrow":"\u21CE","nleq":"\u2270","nleqq":"\u2266\u0338","nleqslant":"\u2A7D\u0338","nles":"\u2A7D\u0338","nless":"\u226E","nLl":"\u22D8\u0338","nlsim":"\u2274","nLt":"\u226A\u20D2","nlt":"\u226E","nltri":"\u22EA","nltrie":"\u22EC","nLtv":"\u226A\u0338","nmid":"\u2224","NoBreak":"\u2060","NonBreakingSpace":"\u00A0","nopf":"\uD835\uDD5F","Nopf":"\u2115","Not":"\u2AEC","not":"\u00AC","NotCongruent":"\u2262","NotCupCap":"\u226D","NotDoubleVerticalBar":"\u2226","NotElement":"\u2209","NotEqual":"\u2260","NotEqualTilde":"\u2242\u0338","NotExists":"\u2204","NotGreater":"\u226F","NotGreaterEqual":"\u2271","NotGreaterFullEqual":"\u2267\u0338","NotGreaterGreater":"\u226B\u0338","NotGreaterLess":"\u2279","NotGreaterSlantEqual":"\u2A7E\u0338","NotGreaterTilde":"\u2275","NotHumpDownHump":"\u224E\u0338","NotHumpEqual":"\u224F\u0338","notin":"\u2209","notindot":"\u22F5\u0338","notinE":"\u22F9\u0338","notinva":"\u2209","notinvb":"\u22F7","notinvc":"\u22F6","NotLeftTriangleBar":"\u29CF\u0338","NotLeftTriangle":"\u22EA","NotLeftTriangleEqual":"\u22EC","NotLess":"\u226E","NotLessEqual":"\u2270","NotLessGreater":"\u2278","NotLessLess":"\u226A\u0338","NotLessSlantEqual":"\u2A7D\u0338","NotLessTilde":"\u2274","NotNestedGreaterGreater":"\u2AA2\u0338","NotNestedLessLess":"\u2AA1\u0338","notni":"\u220C","notniva":"\u220C","notnivb":"\u22FE","notnivc":"\u22FD","NotPrecedes":"\u2280","NotPrecedesEqual":"\u2AAF\u0338","NotPrecedesSlantEqual":"\u22E0","NotReverseElement":"\u220C","NotRightTriangleBar":"\u29D0\u0338","NotRightTriangle":"\u22EB","NotRightTriangleEqual":"\u22ED","NotSquareSubset":"\u228F\u0338","NotSquareSubsetEqual":"\u22E2","NotSquareSuperset":"\u2290\u0338","NotSquareSupersetEqual":"\u22E3","NotSubset":"\u2282\u20D2","NotSubsetEqual":"\u2288","NotSucceeds":"\u2281","NotSucceedsEqual":"\u2AB0\u0338","NotSucceedsSlantEqual":"\u22E1","NotSucceedsTilde":"\u227F\u0338","NotSuperset":"\u2283\u20D2","NotSupersetEqual":"\u2289","NotTilde":"\u2241","NotTildeEqual":"\u2244","NotTildeFullEqual":"\u2247","NotTildeTilde":"\u2249","NotVerticalBar":"\u2224","nparallel":"\u2226","npar":"\u2226","nparsl":"\u2AFD\u20E5","npart":"\u2202\u0338","npolint":"\u2A14","npr":"\u2280","nprcue":"\u22E0","nprec":"\u2280","npreceq":"\u2AAF\u0338","npre":"\u2AAF\u0338","nrarrc":"\u2933\u0338","nrarr":"\u219B","nrArr":"\u21CF","nrarrw":"\u219D\u0338","nrightarrow":"\u219B","nRightarrow":"\u21CF","nrtri":"\u22EB","nrtrie":"\u22ED","nsc":"\u2281","nsccue":"\u22E1","nsce":"\u2AB0\u0338","Nscr":"\uD835\uDCA9","nscr":"\uD835\uDCC3","nshortmid":"\u2224","nshortparallel":"\u2226","nsim":"\u2241","nsime":"\u2244","nsimeq":"\u2244","nsmid":"\u2224","nspar":"\u2226","nsqsube":"\u22E2","nsqsupe":"\u22E3","nsub":"\u2284","nsubE":"\u2AC5\u0338","nsube":"\u2288","nsubset":"\u2282\u20D2","nsubseteq":"\u2288","nsubseteqq":"\u2AC5\u0338","nsucc":"\u2281","nsucceq":"\u2AB0\u0338","nsup":"\u2285","nsupE":"\u2AC6\u0338","nsupe":"\u2289","nsupset":"\u2283\u20D2","nsupseteq":"\u2289","nsupseteqq":"\u2AC6\u0338","ntgl":"\u2279","Ntilde":"\u00D1","ntilde":"\u00F1","ntlg":"\u2278","ntriangleleft":"\u22EA","ntrianglelefteq":"\u22EC","ntriangleright":"\u22EB","ntrianglerighteq":"\u22ED","Nu":"\u039D","nu":"\u03BD","num":"#","numero":"\u2116","numsp":"\u2007","nvap":"\u224D\u20D2","nvdash":"\u22AC","nvDash":"\u22AD","nVdash":"\u22AE","nVDash":"\u22AF","nvge":"\u2265\u20D2","nvgt":">\u20D2","nvHarr":"\u2904","nvinfin":"\u29DE","nvlArr":"\u2902","nvle":"\u2264\u20D2","nvlt":"<\u20D2","nvltrie":"\u22B4\u20D2","nvrArr":"\u2903","nvrtrie":"\u22B5\u20D2","nvsim":"\u223C\u20D2","nwarhk":"\u2923","nwarr":"\u2196","nwArr":"\u21D6","nwarrow":"\u2196","nwnear":"\u2927","Oacute":"\u00D3","oacute":"\u00F3","oast":"\u229B","Ocirc":"\u00D4","ocirc":"\u00F4","ocir":"\u229A","Ocy":"\u041E","ocy":"\u043E","odash":"\u229D","Odblac":"\u0150","odblac":"\u0151","odiv":"\u2A38","odot":"\u2299","odsold":"\u29BC","OElig":"\u0152","oelig":"\u0153","ofcir":"\u29BF","Ofr":"\uD835\uDD12","ofr":"\uD835\uDD2C","ogon":"\u02DB","Ograve":"\u00D2","ograve":"\u00F2","ogt":"\u29C1","ohbar":"\u29B5","ohm":"\u03A9","oint":"\u222E","olarr":"\u21BA","olcir":"\u29BE","olcross":"\u29BB","oline":"\u203E","olt":"\u29C0","Omacr":"\u014C","omacr":"\u014D","Omega":"\u03A9","omega":"\u03C9","Omicron":"\u039F","omicron":"\u03BF","omid":"\u29B6","ominus":"\u2296","Oopf":"\uD835\uDD46","oopf":"\uD835\uDD60","opar":"\u29B7","OpenCurlyDoubleQuote":"\u201C","OpenCurlyQuote":"\u2018","operp":"\u29B9","oplus":"\u2295","orarr":"\u21BB","Or":"\u2A54","or":"\u2228","ord":"\u2A5D","order":"\u2134","orderof":"\u2134","ordf":"\u00AA","ordm":"\u00BA","origof":"\u22B6","oror":"\u2A56","orslope":"\u2A57","orv":"\u2A5B","oS":"\u24C8","Oscr":"\uD835\uDCAA","oscr":"\u2134","Oslash":"\u00D8","oslash":"\u00F8","osol":"\u2298","Otilde":"\u00D5","otilde":"\u00F5","otimesas":"\u2A36","Otimes":"\u2A37","otimes":"\u2297","Ouml":"\u00D6","ouml":"\u00F6","ovbar":"\u233D","OverBar":"\u203E","OverBrace":"\u23DE","OverBracket":"\u23B4","OverParenthesis":"\u23DC","para":"\u00B6","parallel":"\u2225","par":"\u2225","parsim":"\u2AF3","parsl":"\u2AFD","part":"\u2202","PartialD":"\u2202","Pcy":"\u041F","pcy":"\u043F","percnt":"%","period":".","permil":"\u2030","perp":"\u22A5","pertenk":"\u2031","Pfr":"\uD835\uDD13","pfr":"\uD835\uDD2D","Phi":"\u03A6","phi":"\u03C6","phiv":"\u03D5","phmmat":"\u2133","phone":"\u260E","Pi":"\u03A0","pi":"\u03C0","pitchfork":"\u22D4","piv":"\u03D6","planck":"\u210F","planckh":"\u210E","plankv":"\u210F","plusacir":"\u2A23","plusb":"\u229E","pluscir":"\u2A22","plus":"+","plusdo":"\u2214","plusdu":"\u2A25","pluse":"\u2A72","PlusMinus":"\u00B1","plusmn":"\u00B1","plussim":"\u2A26","plustwo":"\u2A27","pm":"\u00B1","Poincareplane":"\u210C","pointint":"\u2A15","popf":"\uD835\uDD61","Popf":"\u2119","pound":"\u00A3","prap":"\u2AB7","Pr":"\u2ABB","pr":"\u227A","prcue":"\u227C","precapprox":"\u2AB7","prec":"\u227A","preccurlyeq":"\u227C","Precedes":"\u227A","PrecedesEqual":"\u2AAF","PrecedesSlantEqual":"\u227C","PrecedesTilde":"\u227E","preceq":"\u2AAF","precnapprox":"\u2AB9","precneqq":"\u2AB5","precnsim":"\u22E8","pre":"\u2AAF","prE":"\u2AB3","precsim":"\u227E","prime":"\u2032","Prime":"\u2033","primes":"\u2119","prnap":"\u2AB9","prnE":"\u2AB5","prnsim":"\u22E8","prod":"\u220F","Product":"\u220F","profalar":"\u232E","profline":"\u2312","profsurf":"\u2313","prop":"\u221D","Proportional":"\u221D","Proportion":"\u2237","propto":"\u221D","prsim":"\u227E","prurel":"\u22B0","Pscr":"\uD835\uDCAB","pscr":"\uD835\uDCC5","Psi":"\u03A8","psi":"\u03C8","puncsp":"\u2008","Qfr":"\uD835\uDD14","qfr":"\uD835\uDD2E","qint":"\u2A0C","qopf":"\uD835\uDD62","Qopf":"\u211A","qprime":"\u2057","Qscr":"\uD835\uDCAC","qscr":"\uD835\uDCC6","quaternions":"\u210D","quatint":"\u2A16","quest":"?","questeq":"\u225F","quot":"\"","QUOT":"\"","rAarr":"\u21DB","race":"\u223D\u0331","Racute":"\u0154","racute":"\u0155","radic":"\u221A","raemptyv":"\u29B3","rang":"\u27E9","Rang":"\u27EB","rangd":"\u2992","range":"\u29A5","rangle":"\u27E9","raquo":"\u00BB","rarrap":"\u2975","rarrb":"\u21E5","rarrbfs":"\u2920","rarrc":"\u2933","rarr":"\u2192","Rarr":"\u21A0","rArr":"\u21D2","rarrfs":"\u291E","rarrhk":"\u21AA","rarrlp":"\u21AC","rarrpl":"\u2945","rarrsim":"\u2974","Rarrtl":"\u2916","rarrtl":"\u21A3","rarrw":"\u219D","ratail":"\u291A","rAtail":"\u291C","ratio":"\u2236","rationals":"\u211A","rbarr":"\u290D","rBarr":"\u290F","RBarr":"\u2910","rbbrk":"\u2773","rbrace":"}","rbrack":"]","rbrke":"\u298C","rbrksld":"\u298E","rbrkslu":"\u2990","Rcaron":"\u0158","rcaron":"\u0159","Rcedil":"\u0156","rcedil":"\u0157","rceil":"\u2309","rcub":"}","Rcy":"\u0420","rcy":"\u0440","rdca":"\u2937","rdldhar":"\u2969","rdquo":"\u201D","rdquor":"\u201D","rdsh":"\u21B3","real":"\u211C","realine":"\u211B","realpart":"\u211C","reals":"\u211D","Re":"\u211C","rect":"\u25AD","reg":"\u00AE","REG":"\u00AE","ReverseElement":"\u220B","ReverseEquilibrium":"\u21CB","ReverseUpEquilibrium":"\u296F","rfisht":"\u297D","rfloor":"\u230B","rfr":"\uD835\uDD2F","Rfr":"\u211C","rHar":"\u2964","rhard":"\u21C1","rharu":"\u21C0","rharul":"\u296C","Rho":"\u03A1","rho":"\u03C1","rhov":"\u03F1","RightAngleBracket":"\u27E9","RightArrowBar":"\u21E5","rightarrow":"\u2192","RightArrow":"\u2192","Rightarrow":"\u21D2","RightArrowLeftArrow":"\u21C4","rightarrowtail":"\u21A3","RightCeiling":"\u2309","RightDoubleBracket":"\u27E7","RightDownTeeVector":"\u295D","RightDownVectorBar":"\u2955","RightDownVector":"\u21C2","RightFloor":"\u230B","rightharpoondown":"\u21C1","rightharpoonup":"\u21C0","rightleftarrows":"\u21C4","rightleftharpoons":"\u21CC","rightrightarrows":"\u21C9","rightsquigarrow":"\u219D","RightTeeArrow":"\u21A6","RightTee":"\u22A2","RightTeeVector":"\u295B","rightthreetimes":"\u22CC","RightTriangleBar":"\u29D0","RightTriangle":"\u22B3","RightTriangleEqual":"\u22B5","RightUpDownVector":"\u294F","RightUpTeeVector":"\u295C","RightUpVectorBar":"\u2954","RightUpVector":"\u21BE","RightVectorBar":"\u2953","RightVector":"\u21C0","ring":"\u02DA","risingdotseq":"\u2253","rlarr":"\u21C4","rlhar":"\u21CC","rlm":"\u200F","rmoustache":"\u23B1","rmoust":"\u23B1","rnmid":"\u2AEE","roang":"\u27ED","roarr":"\u21FE","robrk":"\u27E7","ropar":"\u2986","ropf":"\uD835\uDD63","Ropf":"\u211D","roplus":"\u2A2E","rotimes":"\u2A35","RoundImplies":"\u2970","rpar":")","rpargt":"\u2994","rppolint":"\u2A12","rrarr":"\u21C9","Rrightarrow":"\u21DB","rsaquo":"\u203A","rscr":"\uD835\uDCC7","Rscr":"\u211B","rsh":"\u21B1","Rsh":"\u21B1","rsqb":"]","rsquo":"\u2019","rsquor":"\u2019","rthree":"\u22CC","rtimes":"\u22CA","rtri":"\u25B9","rtrie":"\u22B5","rtrif":"\u25B8","rtriltri":"\u29CE","RuleDelayed":"\u29F4","ruluhar":"\u2968","rx":"\u211E","Sacute":"\u015A","sacute":"\u015B","sbquo":"\u201A","scap":"\u2AB8","Scaron":"\u0160","scaron":"\u0161","Sc":"\u2ABC","sc":"\u227B","sccue":"\u227D","sce":"\u2AB0","scE":"\u2AB4","Scedil":"\u015E","scedil":"\u015F","Scirc":"\u015C","scirc":"\u015D","scnap":"\u2ABA","scnE":"\u2AB6","scnsim":"\u22E9","scpolint":"\u2A13","scsim":"\u227F","Scy":"\u0421","scy":"\u0441","sdotb":"\u22A1","sdot":"\u22C5","sdote":"\u2A66","searhk":"\u2925","searr":"\u2198","seArr":"\u21D8","searrow":"\u2198","sect":"\u00A7","semi":";","seswar":"\u2929","setminus":"\u2216","setmn":"\u2216","sext":"\u2736","Sfr":"\uD835\uDD16","sfr":"\uD835\uDD30","sfrown":"\u2322","sharp":"\u266F","SHCHcy":"\u0429","shchcy":"\u0449","SHcy":"\u0428","shcy":"\u0448","ShortDownArrow":"\u2193","ShortLeftArrow":"\u2190","shortmid":"\u2223","shortparallel":"\u2225","ShortRightArrow":"\u2192","ShortUpArrow":"\u2191","shy":"\u00AD","Sigma":"\u03A3","sigma":"\u03C3","sigmaf":"\u03C2","sigmav":"\u03C2","sim":"\u223C","simdot":"\u2A6A","sime":"\u2243","simeq":"\u2243","simg":"\u2A9E","simgE":"\u2AA0","siml":"\u2A9D","simlE":"\u2A9F","simne":"\u2246","simplus":"\u2A24","simrarr":"\u2972","slarr":"\u2190","SmallCircle":"\u2218","smallsetminus":"\u2216","smashp":"\u2A33","smeparsl":"\u29E4","smid":"\u2223","smile":"\u2323","smt":"\u2AAA","smte":"\u2AAC","smtes":"\u2AAC\uFE00","SOFTcy":"\u042C","softcy":"\u044C","solbar":"\u233F","solb":"\u29C4","sol":"/","Sopf":"\uD835\uDD4A","sopf":"\uD835\uDD64","spades":"\u2660","spadesuit":"\u2660","spar":"\u2225","sqcap":"\u2293","sqcaps":"\u2293\uFE00","sqcup":"\u2294","sqcups":"\u2294\uFE00","Sqrt":"\u221A","sqsub":"\u228F","sqsube":"\u2291","sqsubset":"\u228F","sqsubseteq":"\u2291","sqsup":"\u2290","sqsupe":"\u2292","sqsupset":"\u2290","sqsupseteq":"\u2292","square":"\u25A1","Square":"\u25A1","SquareIntersection":"\u2293","SquareSubset":"\u228F","SquareSubsetEqual":"\u2291","SquareSuperset":"\u2290","SquareSupersetEqual":"\u2292","SquareUnion":"\u2294","squarf":"\u25AA","squ":"\u25A1","squf":"\u25AA","srarr":"\u2192","Sscr":"\uD835\uDCAE","sscr":"\uD835\uDCC8","ssetmn":"\u2216","ssmile":"\u2323","sstarf":"\u22C6","Star":"\u22C6","star":"\u2606","starf":"\u2605","straightepsilon":"\u03F5","straightphi":"\u03D5","strns":"\u00AF","sub":"\u2282","Sub":"\u22D0","subdot":"\u2ABD","subE":"\u2AC5","sube":"\u2286","subedot":"\u2AC3","submult":"\u2AC1","subnE":"\u2ACB","subne":"\u228A","subplus":"\u2ABF","subrarr":"\u2979","subset":"\u2282","Subset":"\u22D0","subseteq":"\u2286","subseteqq":"\u2AC5","SubsetEqual":"\u2286","subsetneq":"\u228A","subsetneqq":"\u2ACB","subsim":"\u2AC7","subsub":"\u2AD5","subsup":"\u2AD3","succapprox":"\u2AB8","succ":"\u227B","succcurlyeq":"\u227D","Succeeds":"\u227B","SucceedsEqual":"\u2AB0","SucceedsSlantEqual":"\u227D","SucceedsTilde":"\u227F","succeq":"\u2AB0","succnapprox":"\u2ABA","succneqq":"\u2AB6","succnsim":"\u22E9","succsim":"\u227F","SuchThat":"\u220B","sum":"\u2211","Sum":"\u2211","sung":"\u266A","sup1":"\u00B9","sup2":"\u00B2","sup3":"\u00B3","sup":"\u2283","Sup":"\u22D1","supdot":"\u2ABE","supdsub":"\u2AD8","supE":"\u2AC6","supe":"\u2287","supedot":"\u2AC4","Superset":"\u2283","SupersetEqual":"\u2287","suphsol":"\u27C9","suphsub":"\u2AD7","suplarr":"\u297B","supmult":"\u2AC2","supnE":"\u2ACC","supne":"\u228B","supplus":"\u2AC0","supset":"\u2283","Supset":"\u22D1","supseteq":"\u2287","supseteqq":"\u2AC6","supsetneq":"\u228B","supsetneqq":"\u2ACC","supsim":"\u2AC8","supsub":"\u2AD4","supsup":"\u2AD6","swarhk":"\u2926","swarr":"\u2199","swArr":"\u21D9","swarrow":"\u2199","swnwar":"\u292A","szlig":"\u00DF","Tab":"\t","target":"\u2316","Tau":"\u03A4","tau":"\u03C4","tbrk":"\u23B4","Tcaron":"\u0164","tcaron":"\u0165","Tcedil":"\u0162","tcedil":"\u0163","Tcy":"\u0422","tcy":"\u0442","tdot":"\u20DB","telrec":"\u2315","Tfr":"\uD835\uDD17","tfr":"\uD835\uDD31","there4":"\u2234","therefore":"\u2234","Therefore":"\u2234","Theta":"\u0398","theta":"\u03B8","thetasym":"\u03D1","thetav":"\u03D1","thickapprox":"\u2248","thicksim":"\u223C","ThickSpace":"\u205F\u200A","ThinSpace":"\u2009","thinsp":"\u2009","thkap":"\u2248","thksim":"\u223C","THORN":"\u00DE","thorn":"\u00FE","tilde":"\u02DC","Tilde":"\u223C","TildeEqual":"\u2243","TildeFullEqual":"\u2245","TildeTilde":"\u2248","timesbar":"\u2A31","timesb":"\u22A0","times":"\u00D7","timesd":"\u2A30","tint":"\u222D","toea":"\u2928","topbot":"\u2336","topcir":"\u2AF1","top":"\u22A4","Topf":"\uD835\uDD4B","topf":"\uD835\uDD65","topfork":"\u2ADA","tosa":"\u2929","tprime":"\u2034","trade":"\u2122","TRADE":"\u2122","triangle":"\u25B5","triangledown":"\u25BF","triangleleft":"\u25C3","trianglelefteq":"\u22B4","triangleq":"\u225C","triangleright":"\u25B9","trianglerighteq":"\u22B5","tridot":"\u25EC","trie":"\u225C","triminus":"\u2A3A","TripleDot":"\u20DB","triplus":"\u2A39","trisb":"\u29CD","tritime":"\u2A3B","trpezium":"\u23E2","Tscr":"\uD835\uDCAF","tscr":"\uD835\uDCC9","TScy":"\u0426","tscy":"\u0446","TSHcy":"\u040B","tshcy":"\u045B","Tstrok":"\u0166","tstrok":"\u0167","twixt":"\u226C","twoheadleftarrow":"\u219E","twoheadrightarrow":"\u21A0","Uacute":"\u00DA","uacute":"\u00FA","uarr":"\u2191","Uarr":"\u219F","uArr":"\u21D1","Uarrocir":"\u2949","Ubrcy":"\u040E","ubrcy":"\u045E","Ubreve":"\u016C","ubreve":"\u016D","Ucirc":"\u00DB","ucirc":"\u00FB","Ucy":"\u0423","ucy":"\u0443","udarr":"\u21C5","Udblac":"\u0170","udblac":"\u0171","udhar":"\u296E","ufisht":"\u297E","Ufr":"\uD835\uDD18","ufr":"\uD835\uDD32","Ugrave":"\u00D9","ugrave":"\u00F9","uHar":"\u2963","uharl":"\u21BF","uharr":"\u21BE","uhblk":"\u2580","ulcorn":"\u231C","ulcorner":"\u231C","ulcrop":"\u230F","ultri":"\u25F8","Umacr":"\u016A","umacr":"\u016B","uml":"\u00A8","UnderBar":"_","UnderBrace":"\u23DF","UnderBracket":"\u23B5","UnderParenthesis":"\u23DD","Union":"\u22C3","UnionPlus":"\u228E","Uogon":"\u0172","uogon":"\u0173","Uopf":"\uD835\uDD4C","uopf":"\uD835\uDD66","UpArrowBar":"\u2912","uparrow":"\u2191","UpArrow":"\u2191","Uparrow":"\u21D1","UpArrowDownArrow":"\u21C5","updownarrow":"\u2195","UpDownArrow":"\u2195","Updownarrow":"\u21D5","UpEquilibrium":"\u296E","upharpoonleft":"\u21BF","upharpoonright":"\u21BE","uplus":"\u228E","UpperLeftArrow":"\u2196","UpperRightArrow":"\u2197","upsi":"\u03C5","Upsi":"\u03D2","upsih":"\u03D2","Upsilon":"\u03A5","upsilon":"\u03C5","UpTeeArrow":"\u21A5","UpTee":"\u22A5","upuparrows":"\u21C8","urcorn":"\u231D","urcorner":"\u231D","urcrop":"\u230E","Uring":"\u016E","uring":"\u016F","urtri":"\u25F9","Uscr":"\uD835\uDCB0","uscr":"\uD835\uDCCA","utdot":"\u22F0","Utilde":"\u0168","utilde":"\u0169","utri":"\u25B5","utrif":"\u25B4","uuarr":"\u21C8","Uuml":"\u00DC","uuml":"\u00FC","uwangle":"\u29A7","vangrt":"\u299C","varepsilon":"\u03F5","varkappa":"\u03F0","varnothing":"\u2205","varphi":"\u03D5","varpi":"\u03D6","varpropto":"\u221D","varr":"\u2195","vArr":"\u21D5","varrho":"\u03F1","varsigma":"\u03C2","varsubsetneq":"\u228A\uFE00","varsubsetneqq":"\u2ACB\uFE00","varsupsetneq":"\u228B\uFE00","varsupsetneqq":"\u2ACC\uFE00","vartheta":"\u03D1","vartriangleleft":"\u22B2","vartriangleright":"\u22B3","vBar":"\u2AE8","Vbar":"\u2AEB","vBarv":"\u2AE9","Vcy":"\u0412","vcy":"\u0432","vdash":"\u22A2","vDash":"\u22A8","Vdash":"\u22A9","VDash":"\u22AB","Vdashl":"\u2AE6","veebar":"\u22BB","vee":"\u2228","Vee":"\u22C1","veeeq":"\u225A","vellip":"\u22EE","verbar":"|","Verbar":"\u2016","vert":"|","Vert":"\u2016","VerticalBar":"\u2223","VerticalLine":"|","VerticalSeparator":"\u2758","VerticalTilde":"\u2240","VeryThinSpace":"\u200A","Vfr":"\uD835\uDD19","vfr":"\uD835\uDD33","vltri":"\u22B2","vnsub":"\u2282\u20D2","vnsup":"\u2283\u20D2","Vopf":"\uD835\uDD4D","vopf":"\uD835\uDD67","vprop":"\u221D","vrtri":"\u22B3","Vscr":"\uD835\uDCB1","vscr":"\uD835\uDCCB","vsubnE":"\u2ACB\uFE00","vsubne":"\u228A\uFE00","vsupnE":"\u2ACC\uFE00","vsupne":"\u228B\uFE00","Vvdash":"\u22AA","vzigzag":"\u299A","Wcirc":"\u0174","wcirc":"\u0175","wedbar":"\u2A5F","wedge":"\u2227","Wedge":"\u22C0","wedgeq":"\u2259","weierp":"\u2118","Wfr":"\uD835\uDD1A","wfr":"\uD835\uDD34","Wopf":"\uD835\uDD4E","wopf":"\uD835\uDD68","wp":"\u2118","wr":"\u2240","wreath":"\u2240","Wscr":"\uD835\uDCB2","wscr":"\uD835\uDCCC","xcap":"\u22C2","xcirc":"\u25EF","xcup":"\u22C3","xdtri":"\u25BD","Xfr":"\uD835\uDD1B","xfr":"\uD835\uDD35","xharr":"\u27F7","xhArr":"\u27FA","Xi":"\u039E","xi":"\u03BE","xlarr":"\u27F5","xlArr":"\u27F8","xmap":"\u27FC","xnis":"\u22FB","xodot":"\u2A00","Xopf":"\uD835\uDD4F","xopf":"\uD835\uDD69","xoplus":"\u2A01","xotime":"\u2A02","xrarr":"\u27F6","xrArr":"\u27F9","Xscr":"\uD835\uDCB3","xscr":"\uD835\uDCCD","xsqcup":"\u2A06","xuplus":"\u2A04","xutri":"\u25B3","xvee":"\u22C1","xwedge":"\u22C0","Yacute":"\u00DD","yacute":"\u00FD","YAcy":"\u042F","yacy":"\u044F","Ycirc":"\u0176","ycirc":"\u0177","Ycy":"\u042B","ycy":"\u044B","yen":"\u00A5","Yfr":"\uD835\uDD1C","yfr":"\uD835\uDD36","YIcy":"\u0407","yicy":"\u0457","Yopf":"\uD835\uDD50","yopf":"\uD835\uDD6A","Yscr":"\uD835\uDCB4","yscr":"\uD835\uDCCE","YUcy":"\u042E","yucy":"\u044E","yuml":"\u00FF","Yuml":"\u0178","Zacute":"\u0179","zacute":"\u017A","Zcaron":"\u017D","zcaron":"\u017E","Zcy":"\u0417","zcy":"\u0437","Zdot":"\u017B","zdot":"\u017C","zeetrf":"\u2128","ZeroWidthSpace":"\u200B","Zeta":"\u0396","zeta":"\u03B6","zfr":"\uD835\uDD37","Zfr":"\u2128","ZHcy":"\u0416","zhcy":"\u0436","zigrarr":"\u21DD","zopf":"\uD835\uDD6B","Zopf":"\u2124","Zscr":"\uD835\uDCB5","zscr":"\uD835\uDCCF","zwj":"\u200D","zwnj":"\u200C"}
},{}],41:[function(require,module,exports){
module.exports={"Aacute":"\u00C1","aacute":"\u00E1","Acirc":"\u00C2","acirc":"\u00E2","acute":"\u00B4","AElig":"\u00C6","aelig":"\u00E6","Agrave":"\u00C0","agrave":"\u00E0","amp":"&","AMP":"&","Aring":"\u00C5","aring":"\u00E5","Atilde":"\u00C3","atilde":"\u00E3","Auml":"\u00C4","auml":"\u00E4","brvbar":"\u00A6","Ccedil":"\u00C7","ccedil":"\u00E7","cedil":"\u00B8","cent":"\u00A2","copy":"\u00A9","COPY":"\u00A9","curren":"\u00A4","deg":"\u00B0","divide":"\u00F7","Eacute":"\u00C9","eacute":"\u00E9","Ecirc":"\u00CA","ecirc":"\u00EA","Egrave":"\u00C8","egrave":"\u00E8","ETH":"\u00D0","eth":"\u00F0","Euml":"\u00CB","euml":"\u00EB","frac12":"\u00BD","frac14":"\u00BC","frac34":"\u00BE","gt":">","GT":">","Iacute":"\u00CD","iacute":"\u00ED","Icirc":"\u00CE","icirc":"\u00EE","iexcl":"\u00A1","Igrave":"\u00CC","igrave":"\u00EC","iquest":"\u00BF","Iuml":"\u00CF","iuml":"\u00EF","laquo":"\u00AB","lt":"<","LT":"<","macr":"\u00AF","micro":"\u00B5","middot":"\u00B7","nbsp":"\u00A0","not":"\u00AC","Ntilde":"\u00D1","ntilde":"\u00F1","Oacute":"\u00D3","oacute":"\u00F3","Ocirc":"\u00D4","ocirc":"\u00F4","Ograve":"\u00D2","ograve":"\u00F2","ordf":"\u00AA","ordm":"\u00BA","Oslash":"\u00D8","oslash":"\u00F8","Otilde":"\u00D5","otilde":"\u00F5","Ouml":"\u00D6","ouml":"\u00F6","para":"\u00B6","plusmn":"\u00B1","pound":"\u00A3","quot":"\"","QUOT":"\"","raquo":"\u00BB","reg":"\u00AE","REG":"\u00AE","sect":"\u00A7","shy":"\u00AD","sup1":"\u00B9","sup2":"\u00B2","sup3":"\u00B3","szlig":"\u00DF","THORN":"\u00DE","thorn":"\u00FE","times":"\u00D7","Uacute":"\u00DA","uacute":"\u00FA","Ucirc":"\u00DB","ucirc":"\u00FB","Ugrave":"\u00D9","ugrave":"\u00F9","uml":"\u00A8","Uuml":"\u00DC","uuml":"\u00FC","Yacute":"\u00DD","yacute":"\u00FD","yen":"\u00A5","yuml":"\u00FF"}
},{}],42:[function(require,module,exports){
module.exports={"amp":"&","apos":"'","gt":">","lt":"<","quot":"\""}

},{}],43:[function(require,module,exports){
// the whatwg-fetch polyfill installs the fetch() function
// on the global object (window or self)
//
// Return that as the export for use in Webpack, Browserify etc.
require('whatwg-fetch');
var globalObj = typeof self !== 'undefined' && self || this;
module.exports = globalObj.fetch.bind(globalObj);

},{"whatwg-fetch":103}],44:[function(require,module,exports){
module.exports = CollectingHandler;

function CollectingHandler(cbs){
	this._cbs = cbs || {};
	this.events = [];
}

var EVENTS = require("./").EVENTS;
Object.keys(EVENTS).forEach(function(name){
	if(EVENTS[name] === 0){
		name = "on" + name;
		CollectingHandler.prototype[name] = function(){
			this.events.push([name]);
			if(this._cbs[name]) this._cbs[name]();
		};
	} else if(EVENTS[name] === 1){
		name = "on" + name;
		CollectingHandler.prototype[name] = function(a){
			this.events.push([name, a]);
			if(this._cbs[name]) this._cbs[name](a);
		};
	} else if(EVENTS[name] === 2){
		name = "on" + name;
		CollectingHandler.prototype[name] = function(a, b){
			this.events.push([name, a, b]);
			if(this._cbs[name]) this._cbs[name](a, b);
		};
	} else {
		throw Error("wrong number of arguments");
	}
});

CollectingHandler.prototype.onreset = function(){
	this.events = [];
	if(this._cbs.onreset) this._cbs.onreset();
};

CollectingHandler.prototype.restart = function(){
	if(this._cbs.onreset) this._cbs.onreset();

	for(var i = 0, len = this.events.length; i < len; i++){
		if(this._cbs[this.events[i][0]]){

			var num = this.events[i].length;

			if(num === 1){
				this._cbs[this.events[i][0]]();
			} else if(num === 2){
				this._cbs[this.events[i][0]](this.events[i][1]);
			} else {
				this._cbs[this.events[i][0]](this.events[i][1], this.events[i][2]);
			}
		}
	}
};

},{"./":51}],45:[function(require,module,exports){
var index = require("./index.js"),
    DomHandler = index.DomHandler,
	DomUtils = index.DomUtils;

//TODO: make this a streamable handler
function FeedHandler(callback, options){
	this.init(callback, options);
}

require("util").inherits(FeedHandler, DomHandler);

FeedHandler.prototype.init = DomHandler;

function getElements(what, where){
	return DomUtils.getElementsByTagName(what, where, true);
}
function getOneElement(what, where){
	return DomUtils.getElementsByTagName(what, where, true, 1)[0];
}
function fetch(what, where, recurse){
	return DomUtils.getText(
		DomUtils.getElementsByTagName(what, where, recurse, 1)
	).trim();
}

function addConditionally(obj, prop, what, where, recurse){
	var tmp = fetch(what, where, recurse);
	if(tmp) obj[prop] = tmp;
}

var isValidFeed = function(value) {
	return value === "rss" || value === "feed" || value === "rdf:RDF";
};

FeedHandler.prototype.onend = function() {
	var feed = {},
		feedRoot = getOneElement(isValidFeed, this.dom),
		tmp, childs;

	if(feedRoot){
		if(feedRoot.name === "feed"){
			childs = feedRoot.children;

			feed.type = "atom";
			addConditionally(feed, "id", "id", childs);
			addConditionally(feed, "title", "title", childs);
			if((tmp = getOneElement("link", childs)) && (tmp = tmp.attribs) && (tmp = tmp.href)) feed.link = tmp;
			addConditionally(feed, "description", "subtitle", childs);
			if((tmp = fetch("updated", childs))) feed.updated = new Date(tmp);
			addConditionally(feed, "author", "email", childs, true);

			feed.items = getElements("entry", childs).map(function(item){
				var entry = {}, tmp;

				item = item.children;

				addConditionally(entry, "id", "id", item);
				addConditionally(entry, "title", "title", item);
				if((tmp = getOneElement("link", item)) && (tmp = tmp.attribs) && (tmp = tmp.href)) entry.link = tmp;
				addConditionally(entry, "description", "summary", item);
				if((tmp = fetch("updated", item))) entry.pubDate = new Date(tmp);
				return entry;
			});
		} else {
			childs = getOneElement("channel", feedRoot.children).children;

			feed.type = feedRoot.name.substr(0, 3);
			feed.id = "";
			addConditionally(feed, "title", "title", childs);
			addConditionally(feed, "link", "link", childs);
			addConditionally(feed, "description", "description", childs);
			if((tmp = fetch("lastBuildDate", childs))) feed.updated = new Date(tmp);
			addConditionally(feed, "author", "managingEditor", childs, true);

			feed.items = getElements("item", feedRoot.children).map(function(item){
				var entry = {}, tmp;

				item = item.children;

				addConditionally(entry, "id", "guid", item);
				addConditionally(entry, "title", "title", item);
				addConditionally(entry, "link", "link", item);
				addConditionally(entry, "description", "description", item);
				if((tmp = fetch("pubDate", item))) entry.pubDate = new Date(tmp);
				return entry;
			});
		}
	}
	this.dom = feed;
	DomHandler.prototype._handleCallback.call(
		this, feedRoot ? null : Error("couldn't find root of feed")
	);
};

module.exports = FeedHandler;

},{"./index.js":51,"util":134}],46:[function(require,module,exports){
var Tokenizer = require("./Tokenizer.js");

/*
	Options:

	xmlMode: Special behavior for script/style tags (true by default)
	lowerCaseAttributeNames: call .toLowerCase for each attribute name (true if xmlMode is `false`)
	lowerCaseTags: call .toLowerCase for each tag name (true if xmlMode is `false`)
*/

/*
	Callbacks:

	oncdataend,
	oncdatastart,
	onclosetag,
	oncomment,
	oncommentend,
	onerror,
	onopentag,
	onprocessinginstruction,
	onreset,
	ontext
*/

var formTags = {
	input: true,
	option: true,
	optgroup: true,
	select: true,
	button: true,
	datalist: true,
	textarea: true
};

var openImpliesClose = {
	tr      : { tr:true, th:true, td:true },
	th      : { th:true },
	td      : { thead:true, td:true },
	body    : { head:true, link:true, script:true },
	li      : { li:true },
	p       : { p:true },
	select  : formTags,
	input   : formTags,
	output  : formTags,
	button  : formTags,
	datalist: formTags,
	textarea: formTags,
	option  : { option:true },
	optgroup: { optgroup:true }
};

var voidElements = {
	__proto__: null,
	area: true,
	base: true,
	basefont: true,
	br: true,
	col: true,
	command: true,
	embed: true,
	frame: true,
	hr: true,
	img: true,
	input: true,
	isindex: true,
	keygen: true,
	link: true,
	meta: true,
	param: true,
	source: true,
	track: true,
	wbr: true,

	//common self closing svg elements
	path: true,
	circle: true,
	ellipse: true,
	line: true,
	rect: true,
	use: true
};

var re_nameEnd = /\s|\//;

function Parser(cbs, options){
	this._options = options || {};
	this._cbs = cbs || {};

	this._tagname = "";
	this._attribname = "";
	this._attribvalue = "";
	this._attribs = null;
	this._stack = [];

	this.startIndex = 0;
	this.endIndex = null;

	this._lowerCaseTagNames = "lowerCaseTags" in this._options ?
									!!this._options.lowerCaseTags :
									!this._options.xmlMode;
	this._lowerCaseAttributeNames = "lowerCaseAttributeNames" in this._options ?
									!!this._options.lowerCaseAttributeNames :
									!this._options.xmlMode;

	this._tokenizer = new Tokenizer(this._options, this);
}

require("util").inherits(Parser, require("events").EventEmitter);

Parser.prototype._updatePosition = function(initialOffset){
	if(this.endIndex === null){
		if(this._tokenizer._sectionStart <= initialOffset){
			this.startIndex = 0;
		} else {
			this.startIndex = this._tokenizer._sectionStart - initialOffset;
		}
	}
	else this.startIndex = this.endIndex + 1;
	this.endIndex = this._tokenizer._index;
};

//Tokenizer event handlers
Parser.prototype.ontext = function(data){
	this._updatePosition(1);
	this.endIndex--;

	if(this._cbs.ontext) this._cbs.ontext(data);
};

Parser.prototype.onopentagname = function(name){
	if(this._lowerCaseTagNames){
		name = name.toLowerCase();
	}

	this._tagname = name;

	if (!this._options.xmlMode && name in openImpliesClose) {
		for(
			var el;
			(el = this._stack[this._stack.length-1]) in openImpliesClose[name];
			this.onclosetag(el)
		);
	}

	if(this._options.xmlMode || !(name in voidElements)){
		this._stack.push(name);
	}

	if(this._cbs.onopentagname) this._cbs.onopentagname(name);
	if(this._cbs.onopentag) this._attribs = {};
};

Parser.prototype.onopentagend = function(){
	this._updatePosition(1);

	if(this._attribs){
		if(this._cbs.onopentag) this._cbs.onopentag(this._tagname, this._attribs);
		this._attribs = null;
	}

	if(!this._options.xmlMode && this._cbs.onclosetag && this._tagname in voidElements){
		this._cbs.onclosetag(this._tagname);
	}

	this._tagname = "";
};

Parser.prototype.onclosetag = function(name){
	this._updatePosition(1);

	if(this._lowerCaseTagNames){
		name = name.toLowerCase();
	}

	if(this._stack.length && (!(name in voidElements) || this._options.xmlMode)){
		var pos = this._stack.lastIndexOf(name);
		if(pos !== -1){
			if(this._cbs.onclosetag){
				pos = this._stack.length - pos;
				while(pos--) this._cbs.onclosetag(this._stack.pop());
			}
			else this._stack.length = pos;
		} else if(name === "p" && !this._options.xmlMode){
			this.onopentagname(name);
			this._closeCurrentTag();
		}
	} else if(!this._options.xmlMode && (name === "br" || name === "p")){
		this.onopentagname(name);
		this._closeCurrentTag();
	}
};

Parser.prototype.onselfclosingtag = function(){
	if(this._options.xmlMode || this._options.recognizeSelfClosing){
		this._closeCurrentTag();
	} else {
		this.onopentagend();
	}
};

Parser.prototype._closeCurrentTag = function(){
	var name = this._tagname;

	this.onopentagend();

	//self-closing tags will be on the top of the stack
	//(cheaper check than in onclosetag)
	if(this._stack[this._stack.length-1] === name){
		if(this._cbs.onclosetag){
			this._cbs.onclosetag(name);
		}
		this._stack.pop();
	}
};

Parser.prototype.onattribname = function(name){
	if(this._lowerCaseAttributeNames){
		name = name.toLowerCase();
	}
	this._attribname = name;
};

Parser.prototype.onattribdata = function(value){
	this._attribvalue += value;
};

Parser.prototype.onattribend = function(){
	if(this._cbs.onattribute) this._cbs.onattribute(this._attribname, this._attribvalue);
	if(
		this._attribs &&
		!Object.prototype.hasOwnProperty.call(this._attribs, this._attribname)
	){
		this._attribs[this._attribname] = this._attribvalue;
	}
	this._attribname = "";
	this._attribvalue = "";
};

Parser.prototype._getInstructionName = function(value){
	var idx = value.search(re_nameEnd),
	    name = idx < 0 ? value : value.substr(0, idx);

	if(this._lowerCaseTagNames){
		name = name.toLowerCase();
	}

	return name;
};

Parser.prototype.ondeclaration = function(value){
	if(this._cbs.onprocessinginstruction){
		var name = this._getInstructionName(value);
		this._cbs.onprocessinginstruction("!" + name, "!" + value);
	}
};

Parser.prototype.onprocessinginstruction = function(value){
	if(this._cbs.onprocessinginstruction){
		var name = this._getInstructionName(value);
		this._cbs.onprocessinginstruction("?" + name, "?" + value);
	}
};

Parser.prototype.oncomment = function(value){
	this._updatePosition(4);

	if(this._cbs.oncomment) this._cbs.oncomment(value);
	if(this._cbs.oncommentend) this._cbs.oncommentend();
};

Parser.prototype.oncdata = function(value){
	this._updatePosition(1);

	if(this._options.xmlMode || this._options.recognizeCDATA){
		if(this._cbs.oncdatastart) this._cbs.oncdatastart();
		if(this._cbs.ontext) this._cbs.ontext(value);
		if(this._cbs.oncdataend) this._cbs.oncdataend();
	} else {
		this.oncomment("[CDATA[" + value + "]]");
	}
};

Parser.prototype.onerror = function(err){
	if(this._cbs.onerror) this._cbs.onerror(err);
};

Parser.prototype.onend = function(){
	if(this._cbs.onclosetag){
		for(
			var i = this._stack.length;
			i > 0;
			this._cbs.onclosetag(this._stack[--i])
		);
	}
	if(this._cbs.onend) this._cbs.onend();
};


//Resets the parser to a blank state, ready to parse a new HTML document
Parser.prototype.reset = function(){
	if(this._cbs.onreset) this._cbs.onreset();
	this._tokenizer.reset();

	this._tagname = "";
	this._attribname = "";
	this._attribs = null;
	this._stack = [];
};

//Parses a complete HTML document and pushes it to the handler
Parser.prototype.parseComplete = function(data){
	this.reset();
	this.end(data);
};

Parser.prototype.write = function(chunk){
	this._tokenizer.write(chunk);
};

Parser.prototype.end = function(chunk){
	this._tokenizer.end(chunk);
};

Parser.prototype.pause = function(){
	this._tokenizer.pause();
};

Parser.prototype.resume = function(){
	this._tokenizer.resume();
};

//alias for backwards compat
Parser.prototype.parseChunk = Parser.prototype.write;
Parser.prototype.done = Parser.prototype.end;

module.exports = Parser;

},{"./Tokenizer.js":49,"events":110,"util":134}],47:[function(require,module,exports){
module.exports = ProxyHandler;

function ProxyHandler(cbs){
	this._cbs = cbs || {};
}

var EVENTS = require("./").EVENTS;
Object.keys(EVENTS).forEach(function(name){
	if(EVENTS[name] === 0){
		name = "on" + name;
		ProxyHandler.prototype[name] = function(){
			if(this._cbs[name]) this._cbs[name]();
		};
	} else if(EVENTS[name] === 1){
		name = "on" + name;
		ProxyHandler.prototype[name] = function(a){
			if(this._cbs[name]) this._cbs[name](a);
		};
	} else if(EVENTS[name] === 2){
		name = "on" + name;
		ProxyHandler.prototype[name] = function(a, b){
			if(this._cbs[name]) this._cbs[name](a, b);
		};
	} else {
		throw Error("wrong number of arguments");
	}
});
},{"./":51}],48:[function(require,module,exports){
module.exports = Stream;

var Parser = require("./WritableStream.js");

function Stream(options){
	Parser.call(this, new Cbs(this), options);
}

require("util").inherits(Stream, Parser);

Stream.prototype.readable = true;

function Cbs(scope){
	this.scope = scope;
}

var EVENTS = require("../").EVENTS;

Object.keys(EVENTS).forEach(function(name){
	if(EVENTS[name] === 0){
		Cbs.prototype["on" + name] = function(){
			this.scope.emit(name);
		};
	} else if(EVENTS[name] === 1){
		Cbs.prototype["on" + name] = function(a){
			this.scope.emit(name, a);
		};
	} else if(EVENTS[name] === 2){
		Cbs.prototype["on" + name] = function(a, b){
			this.scope.emit(name, a, b);
		};
	} else {
		throw Error("wrong number of arguments!");
	}
});
},{"../":51,"./WritableStream.js":50,"util":134}],49:[function(require,module,exports){
module.exports = Tokenizer;

var decodeCodePoint = require("entities/lib/decode_codepoint.js"),
    entityMap = require("entities/maps/entities.json"),
    legacyMap = require("entities/maps/legacy.json"),
    xmlMap    = require("entities/maps/xml.json"),

    i = 0,

    TEXT                      = i++,
    BEFORE_TAG_NAME           = i++, //after <
    IN_TAG_NAME               = i++,
    IN_SELF_CLOSING_TAG       = i++,
    BEFORE_CLOSING_TAG_NAME   = i++,
    IN_CLOSING_TAG_NAME       = i++,
    AFTER_CLOSING_TAG_NAME    = i++,

    //attributes
    BEFORE_ATTRIBUTE_NAME     = i++,
    IN_ATTRIBUTE_NAME         = i++,
    AFTER_ATTRIBUTE_NAME      = i++,
    BEFORE_ATTRIBUTE_VALUE    = i++,
    IN_ATTRIBUTE_VALUE_DQ     = i++, // "
    IN_ATTRIBUTE_VALUE_SQ     = i++, // '
    IN_ATTRIBUTE_VALUE_NQ     = i++,

    //declarations
    BEFORE_DECLARATION        = i++, // !
    IN_DECLARATION            = i++,

    //processing instructions
    IN_PROCESSING_INSTRUCTION = i++, // ?

    //comments
    BEFORE_COMMENT            = i++,
    IN_COMMENT                = i++,
    AFTER_COMMENT_1           = i++,
    AFTER_COMMENT_2           = i++,

    //cdata
    BEFORE_CDATA_1            = i++, // [
    BEFORE_CDATA_2            = i++, // C
    BEFORE_CDATA_3            = i++, // D
    BEFORE_CDATA_4            = i++, // A
    BEFORE_CDATA_5            = i++, // T
    BEFORE_CDATA_6            = i++, // A
    IN_CDATA                  = i++, // [
    AFTER_CDATA_1             = i++, // ]
    AFTER_CDATA_2             = i++, // ]

    //special tags
    BEFORE_SPECIAL            = i++, //S
    BEFORE_SPECIAL_END        = i++,   //S

    BEFORE_SCRIPT_1           = i++, //C
    BEFORE_SCRIPT_2           = i++, //R
    BEFORE_SCRIPT_3           = i++, //I
    BEFORE_SCRIPT_4           = i++, //P
    BEFORE_SCRIPT_5           = i++, //T
    AFTER_SCRIPT_1            = i++, //C
    AFTER_SCRIPT_2            = i++, //R
    AFTER_SCRIPT_3            = i++, //I
    AFTER_SCRIPT_4            = i++, //P
    AFTER_SCRIPT_5            = i++, //T

    BEFORE_STYLE_1            = i++, //T
    BEFORE_STYLE_2            = i++, //Y
    BEFORE_STYLE_3            = i++, //L
    BEFORE_STYLE_4            = i++, //E
    AFTER_STYLE_1             = i++, //T
    AFTER_STYLE_2             = i++, //Y
    AFTER_STYLE_3             = i++, //L
    AFTER_STYLE_4             = i++, //E

    BEFORE_ENTITY             = i++, //&
    BEFORE_NUMERIC_ENTITY     = i++, //#
    IN_NAMED_ENTITY           = i++,
    IN_NUMERIC_ENTITY         = i++,
    IN_HEX_ENTITY             = i++, //X

    j = 0,

    SPECIAL_NONE              = j++,
    SPECIAL_SCRIPT            = j++,
    SPECIAL_STYLE             = j++;

function whitespace(c){
	return c === " " || c === "\n" || c === "\t" || c === "\f" || c === "\r";
}

function characterState(char, SUCCESS){
	return function(c){
		if(c === char) this._state = SUCCESS;
	};
}

function ifElseState(upper, SUCCESS, FAILURE){
	var lower = upper.toLowerCase();

	if(upper === lower){
		return function(c){
			if(c === lower){
				this._state = SUCCESS;
			} else {
				this._state = FAILURE;
				this._index--;
			}
		};
	} else {
		return function(c){
			if(c === lower || c === upper){
				this._state = SUCCESS;
			} else {
				this._state = FAILURE;
				this._index--;
			}
		};
	}
}

function consumeSpecialNameChar(upper, NEXT_STATE){
	var lower = upper.toLowerCase();

	return function(c){
		if(c === lower || c === upper){
			this._state = NEXT_STATE;
		} else {
			this._state = IN_TAG_NAME;
			this._index--; //consume the token again
		}
	};
}

function Tokenizer(options, cbs){
	this._state = TEXT;
	this._buffer = "";
	this._sectionStart = 0;
	this._index = 0;
	this._baseState = TEXT;
	this._special = SPECIAL_NONE;
	this._cbs = cbs;
	this._running = true;
	this._ended = false;
	this._xmlMode = !!(options && options.xmlMode);
	this._decodeEntities = !!(options && options.decodeEntities);
}

Tokenizer.prototype._stateText = function(c){
	if(c === "<"){
		if(this._index > this._sectionStart){
			this._cbs.ontext(this._getSection());
		}
		this._state = BEFORE_TAG_NAME;
		this._sectionStart = this._index;
	} else if(this._decodeEntities && this._special === SPECIAL_NONE && c === "&"){
		if(this._index > this._sectionStart){
			this._cbs.ontext(this._getSection());
		}
		this._baseState = TEXT;
		this._state = BEFORE_ENTITY;
		this._sectionStart = this._index;
	}
};

Tokenizer.prototype._stateBeforeTagName = function(c){
	if(c === "/"){
		this._state = BEFORE_CLOSING_TAG_NAME;
	} else if(c === ">" || this._special !== SPECIAL_NONE || whitespace(c)) {
		this._state = TEXT;
	} else if(c === "!"){
		this._state = BEFORE_DECLARATION;
		this._sectionStart = this._index + 1;
	} else if(c === "?"){
		this._state = IN_PROCESSING_INSTRUCTION;
		this._sectionStart = this._index + 1;
	} else if(c === "<"){
		this._cbs.ontext(this._getSection());
		this._sectionStart = this._index;
	} else {
		this._state = (!this._xmlMode && (c === "s" || c === "S")) ?
						BEFORE_SPECIAL : IN_TAG_NAME;
		this._sectionStart = this._index;
	}
};

Tokenizer.prototype._stateInTagName = function(c){
	if(c === "/" || c === ">" || whitespace(c)){
		this._emitToken("onopentagname");
		this._state = BEFORE_ATTRIBUTE_NAME;
		this._index--;
	}
};

Tokenizer.prototype._stateBeforeCloseingTagName = function(c){
	if(whitespace(c));
	else if(c === ">"){
		this._state = TEXT;
	} else if(this._special !== SPECIAL_NONE){
		if(c === "s" || c === "S"){
			this._state = BEFORE_SPECIAL_END;
		} else {
			this._state = TEXT;
			this._index--;
		}
	} else {
		this._state = IN_CLOSING_TAG_NAME;
		this._sectionStart = this._index;
	}
};

Tokenizer.prototype._stateInCloseingTagName = function(c){
	if(c === ">" || whitespace(c)){
		this._emitToken("onclosetag");
		this._state = AFTER_CLOSING_TAG_NAME;
		this._index--;
	}
};

Tokenizer.prototype._stateAfterCloseingTagName = function(c){
	//skip everything until ">"
	if(c === ">"){
		this._state = TEXT;
		this._sectionStart = this._index + 1;
	}
};

Tokenizer.prototype._stateBeforeAttributeName = function(c){
	if(c === ">"){
		this._cbs.onopentagend();
		this._state = TEXT;
		this._sectionStart = this._index + 1;
	} else if(c === "/"){
		this._state = IN_SELF_CLOSING_TAG;
	} else if(!whitespace(c)){
		this._state = IN_ATTRIBUTE_NAME;
		this._sectionStart = this._index;
	}
};

Tokenizer.prototype._stateInSelfClosingTag = function(c){
	if(c === ">"){
		this._cbs.onselfclosingtag();
		this._state = TEXT;
		this._sectionStart = this._index + 1;
	} else if(!whitespace(c)){
		this._state = BEFORE_ATTRIBUTE_NAME;
		this._index--;
	}
};

Tokenizer.prototype._stateInAttributeName = function(c){
	if(c === "=" || c === "/" || c === ">" || whitespace(c)){
		this._cbs.onattribname(this._getSection());
		this._sectionStart = -1;
		this._state = AFTER_ATTRIBUTE_NAME;
		this._index--;
	}
};

Tokenizer.prototype._stateAfterAttributeName = function(c){
	if(c === "="){
		this._state = BEFORE_ATTRIBUTE_VALUE;
	} else if(c === "/" || c === ">"){
		this._cbs.onattribend();
		this._state = BEFORE_ATTRIBUTE_NAME;
		this._index--;
	} else if(!whitespace(c)){
		this._cbs.onattribend();
		this._state = IN_ATTRIBUTE_NAME;
		this._sectionStart = this._index;
	}
};

Tokenizer.prototype._stateBeforeAttributeValue = function(c){
	if(c === "\""){
		this._state = IN_ATTRIBUTE_VALUE_DQ;
		this._sectionStart = this._index + 1;
	} else if(c === "'"){
		this._state = IN_ATTRIBUTE_VALUE_SQ;
		this._sectionStart = this._index + 1;
	} else if(!whitespace(c)){
		this._state = IN_ATTRIBUTE_VALUE_NQ;
		this._sectionStart = this._index;
		this._index--; //reconsume token
	}
};

Tokenizer.prototype._stateInAttributeValueDoubleQuotes = function(c){
	if(c === "\""){
		this._emitToken("onattribdata");
		this._cbs.onattribend();
		this._state = BEFORE_ATTRIBUTE_NAME;
	} else if(this._decodeEntities && c === "&"){
		this._emitToken("onattribdata");
		this._baseState = this._state;
		this._state = BEFORE_ENTITY;
		this._sectionStart = this._index;
	}
};

Tokenizer.prototype._stateInAttributeValueSingleQuotes = function(c){
	if(c === "'"){
		this._emitToken("onattribdata");
		this._cbs.onattribend();
		this._state = BEFORE_ATTRIBUTE_NAME;
	} else if(this._decodeEntities && c === "&"){
		this._emitToken("onattribdata");
		this._baseState = this._state;
		this._state = BEFORE_ENTITY;
		this._sectionStart = this._index;
	}
};

Tokenizer.prototype._stateInAttributeValueNoQuotes = function(c){
	if(whitespace(c) || c === ">"){
		this._emitToken("onattribdata");
		this._cbs.onattribend();
		this._state = BEFORE_ATTRIBUTE_NAME;
		this._index--;
	} else if(this._decodeEntities && c === "&"){
		this._emitToken("onattribdata");
		this._baseState = this._state;
		this._state = BEFORE_ENTITY;
		this._sectionStart = this._index;
	}
};

Tokenizer.prototype._stateBeforeDeclaration = function(c){
	this._state = c === "[" ? BEFORE_CDATA_1 :
					c === "-" ? BEFORE_COMMENT :
						IN_DECLARATION;
};

Tokenizer.prototype._stateInDeclaration = function(c){
	if(c === ">"){
		this._cbs.ondeclaration(this._getSection());
		this._state = TEXT;
		this._sectionStart = this._index + 1;
	}
};

Tokenizer.prototype._stateInProcessingInstruction = function(c){
	if(c === ">"){
		this._cbs.onprocessinginstruction(this._getSection());
		this._state = TEXT;
		this._sectionStart = this._index + 1;
	}
};

Tokenizer.prototype._stateBeforeComment = function(c){
	if(c === "-"){
		this._state = IN_COMMENT;
		this._sectionStart = this._index + 1;
	} else {
		this._state = IN_DECLARATION;
	}
};

Tokenizer.prototype._stateInComment = function(c){
	if(c === "-") this._state = AFTER_COMMENT_1;
};

Tokenizer.prototype._stateAfterComment1 = function(c){
	if(c === "-"){
		this._state = AFTER_COMMENT_2;
	} else {
		this._state = IN_COMMENT;
	}
};

Tokenizer.prototype._stateAfterComment2 = function(c){
	if(c === ">"){
		//remove 2 trailing chars
		this._cbs.oncomment(this._buffer.substring(this._sectionStart, this._index - 2));
		this._state = TEXT;
		this._sectionStart = this._index + 1;
	} else if(c !== "-"){
		this._state = IN_COMMENT;
	}
	// else: stay in AFTER_COMMENT_2 (`--->`)
};

Tokenizer.prototype._stateBeforeCdata1 = ifElseState("C", BEFORE_CDATA_2, IN_DECLARATION);
Tokenizer.prototype._stateBeforeCdata2 = ifElseState("D", BEFORE_CDATA_3, IN_DECLARATION);
Tokenizer.prototype._stateBeforeCdata3 = ifElseState("A", BEFORE_CDATA_4, IN_DECLARATION);
Tokenizer.prototype._stateBeforeCdata4 = ifElseState("T", BEFORE_CDATA_5, IN_DECLARATION);
Tokenizer.prototype._stateBeforeCdata5 = ifElseState("A", BEFORE_CDATA_6, IN_DECLARATION);

Tokenizer.prototype._stateBeforeCdata6 = function(c){
	if(c === "["){
		this._state = IN_CDATA;
		this._sectionStart = this._index + 1;
	} else {
		this._state = IN_DECLARATION;
		this._index--;
	}
};

Tokenizer.prototype._stateInCdata = function(c){
	if(c === "]") this._state = AFTER_CDATA_1;
};

Tokenizer.prototype._stateAfterCdata1 = characterState("]", AFTER_CDATA_2);

Tokenizer.prototype._stateAfterCdata2 = function(c){
	if(c === ">"){
		//remove 2 trailing chars
		this._cbs.oncdata(this._buffer.substring(this._sectionStart, this._index - 2));
		this._state = TEXT;
		this._sectionStart = this._index + 1;
	} else if (c !== "]") {
		this._state = IN_CDATA;
	}
	//else: stay in AFTER_CDATA_2 (`]]]>`)
};

Tokenizer.prototype._stateBeforeSpecial = function(c){
	if(c === "c" || c === "C"){
		this._state = BEFORE_SCRIPT_1;
	} else if(c === "t" || c === "T"){
		this._state = BEFORE_STYLE_1;
	} else {
		this._state = IN_TAG_NAME;
		this._index--; //consume the token again
	}
};

Tokenizer.prototype._stateBeforeSpecialEnd = function(c){
	if(this._special === SPECIAL_SCRIPT && (c === "c" || c === "C")){
		this._state = AFTER_SCRIPT_1;
	} else if(this._special === SPECIAL_STYLE && (c === "t" || c === "T")){
		this._state = AFTER_STYLE_1;
	}
	else this._state = TEXT;
};

Tokenizer.prototype._stateBeforeScript1 = consumeSpecialNameChar("R", BEFORE_SCRIPT_2);
Tokenizer.prototype._stateBeforeScript2 = consumeSpecialNameChar("I", BEFORE_SCRIPT_3);
Tokenizer.prototype._stateBeforeScript3 = consumeSpecialNameChar("P", BEFORE_SCRIPT_4);
Tokenizer.prototype._stateBeforeScript4 = consumeSpecialNameChar("T", BEFORE_SCRIPT_5);

Tokenizer.prototype._stateBeforeScript5 = function(c){
	if(c === "/" || c === ">" || whitespace(c)){
		this._special = SPECIAL_SCRIPT;
	}
	this._state = IN_TAG_NAME;
	this._index--; //consume the token again
};

Tokenizer.prototype._stateAfterScript1 = ifElseState("R", AFTER_SCRIPT_2, TEXT);
Tokenizer.prototype._stateAfterScript2 = ifElseState("I", AFTER_SCRIPT_3, TEXT);
Tokenizer.prototype._stateAfterScript3 = ifElseState("P", AFTER_SCRIPT_4, TEXT);
Tokenizer.prototype._stateAfterScript4 = ifElseState("T", AFTER_SCRIPT_5, TEXT);

Tokenizer.prototype._stateAfterScript5 = function(c){
	if(c === ">" || whitespace(c)){
		this._special = SPECIAL_NONE;
		this._state = IN_CLOSING_TAG_NAME;
		this._sectionStart = this._index - 6;
		this._index--; //reconsume the token
	}
	else this._state = TEXT;
};

Tokenizer.prototype._stateBeforeStyle1 = consumeSpecialNameChar("Y", BEFORE_STYLE_2);
Tokenizer.prototype._stateBeforeStyle2 = consumeSpecialNameChar("L", BEFORE_STYLE_3);
Tokenizer.prototype._stateBeforeStyle3 = consumeSpecialNameChar("E", BEFORE_STYLE_4);

Tokenizer.prototype._stateBeforeStyle4 = function(c){
	if(c === "/" || c === ">" || whitespace(c)){
		this._special = SPECIAL_STYLE;
	}
	this._state = IN_TAG_NAME;
	this._index--; //consume the token again
};

Tokenizer.prototype._stateAfterStyle1 = ifElseState("Y", AFTER_STYLE_2, TEXT);
Tokenizer.prototype._stateAfterStyle2 = ifElseState("L", AFTER_STYLE_3, TEXT);
Tokenizer.prototype._stateAfterStyle3 = ifElseState("E", AFTER_STYLE_4, TEXT);

Tokenizer.prototype._stateAfterStyle4 = function(c){
	if(c === ">" || whitespace(c)){
		this._special = SPECIAL_NONE;
		this._state = IN_CLOSING_TAG_NAME;
		this._sectionStart = this._index - 5;
		this._index--; //reconsume the token
	}
	else this._state = TEXT;
};

Tokenizer.prototype._stateBeforeEntity = ifElseState("#", BEFORE_NUMERIC_ENTITY, IN_NAMED_ENTITY);
Tokenizer.prototype._stateBeforeNumericEntity = ifElseState("X", IN_HEX_ENTITY, IN_NUMERIC_ENTITY);

//for entities terminated with a semicolon
Tokenizer.prototype._parseNamedEntityStrict = function(){
	//offset = 1
	if(this._sectionStart + 1 < this._index){
		var entity = this._buffer.substring(this._sectionStart + 1, this._index),
		    map = this._xmlMode ? xmlMap : entityMap;

		if(map.hasOwnProperty(entity)){
			this._emitPartial(map[entity]);
			this._sectionStart = this._index + 1;
		}
	}
};


//parses legacy entities (without trailing semicolon)
Tokenizer.prototype._parseLegacyEntity = function(){
	var start = this._sectionStart + 1,
	    limit = this._index - start;

	if(limit > 6) limit = 6; //the max length of legacy entities is 6

	while(limit >= 2){ //the min length of legacy entities is 2
		var entity = this._buffer.substr(start, limit);

		if(legacyMap.hasOwnProperty(entity)){
			this._emitPartial(legacyMap[entity]);
			this._sectionStart += limit + 1;
			return;
		} else {
			limit--;
		}
	}
};

Tokenizer.prototype._stateInNamedEntity = function(c){
	if(c === ";"){
		this._parseNamedEntityStrict();
		if(this._sectionStart + 1 < this._index && !this._xmlMode){
			this._parseLegacyEntity();
		}
		this._state = this._baseState;
	} else if((c < "a" || c > "z") && (c < "A" || c > "Z") && (c < "0" || c > "9")){
		if(this._xmlMode);
		else if(this._sectionStart + 1 === this._index);
		else if(this._baseState !== TEXT){
			if(c !== "="){
				this._parseNamedEntityStrict();
			}
		} else {
			this._parseLegacyEntity();
		}

		this._state = this._baseState;
		this._index--;
	}
};

Tokenizer.prototype._decodeNumericEntity = function(offset, base){
	var sectionStart = this._sectionStart + offset;

	if(sectionStart !== this._index){
		//parse entity
		var entity = this._buffer.substring(sectionStart, this._index);
		var parsed = parseInt(entity, base);

		this._emitPartial(decodeCodePoint(parsed));
		this._sectionStart = this._index;
	} else {
		this._sectionStart--;
	}

	this._state = this._baseState;
};

Tokenizer.prototype._stateInNumericEntity = function(c){
	if(c === ";"){
		this._decodeNumericEntity(2, 10);
		this._sectionStart++;
	} else if(c < "0" || c > "9"){
		if(!this._xmlMode){
			this._decodeNumericEntity(2, 10);
		} else {
			this._state = this._baseState;
		}
		this._index--;
	}
};

Tokenizer.prototype._stateInHexEntity = function(c){
	if(c === ";"){
		this._decodeNumericEntity(3, 16);
		this._sectionStart++;
	} else if((c < "a" || c > "f") && (c < "A" || c > "F") && (c < "0" || c > "9")){
		if(!this._xmlMode){
			this._decodeNumericEntity(3, 16);
		} else {
			this._state = this._baseState;
		}
		this._index--;
	}
};

Tokenizer.prototype._cleanup = function () {
	if(this._sectionStart < 0){
		this._buffer = "";
		this._index = 0;
	} else if(this._running){
		if(this._state === TEXT){
			if(this._sectionStart !== this._index){
				this._cbs.ontext(this._buffer.substr(this._sectionStart));
			}
			this._buffer = "";
			this._index = 0;
		} else if(this._sectionStart === this._index){
			//the section just started
			this._buffer = "";
			this._index = 0;
		} else {
			//remove everything unnecessary
			this._buffer = this._buffer.substr(this._sectionStart);
			this._index -= this._sectionStart;
		}

		this._sectionStart = 0;
	}
};

//TODO make events conditional
Tokenizer.prototype.write = function(chunk){
	if(this._ended) this._cbs.onerror(Error(".write() after done!"));

	this._buffer += chunk;
	this._parse();
};

Tokenizer.prototype._parse = function(){
	while(this._index < this._buffer.length && this._running){
		var c = this._buffer.charAt(this._index);
		if(this._state === TEXT) {
			this._stateText(c);
		} else if(this._state === BEFORE_TAG_NAME){
			this._stateBeforeTagName(c);
		} else if(this._state === IN_TAG_NAME) {
			this._stateInTagName(c);
		} else if(this._state === BEFORE_CLOSING_TAG_NAME){
			this._stateBeforeCloseingTagName(c);
		} else if(this._state === IN_CLOSING_TAG_NAME){
			this._stateInCloseingTagName(c);
		} else if(this._state === AFTER_CLOSING_TAG_NAME){
			this._stateAfterCloseingTagName(c);
		} else if(this._state === IN_SELF_CLOSING_TAG){
			this._stateInSelfClosingTag(c);
		}

		/*
		*	attributes
		*/
		else if(this._state === BEFORE_ATTRIBUTE_NAME){
			this._stateBeforeAttributeName(c);
		} else if(this._state === IN_ATTRIBUTE_NAME){
			this._stateInAttributeName(c);
		} else if(this._state === AFTER_ATTRIBUTE_NAME){
			this._stateAfterAttributeName(c);
		} else if(this._state === BEFORE_ATTRIBUTE_VALUE){
			this._stateBeforeAttributeValue(c);
		} else if(this._state === IN_ATTRIBUTE_VALUE_DQ){
			this._stateInAttributeValueDoubleQuotes(c);
		} else if(this._state === IN_ATTRIBUTE_VALUE_SQ){
			this._stateInAttributeValueSingleQuotes(c);
		} else if(this._state === IN_ATTRIBUTE_VALUE_NQ){
			this._stateInAttributeValueNoQuotes(c);
		}

		/*
		*	declarations
		*/
		else if(this._state === BEFORE_DECLARATION){
			this._stateBeforeDeclaration(c);
		} else if(this._state === IN_DECLARATION){
			this._stateInDeclaration(c);
		}

		/*
		*	processing instructions
		*/
		else if(this._state === IN_PROCESSING_INSTRUCTION){
			this._stateInProcessingInstruction(c);
		}

		/*
		*	comments
		*/
		else if(this._state === BEFORE_COMMENT){
			this._stateBeforeComment(c);
		} else if(this._state === IN_COMMENT){
			this._stateInComment(c);
		} else if(this._state === AFTER_COMMENT_1){
			this._stateAfterComment1(c);
		} else if(this._state === AFTER_COMMENT_2){
			this._stateAfterComment2(c);
		}

		/*
		*	cdata
		*/
		else if(this._state === BEFORE_CDATA_1){
			this._stateBeforeCdata1(c);
		} else if(this._state === BEFORE_CDATA_2){
			this._stateBeforeCdata2(c);
		} else if(this._state === BEFORE_CDATA_3){
			this._stateBeforeCdata3(c);
		} else if(this._state === BEFORE_CDATA_4){
			this._stateBeforeCdata4(c);
		} else if(this._state === BEFORE_CDATA_5){
			this._stateBeforeCdata5(c);
		} else if(this._state === BEFORE_CDATA_6){
			this._stateBeforeCdata6(c);
		} else if(this._state === IN_CDATA){
			this._stateInCdata(c);
		} else if(this._state === AFTER_CDATA_1){
			this._stateAfterCdata1(c);
		} else if(this._state === AFTER_CDATA_2){
			this._stateAfterCdata2(c);
		}

		/*
		* special tags
		*/
		else if(this._state === BEFORE_SPECIAL){
			this._stateBeforeSpecial(c);
		} else if(this._state === BEFORE_SPECIAL_END){
			this._stateBeforeSpecialEnd(c);
		}

		/*
		* script
		*/
		else if(this._state === BEFORE_SCRIPT_1){
			this._stateBeforeScript1(c);
		} else if(this._state === BEFORE_SCRIPT_2){
			this._stateBeforeScript2(c);
		} else if(this._state === BEFORE_SCRIPT_3){
			this._stateBeforeScript3(c);
		} else if(this._state === BEFORE_SCRIPT_4){
			this._stateBeforeScript4(c);
		} else if(this._state === BEFORE_SCRIPT_5){
			this._stateBeforeScript5(c);
		}

		else if(this._state === AFTER_SCRIPT_1){
			this._stateAfterScript1(c);
		} else if(this._state === AFTER_SCRIPT_2){
			this._stateAfterScript2(c);
		} else if(this._state === AFTER_SCRIPT_3){
			this._stateAfterScript3(c);
		} else if(this._state === AFTER_SCRIPT_4){
			this._stateAfterScript4(c);
		} else if(this._state === AFTER_SCRIPT_5){
			this._stateAfterScript5(c);
		}

		/*
		* style
		*/
		else if(this._state === BEFORE_STYLE_1){
			this._stateBeforeStyle1(c);
		} else if(this._state === BEFORE_STYLE_2){
			this._stateBeforeStyle2(c);
		} else if(this._state === BEFORE_STYLE_3){
			this._stateBeforeStyle3(c);
		} else if(this._state === BEFORE_STYLE_4){
			this._stateBeforeStyle4(c);
		}

		else if(this._state === AFTER_STYLE_1){
			this._stateAfterStyle1(c);
		} else if(this._state === AFTER_STYLE_2){
			this._stateAfterStyle2(c);
		} else if(this._state === AFTER_STYLE_3){
			this._stateAfterStyle3(c);
		} else if(this._state === AFTER_STYLE_4){
			this._stateAfterStyle4(c);
		}

		/*
		* entities
		*/
		else if(this._state === BEFORE_ENTITY){
			this._stateBeforeEntity(c);
		} else if(this._state === BEFORE_NUMERIC_ENTITY){
			this._stateBeforeNumericEntity(c);
		} else if(this._state === IN_NAMED_ENTITY){
			this._stateInNamedEntity(c);
		} else if(this._state === IN_NUMERIC_ENTITY){
			this._stateInNumericEntity(c);
		} else if(this._state === IN_HEX_ENTITY){
			this._stateInHexEntity(c);
		}

		else {
			this._cbs.onerror(Error("unknown _state"), this._state);
		}

		this._index++;
	}

	this._cleanup();
};

Tokenizer.prototype.pause = function(){
	this._running = false;
};
Tokenizer.prototype.resume = function(){
	this._running = true;

	if(this._index < this._buffer.length){
		this._parse();
	}
	if(this._ended){
		this._finish();
	}
};

Tokenizer.prototype.end = function(chunk){
	if(this._ended) this._cbs.onerror(Error(".end() after done!"));
	if(chunk) this.write(chunk);

	this._ended = true;

	if(this._running) this._finish();
};

Tokenizer.prototype._finish = function(){
	//if there is remaining data, emit it in a reasonable way
	if(this._sectionStart < this._index){
		this._handleTrailingData();
	}

	this._cbs.onend();
};

Tokenizer.prototype._handleTrailingData = function(){
	var data = this._buffer.substr(this._sectionStart);

	if(this._state === IN_CDATA || this._state === AFTER_CDATA_1 || this._state === AFTER_CDATA_2){
		this._cbs.oncdata(data);
	} else if(this._state === IN_COMMENT || this._state === AFTER_COMMENT_1 || this._state === AFTER_COMMENT_2){
		this._cbs.oncomment(data);
	} else if(this._state === IN_NAMED_ENTITY && !this._xmlMode){
		this._parseLegacyEntity();
		if(this._sectionStart < this._index){
			this._state = this._baseState;
			this._handleTrailingData();
		}
	} else if(this._state === IN_NUMERIC_ENTITY && !this._xmlMode){
		this._decodeNumericEntity(2, 10);
		if(this._sectionStart < this._index){
			this._state = this._baseState;
			this._handleTrailingData();
		}
	} else if(this._state === IN_HEX_ENTITY && !this._xmlMode){
		this._decodeNumericEntity(3, 16);
		if(this._sectionStart < this._index){
			this._state = this._baseState;
			this._handleTrailingData();
		}
	} else if(
		this._state !== IN_TAG_NAME &&
		this._state !== BEFORE_ATTRIBUTE_NAME &&
		this._state !== BEFORE_ATTRIBUTE_VALUE &&
		this._state !== AFTER_ATTRIBUTE_NAME &&
		this._state !== IN_ATTRIBUTE_NAME &&
		this._state !== IN_ATTRIBUTE_VALUE_SQ &&
		this._state !== IN_ATTRIBUTE_VALUE_DQ &&
		this._state !== IN_ATTRIBUTE_VALUE_NQ &&
		this._state !== IN_CLOSING_TAG_NAME
	){
		this._cbs.ontext(data);
	}
	//else, ignore remaining data
	//TODO add a way to remove current tag
};

Tokenizer.prototype.reset = function(){
	Tokenizer.call(this, {xmlMode: this._xmlMode, decodeEntities: this._decodeEntities}, this._cbs);
};

Tokenizer.prototype._getSection = function(){
	return this._buffer.substring(this._sectionStart, this._index);
};

Tokenizer.prototype._emitToken = function(name){
	this._cbs[name](this._getSection());
	this._sectionStart = -1;
};

Tokenizer.prototype._emitPartial = function(value){
	if(this._baseState !== TEXT){
		this._cbs.onattribdata(value); //TODO implement the new event
	} else {
		this._cbs.ontext(value);
	}
};

},{"entities/lib/decode_codepoint.js":59,"entities/maps/entities.json":61,"entities/maps/legacy.json":62,"entities/maps/xml.json":63}],50:[function(require,module,exports){
module.exports = Stream;

var Parser = require("./Parser.js"),
    WritableStream = require("stream").Writable || require("readable-stream").Writable;

function Stream(cbs, options){
	var parser = this._parser = new Parser(cbs, options);

	WritableStream.call(this, {decodeStrings: false});

	this.once("finish", function(){
		parser.end();
	});
}

require("util").inherits(Stream, WritableStream);

WritableStream.prototype._write = function(chunk, encoding, cb){
	this._parser.write(chunk);
	cb();
};
},{"./Parser.js":46,"readable-stream":72,"stream":129,"util":134}],51:[function(require,module,exports){
var Parser = require("./Parser.js"),
    DomHandler = require("domhandler");

function defineProp(name, value){
	delete module.exports[name];
	module.exports[name] = value;
	return value;
}

module.exports = {
	Parser: Parser,
	Tokenizer: require("./Tokenizer.js"),
	ElementType: require("domelementtype"),
	DomHandler: DomHandler,
	get FeedHandler(){
		return defineProp("FeedHandler", require("./FeedHandler.js"));
	},
	get Stream(){
		return defineProp("Stream", require("./Stream.js"));
	},
	get WritableStream(){
		return defineProp("WritableStream", require("./WritableStream.js"));
	},
	get ProxyHandler(){
		return defineProp("ProxyHandler", require("./ProxyHandler.js"));
	},
	get DomUtils(){
		return defineProp("DomUtils", require("domutils"));
	},
	get CollectingHandler(){
		return defineProp("CollectingHandler", require("./CollectingHandler.js"));
	},
	// For legacy support
	DefaultHandler: DomHandler,
	get RssHandler(){
		return defineProp("RssHandler", this.FeedHandler);
	},
	//helper methods
	parseDOM: function(data, options) {
		var handler = new DomHandler(options);
		new Parser(handler, options).end(data);
		return handler.dom;
	},
	parseFeed: function(feed, options){
		var handler = new module.exports.FeedHandler(options);
		new Parser(handler, options).end(feed);
		return handler.dom;
	},
	createDomStream: function(cb, options, elementCb){
		var handler = new DomHandler(cb, options, elementCb);
		return new Parser(handler, options);
	},
	// List of all events that the parser emits
	EVENTS: { /* Format: eventname: number of arguments */
		attribute: 2,
		cdatastart: 0,
		cdataend: 0,
		text: 1,
		processinginstruction: 2,
		comment: 1,
		commentend: 0,
		closetag: 1,
		opentag: 2,
		opentagname: 1,
		error: 1,
		end: 0
	}
};

},{"./CollectingHandler.js":44,"./FeedHandler.js":45,"./Parser.js":46,"./ProxyHandler.js":47,"./Stream.js":48,"./Tokenizer.js":49,"./WritableStream.js":50,"domelementtype":24,"domhandler":25,"domutils":52}],52:[function(require,module,exports){
arguments[4][28][0].apply(exports,arguments)
},{"./lib/helpers":53,"./lib/legacy":54,"./lib/manipulation":55,"./lib/querying":56,"./lib/stringify":57,"./lib/traversal":58,"dup":28}],53:[function(require,module,exports){
// removeSubsets
// Given an array of nodes, remove any member that is contained by another.
exports.removeSubsets = function(nodes) {
	var idx = nodes.length, node, ancestor, replace;

	// Check if each node (or one of its ancestors) is already contained in the
	// array.
	while (--idx > -1) {
		node = ancestor = nodes[idx];

		// Temporarily remove the node under consideration
		nodes[idx] = null;
		replace = true;

		while (ancestor) {
			if (nodes.indexOf(ancestor) > -1) {
				replace = false;
				nodes.splice(idx, 1);
				break;
			}
			ancestor = ancestor.parent;
		}

		// If the node has been found to be unique, re-insert it.
		if (replace) {
			nodes[idx] = node;
		}
	}

	return nodes;
};

// Source: http://dom.spec.whatwg.org/#dom-node-comparedocumentposition
var POSITION = {
	DISCONNECTED: 1,
	PRECEDING: 2,
	FOLLOWING: 4,
	CONTAINS: 8,
	CONTAINED_BY: 16
};

// Compare the position of one node against another node in any other document.
// The return value is a bitmask with the following values:
//
// document order:
// > There is an ordering, document order, defined on all the nodes in the
// > document corresponding to the order in which the first character of the
// > XML representation of each node occurs in the XML representation of the
// > document after expansion of general entities. Thus, the document element
// > node will be the first node. Element nodes occur before their children.
// > Thus, document order orders element nodes in order of the occurrence of
// > their start-tag in the XML (after expansion of entities). The attribute
// > nodes of an element occur after the element and before its children. The
// > relative order of attribute nodes is implementation-dependent./
// Source:
// http://www.w3.org/TR/DOM-Level-3-Core/glossary.html#dt-document-order
//
// @argument {Node} nodaA The first node to use in the comparison
// @argument {Node} nodeB The second node to use in the comparison
//
// @return {Number} A bitmask describing the input nodes' relative position.
//         See http://dom.spec.whatwg.org/#dom-node-comparedocumentposition for
//         a description of these values.
var comparePos = exports.compareDocumentPosition = function(nodeA, nodeB) {
	var aParents = [];
	var bParents = [];
	var current, sharedParent, siblings, aSibling, bSibling, idx;

	if (nodeA === nodeB) {
		return 0;
	}

	current = nodeA;
	while (current) {
		aParents.unshift(current);
		current = current.parent;
	}
	current = nodeB;
	while (current) {
		bParents.unshift(current);
		current = current.parent;
	}

	idx = 0;
	while (aParents[idx] === bParents[idx]) {
		idx++;
	}

	if (idx === 0) {
		return POSITION.DISCONNECTED;
	}

	sharedParent = aParents[idx - 1];
	siblings = sharedParent.children;
	aSibling = aParents[idx];
	bSibling = bParents[idx];

	if (siblings.indexOf(aSibling) > siblings.indexOf(bSibling)) {
		if (sharedParent === nodeB) {
			return POSITION.FOLLOWING | POSITION.CONTAINED_BY;
		}
		return POSITION.FOLLOWING;
	} else {
		if (sharedParent === nodeA) {
			return POSITION.PRECEDING | POSITION.CONTAINS;
		}
		return POSITION.PRECEDING;
	}
};

// Sort an array of nodes based on their relative position in the document and
// remove any duplicate nodes. If the array contains nodes that do not belong
// to the same document, sort order is unspecified.
//
// @argument {Array} nodes Array of DOM nodes
//
// @returns {Array} collection of unique nodes, sorted in document order
exports.uniqueSort = function(nodes) {
	var idx = nodes.length, node, position;

	nodes = nodes.slice();

	while (--idx > -1) {
		node = nodes[idx];
		position = nodes.indexOf(node);
		if (position > -1 && position < idx) {
			nodes.splice(idx, 1);
		}
	}
	nodes.sort(function(a, b) {
		var relative = comparePos(a, b);
		if (relative & POSITION.PRECEDING) {
			return -1;
		} else if (relative & POSITION.FOLLOWING) {
			return 1;
		}
		return 0;
	});

	return nodes;
};

},{}],54:[function(require,module,exports){
arguments[4][30][0].apply(exports,arguments)
},{"domelementtype":24,"dup":30}],55:[function(require,module,exports){
arguments[4][31][0].apply(exports,arguments)
},{"dup":31}],56:[function(require,module,exports){
arguments[4][32][0].apply(exports,arguments)
},{"domelementtype":24,"dup":32}],57:[function(require,module,exports){
var ElementType = require("domelementtype"),
    getOuterHTML = require("dom-serializer"),
    isTag = ElementType.isTag;

module.exports = {
	getInnerHTML: getInnerHTML,
	getOuterHTML: getOuterHTML,
	getText: getText
};

function getInnerHTML(elem, opts){
	return elem.children ? elem.children.map(function(elem){
		return getOuterHTML(elem, opts);
	}).join("") : "";
}

function getText(elem){
	if(Array.isArray(elem)) return elem.map(getText).join("");
	if(isTag(elem) || elem.type === ElementType.CDATA) return getText(elem.children);
	if(elem.type === ElementType.Text) return elem.data;
	return "";
}

},{"dom-serializer":22,"domelementtype":24}],58:[function(require,module,exports){
var getChildren = exports.getChildren = function(elem){
	return elem.children;
};

var getParent = exports.getParent = function(elem){
	return elem.parent;
};

exports.getSiblings = function(elem){
	var parent = getParent(elem);
	return parent ? getChildren(parent) : [elem];
};

exports.getAttributeValue = function(elem, name){
	return elem.attribs && elem.attribs[name];
};

exports.hasAttrib = function(elem, name){
	return !!elem.attribs && hasOwnProperty.call(elem.attribs, name);
};

exports.getName = function(elem){
	return elem.name;
};

},{}],59:[function(require,module,exports){
arguments[4][37][0].apply(exports,arguments)
},{"../maps/decode.json":60,"dup":37}],60:[function(require,module,exports){
arguments[4][39][0].apply(exports,arguments)
},{"dup":39}],61:[function(require,module,exports){
arguments[4][40][0].apply(exports,arguments)
},{"dup":40}],62:[function(require,module,exports){
arguments[4][41][0].apply(exports,arguments)
},{"dup":41}],63:[function(require,module,exports){
arguments[4][42][0].apply(exports,arguments)
},{"dup":42}],64:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
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
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],65:[function(require,module,exports){
module.exports = Array.isArray || function (arr) {
  return Object.prototype.toString.call(arr) == '[object Array]';
};

},{}],66:[function(require,module,exports){
(function (global){
/**
 * @license
 * Lo-Dash 2.4.2 (Custom Build) <https://lodash.com/>
 * Build: `lodash modern -o ./dist/lodash.js`
 * Copyright 2012-2013 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.5.2 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2013 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <https://lodash.com/license>
 */
;(function() {

  /** Used as a safe reference for `undefined` in pre ES5 environments */
  var undefined;

  /** Used to pool arrays and objects used internally */
  var arrayPool = [],
      objectPool = [];

  /** Used to generate unique IDs */
  var idCounter = 0;

  /** Used to prefix keys to avoid issues with `__proto__` and properties on `Object.prototype` */
  var keyPrefix = +new Date + '';

  /** Used as the size when optimizations are enabled for large arrays */
  var largeArraySize = 75;

  /** Used as the max size of the `arrayPool` and `objectPool` */
  var maxPoolSize = 40;

  /** Used to detect and test whitespace */
  var whitespace = (
    // whitespace
    ' \t\x0B\f\xA0\ufeff' +

    // line terminators
    '\n\r\u2028\u2029' +

    // unicode category "Zs" space separators
    '\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000'
  );

  /** Used to match empty string literals in compiled template source */
  var reEmptyStringLeading = /\b__p \+= '';/g,
      reEmptyStringMiddle = /\b(__p \+=) '' \+/g,
      reEmptyStringTrailing = /(__e\(.*?\)|\b__t\)) \+\n'';/g;

  /**
   * Used to match ES6 template delimiters
   * http://people.mozilla.org/~jorendorff/es6-draft.html#sec-literals-string-literals
   */
  var reEsTemplate = /\$\{([^\\}]*(?:\\.[^\\}]*)*)\}/g;

  /** Used to match regexp flags from their coerced string values */
  var reFlags = /\w*$/;

  /** Used to detected named functions */
  var reFuncName = /^\s*function[ \n\r\t]+\w/;

  /** Used to match "interpolate" template delimiters */
  var reInterpolate = /<%=([\s\S]+?)%>/g;

  /** Used to match leading whitespace and zeros to be removed */
  var reLeadingSpacesAndZeros = RegExp('^[' + whitespace + ']*0+(?=.$)');

  /** Used to ensure capturing order of template delimiters */
  var reNoMatch = /($^)/;

  /** Used to detect functions containing a `this` reference */
  var reThis = /\bthis\b/;

  /** Used to match unescaped characters in compiled string literals */
  var reUnescapedString = /['\n\r\t\u2028\u2029\\]/g;

  /** Used to assign default `context` object properties */
  var contextProps = [
    'Array', 'Boolean', 'Date', 'Function', 'Math', 'Number', 'Object',
    'RegExp', 'String', '_', 'attachEvent', 'clearTimeout', 'isFinite', 'isNaN',
    'parseInt', 'setTimeout'
  ];

  /** Used to make template sourceURLs easier to identify */
  var templateCounter = 0;

  /** `Object#toString` result shortcuts */
  var argsClass = '[object Arguments]',
      arrayClass = '[object Array]',
      boolClass = '[object Boolean]',
      dateClass = '[object Date]',
      funcClass = '[object Function]',
      numberClass = '[object Number]',
      objectClass = '[object Object]',
      regexpClass = '[object RegExp]',
      stringClass = '[object String]';

  /** Used to identify object classifications that `_.clone` supports */
  var cloneableClasses = {};
  cloneableClasses[funcClass] = false;
  cloneableClasses[argsClass] = cloneableClasses[arrayClass] =
  cloneableClasses[boolClass] = cloneableClasses[dateClass] =
  cloneableClasses[numberClass] = cloneableClasses[objectClass] =
  cloneableClasses[regexpClass] = cloneableClasses[stringClass] = true;

  /** Used as an internal `_.debounce` options object */
  var debounceOptions = {
    'leading': false,
    'maxWait': 0,
    'trailing': false
  };

  /** Used as the property descriptor for `__bindData__` */
  var descriptor = {
    'configurable': false,
    'enumerable': false,
    'value': null,
    'writable': false
  };

  /** Used to determine if values are of the language type Object */
  var objectTypes = {
    'boolean': false,
    'function': true,
    'object': true,
    'number': false,
    'string': false,
    'undefined': false
  };

  /** Used to escape characters for inclusion in compiled string literals */
  var stringEscapes = {
    '\\': '\\',
    "'": "'",
    '\n': 'n',
    '\r': 'r',
    '\t': 't',
    '\u2028': 'u2028',
    '\u2029': 'u2029'
  };

  /** Used as a reference to the global object */
  var root = (objectTypes[typeof window] && window) || this;

  /** Detect free variable `exports` */
  var freeExports = objectTypes[typeof exports] && exports && !exports.nodeType && exports;

  /** Detect free variable `module` */
  var freeModule = objectTypes[typeof module] && module && !module.nodeType && module;

  /** Detect the popular CommonJS extension `module.exports` */
  var moduleExports = freeModule && freeModule.exports === freeExports && freeExports;

  /** Detect free variable `global` from Node.js or Browserified code and use it as `root` */
  var freeGlobal = objectTypes[typeof global] && global;
  if (freeGlobal && (freeGlobal.global === freeGlobal || freeGlobal.window === freeGlobal)) {
    root = freeGlobal;
  }

  /*--------------------------------------------------------------------------*/

  /**
   * The base implementation of `_.indexOf` without support for binary searches
   * or `fromIndex` constraints.
   *
   * @private
   * @param {Array} array The array to search.
   * @param {*} value The value to search for.
   * @param {number} [fromIndex=0] The index to search from.
   * @returns {number} Returns the index of the matched value or `-1`.
   */
  function baseIndexOf(array, value, fromIndex) {
    var index = (fromIndex || 0) - 1,
        length = array ? array.length : 0;

    while (++index < length) {
      if (array[index] === value) {
        return index;
      }
    }
    return -1;
  }

  /**
   * An implementation of `_.contains` for cache objects that mimics the return
   * signature of `_.indexOf` by returning `0` if the value is found, else `-1`.
   *
   * @private
   * @param {Object} cache The cache object to inspect.
   * @param {*} value The value to search for.
   * @returns {number} Returns `0` if `value` is found, else `-1`.
   */
  function cacheIndexOf(cache, value) {
    var type = typeof value;
    cache = cache.cache;

    if (type == 'boolean' || value == null) {
      return cache[value] ? 0 : -1;
    }
    if (type != 'number' && type != 'string') {
      type = 'object';
    }
    var key = type == 'number' ? value : keyPrefix + value;
    cache = (cache = cache[type]) && cache[key];

    return type == 'object'
      ? (cache && baseIndexOf(cache, value) > -1 ? 0 : -1)
      : (cache ? 0 : -1);
  }

  /**
   * Adds a given value to the corresponding cache object.
   *
   * @private
   * @param {*} value The value to add to the cache.
   */
  function cachePush(value) {
    var cache = this.cache,
        type = typeof value;

    if (type == 'boolean' || value == null) {
      cache[value] = true;
    } else {
      if (type != 'number' && type != 'string') {
        type = 'object';
      }
      var key = type == 'number' ? value : keyPrefix + value,
          typeCache = cache[type] || (cache[type] = {});

      if (type == 'object') {
        (typeCache[key] || (typeCache[key] = [])).push(value);
      } else {
        typeCache[key] = true;
      }
    }
  }

  /**
   * Used by `_.max` and `_.min` as the default callback when a given
   * collection is a string value.
   *
   * @private
   * @param {string} value The character to inspect.
   * @returns {number} Returns the code unit of given character.
   */
  function charAtCallback(value) {
    return value.charCodeAt(0);
  }

  /**
   * Used by `sortBy` to compare transformed `collection` elements, stable sorting
   * them in ascending order.
   *
   * @private
   * @param {Object} a The object to compare to `b`.
   * @param {Object} b The object to compare to `a`.
   * @returns {number} Returns the sort order indicator of `1` or `-1`.
   */
  function compareAscending(a, b) {
    var ac = a.criteria,
        bc = b.criteria,
        index = -1,
        length = ac.length;

    while (++index < length) {
      var value = ac[index],
          other = bc[index];

      if (value !== other) {
        if (value > other || typeof value == 'undefined') {
          return 1;
        }
        if (value < other || typeof other == 'undefined') {
          return -1;
        }
      }
    }
    // Fixes an `Array#sort` bug in the JS engine embedded in Adobe applications
    // that causes it, under certain circumstances, to return the same value for
    // `a` and `b`. See https://github.com/jashkenas/underscore/pull/1247
    //
    // This also ensures a stable sort in V8 and other engines.
    // See http://code.google.com/p/v8/issues/detail?id=90
    return a.index - b.index;
  }

  /**
   * Creates a cache object to optimize linear searches of large arrays.
   *
   * @private
   * @param {Array} [array=[]] The array to search.
   * @returns {null|Object} Returns the cache object or `null` if caching should not be used.
   */
  function createCache(array) {
    var index = -1,
        length = array.length,
        first = array[0],
        mid = array[(length / 2) | 0],
        last = array[length - 1];

    if (first && typeof first == 'object' &&
        mid && typeof mid == 'object' && last && typeof last == 'object') {
      return false;
    }
    var cache = getObject();
    cache['false'] = cache['null'] = cache['true'] = cache['undefined'] = false;

    var result = getObject();
    result.array = array;
    result.cache = cache;
    result.push = cachePush;

    while (++index < length) {
      result.push(array[index]);
    }
    return result;
  }

  /**
   * Used by `template` to escape characters for inclusion in compiled
   * string literals.
   *
   * @private
   * @param {string} match The matched character to escape.
   * @returns {string} Returns the escaped character.
   */
  function escapeStringChar(match) {
    return '\\' + stringEscapes[match];
  }

  /**
   * Gets an array from the array pool or creates a new one if the pool is empty.
   *
   * @private
   * @returns {Array} The array from the pool.
   */
  function getArray() {
    return arrayPool.pop() || [];
  }

  /**
   * Gets an object from the object pool or creates a new one if the pool is empty.
   *
   * @private
   * @returns {Object} The object from the pool.
   */
  function getObject() {
    return objectPool.pop() || {
      'array': null,
      'cache': null,
      'criteria': null,
      'false': false,
      'index': 0,
      'null': false,
      'number': null,
      'object': null,
      'push': null,
      'string': null,
      'true': false,
      'undefined': false,
      'value': null
    };
  }

  /**
   * Releases the given array back to the array pool.
   *
   * @private
   * @param {Array} [array] The array to release.
   */
  function releaseArray(array) {
    array.length = 0;
    if (arrayPool.length < maxPoolSize) {
      arrayPool.push(array);
    }
  }

  /**
   * Releases the given object back to the object pool.
   *
   * @private
   * @param {Object} [object] The object to release.
   */
  function releaseObject(object) {
    var cache = object.cache;
    if (cache) {
      releaseObject(cache);
    }
    object.array = object.cache = object.criteria = object.object = object.number = object.string = object.value = null;
    if (objectPool.length < maxPoolSize) {
      objectPool.push(object);
    }
  }

  /**
   * Slices the `collection` from the `start` index up to, but not including,
   * the `end` index.
   *
   * Note: This function is used instead of `Array#slice` to support node lists
   * in IE < 9 and to ensure dense arrays are returned.
   *
   * @private
   * @param {Array|Object|string} collection The collection to slice.
   * @param {number} start The start index.
   * @param {number} end The end index.
   * @returns {Array} Returns the new array.
   */
  function slice(array, start, end) {
    start || (start = 0);
    if (typeof end == 'undefined') {
      end = array ? array.length : 0;
    }
    var index = -1,
        length = end - start || 0,
        result = Array(length < 0 ? 0 : length);

    while (++index < length) {
      result[index] = array[start + index];
    }
    return result;
  }

  /*--------------------------------------------------------------------------*/

  /**
   * Create a new `lodash` function using the given context object.
   *
   * @static
   * @memberOf _
   * @category Utilities
   * @param {Object} [context=root] The context object.
   * @returns {Function} Returns the `lodash` function.
   */
  function runInContext(context) {
    // Avoid issues with some ES3 environments that attempt to use values, named
    // after built-in constructors like `Object`, for the creation of literals.
    // ES5 clears this up by stating that literals must use built-in constructors.
    // See http://es5.github.io/#x11.1.5.
    context = context ? _.defaults(root.Object(), context, _.pick(root, contextProps)) : root;

    /** Native constructor references */
    var Array = context.Array,
        Boolean = context.Boolean,
        Date = context.Date,
        Function = context.Function,
        Math = context.Math,
        Number = context.Number,
        Object = context.Object,
        RegExp = context.RegExp,
        String = context.String,
        TypeError = context.TypeError;

    /**
     * Used for `Array` method references.
     *
     * Normally `Array.prototype` would suffice, however, using an array literal
     * avoids issues in Narwhal.
     */
    var arrayRef = [];

    /** Used for native method references */
    var objectProto = Object.prototype;

    /** Used to restore the original `_` reference in `noConflict` */
    var oldDash = context._;

    /** Used to resolve the internal [[Class]] of values */
    var toString = objectProto.toString;

    /** Used to detect if a method is native */
    var reNative = RegExp('^' +
      String(toString)
        .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        .replace(/toString| for [^\]]+/g, '.*?') + '$'
    );

    /** Native method shortcuts */
    var ceil = Math.ceil,
        clearTimeout = context.clearTimeout,
        floor = Math.floor,
        fnToString = Function.prototype.toString,
        getPrototypeOf = isNative(getPrototypeOf = Object.getPrototypeOf) && getPrototypeOf,
        hasOwnProperty = objectProto.hasOwnProperty,
        push = arrayRef.push,
        setTimeout = context.setTimeout,
        splice = arrayRef.splice,
        unshift = arrayRef.unshift;

    /** Used to set meta data on functions */
    var defineProperty = (function() {
      // IE 8 only accepts DOM elements
      try {
        var o = {},
            func = isNative(func = Object.defineProperty) && func,
            result = func(o, o, o) && func;
      } catch(e) { }
      return result;
    }());

    /* Native method shortcuts for methods with the same name as other `lodash` methods */
    var nativeCreate = isNative(nativeCreate = Object.create) && nativeCreate,
        nativeIsArray = isNative(nativeIsArray = Array.isArray) && nativeIsArray,
        nativeIsFinite = context.isFinite,
        nativeIsNaN = context.isNaN,
        nativeKeys = isNative(nativeKeys = Object.keys) && nativeKeys,
        nativeMax = Math.max,
        nativeMin = Math.min,
        nativeParseInt = context.parseInt,
        nativeRandom = Math.random;

    /** Used to lookup a built-in constructor by [[Class]] */
    var ctorByClass = {};
    ctorByClass[arrayClass] = Array;
    ctorByClass[boolClass] = Boolean;
    ctorByClass[dateClass] = Date;
    ctorByClass[funcClass] = Function;
    ctorByClass[objectClass] = Object;
    ctorByClass[numberClass] = Number;
    ctorByClass[regexpClass] = RegExp;
    ctorByClass[stringClass] = String;

    /*--------------------------------------------------------------------------*/

    /**
     * Creates a `lodash` object which wraps the given value to enable intuitive
     * method chaining.
     *
     * In addition to Lo-Dash methods, wrappers also have the following `Array` methods:
     * `concat`, `join`, `pop`, `push`, `reverse`, `shift`, `slice`, `sort`, `splice`,
     * and `unshift`
     *
     * Chaining is supported in custom builds as long as the `value` method is
     * implicitly or explicitly included in the build.
     *
     * The chainable wrapper functions are:
     * `after`, `assign`, `bind`, `bindAll`, `bindKey`, `chain`, `compact`,
     * `compose`, `concat`, `countBy`, `create`, `createCallback`, `curry`,
     * `debounce`, `defaults`, `defer`, `delay`, `difference`, `filter`, `flatten`,
     * `forEach`, `forEachRight`, `forIn`, `forInRight`, `forOwn`, `forOwnRight`,
     * `functions`, `groupBy`, `indexBy`, `initial`, `intersection`, `invert`,
     * `invoke`, `keys`, `map`, `max`, `memoize`, `merge`, `min`, `object`, `omit`,
     * `once`, `pairs`, `partial`, `partialRight`, `pick`, `pluck`, `pull`, `push`,
     * `range`, `reject`, `remove`, `rest`, `reverse`, `shuffle`, `slice`, `sort`,
     * `sortBy`, `splice`, `tap`, `throttle`, `times`, `toArray`, `transform`,
     * `union`, `uniq`, `unshift`, `unzip`, `values`, `where`, `without`, `wrap`,
     * and `zip`
     *
     * The non-chainable wrapper functions are:
     * `clone`, `cloneDeep`, `contains`, `escape`, `every`, `find`, `findIndex`,
     * `findKey`, `findLast`, `findLastIndex`, `findLastKey`, `has`, `identity`,
     * `indexOf`, `isArguments`, `isArray`, `isBoolean`, `isDate`, `isElement`,
     * `isEmpty`, `isEqual`, `isFinite`, `isFunction`, `isNaN`, `isNull`, `isNumber`,
     * `isObject`, `isPlainObject`, `isRegExp`, `isString`, `isUndefined`, `join`,
     * `lastIndexOf`, `mixin`, `noConflict`, `parseInt`, `pop`, `random`, `reduce`,
     * `reduceRight`, `result`, `shift`, `size`, `some`, `sortedIndex`, `runInContext`,
     * `template`, `unescape`, `uniqueId`, and `value`
     *
     * The wrapper functions `first` and `last` return wrapped values when `n` is
     * provided, otherwise they return unwrapped values.
     *
     * Explicit chaining can be enabled by using the `_.chain` method.
     *
     * @name _
     * @constructor
     * @category Chaining
     * @param {*} value The value to wrap in a `lodash` instance.
     * @returns {Object} Returns a `lodash` instance.
     * @example
     *
     * var wrapped = _([1, 2, 3]);
     *
     * // returns an unwrapped value
     * wrapped.reduce(function(sum, num) {
     *   return sum + num;
     * });
     * // => 6
     *
     * // returns a wrapped value
     * var squares = wrapped.map(function(num) {
     *   return num * num;
     * });
     *
     * _.isArray(squares);
     * // => false
     *
     * _.isArray(squares.value());
     * // => true
     */
    function lodash(value) {
      // don't wrap if already wrapped, even if wrapped by a different `lodash` constructor
      return (value && typeof value == 'object' && !isArray(value) && hasOwnProperty.call(value, '__wrapped__'))
       ? value
       : new lodashWrapper(value);
    }

    /**
     * A fast path for creating `lodash` wrapper objects.
     *
     * @private
     * @param {*} value The value to wrap in a `lodash` instance.
     * @param {boolean} chainAll A flag to enable chaining for all methods
     * @returns {Object} Returns a `lodash` instance.
     */
    function lodashWrapper(value, chainAll) {
      this.__chain__ = !!chainAll;
      this.__wrapped__ = value;
    }
    // ensure `new lodashWrapper` is an instance of `lodash`
    lodashWrapper.prototype = lodash.prototype;

    /**
     * An object used to flag environments features.
     *
     * @static
     * @memberOf _
     * @type Object
     */
    var support = lodash.support = {};

    /**
     * Detect if functions can be decompiled by `Function#toString`
     * (all but PS3 and older Opera mobile browsers & avoided in Windows 8 apps).
     *
     * @memberOf _.support
     * @type boolean
     */
    support.funcDecomp = !isNative(context.WinRTError) && reThis.test(runInContext);

    /**
     * Detect if `Function#name` is supported (all but IE).
     *
     * @memberOf _.support
     * @type boolean
     */
    support.funcNames = typeof Function.name == 'string';

    /**
     * By default, the template delimiters used by Lo-Dash are similar to those in
     * embedded Ruby (ERB). Change the following template settings to use alternative
     * delimiters.
     *
     * @static
     * @memberOf _
     * @type Object
     */
    lodash.templateSettings = {

      /**
       * Used to detect `data` property values to be HTML-escaped.
       *
       * @memberOf _.templateSettings
       * @type RegExp
       */
      'escape': /<%-([\s\S]+?)%>/g,

      /**
       * Used to detect code to be evaluated.
       *
       * @memberOf _.templateSettings
       * @type RegExp
       */
      'evaluate': /<%([\s\S]+?)%>/g,

      /**
       * Used to detect `data` property values to inject.
       *
       * @memberOf _.templateSettings
       * @type RegExp
       */
      'interpolate': reInterpolate,

      /**
       * Used to reference the data object in the template text.
       *
       * @memberOf _.templateSettings
       * @type string
       */
      'variable': '',

      /**
       * Used to import variables into the compiled template.
       *
       * @memberOf _.templateSettings
       * @type Object
       */
      'imports': {

        /**
         * A reference to the `lodash` function.
         *
         * @memberOf _.templateSettings.imports
         * @type Function
         */
        '_': lodash
      }
    };

    /*--------------------------------------------------------------------------*/

    /**
     * The base implementation of `_.bind` that creates the bound function and
     * sets its meta data.
     *
     * @private
     * @param {Array} bindData The bind data array.
     * @returns {Function} Returns the new bound function.
     */
    function baseBind(bindData) {
      var func = bindData[0],
          partialArgs = bindData[2],
          thisArg = bindData[4];

      function bound() {
        // `Function#bind` spec
        // http://es5.github.io/#x15.3.4.5
        if (partialArgs) {
          // avoid `arguments` object deoptimizations by using `slice` instead
          // of `Array.prototype.slice.call` and not assigning `arguments` to a
          // variable as a ternary expression
          var args = slice(partialArgs);
          push.apply(args, arguments);
        }
        // mimic the constructor's `return` behavior
        // http://es5.github.io/#x13.2.2
        if (this instanceof bound) {
          // ensure `new bound` is an instance of `func`
          var thisBinding = baseCreate(func.prototype),
              result = func.apply(thisBinding, args || arguments);
          return isObject(result) ? result : thisBinding;
        }
        return func.apply(thisArg, args || arguments);
      }
      setBindData(bound, bindData);
      return bound;
    }

    /**
     * The base implementation of `_.clone` without argument juggling or support
     * for `thisArg` binding.
     *
     * @private
     * @param {*} value The value to clone.
     * @param {boolean} [isDeep=false] Specify a deep clone.
     * @param {Function} [callback] The function to customize cloning values.
     * @param {Array} [stackA=[]] Tracks traversed source objects.
     * @param {Array} [stackB=[]] Associates clones with source counterparts.
     * @returns {*} Returns the cloned value.
     */
    function baseClone(value, isDeep, callback, stackA, stackB) {
      if (callback) {
        var result = callback(value);
        if (typeof result != 'undefined') {
          return result;
        }
      }
      // inspect [[Class]]
      var isObj = isObject(value);
      if (isObj) {
        var className = toString.call(value);
        if (!cloneableClasses[className]) {
          return value;
        }
        var ctor = ctorByClass[className];
        switch (className) {
          case boolClass:
          case dateClass:
            return new ctor(+value);

          case numberClass:
          case stringClass:
            return new ctor(value);

          case regexpClass:
            result = ctor(value.source, reFlags.exec(value));
            result.lastIndex = value.lastIndex;
            return result;
        }
      } else {
        return value;
      }
      var isArr = isArray(value);
      if (isDeep) {
        // check for circular references and return corresponding clone
        var initedStack = !stackA;
        stackA || (stackA = getArray());
        stackB || (stackB = getArray());

        var length = stackA.length;
        while (length--) {
          if (stackA[length] == value) {
            return stackB[length];
          }
        }
        result = isArr ? ctor(value.length) : {};
      }
      else {
        result = isArr ? slice(value) : assign({}, value);
      }
      // add array properties assigned by `RegExp#exec`
      if (isArr) {
        if (hasOwnProperty.call(value, 'index')) {
          result.index = value.index;
        }
        if (hasOwnProperty.call(value, 'input')) {
          result.input = value.input;
        }
      }
      // exit for shallow clone
      if (!isDeep) {
        return result;
      }
      // add the source value to the stack of traversed objects
      // and associate it with its clone
      stackA.push(value);
      stackB.push(result);

      // recursively populate clone (susceptible to call stack limits)
      (isArr ? forEach : forOwn)(value, function(objValue, key) {
        result[key] = baseClone(objValue, isDeep, callback, stackA, stackB);
      });

      if (initedStack) {
        releaseArray(stackA);
        releaseArray(stackB);
      }
      return result;
    }

    /**
     * The base implementation of `_.create` without support for assigning
     * properties to the created object.
     *
     * @private
     * @param {Object} prototype The object to inherit from.
     * @returns {Object} Returns the new object.
     */
    function baseCreate(prototype, properties) {
      return isObject(prototype) ? nativeCreate(prototype) : {};
    }
    // fallback for browsers without `Object.create`
    if (!nativeCreate) {
      baseCreate = (function() {
        function Object() {}
        return function(prototype) {
          if (isObject(prototype)) {
            Object.prototype = prototype;
            var result = new Object;
            Object.prototype = null;
          }
          return result || context.Object();
        };
      }());
    }

    /**
     * The base implementation of `_.createCallback` without support for creating
     * "_.pluck" or "_.where" style callbacks.
     *
     * @private
     * @param {*} [func=identity] The value to convert to a callback.
     * @param {*} [thisArg] The `this` binding of the created callback.
     * @param {number} [argCount] The number of arguments the callback accepts.
     * @returns {Function} Returns a callback function.
     */
    function baseCreateCallback(func, thisArg, argCount) {
      if (typeof func != 'function') {
        return identity;
      }
      // exit early for no `thisArg` or already bound by `Function#bind`
      if (typeof thisArg == 'undefined' || !('prototype' in func)) {
        return func;
      }
      var bindData = func.__bindData__;
      if (typeof bindData == 'undefined') {
        if (support.funcNames) {
          bindData = !func.name;
        }
        bindData = bindData || !support.funcDecomp;
        if (!bindData) {
          var source = fnToString.call(func);
          if (!support.funcNames) {
            bindData = !reFuncName.test(source);
          }
          if (!bindData) {
            // checks if `func` references the `this` keyword and stores the result
            bindData = reThis.test(source);
            setBindData(func, bindData);
          }
        }
      }
      // exit early if there are no `this` references or `func` is bound
      if (bindData === false || (bindData !== true && bindData[1] & 1)) {
        return func;
      }
      switch (argCount) {
        case 1: return function(value) {
          return func.call(thisArg, value);
        };
        case 2: return function(a, b) {
          return func.call(thisArg, a, b);
        };
        case 3: return function(value, index, collection) {
          return func.call(thisArg, value, index, collection);
        };
        case 4: return function(accumulator, value, index, collection) {
          return func.call(thisArg, accumulator, value, index, collection);
        };
      }
      return bind(func, thisArg);
    }

    /**
     * The base implementation of `createWrapper` that creates the wrapper and
     * sets its meta data.
     *
     * @private
     * @param {Array} bindData The bind data array.
     * @returns {Function} Returns the new function.
     */
    function baseCreateWrapper(bindData) {
      var func = bindData[0],
          bitmask = bindData[1],
          partialArgs = bindData[2],
          partialRightArgs = bindData[3],
          thisArg = bindData[4],
          arity = bindData[5];

      var isBind = bitmask & 1,
          isBindKey = bitmask & 2,
          isCurry = bitmask & 4,
          isCurryBound = bitmask & 8,
          key = func;

      function bound() {
        var thisBinding = isBind ? thisArg : this;
        if (partialArgs) {
          var args = slice(partialArgs);
          push.apply(args, arguments);
        }
        if (partialRightArgs || isCurry) {
          args || (args = slice(arguments));
          if (partialRightArgs) {
            push.apply(args, partialRightArgs);
          }
          if (isCurry && args.length < arity) {
            bitmask |= 16 & ~32;
            return baseCreateWrapper([func, (isCurryBound ? bitmask : bitmask & ~3), args, null, thisArg, arity]);
          }
        }
        args || (args = arguments);
        if (isBindKey) {
          func = thisBinding[key];
        }
        if (this instanceof bound) {
          thisBinding = baseCreate(func.prototype);
          var result = func.apply(thisBinding, args);
          return isObject(result) ? result : thisBinding;
        }
        return func.apply(thisBinding, args);
      }
      setBindData(bound, bindData);
      return bound;
    }

    /**
     * The base implementation of `_.difference` that accepts a single array
     * of values to exclude.
     *
     * @private
     * @param {Array} array The array to process.
     * @param {Array} [values] The array of values to exclude.
     * @returns {Array} Returns a new array of filtered values.
     */
    function baseDifference(array, values) {
      var index = -1,
          indexOf = getIndexOf(),
          length = array ? array.length : 0,
          isLarge = length >= largeArraySize && indexOf === baseIndexOf,
          result = [];

      if (isLarge) {
        var cache = createCache(values);
        if (cache) {
          indexOf = cacheIndexOf;
          values = cache;
        } else {
          isLarge = false;
        }
      }
      while (++index < length) {
        var value = array[index];
        if (indexOf(values, value) < 0) {
          result.push(value);
        }
      }
      if (isLarge) {
        releaseObject(values);
      }
      return result;
    }

    /**
     * The base implementation of `_.flatten` without support for callback
     * shorthands or `thisArg` binding.
     *
     * @private
     * @param {Array} array The array to flatten.
     * @param {boolean} [isShallow=false] A flag to restrict flattening to a single level.
     * @param {boolean} [isStrict=false] A flag to restrict flattening to arrays and `arguments` objects.
     * @param {number} [fromIndex=0] The index to start from.
     * @returns {Array} Returns a new flattened array.
     */
    function baseFlatten(array, isShallow, isStrict, fromIndex) {
      var index = (fromIndex || 0) - 1,
          length = array ? array.length : 0,
          result = [];

      while (++index < length) {
        var value = array[index];

        if (value && typeof value == 'object' && typeof value.length == 'number'
            && (isArray(value) || isArguments(value))) {
          // recursively flatten arrays (susceptible to call stack limits)
          if (!isShallow) {
            value = baseFlatten(value, isShallow, isStrict);
          }
          var valIndex = -1,
              valLength = value.length,
              resIndex = result.length;

          result.length += valLength;
          while (++valIndex < valLength) {
            result[resIndex++] = value[valIndex];
          }
        } else if (!isStrict) {
          result.push(value);
        }
      }
      return result;
    }

    /**
     * The base implementation of `_.isEqual`, without support for `thisArg` binding,
     * that allows partial "_.where" style comparisons.
     *
     * @private
     * @param {*} a The value to compare.
     * @param {*} b The other value to compare.
     * @param {Function} [callback] The function to customize comparing values.
     * @param {Function} [isWhere=false] A flag to indicate performing partial comparisons.
     * @param {Array} [stackA=[]] Tracks traversed `a` objects.
     * @param {Array} [stackB=[]] Tracks traversed `b` objects.
     * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
     */
    function baseIsEqual(a, b, callback, isWhere, stackA, stackB) {
      // used to indicate that when comparing objects, `a` has at least the properties of `b`
      if (callback) {
        var result = callback(a, b);
        if (typeof result != 'undefined') {
          return !!result;
        }
      }
      // exit early for identical values
      if (a === b) {
        // treat `+0` vs. `-0` as not equal
        return a !== 0 || (1 / a == 1 / b);
      }
      var type = typeof a,
          otherType = typeof b;

      // exit early for unlike primitive values
      if (a === a &&
          !(a && objectTypes[type]) &&
          !(b && objectTypes[otherType])) {
        return false;
      }
      // exit early for `null` and `undefined` avoiding ES3's Function#call behavior
      // http://es5.github.io/#x15.3.4.4
      if (a == null || b == null) {
        return a === b;
      }
      // compare [[Class]] names
      var className = toString.call(a),
          otherClass = toString.call(b);

      if (className == argsClass) {
        className = objectClass;
      }
      if (otherClass == argsClass) {
        otherClass = objectClass;
      }
      if (className != otherClass) {
        return false;
      }
      switch (className) {
        case boolClass:
        case dateClass:
          // coerce dates and booleans to numbers, dates to milliseconds and booleans
          // to `1` or `0` treating invalid dates coerced to `NaN` as not equal
          return +a == +b;

        case numberClass:
          // treat `NaN` vs. `NaN` as equal
          return (a != +a)
            ? b != +b
            // but treat `+0` vs. `-0` as not equal
            : (a == 0 ? (1 / a == 1 / b) : a == +b);

        case regexpClass:
        case stringClass:
          // coerce regexes to strings (http://es5.github.io/#x15.10.6.4)
          // treat string primitives and their corresponding object instances as equal
          return a == String(b);
      }
      var isArr = className == arrayClass;
      if (!isArr) {
        // unwrap any `lodash` wrapped values
        var aWrapped = hasOwnProperty.call(a, '__wrapped__'),
            bWrapped = hasOwnProperty.call(b, '__wrapped__');

        if (aWrapped || bWrapped) {
          return baseIsEqual(aWrapped ? a.__wrapped__ : a, bWrapped ? b.__wrapped__ : b, callback, isWhere, stackA, stackB);
        }
        // exit for functions and DOM nodes
        if (className != objectClass) {
          return false;
        }
        // in older versions of Opera, `arguments` objects have `Array` constructors
        var ctorA = a.constructor,
            ctorB = b.constructor;

        // non `Object` object instances with different constructors are not equal
        if (ctorA != ctorB &&
              !(isFunction(ctorA) && ctorA instanceof ctorA && isFunction(ctorB) && ctorB instanceof ctorB) &&
              ('constructor' in a && 'constructor' in b)
            ) {
          return false;
        }
      }
      // assume cyclic structures are equal
      // the algorithm for detecting cyclic structures is adapted from ES 5.1
      // section 15.12.3, abstract operation `JO` (http://es5.github.io/#x15.12.3)
      var initedStack = !stackA;
      stackA || (stackA = getArray());
      stackB || (stackB = getArray());

      var length = stackA.length;
      while (length--) {
        if (stackA[length] == a) {
          return stackB[length] == b;
        }
      }
      var size = 0;
      result = true;

      // add `a` and `b` to the stack of traversed objects
      stackA.push(a);
      stackB.push(b);

      // recursively compare objects and arrays (susceptible to call stack limits)
      if (isArr) {
        // compare lengths to determine if a deep comparison is necessary
        length = a.length;
        size = b.length;
        result = size == length;

        if (result || isWhere) {
          // deep compare the contents, ignoring non-numeric properties
          while (size--) {
            var index = length,
                value = b[size];

            if (isWhere) {
              while (index--) {
                if ((result = baseIsEqual(a[index], value, callback, isWhere, stackA, stackB))) {
                  break;
                }
              }
            } else if (!(result = baseIsEqual(a[size], value, callback, isWhere, stackA, stackB))) {
              break;
            }
          }
        }
      }
      else {
        // deep compare objects using `forIn`, instead of `forOwn`, to avoid `Object.keys`
        // which, in this case, is more costly
        forIn(b, function(value, key, b) {
          if (hasOwnProperty.call(b, key)) {
            // count the number of properties.
            size++;
            // deep compare each property value.
            return (result = hasOwnProperty.call(a, key) && baseIsEqual(a[key], value, callback, isWhere, stackA, stackB));
          }
        });

        if (result && !isWhere) {
          // ensure both objects have the same number of properties
          forIn(a, function(value, key, a) {
            if (hasOwnProperty.call(a, key)) {
              // `size` will be `-1` if `a` has more properties than `b`
              return (result = --size > -1);
            }
          });
        }
      }
      stackA.pop();
      stackB.pop();

      if (initedStack) {
        releaseArray(stackA);
        releaseArray(stackB);
      }
      return result;
    }

    /**
     * The base implementation of `_.merge` without argument juggling or support
     * for `thisArg` binding.
     *
     * @private
     * @param {Object} object The destination object.
     * @param {Object} source The source object.
     * @param {Function} [callback] The function to customize merging properties.
     * @param {Array} [stackA=[]] Tracks traversed source objects.
     * @param {Array} [stackB=[]] Associates values with source counterparts.
     */
    function baseMerge(object, source, callback, stackA, stackB) {
      (isArray(source) ? forEach : forOwn)(source, function(source, key) {
        var found,
            isArr,
            result = source,
            value = object[key];

        if (source && ((isArr = isArray(source)) || isPlainObject(source))) {
          // avoid merging previously merged cyclic sources
          var stackLength = stackA.length;
          while (stackLength--) {
            if ((found = stackA[stackLength] == source)) {
              value = stackB[stackLength];
              break;
            }
          }
          if (!found) {
            var isShallow;
            if (callback) {
              result = callback(value, source);
              if ((isShallow = typeof result != 'undefined')) {
                value = result;
              }
            }
            if (!isShallow) {
              value = isArr
                ? (isArray(value) ? value : [])
                : (isPlainObject(value) ? value : {});
            }
            // add `source` and associated `value` to the stack of traversed objects
            stackA.push(source);
            stackB.push(value);

            // recursively merge objects and arrays (susceptible to call stack limits)
            if (!isShallow) {
              baseMerge(value, source, callback, stackA, stackB);
            }
          }
        }
        else {
          if (callback) {
            result = callback(value, source);
            if (typeof result == 'undefined') {
              result = source;
            }
          }
          if (typeof result != 'undefined') {
            value = result;
          }
        }
        object[key] = value;
      });
    }

    /**
     * The base implementation of `_.random` without argument juggling or support
     * for returning floating-point numbers.
     *
     * @private
     * @param {number} min The minimum possible value.
     * @param {number} max The maximum possible value.
     * @returns {number} Returns a random number.
     */
    function baseRandom(min, max) {
      return min + floor(nativeRandom() * (max - min + 1));
    }

    /**
     * The base implementation of `_.uniq` without support for callback shorthands
     * or `thisArg` binding.
     *
     * @private
     * @param {Array} array The array to process.
     * @param {boolean} [isSorted=false] A flag to indicate that `array` is sorted.
     * @param {Function} [callback] The function called per iteration.
     * @returns {Array} Returns a duplicate-value-free array.
     */
    function baseUniq(array, isSorted, callback) {
      var index = -1,
          indexOf = getIndexOf(),
          length = array ? array.length : 0,
          result = [];

      var isLarge = !isSorted && length >= largeArraySize && indexOf === baseIndexOf,
          seen = (callback || isLarge) ? getArray() : result;

      if (isLarge) {
        var cache = createCache(seen);
        indexOf = cacheIndexOf;
        seen = cache;
      }
      while (++index < length) {
        var value = array[index],
            computed = callback ? callback(value, index, array) : value;

        if (isSorted
              ? !index || seen[seen.length - 1] !== computed
              : indexOf(seen, computed) < 0
            ) {
          if (callback || isLarge) {
            seen.push(computed);
          }
          result.push(value);
        }
      }
      if (isLarge) {
        releaseArray(seen.array);
        releaseObject(seen);
      } else if (callback) {
        releaseArray(seen);
      }
      return result;
    }

    /**
     * Creates a function that aggregates a collection, creating an object composed
     * of keys generated from the results of running each element of the collection
     * through a callback. The given `setter` function sets the keys and values
     * of the composed object.
     *
     * @private
     * @param {Function} setter The setter function.
     * @returns {Function} Returns the new aggregator function.
     */
    function createAggregator(setter) {
      return function(collection, callback, thisArg) {
        var result = {};
        callback = lodash.createCallback(callback, thisArg, 3);

        var index = -1,
            length = collection ? collection.length : 0;

        if (typeof length == 'number') {
          while (++index < length) {
            var value = collection[index];
            setter(result, value, callback(value, index, collection), collection);
          }
        } else {
          forOwn(collection, function(value, key, collection) {
            setter(result, value, callback(value, key, collection), collection);
          });
        }
        return result;
      };
    }

    /**
     * Creates a function that, when called, either curries or invokes `func`
     * with an optional `this` binding and partially applied arguments.
     *
     * @private
     * @param {Function|string} func The function or method name to reference.
     * @param {number} bitmask The bitmask of method flags to compose.
     *  The bitmask may be composed of the following flags:
     *  1 - `_.bind`
     *  2 - `_.bindKey`
     *  4 - `_.curry`
     *  8 - `_.curry` (bound)
     *  16 - `_.partial`
     *  32 - `_.partialRight`
     * @param {Array} [partialArgs] An array of arguments to prepend to those
     *  provided to the new function.
     * @param {Array} [partialRightArgs] An array of arguments to append to those
     *  provided to the new function.
     * @param {*} [thisArg] The `this` binding of `func`.
     * @param {number} [arity] The arity of `func`.
     * @returns {Function} Returns the new function.
     */
    function createWrapper(func, bitmask, partialArgs, partialRightArgs, thisArg, arity) {
      var isBind = bitmask & 1,
          isBindKey = bitmask & 2,
          isCurry = bitmask & 4,
          isCurryBound = bitmask & 8,
          isPartial = bitmask & 16,
          isPartialRight = bitmask & 32;

      if (!isBindKey && !isFunction(func)) {
        throw new TypeError;
      }
      if (isPartial && !partialArgs.length) {
        bitmask &= ~16;
        isPartial = partialArgs = false;
      }
      if (isPartialRight && !partialRightArgs.length) {
        bitmask &= ~32;
        isPartialRight = partialRightArgs = false;
      }
      var bindData = func && func.__bindData__;
      if (bindData && bindData !== true) {
        // clone `bindData`
        bindData = slice(bindData);
        if (bindData[2]) {
          bindData[2] = slice(bindData[2]);
        }
        if (bindData[3]) {
          bindData[3] = slice(bindData[3]);
        }
        // set `thisBinding` is not previously bound
        if (isBind && !(bindData[1] & 1)) {
          bindData[4] = thisArg;
        }
        // set if previously bound but not currently (subsequent curried functions)
        if (!isBind && bindData[1] & 1) {
          bitmask |= 8;
        }
        // set curried arity if not yet set
        if (isCurry && !(bindData[1] & 4)) {
          bindData[5] = arity;
        }
        // append partial left arguments
        if (isPartial) {
          push.apply(bindData[2] || (bindData[2] = []), partialArgs);
        }
        // append partial right arguments
        if (isPartialRight) {
          unshift.apply(bindData[3] || (bindData[3] = []), partialRightArgs);
        }
        // merge flags
        bindData[1] |= bitmask;
        return createWrapper.apply(null, bindData);
      }
      // fast path for `_.bind`
      var creater = (bitmask == 1 || bitmask === 17) ? baseBind : baseCreateWrapper;
      return creater([func, bitmask, partialArgs, partialRightArgs, thisArg, arity]);
    }

    /**
     * Used by `escape` to convert characters to HTML entities.
     *
     * @private
     * @param {string} match The matched character to escape.
     * @returns {string} Returns the escaped character.
     */
    function escapeHtmlChar(match) {
      return htmlEscapes[match];
    }

    /**
     * Gets the appropriate "indexOf" function. If the `_.indexOf` method is
     * customized, this method returns the custom method, otherwise it returns
     * the `baseIndexOf` function.
     *
     * @private
     * @returns {Function} Returns the "indexOf" function.
     */
    function getIndexOf() {
      var result = (result = lodash.indexOf) === indexOf ? baseIndexOf : result;
      return result;
    }

    /**
     * Checks if `value` is a native function.
     *
     * @private
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is a native function, else `false`.
     */
    function isNative(value) {
      return typeof value == 'function' && reNative.test(value);
    }

    /**
     * Sets `this` binding data on a given function.
     *
     * @private
     * @param {Function} func The function to set data on.
     * @param {Array} value The data array to set.
     */
    var setBindData = !defineProperty ? noop : function(func, value) {
      descriptor.value = value;
      defineProperty(func, '__bindData__', descriptor);
      descriptor.value = null;
    };

    /**
     * A fallback implementation of `isPlainObject` which checks if a given value
     * is an object created by the `Object` constructor, assuming objects created
     * by the `Object` constructor have no inherited enumerable properties and that
     * there are no `Object.prototype` extensions.
     *
     * @private
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a plain object, else `false`.
     */
    function shimIsPlainObject(value) {
      var ctor,
          result;

      // avoid non Object objects, `arguments` objects, and DOM elements
      if (!(value && toString.call(value) == objectClass) ||
          (ctor = value.constructor, isFunction(ctor) && !(ctor instanceof ctor))) {
        return false;
      }
      // In most environments an object's own properties are iterated before
      // its inherited properties. If the last iterated property is an object's
      // own property then there are no inherited enumerable properties.
      forIn(value, function(value, key) {
        result = key;
      });
      return typeof result == 'undefined' || hasOwnProperty.call(value, result);
    }

    /**
     * Used by `unescape` to convert HTML entities to characters.
     *
     * @private
     * @param {string} match The matched character to unescape.
     * @returns {string} Returns the unescaped character.
     */
    function unescapeHtmlChar(match) {
      return htmlUnescapes[match];
    }

    /*--------------------------------------------------------------------------*/

    /**
     * Checks if `value` is an `arguments` object.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is an `arguments` object, else `false`.
     * @example
     *
     * (function() { return _.isArguments(arguments); })(1, 2, 3);
     * // => true
     *
     * _.isArguments([1, 2, 3]);
     * // => false
     */
    function isArguments(value) {
      return value && typeof value == 'object' && typeof value.length == 'number' &&
        toString.call(value) == argsClass || false;
    }

    /**
     * Checks if `value` is an array.
     *
     * @static
     * @memberOf _
     * @type Function
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is an array, else `false`.
     * @example
     *
     * (function() { return _.isArray(arguments); })();
     * // => false
     *
     * _.isArray([1, 2, 3]);
     * // => true
     */
    var isArray = nativeIsArray || function(value) {
      return value && typeof value == 'object' && typeof value.length == 'number' &&
        toString.call(value) == arrayClass || false;
    };

    /**
     * A fallback implementation of `Object.keys` which produces an array of the
     * given object's own enumerable property names.
     *
     * @private
     * @type Function
     * @param {Object} object The object to inspect.
     * @returns {Array} Returns an array of property names.
     */
    var shimKeys = function(object) {
      var index, iterable = object, result = [];
      if (!iterable) return result;
      if (!(objectTypes[typeof object])) return result;
        for (index in iterable) {
          if (hasOwnProperty.call(iterable, index)) {
            result.push(index);
          }
        }
      return result
    };

    /**
     * Creates an array composed of the own enumerable property names of an object.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The object to inspect.
     * @returns {Array} Returns an array of property names.
     * @example
     *
     * _.keys({ 'one': 1, 'two': 2, 'three': 3 });
     * // => ['one', 'two', 'three'] (property order is not guaranteed across environments)
     */
    var keys = !nativeKeys ? shimKeys : function(object) {
      if (!isObject(object)) {
        return [];
      }
      return nativeKeys(object);
    };

    /**
     * Used to convert characters to HTML entities:
     *
     * Though the `>` character is escaped for symmetry, characters like `>` and `/`
     * don't require escaping in HTML and have no special meaning unless they're part
     * of a tag or an unquoted attribute value.
     * http://mathiasbynens.be/notes/ambiguous-ampersands (under "semi-related fun fact")
     */
    var htmlEscapes = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    };

    /** Used to convert HTML entities to characters */
    var htmlUnescapes = invert(htmlEscapes);

    /** Used to match HTML entities and HTML characters */
    var reEscapedHtml = RegExp('(' + keys(htmlUnescapes).join('|') + ')', 'g'),
        reUnescapedHtml = RegExp('[' + keys(htmlEscapes).join('') + ']', 'g');

    /*--------------------------------------------------------------------------*/

    /**
     * Assigns own enumerable properties of source object(s) to the destination
     * object. Subsequent sources will overwrite property assignments of previous
     * sources. If a callback is provided it will be executed to produce the
     * assigned values. The callback is bound to `thisArg` and invoked with two
     * arguments; (objectValue, sourceValue).
     *
     * @static
     * @memberOf _
     * @type Function
     * @alias extend
     * @category Objects
     * @param {Object} object The destination object.
     * @param {...Object} [source] The source objects.
     * @param {Function} [callback] The function to customize assigning values.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Object} Returns the destination object.
     * @example
     *
     * _.assign({ 'name': 'fred' }, { 'employer': 'slate' });
     * // => { 'name': 'fred', 'employer': 'slate' }
     *
     * var defaults = _.partialRight(_.assign, function(a, b) {
     *   return typeof a == 'undefined' ? b : a;
     * });
     *
     * var object = { 'name': 'barney' };
     * defaults(object, { 'name': 'fred', 'employer': 'slate' });
     * // => { 'name': 'barney', 'employer': 'slate' }
     */
    var assign = function(object, source, guard) {
      var index, iterable = object, result = iterable;
      if (!iterable) return result;
      var args = arguments,
          argsIndex = 0,
          argsLength = typeof guard == 'number' ? 2 : args.length;
      if (argsLength > 3 && typeof args[argsLength - 2] == 'function') {
        var callback = baseCreateCallback(args[--argsLength - 1], args[argsLength--], 2);
      } else if (argsLength > 2 && typeof args[argsLength - 1] == 'function') {
        callback = args[--argsLength];
      }
      while (++argsIndex < argsLength) {
        iterable = args[argsIndex];
        if (iterable && objectTypes[typeof iterable]) {
        var ownIndex = -1,
            ownProps = objectTypes[typeof iterable] && keys(iterable),
            length = ownProps ? ownProps.length : 0;

        while (++ownIndex < length) {
          index = ownProps[ownIndex];
          result[index] = callback ? callback(result[index], iterable[index]) : iterable[index];
        }
        }
      }
      return result
    };

    /**
     * Creates a clone of `value`. If `isDeep` is `true` nested objects will also
     * be cloned, otherwise they will be assigned by reference. If a callback
     * is provided it will be executed to produce the cloned values. If the
     * callback returns `undefined` cloning will be handled by the method instead.
     * The callback is bound to `thisArg` and invoked with one argument; (value).
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to clone.
     * @param {boolean} [isDeep=false] Specify a deep clone.
     * @param {Function} [callback] The function to customize cloning values.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {*} Returns the cloned value.
     * @example
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 36 },
     *   { 'name': 'fred',   'age': 40 }
     * ];
     *
     * var shallow = _.clone(characters);
     * shallow[0] === characters[0];
     * // => true
     *
     * var deep = _.clone(characters, true);
     * deep[0] === characters[0];
     * // => false
     *
     * _.mixin({
     *   'clone': _.partialRight(_.clone, function(value) {
     *     return _.isElement(value) ? value.cloneNode(false) : undefined;
     *   })
     * });
     *
     * var clone = _.clone(document.body);
     * clone.childNodes.length;
     * // => 0
     */
    function clone(value, isDeep, callback, thisArg) {
      // allows working with "Collections" methods without using their `index`
      // and `collection` arguments for `isDeep` and `callback`
      if (typeof isDeep != 'boolean' && isDeep != null) {
        thisArg = callback;
        callback = isDeep;
        isDeep = false;
      }
      return baseClone(value, isDeep, typeof callback == 'function' && baseCreateCallback(callback, thisArg, 1));
    }

    /**
     * Creates a deep clone of `value`. If a callback is provided it will be
     * executed to produce the cloned values. If the callback returns `undefined`
     * cloning will be handled by the method instead. The callback is bound to
     * `thisArg` and invoked with one argument; (value).
     *
     * Note: This method is loosely based on the structured clone algorithm. Functions
     * and DOM nodes are **not** cloned. The enumerable properties of `arguments` objects and
     * objects created by constructors other than `Object` are cloned to plain `Object` objects.
     * See http://www.w3.org/TR/html5/infrastructure.html#internal-structured-cloning-algorithm.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to deep clone.
     * @param {Function} [callback] The function to customize cloning values.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {*} Returns the deep cloned value.
     * @example
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 36 },
     *   { 'name': 'fred',   'age': 40 }
     * ];
     *
     * var deep = _.cloneDeep(characters);
     * deep[0] === characters[0];
     * // => false
     *
     * var view = {
     *   'label': 'docs',
     *   'node': element
     * };
     *
     * var clone = _.cloneDeep(view, function(value) {
     *   return _.isElement(value) ? value.cloneNode(true) : undefined;
     * });
     *
     * clone.node == view.node;
     * // => false
     */
    function cloneDeep(value, callback, thisArg) {
      return baseClone(value, true, typeof callback == 'function' && baseCreateCallback(callback, thisArg, 1));
    }

    /**
     * Creates an object that inherits from the given `prototype` object. If a
     * `properties` object is provided its own enumerable properties are assigned
     * to the created object.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} prototype The object to inherit from.
     * @param {Object} [properties] The properties to assign to the object.
     * @returns {Object} Returns the new object.
     * @example
     *
     * function Shape() {
     *   this.x = 0;
     *   this.y = 0;
     * }
     *
     * function Circle() {
     *   Shape.call(this);
     * }
     *
     * Circle.prototype = _.create(Shape.prototype, { 'constructor': Circle });
     *
     * var circle = new Circle;
     * circle instanceof Circle;
     * // => true
     *
     * circle instanceof Shape;
     * // => true
     */
    function create(prototype, properties) {
      var result = baseCreate(prototype);
      return properties ? assign(result, properties) : result;
    }

    /**
     * Assigns own enumerable properties of source object(s) to the destination
     * object for all destination properties that resolve to `undefined`. Once a
     * property is set, additional defaults of the same property will be ignored.
     *
     * @static
     * @memberOf _
     * @type Function
     * @category Objects
     * @param {Object} object The destination object.
     * @param {...Object} [source] The source objects.
     * @param- {Object} [guard] Allows working with `_.reduce` without using its
     *  `key` and `object` arguments as sources.
     * @returns {Object} Returns the destination object.
     * @example
     *
     * var object = { 'name': 'barney' };
     * _.defaults(object, { 'name': 'fred', 'employer': 'slate' });
     * // => { 'name': 'barney', 'employer': 'slate' }
     */
    var defaults = function(object, source, guard) {
      var index, iterable = object, result = iterable;
      if (!iterable) return result;
      var args = arguments,
          argsIndex = 0,
          argsLength = typeof guard == 'number' ? 2 : args.length;
      while (++argsIndex < argsLength) {
        iterable = args[argsIndex];
        if (iterable && objectTypes[typeof iterable]) {
        var ownIndex = -1,
            ownProps = objectTypes[typeof iterable] && keys(iterable),
            length = ownProps ? ownProps.length : 0;

        while (++ownIndex < length) {
          index = ownProps[ownIndex];
          if (typeof result[index] == 'undefined') result[index] = iterable[index];
        }
        }
      }
      return result
    };

    /**
     * This method is like `_.findIndex` except that it returns the key of the
     * first element that passes the callback check, instead of the element itself.
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The object to search.
     * @param {Function|Object|string} [callback=identity] The function called per
     *  iteration. If a property name or object is provided it will be used to
     *  create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {string|undefined} Returns the key of the found element, else `undefined`.
     * @example
     *
     * var characters = {
     *   'barney': {  'age': 36, 'blocked': false },
     *   'fred': {    'age': 40, 'blocked': true },
     *   'pebbles': { 'age': 1,  'blocked': false }
     * };
     *
     * _.findKey(characters, function(chr) {
     *   return chr.age < 40;
     * });
     * // => 'barney' (property order is not guaranteed across environments)
     *
     * // using "_.where" callback shorthand
     * _.findKey(characters, { 'age': 1 });
     * // => 'pebbles'
     *
     * // using "_.pluck" callback shorthand
     * _.findKey(characters, 'blocked');
     * // => 'fred'
     */
    function findKey(object, callback, thisArg) {
      var result;
      callback = lodash.createCallback(callback, thisArg, 3);
      forOwn(object, function(value, key, object) {
        if (callback(value, key, object)) {
          result = key;
          return false;
        }
      });
      return result;
    }

    /**
     * This method is like `_.findKey` except that it iterates over elements
     * of a `collection` in the opposite order.
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The object to search.
     * @param {Function|Object|string} [callback=identity] The function called per
     *  iteration. If a property name or object is provided it will be used to
     *  create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {string|undefined} Returns the key of the found element, else `undefined`.
     * @example
     *
     * var characters = {
     *   'barney': {  'age': 36, 'blocked': true },
     *   'fred': {    'age': 40, 'blocked': false },
     *   'pebbles': { 'age': 1,  'blocked': true }
     * };
     *
     * _.findLastKey(characters, function(chr) {
     *   return chr.age < 40;
     * });
     * // => returns `pebbles`, assuming `_.findKey` returns `barney`
     *
     * // using "_.where" callback shorthand
     * _.findLastKey(characters, { 'age': 40 });
     * // => 'fred'
     *
     * // using "_.pluck" callback shorthand
     * _.findLastKey(characters, 'blocked');
     * // => 'pebbles'
     */
    function findLastKey(object, callback, thisArg) {
      var result;
      callback = lodash.createCallback(callback, thisArg, 3);
      forOwnRight(object, function(value, key, object) {
        if (callback(value, key, object)) {
          result = key;
          return false;
        }
      });
      return result;
    }

    /**
     * Iterates over own and inherited enumerable properties of an object,
     * executing the callback for each property. The callback is bound to `thisArg`
     * and invoked with three arguments; (value, key, object). Callbacks may exit
     * iteration early by explicitly returning `false`.
     *
     * @static
     * @memberOf _
     * @type Function
     * @category Objects
     * @param {Object} object The object to iterate over.
     * @param {Function} [callback=identity] The function called per iteration.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Object} Returns `object`.
     * @example
     *
     * function Shape() {
     *   this.x = 0;
     *   this.y = 0;
     * }
     *
     * Shape.prototype.move = function(x, y) {
     *   this.x += x;
     *   this.y += y;
     * };
     *
     * _.forIn(new Shape, function(value, key) {
     *   console.log(key);
     * });
     * // => logs 'x', 'y', and 'move' (property order is not guaranteed across environments)
     */
    var forIn = function(collection, callback, thisArg) {
      var index, iterable = collection, result = iterable;
      if (!iterable) return result;
      if (!objectTypes[typeof iterable]) return result;
      callback = callback && typeof thisArg == 'undefined' ? callback : baseCreateCallback(callback, thisArg, 3);
        for (index in iterable) {
          if (callback(iterable[index], index, collection) === false) return result;
        }
      return result
    };

    /**
     * This method is like `_.forIn` except that it iterates over elements
     * of a `collection` in the opposite order.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The object to iterate over.
     * @param {Function} [callback=identity] The function called per iteration.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Object} Returns `object`.
     * @example
     *
     * function Shape() {
     *   this.x = 0;
     *   this.y = 0;
     * }
     *
     * Shape.prototype.move = function(x, y) {
     *   this.x += x;
     *   this.y += y;
     * };
     *
     * _.forInRight(new Shape, function(value, key) {
     *   console.log(key);
     * });
     * // => logs 'move', 'y', and 'x' assuming `_.forIn ` logs 'x', 'y', and 'move'
     */
    function forInRight(object, callback, thisArg) {
      var pairs = [];

      forIn(object, function(value, key) {
        pairs.push(key, value);
      });

      var length = pairs.length;
      callback = baseCreateCallback(callback, thisArg, 3);
      while (length--) {
        if (callback(pairs[length--], pairs[length], object) === false) {
          break;
        }
      }
      return object;
    }

    /**
     * Iterates over own enumerable properties of an object, executing the callback
     * for each property. The callback is bound to `thisArg` and invoked with three
     * arguments; (value, key, object). Callbacks may exit iteration early by
     * explicitly returning `false`.
     *
     * @static
     * @memberOf _
     * @type Function
     * @category Objects
     * @param {Object} object The object to iterate over.
     * @param {Function} [callback=identity] The function called per iteration.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Object} Returns `object`.
     * @example
     *
     * _.forOwn({ '0': 'zero', '1': 'one', 'length': 2 }, function(num, key) {
     *   console.log(key);
     * });
     * // => logs '0', '1', and 'length' (property order is not guaranteed across environments)
     */
    var forOwn = function(collection, callback, thisArg) {
      var index, iterable = collection, result = iterable;
      if (!iterable) return result;
      if (!objectTypes[typeof iterable]) return result;
      callback = callback && typeof thisArg == 'undefined' ? callback : baseCreateCallback(callback, thisArg, 3);
        var ownIndex = -1,
            ownProps = objectTypes[typeof iterable] && keys(iterable),
            length = ownProps ? ownProps.length : 0;

        while (++ownIndex < length) {
          index = ownProps[ownIndex];
          if (callback(iterable[index], index, collection) === false) return result;
        }
      return result
    };

    /**
     * This method is like `_.forOwn` except that it iterates over elements
     * of a `collection` in the opposite order.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The object to iterate over.
     * @param {Function} [callback=identity] The function called per iteration.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Object} Returns `object`.
     * @example
     *
     * _.forOwnRight({ '0': 'zero', '1': 'one', 'length': 2 }, function(num, key) {
     *   console.log(key);
     * });
     * // => logs 'length', '1', and '0' assuming `_.forOwn` logs '0', '1', and 'length'
     */
    function forOwnRight(object, callback, thisArg) {
      var props = keys(object),
          length = props.length;

      callback = baseCreateCallback(callback, thisArg, 3);
      while (length--) {
        var key = props[length];
        if (callback(object[key], key, object) === false) {
          break;
        }
      }
      return object;
    }

    /**
     * Creates a sorted array of property names of all enumerable properties,
     * own and inherited, of `object` that have function values.
     *
     * @static
     * @memberOf _
     * @alias methods
     * @category Objects
     * @param {Object} object The object to inspect.
     * @returns {Array} Returns an array of property names that have function values.
     * @example
     *
     * _.functions(_);
     * // => ['all', 'any', 'bind', 'bindAll', 'clone', 'compact', 'compose', ...]
     */
    function functions(object) {
      var result = [];
      forIn(object, function(value, key) {
        if (isFunction(value)) {
          result.push(key);
        }
      });
      return result.sort();
    }

    /**
     * Checks if the specified property name exists as a direct property of `object`,
     * instead of an inherited property.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The object to inspect.
     * @param {string} key The name of the property to check.
     * @returns {boolean} Returns `true` if key is a direct property, else `false`.
     * @example
     *
     * _.has({ 'a': 1, 'b': 2, 'c': 3 }, 'b');
     * // => true
     */
    function has(object, key) {
      return object ? hasOwnProperty.call(object, key) : false;
    }

    /**
     * Creates an object composed of the inverted keys and values of the given object.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The object to invert.
     * @returns {Object} Returns the created inverted object.
     * @example
     *
     * _.invert({ 'first': 'fred', 'second': 'barney' });
     * // => { 'fred': 'first', 'barney': 'second' }
     */
    function invert(object) {
      var index = -1,
          props = keys(object),
          length = props.length,
          result = {};

      while (++index < length) {
        var key = props[index];
        result[object[key]] = key;
      }
      return result;
    }

    /**
     * Checks if `value` is a boolean value.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is a boolean value, else `false`.
     * @example
     *
     * _.isBoolean(null);
     * // => false
     */
    function isBoolean(value) {
      return value === true || value === false ||
        value && typeof value == 'object' && toString.call(value) == boolClass || false;
    }

    /**
     * Checks if `value` is a date.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is a date, else `false`.
     * @example
     *
     * _.isDate(new Date);
     * // => true
     */
    function isDate(value) {
      return value && typeof value == 'object' && toString.call(value) == dateClass || false;
    }

    /**
     * Checks if `value` is a DOM element.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is a DOM element, else `false`.
     * @example
     *
     * _.isElement(document.body);
     * // => true
     */
    function isElement(value) {
      return value && value.nodeType === 1 || false;
    }

    /**
     * Checks if `value` is empty. Arrays, strings, or `arguments` objects with a
     * length of `0` and objects with no own enumerable properties are considered
     * "empty".
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Array|Object|string} value The value to inspect.
     * @returns {boolean} Returns `true` if the `value` is empty, else `false`.
     * @example
     *
     * _.isEmpty([1, 2, 3]);
     * // => false
     *
     * _.isEmpty({});
     * // => true
     *
     * _.isEmpty('');
     * // => true
     */
    function isEmpty(value) {
      var result = true;
      if (!value) {
        return result;
      }
      var className = toString.call(value),
          length = value.length;

      if ((className == arrayClass || className == stringClass || className == argsClass ) ||
          (className == objectClass && typeof length == 'number' && isFunction(value.splice))) {
        return !length;
      }
      forOwn(value, function() {
        return (result = false);
      });
      return result;
    }

    /**
     * Performs a deep comparison between two values to determine if they are
     * equivalent to each other. If a callback is provided it will be executed
     * to compare values. If the callback returns `undefined` comparisons will
     * be handled by the method instead. The callback is bound to `thisArg` and
     * invoked with two arguments; (a, b).
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} a The value to compare.
     * @param {*} b The other value to compare.
     * @param {Function} [callback] The function to customize comparing values.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
     * @example
     *
     * var object = { 'name': 'fred' };
     * var copy = { 'name': 'fred' };
     *
     * object == copy;
     * // => false
     *
     * _.isEqual(object, copy);
     * // => true
     *
     * var words = ['hello', 'goodbye'];
     * var otherWords = ['hi', 'goodbye'];
     *
     * _.isEqual(words, otherWords, function(a, b) {
     *   var reGreet = /^(?:hello|hi)$/i,
     *       aGreet = _.isString(a) && reGreet.test(a),
     *       bGreet = _.isString(b) && reGreet.test(b);
     *
     *   return (aGreet || bGreet) ? (aGreet == bGreet) : undefined;
     * });
     * // => true
     */
    function isEqual(a, b, callback, thisArg) {
      return baseIsEqual(a, b, typeof callback == 'function' && baseCreateCallback(callback, thisArg, 2));
    }

    /**
     * Checks if `value` is, or can be coerced to, a finite number.
     *
     * Note: This is not the same as native `isFinite` which will return true for
     * booleans and empty strings. See http://es5.github.io/#x15.1.2.5.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is finite, else `false`.
     * @example
     *
     * _.isFinite(-101);
     * // => true
     *
     * _.isFinite('10');
     * // => true
     *
     * _.isFinite(true);
     * // => false
     *
     * _.isFinite('');
     * // => false
     *
     * _.isFinite(Infinity);
     * // => false
     */
    function isFinite(value) {
      return nativeIsFinite(value) && !nativeIsNaN(parseFloat(value));
    }

    /**
     * Checks if `value` is a function.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is a function, else `false`.
     * @example
     *
     * _.isFunction(_);
     * // => true
     */
    function isFunction(value) {
      return typeof value == 'function';
    }

    /**
     * Checks if `value` is the language type of Object.
     * (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is an object, else `false`.
     * @example
     *
     * _.isObject({});
     * // => true
     *
     * _.isObject([1, 2, 3]);
     * // => true
     *
     * _.isObject(1);
     * // => false
     */
    function isObject(value) {
      // check if the value is the ECMAScript language type of Object
      // http://es5.github.io/#x8
      // and avoid a V8 bug
      // http://code.google.com/p/v8/issues/detail?id=2291
      return !!(value && objectTypes[typeof value]);
    }

    /**
     * Checks if `value` is `NaN`.
     *
     * Note: This is not the same as native `isNaN` which will return `true` for
     * `undefined` and other non-numeric values. See http://es5.github.io/#x15.1.2.4.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is `NaN`, else `false`.
     * @example
     *
     * _.isNaN(NaN);
     * // => true
     *
     * _.isNaN(new Number(NaN));
     * // => true
     *
     * isNaN(undefined);
     * // => true
     *
     * _.isNaN(undefined);
     * // => false
     */
    function isNaN(value) {
      // `NaN` as a primitive is the only value that is not equal to itself
      // (perform the [[Class]] check first to avoid errors with some host objects in IE)
      return isNumber(value) && value != +value;
    }

    /**
     * Checks if `value` is `null`.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is `null`, else `false`.
     * @example
     *
     * _.isNull(null);
     * // => true
     *
     * _.isNull(undefined);
     * // => false
     */
    function isNull(value) {
      return value === null;
    }

    /**
     * Checks if `value` is a number.
     *
     * Note: `NaN` is considered a number. See http://es5.github.io/#x8.5.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is a number, else `false`.
     * @example
     *
     * _.isNumber(8.4 * 5);
     * // => true
     */
    function isNumber(value) {
      return typeof value == 'number' ||
        value && typeof value == 'object' && toString.call(value) == numberClass || false;
    }

    /**
     * Checks if `value` is an object created by the `Object` constructor.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a plain object, else `false`.
     * @example
     *
     * function Shape() {
     *   this.x = 0;
     *   this.y = 0;
     * }
     *
     * _.isPlainObject(new Shape);
     * // => false
     *
     * _.isPlainObject([1, 2, 3]);
     * // => false
     *
     * _.isPlainObject({ 'x': 0, 'y': 0 });
     * // => true
     */
    var isPlainObject = !getPrototypeOf ? shimIsPlainObject : function(value) {
      if (!(value && toString.call(value) == objectClass)) {
        return false;
      }
      var valueOf = value.valueOf,
          objProto = isNative(valueOf) && (objProto = getPrototypeOf(valueOf)) && getPrototypeOf(objProto);

      return objProto
        ? (value == objProto || getPrototypeOf(value) == objProto)
        : shimIsPlainObject(value);
    };

    /**
     * Checks if `value` is a regular expression.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is a regular expression, else `false`.
     * @example
     *
     * _.isRegExp(/fred/);
     * // => true
     */
    function isRegExp(value) {
      return value && typeof value == 'object' && toString.call(value) == regexpClass || false;
    }

    /**
     * Checks if `value` is a string.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is a string, else `false`.
     * @example
     *
     * _.isString('fred');
     * // => true
     */
    function isString(value) {
      return typeof value == 'string' ||
        value && typeof value == 'object' && toString.call(value) == stringClass || false;
    }

    /**
     * Checks if `value` is `undefined`.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is `undefined`, else `false`.
     * @example
     *
     * _.isUndefined(void 0);
     * // => true
     */
    function isUndefined(value) {
      return typeof value == 'undefined';
    }

    /**
     * Creates an object with the same keys as `object` and values generated by
     * running each own enumerable property of `object` through the callback.
     * The callback is bound to `thisArg` and invoked with three arguments;
     * (value, key, object).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The object to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array} Returns a new object with values of the results of each `callback` execution.
     * @example
     *
     * _.mapValues({ 'a': 1, 'b': 2, 'c': 3} , function(num) { return num * 3; });
     * // => { 'a': 3, 'b': 6, 'c': 9 }
     *
     * var characters = {
     *   'fred': { 'name': 'fred', 'age': 40 },
     *   'pebbles': { 'name': 'pebbles', 'age': 1 }
     * };
     *
     * // using "_.pluck" callback shorthand
     * _.mapValues(characters, 'age');
     * // => { 'fred': 40, 'pebbles': 1 }
     */
    function mapValues(object, callback, thisArg) {
      var result = {};
      callback = lodash.createCallback(callback, thisArg, 3);

      forOwn(object, function(value, key, object) {
        result[key] = callback(value, key, object);
      });
      return result;
    }

    /**
     * Recursively merges own enumerable properties of the source object(s), that
     * don't resolve to `undefined` into the destination object. Subsequent sources
     * will overwrite property assignments of previous sources. If a callback is
     * provided it will be executed to produce the merged values of the destination
     * and source properties. If the callback returns `undefined` merging will
     * be handled by the method instead. The callback is bound to `thisArg` and
     * invoked with two arguments; (objectValue, sourceValue).
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The destination object.
     * @param {...Object} [source] The source objects.
     * @param {Function} [callback] The function to customize merging properties.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Object} Returns the destination object.
     * @example
     *
     * var names = {
     *   'characters': [
     *     { 'name': 'barney' },
     *     { 'name': 'fred' }
     *   ]
     * };
     *
     * var ages = {
     *   'characters': [
     *     { 'age': 36 },
     *     { 'age': 40 }
     *   ]
     * };
     *
     * _.merge(names, ages);
     * // => { 'characters': [{ 'name': 'barney', 'age': 36 }, { 'name': 'fred', 'age': 40 }] }
     *
     * var food = {
     *   'fruits': ['apple'],
     *   'vegetables': ['beet']
     * };
     *
     * var otherFood = {
     *   'fruits': ['banana'],
     *   'vegetables': ['carrot']
     * };
     *
     * _.merge(food, otherFood, function(a, b) {
     *   return _.isArray(a) ? a.concat(b) : undefined;
     * });
     * // => { 'fruits': ['apple', 'banana'], 'vegetables': ['beet', 'carrot] }
     */
    function merge(object) {
      var args = arguments,
          length = 2;

      if (!isObject(object)) {
        return object;
      }
      // allows working with `_.reduce` and `_.reduceRight` without using
      // their `index` and `collection` arguments
      if (typeof args[2] != 'number') {
        length = args.length;
      }
      if (length > 3 && typeof args[length - 2] == 'function') {
        var callback = baseCreateCallback(args[--length - 1], args[length--], 2);
      } else if (length > 2 && typeof args[length - 1] == 'function') {
        callback = args[--length];
      }
      var sources = slice(arguments, 1, length),
          index = -1,
          stackA = getArray(),
          stackB = getArray();

      while (++index < length) {
        baseMerge(object, sources[index], callback, stackA, stackB);
      }
      releaseArray(stackA);
      releaseArray(stackB);
      return object;
    }

    /**
     * Creates a shallow clone of `object` excluding the specified properties.
     * Property names may be specified as individual arguments or as arrays of
     * property names. If a callback is provided it will be executed for each
     * property of `object` omitting the properties the callback returns truey
     * for. The callback is bound to `thisArg` and invoked with three arguments;
     * (value, key, object).
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The source object.
     * @param {Function|...string|string[]} [callback] The properties to omit or the
     *  function called per iteration.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Object} Returns an object without the omitted properties.
     * @example
     *
     * _.omit({ 'name': 'fred', 'age': 40 }, 'age');
     * // => { 'name': 'fred' }
     *
     * _.omit({ 'name': 'fred', 'age': 40 }, function(value) {
     *   return typeof value == 'number';
     * });
     * // => { 'name': 'fred' }
     */
    function omit(object, callback, thisArg) {
      var result = {};
      if (typeof callback != 'function') {
        var props = [];
        forIn(object, function(value, key) {
          props.push(key);
        });
        props = baseDifference(props, baseFlatten(arguments, true, false, 1));

        var index = -1,
            length = props.length;

        while (++index < length) {
          var key = props[index];
          result[key] = object[key];
        }
      } else {
        callback = lodash.createCallback(callback, thisArg, 3);
        forIn(object, function(value, key, object) {
          if (!callback(value, key, object)) {
            result[key] = value;
          }
        });
      }
      return result;
    }

    /**
     * Creates a two dimensional array of an object's key-value pairs,
     * i.e. `[[key1, value1], [key2, value2]]`.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The object to inspect.
     * @returns {Array} Returns new array of key-value pairs.
     * @example
     *
     * _.pairs({ 'barney': 36, 'fred': 40 });
     * // => [['barney', 36], ['fred', 40]] (property order is not guaranteed across environments)
     */
    function pairs(object) {
      var index = -1,
          props = keys(object),
          length = props.length,
          result = Array(length);

      while (++index < length) {
        var key = props[index];
        result[index] = [key, object[key]];
      }
      return result;
    }

    /**
     * Creates a shallow clone of `object` composed of the specified properties.
     * Property names may be specified as individual arguments or as arrays of
     * property names. If a callback is provided it will be executed for each
     * property of `object` picking the properties the callback returns truey
     * for. The callback is bound to `thisArg` and invoked with three arguments;
     * (value, key, object).
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The source object.
     * @param {Function|...string|string[]} [callback] The function called per
     *  iteration or property names to pick, specified as individual property
     *  names or arrays of property names.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Object} Returns an object composed of the picked properties.
     * @example
     *
     * _.pick({ 'name': 'fred', '_userid': 'fred1' }, 'name');
     * // => { 'name': 'fred' }
     *
     * _.pick({ 'name': 'fred', '_userid': 'fred1' }, function(value, key) {
     *   return key.charAt(0) != '_';
     * });
     * // => { 'name': 'fred' }
     */
    function pick(object, callback, thisArg) {
      var result = {};
      if (typeof callback != 'function') {
        var index = -1,
            props = baseFlatten(arguments, true, false, 1),
            length = isObject(object) ? props.length : 0;

        while (++index < length) {
          var key = props[index];
          if (key in object) {
            result[key] = object[key];
          }
        }
      } else {
        callback = lodash.createCallback(callback, thisArg, 3);
        forIn(object, function(value, key, object) {
          if (callback(value, key, object)) {
            result[key] = value;
          }
        });
      }
      return result;
    }

    /**
     * An alternative to `_.reduce` this method transforms `object` to a new
     * `accumulator` object which is the result of running each of its own
     * enumerable properties through a callback, with each callback execution
     * potentially mutating the `accumulator` object. The callback is bound to
     * `thisArg` and invoked with four arguments; (accumulator, value, key, object).
     * Callbacks may exit iteration early by explicitly returning `false`.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Array|Object} object The object to iterate over.
     * @param {Function} [callback=identity] The function called per iteration.
     * @param {*} [accumulator] The custom accumulator value.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {*} Returns the accumulated value.
     * @example
     *
     * var squares = _.transform([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], function(result, num) {
     *   num *= num;
     *   if (num % 2) {
     *     return result.push(num) < 3;
     *   }
     * });
     * // => [1, 9, 25]
     *
     * var mapped = _.transform({ 'a': 1, 'b': 2, 'c': 3 }, function(result, num, key) {
     *   result[key] = num * 3;
     * });
     * // => { 'a': 3, 'b': 6, 'c': 9 }
     */
    function transform(object, callback, accumulator, thisArg) {
      var isArr = isArray(object);
      if (accumulator == null) {
        if (isArr) {
          accumulator = [];
        } else {
          var ctor = object && object.constructor,
              proto = ctor && ctor.prototype;

          accumulator = baseCreate(proto);
        }
      }
      if (callback) {
        callback = lodash.createCallback(callback, thisArg, 4);
        (isArr ? forEach : forOwn)(object, function(value, index, object) {
          return callback(accumulator, value, index, object);
        });
      }
      return accumulator;
    }

    /**
     * Creates an array composed of the own enumerable property values of `object`.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The object to inspect.
     * @returns {Array} Returns an array of property values.
     * @example
     *
     * _.values({ 'one': 1, 'two': 2, 'three': 3 });
     * // => [1, 2, 3] (property order is not guaranteed across environments)
     */
    function values(object) {
      var index = -1,
          props = keys(object),
          length = props.length,
          result = Array(length);

      while (++index < length) {
        result[index] = object[props[index]];
      }
      return result;
    }

    /*--------------------------------------------------------------------------*/

    /**
     * Creates an array of elements from the specified indexes, or keys, of the
     * `collection`. Indexes may be specified as individual arguments or as arrays
     * of indexes.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {...(number|number[]|string|string[])} [index] The indexes of `collection`
     *   to retrieve, specified as individual indexes or arrays of indexes.
     * @returns {Array} Returns a new array of elements corresponding to the
     *  provided indexes.
     * @example
     *
     * _.at(['a', 'b', 'c', 'd', 'e'], [0, 2, 4]);
     * // => ['a', 'c', 'e']
     *
     * _.at(['fred', 'barney', 'pebbles'], 0, 2);
     * // => ['fred', 'pebbles']
     */
    function at(collection) {
      var args = arguments,
          index = -1,
          props = baseFlatten(args, true, false, 1),
          length = (args[2] && args[2][args[1]] === collection) ? 1 : props.length,
          result = Array(length);

      while(++index < length) {
        result[index] = collection[props[index]];
      }
      return result;
    }

    /**
     * Checks if a given value is present in a collection using strict equality
     * for comparisons, i.e. `===`. If `fromIndex` is negative, it is used as the
     * offset from the end of the collection.
     *
     * @static
     * @memberOf _
     * @alias include
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {*} target The value to check for.
     * @param {number} [fromIndex=0] The index to search from.
     * @returns {boolean} Returns `true` if the `target` element is found, else `false`.
     * @example
     *
     * _.contains([1, 2, 3], 1);
     * // => true
     *
     * _.contains([1, 2, 3], 1, 2);
     * // => false
     *
     * _.contains({ 'name': 'fred', 'age': 40 }, 'fred');
     * // => true
     *
     * _.contains('pebbles', 'eb');
     * // => true
     */
    function contains(collection, target, fromIndex) {
      var index = -1,
          indexOf = getIndexOf(),
          length = collection ? collection.length : 0,
          result = false;

      fromIndex = (fromIndex < 0 ? nativeMax(0, length + fromIndex) : fromIndex) || 0;
      if (isArray(collection)) {
        result = indexOf(collection, target, fromIndex) > -1;
      } else if (typeof length == 'number') {
        result = (isString(collection) ? collection.indexOf(target, fromIndex) : indexOf(collection, target, fromIndex)) > -1;
      } else {
        forOwn(collection, function(value) {
          if (++index >= fromIndex) {
            return !(result = value === target);
          }
        });
      }
      return result;
    }

    /**
     * Creates an object composed of keys generated from the results of running
     * each element of `collection` through the callback. The corresponding value
     * of each key is the number of times the key was returned by the callback.
     * The callback is bound to `thisArg` and invoked with three arguments;
     * (value, index|key, collection).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Object} Returns the composed aggregate object.
     * @example
     *
     * _.countBy([4.3, 6.1, 6.4], function(num) { return Math.floor(num); });
     * // => { '4': 1, '6': 2 }
     *
     * _.countBy([4.3, 6.1, 6.4], function(num) { return this.floor(num); }, Math);
     * // => { '4': 1, '6': 2 }
     *
     * _.countBy(['one', 'two', 'three'], 'length');
     * // => { '3': 2, '5': 1 }
     */
    var countBy = createAggregator(function(result, value, key) {
      (hasOwnProperty.call(result, key) ? result[key]++ : result[key] = 1);
    });

    /**
     * Checks if the given callback returns truey value for **all** elements of
     * a collection. The callback is bound to `thisArg` and invoked with three
     * arguments; (value, index|key, collection).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @alias all
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {boolean} Returns `true` if all elements passed the callback check,
     *  else `false`.
     * @example
     *
     * _.every([true, 1, null, 'yes']);
     * // => false
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 36 },
     *   { 'name': 'fred',   'age': 40 }
     * ];
     *
     * // using "_.pluck" callback shorthand
     * _.every(characters, 'age');
     * // => true
     *
     * // using "_.where" callback shorthand
     * _.every(characters, { 'age': 36 });
     * // => false
     */
    function every(collection, callback, thisArg) {
      var result = true;
      callback = lodash.createCallback(callback, thisArg, 3);

      var index = -1,
          length = collection ? collection.length : 0;

      if (typeof length == 'number') {
        while (++index < length) {
          if (!(result = !!callback(collection[index], index, collection))) {
            break;
          }
        }
      } else {
        forOwn(collection, function(value, index, collection) {
          return (result = !!callback(value, index, collection));
        });
      }
      return result;
    }

    /**
     * Iterates over elements of a collection, returning an array of all elements
     * the callback returns truey for. The callback is bound to `thisArg` and
     * invoked with three arguments; (value, index|key, collection).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @alias select
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array} Returns a new array of elements that passed the callback check.
     * @example
     *
     * var evens = _.filter([1, 2, 3, 4, 5, 6], function(num) { return num % 2 == 0; });
     * // => [2, 4, 6]
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 36, 'blocked': false },
     *   { 'name': 'fred',   'age': 40, 'blocked': true }
     * ];
     *
     * // using "_.pluck" callback shorthand
     * _.filter(characters, 'blocked');
     * // => [{ 'name': 'fred', 'age': 40, 'blocked': true }]
     *
     * // using "_.where" callback shorthand
     * _.filter(characters, { 'age': 36 });
     * // => [{ 'name': 'barney', 'age': 36, 'blocked': false }]
     */
    function filter(collection, callback, thisArg) {
      var result = [];
      callback = lodash.createCallback(callback, thisArg, 3);

      var index = -1,
          length = collection ? collection.length : 0;

      if (typeof length == 'number') {
        while (++index < length) {
          var value = collection[index];
          if (callback(value, index, collection)) {
            result.push(value);
          }
        }
      } else {
        forOwn(collection, function(value, index, collection) {
          if (callback(value, index, collection)) {
            result.push(value);
          }
        });
      }
      return result;
    }

    /**
     * Iterates over elements of a collection, returning the first element that
     * the callback returns truey for. The callback is bound to `thisArg` and
     * invoked with three arguments; (value, index|key, collection).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @alias detect, findWhere
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {*} Returns the found element, else `undefined`.
     * @example
     *
     * var characters = [
     *   { 'name': 'barney',  'age': 36, 'blocked': false },
     *   { 'name': 'fred',    'age': 40, 'blocked': true },
     *   { 'name': 'pebbles', 'age': 1,  'blocked': false }
     * ];
     *
     * _.find(characters, function(chr) {
     *   return chr.age < 40;
     * });
     * // => { 'name': 'barney', 'age': 36, 'blocked': false }
     *
     * // using "_.where" callback shorthand
     * _.find(characters, { 'age': 1 });
     * // =>  { 'name': 'pebbles', 'age': 1, 'blocked': false }
     *
     * // using "_.pluck" callback shorthand
     * _.find(characters, 'blocked');
     * // => { 'name': 'fred', 'age': 40, 'blocked': true }
     */
    function find(collection, callback, thisArg) {
      callback = lodash.createCallback(callback, thisArg, 3);

      var index = -1,
          length = collection ? collection.length : 0;

      if (typeof length == 'number') {
        while (++index < length) {
          var value = collection[index];
          if (callback(value, index, collection)) {
            return value;
          }
        }
      } else {
        var result;
        forOwn(collection, function(value, index, collection) {
          if (callback(value, index, collection)) {
            result = value;
            return false;
          }
        });
        return result;
      }
    }

    /**
     * This method is like `_.find` except that it iterates over elements
     * of a `collection` from right to left.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {*} Returns the found element, else `undefined`.
     * @example
     *
     * _.findLast([1, 2, 3, 4], function(num) {
     *   return num % 2 == 1;
     * });
     * // => 3
     */
    function findLast(collection, callback, thisArg) {
      var result;
      callback = lodash.createCallback(callback, thisArg, 3);
      forEachRight(collection, function(value, index, collection) {
        if (callback(value, index, collection)) {
          result = value;
          return false;
        }
      });
      return result;
    }

    /**
     * Iterates over elements of a collection, executing the callback for each
     * element. The callback is bound to `thisArg` and invoked with three arguments;
     * (value, index|key, collection). Callbacks may exit iteration early by
     * explicitly returning `false`.
     *
     * Note: As with other "Collections" methods, objects with a `length` property
     * are iterated like arrays. To avoid this behavior `_.forIn` or `_.forOwn`
     * may be used for object iteration.
     *
     * @static
     * @memberOf _
     * @alias each
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function} [callback=identity] The function called per iteration.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array|Object|string} Returns `collection`.
     * @example
     *
     * _([1, 2, 3]).forEach(function(num) { console.log(num); }).join(',');
     * // => logs each number and returns '1,2,3'
     *
     * _.forEach({ 'one': 1, 'two': 2, 'three': 3 }, function(num) { console.log(num); });
     * // => logs each number and returns the object (property order is not guaranteed across environments)
     */
    function forEach(collection, callback, thisArg) {
      var index = -1,
          length = collection ? collection.length : 0;

      callback = callback && typeof thisArg == 'undefined' ? callback : baseCreateCallback(callback, thisArg, 3);
      if (typeof length == 'number') {
        while (++index < length) {
          if (callback(collection[index], index, collection) === false) {
            break;
          }
        }
      } else {
        forOwn(collection, callback);
      }
      return collection;
    }

    /**
     * This method is like `_.forEach` except that it iterates over elements
     * of a `collection` from right to left.
     *
     * @static
     * @memberOf _
     * @alias eachRight
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function} [callback=identity] The function called per iteration.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array|Object|string} Returns `collection`.
     * @example
     *
     * _([1, 2, 3]).forEachRight(function(num) { console.log(num); }).join(',');
     * // => logs each number from right to left and returns '3,2,1'
     */
    function forEachRight(collection, callback, thisArg) {
      var length = collection ? collection.length : 0;
      callback = callback && typeof thisArg == 'undefined' ? callback : baseCreateCallback(callback, thisArg, 3);
      if (typeof length == 'number') {
        while (length--) {
          if (callback(collection[length], length, collection) === false) {
            break;
          }
        }
      } else {
        var props = keys(collection);
        length = props.length;
        forOwn(collection, function(value, key, collection) {
          key = props ? props[--length] : --length;
          return callback(collection[key], key, collection);
        });
      }
      return collection;
    }

    /**
     * Creates an object composed of keys generated from the results of running
     * each element of a collection through the callback. The corresponding value
     * of each key is an array of the elements responsible for generating the key.
     * The callback is bound to `thisArg` and invoked with three arguments;
     * (value, index|key, collection).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Object} Returns the composed aggregate object.
     * @example
     *
     * _.groupBy([4.2, 6.1, 6.4], function(num) { return Math.floor(num); });
     * // => { '4': [4.2], '6': [6.1, 6.4] }
     *
     * _.groupBy([4.2, 6.1, 6.4], function(num) { return this.floor(num); }, Math);
     * // => { '4': [4.2], '6': [6.1, 6.4] }
     *
     * // using "_.pluck" callback shorthand
     * _.groupBy(['one', 'two', 'three'], 'length');
     * // => { '3': ['one', 'two'], '5': ['three'] }
     */
    var groupBy = createAggregator(function(result, value, key) {
      (hasOwnProperty.call(result, key) ? result[key] : result[key] = []).push(value);
    });

    /**
     * Creates an object composed of keys generated from the results of running
     * each element of the collection through the given callback. The corresponding
     * value of each key is the last element responsible for generating the key.
     * The callback is bound to `thisArg` and invoked with three arguments;
     * (value, index|key, collection).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Object} Returns the composed aggregate object.
     * @example
     *
     * var keys = [
     *   { 'dir': 'left', 'code': 97 },
     *   { 'dir': 'right', 'code': 100 }
     * ];
     *
     * _.indexBy(keys, 'dir');
     * // => { 'left': { 'dir': 'left', 'code': 97 }, 'right': { 'dir': 'right', 'code': 100 } }
     *
     * _.indexBy(keys, function(key) { return String.fromCharCode(key.code); });
     * // => { 'a': { 'dir': 'left', 'code': 97 }, 'd': { 'dir': 'right', 'code': 100 } }
     *
     * _.indexBy(characters, function(key) { this.fromCharCode(key.code); }, String);
     * // => { 'a': { 'dir': 'left', 'code': 97 }, 'd': { 'dir': 'right', 'code': 100 } }
     */
    var indexBy = createAggregator(function(result, value, key) {
      result[key] = value;
    });

    /**
     * Invokes the method named by `methodName` on each element in the `collection`
     * returning an array of the results of each invoked method. Additional arguments
     * will be provided to each invoked method. If `methodName` is a function it
     * will be invoked for, and `this` bound to, each element in the `collection`.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|string} methodName The name of the method to invoke or
     *  the function invoked per iteration.
     * @param {...*} [arg] Arguments to invoke the method with.
     * @returns {Array} Returns a new array of the results of each invoked method.
     * @example
     *
     * _.invoke([[5, 1, 7], [3, 2, 1]], 'sort');
     * // => [[1, 5, 7], [1, 2, 3]]
     *
     * _.invoke([123, 456], String.prototype.split, '');
     * // => [['1', '2', '3'], ['4', '5', '6']]
     */
    function invoke(collection, methodName) {
      var args = slice(arguments, 2),
          index = -1,
          isFunc = typeof methodName == 'function',
          length = collection ? collection.length : 0,
          result = Array(typeof length == 'number' ? length : 0);

      forEach(collection, function(value) {
        result[++index] = (isFunc ? methodName : value[methodName]).apply(value, args);
      });
      return result;
    }

    /**
     * Creates an array of values by running each element in the collection
     * through the callback. The callback is bound to `thisArg` and invoked with
     * three arguments; (value, index|key, collection).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @alias collect
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array} Returns a new array of the results of each `callback` execution.
     * @example
     *
     * _.map([1, 2, 3], function(num) { return num * 3; });
     * // => [3, 6, 9]
     *
     * _.map({ 'one': 1, 'two': 2, 'three': 3 }, function(num) { return num * 3; });
     * // => [3, 6, 9] (property order is not guaranteed across environments)
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 36 },
     *   { 'name': 'fred',   'age': 40 }
     * ];
     *
     * // using "_.pluck" callback shorthand
     * _.map(characters, 'name');
     * // => ['barney', 'fred']
     */
    function map(collection, callback, thisArg) {
      var index = -1,
          length = collection ? collection.length : 0;

      callback = lodash.createCallback(callback, thisArg, 3);
      if (typeof length == 'number') {
        var result = Array(length);
        while (++index < length) {
          result[index] = callback(collection[index], index, collection);
        }
      } else {
        result = [];
        forOwn(collection, function(value, key, collection) {
          result[++index] = callback(value, key, collection);
        });
      }
      return result;
    }

    /**
     * Retrieves the maximum value of a collection. If the collection is empty or
     * falsey `-Infinity` is returned. If a callback is provided it will be executed
     * for each value in the collection to generate the criterion by which the value
     * is ranked. The callback is bound to `thisArg` and invoked with three
     * arguments; (value, index, collection).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {*} Returns the maximum value.
     * @example
     *
     * _.max([4, 2, 8, 6]);
     * // => 8
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 36 },
     *   { 'name': 'fred',   'age': 40 }
     * ];
     *
     * _.max(characters, function(chr) { return chr.age; });
     * // => { 'name': 'fred', 'age': 40 };
     *
     * // using "_.pluck" callback shorthand
     * _.max(characters, 'age');
     * // => { 'name': 'fred', 'age': 40 };
     */
    function max(collection, callback, thisArg) {
      var computed = -Infinity,
          result = computed;

      // allows working with functions like `_.map` without using
      // their `index` argument as a callback
      if (typeof callback != 'function' && thisArg && thisArg[callback] === collection) {
        callback = null;
      }
      if (callback == null && isArray(collection)) {
        var index = -1,
            length = collection.length;

        while (++index < length) {
          var value = collection[index];
          if (value > result) {
            result = value;
          }
        }
      } else {
        callback = (callback == null && isString(collection))
          ? charAtCallback
          : lodash.createCallback(callback, thisArg, 3);

        forEach(collection, function(value, index, collection) {
          var current = callback(value, index, collection);
          if (current > computed) {
            computed = current;
            result = value;
          }
        });
      }
      return result;
    }

    /**
     * Retrieves the minimum value of a collection. If the collection is empty or
     * falsey `Infinity` is returned. If a callback is provided it will be executed
     * for each value in the collection to generate the criterion by which the value
     * is ranked. The callback is bound to `thisArg` and invoked with three
     * arguments; (value, index, collection).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {*} Returns the minimum value.
     * @example
     *
     * _.min([4, 2, 8, 6]);
     * // => 2
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 36 },
     *   { 'name': 'fred',   'age': 40 }
     * ];
     *
     * _.min(characters, function(chr) { return chr.age; });
     * // => { 'name': 'barney', 'age': 36 };
     *
     * // using "_.pluck" callback shorthand
     * _.min(characters, 'age');
     * // => { 'name': 'barney', 'age': 36 };
     */
    function min(collection, callback, thisArg) {
      var computed = Infinity,
          result = computed;

      // allows working with functions like `_.map` without using
      // their `index` argument as a callback
      if (typeof callback != 'function' && thisArg && thisArg[callback] === collection) {
        callback = null;
      }
      if (callback == null && isArray(collection)) {
        var index = -1,
            length = collection.length;

        while (++index < length) {
          var value = collection[index];
          if (value < result) {
            result = value;
          }
        }
      } else {
        callback = (callback == null && isString(collection))
          ? charAtCallback
          : lodash.createCallback(callback, thisArg, 3);

        forEach(collection, function(value, index, collection) {
          var current = callback(value, index, collection);
          if (current < computed) {
            computed = current;
            result = value;
          }
        });
      }
      return result;
    }

    /**
     * Retrieves the value of a specified property from all elements in the collection.
     *
     * @static
     * @memberOf _
     * @type Function
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {string} property The name of the property to pluck.
     * @returns {Array} Returns a new array of property values.
     * @example
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 36 },
     *   { 'name': 'fred',   'age': 40 }
     * ];
     *
     * _.pluck(characters, 'name');
     * // => ['barney', 'fred']
     */
    var pluck = map;

    /**
     * Reduces a collection to a value which is the accumulated result of running
     * each element in the collection through the callback, where each successive
     * callback execution consumes the return value of the previous execution. If
     * `accumulator` is not provided the first element of the collection will be
     * used as the initial `accumulator` value. The callback is bound to `thisArg`
     * and invoked with four arguments; (accumulator, value, index|key, collection).
     *
     * @static
     * @memberOf _
     * @alias foldl, inject
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function} [callback=identity] The function called per iteration.
     * @param {*} [accumulator] Initial value of the accumulator.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {*} Returns the accumulated value.
     * @example
     *
     * var sum = _.reduce([1, 2, 3], function(sum, num) {
     *   return sum + num;
     * });
     * // => 6
     *
     * var mapped = _.reduce({ 'a': 1, 'b': 2, 'c': 3 }, function(result, num, key) {
     *   result[key] = num * 3;
     *   return result;
     * }, {});
     * // => { 'a': 3, 'b': 6, 'c': 9 }
     */
    function reduce(collection, callback, accumulator, thisArg) {
      if (!collection) return accumulator;
      var noaccum = arguments.length < 3;
      callback = lodash.createCallback(callback, thisArg, 4);

      var index = -1,
          length = collection.length;

      if (typeof length == 'number') {
        if (noaccum) {
          accumulator = collection[++index];
        }
        while (++index < length) {
          accumulator = callback(accumulator, collection[index], index, collection);
        }
      } else {
        forOwn(collection, function(value, index, collection) {
          accumulator = noaccum
            ? (noaccum = false, value)
            : callback(accumulator, value, index, collection)
        });
      }
      return accumulator;
    }

    /**
     * This method is like `_.reduce` except that it iterates over elements
     * of a `collection` from right to left.
     *
     * @static
     * @memberOf _
     * @alias foldr
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function} [callback=identity] The function called per iteration.
     * @param {*} [accumulator] Initial value of the accumulator.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {*} Returns the accumulated value.
     * @example
     *
     * var list = [[0, 1], [2, 3], [4, 5]];
     * var flat = _.reduceRight(list, function(a, b) { return a.concat(b); }, []);
     * // => [4, 5, 2, 3, 0, 1]
     */
    function reduceRight(collection, callback, accumulator, thisArg) {
      var noaccum = arguments.length < 3;
      callback = lodash.createCallback(callback, thisArg, 4);
      forEachRight(collection, function(value, index, collection) {
        accumulator = noaccum
          ? (noaccum = false, value)
          : callback(accumulator, value, index, collection);
      });
      return accumulator;
    }

    /**
     * The opposite of `_.filter` this method returns the elements of a
     * collection that the callback does **not** return truey for.
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array} Returns a new array of elements that failed the callback check.
     * @example
     *
     * var odds = _.reject([1, 2, 3, 4, 5, 6], function(num) { return num % 2 == 0; });
     * // => [1, 3, 5]
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 36, 'blocked': false },
     *   { 'name': 'fred',   'age': 40, 'blocked': true }
     * ];
     *
     * // using "_.pluck" callback shorthand
     * _.reject(characters, 'blocked');
     * // => [{ 'name': 'barney', 'age': 36, 'blocked': false }]
     *
     * // using "_.where" callback shorthand
     * _.reject(characters, { 'age': 36 });
     * // => [{ 'name': 'fred', 'age': 40, 'blocked': true }]
     */
    function reject(collection, callback, thisArg) {
      callback = lodash.createCallback(callback, thisArg, 3);
      return filter(collection, function(value, index, collection) {
        return !callback(value, index, collection);
      });
    }

    /**
     * Retrieves a random element or `n` random elements from a collection.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to sample.
     * @param {number} [n] The number of elements to sample.
     * @param- {Object} [guard] Allows working with functions like `_.map`
     *  without using their `index` arguments as `n`.
     * @returns {Array} Returns the random sample(s) of `collection`.
     * @example
     *
     * _.sample([1, 2, 3, 4]);
     * // => 2
     *
     * _.sample([1, 2, 3, 4], 2);
     * // => [3, 1]
     */
    function sample(collection, n, guard) {
      if (collection && typeof collection.length != 'number') {
        collection = values(collection);
      }
      if (n == null || guard) {
        return collection ? collection[baseRandom(0, collection.length - 1)] : undefined;
      }
      var result = shuffle(collection);
      result.length = nativeMin(nativeMax(0, n), result.length);
      return result;
    }

    /**
     * Creates an array of shuffled values, using a version of the Fisher-Yates
     * shuffle. See http://en.wikipedia.org/wiki/Fisher-Yates_shuffle.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to shuffle.
     * @returns {Array} Returns a new shuffled collection.
     * @example
     *
     * _.shuffle([1, 2, 3, 4, 5, 6]);
     * // => [4, 1, 6, 3, 5, 2]
     */
    function shuffle(collection) {
      var index = -1,
          length = collection ? collection.length : 0,
          result = Array(typeof length == 'number' ? length : 0);

      forEach(collection, function(value) {
        var rand = baseRandom(0, ++index);
        result[index] = result[rand];
        result[rand] = value;
      });
      return result;
    }

    /**
     * Gets the size of the `collection` by returning `collection.length` for arrays
     * and array-like objects or the number of own enumerable properties for objects.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to inspect.
     * @returns {number} Returns `collection.length` or number of own enumerable properties.
     * @example
     *
     * _.size([1, 2]);
     * // => 2
     *
     * _.size({ 'one': 1, 'two': 2, 'three': 3 });
     * // => 3
     *
     * _.size('pebbles');
     * // => 7
     */
    function size(collection) {
      var length = collection ? collection.length : 0;
      return typeof length == 'number' ? length : keys(collection).length;
    }

    /**
     * Checks if the callback returns a truey value for **any** element of a
     * collection. The function returns as soon as it finds a passing value and
     * does not iterate over the entire collection. The callback is bound to
     * `thisArg` and invoked with three arguments; (value, index|key, collection).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @alias any
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {boolean} Returns `true` if any element passed the callback check,
     *  else `false`.
     * @example
     *
     * _.some([null, 0, 'yes', false], Boolean);
     * // => true
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 36, 'blocked': false },
     *   { 'name': 'fred',   'age': 40, 'blocked': true }
     * ];
     *
     * // using "_.pluck" callback shorthand
     * _.some(characters, 'blocked');
     * // => true
     *
     * // using "_.where" callback shorthand
     * _.some(characters, { 'age': 1 });
     * // => false
     */
    function some(collection, callback, thisArg) {
      var result;
      callback = lodash.createCallback(callback, thisArg, 3);

      var index = -1,
          length = collection ? collection.length : 0;

      if (typeof length == 'number') {
        while (++index < length) {
          if ((result = callback(collection[index], index, collection))) {
            break;
          }
        }
      } else {
        forOwn(collection, function(value, index, collection) {
          return !(result = callback(value, index, collection));
        });
      }
      return !!result;
    }

    /**
     * Creates an array of elements, sorted in ascending order by the results of
     * running each element in a collection through the callback. This method
     * performs a stable sort, that is, it will preserve the original sort order
     * of equal elements. The callback is bound to `thisArg` and invoked with
     * three arguments; (value, index|key, collection).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an array of property names is provided for `callback` the collection
     * will be sorted by each property value.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Array|Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array} Returns a new array of sorted elements.
     * @example
     *
     * _.sortBy([1, 2, 3], function(num) { return Math.sin(num); });
     * // => [3, 1, 2]
     *
     * _.sortBy([1, 2, 3], function(num) { return this.sin(num); }, Math);
     * // => [3, 1, 2]
     *
     * var characters = [
     *   { 'name': 'barney',  'age': 36 },
     *   { 'name': 'fred',    'age': 40 },
     *   { 'name': 'barney',  'age': 26 },
     *   { 'name': 'fred',    'age': 30 }
     * ];
     *
     * // using "_.pluck" callback shorthand
     * _.map(_.sortBy(characters, 'age'), _.values);
     * // => [['barney', 26], ['fred', 30], ['barney', 36], ['fred', 40]]
     *
     * // sorting by multiple properties
     * _.map(_.sortBy(characters, ['name', 'age']), _.values);
     * // = > [['barney', 26], ['barney', 36], ['fred', 30], ['fred', 40]]
     */
    function sortBy(collection, callback, thisArg) {
      var index = -1,
          isArr = isArray(callback),
          length = collection ? collection.length : 0,
          result = Array(typeof length == 'number' ? length : 0);

      if (!isArr) {
        callback = lodash.createCallback(callback, thisArg, 3);
      }
      forEach(collection, function(value, key, collection) {
        var object = result[++index] = getObject();
        if (isArr) {
          object.criteria = map(callback, function(key) { return value[key]; });
        } else {
          (object.criteria = getArray())[0] = callback(value, key, collection);
        }
        object.index = index;
        object.value = value;
      });

      length = result.length;
      result.sort(compareAscending);
      while (length--) {
        var object = result[length];
        result[length] = object.value;
        if (!isArr) {
          releaseArray(object.criteria);
        }
        releaseObject(object);
      }
      return result;
    }

    /**
     * Converts the `collection` to an array.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to convert.
     * @returns {Array} Returns the new converted array.
     * @example
     *
     * (function() { return _.toArray(arguments).slice(1); })(1, 2, 3, 4);
     * // => [2, 3, 4]
     */
    function toArray(collection) {
      if (collection && typeof collection.length == 'number') {
        return slice(collection);
      }
      return values(collection);
    }

    /**
     * Performs a deep comparison of each element in a `collection` to the given
     * `properties` object, returning an array of all elements that have equivalent
     * property values.
     *
     * @static
     * @memberOf _
     * @type Function
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Object} props The object of property values to filter by.
     * @returns {Array} Returns a new array of elements that have the given properties.
     * @example
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 36, 'pets': ['hoppy'] },
     *   { 'name': 'fred',   'age': 40, 'pets': ['baby puss', 'dino'] }
     * ];
     *
     * _.where(characters, { 'age': 36 });
     * // => [{ 'name': 'barney', 'age': 36, 'pets': ['hoppy'] }]
     *
     * _.where(characters, { 'pets': ['dino'] });
     * // => [{ 'name': 'fred', 'age': 40, 'pets': ['baby puss', 'dino'] }]
     */
    var where = filter;

    /*--------------------------------------------------------------------------*/

    /**
     * Creates an array with all falsey values removed. The values `false`, `null`,
     * `0`, `""`, `undefined`, and `NaN` are all falsey.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to compact.
     * @returns {Array} Returns a new array of filtered values.
     * @example
     *
     * _.compact([0, 1, false, 2, '', 3]);
     * // => [1, 2, 3]
     */
    function compact(array) {
      var index = -1,
          length = array ? array.length : 0,
          result = [];

      while (++index < length) {
        var value = array[index];
        if (value) {
          result.push(value);
        }
      }
      return result;
    }

    /**
     * Creates an array excluding all values of the provided arrays using strict
     * equality for comparisons, i.e. `===`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to process.
     * @param {...Array} [values] The arrays of values to exclude.
     * @returns {Array} Returns a new array of filtered values.
     * @example
     *
     * _.difference([1, 2, 3, 4, 5], [5, 2, 10]);
     * // => [1, 3, 4]
     */
    function difference(array) {
      return baseDifference(array, baseFlatten(arguments, true, true, 1));
    }

    /**
     * This method is like `_.find` except that it returns the index of the first
     * element that passes the callback check, instead of the element itself.
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to search.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {number} Returns the index of the found element, else `-1`.
     * @example
     *
     * var characters = [
     *   { 'name': 'barney',  'age': 36, 'blocked': false },
     *   { 'name': 'fred',    'age': 40, 'blocked': true },
     *   { 'name': 'pebbles', 'age': 1,  'blocked': false }
     * ];
     *
     * _.findIndex(characters, function(chr) {
     *   return chr.age < 20;
     * });
     * // => 2
     *
     * // using "_.where" callback shorthand
     * _.findIndex(characters, { 'age': 36 });
     * // => 0
     *
     * // using "_.pluck" callback shorthand
     * _.findIndex(characters, 'blocked');
     * // => 1
     */
    function findIndex(array, callback, thisArg) {
      var index = -1,
          length = array ? array.length : 0;

      callback = lodash.createCallback(callback, thisArg, 3);
      while (++index < length) {
        if (callback(array[index], index, array)) {
          return index;
        }
      }
      return -1;
    }

    /**
     * This method is like `_.findIndex` except that it iterates over elements
     * of a `collection` from right to left.
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to search.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {number} Returns the index of the found element, else `-1`.
     * @example
     *
     * var characters = [
     *   { 'name': 'barney',  'age': 36, 'blocked': true },
     *   { 'name': 'fred',    'age': 40, 'blocked': false },
     *   { 'name': 'pebbles', 'age': 1,  'blocked': true }
     * ];
     *
     * _.findLastIndex(characters, function(chr) {
     *   return chr.age > 30;
     * });
     * // => 1
     *
     * // using "_.where" callback shorthand
     * _.findLastIndex(characters, { 'age': 36 });
     * // => 0
     *
     * // using "_.pluck" callback shorthand
     * _.findLastIndex(characters, 'blocked');
     * // => 2
     */
    function findLastIndex(array, callback, thisArg) {
      var length = array ? array.length : 0;
      callback = lodash.createCallback(callback, thisArg, 3);
      while (length--) {
        if (callback(array[length], length, array)) {
          return length;
        }
      }
      return -1;
    }

    /**
     * Gets the first element or first `n` elements of an array. If a callback
     * is provided elements at the beginning of the array are returned as long
     * as the callback returns truey. The callback is bound to `thisArg` and
     * invoked with three arguments; (value, index, array).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @alias head, take
     * @category Arrays
     * @param {Array} array The array to query.
     * @param {Function|Object|number|string} [callback] The function called
     *  per element or the number of elements to return. If a property name or
     *  object is provided it will be used to create a "_.pluck" or "_.where"
     *  style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {*} Returns the first element(s) of `array`.
     * @example
     *
     * _.first([1, 2, 3]);
     * // => 1
     *
     * _.first([1, 2, 3], 2);
     * // => [1, 2]
     *
     * _.first([1, 2, 3], function(num) {
     *   return num < 3;
     * });
     * // => [1, 2]
     *
     * var characters = [
     *   { 'name': 'barney',  'blocked': true,  'employer': 'slate' },
     *   { 'name': 'fred',    'blocked': false, 'employer': 'slate' },
     *   { 'name': 'pebbles', 'blocked': true,  'employer': 'na' }
     * ];
     *
     * // using "_.pluck" callback shorthand
     * _.first(characters, 'blocked');
     * // => [{ 'name': 'barney', 'blocked': true, 'employer': 'slate' }]
     *
     * // using "_.where" callback shorthand
     * _.pluck(_.first(characters, { 'employer': 'slate' }), 'name');
     * // => ['barney', 'fred']
     */
    function first(array, callback, thisArg) {
      var n = 0,
          length = array ? array.length : 0;

      if (typeof callback != 'number' && callback != null) {
        var index = -1;
        callback = lodash.createCallback(callback, thisArg, 3);
        while (++index < length && callback(array[index], index, array)) {
          n++;
        }
      } else {
        n = callback;
        if (n == null || thisArg) {
          return array ? array[0] : undefined;
        }
      }
      return slice(array, 0, nativeMin(nativeMax(0, n), length));
    }

    /**
     * Flattens a nested array (the nesting can be to any depth). If `isShallow`
     * is truey, the array will only be flattened a single level. If a callback
     * is provided each element of the array is passed through the callback before
     * flattening. The callback is bound to `thisArg` and invoked with three
     * arguments; (value, index, array).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to flatten.
     * @param {boolean} [isShallow=false] A flag to restrict flattening to a single level.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array} Returns a new flattened array.
     * @example
     *
     * _.flatten([1, [2], [3, [[4]]]]);
     * // => [1, 2, 3, 4];
     *
     * _.flatten([1, [2], [3, [[4]]]], true);
     * // => [1, 2, 3, [[4]]];
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 30, 'pets': ['hoppy'] },
     *   { 'name': 'fred',   'age': 40, 'pets': ['baby puss', 'dino'] }
     * ];
     *
     * // using "_.pluck" callback shorthand
     * _.flatten(characters, 'pets');
     * // => ['hoppy', 'baby puss', 'dino']
     */
    function flatten(array, isShallow, callback, thisArg) {
      // juggle arguments
      if (typeof isShallow != 'boolean' && isShallow != null) {
        thisArg = callback;
        callback = (typeof isShallow != 'function' && thisArg && thisArg[isShallow] === array) ? null : isShallow;
        isShallow = false;
      }
      if (callback != null) {
        array = map(array, callback, thisArg);
      }
      return baseFlatten(array, isShallow);
    }

    /**
     * Gets the index at which the first occurrence of `value` is found using
     * strict equality for comparisons, i.e. `===`. If the array is already sorted
     * providing `true` for `fromIndex` will run a faster binary search.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to search.
     * @param {*} value The value to search for.
     * @param {boolean|number} [fromIndex=0] The index to search from or `true`
     *  to perform a binary search on a sorted array.
     * @returns {number} Returns the index of the matched value or `-1`.
     * @example
     *
     * _.indexOf([1, 2, 3, 1, 2, 3], 2);
     * // => 1
     *
     * _.indexOf([1, 2, 3, 1, 2, 3], 2, 3);
     * // => 4
     *
     * _.indexOf([1, 1, 2, 2, 3, 3], 2, true);
     * // => 2
     */
    function indexOf(array, value, fromIndex) {
      if (typeof fromIndex == 'number') {
        var length = array ? array.length : 0;
        fromIndex = (fromIndex < 0 ? nativeMax(0, length + fromIndex) : fromIndex || 0);
      } else if (fromIndex) {
        var index = sortedIndex(array, value);
        return array[index] === value ? index : -1;
      }
      return baseIndexOf(array, value, fromIndex);
    }

    /**
     * Gets all but the last element or last `n` elements of an array. If a
     * callback is provided elements at the end of the array are excluded from
     * the result as long as the callback returns truey. The callback is bound
     * to `thisArg` and invoked with three arguments; (value, index, array).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to query.
     * @param {Function|Object|number|string} [callback=1] The function called
     *  per element or the number of elements to exclude. If a property name or
     *  object is provided it will be used to create a "_.pluck" or "_.where"
     *  style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array} Returns a slice of `array`.
     * @example
     *
     * _.initial([1, 2, 3]);
     * // => [1, 2]
     *
     * _.initial([1, 2, 3], 2);
     * // => [1]
     *
     * _.initial([1, 2, 3], function(num) {
     *   return num > 1;
     * });
     * // => [1]
     *
     * var characters = [
     *   { 'name': 'barney',  'blocked': false, 'employer': 'slate' },
     *   { 'name': 'fred',    'blocked': true,  'employer': 'slate' },
     *   { 'name': 'pebbles', 'blocked': true,  'employer': 'na' }
     * ];
     *
     * // using "_.pluck" callback shorthand
     * _.initial(characters, 'blocked');
     * // => [{ 'name': 'barney',  'blocked': false, 'employer': 'slate' }]
     *
     * // using "_.where" callback shorthand
     * _.pluck(_.initial(characters, { 'employer': 'na' }), 'name');
     * // => ['barney', 'fred']
     */
    function initial(array, callback, thisArg) {
      var n = 0,
          length = array ? array.length : 0;

      if (typeof callback != 'number' && callback != null) {
        var index = length;
        callback = lodash.createCallback(callback, thisArg, 3);
        while (index-- && callback(array[index], index, array)) {
          n++;
        }
      } else {
        n = (callback == null || thisArg) ? 1 : callback || n;
      }
      return slice(array, 0, nativeMin(nativeMax(0, length - n), length));
    }

    /**
     * Creates an array of unique values present in all provided arrays using
     * strict equality for comparisons, i.e. `===`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {...Array} [array] The arrays to inspect.
     * @returns {Array} Returns an array of shared values.
     * @example
     *
     * _.intersection([1, 2, 3], [5, 2, 1, 4], [2, 1]);
     * // => [1, 2]
     */
    function intersection() {
      var args = [],
          argsIndex = -1,
          argsLength = arguments.length,
          caches = getArray(),
          indexOf = getIndexOf(),
          trustIndexOf = indexOf === baseIndexOf,
          seen = getArray();

      while (++argsIndex < argsLength) {
        var value = arguments[argsIndex];
        if (isArray(value) || isArguments(value)) {
          args.push(value);
          caches.push(trustIndexOf && value.length >= largeArraySize &&
            createCache(argsIndex ? args[argsIndex] : seen));
        }
      }
      var array = args[0],
          index = -1,
          length = array ? array.length : 0,
          result = [];

      outer:
      while (++index < length) {
        var cache = caches[0];
        value = array[index];

        if ((cache ? cacheIndexOf(cache, value) : indexOf(seen, value)) < 0) {
          argsIndex = argsLength;
          (cache || seen).push(value);
          while (--argsIndex) {
            cache = caches[argsIndex];
            if ((cache ? cacheIndexOf(cache, value) : indexOf(args[argsIndex], value)) < 0) {
              continue outer;
            }
          }
          result.push(value);
        }
      }
      while (argsLength--) {
        cache = caches[argsLength];
        if (cache) {
          releaseObject(cache);
        }
      }
      releaseArray(caches);
      releaseArray(seen);
      return result;
    }

    /**
     * Gets the last element or last `n` elements of an array. If a callback is
     * provided elements at the end of the array are returned as long as the
     * callback returns truey. The callback is bound to `thisArg` and invoked
     * with three arguments; (value, index, array).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to query.
     * @param {Function|Object|number|string} [callback] The function called
     *  per element or the number of elements to return. If a property name or
     *  object is provided it will be used to create a "_.pluck" or "_.where"
     *  style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {*} Returns the last element(s) of `array`.
     * @example
     *
     * _.last([1, 2, 3]);
     * // => 3
     *
     * _.last([1, 2, 3], 2);
     * // => [2, 3]
     *
     * _.last([1, 2, 3], function(num) {
     *   return num > 1;
     * });
     * // => [2, 3]
     *
     * var characters = [
     *   { 'name': 'barney',  'blocked': false, 'employer': 'slate' },
     *   { 'name': 'fred',    'blocked': true,  'employer': 'slate' },
     *   { 'name': 'pebbles', 'blocked': true,  'employer': 'na' }
     * ];
     *
     * // using "_.pluck" callback shorthand
     * _.pluck(_.last(characters, 'blocked'), 'name');
     * // => ['fred', 'pebbles']
     *
     * // using "_.where" callback shorthand
     * _.last(characters, { 'employer': 'na' });
     * // => [{ 'name': 'pebbles', 'blocked': true, 'employer': 'na' }]
     */
    function last(array, callback, thisArg) {
      var n = 0,
          length = array ? array.length : 0;

      if (typeof callback != 'number' && callback != null) {
        var index = length;
        callback = lodash.createCallback(callback, thisArg, 3);
        while (index-- && callback(array[index], index, array)) {
          n++;
        }
      } else {
        n = callback;
        if (n == null || thisArg) {
          return array ? array[length - 1] : undefined;
        }
      }
      return slice(array, nativeMax(0, length - n));
    }

    /**
     * Gets the index at which the last occurrence of `value` is found using strict
     * equality for comparisons, i.e. `===`. If `fromIndex` is negative, it is used
     * as the offset from the end of the collection.
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to search.
     * @param {*} value The value to search for.
     * @param {number} [fromIndex=array.length-1] The index to search from.
     * @returns {number} Returns the index of the matched value or `-1`.
     * @example
     *
     * _.lastIndexOf([1, 2, 3, 1, 2, 3], 2);
     * // => 4
     *
     * _.lastIndexOf([1, 2, 3, 1, 2, 3], 2, 3);
     * // => 1
     */
    function lastIndexOf(array, value, fromIndex) {
      var index = array ? array.length : 0;
      if (typeof fromIndex == 'number') {
        index = (fromIndex < 0 ? nativeMax(0, index + fromIndex) : nativeMin(fromIndex, index - 1)) + 1;
      }
      while (index--) {
        if (array[index] === value) {
          return index;
        }
      }
      return -1;
    }

    /**
     * Removes all provided values from the given array using strict equality for
     * comparisons, i.e. `===`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to modify.
     * @param {...*} [value] The values to remove.
     * @returns {Array} Returns `array`.
     * @example
     *
     * var array = [1, 2, 3, 1, 2, 3];
     * _.pull(array, 2, 3);
     * console.log(array);
     * // => [1, 1]
     */
    function pull(array) {
      var args = arguments,
          argsIndex = 0,
          argsLength = args.length,
          length = array ? array.length : 0;

      while (++argsIndex < argsLength) {
        var index = -1,
            value = args[argsIndex];
        while (++index < length) {
          if (array[index] === value) {
            splice.call(array, index--, 1);
            length--;
          }
        }
      }
      return array;
    }

    /**
     * Creates an array of numbers (positive and/or negative) progressing from
     * `start` up to but not including `end`. If `start` is less than `stop` a
     * zero-length range is created unless a negative `step` is specified.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {number} [start=0] The start of the range.
     * @param {number} end The end of the range.
     * @param {number} [step=1] The value to increment or decrement by.
     * @returns {Array} Returns a new range array.
     * @example
     *
     * _.range(4);
     * // => [0, 1, 2, 3]
     *
     * _.range(1, 5);
     * // => [1, 2, 3, 4]
     *
     * _.range(0, 20, 5);
     * // => [0, 5, 10, 15]
     *
     * _.range(0, -4, -1);
     * // => [0, -1, -2, -3]
     *
     * _.range(1, 4, 0);
     * // => [1, 1, 1]
     *
     * _.range(0);
     * // => []
     */
    function range(start, end, step) {
      start = +start || 0;
      step = typeof step == 'number' ? step : (+step || 1);

      if (end == null) {
        end = start;
        start = 0;
      }
      // use `Array(length)` so engines like Chakra and V8 avoid slower modes
      // http://youtu.be/XAqIpGU8ZZk#t=17m25s
      var index = -1,
          length = nativeMax(0, ceil((end - start) / (step || 1))),
          result = Array(length);

      while (++index < length) {
        result[index] = start;
        start += step;
      }
      return result;
    }

    /**
     * Removes all elements from an array that the callback returns truey for
     * and returns an array of removed elements. The callback is bound to `thisArg`
     * and invoked with three arguments; (value, index, array).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to modify.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array} Returns a new array of removed elements.
     * @example
     *
     * var array = [1, 2, 3, 4, 5, 6];
     * var evens = _.remove(array, function(num) { return num % 2 == 0; });
     *
     * console.log(array);
     * // => [1, 3, 5]
     *
     * console.log(evens);
     * // => [2, 4, 6]
     */
    function remove(array, callback, thisArg) {
      var index = -1,
          length = array ? array.length : 0,
          result = [];

      callback = lodash.createCallback(callback, thisArg, 3);
      while (++index < length) {
        var value = array[index];
        if (callback(value, index, array)) {
          result.push(value);
          splice.call(array, index--, 1);
          length--;
        }
      }
      return result;
    }

    /**
     * The opposite of `_.initial` this method gets all but the first element or
     * first `n` elements of an array. If a callback function is provided elements
     * at the beginning of the array are excluded from the result as long as the
     * callback returns truey. The callback is bound to `thisArg` and invoked
     * with three arguments; (value, index, array).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @alias drop, tail
     * @category Arrays
     * @param {Array} array The array to query.
     * @param {Function|Object|number|string} [callback=1] The function called
     *  per element or the number of elements to exclude. If a property name or
     *  object is provided it will be used to create a "_.pluck" or "_.where"
     *  style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array} Returns a slice of `array`.
     * @example
     *
     * _.rest([1, 2, 3]);
     * // => [2, 3]
     *
     * _.rest([1, 2, 3], 2);
     * // => [3]
     *
     * _.rest([1, 2, 3], function(num) {
     *   return num < 3;
     * });
     * // => [3]
     *
     * var characters = [
     *   { 'name': 'barney',  'blocked': true,  'employer': 'slate' },
     *   { 'name': 'fred',    'blocked': false,  'employer': 'slate' },
     *   { 'name': 'pebbles', 'blocked': true, 'employer': 'na' }
     * ];
     *
     * // using "_.pluck" callback shorthand
     * _.pluck(_.rest(characters, 'blocked'), 'name');
     * // => ['fred', 'pebbles']
     *
     * // using "_.where" callback shorthand
     * _.rest(characters, { 'employer': 'slate' });
     * // => [{ 'name': 'pebbles', 'blocked': true, 'employer': 'na' }]
     */
    function rest(array, callback, thisArg) {
      if (typeof callback != 'number' && callback != null) {
        var n = 0,
            index = -1,
            length = array ? array.length : 0;

        callback = lodash.createCallback(callback, thisArg, 3);
        while (++index < length && callback(array[index], index, array)) {
          n++;
        }
      } else {
        n = (callback == null || thisArg) ? 1 : nativeMax(0, callback);
      }
      return slice(array, n);
    }

    /**
     * Uses a binary search to determine the smallest index at which a value
     * should be inserted into a given sorted array in order to maintain the sort
     * order of the array. If a callback is provided it will be executed for
     * `value` and each element of `array` to compute their sort ranking. The
     * callback is bound to `thisArg` and invoked with one argument; (value).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to inspect.
     * @param {*} value The value to evaluate.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {number} Returns the index at which `value` should be inserted
     *  into `array`.
     * @example
     *
     * _.sortedIndex([20, 30, 50], 40);
     * // => 2
     *
     * // using "_.pluck" callback shorthand
     * _.sortedIndex([{ 'x': 20 }, { 'x': 30 }, { 'x': 50 }], { 'x': 40 }, 'x');
     * // => 2
     *
     * var dict = {
     *   'wordToNumber': { 'twenty': 20, 'thirty': 30, 'fourty': 40, 'fifty': 50 }
     * };
     *
     * _.sortedIndex(['twenty', 'thirty', 'fifty'], 'fourty', function(word) {
     *   return dict.wordToNumber[word];
     * });
     * // => 2
     *
     * _.sortedIndex(['twenty', 'thirty', 'fifty'], 'fourty', function(word) {
     *   return this.wordToNumber[word];
     * }, dict);
     * // => 2
     */
    function sortedIndex(array, value, callback, thisArg) {
      var low = 0,
          high = array ? array.length : low;

      // explicitly reference `identity` for better inlining in Firefox
      callback = callback ? lodash.createCallback(callback, thisArg, 1) : identity;
      value = callback(value);

      while (low < high) {
        var mid = (low + high) >>> 1;
        (callback(array[mid]) < value)
          ? low = mid + 1
          : high = mid;
      }
      return low;
    }

    /**
     * Creates an array of unique values, in order, of the provided arrays using
     * strict equality for comparisons, i.e. `===`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {...Array} [array] The arrays to inspect.
     * @returns {Array} Returns an array of combined values.
     * @example
     *
     * _.union([1, 2, 3], [5, 2, 1, 4], [2, 1]);
     * // => [1, 2, 3, 5, 4]
     */
    function union() {
      return baseUniq(baseFlatten(arguments, true, true));
    }

    /**
     * Creates a duplicate-value-free version of an array using strict equality
     * for comparisons, i.e. `===`. If the array is sorted, providing
     * `true` for `isSorted` will use a faster algorithm. If a callback is provided
     * each element of `array` is passed through the callback before uniqueness
     * is computed. The callback is bound to `thisArg` and invoked with three
     * arguments; (value, index, array).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @alias unique
     * @category Arrays
     * @param {Array} array The array to process.
     * @param {boolean} [isSorted=false] A flag to indicate that `array` is sorted.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array} Returns a duplicate-value-free array.
     * @example
     *
     * _.uniq([1, 2, 1, 3, 1]);
     * // => [1, 2, 3]
     *
     * _.uniq([1, 1, 2, 2, 3], true);
     * // => [1, 2, 3]
     *
     * _.uniq(['A', 'b', 'C', 'a', 'B', 'c'], function(letter) { return letter.toLowerCase(); });
     * // => ['A', 'b', 'C']
     *
     * _.uniq([1, 2.5, 3, 1.5, 2, 3.5], function(num) { return this.floor(num); }, Math);
     * // => [1, 2.5, 3]
     *
     * // using "_.pluck" callback shorthand
     * _.uniq([{ 'x': 1 }, { 'x': 2 }, { 'x': 1 }], 'x');
     * // => [{ 'x': 1 }, { 'x': 2 }]
     */
    function uniq(array, isSorted, callback, thisArg) {
      // juggle arguments
      if (typeof isSorted != 'boolean' && isSorted != null) {
        thisArg = callback;
        callback = (typeof isSorted != 'function' && thisArg && thisArg[isSorted] === array) ? null : isSorted;
        isSorted = false;
      }
      if (callback != null) {
        callback = lodash.createCallback(callback, thisArg, 3);
      }
      return baseUniq(array, isSorted, callback);
    }

    /**
     * Creates an array excluding all provided values using strict equality for
     * comparisons, i.e. `===`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to filter.
     * @param {...*} [value] The values to exclude.
     * @returns {Array} Returns a new array of filtered values.
     * @example
     *
     * _.without([1, 2, 1, 0, 3, 1, 4], 0, 1);
     * // => [2, 3, 4]
     */
    function without(array) {
      return baseDifference(array, slice(arguments, 1));
    }

    /**
     * Creates an array that is the symmetric difference of the provided arrays.
     * See http://en.wikipedia.org/wiki/Symmetric_difference.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {...Array} [array] The arrays to inspect.
     * @returns {Array} Returns an array of values.
     * @example
     *
     * _.xor([1, 2, 3], [5, 2, 1, 4]);
     * // => [3, 5, 4]
     *
     * _.xor([1, 2, 5], [2, 3, 5], [3, 4, 5]);
     * // => [1, 4, 5]
     */
    function xor() {
      var index = -1,
          length = arguments.length;

      while (++index < length) {
        var array = arguments[index];
        if (isArray(array) || isArguments(array)) {
          var result = result
            ? baseUniq(baseDifference(result, array).concat(baseDifference(array, result)))
            : array;
        }
      }
      return result || [];
    }

    /**
     * Creates an array of grouped elements, the first of which contains the first
     * elements of the given arrays, the second of which contains the second
     * elements of the given arrays, and so on.
     *
     * @static
     * @memberOf _
     * @alias unzip
     * @category Arrays
     * @param {...Array} [array] Arrays to process.
     * @returns {Array} Returns a new array of grouped elements.
     * @example
     *
     * _.zip(['fred', 'barney'], [30, 40], [true, false]);
     * // => [['fred', 30, true], ['barney', 40, false]]
     */
    function zip() {
      var array = arguments.length > 1 ? arguments : arguments[0],
          index = -1,
          length = array ? max(pluck(array, 'length')) : 0,
          result = Array(length < 0 ? 0 : length);

      while (++index < length) {
        result[index] = pluck(array, index);
      }
      return result;
    }

    /**
     * Creates an object composed from arrays of `keys` and `values`. Provide
     * either a single two dimensional array, i.e. `[[key1, value1], [key2, value2]]`
     * or two arrays, one of `keys` and one of corresponding `values`.
     *
     * @static
     * @memberOf _
     * @alias object
     * @category Arrays
     * @param {Array} keys The array of keys.
     * @param {Array} [values=[]] The array of values.
     * @returns {Object} Returns an object composed of the given keys and
     *  corresponding values.
     * @example
     *
     * _.zipObject(['fred', 'barney'], [30, 40]);
     * // => { 'fred': 30, 'barney': 40 }
     */
    function zipObject(keys, values) {
      var index = -1,
          length = keys ? keys.length : 0,
          result = {};

      if (!values && length && !isArray(keys[0])) {
        values = [];
      }
      while (++index < length) {
        var key = keys[index];
        if (values) {
          result[key] = values[index];
        } else if (key) {
          result[key[0]] = key[1];
        }
      }
      return result;
    }

    /*--------------------------------------------------------------------------*/

    /**
     * Creates a function that executes `func`, with  the `this` binding and
     * arguments of the created function, only after being called `n` times.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {number} n The number of times the function must be called before
     *  `func` is executed.
     * @param {Function} func The function to restrict.
     * @returns {Function} Returns the new restricted function.
     * @example
     *
     * var saves = ['profile', 'settings'];
     *
     * var done = _.after(saves.length, function() {
     *   console.log('Done saving!');
     * });
     *
     * _.forEach(saves, function(type) {
     *   asyncSave({ 'type': type, 'complete': done });
     * });
     * // => logs 'Done saving!', after all saves have completed
     */
    function after(n, func) {
      if (!isFunction(func)) {
        throw new TypeError;
      }
      return function() {
        if (--n < 1) {
          return func.apply(this, arguments);
        }
      };
    }

    /**
     * Creates a function that, when called, invokes `func` with the `this`
     * binding of `thisArg` and prepends any additional `bind` arguments to those
     * provided to the bound function.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Function} func The function to bind.
     * @param {*} [thisArg] The `this` binding of `func`.
     * @param {...*} [arg] Arguments to be partially applied.
     * @returns {Function} Returns the new bound function.
     * @example
     *
     * var func = function(greeting) {
     *   return greeting + ' ' + this.name;
     * };
     *
     * func = _.bind(func, { 'name': 'fred' }, 'hi');
     * func();
     * // => 'hi fred'
     */
    function bind(func, thisArg) {
      return arguments.length > 2
        ? createWrapper(func, 17, slice(arguments, 2), null, thisArg)
        : createWrapper(func, 1, null, null, thisArg);
    }

    /**
     * Binds methods of an object to the object itself, overwriting the existing
     * method. Method names may be specified as individual arguments or as arrays
     * of method names. If no method names are provided all the function properties
     * of `object` will be bound.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Object} object The object to bind and assign the bound methods to.
     * @param {...string} [methodName] The object method names to
     *  bind, specified as individual method names or arrays of method names.
     * @returns {Object} Returns `object`.
     * @example
     *
     * var view = {
     *   'label': 'docs',
     *   'onClick': function() { console.log('clicked ' + this.label); }
     * };
     *
     * _.bindAll(view);
     * jQuery('#docs').on('click', view.onClick);
     * // => logs 'clicked docs', when the button is clicked
     */
    function bindAll(object) {
      var funcs = arguments.length > 1 ? baseFlatten(arguments, true, false, 1) : functions(object),
          index = -1,
          length = funcs.length;

      while (++index < length) {
        var key = funcs[index];
        object[key] = createWrapper(object[key], 1, null, null, object);
      }
      return object;
    }

    /**
     * Creates a function that, when called, invokes the method at `object[key]`
     * and prepends any additional `bindKey` arguments to those provided to the bound
     * function. This method differs from `_.bind` by allowing bound functions to
     * reference methods that will be redefined or don't yet exist.
     * See http://michaux.ca/articles/lazy-function-definition-pattern.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Object} object The object the method belongs to.
     * @param {string} key The key of the method.
     * @param {...*} [arg] Arguments to be partially applied.
     * @returns {Function} Returns the new bound function.
     * @example
     *
     * var object = {
     *   'name': 'fred',
     *   'greet': function(greeting) {
     *     return greeting + ' ' + this.name;
     *   }
     * };
     *
     * var func = _.bindKey(object, 'greet', 'hi');
     * func();
     * // => 'hi fred'
     *
     * object.greet = function(greeting) {
     *   return greeting + 'ya ' + this.name + '!';
     * };
     *
     * func();
     * // => 'hiya fred!'
     */
    function bindKey(object, key) {
      return arguments.length > 2
        ? createWrapper(key, 19, slice(arguments, 2), null, object)
        : createWrapper(key, 3, null, null, object);
    }

    /**
     * Creates a function that is the composition of the provided functions,
     * where each function consumes the return value of the function that follows.
     * For example, composing the functions `f()`, `g()`, and `h()` produces `f(g(h()))`.
     * Each function is executed with the `this` binding of the composed function.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {...Function} [func] Functions to compose.
     * @returns {Function} Returns the new composed function.
     * @example
     *
     * var realNameMap = {
     *   'pebbles': 'penelope'
     * };
     *
     * var format = function(name) {
     *   name = realNameMap[name.toLowerCase()] || name;
     *   return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
     * };
     *
     * var greet = function(formatted) {
     *   return 'Hiya ' + formatted + '!';
     * };
     *
     * var welcome = _.compose(greet, format);
     * welcome('pebbles');
     * // => 'Hiya Penelope!'
     */
    function compose() {
      var funcs = arguments,
          length = funcs.length;

      while (length--) {
        if (!isFunction(funcs[length])) {
          throw new TypeError;
        }
      }
      return function() {
        var args = arguments,
            length = funcs.length;

        while (length--) {
          args = [funcs[length].apply(this, args)];
        }
        return args[0];
      };
    }

    /**
     * Creates a function which accepts one or more arguments of `func` that when
     * invoked either executes `func` returning its result, if all `func` arguments
     * have been provided, or returns a function that accepts one or more of the
     * remaining `func` arguments, and so on. The arity of `func` can be specified
     * if `func.length` is not sufficient.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Function} func The function to curry.
     * @param {number} [arity=func.length] The arity of `func`.
     * @returns {Function} Returns the new curried function.
     * @example
     *
     * var curried = _.curry(function(a, b, c) {
     *   console.log(a + b + c);
     * });
     *
     * curried(1)(2)(3);
     * // => 6
     *
     * curried(1, 2)(3);
     * // => 6
     *
     * curried(1, 2, 3);
     * // => 6
     */
    function curry(func, arity) {
      arity = typeof arity == 'number' ? arity : (+arity || func.length);
      return createWrapper(func, 4, null, null, null, arity);
    }

    /**
     * Creates a function that will delay the execution of `func` until after
     * `wait` milliseconds have elapsed since the last time it was invoked.
     * Provide an options object to indicate that `func` should be invoked on
     * the leading and/or trailing edge of the `wait` timeout. Subsequent calls
     * to the debounced function will return the result of the last `func` call.
     *
     * Note: If `leading` and `trailing` options are `true` `func` will be called
     * on the trailing edge of the timeout only if the the debounced function is
     * invoked more than once during the `wait` timeout.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Function} func The function to debounce.
     * @param {number} wait The number of milliseconds to delay.
     * @param {Object} [options] The options object.
     * @param {boolean} [options.leading=false] Specify execution on the leading edge of the timeout.
     * @param {number} [options.maxWait] The maximum time `func` is allowed to be delayed before it's called.
     * @param {boolean} [options.trailing=true] Specify execution on the trailing edge of the timeout.
     * @returns {Function} Returns the new debounced function.
     * @example
     *
     * // avoid costly calculations while the window size is in flux
     * var lazyLayout = _.debounce(calculateLayout, 150);
     * jQuery(window).on('resize', lazyLayout);
     *
     * // execute `sendMail` when the click event is fired, debouncing subsequent calls
     * jQuery('#postbox').on('click', _.debounce(sendMail, 300, {
     *   'leading': true,
     *   'trailing': false
     * });
     *
     * // ensure `batchLog` is executed once after 1 second of debounced calls
     * var source = new EventSource('/stream');
     * source.addEventListener('message', _.debounce(batchLog, 250, {
     *   'maxWait': 1000
     * }, false);
     */
    function debounce(func, wait, options) {
      var args,
          maxTimeoutId,
          result,
          stamp,
          thisArg,
          timeoutId,
          trailingCall,
          lastCalled = 0,
          maxWait = false,
          trailing = true;

      if (!isFunction(func)) {
        throw new TypeError;
      }
      wait = nativeMax(0, wait) || 0;
      if (options === true) {
        var leading = true;
        trailing = false;
      } else if (isObject(options)) {
        leading = options.leading;
        maxWait = 'maxWait' in options && (nativeMax(wait, options.maxWait) || 0);
        trailing = 'trailing' in options ? options.trailing : trailing;
      }
      var delayed = function() {
        var remaining = wait - (now() - stamp);
        if (remaining <= 0) {
          if (maxTimeoutId) {
            clearTimeout(maxTimeoutId);
          }
          var isCalled = trailingCall;
          maxTimeoutId = timeoutId = trailingCall = undefined;
          if (isCalled) {
            lastCalled = now();
            result = func.apply(thisArg, args);
            if (!timeoutId && !maxTimeoutId) {
              args = thisArg = null;
            }
          }
        } else {
          timeoutId = setTimeout(delayed, remaining);
        }
      };

      var maxDelayed = function() {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        maxTimeoutId = timeoutId = trailingCall = undefined;
        if (trailing || (maxWait !== wait)) {
          lastCalled = now();
          result = func.apply(thisArg, args);
          if (!timeoutId && !maxTimeoutId) {
            args = thisArg = null;
          }
        }
      };

      return function() {
        args = arguments;
        stamp = now();
        thisArg = this;
        trailingCall = trailing && (timeoutId || !leading);

        if (maxWait === false) {
          var leadingCall = leading && !timeoutId;
        } else {
          if (!maxTimeoutId && !leading) {
            lastCalled = stamp;
          }
          var remaining = maxWait - (stamp - lastCalled),
              isCalled = remaining <= 0;

          if (isCalled) {
            if (maxTimeoutId) {
              maxTimeoutId = clearTimeout(maxTimeoutId);
            }
            lastCalled = stamp;
            result = func.apply(thisArg, args);
          }
          else if (!maxTimeoutId) {
            maxTimeoutId = setTimeout(maxDelayed, remaining);
          }
        }
        if (isCalled && timeoutId) {
          timeoutId = clearTimeout(timeoutId);
        }
        else if (!timeoutId && wait !== maxWait) {
          timeoutId = setTimeout(delayed, wait);
        }
        if (leadingCall) {
          isCalled = true;
          result = func.apply(thisArg, args);
        }
        if (isCalled && !timeoutId && !maxTimeoutId) {
          args = thisArg = null;
        }
        return result;
      };
    }

    /**
     * Defers executing the `func` function until the current call stack has cleared.
     * Additional arguments will be provided to `func` when it is invoked.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Function} func The function to defer.
     * @param {...*} [arg] Arguments to invoke the function with.
     * @returns {number} Returns the timer id.
     * @example
     *
     * _.defer(function(text) { console.log(text); }, 'deferred');
     * // logs 'deferred' after one or more milliseconds
     */
    function defer(func) {
      if (!isFunction(func)) {
        throw new TypeError;
      }
      var args = slice(arguments, 1);
      return setTimeout(function() { func.apply(undefined, args); }, 1);
    }

    /**
     * Executes the `func` function after `wait` milliseconds. Additional arguments
     * will be provided to `func` when it is invoked.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Function} func The function to delay.
     * @param {number} wait The number of milliseconds to delay execution.
     * @param {...*} [arg] Arguments to invoke the function with.
     * @returns {number} Returns the timer id.
     * @example
     *
     * _.delay(function(text) { console.log(text); }, 1000, 'later');
     * // => logs 'later' after one second
     */
    function delay(func, wait) {
      if (!isFunction(func)) {
        throw new TypeError;
      }
      var args = slice(arguments, 2);
      return setTimeout(function() { func.apply(undefined, args); }, wait);
    }

    /**
     * Creates a function that memoizes the result of `func`. If `resolver` is
     * provided it will be used to determine the cache key for storing the result
     * based on the arguments provided to the memoized function. By default, the
     * first argument provided to the memoized function is used as the cache key.
     * The `func` is executed with the `this` binding of the memoized function.
     * The result cache is exposed as the `cache` property on the memoized function.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Function} func The function to have its output memoized.
     * @param {Function} [resolver] A function used to resolve the cache key.
     * @returns {Function} Returns the new memoizing function.
     * @example
     *
     * var fibonacci = _.memoize(function(n) {
     *   return n < 2 ? n : fibonacci(n - 1) + fibonacci(n - 2);
     * });
     *
     * fibonacci(9)
     * // => 34
     *
     * var data = {
     *   'fred': { 'name': 'fred', 'age': 40 },
     *   'pebbles': { 'name': 'pebbles', 'age': 1 }
     * };
     *
     * // modifying the result cache
     * var get = _.memoize(function(name) { return data[name]; }, _.identity);
     * get('pebbles');
     * // => { 'name': 'pebbles', 'age': 1 }
     *
     * get.cache.pebbles.name = 'penelope';
     * get('pebbles');
     * // => { 'name': 'penelope', 'age': 1 }
     */
    function memoize(func, resolver) {
      if (!isFunction(func)) {
        throw new TypeError;
      }
      var memoized = function() {
        var cache = memoized.cache,
            key = resolver ? resolver.apply(this, arguments) : keyPrefix + arguments[0];

        return hasOwnProperty.call(cache, key)
          ? cache[key]
          : (cache[key] = func.apply(this, arguments));
      }
      memoized.cache = {};
      return memoized;
    }

    /**
     * Creates a function that is restricted to execute `func` once. Repeat calls to
     * the function will return the value of the first call. The `func` is executed
     * with the `this` binding of the created function.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Function} func The function to restrict.
     * @returns {Function} Returns the new restricted function.
     * @example
     *
     * var initialize = _.once(createApplication);
     * initialize();
     * initialize();
     * // `initialize` executes `createApplication` once
     */
    function once(func) {
      var ran,
          result;

      if (!isFunction(func)) {
        throw new TypeError;
      }
      return function() {
        if (ran) {
          return result;
        }
        ran = true;
        result = func.apply(this, arguments);

        // clear the `func` variable so the function may be garbage collected
        func = null;
        return result;
      };
    }

    /**
     * Creates a function that, when called, invokes `func` with any additional
     * `partial` arguments prepended to those provided to the new function. This
     * method is similar to `_.bind` except it does **not** alter the `this` binding.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Function} func The function to partially apply arguments to.
     * @param {...*} [arg] Arguments to be partially applied.
     * @returns {Function} Returns the new partially applied function.
     * @example
     *
     * var greet = function(greeting, name) { return greeting + ' ' + name; };
     * var hi = _.partial(greet, 'hi');
     * hi('fred');
     * // => 'hi fred'
     */
    function partial(func) {
      return createWrapper(func, 16, slice(arguments, 1));
    }

    /**
     * This method is like `_.partial` except that `partial` arguments are
     * appended to those provided to the new function.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Function} func The function to partially apply arguments to.
     * @param {...*} [arg] Arguments to be partially applied.
     * @returns {Function} Returns the new partially applied function.
     * @example
     *
     * var defaultsDeep = _.partialRight(_.merge, _.defaults);
     *
     * var options = {
     *   'variable': 'data',
     *   'imports': { 'jq': $ }
     * };
     *
     * defaultsDeep(options, _.templateSettings);
     *
     * options.variable
     * // => 'data'
     *
     * options.imports
     * // => { '_': _, 'jq': $ }
     */
    function partialRight(func) {
      return createWrapper(func, 32, null, slice(arguments, 1));
    }

    /**
     * Creates a function that, when executed, will only call the `func` function
     * at most once per every `wait` milliseconds. Provide an options object to
     * indicate that `func` should be invoked on the leading and/or trailing edge
     * of the `wait` timeout. Subsequent calls to the throttled function will
     * return the result of the last `func` call.
     *
     * Note: If `leading` and `trailing` options are `true` `func` will be called
     * on the trailing edge of the timeout only if the the throttled function is
     * invoked more than once during the `wait` timeout.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Function} func The function to throttle.
     * @param {number} wait The number of milliseconds to throttle executions to.
     * @param {Object} [options] The options object.
     * @param {boolean} [options.leading=true] Specify execution on the leading edge of the timeout.
     * @param {boolean} [options.trailing=true] Specify execution on the trailing edge of the timeout.
     * @returns {Function} Returns the new throttled function.
     * @example
     *
     * // avoid excessively updating the position while scrolling
     * var throttled = _.throttle(updatePosition, 100);
     * jQuery(window).on('scroll', throttled);
     *
     * // execute `renewToken` when the click event is fired, but not more than once every 5 minutes
     * jQuery('.interactive').on('click', _.throttle(renewToken, 300000, {
     *   'trailing': false
     * }));
     */
    function throttle(func, wait, options) {
      var leading = true,
          trailing = true;

      if (!isFunction(func)) {
        throw new TypeError;
      }
      if (options === false) {
        leading = false;
      } else if (isObject(options)) {
        leading = 'leading' in options ? options.leading : leading;
        trailing = 'trailing' in options ? options.trailing : trailing;
      }
      debounceOptions.leading = leading;
      debounceOptions.maxWait = wait;
      debounceOptions.trailing = trailing;

      return debounce(func, wait, debounceOptions);
    }

    /**
     * Creates a function that provides `value` to the wrapper function as its
     * first argument. Additional arguments provided to the function are appended
     * to those provided to the wrapper function. The wrapper is executed with
     * the `this` binding of the created function.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {*} value The value to wrap.
     * @param {Function} wrapper The wrapper function.
     * @returns {Function} Returns the new function.
     * @example
     *
     * var p = _.wrap(_.escape, function(func, text) {
     *   return '<p>' + func(text) + '</p>';
     * });
     *
     * p('Fred, Wilma, & Pebbles');
     * // => '<p>Fred, Wilma, &amp; Pebbles</p>'
     */
    function wrap(value, wrapper) {
      return createWrapper(wrapper, 16, [value]);
    }

    /*--------------------------------------------------------------------------*/

    /**
     * Creates a function that returns `value`.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {*} value The value to return from the new function.
     * @returns {Function} Returns the new function.
     * @example
     *
     * var object = { 'name': 'fred' };
     * var getter = _.constant(object);
     * getter() === object;
     * // => true
     */
    function constant(value) {
      return function() {
        return value;
      };
    }

    /**
     * Produces a callback bound to an optional `thisArg`. If `func` is a property
     * name the created callback will return the property value for a given element.
     * If `func` is an object the created callback will return `true` for elements
     * that contain the equivalent object properties, otherwise it will return `false`.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {*} [func=identity] The value to convert to a callback.
     * @param {*} [thisArg] The `this` binding of the created callback.
     * @param {number} [argCount] The number of arguments the callback accepts.
     * @returns {Function} Returns a callback function.
     * @example
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 36 },
     *   { 'name': 'fred',   'age': 40 }
     * ];
     *
     * // wrap to create custom callback shorthands
     * _.createCallback = _.wrap(_.createCallback, function(func, callback, thisArg) {
     *   var match = /^(.+?)__([gl]t)(.+)$/.exec(callback);
     *   return !match ? func(callback, thisArg) : function(object) {
     *     return match[2] == 'gt' ? object[match[1]] > match[3] : object[match[1]] < match[3];
     *   };
     * });
     *
     * _.filter(characters, 'age__gt38');
     * // => [{ 'name': 'fred', 'age': 40 }]
     */
    function createCallback(func, thisArg, argCount) {
      var type = typeof func;
      if (func == null || type == 'function') {
        return baseCreateCallback(func, thisArg, argCount);
      }
      // handle "_.pluck" style callback shorthands
      if (type != 'object') {
        return property(func);
      }
      var props = keys(func),
          key = props[0],
          a = func[key];

      // handle "_.where" style callback shorthands
      if (props.length == 1 && a === a && !isObject(a)) {
        // fast path the common case of providing an object with a single
        // property containing a primitive value
        return function(object) {
          var b = object[key];
          return a === b && (a !== 0 || (1 / a == 1 / b));
        };
      }
      return function(object) {
        var length = props.length,
            result = false;

        while (length--) {
          if (!(result = baseIsEqual(object[props[length]], func[props[length]], null, true))) {
            break;
          }
        }
        return result;
      };
    }

    /**
     * Converts the characters `&`, `<`, `>`, `"`, and `'` in `string` to their
     * corresponding HTML entities.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {string} string The string to escape.
     * @returns {string} Returns the escaped string.
     * @example
     *
     * _.escape('Fred, Wilma, & Pebbles');
     * // => 'Fred, Wilma, &amp; Pebbles'
     */
    function escape(string) {
      return string == null ? '' : String(string).replace(reUnescapedHtml, escapeHtmlChar);
    }

    /**
     * This method returns the first argument provided to it.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {*} value Any value.
     * @returns {*} Returns `value`.
     * @example
     *
     * var object = { 'name': 'fred' };
     * _.identity(object) === object;
     * // => true
     */
    function identity(value) {
      return value;
    }

    /**
     * Adds function properties of a source object to the destination object.
     * If `object` is a function methods will be added to its prototype as well.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {Function|Object} [object=lodash] object The destination object.
     * @param {Object} source The object of functions to add.
     * @param {Object} [options] The options object.
     * @param {boolean} [options.chain=true] Specify whether the functions added are chainable.
     * @example
     *
     * function capitalize(string) {
     *   return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
     * }
     *
     * _.mixin({ 'capitalize': capitalize });
     * _.capitalize('fred');
     * // => 'Fred'
     *
     * _('fred').capitalize().value();
     * // => 'Fred'
     *
     * _.mixin({ 'capitalize': capitalize }, { 'chain': false });
     * _('fred').capitalize();
     * // => 'Fred'
     */
    function mixin(object, source, options) {
      var chain = true,
          methodNames = source && functions(source);

      if (!source || (!options && !methodNames.length)) {
        if (options == null) {
          options = source;
        }
        ctor = lodashWrapper;
        source = object;
        object = lodash;
        methodNames = functions(source);
      }
      if (options === false) {
        chain = false;
      } else if (isObject(options) && 'chain' in options) {
        chain = options.chain;
      }
      var ctor = object,
          isFunc = isFunction(ctor);

      forEach(methodNames, function(methodName) {
        var func = object[methodName] = source[methodName];
        if (isFunc) {
          ctor.prototype[methodName] = function() {
            var chainAll = this.__chain__,
                value = this.__wrapped__,
                args = [value];

            push.apply(args, arguments);
            var result = func.apply(object, args);
            if (chain || chainAll) {
              if (value === result && isObject(result)) {
                return this;
              }
              result = new ctor(result);
              result.__chain__ = chainAll;
            }
            return result;
          };
        }
      });
    }

    /**
     * Reverts the '_' variable to its previous value and returns a reference to
     * the `lodash` function.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @returns {Function} Returns the `lodash` function.
     * @example
     *
     * var lodash = _.noConflict();
     */
    function noConflict() {
      context._ = oldDash;
      return this;
    }

    /**
     * A no-operation function.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @example
     *
     * var object = { 'name': 'fred' };
     * _.noop(object) === undefined;
     * // => true
     */
    function noop() {
      // no operation performed
    }

    /**
     * Gets the number of milliseconds that have elapsed since the Unix epoch
     * (1 January 1970 00:00:00 UTC).
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @example
     *
     * var stamp = _.now();
     * _.defer(function() { console.log(_.now() - stamp); });
     * // => logs the number of milliseconds it took for the deferred function to be called
     */
    var now = isNative(now = Date.now) && now || function() {
      return new Date().getTime();
    };

    /**
     * Converts the given value into an integer of the specified radix.
     * If `radix` is `undefined` or `0` a `radix` of `10` is used unless the
     * `value` is a hexadecimal, in which case a `radix` of `16` is used.
     *
     * Note: This method avoids differences in native ES3 and ES5 `parseInt`
     * implementations. See http://es5.github.io/#E.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {string} value The value to parse.
     * @param {number} [radix] The radix used to interpret the value to parse.
     * @returns {number} Returns the new integer value.
     * @example
     *
     * _.parseInt('08');
     * // => 8
     */
    var parseInt = nativeParseInt(whitespace + '08') == 8 ? nativeParseInt : function(value, radix) {
      // Firefox < 21 and Opera < 15 follow the ES3 specified implementation of `parseInt`
      return nativeParseInt(isString(value) ? value.replace(reLeadingSpacesAndZeros, '') : value, radix || 0);
    };

    /**
     * Creates a "_.pluck" style function, which returns the `key` value of a
     * given object.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {string} key The name of the property to retrieve.
     * @returns {Function} Returns the new function.
     * @example
     *
     * var characters = [
     *   { 'name': 'fred',   'age': 40 },
     *   { 'name': 'barney', 'age': 36 }
     * ];
     *
     * var getName = _.property('name');
     *
     * _.map(characters, getName);
     * // => ['barney', 'fred']
     *
     * _.sortBy(characters, getName);
     * // => [{ 'name': 'barney', 'age': 36 }, { 'name': 'fred',   'age': 40 }]
     */
    function property(key) {
      return function(object) {
        return object[key];
      };
    }

    /**
     * Produces a random number between `min` and `max` (inclusive). If only one
     * argument is provided a number between `0` and the given number will be
     * returned. If `floating` is truey or either `min` or `max` are floats a
     * floating-point number will be returned instead of an integer.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {number} [min=0] The minimum possible value.
     * @param {number} [max=1] The maximum possible value.
     * @param {boolean} [floating=false] Specify returning a floating-point number.
     * @returns {number} Returns a random number.
     * @example
     *
     * _.random(0, 5);
     * // => an integer between 0 and 5
     *
     * _.random(5);
     * // => also an integer between 0 and 5
     *
     * _.random(5, true);
     * // => a floating-point number between 0 and 5
     *
     * _.random(1.2, 5.2);
     * // => a floating-point number between 1.2 and 5.2
     */
    function random(min, max, floating) {
      var noMin = min == null,
          noMax = max == null;

      if (floating == null) {
        if (typeof min == 'boolean' && noMax) {
          floating = min;
          min = 1;
        }
        else if (!noMax && typeof max == 'boolean') {
          floating = max;
          noMax = true;
        }
      }
      if (noMin && noMax) {
        max = 1;
      }
      min = +min || 0;
      if (noMax) {
        max = min;
        min = 0;
      } else {
        max = +max || 0;
      }
      if (floating || min % 1 || max % 1) {
        var rand = nativeRandom();
        return nativeMin(min + (rand * (max - min + parseFloat('1e-' + ((rand +'').length - 1)))), max);
      }
      return baseRandom(min, max);
    }

    /**
     * Resolves the value of property `key` on `object`. If `key` is a function
     * it will be invoked with the `this` binding of `object` and its result returned,
     * else the property value is returned. If `object` is falsey then `undefined`
     * is returned.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {Object} object The object to inspect.
     * @param {string} key The name of the property to resolve.
     * @returns {*} Returns the resolved value.
     * @example
     *
     * var object = {
     *   'cheese': 'crumpets',
     *   'stuff': function() {
     *     return 'nonsense';
     *   }
     * };
     *
     * _.result(object, 'cheese');
     * // => 'crumpets'
     *
     * _.result(object, 'stuff');
     * // => 'nonsense'
     */
    function result(object, key) {
      if (object) {
        var value = object[key];
        return isFunction(value) ? object[key]() : value;
      }
    }

    /**
     * A micro-templating method that handles arbitrary delimiters, preserves
     * whitespace, and correctly escapes quotes within interpolated code.
     *
     * Note: In the development build, `_.template` utilizes sourceURLs for easier
     * debugging. See http://www.html5rocks.com/en/tutorials/developertools/sourcemaps/#toc-sourceurl
     *
     * For more information on precompiling templates see:
     * https://lodash.com/custom-builds
     *
     * For more information on Chrome extension sandboxes see:
     * http://developer.chrome.com/stable/extensions/sandboxingEval.html
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {string} text The template text.
     * @param {Object} data The data object used to populate the text.
     * @param {Object} [options] The options object.
     * @param {RegExp} [options.escape] The "escape" delimiter.
     * @param {RegExp} [options.evaluate] The "evaluate" delimiter.
     * @param {Object} [options.imports] An object to import into the template as local variables.
     * @param {RegExp} [options.interpolate] The "interpolate" delimiter.
     * @param {string} [sourceURL] The sourceURL of the template's compiled source.
     * @param {string} [variable] The data object variable name.
     * @returns {Function|string} Returns a compiled function when no `data` object
     *  is given, else it returns the interpolated text.
     * @example
     *
     * // using the "interpolate" delimiter to create a compiled template
     * var compiled = _.template('hello <%= name %>');
     * compiled({ 'name': 'fred' });
     * // => 'hello fred'
     *
     * // using the "escape" delimiter to escape HTML in data property values
     * _.template('<b><%- value %></b>', { 'value': '<script>' });
     * // => '<b>&lt;script&gt;</b>'
     *
     * // using the "evaluate" delimiter to generate HTML
     * var list = '<% _.forEach(people, function(name) { %><li><%- name %></li><% }); %>';
     * _.template(list, { 'people': ['fred', 'barney'] });
     * // => '<li>fred</li><li>barney</li>'
     *
     * // using the ES6 delimiter as an alternative to the default "interpolate" delimiter
     * _.template('hello ${ name }', { 'name': 'pebbles' });
     * // => 'hello pebbles'
     *
     * // using the internal `print` function in "evaluate" delimiters
     * _.template('<% print("hello " + name); %>!', { 'name': 'barney' });
     * // => 'hello barney!'
     *
     * // using a custom template delimiters
     * _.templateSettings = {
     *   'interpolate': /{{([\s\S]+?)}}/g
     * };
     *
     * _.template('hello {{ name }}!', { 'name': 'mustache' });
     * // => 'hello mustache!'
     *
     * // using the `imports` option to import jQuery
     * var list = '<% jq.each(people, function(name) { %><li><%- name %></li><% }); %>';
     * _.template(list, { 'people': ['fred', 'barney'] }, { 'imports': { 'jq': jQuery } });
     * // => '<li>fred</li><li>barney</li>'
     *
     * // using the `sourceURL` option to specify a custom sourceURL for the template
     * var compiled = _.template('hello <%= name %>', null, { 'sourceURL': '/basic/greeting.jst' });
     * compiled(data);
     * // => find the source of "greeting.jst" under the Sources tab or Resources panel of the web inspector
     *
     * // using the `variable` option to ensure a with-statement isn't used in the compiled template
     * var compiled = _.template('hi <%= data.name %>!', null, { 'variable': 'data' });
     * compiled.source;
     * // => function(data) {
     *   var __t, __p = '', __e = _.escape;
     *   __p += 'hi ' + ((__t = ( data.name )) == null ? '' : __t) + '!';
     *   return __p;
     * }
     *
     * // using the `source` property to inline compiled templates for meaningful
     * // line numbers in error messages and a stack trace
     * fs.writeFileSync(path.join(cwd, 'jst.js'), '\
     *   var JST = {\
     *     "main": ' + _.template(mainText).source + '\
     *   };\
     * ');
     */
    function template(text, data, options) {
      // based on John Resig's `tmpl` implementation
      // http://ejohn.org/blog/javascript-micro-templating/
      // and Laura Doktorova's doT.js
      // https://github.com/olado/doT
      var settings = lodash.templateSettings;
      text = String(text || '');

      // avoid missing dependencies when `iteratorTemplate` is not defined
      options = defaults({}, options, settings);

      var imports = defaults({}, options.imports, settings.imports),
          importsKeys = keys(imports),
          importsValues = values(imports);

      var isEvaluating,
          index = 0,
          interpolate = options.interpolate || reNoMatch,
          source = "__p += '";

      // compile the regexp to match each delimiter
      var reDelimiters = RegExp(
        (options.escape || reNoMatch).source + '|' +
        interpolate.source + '|' +
        (interpolate === reInterpolate ? reEsTemplate : reNoMatch).source + '|' +
        (options.evaluate || reNoMatch).source + '|$'
      , 'g');

      text.replace(reDelimiters, function(match, escapeValue, interpolateValue, esTemplateValue, evaluateValue, offset) {
        interpolateValue || (interpolateValue = esTemplateValue);

        // escape characters that cannot be included in string literals
        source += text.slice(index, offset).replace(reUnescapedString, escapeStringChar);

        // replace delimiters with snippets
        if (escapeValue) {
          source += "' +\n__e(" + escapeValue + ") +\n'";
        }
        if (evaluateValue) {
          isEvaluating = true;
          source += "';\n" + evaluateValue + ";\n__p += '";
        }
        if (interpolateValue) {
          source += "' +\n((__t = (" + interpolateValue + ")) == null ? '' : __t) +\n'";
        }
        index = offset + match.length;

        // the JS engine embedded in Adobe products requires returning the `match`
        // string in order to produce the correct `offset` value
        return match;
      });

      source += "';\n";

      // if `variable` is not specified, wrap a with-statement around the generated
      // code to add the data object to the top of the scope chain
      var variable = options.variable,
          hasVariable = variable;

      if (!hasVariable) {
        variable = 'obj';
        source = 'with (' + variable + ') {\n' + source + '\n}\n';
      }
      // cleanup code by stripping empty strings
      source = (isEvaluating ? source.replace(reEmptyStringLeading, '') : source)
        .replace(reEmptyStringMiddle, '$1')
        .replace(reEmptyStringTrailing, '$1;');

      // frame code as the function body
      source = 'function(' + variable + ') {\n' +
        (hasVariable ? '' : variable + ' || (' + variable + ' = {});\n') +
        "var __t, __p = '', __e = _.escape" +
        (isEvaluating
          ? ', __j = Array.prototype.join;\n' +
            "function print() { __p += __j.call(arguments, '') }\n"
          : ';\n'
        ) +
        source +
        'return __p\n}';

      // Use a sourceURL for easier debugging.
      // http://www.html5rocks.com/en/tutorials/developertools/sourcemaps/#toc-sourceurl
      var sourceURL = '\n/*\n//# sourceURL=' + (options.sourceURL || '/lodash/template/source[' + (templateCounter++) + ']') + '\n*/';

      try {
        var result = Function(importsKeys, 'return ' + source + sourceURL).apply(undefined, importsValues);
      } catch(e) {
        e.source = source;
        throw e;
      }
      if (data) {
        return result(data);
      }
      // provide the compiled function's source by its `toString` method, in
      // supported environments, or the `source` property as a convenience for
      // inlining compiled templates during the build process
      result.source = source;
      return result;
    }

    /**
     * Executes the callback `n` times, returning an array of the results
     * of each callback execution. The callback is bound to `thisArg` and invoked
     * with one argument; (index).
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {number} n The number of times to execute the callback.
     * @param {Function} callback The function called per iteration.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array} Returns an array of the results of each `callback` execution.
     * @example
     *
     * var diceRolls = _.times(3, _.partial(_.random, 1, 6));
     * // => [3, 6, 4]
     *
     * _.times(3, function(n) { mage.castSpell(n); });
     * // => calls `mage.castSpell(n)` three times, passing `n` of `0`, `1`, and `2` respectively
     *
     * _.times(3, function(n) { this.cast(n); }, mage);
     * // => also calls `mage.castSpell(n)` three times
     */
    function times(n, callback, thisArg) {
      n = (n = +n) > -1 ? n : 0;
      var index = -1,
          result = Array(n);

      callback = baseCreateCallback(callback, thisArg, 1);
      while (++index < n) {
        result[index] = callback(index);
      }
      return result;
    }

    /**
     * The inverse of `_.escape` this method converts the HTML entities
     * `&amp;`, `&lt;`, `&gt;`, `&quot;`, and `&#39;` in `string` to their
     * corresponding characters.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {string} string The string to unescape.
     * @returns {string} Returns the unescaped string.
     * @example
     *
     * _.unescape('Fred, Barney &amp; Pebbles');
     * // => 'Fred, Barney & Pebbles'
     */
    function unescape(string) {
      return string == null ? '' : String(string).replace(reEscapedHtml, unescapeHtmlChar);
    }

    /**
     * Generates a unique ID. If `prefix` is provided the ID will be appended to it.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {string} [prefix] The value to prefix the ID with.
     * @returns {string} Returns the unique ID.
     * @example
     *
     * _.uniqueId('contact_');
     * // => 'contact_104'
     *
     * _.uniqueId();
     * // => '105'
     */
    function uniqueId(prefix) {
      var id = ++idCounter;
      return String(prefix == null ? '' : prefix) + id;
    }

    /*--------------------------------------------------------------------------*/

    /**
     * Creates a `lodash` object that wraps the given value with explicit
     * method chaining enabled.
     *
     * @static
     * @memberOf _
     * @category Chaining
     * @param {*} value The value to wrap.
     * @returns {Object} Returns the wrapper object.
     * @example
     *
     * var characters = [
     *   { 'name': 'barney',  'age': 36 },
     *   { 'name': 'fred',    'age': 40 },
     *   { 'name': 'pebbles', 'age': 1 }
     * ];
     *
     * var youngest = _.chain(characters)
     *     .sortBy('age')
     *     .map(function(chr) { return chr.name + ' is ' + chr.age; })
     *     .first()
     *     .value();
     * // => 'pebbles is 1'
     */
    function chain(value) {
      value = new lodashWrapper(value);
      value.__chain__ = true;
      return value;
    }

    /**
     * Invokes `interceptor` with the `value` as the first argument and then
     * returns `value`. The purpose of this method is to "tap into" a method
     * chain in order to perform operations on intermediate results within
     * the chain.
     *
     * @static
     * @memberOf _
     * @category Chaining
     * @param {*} value The value to provide to `interceptor`.
     * @param {Function} interceptor The function to invoke.
     * @returns {*} Returns `value`.
     * @example
     *
     * _([1, 2, 3, 4])
     *  .tap(function(array) { array.pop(); })
     *  .reverse()
     *  .value();
     * // => [3, 2, 1]
     */
    function tap(value, interceptor) {
      interceptor(value);
      return value;
    }

    /**
     * Enables explicit method chaining on the wrapper object.
     *
     * @name chain
     * @memberOf _
     * @category Chaining
     * @returns {*} Returns the wrapper object.
     * @example
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 36 },
     *   { 'name': 'fred',   'age': 40 }
     * ];
     *
     * // without explicit chaining
     * _(characters).first();
     * // => { 'name': 'barney', 'age': 36 }
     *
     * // with explicit chaining
     * _(characters).chain()
     *   .first()
     *   .pick('age')
     *   .value();
     * // => { 'age': 36 }
     */
    function wrapperChain() {
      this.__chain__ = true;
      return this;
    }

    /**
     * Produces the `toString` result of the wrapped value.
     *
     * @name toString
     * @memberOf _
     * @category Chaining
     * @returns {string} Returns the string result.
     * @example
     *
     * _([1, 2, 3]).toString();
     * // => '1,2,3'
     */
    function wrapperToString() {
      return String(this.__wrapped__);
    }

    /**
     * Extracts the wrapped value.
     *
     * @name valueOf
     * @memberOf _
     * @alias value
     * @category Chaining
     * @returns {*} Returns the wrapped value.
     * @example
     *
     * _([1, 2, 3]).valueOf();
     * // => [1, 2, 3]
     */
    function wrapperValueOf() {
      return this.__wrapped__;
    }

    /*--------------------------------------------------------------------------*/

    // add functions that return wrapped values when chaining
    lodash.after = after;
    lodash.assign = assign;
    lodash.at = at;
    lodash.bind = bind;
    lodash.bindAll = bindAll;
    lodash.bindKey = bindKey;
    lodash.chain = chain;
    lodash.compact = compact;
    lodash.compose = compose;
    lodash.constant = constant;
    lodash.countBy = countBy;
    lodash.create = create;
    lodash.createCallback = createCallback;
    lodash.curry = curry;
    lodash.debounce = debounce;
    lodash.defaults = defaults;
    lodash.defer = defer;
    lodash.delay = delay;
    lodash.difference = difference;
    lodash.filter = filter;
    lodash.flatten = flatten;
    lodash.forEach = forEach;
    lodash.forEachRight = forEachRight;
    lodash.forIn = forIn;
    lodash.forInRight = forInRight;
    lodash.forOwn = forOwn;
    lodash.forOwnRight = forOwnRight;
    lodash.functions = functions;
    lodash.groupBy = groupBy;
    lodash.indexBy = indexBy;
    lodash.initial = initial;
    lodash.intersection = intersection;
    lodash.invert = invert;
    lodash.invoke = invoke;
    lodash.keys = keys;
    lodash.map = map;
    lodash.mapValues = mapValues;
    lodash.max = max;
    lodash.memoize = memoize;
    lodash.merge = merge;
    lodash.min = min;
    lodash.omit = omit;
    lodash.once = once;
    lodash.pairs = pairs;
    lodash.partial = partial;
    lodash.partialRight = partialRight;
    lodash.pick = pick;
    lodash.pluck = pluck;
    lodash.property = property;
    lodash.pull = pull;
    lodash.range = range;
    lodash.reject = reject;
    lodash.remove = remove;
    lodash.rest = rest;
    lodash.shuffle = shuffle;
    lodash.sortBy = sortBy;
    lodash.tap = tap;
    lodash.throttle = throttle;
    lodash.times = times;
    lodash.toArray = toArray;
    lodash.transform = transform;
    lodash.union = union;
    lodash.uniq = uniq;
    lodash.values = values;
    lodash.where = where;
    lodash.without = without;
    lodash.wrap = wrap;
    lodash.xor = xor;
    lodash.zip = zip;
    lodash.zipObject = zipObject;

    // add aliases
    lodash.collect = map;
    lodash.drop = rest;
    lodash.each = forEach;
    lodash.eachRight = forEachRight;
    lodash.extend = assign;
    lodash.methods = functions;
    lodash.object = zipObject;
    lodash.select = filter;
    lodash.tail = rest;
    lodash.unique = uniq;
    lodash.unzip = zip;

    // add functions to `lodash.prototype`
    mixin(lodash);

    /*--------------------------------------------------------------------------*/

    // add functions that return unwrapped values when chaining
    lodash.clone = clone;
    lodash.cloneDeep = cloneDeep;
    lodash.contains = contains;
    lodash.escape = escape;
    lodash.every = every;
    lodash.find = find;
    lodash.findIndex = findIndex;
    lodash.findKey = findKey;
    lodash.findLast = findLast;
    lodash.findLastIndex = findLastIndex;
    lodash.findLastKey = findLastKey;
    lodash.has = has;
    lodash.identity = identity;
    lodash.indexOf = indexOf;
    lodash.isArguments = isArguments;
    lodash.isArray = isArray;
    lodash.isBoolean = isBoolean;
    lodash.isDate = isDate;
    lodash.isElement = isElement;
    lodash.isEmpty = isEmpty;
    lodash.isEqual = isEqual;
    lodash.isFinite = isFinite;
    lodash.isFunction = isFunction;
    lodash.isNaN = isNaN;
    lodash.isNull = isNull;
    lodash.isNumber = isNumber;
    lodash.isObject = isObject;
    lodash.isPlainObject = isPlainObject;
    lodash.isRegExp = isRegExp;
    lodash.isString = isString;
    lodash.isUndefined = isUndefined;
    lodash.lastIndexOf = lastIndexOf;
    lodash.mixin = mixin;
    lodash.noConflict = noConflict;
    lodash.noop = noop;
    lodash.now = now;
    lodash.parseInt = parseInt;
    lodash.random = random;
    lodash.reduce = reduce;
    lodash.reduceRight = reduceRight;
    lodash.result = result;
    lodash.runInContext = runInContext;
    lodash.size = size;
    lodash.some = some;
    lodash.sortedIndex = sortedIndex;
    lodash.template = template;
    lodash.unescape = unescape;
    lodash.uniqueId = uniqueId;

    // add aliases
    lodash.all = every;
    lodash.any = some;
    lodash.detect = find;
    lodash.findWhere = find;
    lodash.foldl = reduce;
    lodash.foldr = reduceRight;
    lodash.include = contains;
    lodash.inject = reduce;

    mixin(function() {
      var source = {}
      forOwn(lodash, function(func, methodName) {
        if (!lodash.prototype[methodName]) {
          source[methodName] = func;
        }
      });
      return source;
    }(), false);

    /*--------------------------------------------------------------------------*/

    // add functions capable of returning wrapped and unwrapped values when chaining
    lodash.first = first;
    lodash.last = last;
    lodash.sample = sample;

    // add aliases
    lodash.take = first;
    lodash.head = first;

    forOwn(lodash, function(func, methodName) {
      var callbackable = methodName !== 'sample';
      if (!lodash.prototype[methodName]) {
        lodash.prototype[methodName]= function(n, guard) {
          var chainAll = this.__chain__,
              result = func(this.__wrapped__, n, guard);

          return !chainAll && (n == null || (guard && !(callbackable && typeof n == 'function')))
            ? result
            : new lodashWrapper(result, chainAll);
        };
      }
    });

    /*--------------------------------------------------------------------------*/

    /**
     * The semantic version number.
     *
     * @static
     * @memberOf _
     * @type string
     */
    lodash.VERSION = '2.4.2';

    // add "Chaining" functions to the wrapper
    lodash.prototype.chain = wrapperChain;
    lodash.prototype.toString = wrapperToString;
    lodash.prototype.value = wrapperValueOf;
    lodash.prototype.valueOf = wrapperValueOf;

    // add `Array` functions that return unwrapped values
    forEach(['join', 'pop', 'shift'], function(methodName) {
      var func = arrayRef[methodName];
      lodash.prototype[methodName] = function() {
        var chainAll = this.__chain__,
            result = func.apply(this.__wrapped__, arguments);

        return chainAll
          ? new lodashWrapper(result, chainAll)
          : result;
      };
    });

    // add `Array` functions that return the existing wrapped value
    forEach(['push', 'reverse', 'sort', 'unshift'], function(methodName) {
      var func = arrayRef[methodName];
      lodash.prototype[methodName] = function() {
        func.apply(this.__wrapped__, arguments);
        return this;
      };
    });

    // add `Array` functions that return new wrapped values
    forEach(['concat', 'slice', 'splice'], function(methodName) {
      var func = arrayRef[methodName];
      lodash.prototype[methodName] = function() {
        return new lodashWrapper(func.apply(this.__wrapped__, arguments), this.__chain__);
      };
    });

    return lodash;
  }

  /*--------------------------------------------------------------------------*/

  // expose Lo-Dash
  var _ = runInContext();

  // some AMD build optimizers like r.js check for condition patterns like the following:
  if (typeof define == 'function' && typeof define.amd == 'object' && define.amd) {
    // Expose Lo-Dash to the global object even when an AMD loader is present in
    // case Lo-Dash is loaded with a RequireJS shim config.
    // See http://requirejs.org/docs/api.html#config-shim
    root._ = _;

    // define as an anonymous module so, through path mapping, it can be
    // referenced as the "underscore" module
    define(function() {
      return _;
    });
  }
  // check for `exports` after `define` in case a build optimizer adds an `exports` object
  else if (freeExports && freeModule) {
    // in Node.js or RingoJS
    if (moduleExports) {
      (freeModule.exports = _)._ = _;
    }
    // in Narwhal or Rhino -require
    else {
      freeExports._ = _;
    }
  }
  else {
    // in a browser or Rhino
    root._ = _;
  }
}.call(this));

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],67:[function(require,module,exports){
(function (process){
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

// a duplex stream is just a stream that is both readable and writable.
// Since JS doesn't have multiple prototypal inheritance, this class
// prototypally inherits from Readable, and then parasitically from
// Writable.

module.exports = Duplex;

/*<replacement>*/
var objectKeys = Object.keys || function (obj) {
  var keys = [];
  for (var key in obj) keys.push(key);
  return keys;
}
/*</replacement>*/


/*<replacement>*/
var util = require('core-util-is');
util.inherits = require('inherits');
/*</replacement>*/

var Readable = require('./_stream_readable');
var Writable = require('./_stream_writable');

util.inherits(Duplex, Readable);

forEach(objectKeys(Writable.prototype), function(method) {
  if (!Duplex.prototype[method])
    Duplex.prototype[method] = Writable.prototype[method];
});

function Duplex(options) {
  if (!(this instanceof Duplex))
    return new Duplex(options);

  Readable.call(this, options);
  Writable.call(this, options);

  if (options && options.readable === false)
    this.readable = false;

  if (options && options.writable === false)
    this.writable = false;

  this.allowHalfOpen = true;
  if (options && options.allowHalfOpen === false)
    this.allowHalfOpen = false;

  this.once('end', onend);
}

// the no-half-open enforcer
function onend() {
  // if we allow half-open state, or if the writable side ended,
  // then we're ok.
  if (this.allowHalfOpen || this._writableState.ended)
    return;

  // no more data can be written.
  // But allow more writes to happen in this tick.
  process.nextTick(this.end.bind(this));
}

function forEach (xs, f) {
  for (var i = 0, l = xs.length; i < l; i++) {
    f(xs[i], i);
  }
}

}).call(this,require('_process'))
},{"./_stream_readable":69,"./_stream_writable":71,"_process":117,"core-util-is":21,"inherits":64}],68:[function(require,module,exports){
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

// a passthrough stream.
// basically just the most minimal sort of Transform stream.
// Every written chunk gets output as-is.

module.exports = PassThrough;

var Transform = require('./_stream_transform');

/*<replacement>*/
var util = require('core-util-is');
util.inherits = require('inherits');
/*</replacement>*/

util.inherits(PassThrough, Transform);

function PassThrough(options) {
  if (!(this instanceof PassThrough))
    return new PassThrough(options);

  Transform.call(this, options);
}

PassThrough.prototype._transform = function(chunk, encoding, cb) {
  cb(null, chunk);
};

},{"./_stream_transform":70,"core-util-is":21,"inherits":64}],69:[function(require,module,exports){
(function (process){
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

module.exports = Readable;

/*<replacement>*/
var isArray = require('isarray');
/*</replacement>*/


/*<replacement>*/
var Buffer = require('buffer').Buffer;
/*</replacement>*/

Readable.ReadableState = ReadableState;

var EE = require('events').EventEmitter;

/*<replacement>*/
if (!EE.listenerCount) EE.listenerCount = function(emitter, type) {
  return emitter.listeners(type).length;
};
/*</replacement>*/

var Stream = require('stream');

/*<replacement>*/
var util = require('core-util-is');
util.inherits = require('inherits');
/*</replacement>*/

var StringDecoder;


/*<replacement>*/
var debug = require('util');
if (debug && debug.debuglog) {
  debug = debug.debuglog('stream');
} else {
  debug = function () {};
}
/*</replacement>*/


util.inherits(Readable, Stream);

function ReadableState(options, stream) {
  var Duplex = require('./_stream_duplex');

  options = options || {};

  // the point at which it stops calling _read() to fill the buffer
  // Note: 0 is a valid value, means "don't call _read preemptively ever"
  var hwm = options.highWaterMark;
  var defaultHwm = options.objectMode ? 16 : 16 * 1024;
  this.highWaterMark = (hwm || hwm === 0) ? hwm : defaultHwm;

  // cast to ints.
  this.highWaterMark = ~~this.highWaterMark;

  this.buffer = [];
  this.length = 0;
  this.pipes = null;
  this.pipesCount = 0;
  this.flowing = null;
  this.ended = false;
  this.endEmitted = false;
  this.reading = false;

  // a flag to be able to tell if the onwrite cb is called immediately,
  // or on a later tick.  We set this to true at first, because any
  // actions that shouldn't happen until "later" should generally also
  // not happen before the first write call.
  this.sync = true;

  // whenever we return null, then we set a flag to say
  // that we're awaiting a 'readable' event emission.
  this.needReadable = false;
  this.emittedReadable = false;
  this.readableListening = false;


  // object stream flag. Used to make read(n) ignore n and to
  // make all the buffer merging and length checks go away
  this.objectMode = !!options.objectMode;

  if (stream instanceof Duplex)
    this.objectMode = this.objectMode || !!options.readableObjectMode;

  // Crypto is kind of old and crusty.  Historically, its default string
  // encoding is 'binary' so we have to make this configurable.
  // Everything else in the universe uses 'utf8', though.
  this.defaultEncoding = options.defaultEncoding || 'utf8';

  // when piping, we only care about 'readable' events that happen
  // after read()ing all the bytes and not getting any pushback.
  this.ranOut = false;

  // the number of writers that are awaiting a drain event in .pipe()s
  this.awaitDrain = 0;

  // if true, a maybeReadMore has been scheduled
  this.readingMore = false;

  this.decoder = null;
  this.encoding = null;
  if (options.encoding) {
    if (!StringDecoder)
      StringDecoder = require('string_decoder/').StringDecoder;
    this.decoder = new StringDecoder(options.encoding);
    this.encoding = options.encoding;
  }
}

function Readable(options) {
  var Duplex = require('./_stream_duplex');

  if (!(this instanceof Readable))
    return new Readable(options);

  this._readableState = new ReadableState(options, this);

  // legacy
  this.readable = true;

  Stream.call(this);
}

// Manually shove something into the read() buffer.
// This returns true if the highWaterMark has not been hit yet,
// similar to how Writable.write() returns true if you should
// write() some more.
Readable.prototype.push = function(chunk, encoding) {
  var state = this._readableState;

  if (util.isString(chunk) && !state.objectMode) {
    encoding = encoding || state.defaultEncoding;
    if (encoding !== state.encoding) {
      chunk = new Buffer(chunk, encoding);
      encoding = '';
    }
  }

  return readableAddChunk(this, state, chunk, encoding, false);
};

// Unshift should *always* be something directly out of read()
Readable.prototype.unshift = function(chunk) {
  var state = this._readableState;
  return readableAddChunk(this, state, chunk, '', true);
};

function readableAddChunk(stream, state, chunk, encoding, addToFront) {
  var er = chunkInvalid(state, chunk);
  if (er) {
    stream.emit('error', er);
  } else if (util.isNullOrUndefined(chunk)) {
    state.reading = false;
    if (!state.ended)
      onEofChunk(stream, state);
  } else if (state.objectMode || chunk && chunk.length > 0) {
    if (state.ended && !addToFront) {
      var e = new Error('stream.push() after EOF');
      stream.emit('error', e);
    } else if (state.endEmitted && addToFront) {
      var e = new Error('stream.unshift() after end event');
      stream.emit('error', e);
    } else {
      if (state.decoder && !addToFront && !encoding)
        chunk = state.decoder.write(chunk);

      if (!addToFront)
        state.reading = false;

      // if we want the data now, just emit it.
      if (state.flowing && state.length === 0 && !state.sync) {
        stream.emit('data', chunk);
        stream.read(0);
      } else {
        // update the buffer info.
        state.length += state.objectMode ? 1 : chunk.length;
        if (addToFront)
          state.buffer.unshift(chunk);
        else
          state.buffer.push(chunk);

        if (state.needReadable)
          emitReadable(stream);
      }

      maybeReadMore(stream, state);
    }
  } else if (!addToFront) {
    state.reading = false;
  }

  return needMoreData(state);
}



// if it's past the high water mark, we can push in some more.
// Also, if we have no data yet, we can stand some
// more bytes.  This is to work around cases where hwm=0,
// such as the repl.  Also, if the push() triggered a
// readable event, and the user called read(largeNumber) such that
// needReadable was set, then we ought to push more, so that another
// 'readable' event will be triggered.
function needMoreData(state) {
  return !state.ended &&
         (state.needReadable ||
          state.length < state.highWaterMark ||
          state.length === 0);
}

// backwards compatibility.
Readable.prototype.setEncoding = function(enc) {
  if (!StringDecoder)
    StringDecoder = require('string_decoder/').StringDecoder;
  this._readableState.decoder = new StringDecoder(enc);
  this._readableState.encoding = enc;
  return this;
};

// Don't raise the hwm > 128MB
var MAX_HWM = 0x800000;
function roundUpToNextPowerOf2(n) {
  if (n >= MAX_HWM) {
    n = MAX_HWM;
  } else {
    // Get the next highest power of 2
    n--;
    for (var p = 1; p < 32; p <<= 1) n |= n >> p;
    n++;
  }
  return n;
}

function howMuchToRead(n, state) {
  if (state.length === 0 && state.ended)
    return 0;

  if (state.objectMode)
    return n === 0 ? 0 : 1;

  if (isNaN(n) || util.isNull(n)) {
    // only flow one buffer at a time
    if (state.flowing && state.buffer.length)
      return state.buffer[0].length;
    else
      return state.length;
  }

  if (n <= 0)
    return 0;

  // If we're asking for more than the target buffer level,
  // then raise the water mark.  Bump up to the next highest
  // power of 2, to prevent increasing it excessively in tiny
  // amounts.
  if (n > state.highWaterMark)
    state.highWaterMark = roundUpToNextPowerOf2(n);

  // don't have that much.  return null, unless we've ended.
  if (n > state.length) {
    if (!state.ended) {
      state.needReadable = true;
      return 0;
    } else
      return state.length;
  }

  return n;
}

// you can override either this method, or the async _read(n) below.
Readable.prototype.read = function(n) {
  debug('read', n);
  var state = this._readableState;
  var nOrig = n;

  if (!util.isNumber(n) || n > 0)
    state.emittedReadable = false;

  // if we're doing read(0) to trigger a readable event, but we
  // already have a bunch of data in the buffer, then just trigger
  // the 'readable' event and move on.
  if (n === 0 &&
      state.needReadable &&
      (state.length >= state.highWaterMark || state.ended)) {
    debug('read: emitReadable', state.length, state.ended);
    if (state.length === 0 && state.ended)
      endReadable(this);
    else
      emitReadable(this);
    return null;
  }

  n = howMuchToRead(n, state);

  // if we've ended, and we're now clear, then finish it up.
  if (n === 0 && state.ended) {
    if (state.length === 0)
      endReadable(this);
    return null;
  }

  // All the actual chunk generation logic needs to be
  // *below* the call to _read.  The reason is that in certain
  // synthetic stream cases, such as passthrough streams, _read
  // may be a completely synchronous operation which may change
  // the state of the read buffer, providing enough data when
  // before there was *not* enough.
  //
  // So, the steps are:
  // 1. Figure out what the state of things will be after we do
  // a read from the buffer.
  //
  // 2. If that resulting state will trigger a _read, then call _read.
  // Note that this may be asynchronous, or synchronous.  Yes, it is
  // deeply ugly to write APIs this way, but that still doesn't mean
  // that the Readable class should behave improperly, as streams are
  // designed to be sync/async agnostic.
  // Take note if the _read call is sync or async (ie, if the read call
  // has returned yet), so that we know whether or not it's safe to emit
  // 'readable' etc.
  //
  // 3. Actually pull the requested chunks out of the buffer and return.

  // if we need a readable event, then we need to do some reading.
  var doRead = state.needReadable;
  debug('need readable', doRead);

  // if we currently have less than the highWaterMark, then also read some
  if (state.length === 0 || state.length - n < state.highWaterMark) {
    doRead = true;
    debug('length less than watermark', doRead);
  }

  // however, if we've ended, then there's no point, and if we're already
  // reading, then it's unnecessary.
  if (state.ended || state.reading) {
    doRead = false;
    debug('reading or ended', doRead);
  }

  if (doRead) {
    debug('do read');
    state.reading = true;
    state.sync = true;
    // if the length is currently zero, then we *need* a readable event.
    if (state.length === 0)
      state.needReadable = true;
    // call internal read method
    this._read(state.highWaterMark);
    state.sync = false;
  }

  // If _read pushed data synchronously, then `reading` will be false,
  // and we need to re-evaluate how much data we can return to the user.
  if (doRead && !state.reading)
    n = howMuchToRead(nOrig, state);

  var ret;
  if (n > 0)
    ret = fromList(n, state);
  else
    ret = null;

  if (util.isNull(ret)) {
    state.needReadable = true;
    n = 0;
  }

  state.length -= n;

  // If we have nothing in the buffer, then we want to know
  // as soon as we *do* get something into the buffer.
  if (state.length === 0 && !state.ended)
    state.needReadable = true;

  // If we tried to read() past the EOF, then emit end on the next tick.
  if (nOrig !== n && state.ended && state.length === 0)
    endReadable(this);

  if (!util.isNull(ret))
    this.emit('data', ret);

  return ret;
};

function chunkInvalid(state, chunk) {
  var er = null;
  if (!util.isBuffer(chunk) &&
      !util.isString(chunk) &&
      !util.isNullOrUndefined(chunk) &&
      !state.objectMode) {
    er = new TypeError('Invalid non-string/buffer chunk');
  }
  return er;
}


function onEofChunk(stream, state) {
  if (state.decoder && !state.ended) {
    var chunk = state.decoder.end();
    if (chunk && chunk.length) {
      state.buffer.push(chunk);
      state.length += state.objectMode ? 1 : chunk.length;
    }
  }
  state.ended = true;

  // emit 'readable' now to make sure it gets picked up.
  emitReadable(stream);
}

// Don't emit readable right away in sync mode, because this can trigger
// another read() call => stack overflow.  This way, it might trigger
// a nextTick recursion warning, but that's not so bad.
function emitReadable(stream) {
  var state = stream._readableState;
  state.needReadable = false;
  if (!state.emittedReadable) {
    debug('emitReadable', state.flowing);
    state.emittedReadable = true;
    if (state.sync)
      process.nextTick(function() {
        emitReadable_(stream);
      });
    else
      emitReadable_(stream);
  }
}

function emitReadable_(stream) {
  debug('emit readable');
  stream.emit('readable');
  flow(stream);
}


// at this point, the user has presumably seen the 'readable' event,
// and called read() to consume some data.  that may have triggered
// in turn another _read(n) call, in which case reading = true if
// it's in progress.
// However, if we're not ended, or reading, and the length < hwm,
// then go ahead and try to read some more preemptively.
function maybeReadMore(stream, state) {
  if (!state.readingMore) {
    state.readingMore = true;
    process.nextTick(function() {
      maybeReadMore_(stream, state);
    });
  }
}

function maybeReadMore_(stream, state) {
  var len = state.length;
  while (!state.reading && !state.flowing && !state.ended &&
         state.length < state.highWaterMark) {
    debug('maybeReadMore read 0');
    stream.read(0);
    if (len === state.length)
      // didn't get any data, stop spinning.
      break;
    else
      len = state.length;
  }
  state.readingMore = false;
}

// abstract method.  to be overridden in specific implementation classes.
// call cb(er, data) where data is <= n in length.
// for virtual (non-string, non-buffer) streams, "length" is somewhat
// arbitrary, and perhaps not very meaningful.
Readable.prototype._read = function(n) {
  this.emit('error', new Error('not implemented'));
};

Readable.prototype.pipe = function(dest, pipeOpts) {
  var src = this;
  var state = this._readableState;

  switch (state.pipesCount) {
    case 0:
      state.pipes = dest;
      break;
    case 1:
      state.pipes = [state.pipes, dest];
      break;
    default:
      state.pipes.push(dest);
      break;
  }
  state.pipesCount += 1;
  debug('pipe count=%d opts=%j', state.pipesCount, pipeOpts);

  var doEnd = (!pipeOpts || pipeOpts.end !== false) &&
              dest !== process.stdout &&
              dest !== process.stderr;

  var endFn = doEnd ? onend : cleanup;
  if (state.endEmitted)
    process.nextTick(endFn);
  else
    src.once('end', endFn);

  dest.on('unpipe', onunpipe);
  function onunpipe(readable) {
    debug('onunpipe');
    if (readable === src) {
      cleanup();
    }
  }

  function onend() {
    debug('onend');
    dest.end();
  }

  // when the dest drains, it reduces the awaitDrain counter
  // on the source.  This would be more elegant with a .once()
  // handler in flow(), but adding and removing repeatedly is
  // too slow.
  var ondrain = pipeOnDrain(src);
  dest.on('drain', ondrain);

  function cleanup() {
    debug('cleanup');
    // cleanup event handlers once the pipe is broken
    dest.removeListener('close', onclose);
    dest.removeListener('finish', onfinish);
    dest.removeListener('drain', ondrain);
    dest.removeListener('error', onerror);
    dest.removeListener('unpipe', onunpipe);
    src.removeListener('end', onend);
    src.removeListener('end', cleanup);
    src.removeListener('data', ondata);

    // if the reader is waiting for a drain event from this
    // specific writer, then it would cause it to never start
    // flowing again.
    // So, if this is awaiting a drain, then we just call it now.
    // If we don't know, then assume that we are waiting for one.
    if (state.awaitDrain &&
        (!dest._writableState || dest._writableState.needDrain))
      ondrain();
  }

  src.on('data', ondata);
  function ondata(chunk) {
    debug('ondata');
    var ret = dest.write(chunk);
    if (false === ret) {
      debug('false write response, pause',
            src._readableState.awaitDrain);
      src._readableState.awaitDrain++;
      src.pause();
    }
  }

  // if the dest has an error, then stop piping into it.
  // however, don't suppress the throwing behavior for this.
  function onerror(er) {
    debug('onerror', er);
    unpipe();
    dest.removeListener('error', onerror);
    if (EE.listenerCount(dest, 'error') === 0)
      dest.emit('error', er);
  }
  // This is a brutally ugly hack to make sure that our error handler
  // is attached before any userland ones.  NEVER DO THIS.
  if (!dest._events || !dest._events.error)
    dest.on('error', onerror);
  else if (isArray(dest._events.error))
    dest._events.error.unshift(onerror);
  else
    dest._events.error = [onerror, dest._events.error];



  // Both close and finish should trigger unpipe, but only once.
  function onclose() {
    dest.removeListener('finish', onfinish);
    unpipe();
  }
  dest.once('close', onclose);
  function onfinish() {
    debug('onfinish');
    dest.removeListener('close', onclose);
    unpipe();
  }
  dest.once('finish', onfinish);

  function unpipe() {
    debug('unpipe');
    src.unpipe(dest);
  }

  // tell the dest that it's being piped to
  dest.emit('pipe', src);

  // start the flow if it hasn't been started already.
  if (!state.flowing) {
    debug('pipe resume');
    src.resume();
  }

  return dest;
};

function pipeOnDrain(src) {
  return function() {
    var state = src._readableState;
    debug('pipeOnDrain', state.awaitDrain);
    if (state.awaitDrain)
      state.awaitDrain--;
    if (state.awaitDrain === 0 && EE.listenerCount(src, 'data')) {
      state.flowing = true;
      flow(src);
    }
  };
}


Readable.prototype.unpipe = function(dest) {
  var state = this._readableState;

  // if we're not piping anywhere, then do nothing.
  if (state.pipesCount === 0)
    return this;

  // just one destination.  most common case.
  if (state.pipesCount === 1) {
    // passed in one, but it's not the right one.
    if (dest && dest !== state.pipes)
      return this;

    if (!dest)
      dest = state.pipes;

    // got a match.
    state.pipes = null;
    state.pipesCount = 0;
    state.flowing = false;
    if (dest)
      dest.emit('unpipe', this);
    return this;
  }

  // slow case. multiple pipe destinations.

  if (!dest) {
    // remove all.
    var dests = state.pipes;
    var len = state.pipesCount;
    state.pipes = null;
    state.pipesCount = 0;
    state.flowing = false;

    for (var i = 0; i < len; i++)
      dests[i].emit('unpipe', this);
    return this;
  }

  // try to find the right one.
  var i = indexOf(state.pipes, dest);
  if (i === -1)
    return this;

  state.pipes.splice(i, 1);
  state.pipesCount -= 1;
  if (state.pipesCount === 1)
    state.pipes = state.pipes[0];

  dest.emit('unpipe', this);

  return this;
};

// set up data events if they are asked for
// Ensure readable listeners eventually get something
Readable.prototype.on = function(ev, fn) {
  var res = Stream.prototype.on.call(this, ev, fn);

  // If listening to data, and it has not explicitly been paused,
  // then call resume to start the flow of data on the next tick.
  if (ev === 'data' && false !== this._readableState.flowing) {
    this.resume();
  }

  if (ev === 'readable' && this.readable) {
    var state = this._readableState;
    if (!state.readableListening) {
      state.readableListening = true;
      state.emittedReadable = false;
      state.needReadable = true;
      if (!state.reading) {
        var self = this;
        process.nextTick(function() {
          debug('readable nexttick read 0');
          self.read(0);
        });
      } else if (state.length) {
        emitReadable(this, state);
      }
    }
  }

  return res;
};
Readable.prototype.addListener = Readable.prototype.on;

// pause() and resume() are remnants of the legacy readable stream API
// If the user uses them, then switch into old mode.
Readable.prototype.resume = function() {
  var state = this._readableState;
  if (!state.flowing) {
    debug('resume');
    state.flowing = true;
    if (!state.reading) {
      debug('resume read 0');
      this.read(0);
    }
    resume(this, state);
  }
  return this;
};

function resume(stream, state) {
  if (!state.resumeScheduled) {
    state.resumeScheduled = true;
    process.nextTick(function() {
      resume_(stream, state);
    });
  }
}

function resume_(stream, state) {
  state.resumeScheduled = false;
  stream.emit('resume');
  flow(stream);
  if (state.flowing && !state.reading)
    stream.read(0);
}

Readable.prototype.pause = function() {
  debug('call pause flowing=%j', this._readableState.flowing);
  if (false !== this._readableState.flowing) {
    debug('pause');
    this._readableState.flowing = false;
    this.emit('pause');
  }
  return this;
};

function flow(stream) {
  var state = stream._readableState;
  debug('flow', state.flowing);
  if (state.flowing) {
    do {
      var chunk = stream.read();
    } while (null !== chunk && state.flowing);
  }
}

// wrap an old-style stream as the async data source.
// This is *not* part of the readable stream interface.
// It is an ugly unfortunate mess of history.
Readable.prototype.wrap = function(stream) {
  var state = this._readableState;
  var paused = false;

  var self = this;
  stream.on('end', function() {
    debug('wrapped end');
    if (state.decoder && !state.ended) {
      var chunk = state.decoder.end();
      if (chunk && chunk.length)
        self.push(chunk);
    }

    self.push(null);
  });

  stream.on('data', function(chunk) {
    debug('wrapped data');
    if (state.decoder)
      chunk = state.decoder.write(chunk);
    if (!chunk || !state.objectMode && !chunk.length)
      return;

    var ret = self.push(chunk);
    if (!ret) {
      paused = true;
      stream.pause();
    }
  });

  // proxy all the other methods.
  // important when wrapping filters and duplexes.
  for (var i in stream) {
    if (util.isFunction(stream[i]) && util.isUndefined(this[i])) {
      this[i] = function(method) { return function() {
        return stream[method].apply(stream, arguments);
      }}(i);
    }
  }

  // proxy certain important events.
  var events = ['error', 'close', 'destroy', 'pause', 'resume'];
  forEach(events, function(ev) {
    stream.on(ev, self.emit.bind(self, ev));
  });

  // when we try to consume some more bytes, simply unpause the
  // underlying stream.
  self._read = function(n) {
    debug('wrapped _read', n);
    if (paused) {
      paused = false;
      stream.resume();
    }
  };

  return self;
};



// exposed for testing purposes only.
Readable._fromList = fromList;

// Pluck off n bytes from an array of buffers.
// Length is the combined lengths of all the buffers in the list.
function fromList(n, state) {
  var list = state.buffer;
  var length = state.length;
  var stringMode = !!state.decoder;
  var objectMode = !!state.objectMode;
  var ret;

  // nothing in the list, definitely empty.
  if (list.length === 0)
    return null;

  if (length === 0)
    ret = null;
  else if (objectMode)
    ret = list.shift();
  else if (!n || n >= length) {
    // read it all, truncate the array.
    if (stringMode)
      ret = list.join('');
    else
      ret = Buffer.concat(list, length);
    list.length = 0;
  } else {
    // read just some of it.
    if (n < list[0].length) {
      // just take a part of the first list item.
      // slice is the same for buffers and strings.
      var buf = list[0];
      ret = buf.slice(0, n);
      list[0] = buf.slice(n);
    } else if (n === list[0].length) {
      // first list is a perfect match
      ret = list.shift();
    } else {
      // complex case.
      // we have enough to cover it, but it spans past the first buffer.
      if (stringMode)
        ret = '';
      else
        ret = new Buffer(n);

      var c = 0;
      for (var i = 0, l = list.length; i < l && c < n; i++) {
        var buf = list[0];
        var cpy = Math.min(n - c, buf.length);

        if (stringMode)
          ret += buf.slice(0, cpy);
        else
          buf.copy(ret, c, 0, cpy);

        if (cpy < buf.length)
          list[0] = buf.slice(cpy);
        else
          list.shift();

        c += cpy;
      }
    }
  }

  return ret;
}

function endReadable(stream) {
  var state = stream._readableState;

  // If we get here before consuming all the bytes, then that is a
  // bug in node.  Should never happen.
  if (state.length > 0)
    throw new Error('endReadable called on non-empty stream');

  if (!state.endEmitted) {
    state.ended = true;
    process.nextTick(function() {
      // Check that we didn't get one last unshift.
      if (!state.endEmitted && state.length === 0) {
        state.endEmitted = true;
        stream.readable = false;
        stream.emit('end');
      }
    });
  }
}

function forEach (xs, f) {
  for (var i = 0, l = xs.length; i < l; i++) {
    f(xs[i], i);
  }
}

function indexOf (xs, x) {
  for (var i = 0, l = xs.length; i < l; i++) {
    if (xs[i] === x) return i;
  }
  return -1;
}

}).call(this,require('_process'))
},{"./_stream_duplex":67,"_process":117,"buffer":108,"core-util-is":21,"events":110,"inherits":64,"isarray":65,"stream":129,"string_decoder/":73,"util":106}],70:[function(require,module,exports){
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


// a transform stream is a readable/writable stream where you do
// something with the data.  Sometimes it's called a "filter",
// but that's not a great name for it, since that implies a thing where
// some bits pass through, and others are simply ignored.  (That would
// be a valid example of a transform, of course.)
//
// While the output is causally related to the input, it's not a
// necessarily symmetric or synchronous transformation.  For example,
// a zlib stream might take multiple plain-text writes(), and then
// emit a single compressed chunk some time in the future.
//
// Here's how this works:
//
// The Transform stream has all the aspects of the readable and writable
// stream classes.  When you write(chunk), that calls _write(chunk,cb)
// internally, and returns false if there's a lot of pending writes
// buffered up.  When you call read(), that calls _read(n) until
// there's enough pending readable data buffered up.
//
// In a transform stream, the written data is placed in a buffer.  When
// _read(n) is called, it transforms the queued up data, calling the
// buffered _write cb's as it consumes chunks.  If consuming a single
// written chunk would result in multiple output chunks, then the first
// outputted bit calls the readcb, and subsequent chunks just go into
// the read buffer, and will cause it to emit 'readable' if necessary.
//
// This way, back-pressure is actually determined by the reading side,
// since _read has to be called to start processing a new chunk.  However,
// a pathological inflate type of transform can cause excessive buffering
// here.  For example, imagine a stream where every byte of input is
// interpreted as an integer from 0-255, and then results in that many
// bytes of output.  Writing the 4 bytes {ff,ff,ff,ff} would result in
// 1kb of data being output.  In this case, you could write a very small
// amount of input, and end up with a very large amount of output.  In
// such a pathological inflating mechanism, there'd be no way to tell
// the system to stop doing the transform.  A single 4MB write could
// cause the system to run out of memory.
//
// However, even in such a pathological case, only a single written chunk
// would be consumed, and then the rest would wait (un-transformed) until
// the results of the previous transformed chunk were consumed.

module.exports = Transform;

var Duplex = require('./_stream_duplex');

/*<replacement>*/
var util = require('core-util-is');
util.inherits = require('inherits');
/*</replacement>*/

util.inherits(Transform, Duplex);


function TransformState(options, stream) {
  this.afterTransform = function(er, data) {
    return afterTransform(stream, er, data);
  };

  this.needTransform = false;
  this.transforming = false;
  this.writecb = null;
  this.writechunk = null;
}

function afterTransform(stream, er, data) {
  var ts = stream._transformState;
  ts.transforming = false;

  var cb = ts.writecb;

  if (!cb)
    return stream.emit('error', new Error('no writecb in Transform class'));

  ts.writechunk = null;
  ts.writecb = null;

  if (!util.isNullOrUndefined(data))
    stream.push(data);

  if (cb)
    cb(er);

  var rs = stream._readableState;
  rs.reading = false;
  if (rs.needReadable || rs.length < rs.highWaterMark) {
    stream._read(rs.highWaterMark);
  }
}


function Transform(options) {
  if (!(this instanceof Transform))
    return new Transform(options);

  Duplex.call(this, options);

  this._transformState = new TransformState(options, this);

  // when the writable side finishes, then flush out anything remaining.
  var stream = this;

  // start out asking for a readable event once data is transformed.
  this._readableState.needReadable = true;

  // we have implemented the _read method, and done the other things
  // that Readable wants before the first _read call, so unset the
  // sync guard flag.
  this._readableState.sync = false;

  this.once('prefinish', function() {
    if (util.isFunction(this._flush))
      this._flush(function(er) {
        done(stream, er);
      });
    else
      done(stream);
  });
}

Transform.prototype.push = function(chunk, encoding) {
  this._transformState.needTransform = false;
  return Duplex.prototype.push.call(this, chunk, encoding);
};

// This is the part where you do stuff!
// override this function in implementation classes.
// 'chunk' is an input chunk.
//
// Call `push(newChunk)` to pass along transformed output
// to the readable side.  You may call 'push' zero or more times.
//
// Call `cb(err)` when you are done with this chunk.  If you pass
// an error, then that'll put the hurt on the whole operation.  If you
// never call cb(), then you'll never get another chunk.
Transform.prototype._transform = function(chunk, encoding, cb) {
  throw new Error('not implemented');
};

Transform.prototype._write = function(chunk, encoding, cb) {
  var ts = this._transformState;
  ts.writecb = cb;
  ts.writechunk = chunk;
  ts.writeencoding = encoding;
  if (!ts.transforming) {
    var rs = this._readableState;
    if (ts.needTransform ||
        rs.needReadable ||
        rs.length < rs.highWaterMark)
      this._read(rs.highWaterMark);
  }
};

// Doesn't matter what the args are here.
// _transform does all the work.
// That we got here means that the readable side wants more data.
Transform.prototype._read = function(n) {
  var ts = this._transformState;

  if (!util.isNull(ts.writechunk) && ts.writecb && !ts.transforming) {
    ts.transforming = true;
    this._transform(ts.writechunk, ts.writeencoding, ts.afterTransform);
  } else {
    // mark that we need a transform, so that any data that comes in
    // will get processed, now that we've asked for it.
    ts.needTransform = true;
  }
};


function done(stream, er) {
  if (er)
    return stream.emit('error', er);

  // if there's nothing in the write buffer, then that means
  // that nothing more will ever be provided
  var ws = stream._writableState;
  var ts = stream._transformState;

  if (ws.length)
    throw new Error('calling transform done when ws.length != 0');

  if (ts.transforming)
    throw new Error('calling transform done when still transforming');

  return stream.push(null);
}

},{"./_stream_duplex":67,"core-util-is":21,"inherits":64}],71:[function(require,module,exports){
(function (process){
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

// A bit simpler than readable streams.
// Implement an async ._write(chunk, cb), and it'll handle all
// the drain event emission and buffering.

module.exports = Writable;

/*<replacement>*/
var Buffer = require('buffer').Buffer;
/*</replacement>*/

Writable.WritableState = WritableState;


/*<replacement>*/
var util = require('core-util-is');
util.inherits = require('inherits');
/*</replacement>*/

var Stream = require('stream');

util.inherits(Writable, Stream);

function WriteReq(chunk, encoding, cb) {
  this.chunk = chunk;
  this.encoding = encoding;
  this.callback = cb;
}

function WritableState(options, stream) {
  var Duplex = require('./_stream_duplex');

  options = options || {};

  // the point at which write() starts returning false
  // Note: 0 is a valid value, means that we always return false if
  // the entire buffer is not flushed immediately on write()
  var hwm = options.highWaterMark;
  var defaultHwm = options.objectMode ? 16 : 16 * 1024;
  this.highWaterMark = (hwm || hwm === 0) ? hwm : defaultHwm;

  // object stream flag to indicate whether or not this stream
  // contains buffers or objects.
  this.objectMode = !!options.objectMode;

  if (stream instanceof Duplex)
    this.objectMode = this.objectMode || !!options.writableObjectMode;

  // cast to ints.
  this.highWaterMark = ~~this.highWaterMark;

  this.needDrain = false;
  // at the start of calling end()
  this.ending = false;
  // when end() has been called, and returned
  this.ended = false;
  // when 'finish' is emitted
  this.finished = false;

  // should we decode strings into buffers before passing to _write?
  // this is here so that some node-core streams can optimize string
  // handling at a lower level.
  var noDecode = options.decodeStrings === false;
  this.decodeStrings = !noDecode;

  // Crypto is kind of old and crusty.  Historically, its default string
  // encoding is 'binary' so we have to make this configurable.
  // Everything else in the universe uses 'utf8', though.
  this.defaultEncoding = options.defaultEncoding || 'utf8';

  // not an actual buffer we keep track of, but a measurement
  // of how much we're waiting to get pushed to some underlying
  // socket or file.
  this.length = 0;

  // a flag to see when we're in the middle of a write.
  this.writing = false;

  // when true all writes will be buffered until .uncork() call
  this.corked = 0;

  // a flag to be able to tell if the onwrite cb is called immediately,
  // or on a later tick.  We set this to true at first, because any
  // actions that shouldn't happen until "later" should generally also
  // not happen before the first write call.
  this.sync = true;

  // a flag to know if we're processing previously buffered items, which
  // may call the _write() callback in the same tick, so that we don't
  // end up in an overlapped onwrite situation.
  this.bufferProcessing = false;

  // the callback that's passed to _write(chunk,cb)
  this.onwrite = function(er) {
    onwrite(stream, er);
  };

  // the callback that the user supplies to write(chunk,encoding,cb)
  this.writecb = null;

  // the amount that is being written when _write is called.
  this.writelen = 0;

  this.buffer = [];

  // number of pending user-supplied write callbacks
  // this must be 0 before 'finish' can be emitted
  this.pendingcb = 0;

  // emit prefinish if the only thing we're waiting for is _write cbs
  // This is relevant for synchronous Transform streams
  this.prefinished = false;

  // True if the error was already emitted and should not be thrown again
  this.errorEmitted = false;
}

function Writable(options) {
  var Duplex = require('./_stream_duplex');

  // Writable ctor is applied to Duplexes, though they're not
  // instanceof Writable, they're instanceof Readable.
  if (!(this instanceof Writable) && !(this instanceof Duplex))
    return new Writable(options);

  this._writableState = new WritableState(options, this);

  // legacy.
  this.writable = true;

  Stream.call(this);
}

// Otherwise people can pipe Writable streams, which is just wrong.
Writable.prototype.pipe = function() {
  this.emit('error', new Error('Cannot pipe. Not readable.'));
};


function writeAfterEnd(stream, state, cb) {
  var er = new Error('write after end');
  // TODO: defer error events consistently everywhere, not just the cb
  stream.emit('error', er);
  process.nextTick(function() {
    cb(er);
  });
}

// If we get something that is not a buffer, string, null, or undefined,
// and we're not in objectMode, then that's an error.
// Otherwise stream chunks are all considered to be of length=1, and the
// watermarks determine how many objects to keep in the buffer, rather than
// how many bytes or characters.
function validChunk(stream, state, chunk, cb) {
  var valid = true;
  if (!util.isBuffer(chunk) &&
      !util.isString(chunk) &&
      !util.isNullOrUndefined(chunk) &&
      !state.objectMode) {
    var er = new TypeError('Invalid non-string/buffer chunk');
    stream.emit('error', er);
    process.nextTick(function() {
      cb(er);
    });
    valid = false;
  }
  return valid;
}

Writable.prototype.write = function(chunk, encoding, cb) {
  var state = this._writableState;
  var ret = false;

  if (util.isFunction(encoding)) {
    cb = encoding;
    encoding = null;
  }

  if (util.isBuffer(chunk))
    encoding = 'buffer';
  else if (!encoding)
    encoding = state.defaultEncoding;

  if (!util.isFunction(cb))
    cb = function() {};

  if (state.ended)
    writeAfterEnd(this, state, cb);
  else if (validChunk(this, state, chunk, cb)) {
    state.pendingcb++;
    ret = writeOrBuffer(this, state, chunk, encoding, cb);
  }

  return ret;
};

Writable.prototype.cork = function() {
  var state = this._writableState;

  state.corked++;
};

Writable.prototype.uncork = function() {
  var state = this._writableState;

  if (state.corked) {
    state.corked--;

    if (!state.writing &&
        !state.corked &&
        !state.finished &&
        !state.bufferProcessing &&
        state.buffer.length)
      clearBuffer(this, state);
  }
};

function decodeChunk(state, chunk, encoding) {
  if (!state.objectMode &&
      state.decodeStrings !== false &&
      util.isString(chunk)) {
    chunk = new Buffer(chunk, encoding);
  }
  return chunk;
}

// if we're already writing something, then just put this
// in the queue, and wait our turn.  Otherwise, call _write
// If we return false, then we need a drain event, so set that flag.
function writeOrBuffer(stream, state, chunk, encoding, cb) {
  chunk = decodeChunk(state, chunk, encoding);
  if (util.isBuffer(chunk))
    encoding = 'buffer';
  var len = state.objectMode ? 1 : chunk.length;

  state.length += len;

  var ret = state.length < state.highWaterMark;
  // we must ensure that previous needDrain will not be reset to false.
  if (!ret)
    state.needDrain = true;

  if (state.writing || state.corked)
    state.buffer.push(new WriteReq(chunk, encoding, cb));
  else
    doWrite(stream, state, false, len, chunk, encoding, cb);

  return ret;
}

function doWrite(stream, state, writev, len, chunk, encoding, cb) {
  state.writelen = len;
  state.writecb = cb;
  state.writing = true;
  state.sync = true;
  if (writev)
    stream._writev(chunk, state.onwrite);
  else
    stream._write(chunk, encoding, state.onwrite);
  state.sync = false;
}

function onwriteError(stream, state, sync, er, cb) {
  if (sync)
    process.nextTick(function() {
      state.pendingcb--;
      cb(er);
    });
  else {
    state.pendingcb--;
    cb(er);
  }

  stream._writableState.errorEmitted = true;
  stream.emit('error', er);
}

function onwriteStateUpdate(state) {
  state.writing = false;
  state.writecb = null;
  state.length -= state.writelen;
  state.writelen = 0;
}

function onwrite(stream, er) {
  var state = stream._writableState;
  var sync = state.sync;
  var cb = state.writecb;

  onwriteStateUpdate(state);

  if (er)
    onwriteError(stream, state, sync, er, cb);
  else {
    // Check if we're actually ready to finish, but don't emit yet
    var finished = needFinish(stream, state);

    if (!finished &&
        !state.corked &&
        !state.bufferProcessing &&
        state.buffer.length) {
      clearBuffer(stream, state);
    }

    if (sync) {
      process.nextTick(function() {
        afterWrite(stream, state, finished, cb);
      });
    } else {
      afterWrite(stream, state, finished, cb);
    }
  }
}

function afterWrite(stream, state, finished, cb) {
  if (!finished)
    onwriteDrain(stream, state);
  state.pendingcb--;
  cb();
  finishMaybe(stream, state);
}

// Must force callback to be called on nextTick, so that we don't
// emit 'drain' before the write() consumer gets the 'false' return
// value, and has a chance to attach a 'drain' listener.
function onwriteDrain(stream, state) {
  if (state.length === 0 && state.needDrain) {
    state.needDrain = false;
    stream.emit('drain');
  }
}


// if there's something in the buffer waiting, then process it
function clearBuffer(stream, state) {
  state.bufferProcessing = true;

  if (stream._writev && state.buffer.length > 1) {
    // Fast case, write everything using _writev()
    var cbs = [];
    for (var c = 0; c < state.buffer.length; c++)
      cbs.push(state.buffer[c].callback);

    // count the one we are adding, as well.
    // TODO(isaacs) clean this up
    state.pendingcb++;
    doWrite(stream, state, true, state.length, state.buffer, '', function(err) {
      for (var i = 0; i < cbs.length; i++) {
        state.pendingcb--;
        cbs[i](err);
      }
    });

    // Clear buffer
    state.buffer = [];
  } else {
    // Slow case, write chunks one-by-one
    for (var c = 0; c < state.buffer.length; c++) {
      var entry = state.buffer[c];
      var chunk = entry.chunk;
      var encoding = entry.encoding;
      var cb = entry.callback;
      var len = state.objectMode ? 1 : chunk.length;

      doWrite(stream, state, false, len, chunk, encoding, cb);

      // if we didn't call the onwrite immediately, then
      // it means that we need to wait until it does.
      // also, that means that the chunk and cb are currently
      // being processed, so move the buffer counter past them.
      if (state.writing) {
        c++;
        break;
      }
    }

    if (c < state.buffer.length)
      state.buffer = state.buffer.slice(c);
    else
      state.buffer.length = 0;
  }

  state.bufferProcessing = false;
}

Writable.prototype._write = function(chunk, encoding, cb) {
  cb(new Error('not implemented'));

};

Writable.prototype._writev = null;

Writable.prototype.end = function(chunk, encoding, cb) {
  var state = this._writableState;

  if (util.isFunction(chunk)) {
    cb = chunk;
    chunk = null;
    encoding = null;
  } else if (util.isFunction(encoding)) {
    cb = encoding;
    encoding = null;
  }

  if (!util.isNullOrUndefined(chunk))
    this.write(chunk, encoding);

  // .end() fully uncorks
  if (state.corked) {
    state.corked = 1;
    this.uncork();
  }

  // ignore unnecessary end() calls.
  if (!state.ending && !state.finished)
    endWritable(this, state, cb);
};


function needFinish(stream, state) {
  return (state.ending &&
          state.length === 0 &&
          !state.finished &&
          !state.writing);
}

function prefinish(stream, state) {
  if (!state.prefinished) {
    state.prefinished = true;
    stream.emit('prefinish');
  }
}

function finishMaybe(stream, state) {
  var need = needFinish(stream, state);
  if (need) {
    if (state.pendingcb === 0) {
      prefinish(stream, state);
      state.finished = true;
      stream.emit('finish');
    } else
      prefinish(stream, state);
  }
  return need;
}

function endWritable(stream, state, cb) {
  state.ending = true;
  finishMaybe(stream, state);
  if (cb) {
    if (state.finished)
      process.nextTick(cb);
    else
      stream.once('finish', cb);
  }
  state.ended = true;
}

}).call(this,require('_process'))
},{"./_stream_duplex":67,"_process":117,"buffer":108,"core-util-is":21,"inherits":64,"stream":129}],72:[function(require,module,exports){
(function (process){
exports = module.exports = require('./lib/_stream_readable.js');
exports.Stream = require('stream');
exports.Readable = exports;
exports.Writable = require('./lib/_stream_writable.js');
exports.Duplex = require('./lib/_stream_duplex.js');
exports.Transform = require('./lib/_stream_transform.js');
exports.PassThrough = require('./lib/_stream_passthrough.js');
if (!process.browser && process.env.READABLE_STREAM === 'disable') {
  module.exports = require('stream');
}

}).call(this,require('_process'))
},{"./lib/_stream_duplex.js":67,"./lib/_stream_passthrough.js":68,"./lib/_stream_readable.js":69,"./lib/_stream_transform.js":70,"./lib/_stream_writable.js":71,"_process":117,"stream":129}],73:[function(require,module,exports){
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

var Buffer = require('buffer').Buffer;

var isBufferEncoding = Buffer.isEncoding
  || function(encoding) {
       switch (encoding && encoding.toLowerCase()) {
         case 'hex': case 'utf8': case 'utf-8': case 'ascii': case 'binary': case 'base64': case 'ucs2': case 'ucs-2': case 'utf16le': case 'utf-16le': case 'raw': return true;
         default: return false;
       }
     }


function assertEncoding(encoding) {
  if (encoding && !isBufferEncoding(encoding)) {
    throw new Error('Unknown encoding: ' + encoding);
  }
}

// StringDecoder provides an interface for efficiently splitting a series of
// buffers into a series of JS strings without breaking apart multi-byte
// characters. CESU-8 is handled as part of the UTF-8 encoding.
//
// @TODO Handling all encodings inside a single object makes it very difficult
// to reason about this code, so it should be split up in the future.
// @TODO There should be a utf8-strict encoding that rejects invalid UTF-8 code
// points as used by CESU-8.
var StringDecoder = exports.StringDecoder = function(encoding) {
  this.encoding = (encoding || 'utf8').toLowerCase().replace(/[-_]/, '');
  assertEncoding(encoding);
  switch (this.encoding) {
    case 'utf8':
      // CESU-8 represents each of Surrogate Pair by 3-bytes
      this.surrogateSize = 3;
      break;
    case 'ucs2':
    case 'utf16le':
      // UTF-16 represents each of Surrogate Pair by 2-bytes
      this.surrogateSize = 2;
      this.detectIncompleteChar = utf16DetectIncompleteChar;
      break;
    case 'base64':
      // Base-64 stores 3 bytes in 4 chars, and pads the remainder.
      this.surrogateSize = 3;
      this.detectIncompleteChar = base64DetectIncompleteChar;
      break;
    default:
      this.write = passThroughWrite;
      return;
  }

  // Enough space to store all bytes of a single character. UTF-8 needs 4
  // bytes, but CESU-8 may require up to 6 (3 bytes per surrogate).
  this.charBuffer = new Buffer(6);
  // Number of bytes received for the current incomplete multi-byte character.
  this.charReceived = 0;
  // Number of bytes expected for the current incomplete multi-byte character.
  this.charLength = 0;
};


// write decodes the given buffer and returns it as JS string that is
// guaranteed to not contain any partial multi-byte characters. Any partial
// character found at the end of the buffer is buffered up, and will be
// returned when calling write again with the remaining bytes.
//
// Note: Converting a Buffer containing an orphan surrogate to a String
// currently works, but converting a String to a Buffer (via `new Buffer`, or
// Buffer#write) will replace incomplete surrogates with the unicode
// replacement character. See https://codereview.chromium.org/121173009/ .
StringDecoder.prototype.write = function(buffer) {
  var charStr = '';
  // if our last write ended with an incomplete multibyte character
  while (this.charLength) {
    // determine how many remaining bytes this buffer has to offer for this char
    var available = (buffer.length >= this.charLength - this.charReceived) ?
        this.charLength - this.charReceived :
        buffer.length;

    // add the new bytes to the char buffer
    buffer.copy(this.charBuffer, this.charReceived, 0, available);
    this.charReceived += available;

    if (this.charReceived < this.charLength) {
      // still not enough chars in this buffer? wait for more ...
      return '';
    }

    // remove bytes belonging to the current character from the buffer
    buffer = buffer.slice(available, buffer.length);

    // get the character that was split
    charStr = this.charBuffer.slice(0, this.charLength).toString(this.encoding);

    // CESU-8: lead surrogate (D800-DBFF) is also the incomplete character
    var charCode = charStr.charCodeAt(charStr.length - 1);
    if (charCode >= 0xD800 && charCode <= 0xDBFF) {
      this.charLength += this.surrogateSize;
      charStr = '';
      continue;
    }
    this.charReceived = this.charLength = 0;

    // if there are no more bytes in this buffer, just emit our char
    if (buffer.length === 0) {
      return charStr;
    }
    break;
  }

  // determine and set charLength / charReceived
  this.detectIncompleteChar(buffer);

  var end = buffer.length;
  if (this.charLength) {
    // buffer the incomplete character bytes we got
    buffer.copy(this.charBuffer, 0, buffer.length - this.charReceived, end);
    end -= this.charReceived;
  }

  charStr += buffer.toString(this.encoding, 0, end);

  var end = charStr.length - 1;
  var charCode = charStr.charCodeAt(end);
  // CESU-8: lead surrogate (D800-DBFF) is also the incomplete character
  if (charCode >= 0xD800 && charCode <= 0xDBFF) {
    var size = this.surrogateSize;
    this.charLength += size;
    this.charReceived += size;
    this.charBuffer.copy(this.charBuffer, size, 0, size);
    buffer.copy(this.charBuffer, 0, 0, size);
    return charStr.substring(0, end);
  }

  // or just emit the charStr
  return charStr;
};

// detectIncompleteChar determines if there is an incomplete UTF-8 character at
// the end of the given buffer. If so, it sets this.charLength to the byte
// length that character, and sets this.charReceived to the number of bytes
// that are available for this character.
StringDecoder.prototype.detectIncompleteChar = function(buffer) {
  // determine how many bytes we have to check at the end of this buffer
  var i = (buffer.length >= 3) ? 3 : buffer.length;

  // Figure out if one of the last i bytes of our buffer announces an
  // incomplete char.
  for (; i > 0; i--) {
    var c = buffer[buffer.length - i];

    // See http://en.wikipedia.org/wiki/UTF-8#Description

    // 110XXXXX
    if (i == 1 && c >> 5 == 0x06) {
      this.charLength = 2;
      break;
    }

    // 1110XXXX
    if (i <= 2 && c >> 4 == 0x0E) {
      this.charLength = 3;
      break;
    }

    // 11110XXX
    if (i <= 3 && c >> 3 == 0x1E) {
      this.charLength = 4;
      break;
    }
  }
  this.charReceived = i;
};

StringDecoder.prototype.end = function(buffer) {
  var res = '';
  if (buffer && buffer.length)
    res = this.write(buffer);

  if (this.charReceived) {
    var cr = this.charReceived;
    var buf = this.charBuffer;
    var enc = this.encoding;
    res += buf.slice(0, cr).toString(enc);
  }

  return res;
};

function passThroughWrite(buffer) {
  return buffer.toString(this.encoding);
}

function utf16DetectIncompleteChar(buffer) {
  this.charReceived = buffer.length % 2;
  this.charLength = this.charReceived ? 2 : 0;
}

function base64DetectIncompleteChar(buffer) {
  this.charReceived = buffer.length % 3;
  this.charLength = this.charReceived ? 3 : 0;
}

},{"buffer":108}],74:[function(require,module,exports){
var stopwords = {
  ar: require('./stopwords-ar.json'),
  bg: require('./stopwords-bg.json'),
  cs: require('./stopwords-cs.json'),
  da: require('./stopwords-da.json'),
  de: require('./stopwords-de.json'),
  en: require('./stopwords-en.json'),
  es: require('./stopwords-es.json'),
  fi: require('./stopwords-fi.json'),
  fr: require('./stopwords-fr.json'),
  hu: require('./stopwords-hu.json'),
  id: require('./stopwords-id.json'),
  it: require('./stopwords-it.json'),
  ko: require('./stopwords-ko.json'),
  nb: require('./stopwords-nb.json'),
  nl: require('./stopwords-nl.json'),
  no: require('./stopwords-no.json'),
  pl: require('./stopwords-pl.json'),
  pt: require('./stopwords-pt.json'),
  ru: require('./stopwords-ru.json'),
  sv: require('./stopwords-sv.json'),
  th: require('./stopwords-th.json'),
  tr: require('./stopwords-tr.json'),
  zh: require('./stopwords-zh.json')
}

module.exports = function(language) {
  var sw;

  if (stopwords.hasOwnProperty(language)) {
    sw = stopwords[language]
  } else {
    console.error("WARNING: No stopwords found for '" + language + "' - defaulting to English!")
    sw = stopwords.en
  }

  return sw
}

},{"./stopwords-ar.json":75,"./stopwords-bg.json":76,"./stopwords-cs.json":77,"./stopwords-da.json":78,"./stopwords-de.json":79,"./stopwords-en.json":80,"./stopwords-es.json":81,"./stopwords-fi.json":82,"./stopwords-fr.json":83,"./stopwords-hu.json":84,"./stopwords-id.json":85,"./stopwords-it.json":86,"./stopwords-ko.json":87,"./stopwords-nb.json":88,"./stopwords-nl.json":89,"./stopwords-no.json":90,"./stopwords-pl.json":91,"./stopwords-pt.json":92,"./stopwords-ru.json":93,"./stopwords-sv.json":94,"./stopwords-th.json":95,"./stopwords-tr.json":96,"./stopwords-zh.json":97}],75:[function(require,module,exports){
module.exports=[
  "\ufeffفى\r",
  "في\r",
  "كل\r",
  "لم\r",
  "لن\r",
  "له\r",
  "من\r",
  "هو\r",
  "هي\r",
  "قوة\r",
  "كما\r",
  "لها\r",
  "منذ\r",
  "وقد\r",
  "ولا\r",
  "نفسه\r",
  "لقاء\r",
  "مقابل\r",
  "هناك\r",
  "وقال\r",
  "وكان\r",
  "نهاية\r",
  "وقالت\r",
  "وكانت\r",
  "للامم\r",
  "فيه\r",
  "كلم\r",
  "لكن\r",
  "وفي\r",
  "وقف\r",
  "ولم\r",
  "ومن\r",
  "وهو\r",
  "وهي\r",
  "يوم\r",
  "فيها\r",
  "منها\r",
  "مليار\r",
  "لوكالة\r",
  "يكون\r",
  "يمكن\r",
  "مليون\r",
  "حيث\r",
  "اكد\r",
  "الا\r",
  "اما\r",
  "امس\r",
  "السابق\r",
  "التى\r",
  "التي\r",
  "اكثر\r",
  "ايار\r",
  "ايضا\r",
  "ثلاثة\r",
  "الذاتي\r",
  "الاخيرة\r",
  "الثاني\r",
  "الثانية\r",
  "الذى\r",
  "الذي\r",
  "الان\r",
  "امام\r",
  "ايام\r",
  "خلال\r",
  "حوالى\r",
  "الذين\r",
  "الاول\r",
  "الاولى\r",
  "بين\r",
  "ذلك\r",
  "دون\r",
  "حول\r",
  "حين\r",
  "الف\r",
  "الى\r",
  "انه\r",
  "اول\r",
  "ضمن\r",
  "انها\r",
  "جميع\r",
  "الماضي\r",
  "الوقت\r",
  "المقبل\r",
  "اليوم\r",
  "ـ\r",
  "ف\r",
  "و\r",
  "و6\r",
  "قد\r",
  "لا\r",
  "ما\r",
  "مع\r",
  "مساء\r",
  "هذا\r",
  "واحد\r",
  "واضاف\r",
  "واضافت\r",
  "فان\r",
  "قبل\r",
  "قال\r",
  "كان\r",
  "لدى\r",
  "نحو\r",
  "هذه\r",
  "وان\r",
  "واكد\r",
  "كانت\r",
  "واوضح\r",
  "مايو\r",
  "ب\r",
  "ا\r",
  "أ\r",
  "،\r",
  "عشر\r",
  "عدد\r",
  "عدة\r",
  "عشرة\r",
  "عدم\r",
  "عام\r",
  "عاما\r",
  "عن\r",
  "عند\r",
  "عندما\r",
  "على\r",
  "عليه\r",
  "عليها\r",
  "زيارة\r",
  "سنة\r",
  "سنوات\r",
  "تم\r",
  "ضد\r",
  "بعد\r",
  "بعض\r",
  "اعادة\r",
  "اعلنت\r",
  "بسبب\r",
  "حتى\r",
  "اذا\r",
  "احد\r",
  "اثر\r",
  "برس\r",
  "باسم\r",
  "غدا\r",
  "شخصا\r",
  "صباح\r",
  "اطار\r",
  "اربعة\r",
  "اخرى\r",
  "بان\r",
  "اجل\r",
  "غير\r",
  "بشكل\r",
  "حاليا\r",
  "بن\r",
  "به\r",
  "ثم\r",
  "اف\r",
  "ان\r",
  "او\r",
  "اي\r",
  "بها\r",
  "صفر"
]

},{}],76:[function(require,module,exports){
module.exports=[
  "а\r",
  "автентичен\r",
  "аз\r",
  "ако\r",
  "ала\r",
  "бе\r",
  "без\r",
  "беше\r",
  "би\r",
  "бивш\r",
  "бивша\r",
  "бившо\r",
  "бил\r",
  "била\r",
  "били\r",
  "било\r",
  "благодаря\r",
  "близо\r",
  "бъдат\r",
  "бъде\r",
  "бяха\r",
  "в\r",
  "вас\r",
  "ваш\r",
  "ваша\r",
  "вероятно\r",
  "вече\r",
  "взема\r",
  "ви\r",
  "вие\r",
  "винаги\r",
  "внимава\r",
  "време\r",
  "все\r",
  "всеки\r",
  "всички\r",
  "всичко\r",
  "всяка\r",
  "във\r",
  "въпреки\r",
  "върху\r",
  "г\r",
  "ги\r",
  "главен\r",
  "главна\r",
  "главно\r",
  "глас\r",
  "го\r",
  "година\r",
  "години\r",
  "годишен\r",
  "д\r",
  "да\r",
  "дали\r",
  "два\r",
  "двама\r",
  "двамата\r",
  "две\r",
  "двете\r",
  "ден\r",
  "днес\r",
  "дни\r",
  "до\r",
  "добра\r",
  "добре\r",
  "добро\r",
  "добър\r",
  "докато\r",
  "докога\r",
  "дори\r",
  "досега\r",
  "доста\r",
  "друг\r",
  "друга\r",
  "други\r",
  "е\r",
  "евтин\r",
  "едва\r",
  "един\r",
  "една\r",
  "еднаква\r",
  "еднакви\r",
  "еднакъв\r",
  "едно\r",
  "екип\r",
  "ето\r",
  "живот\r",
  "за\r",
  "забавям\r",
  "зад\r",
  "заедно\r",
  "заради\r",
  "засега\r",
  "заспал\r",
  "затова\r",
  "защо\r",
  "защото\r",
  "и\r",
  "из\r",
  "или\r",
  "им\r",
  "има\r",
  "имат\r",
  "иска\r",
  "й\r",
  "каза\r",
  "как\r",
  "каква\r",
  "какво\r",
  "както\r",
  "какъв\r",
  "като\r",
  "кога\r",
  "когато\r",
  "което\r",
  "които\r",
  "кой\r",
  "който\r",
  "колко\r",
  "която\r",
  "къде\r",
  "където\r",
  "към\r",
  "лесен\r",
  "лесно\r",
  "ли\r",
  "лош\r",
  "м\r",
  "май\r",
  "малко\r",
  "ме\r",
  "между\r",
  "мек\r",
  "мен\r",
  "месец\r",
  "ми\r",
  "много\r",
  "мнозина\r",
  "мога\r",
  "могат\r",
  "може\r",
  "мокър\r",
  "моля\r",
  "момента\r",
  "му\r",
  "н\r",
  "на\r",
  "над\r",
  "назад\r",
  "най\r",
  "направи\r",
  "напред\r",
  "например\r",
  "нас\r",
  "не\r",
  "него\r",
  "нещо\r",
  "нея\r",
  "ни\r",
  "ние\r",
  "никой\r",
  "нито\r",
  "нищо\r",
  "но\r",
  "нов\r",
  "нова\r",
  "нови\r",
  "новина\r",
  "някои\r",
  "някой\r",
  "няколко\r",
  "няма\r",
  "обаче\r",
  "около\r",
  "освен\r",
  "особено\r",
  "от\r",
  "отгоре\r",
  "отново\r",
  "още\r",
  "пак\r",
  "по\r",
  "повече\r",
  "повечето\r",
  "под\r",
  "поне\r",
  "поради\r",
  "после\r",
  "почти\r",
  "прави\r",
  "пред\r",
  "преди\r",
  "през\r",
  "при\r",
  "пък\r",
  "първата\r",
  "първи\r",
  "първо\r",
  "пъти\r",
  "равен\r",
  "равна\r",
  "с\r",
  "са\r",
  "сам\r",
  "само\r",
  "се\r",
  "сега\r",
  "си\r",
  "син\r",
  "скоро\r",
  "след\r",
  "следващ\r",
  "сме\r",
  "смях\r",
  "според\r",
  "сред\r",
  "срещу\r",
  "сте\r",
  "съм\r",
  "със\r",
  "също\r",
  "т\r",
  "тази\r",
  "така\r",
  "такива\r",
  "такъв\r",
  "там\r",
  "твой\r",
  "те\r",
  "тези\r",
  "ти\r",
  "т.н.\r",
  "то\r",
  "това\r",
  "тогава\r",
  "този\r",
  "той\r",
  "толкова\r",
  "точно\r",
  "три\r",
  "трябва\r",
  "тук\r",
  "тъй\r",
  "тя\r",
  "тях\r",
  "у\r",
  "утре\r",
  "харесва\r",
  "хиляди\r",
  "ч\r",
  "часа\r",
  "че\r",
  "често\r",
  "чрез\r",
  "ще\r",
  "щом\r",
  "юмрук\r",
  "я\r",
  "як"
]

},{}],77:[function(require,module,exports){
module.exports=[
  "ačkoli\r",
  "ahoj\r",
  "ale\r",
  "anebo\r",
  "ano\r",
  "asi\r",
  "aspoň\r",
  "během\r",
  "bez\r",
  "beze\r",
  "blízko\r",
  "bohužel\r",
  "brzo\r",
  "bude\r",
  "budeme\r",
  "budeš\r",
  "budete\r",
  "budou\r",
  "budu\r",
  "byl\r",
  "byla\r",
  "byli\r",
  "bylo\r",
  "byly\r",
  "bys\r",
  "čau\r",
  "chce\r",
  "chceme\r",
  "chceš\r",
  "chcete\r",
  "chci\r",
  "chtějí\r",
  "chtít\r",
  "chut'\r",
  "chuti\r",
  "co\r",
  "čtrnáct\r",
  "čtyři\r",
  "dál\r",
  "dále\r",
  "daleko\r",
  "děkovat\r",
  "děkujeme\r",
  "děkuji\r",
  "den\r",
  "deset\r",
  "devatenáct\r",
  "devět\r",
  "do\r",
  "dobrý\r",
  "docela\r",
  "dva\r",
  "dvacet\r",
  "dvanáct\r",
  "dvě\r",
  "hodně\r",
  "já\r",
  "jak\r",
  "jde\r",
  "je\r",
  "jeden\r",
  "jedenáct\r",
  "jedna\r",
  "jedno\r",
  "jednou\r",
  "jedou\r",
  "jeho\r",
  "její\r",
  "jejich\r",
  "jemu\r",
  "jen\r",
  "jenom\r",
  "ještě\r",
  "jestli\r",
  "jestliže\r",
  "jí\r",
  "jich\r",
  "jím\r",
  "jimi\r",
  "jinak\r",
  "jsem\r",
  "jsi\r",
  "jsme\r",
  "jsou\r",
  "jste\r",
  "kam\r",
  "kde\r",
  "kdo\r",
  "kdy\r",
  "když\r",
  "ke\r",
  "kolik\r",
  "kromě\r",
  "která\r",
  "které\r",
  "kteří\r",
  "který\r",
  "kvůli\r",
  "má\r",
  "mají\r",
  "málo\r",
  "mám\r",
  "máme\r",
  "máš\r",
  "máte\r",
  "mé\r",
  "mě\r",
  "mezi\r",
  "mí\r",
  "mít\r",
  "mně\r",
  "mnou\r",
  "moc\r",
  "mohl\r",
  "mohou\r",
  "moje\r",
  "moji\r",
  "možná\r",
  "můj\r",
  "musí\r",
  "může\r",
  "my\r",
  "na\r",
  "nad\r",
  "nade\r",
  "nám\r",
  "námi\r",
  "naproti\r",
  "nás\r",
  "náš\r",
  "naše\r",
  "naši\r",
  "ne\r",
  "ně\r",
  "nebo\r",
  "nebyl\r",
  "nebyla\r",
  "nebyli\r",
  "nebyly\r",
  "něco\r",
  "nedělá\r",
  "nedělají\r",
  "nedělám\r",
  "neděláme\r",
  "neděláš\r",
  "neděláte\r",
  "nějak\r",
  "nejsi\r",
  "někde\r",
  "někdo\r",
  "nemají\r",
  "nemáme\r",
  "nemáte\r",
  "neměl\r",
  "němu\r",
  "není\r",
  "nestačí\r",
  "nevadí\r",
  "než\r",
  "nic\r",
  "nich\r",
  "ním\r",
  "nimi\r",
  "nula\r",
  "od\r",
  "ode\r",
  "on\r",
  "ona\r",
  "oni\r",
  "ono\r",
  "ony\r",
  "osm\r",
  "osmnáct\r",
  "pak\r",
  "patnáct\r",
  "pět\r",
  "po\r",
  "pořád\r",
  "potom\r",
  "pozdě\r",
  "před\r",
  "přes\r",
  "přese\r",
  "pro\r",
  "proč\r",
  "prosím\r",
  "prostě\r",
  "proti\r",
  "protože\r",
  "rovně\r",
  "se\r",
  "sedm\r",
  "sedmnáct\r",
  "šest\r",
  "šestnáct\r",
  "skoro\r",
  "smějí\r",
  "smí\r",
  "snad\r",
  "spolu\r",
  "sta\r",
  "sté\r",
  "sto\r",
  "ta\r",
  "tady\r",
  "tak\r",
  "takhle\r",
  "taky\r",
  "tam\r",
  "tamhle\r",
  "tamhleto\r",
  "tamto\r",
  "tě\r",
  "tebe\r",
  "tebou\r",
  "ted'\r",
  "tedy\r",
  "ten\r",
  "ti\r",
  "tisíc\r",
  "tisíce\r",
  "to\r",
  "tobě\r",
  "tohle\r",
  "toto\r",
  "třeba\r",
  "tři\r",
  "třináct\r",
  "trošku\r",
  "tvá\r",
  "tvé\r",
  "tvoje\r",
  "tvůj\r",
  "ty\r",
  "určitě\r",
  "už\r",
  "vám\r",
  "vámi\r",
  "vás\r",
  "váš\r",
  "vaše\r",
  "vaši\r",
  "ve\r",
  "večer\r",
  "vedle\r",
  "vlastně\r",
  "všechno\r",
  "všichni\r",
  "vůbec\r",
  "vy\r",
  "vždy\r",
  "za\r",
  "zač\r",
  "zatímco\r",
  "ze\r",
  "že"
]

},{}],78:[function(require,module,exports){
module.exports=[
  "af",
  "alle",
  "andet",
  "andre",
  "at",
  "begge",
  "da",
  "de",
  "den",
  "denne",
  "der",
  "deres",
  "det",
  "dette",
  "dig",
  "din",
  "dog",
  "du",
  "ej",
  "eller",
  "en",
  "end",
  "ene",
  "eneste",
  "enhver",
  "et",
  "fem",
  "fire",
  "flere",
  "fleste",
  "for",
  "fordi",
  "forrige",
  "fra",
  "få",
  "før",
  "god",
  "han",
  "hans",
  "har",
  "hendes",
  "her",
  "hun",
  "hvad",
  "hvem",
  "hver",
  "hvilken",
  "hvis",
  "hvor",
  "hvordan",
  "hvorfor",
  "hvornår",
  "i",
  "ikke",
  "ind",
  "ingen",
  "intet",
  "jeg",
  "jeres",
  "kan",
  "kom",
  "kommer",
  "lav",
  "lidt",
  "lille",
  "man",
  "mand",
  "mange",
  "med",
  "meget",
  "men",
  "mens",
  "mere",
  "mig",
  "ned",
  "ni",
  "nogen",
  "noget",
  "ny",
  "nyt",
  "nær",
  "næste",
  "næsten",
  "og",
  "op",
  "otte",
  "over",
  "på",
  "se",
  "seks",
  "ses",
  "som",
  "stor",
  "store",
  "syv",
  "ti",
  "til",
  "to",
  "tre",
  "ud",
  "var",
  ""
]

},{}],79:[function(require,module,exports){
module.exports=[
  "der",
  "die",
  "und",
  "in",
  "den",
  "von",
  "zu",
  "mit",
  "ist",
  "das",
  "des",
  "im",
  "für",
  "auf",
  "sich",
  "dem",
  "Die",
  "nicht",
  "ein",
  "eine",
  "als",
  "auch",
  "an",
  "es",
  "er",
  "aus",
  "bei",
  "werden",
  "sie",
  "nach",
  "Der",
  "sind",
  "war",
  "wurde",
  "wird",
  "einer",
  "Das",
  "hat",
  "am",
  "wie",
  "um",
  "Sie",
  "zum",
  "oder",
  "einen",
  "über",
  "dass",
  "einem",
  "noch",
  "bis",
  "nur",
  "vor",
  "zur",
  "durch",
  "so",
  "haben",
  "aber",
  "ich",
  "In",
  "man",
  "mehr",
  "wir",
  "daß",
  "kann",
  "sein",
  "vom",
  "Es",
  "unter",
  "Ich",
  "hatte",
  "gegen",
  "Im",
  "Er",
  "wenn",
  "dieser",
  "seine",
  "eines",
  "können",
  "diese",
  "wieder",
  "wurden",
  "dann",
  "was",
  "schon",
  "Jahr",
  "zwei",
  "seiner",
  "Jahre",
  "Jahren",
  "ihre",
  "gibt",
  "zwischen",
  "Ein",
  "immer",
  "waren",
  "Zeit",
  "Uhr",
  "keine",
  "Wir",
  "sei",
  "habe",
  "sehr",
  "hier",
  "alle",
  "Nach",
  "ab",
  "sowie",
  "da",
  "beim",
  "heute",
  "seit",
  "diesem",
  "uns",
  "soll",
  "Und",
  "Deutschland",
  "Mit",
  "anderen",
  "jedoch",
  "ihr",
  "damit",
  "ersten",
  "drei",
  "Auch",
  "doch",
  "ihm",
  "seinen",
  "Stadt",
  "etwa",
  "sagte",
  "ihn",
  "Eine",
  "sondern",
  "bereits",
  "müssen",
  "ohne",
  "Menschen",
  "will",
  "Prozent",
  "ihrer",
  "worden",
  "Bei",
  "selbst",
  "jetzt",
  "of",
  "Als",
  "seinem",
  "neue",
  "muss",
  "allem",
  "neuen",
  "Ende",
  "nun",
  "Von",
  "geht",
  "ihren",
  "SPD",
  "So",
  "Für",
  "weil",
  "wo",
  "mich",
  "mir",
  "Aber",
  "Am",
  "Diese",
  "ganz",
  "dieses",
  "etwas",
  "andere",
  "Geschichte",
  "Frau",
  "liegt",
  "Wenn",
  "ins",
  "gut",
  "einmal",
  "konnte",
  "Euro",
  "du",
  "denn",
  "viele",
  "Auf",
  "machen",
  "Herr",
  "Leben",
  "the",
  "diesen",
  "erst",
  "lassen",
  "Wie",
  "dort",
  "beiden",
  "erste",
  "The",
  "Teil",
  "deutschen",
  "weiter",
  "also",
  "viel",
  "sollte",
  "dabei",
  "Millionen",
  "Was",
  "später",
  "hatten",
  "während",
  "Welt",
  "ISBN",
  "sagt",
  "denen",
  "wollen",
  "steht",
  "Da",
  "kommt",
  "kein",
  "vier",
  "nichts",
  "de",
  "allerdings",
  "Seite",
  "ob",
  "dazu",
  "gab",
  "s",
  "letzten",
  "kam",
  "USA",
  "wegen",
  "dies",
  "zurück",
  "großen",
  "kommen",
  "alles",
  "rund",
  "ja",
  "sollen",
  "deren",
  "dafür",
  "Doch",
  "Kinder",
  "wäre",
  "Frage",
  "weitere",
  "würde",
  "dessen",
  "große",
  "Januar",
  "zwar",
  "darauf",
  "Arbeit",
  "",
  "Beispiel",
  "September",
  "zusammen",
  "einige",
  "Land",
  "allen",
  "fast",
  "Frauen",
  "März",
  "Namen",
  "Unternehmen",
  "ihrem",
  "davon",
  "Mann",
  "Mai",
  "Platz",
  "deutsche",
  "werde",
  "Oktober",
  "muß",
  "Literatur",
  "Art",
  "ihnen",
  "Deutschen",
  "fünf",
  "gilt",
  "sehen",
  "könnte",
  "Dezember",
  "stehen",
  "sogar",
  "seien",
  "Wer",
  "Seit",
  "August",
  "bin",
  "Beifall",
  "Fall",
  "Juni",
  "eigenen",
  "November",
  "mal",
  "Film",
  "finden",
  "sagen",
  "Regierung",
  "April",
  "München",
  "oft",
  "Dies",
  "lange",
  "ebenfalls",
  "bekannt",
  "Präsident",
  "wohl",
  "CDU/CSU",
  "Zu",
  "gehört",
  "Man",
  "weniger",
  "gerade",
  "statt",
  "aller",
  "Juli",
  "möchte",
  "Weg",
  "Entwicklung",
  "zunächst",
  "ging",
  "Mark",
  "Bild",
  "möglich",
  "gar",
  "besonders",
  "hätte",
  "macht",
  "Politik",
  "geben",
  "Tag",
  "Ihnen",
  "Februar",
  "Hier",
  "Gemeinde",
  "wenig",
  "gewesen",
  "Europa",
  "gehen",
  "gemacht",
  "welche",
  "New",
  "gegenüber",
  "heißt",
  "Familie",
  "Union",
  "tun",
  "Jahrhundert",
  "einfach",
  "Frankfurt",
  "deutlich",
  "Dabei",
  "neben",
  "sollten",
  "Kirche",
  "keinen",
  "Artikel",
  "Ihre",
  "Peter",
  "Thema",
  "besteht",
  "vielen",
  "nie",
  "bzw.",
  "Aus",
  "Zeitung",
  "wollte",
  "Kommission",
  "seines",
  "Hamburg",
  "hätten",
  "Geld",
  "meine",
  "Dr",
  "kaum",
  "zweiten",
  "Während",
  "lässt",
  "Anfang",
  "Um",
  "Ort",
  "weiß",
  "findet",
  "Bereich",
  "Haus",
  "anderem",
  "Mal",
  "",
  "deshalb",
  "alten",
  "erhalten",
  "zehn",
  "Zum",
  "bisher",
  "meisten",
  "darüber",
  "würden",
  "hin",
  "Form",
  "An",
  "bleibt",
  "sieht",
  "Gesellschaft",
  "Berliner",
  "Den",
  "vergangenen",
  "bezeichnet",
  "Nr.",
  "Ziel",
  "je",
  "weit",
  "Grund",
  "sechs",
  "darf",
  "Rolle",
  "Deutsche",
  "wissen",
  "jeder",
  "zeigt",
  "Damit",
  "Denn",
  "mehrere",
  "nächsten",
  "Vor",
  "Dann",
  "schließlich",
  "kleinen",
  "Durch",
  "Michael",
  "km",
  "Lage",
  "Gruppe",
  "Band",
  "damals",
  "Spiel",
  "Sohn",
  "Dr.",
  "stark",
  "Universität",
  "Hilfe",
  "besser",
  "hinter",
  "meist",
  "Seine",
  "St.",
  "stellt",
  "Tage",
  "unsere",
  "daher",
  "Nur",
  "wirklich",
  "führt",
  "Dieser",
  "beispielsweise",
  "kurz",
  "Bericht",
  "gleich",
  "weiteren",
  "Straße",
  "bleiben",
  "Wirtschaft",
  "Siehe",
  "Zukunft",
  "eher",
  "Bedeutung",
  "Recht",
  "insbesondere",
  "Bevölkerung",
  "schnell",
  "nehmen",
  "Verlag",
  "CDU",
  "Tod",
  "Alle",
  "solche",
  "neu",
  "Bundesregierung",
  "pro",
  "Frankreich",
  "Jahres",
  "konnten",
  "Ihr",
  "ließ",
  "Du",
  "kleine",
  "Europäischen",
  "Vater",
  "genannt",
  "lang",
  "Titel",
  "Rahmen",
  "Wort",
  "eigentlich",
  "erhielt",
  "einigen",
  "Woche",
  "FC",
  "Musik",
  "dagegen",
  "Sein",
  "allein",
  "Einsatz",
  "genau",
  "begann",
  "innerhalb",
  "unserer",
  "Partei",
  "Polizei",
  "Wasser",
  "bringen",
  "deutscher",
  "natürlich",
  "eigene",
  "",
  "Wochen",
  "insgesamt",
  "Außerdem",
  "Bis",
  "halten",
  "politischen",
  "musste",
  "Parlament",
  "Meter",
  "Hand",
  "Zahl",
  "stellen",
  "gesagt",
  "führen",
  "daran",
  "Erfolg",
  "befindet",
  "Zur",
  "verschiedenen",
  "Probleme",
  "Unter",
  "Abgeordneten",
  "Milliarden",
  "nahm",
  "stand",
  "geworden",
  "c",
  "liegen",
  "erstmals",
  "Sprache",
  "Fragen",
  "nämlich",
  "Ja",
  "Kollegen",
  "Männer",
  "Nicht",
  "Wolfgang",
  "Problem",
  "Mutter",
  "Minuten",
  "Weitere",
  "Mitte",
  "Mitglied",
  "Jahrhunderts",
  "Krieg",
  "Hans",
  "könnten",
  "Thomas",
  "Über",
  "Personen",
  "Friedrich",
  "ca.",
  "ebenso",
  "machte",
  "York",
  "vielleicht",
  "Stelle",
  "derzeit",
  "Ländern",
  "Höhe",
  "verwendet",
  "gute",
  "überhaupt",
  "Länder",
  "Angaben",
  "führte",
  "gegeben",
  "Tel.",
  "klar",
  "Karl",
  "europäischen",
  "sicher",
  "Saison",
  "Programm",
  "erreicht",
  "GRÜNEN",
  "beide",
  "Sonntag",
  "sowohl",
  "Region",
  "alte",
  "Staaten",
  "Paris",
  "Beginn",
  "Buch",
  "zweite",
  "ganze",
  "hinaus",
  "König",
  "Morgen",
  "handelt",
  "fand",
  "Schweiz",
  "jeweils",
  "Weise",
  "DM",
  "fest",
  "per",
  "blieb",
  "Mitglieder",
  "Richtung",
  "Heute",
  "Stunden",
  "leicht",
  "Leute",
  "wobei",
  "gehören",
  "bietet",
  "Wien",
  "politische",
  "Folge",
  "Blick",
  "aufgrund",
  "Entscheidung",
  "Dort",
  "Neben",
  "hält",
  "Gebiet",
  "gemeinsam",
  "erklärt",
  "direkt",
  "könne",
  "Daten",
  "recht",
  "schwer",
  "Bayern",
  "jeden",
  "Name",
  "Schule",
  "GmbH",
  "dürfen",
  "laut",
  "Seiten",
  "Bürger",
  "Eltern",
  "dpa",
  "Meinung",
  "Werke",
  "Jetzt",
  "letzte",
  "Spieler",
  "bald",
  "London",
  "häufig",
  "heutigen",
  "Einwohner",
  "acht",
  "eben",
  "Internet",
  "Markt",
  "dich",
  "Nein",
  "Situation",
  "System",
  "zuvor",
  "Möglichkeit",
  "Freitag",
  "mein",
  "Mannheim",
  "Fenster",
  "Kosten",
  "inzwischen",
  "kamen",
  "John",
  "sieben",
  "bekommen",
  "erreichen",
  "unser",
  "Verfügung",
  "Köln",
  "Dazu",
  "besten",
  "Zusammenhang",
  "Reihe",
  "Kritik",
  "richtig",
  "Liste",
  "Herren",
  "Augen",
  "taz",
  "zeigen",
  "siehe",
  "hohen",
  "spielte",
  "leben",
  "völlig",
  "Neue",
  "ihres",
  "spielt",
  "Sicherheit",
  "weiterhin",
  "hoch",
  "nachdem",
  "gegründet",
  "erneut",
  "sah",
  "z.",
  "wer",
  "Informationen",
  "anders",
  "spielen",
  "Dieses",
  "gleichen",
  "Kultur",
  "größten",
  "eingesetzt",
  "Unterstützung",
  "Beim",
  "erklärte",
  "Allerdings",
  "Firma",
  "Amt",
  "Kopf",
  "trotz",
  "Erst",
  "gebracht",
  "gestellt",
  "läuft",
  "schließen",
  "Bilder",
  "nimmt",
  "Mitarbeiter",
  "BÜNDNIS",
  "Deshalb",
  "verschiedene",
  "zudem",
  "Werk",
  "Ergebnis",
  "Heinrich",
  "Bau",
  "ehemaligen",
  "Preis",
  "Tochter",
  "Stuttgart",
  "Samstag",
  "Bad",
  "Verfahren",
  "Kind",
  "früher",
  "Paul",
  "darin",
  "paar",
  "Punkt",
  "Weblinks",
  "Nun",
  "Maßnahmen",
  "Österreich",
  "Wilhelm",
  "Herrn",
  "z.B.",
  "Noch",
  "Staat",
  "Zusammenarbeit",
  "knapp",
  "Nacht",
  "einzelnen",
  "trat",
  "gestern",
  "Team",
  "Osten",
  "scheint",
  "Mannschaft",
  "Tagen",
  "internationalen",
  "jede",
  "mindestens",
  "teilweise",
  "einzige",
  "Soldaten",
  "setzt",
  "gefunden",
  "Kunst",
  "lediglich",
  "öffentlichen",
  "bedeutet",
  "Raum",
  "gewann",
  "Kampf",
  "Martin",
  "Ist",
  "Begriff",
  "Hause",
  "entwickelt",
  "Wahl",
  "Schon",
  "arbeiten",
  "größte",
  "Donnerstag",
  "Ab",
  "Viele",
  "Quellen",
  "Nachdem",
  "dadurch",
  "Italien",
  "erster",
  "gekommen",
  "dir",
  "Mittwoch",
  "danach",
  "stellte",
  "her",
  "zahlreiche",
  "Landes",
  "Gesetz",
  "Monaten",
  "PDS",
  "Rat",
  "Franz",
  "Verein",
  "sonst",
  "Frankfurter",
  "Meine",
  "Klaus",
  "Karriere",
  "müsse",
  "meiner",
  "anderer",
  "zuletzt",
  "Monate",
  "Alter",
  "hohe",
  "Interesse",
  "Regie",
  "Montag",
  "genommen",
  "lag",
  "Sommer",
  "spricht",
  "Trainer",
  "Liebe",
  "jedem",
  "/DIE",
  "Westen",
  "guten",
  "Kilometer",
  "Johann",
  "gesehen",
  "darunter",
  "solchen",
  "indem",
  "Mittel",
  "oben",
  "Schweizer",
  "wichtig",
  "Hälfte",
  "Regel",
  "obwohl",
  "Bürgermeister",
  "Aufgabe",
  "Spiele",
  "folgenden",
  "Dienstag",
  "version",
  "Sache",
  "sprechen",
  "Gemeinden",
  "electronic",
  "for",
  "Norden",
  "außerdem",
  "Antrag",
  "gleichzeitig",
  "ganzen",
  "Politiker",
  "gehörte",
  "großer",
  "China",
  "Nähe",
  "bereit",
  "setzte",
  "Druck",
  "tatsächlich",
  "Gott",
  "frei",
  "Grünen",
  "zumindest",
  "Opfer",
  "genug",
  "versucht",
  "bevor"
]

},{}],80:[function(require,module,exports){
module.exports=[
  "a's",
  "able",
  "about",
  "above",
  "according",
  "accordingly",
  "across",
  "actually",
  "after",
  "afterwards",
  "again",
  "against",
  "ain't",
  "all",
  "allow",
  "allows",
  "almost",
  "alone",
  "along",
  "already",
  "also",
  "although",
  "always",
  "am",
  "among",
  "amongst",
  "an",
  "and",
  "another",
  "any",
  "anybody",
  "anyhow",
  "anyone",
  "anything",
  "anyway",
  "anyways",
  "anywhere",
  "apart",
  "appear",
  "appreciate",
  "appropriate",
  "are",
  "aren't",
  "around",
  "as",
  "aside",
  "ask",
  "asking",
  "associated",
  "at",
  "available",
  "away",
  "awfully",
  "be",
  "became",
  "because",
  "become",
  "becomes",
  "becoming",
  "been",
  "before",
  "beforehand",
  "behind",
  "being",
  "believe",
  "below",
  "beside",
  "besides",
  "best",
  "better",
  "between",
  "beyond",
  "both",
  "brief",
  "but",
  "by",
  "c",
  "c'mon",
  "c's",
  "came",
  "campaign",
  "can",
  "can't",
  "cannot",
  "cant",
  "cause",
  "causes",
  "certain",
  "certainly",
  "changes",
  "clearly",
  "co",
  "com",
  "come",
  "comes",
  "concerning",
  "consequently",
  "consider",
  "considering",
  "contain",
  "containing",
  "contains",
  "corresponding",
  "could",
  "couldn't",
  "course",
  "currently",
  "definitely",
  "described",
  "despite",
  "did",
  "didn't",
  "different",
  "do",
  "does",
  "doesn't",
  "doing",
  "don't",
  "done",
  "down",
  "downwards",
  "during",
  "each",
  "edu",
  "eight",
  "either",
  "else",
  "elsewhere",
  "enough",
  "endorsed",
  "entirely",
  "especially",
  "et",
  "etc",
  "even",
  "ever",
  "every",
  "everybody",
  "everyone",
  "everything",
  "everywhere",
  "ex",
  "exactly",
  "example",
  "except",
  "far",
  "few",
  "fifth",
  "first",
  "financial",
  "five",
  "followed",
  "following",
  "follows",
  "for",
  "former",
  "formerly",
  "forth",
  "four",
  "from",
  "further",
  "furthermore",
  "get",
  "gets",
  "getting",
  "given",
  "gives",
  "go",
  "goes",
  "going",
  "gone",
  "got",
  "gotten",
  "greetings",
  "had",
  "hadn't",
  "happens",
  "hardly",
  "has",
  "hasn't",
  "have",
  "haven't",
  "having",
  "he",
  "he's",
  "hello",
  "help",
  "hence",
  "her",
  "here",
  "here's",
  "hereafter",
  "hereby",
  "herein",
  "hereupon",
  "hers",
  "herself",
  "hi",
  "him",
  "himself",
  "his",
  "hither",
  "hopefully",
  "how",
  "howbeit",
  "however",
  "i'd",
  "i'll",
  "i'm",
  "i've",
  "if",
  "ignored",
  "immediate",
  "in",
  "inasmuch",
  "inc",
  "indeed",
  "indicate",
  "indicated",
  "indicates",
  "inner",
  "insofar",
  "instead",
  "into",
  "inward",
  "is",
  "isn't",
  "it",
  "it'd",
  "it'll",
  "it's",
  "its",
  "itself",
  "just",
  "keep",
  "keeps",
  "kept",
  "know",
  "knows",
  "known",
  "last",
  "lately",
  "later",
  "latter",
  "latterly",
  "least",
  "less",
  "lest",
  "let",
  "let's",
  "like",
  "liked",
  "likely",
  "little",
  "look",
  "looking",
  "looks",
  "ltd",
  "mainly",
  "many",
  "may",
  "maybe",
  "me",
  "mean",
  "meanwhile",
  "merely",
  "might",
  "more",
  "moreover",
  "most",
  "mostly",
  "much",
  "must",
  "my",
  "myself",
  "name",
  "namely",
  "nd",
  "near",
  "nearly",
  "necessary",
  "need",
  "needs",
  "neither",
  "never",
  "nevertheless",
  "new",
  "next",
  "nine",
  "no",
  "nobody",
  "non",
  "none",
  "noone",
  "nor",
  "normally",
  "not",
  "nothing",
  "novel",
  "now",
  "nowhere",
  "obviously",
  "of",
  "off",
  "often",
  "oh",
  "ok",
  "okay",
  "old",
  "on",
  "once",
  "one",
  "ones",
  "only",
  "onto",
  "or",
  "other",
  "others",
  "otherwise",
  "ought",
  "our",
  "ours",
  "ourselves",
  "out",
  "outside",
  "over",
  "overall",
  "own",
  "particular",
  "particularly",
  "per",
  "perhaps",
  "placed",
  "please",
  "plus",
  "possible",
  "presumably",
  "probably",
  "provides",
  "quite",
  "quote",
  "quarterly",
  "rather",
  "really",
  "reasonably",
  "regarding",
  "regardless",
  "regards",
  "relatively",
  "respectively",
  "right",
  "said",
  "same",
  "saw",
  "say",
  "saying",
  "says",
  "second",
  "secondly",
  "see",
  "seeing",
  "seem",
  "seemed",
  "seeming",
  "seems",
  "seen",
  "self",
  "selves",
  "sensible",
  "sent",
  "serious",
  "seriously",
  "seven",
  "several",
  "shall",
  "she",
  "should",
  "shouldn't",
  "since",
  "six",
  "so",
  "some",
  "somebody",
  "somehow",
  "someone",
  "something",
  "sometime",
  "sometimes",
  "somewhat",
  "somewhere",
  "soon",
  "sorry",
  "specified",
  "specify",
  "specifying",
  "still",
  "sub",
  "such",
  "sup",
  "sure",
  "t's",
  "take",
  "taken",
  "tell",
  "tends",
  "than",
  "thank",
  "thanks",
  "thanx",
  "that",
  "that's",
  "thats",
  "the",
  "their",
  "theirs",
  "them",
  "themselves",
  "then",
  "thence",
  "there",
  "there's",
  "thereafter",
  "thereby",
  "therefore",
  "therein",
  "theres",
  "thereupon",
  "these",
  "they",
  "they'd",
  "they'll",
  "they're",
  "they've",
  "think",
  "third",
  "this",
  "thorough",
  "thoroughly",
  "those",
  "though",
  "three",
  "through",
  "throughout",
  "thru",
  "thus",
  "to",
  "together",
  "too",
  "took",
  "toward",
  "towards",
  "tried",
  "tries",
  "truly",
  "try",
  "trying",
  "twice",
  "two",
  "under",
  "unfortunately",
  "unless",
  "unlikely",
  "until",
  "unto",
  "up",
  "upon",
  "us",
  "use",
  "used",
  "useful",
  "uses",
  "using",
  "usually",
  "uucp",
  "value",
  "various",
  "very",
  "via",
  "viz",
  "vs",
  "want",
  "wants",
  "was",
  "wasn't",
  "way",
  "we",
  "we'd",
  "we'll",
  "we're",
  "we've",
  "welcome",
  "well",
  "went",
  "were",
  "weren't",
  "what",
  "what's",
  "whatever",
  "when",
  "whence",
  "whenever",
  "where",
  "where's",
  "whereafter",
  "whereas",
  "whereby",
  "wherein",
  "whereupon",
  "wherever",
  "whether",
  "which",
  "while",
  "whither",
  "who",
  "who's",
  "whoever",
  "whole",
  "whom",
  "whose",
  "why",
  "will",
  "willing",
  "wish",
  "with",
  "within",
  "without",
  "won't",
  "wonder",
  "would",
  "would",
  "wouldn't",
  "yes",
  "yet",
  "you",
  "you'd",
  "you'll",
  "you're",
  "you've",
  "your",
  "yours",
  "yourself",
  "yourselves",
  "zero",
  "official",
  "sharply",
  "criticized"
]

},{}],81:[function(require,module,exports){
module.exports=[
  "de",
  "la",
  "que",
  "el",
  "en",
  "y",
  "a",
  "los",
  "del",
  "se",
  "las",
  "por",
  "un",
  "para",
  "con",
  "no",
  "una",
  "su",
  "al",
  "lo",
  "como",
  "más",
  "pero",
  "sus",
  "le",
  "ya",
  "o",
  "este",
  "sí",
  "porque",
  "esta",
  "entre",
  "cuando",
  "muy",
  "sin",
  "sobre",
  "también",
  "me",
  "hasta",
  "hay",
  "donde",
  "quien",
  "desde",
  "todo",
  "nos",
  "durante",
  "todos",
  "uno",
  "les",
  "ni",
  "contra",
  "otros",
  "ese",
  "eso",
  "ante",
  "ellos",
  "e",
  "esto",
  "mí",
  "antes",
  "algunos",
  "qué",
  "unos",
  "yo",
  "otro",
  "otras",
  "otra",
  "él",
  "tanto",
  "esa",
  "estos",
  "mucho",
  "quienes",
  "nada",
  "muchos",
  "cual",
  "poco",
  "ella",
  "estar",
  "estas",
  "algunas",
  "algo",
  "nosotros",
  "mi",
  "mis",
  "tú",
  "te",
  "ti",
  "tu",
  "tus",
  "ellas",
  "nosotras",
  "vosotros",
  "vosotras",
  "os",
  "mío",
  "mía",
  "míos",
  "mías",
  "tuyo",
  "tuya",
  "tuyos",
  "tuyas",
  "suyo",
  "suya",
  "suyos",
  "suyas",
  "nuestro",
  "nuestra",
  "nuestros",
  "nuestras",
  "vuestro",
  "vuestra",
  "vuestros",
  "vuestras",
  "esos",
  "esas",
  "estoy",
  "estás",
  "está",
  "estamos",
  "estáis",
  "están",
  "esté",
  "estés",
  "estemos",
  "estéis",
  "estén",
  "estaré",
  "estarás",
  "estará",
  "estaremos",
  "estaréis",
  "estarán",
  "estaría",
  "estarías",
  "estaríamos",
  "estaríais",
  "estarían",
  "estaba",
  "estabas",
  "estábamos",
  "estabais",
  "estaban",
  "estuve",
  "estuviste",
  "estuvo",
  "estuvimos",
  "estuvisteis",
  "estuvieron",
  "estuviera",
  "estuvieras",
  "estuviéramos",
  "estuvierais",
  "estuvieran",
  "estuviese",
  "estuvieses",
  "estuviésemos",
  "estuvieseis",
  "estuviesen",
  "estando",
  "estado",
  "estada",
  "estados",
  "estadas",
  "estad",
  "he",
  "has",
  "ha",
  "hemos",
  "habéis",
  "han",
  "haya",
  "hayas",
  "hayamos",
  "hayáis",
  "hayan",
  "habré",
  "habrás",
  "habrá",
  "habremos",
  "habréis",
  "habrán",
  "habría",
  "habrías",
  "habríamos",
  "habríais",
  "habrían",
  "había",
  "habías",
  "habíamos",
  "habíais",
  "habían",
  "hube",
  "hubiste",
  "hubo",
  "hubimos",
  "hubisteis",
  "hubieron",
  "hubiera",
  "hubieras",
  "hubiéramos",
  "hubierais",
  "hubieran",
  "hubiese",
  "hubieses",
  "hubiésemos",
  "hubieseis",
  "hubiesen",
  "habiendo",
  "habido",
  "habida",
  "habidos",
  "habidas",
  "soy",
  "eres",
  "es",
  "somos",
  "sois",
  "son",
  "sea",
  "seas",
  "seamos",
  "seáis",
  "sean",
  "seré",
  "serás",
  "será",
  "seremos",
  "seréis",
  "serán",
  "sería",
  "serías",
  "seríamos",
  "seríais",
  "serían",
  "era",
  "eras",
  "éramos",
  "erais",
  "eran",
  "fui",
  "fuiste",
  "fue",
  "fuimos",
  "fuisteis",
  "fueron",
  "fuera",
  "fueras",
  "fuéramos",
  "fuerais",
  "fueran",
  "fuese",
  "fueses",
  "fuésemos",
  "fueseis",
  "fuesen",
  "siendo",
  "sido",
  "tengo",
  "tienes",
  "tiene",
  "tenemos",
  "tenéis",
  "tienen",
  "tenga",
  "tengas",
  "tengamos",
  "tengáis",
  "tengan",
  "tendré",
  "tendrás",
  "tendrá",
  "tendremos",
  "tendréis",
  "tendrán",
  "tendría",
  "tendrías",
  "tendríamos",
  "tendríais",
  "tendrían",
  "tenía",
  "tenías",
  "teníamos",
  "teníais",
  "tenían",
  "tuve",
  "tuviste",
  "tuvo",
  "tuvimos",
  "tuvisteis",
  "tuvieron",
  "tuviera",
  "tuvieras",
  "tuviéramos",
  "tuvierais",
  "tuvieran",
  "tuviese",
  "tuvieses",
  "tuviésemos",
  "tuvieseis",
  "tuviesen",
  "teniendo",
  "tenido",
  "tenida",
  "tenidos",
  "tenidas",
  "tened",
  ""
]

},{}],82:[function(require,module,exports){
module.exports=[
  "alla",
  "ansiosta",
  "ehkä",
  "ei",
  "enemmän",
  "ennen",
  "etessa",
  "f",
  "haikki",
  "he",
  "hitaasti",
  "hoikein",
  "hyvin",
  "hän",
  "ilman",
  "ja",
  "jos",
  "jälkeen",
  "kanssa",
  "kaukana",
  "kenties",
  "keskellä",
  "kesken",
  "koskaan",
  "kuinkan",
  "kukka",
  "kylliksi",
  "kyllä",
  "liian",
  "lla",
  "lla",
  "luona",
  "lähellä",
  "läpi",
  "me",
  "miksi",
  "mikä",
  "milloin",
  "milloinkan",
  "minä",
  "missä",
  "miten",
  "nopeasti",
  "nyt",
  "oikea",
  "oikealla",
  "paljon",
  "siellä",
  "sinä",
  "ssa",
  "sta",
  "suoraan",
  "tai",
  "takana",
  "takia",
  "tarpeeksi",
  "te",
  "tässä",
  "ulkopuolella",
  "vahemmän",
  "vasen",
  "vasenmalla",
  "vastan",
  "vielä",
  "vieressä",
  "vähän",
  "yhdessä",
  "ylös",
  ""
]

},{}],83:[function(require,module,exports){
module.exports=[
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "but",
  "by",
  "for",
  "if",
  "in",
  "into",
  "is",
  "it",
  "no",
  "not",
  "of",
  "on",
  "or",
  "s",
  "such",
  "t",
  "that",
  "the",
  "their",
  "then",
  "there",
  "these",
  "they",
  "this",
  "to",
  "was",
  "will",
  "with",
  "au",
  "aux",
  "avec",
  "ce",
  "ces",
  "dans",
  "de",
  "des",
  "du",
  "elle",
  "en",
  "et",
  "eux",
  "il",
  "je",
  "la",
  "le",
  "leur",
  "lui",
  "ma",
  "mais",
  "me",
  "même",
  "mes",
  "moi",
  "mon",
  "ne",
  "nos",
  "notre",
  "nous",
  "on",
  "ou",
  "par",
  "pas",
  "pour",
  "qu",
  "que",
  "qui",
  "sa",
  "se",
  "ses",
  "son",
  "sur",
  "ta",
  "te",
  "tes",
  "toi",
  "ton",
  "tu",
  "un",
  "une",
  "vos",
  "votre",
  "vous",
  "c",
  "d",
  "j",
  "l",
  "à",
  "m",
  "n",
  "s",
  "t",
  "y",
  "été",
  "étée",
  "étées",
  "étés",
  "étant",
  "suis",
  "es",
  "est",
  "sommes",
  "êtes",
  "sont",
  "serai",
  "seras",
  "sera",
  "serons",
  "serez",
  "seront",
  "serais",
  "serait",
  "serions",
  "seriez",
  "seraient",
  "étais",
  "était",
  "étions",
  "étiez",
  "étaient",
  "fus",
  "fut",
  "fûmes",
  "fûtes",
  "furent",
  "sois",
  "soit",
  "soyons",
  "soyez",
  "soient",
  "fusse",
  "fusses",
  "fût",
  "fussions",
  "fussiez",
  "fussent",
  "ayant",
  "eu",
  "eue",
  "eues",
  "eus",
  "ai",
  "as",
  "avons",
  "avez",
  "ont",
  "aurai",
  "auras",
  "aura",
  "aurons",
  "aurez",
  "auront",
  "aurais",
  "aurait",
  "aurions",
  "auriez",
  "auraient",
  "avais",
  "avait",
  "avions",
  "aviez",
  "avaient",
  "eut",
  "eûmes",
  "eûtes",
  "eurent",
  "aie",
  "aies",
  "ait",
  "ayons",
  "ayez",
  "aient",
  "eusse",
  "eusses",
  "eût",
  "eussions",
  "eussiez",
  "eussent",
  "ceci",
  "celà",
  "cet",
  "cette",
  "ici",
  "ils",
  "les",
  "leurs",
  "quel",
  "quels",
  "quelle",
  "quelles",
  "sans",
  "soi",
  ""
]

},{}],84:[function(require,module,exports){
module.exports=[
  "a",
  "á",
  "ahogy",
  "ahol",
  "aki",
  "akik",
  "akkor",
  "alatt",
  "által",
  "általában",
  "amely",
  "amelyek",
  "amelyekben",
  "amelyeket",
  "amelyet",
  "amelynek",
  "ami",
  "amit",
  "amolyan",
  "amp",
  "amíg",
  "amikor",
  "át",
  "abban",
  "ahhoz",
  "annak",
  "arra",
  "arról",
  "az",
  "azok",
  "azon",
  "azt",
  "azzal",
  "azért",
  "aztán",
  "azután",
  "azonban",
  "b",
  "bár",
  "be",
  "belül",
  "benne",
  "c",
  "cikk",
  "cikkek",
  "cikkeket",
  "csak",
  "d",
  "de",
  "e",
  "é",
  "eddig",
  "egész",
  "egy",
  "egyes",
  "egyetlen",
  "egyéb",
  "egyik",
  "egyre",
  "ekkor",
  "el",
  "elég",
  "ellen",
  "elő",
  "először",
  "előtt",
  "első",
  "én",
  "éppen",
  "ebben",
  "ehhez",
  "emilyen",
  "ennek",
  "erre",
  "ez",
  "ezt",
  "ezek",
  "ezen",
  "ezzel",
  "ezért",
  "és",
  "f",
  "fel",
  "felé",
  "g",
  "h",
  "hanem",
  "hiszen",
  "hogy",
  "hogyan",
  "i",
  "í",
  "igen",
  "így",
  "illetve",
  "ill.",
  "ill",
  "ilyen",
  "ilyenkor",
  "is",
  "ison",
  "ismét",
  "itt",
  "j",
  "jó",
  "jól",
  "jobban",
  "k",
  "kell",
  "kellett",
  "keresztül",
  "keressünk",
  "ki",
  "kívül",
  "között",
  "közül",
  "l",
  "legalább",
  "lehet",
  "lehetett",
  "legyen",
  "lenne",
  "lenni",
  "lesz",
  "lett",
  "m",
  "maga",
  "magát",
  "majd",
  "majd",
  "már",
  "más",
  "másik",
  "meg",
  "még",
  "mellett",
  "mert",
  "mely",
  "melyek",
  "mi",
  "mit",
  "míg",
  "miért",
  "milyen",
  "mikor",
  "minden",
  "mindent",
  "mindenki",
  "mindig",
  "mint",
  "mintha",
  "mivel",
  "most",
  "n",
  "nagy",
  "nagyobb",
  "nagyon",
  "ne",
  "néha",
  "nekem",
  "neki",
  "nem",
  "néhány",
  "nélkül",
  "nincs",
  "o",
  "ó",
  "olyan",
  "ott",
  "össze",
  "ö",
  "ő",
  "ők",
  "őket",
  "p",
  "pedig",
  "persze",
  "q",
  "r",
  "rá",
  "s",
  "saját",
  "sem",
  "semmi",
  "sok",
  "sokat",
  "sokkal",
  "sz",
  "számára",
  "szemben",
  "szerint",
  "szinte",
  "t",
  "talán",
  "tehát",
  "teljes",
  "tovább",
  "továbbá",
  "több",
  "u",
  "ú",
  "úgy",
  "ugyanis",
  "új",
  "újabb",
  "újra",
  "után",
  "utána",
  "utolsó",
  "ü",
  "ű",
  "v",
  "vagy",
  "vagyis",
  "valaki",
  "valamely",
  "valami",
  "valamint",
  "való",
  "vagyok",
  "van",
  "vannak",
  "volt",
  "voltam",
  "voltak",
  "voltunk",
  "vissza",
  "vele",
  "viszont",
  "volna",
  "számolnak",
  "szólnak",
  "szól",
  "w",
  "x",
  "y",
  "z",
  "zs",
  "a",
  "ahogy",
  "ahol",
  "aki",
  "akkor",
  "alatt",
  "általában",
  "által",
  "amely",
  "amíg",
  "amikor",
  "ami",
  "amolyan",
  "arra",
  "át",
  "az",
  "azért",
  "azonban",
  "azon",
  "aztán",
  "azt",
  "azután",
  "azzal",
  "bár",
  "be",
  "belül",
  "benne",
  "cikk",
  "csak",
  "de",
  "eddig",
  "egész",
  "egy",
  "egyéb",
  "egyes",
  "egyetlen",
  "egyik",
  "egyre",
  "ekkor",
  "el",
  "elég",
  "ellen",
  "elő",
  "először",
  "előtt",
  "első",
  "emilyen",
  "én",
  "éppen",
  "erre",
  "és",
  "e",
  "ez",
  "ezen",
  "ezért",
  "ezzel",
  "fel",
  "felé",
  "hanem",
  "hiszen",
  "hogy",
  "hogyan",
  "igen",
  "így",
  "ill.",
  "illetve",
  "ill",
  "ilyen",
  "ilyenkor",
  "ismét",
  "ison",
  "itt",
  "jó",
  "jobban",
  "jól",
  "kell",
  "keres",
  "keresztül",
  "ki",
  "kívül",
  "között",
  "közül",
  "legalább",
  "legyen",
  "lehet",
  "lenni",
  "lett",
  "maga",
  "maga",
  "majd",
  "már",
  "más",
  "másik",
  "még",
  "meg",
  "mellett",
  "mely",
  "mert",
  "miért",
  "míg",
  "mikor",
  "milyen",
  "minden",
  "mindenki",
  "mindig",
  "mi",
  "mint",
  "mintha",
  "mivel",
  "most",
  "nagy",
  "nagyobb",
  "nagyon",
  "ne",
  "néha",
  "néhány",
  "neki",
  "nélkül",
  "nem",
  "nincs",
  "ők",
  "olyan",
  "ő",
  "össze",
  "ott",
  "pedig",
  "persze",
  "rá",
  "saját",
  "s",
  "sem",
  "semmi",
  "sokkal",
  "sok",
  "számára",
  "számol",
  "szemben",
  "szerint",
  "szinte",
  "szól",
  "talán",
  "tehát",
  "teljes",
  "továbbá",
  "tovább",
  "úgy",
  "ugyanis",
  "új",
  "újabb",
  "újra",
  "utána",
  "után",
  "utolsó",
  "vagy",
  "vagyis",
  "valaki",
  "valamely",
  "valami",
  "valamint",
  "való",
  "van",
  "vissza",
  "viszont",
  "volt",
  "",
  ""
]

},{}],85:[function(require,module,exports){
module.exports=[
  "a",
  "abad",
  "acara",
  "aceh",
  "ada",
  "adalah",
  "adanya",
  "adapun",
  "agak",
  "agaknya",
  "agama",
  "agar",
  "agustus",
  "air",
  "akan",
  "akankah",
  "akhir",
  "akhiri",
  "akhirnya",
  "akibat",
  "aku",
  "akulah",
  "alam",
  "album",
  "amat",
  "amatlah",
  "amerika",
  "anak",
  "and",
  "anda",
  "andalah",
  "anggota",
  "antar",
  "antara",
  "antarabangsa",
  "antaranya",
  "apa",
  "apaan",
  "apabila",
  "apakah",
  "apalagi",
  "apatah",
  "api",
  "april",
  "artikel",
  "artinya",
  "as",
  "asal",
  "asalkan",
  "asas",
  "asia",
  "asing",
  "atas",
  "atau",
  "ataukah",
  "ataupun",
  "australia",
  "awal",
  "awalnya",
  "awam",
  "b",
  "badan",
  "bagai",
  "bagaikan",
  "bagaimana",
  "bagaimanakah",
  "bagaimanapun",
  "bagainamakah",
  "bagi",
  "bagian",
  "bahagian",
  "bahan",
  "baharu",
  "bahasa",
  "bahawa",
  "bahkan",
  "bahwa",
  "bahwasannya",
  "bahwasanya",
  "baik",
  "baiknya",
  "bakal",
  "bakalan",
  "balik",
  "bandar",
  "bangsa",
  "bank",
  "banyak",
  "bapak",
  "barang",
  "barangan",
  "barat",
  "baru",
  "baru-baru",
  "bawah",
  "beberapa",
  "begini",
  "beginian",
  "beginikah",
  "beginilah",
  "begitu",
  "begitukah",
  "begitulah",
  "begitupun",
  "bekas",
  "bekerja",
  "belakang",
  "belakangan",
  "belanda",
  "beli",
  "beliau",
  "belum",
  "belumlah",
  "benar",
  "benarkah",
  "benarlah",
  "bentuk",
  "berada",
  "berakhir",
  "berakhirlah",
  "berakhirnya",
  "berapa",
  "berapakah",
  "berapalah",
  "berapapun",
  "berarti",
  "berasal",
  "berat",
  "berawal",
  "berbagai",
  "berbanding",
  "berbeda",
  "berdasarkan",
  "berdatangan",
  "berharap",
  "berhasil",
  "beri",
  "berikan",
  "berikut",
  "berikutan",
  "berikutnya",
  "berita",
  "berjalan",
  "berjaya",
  "berjumlah",
  "berkaitan",
  "berkali",
  "berkali-kali",
  "berkata",
  "berkehendak",
  "berkeinginan",
  "berkenaan",
  "berlainan",
  "berlaku",
  "berlalu",
  "berlangsung",
  "berlebihan",
  "bermacam",
  "bermacam-macam",
  "bermain",
  "bermaksud",
  "bermula",
  "bernama",
  "bernilai",
  "bersama",
  "bersama-sama",
  "bersiap",
  "bertanya",
  "bertemu",
  "berturut",
  "bertutur",
  "berubah",
  "berujar",
  "berupa",
  "besar",
  "besok",
  "betul",
  "betulkah",
  "bhd",
  "biasa",
  "biasanya",
  "bidang",
  "bila",
  "bilakah",
  "bilion",
  "bintang",
  "bisa",
  "bisakah",
  "blog",
  "bn",
  "bola",
  "boleh",
  "bolehkah",
  "bolehlah",
  "buat",
  "bukan",
  "bukankah",
  "bukanlah",
  "bukannya",
  "buku",
  "bulan",
  "bumi",
  "bung",
  "bursa",
  "cadangan",
  "cara",
  "caranya",
  "catch",
  "china",
  "click",
  "code",
  "copyright",
  "cukup",
  "cukupkah",
  "cukuplah",
  "cuma",
  "daerah",
  "dagangan",
  "dahulu",
  "dalam",
  "dan",
  "dana",
  "dapat",
  "dari",
  "daripada",
  "dasar",
  "data",
  "datang",
  "datuk",
  "dekat",
  "demi",
  "demikian",
  "demikianlah",
  "dengan",
  "depan",
  "derivatives",
  "desa",
  "desember",
  "detik",
  "dewan",
  "di",
  "dia",
  "diadakan",
  "diakhiri",
  "diakhirinya",
  "dialah",
  "dianggap",
  "diantara",
  "diantaranya",
  "diberi",
  "diberikan",
  "diberikannya",
  "dibuat",
  "dibuatnya",
  "dibuka",
  "dicatatkan",
  "didapat",
  "didatangkan",
  "didirikan",
  "diduga",
  "digunakan",
  "diibaratkan",
  "diibaratkannya",
  "diingat",
  "diingatkan",
  "diinginkan",
  "dijangka",
  "dijawab",
  "dijelaskan",
  "dijelaskannya",
  "dikarenakan",
  "dikatakan",
  "dikatakannya",
  "dikenal",
  "dikerjakan",
  "diketahui",
  "diketahuinya",
  "dikira",
  "dilakukan",
  "dilalui",
  "dilihat",
  "dimaksud",
  "dimaksudkan",
  "dimaksudkannya",
  "dimaksudnya",
  "dimana",
  "diminta",
  "dimintai",
  "dimisalkan",
  "dimulai",
  "dimulailah",
  "dimulainya",
  "dimungkinkan",
  "dini",
  "diniagakan",
  "dipastikan",
  "diperbuat",
  "diperbuatnya",
  "dipergunakan",
  "diperkirakan",
  "diperlihatkan",
  "diperlukan",
  "diperlukannya",
  "dipersoalkan",
  "dipertanyakan",
  "dipunyai",
  "diri",
  "dirilis",
  "dirinya",
  "dis",
  "disampaikan",
  "disebut",
  "disebutkan",
  "disebutkannya",
  "disember",
  "disini",
  "disinilah",
  "distrik",
  "ditambahkan",
  "ditandaskan",
  "ditanya",
  "ditanyai",
  "ditanyakan",
  "ditegaskan",
  "ditemukan",
  "ditujukan",
  "ditunjuk",
  "ditunjuki",
  "ditunjukkan",
  "ditunjukkannya",
  "ditunjuknya",
  "ditutup",
  "dituturkan",
  "dituturkannya",
  "diucapkan",
  "diucapkannya",
  "diungkapkan",
  "document.write",
  "dolar",
  "dong",
  "dr",
  "dua",
  "dulu",
  "dunia",
  "effective",
  "ekonomi",
  "eksekutif",
  "eksport",
  "empat",
  "enam",
  "enggak",
  "enggaknya",
  "entah",
  "entahlah",
  "era",
  "eropa",
  "err",
  "faedah",
  "feb",
  "film",
  "gat",
  "gedung",
  "gelar",
  "gettracker",
  "global",
  "grup",
  "guna",
  "gunakan",
  "gunung",
  "hadap",
  "hadapan",
  "hal",
  "hampir",
  "hanya",
  "hanyalah",
  "harga",
  "hari",
  "harian",
  "harus",
  "haruslah",
  "harusnya",
  "hasil",
  "hendak",
  "hendaklah",
  "hendaknya",
  "hidup",
  "hingga",
  "https",
  "hubungan",
  "hukum",
  "hutan",
  "i",
  "ia",
  "iaitu",
  "ialah",
  "ibarat",
  "ibaratkan",
  "ibaratnya",
  "ibu",
  "ii",
  "iklan",
  "ikut",
  "ilmu",
  "indeks",
  "india",
  "indonesia",
  "industri",
  "informasi",
  "ingat",
  "inggris",
  "ingin",
  "inginkah",
  "inginkan",
  "ini",
  "inikah",
  "inilah",
  "internasional",
  "islam",
  "isnin",
  "isu",
  "italia",
  "itu",
  "itukah",
  "itulah",
  "jabatan",
  "jadi",
  "jadilah",
  "jadinya",
  "jakarta",
  "jalan",
  "jalur",
  "jaman",
  "jan",
  "jangan",
  "jangankan",
  "janganlah",
  "januari",
  "jauh",
  "jawa",
  "jawab",
  "jawaban",
  "jawabnya",
  "jawatan",
  "jawatankuasa",
  "jelas",
  "jelaskan",
  "jelaslah",
  "jelasnya",
  "jenis",
  "jepang",
  "jepun",
  "jerman",
  "jika",
  "jikalau",
  "jiwa",
  "jual",
  "jualan",
  "juga",
  "julai",
  "jumaat",
  "jumat",
  "jumlah",
  "jumlahnya",
  "jun",
  "juni",
  "justru",
  "juta",
  "kabar",
  "kabupaten",
  "kadar",
  "kala",
  "kalangan",
  "kalau",
  "kalaulah",
  "kalaupun",
  "kali",
  "kalian",
  "kalimantan",
  "kami",
  "kamilah",
  "kamis",
  "kamu",
  "kamulah",
  "kan",
  "kantor",
  "kapal",
  "kapan",
  "kapankah",
  "kapanpun",
  "karena",
  "karenanya",
  "karya",
  "kasus",
  "kata",
  "katakan",
  "katakanlah",
  "katanya",
  "kaunter",
  "kawasan",
  "ke",
  "keadaan",
  "kebetulan",
  "kebutuhan",
  "kecamatan",
  "kecil",
  "kedua",
  "kedua-dua",
  "keduanya",
  "kedudukan",
  "kegiatan",
  "kehidupan",
  "keinginan",
  "kejadian",
  "kekal",
  "kelamaan",
  "kelihatan",
  "kelihatannya",
  "kelima",
  "kelompok",
  "keluar",
  "keluarga",
  "kelurahan",
  "kembali",
  "kementerian",
  "kemudahan",
  "kemudian",
  "kemungkinan",
  "kemungkinannya",
  "kenaikan",
  "kenapa",
  "kenyataan",
  "kepada",
  "kepadanya",
  "kepala",
  "kepentingan",
  "keputusan",
  "kerajaan",
  "kerana",
  "kereta",
  "kerja",
  "kerjasama",
  "kes",
  "kesampaian",
  "keselamatan",
  "keseluruhan",
  "keseluruhannya",
  "kesempatan",
  "kesihatan",
  "keterangan",
  "keterlaluan",
  "ketiga",
  "ketika",
  "ketua",
  "keuntungan",
  "kewangan",
  "khamis",
  "khusus",
  "khususnya",
  "kini",
  "kinilah",
  "kira",
  "kira-kira",
  "kiranya",
  "kita",
  "kitalah",
  "klci",
  "klibor",
  "klik",
  "km",
  "kok",
  "komentar",
  "kompas",
  "komposit",
  "kondisi",
  "kontrak",
  "korban",
  "korea",
  "kos",
  "kota",
  "kuala",
  "kuasa",
  "kukuh",
  "kumpulan",
  "kurang",
  "kurangnya",
  "lagi",
  "lagian",
  "lagu",
  "lah",
  "lain",
  "lainnya",
  "laku",
  "lalu",
  "lama",
  "lamanya",
  "langkah",
  "langsung",
  "lanjut",
  "lanjutnya",
  "laporan",
  "laut",
  "lebih",
  "lembaga",
  "lepas",
  "lewat",
  "lima",
  "lingkungan",
  "login",
  "lokasi",
  "lot",
  "luar",
  "luas",
  "lumpur",
  "mac",
  "macam",
  "mahkamah",
  "mahu",
  "majlis",
  "maka",
  "makanan",
  "makanya",
  "makin",
  "maklumat",
  "malah",
  "malahan",
  "malam",
  "malaysia",
  "mampu",
  "mampukah",
  "mana",
  "manakala",
  "manalagi",
  "mantan",
  "manusia",
  "masa",
  "masalah",
  "masalahnya",
  "masih",
  "masihkah",
  "masing",
  "masing-masing",
  "masuk",
  "masyarakat",
  "mata",
  "mau",
  "maupun",
  "measure",
  "media",
  "mei",
  "melainkan",
  "melakukan",
  "melalui",
  "melawan",
  "melihat",
  "melihatnya",
  "memandangkan",
  "memang",
  "memastikan",
  "membantu",
  "membawa",
  "memberi",
  "memberikan",
  "membolehkan",
  "membuat",
  "memerlukan",
  "memihak",
  "memiliki",
  "meminta",
  "memintakan",
  "memisalkan",
  "memperbuat",
  "mempergunakan",
  "memperkirakan",
  "memperlihatkan",
  "mempersiapkan",
  "mempersoalkan",
  "mempertanyakan",
  "mempunyai",
  "memulai",
  "memungkinkan",
  "menaiki",
  "menambah",
  "menambahkan",
  "menandaskan",
  "menanti",
  "menantikan",
  "menanya",
  "menanyai",
  "menanyakan",
  "menarik",
  "menawarkan",
  "mencapai",
  "mencari",
  "mencatatkan",
  "mendapat",
  "mendapatkan",
  "mendatang",
  "mendatangi",
  "mendatangkan",
  "menegaskan",
  "menerima",
  "menerusi",
  "mengadakan",
  "mengakhiri",
  "mengaku",
  "mengalami",
  "mengambil",
  "mengapa",
  "mengatakan",
  "mengatakannya",
  "mengenai",
  "mengerjakan",
  "mengetahui",
  "menggalakkan",
  "menggunakan",
  "menghadapi",
  "menghendaki",
  "mengibaratkan",
  "mengibaratkannya",
  "mengikut",
  "mengingat",
  "mengingatkan",
  "menginginkan",
  "mengira",
  "mengucapkan",
  "mengucapkannya",
  "mengumumkan",
  "mengungkapkan",
  "mengurangkan",
  "meninggal",
  "meningkat",
  "meningkatkan",
  "menjadi",
  "menjalani",
  "menjawab",
  "menjelang",
  "menjelaskan",
  "menokok",
  "menteri",
  "menuju",
  "menunjuk",
  "menunjuki",
  "menunjukkan",
  "menunjuknya",
  "menurut",
  "menuturkan",
  "menyaksikan",
  "menyampaikan",
  "menyangkut",
  "menyatakan",
  "menyebabkan",
  "menyebutkan",
  "menyediakan",
  "menyeluruh",
  "menyiapkan",
  "merasa",
  "mereka",
  "merekalah",
  "merosot",
  "merupakan",
  "meski",
  "meskipun",
  "mesyuarat",
  "metrotv",
  "meyakini",
  "meyakinkan",
  "milik",
  "militer",
  "minat",
  "minggu",
  "minta",
  "minyak",
  "mirip",
  "misal",
  "misalkan",
  "misalnya",
  "mobil",
  "modal",
  "mohd",
  "mudah",
  "mula",
  "mulai",
  "mulailah",
  "mulanya",
  "muncul",
  "mungkin",
  "mungkinkah",
  "musik",
  "musim",
  "nah",
  "naik",
  "nama",
  "namun",
  "nanti",
  "nantinya",
  "nasional",
  "negara",
  "negara-negara",
  "negeri",
  "new",
  "niaga",
  "nilai",
  "nomor",
  "noun",
  "nov",
  "november",
  "numeral",
  "numeralia",
  "nya",
  "nyaris",
  "nyatanya",
  "of",
  "ogos",
  "okt",
  "oktober",
  "olah",
  "oleh",
  "olehnya",
  "operasi",
  "orang",
  "organisasi",
  "pada",
  "padahal",
  "padanya",
  "pagetracker",
  "pagi",
  "pak",
  "paling",
  "pameran",
  "panjang",
  "pantas",
  "papan",
  "para",
  "paras",
  "parlimen",
  "partai",
  "parti",
  "particle",
  "pasar",
  "pasaran",
  "password",
  "pasti",
  "pastilah",
  "pasukan",
  "paticle",
  "pegawai",
  "pejabat",
  "pekan",
  "pekerja",
  "pelabur",
  "pelaburan",
  "pelancongan",
  "pelanggan",
  "pelbagai",
  "peluang",
  "pemain",
  "pembangunan",
  "pemberita",
  "pembinaan",
  "pemerintah",
  "pemerintahan",
  "pemimpin",
  "pendapatan",
  "pendidikan",
  "penduduk",
  "penerbangan",
  "pengarah",
  "pengeluaran",
  "pengerusi",
  "pengguna",
  "penggunaan",
  "pengurusan",
  "peniaga",
  "peningkatan",
  "penting",
  "pentingnya",
  "per",
  "perancis",
  "perang",
  "peratus",
  "percuma",
  "perdagangan",
  "perdana",
  "peringkat",
  "perjanjian",
  "perkara",
  "perkhidmatan",
  "perladangan",
  "perlu",
  "perlukah",
  "perlunya",
  "permintaan",
  "pernah",
  "perniagaan",
  "persekutuan",
  "persen",
  "persidangan",
  "persoalan",
  "pertama",
  "pertandingan",
  "pertanyaan",
  "pertanyakan",
  "pertubuhan",
  "pertumbuhan",
  "perubahan",
  "perusahaan",
  "pesawat",
  "peserta",
  "petang",
  "pihak",
  "pihaknya",
  "pilihan",
  "pinjaman",
  "polis",
  "polisi",
  "politik",
  "pos",
  "posisi",
  "presiden",
  "prestasi",
  "produk",
  "program",
  "projek",
  "pronomia",
  "pronoun",
  "proses",
  "proton",
  "provinsi",
  "pt",
  "pubdate",
  "pukul",
  "pula",
  "pulau",
  "pun",
  "punya",
  "pusat",
  "rabu",
  "radio",
  "raja",
  "rakan",
  "rakyat",
  "ramai",
  "rantau",
  "rasa",
  "rasanya",
  "rata",
  "raya",
  "rendah",
  "republik",
  "resmi",
  "ribu",
  "ringgit",
  "root",
  "ruang",
  "rumah",
  "rupa",
  "rupanya",
  "saat",
  "saatnya",
  "sabah",
  "sabtu",
  "sahaja",
  "saham",
  "saja",
  "sajalah",
  "sakit",
  "salah",
  "saling",
  "sama",
  "sama-sama",
  "sambil",
  "sampai",
  "sampaikan",
  "sana",
  "sangat",
  "sangatlah",
  "sarawak",
  "satu",
  "sawit",
  "saya",
  "sayalah",
  "sdn",
  "se",
  "sebab",
  "sebabnya",
  "sebagai",
  "sebagaimana",
  "sebagainya",
  "sebagian",
  "sebahagian",
  "sebaik",
  "sebaiknya",
  "sebaliknya",
  "sebanyak",
  "sebarang",
  "sebegini",
  "sebegitu",
  "sebelah",
  "sebelum",
  "sebelumnya",
  "sebenarnya",
  "seberapa",
  "sebesar",
  "sebetulnya",
  "sebisanya",
  "sebuah",
  "sebut",
  "sebutlah",
  "sebutnya",
  "secara",
  "secukupnya",
  "sedang",
  "sedangkan",
  "sedemikian",
  "sedikit",
  "sedikitnya",
  "seenaknya",
  "segala",
  "segalanya",
  "segera",
  "segi",
  "seharusnya",
  "sehingga",
  "seingat",
  "sejak",
  "sejarah",
  "sejauh",
  "sejenak",
  "sejumlah",
  "sekadar",
  "sekadarnya",
  "sekali",
  "sekali-kali",
  "sekalian",
  "sekaligus",
  "sekalipun",
  "sekarang",
  "sekaranglah",
  "sekecil",
  "seketika",
  "sekiranya",
  "sekitar",
  "sekitarnya",
  "sekolah",
  "sektor",
  "sekurang",
  "sekurangnya",
  "sekuriti",
  "sela",
  "selagi",
  "selain",
  "selaku",
  "selalu",
  "selama",
  "selama-lamanya",
  "selamanya",
  "selanjutnya",
  "selasa",
  "selatan",
  "selepas",
  "seluruh",
  "seluruhnya",
  "semacam",
  "semakin",
  "semalam",
  "semampu",
  "semampunya",
  "semasa",
  "semasih",
  "semata",
  "semaunya",
  "sementara",
  "semisal",
  "semisalnya",
  "sempat",
  "semua",
  "semuanya",
  "semula",
  "sen",
  "sendiri",
  "sendirian",
  "sendirinya",
  "senin",
  "seolah",
  "seolah-olah",
  "seorang",
  "sepak",
  "sepanjang",
  "sepantasnya",
  "sepantasnyalah",
  "seperlunya",
  "seperti",
  "sepertinya",
  "sepihak",
  "sept",
  "september",
  "serangan",
  "serantau",
  "seri",
  "serikat",
  "sering",
  "seringnya",
  "serta",
  "serupa",
  "sesaat",
  "sesama",
  "sesampai",
  "sesegera",
  "sesekali",
  "seseorang",
  "sesi",
  "sesuai",
  "sesuatu",
  "sesuatunya",
  "sesudah",
  "sesudahnya",
  "setelah",
  "setempat",
  "setengah",
  "seterusnya",
  "setiap",
  "setiausaha",
  "setiba",
  "setibanya",
  "setidak",
  "setidaknya",
  "setinggi",
  "seusai",
  "sewaktu",
  "siap",
  "siapa",
  "siapakah",
  "siapapun",
  "siaran",
  "sidang",
  "singapura",
  "sini",
  "sinilah",
  "sistem",
  "soal",
  "soalnya",
  "sokongan",
  "sri",
  "stasiun",
  "suara",
  "suatu",
  "sudah",
  "sudahkah",
  "sudahlah",
  "sukan",
  "suku",
  "sumber",
  "sungai",
  "supaya",
  "surat",
  "susut",
  "syarikat",
  "syed",
  "tadi",
  "tadinya",
  "tahap",
  "tahu",
  "tahun",
  "tak",
  "tama",
  "tambah",
  "tambahnya",
  "tampak",
  "tampaknya",
  "tampil",
  "tan",
  "tanah",
  "tandas",
  "tandasnya",
  "tanggal",
  "tanpa",
  "tanya",
  "tanyakan",
  "tanyanya",
  "tapi",
  "tawaran",
  "tegas",
  "tegasnya",
  "teknologi",
  "telah",
  "televisi",
  "teman",
  "tempat",
  "tempatan",
  "tempo",
  "tempoh",
  "tenaga",
  "tengah",
  "tentang",
  "tentara",
  "tentu",
  "tentulah",
  "tentunya",
  "tepat",
  "terakhir",
  "terasa",
  "terbaik",
  "terbang",
  "terbanyak",
  "terbesar",
  "terbuka",
  "terdahulu",
  "terdapat",
  "terdiri",
  "terhadap",
  "terhadapnya",
  "teringat",
  "terjadi",
  "terjadilah",
  "terjadinya",
  "terkait",
  "terkenal",
  "terkira",
  "terlalu",
  "terlebih",
  "terletak",
  "terlihat",
  "termasuk",
  "ternyata",
  "tersampaikan",
  "tersebut",
  "tersebutlah",
  "tertentu",
  "tertuju",
  "terus",
  "terutama",
  "testimoni",
  "testimony",
  "tetap",
  "tetapi",
  "the",
  "tiada",
  "tiap",
  "tiba",
  "tidak",
  "tidakkah",
  "tidaklah",
  "tidaknya",
  "tiga",
  "tim",
  "timbalan",
  "timur",
  "tindakan",
  "tinggal",
  "tinggi",
  "tingkat",
  "toh",
  "tokoh",
  "try",
  "tun",
  "tunai",
  "tunjuk",
  "turun",
  "turut",
  "tutur",
  "tuturnya",
  "tv",
  "uang",
  "ucap",
  "ucapnya",
  "udara",
  "ujar",
  "ujarnya",
  "umum",
  "umumnya",
  "unescape",
  "ungkap",
  "ungkapnya",
  "unit",
  "universitas",
  "untuk",
  "untung",
  "upaya",
  "urus",
  "usah",
  "usaha",
  "usai",
  "user",
  "utama",
  "utara",
  "var",
  "versi",
  "waduh",
  "wah",
  "wahai",
  "wakil",
  "waktu",
  "waktunya",
  "walau",
  "walaupun",
  "wang",
  "wanita",
  "warga",
  "warta",
  "wib",
  "wilayah",
  "wong",
  "word",
  "ya",
  "yaitu",
  "yakin",
  "yakni",
  "yang",
  "zaman"
]

},{}],86:[function(require,module,exports){
module.exports=[
  "\ufeffad            ",
  "al            ",
  "allo          ",
  "ai            ",
  "agli          ",
  "all           ",
  "agl           ",
  "alla          ",
  "alle          ",
  "con           ",
  "col           ",
  "coi           ",
  "da            ",
  "dal           ",
  "dallo         ",
  "dai           ",
  "dagli         ",
  "dall          ",
  "dagl          ",
  "dalla         ",
  "dalle         ",
  "di            ",
  "del           ",
  "dello         ",
  "dei           ",
  "degli         ",
  "dell          ",
  "degl          ",
  "della         ",
  "delle         ",
  "in            ",
  "nel           ",
  "nello         ",
  "nei           ",
  "negli         ",
  "nell          ",
  "negl          ",
  "nella         ",
  "nelle         ",
  "su            ",
  "sul           ",
  "sullo         ",
  "sui           ",
  "sugli         ",
  "sull          ",
  "sugl          ",
  "sulla         ",
  "sulle         ",
  "per           ",
  "tra           ",
  "contro        ",
  "io            ",
  "tu            ",
  "lui           ",
  "lei           ",
  "noi           ",
  "voi           ",
  "loro          ",
  "mio           ",
  "mia           ",
  "miei          ",
  "mie           ",
  "tuo           ",
  "tua           ",
  "tuoi          ",
  "tue           ",
  "suo           ",
  "sua           ",
  "suoi          ",
  "sue           ",
  "nostro        ",
  "nostra        ",
  "nostri        ",
  "nostre        ",
  "vostro        ",
  "vostra        ",
  "vostri        ",
  "vostre        ",
  "mi            ",
  "ti            ",
  "ci            ",
  "vi            ",
  "lo            ",
  "la            ",
  "li            ",
  "le            ",
  "gli           ",
  "ne            ",
  "il            ",
  "un            ",
  "uno           ",
  "una           ",
  "ma            ",
  "ed            ",
  "se            ",
  "perchè        ",
  "perché",
  "perche",
  "anche         ",
  "come          ",
  "dov           ",
  "dove          ",
  "che           ",
  "chi           ",
  "cui           ",
  "non           ",
  "più           ",
  "piu",
  "quale         ",
  "quanto        ",
  "quanti        ",
  "quanta        ",
  "quante        ",
  "quello        ",
  "quelli        ",
  "quella        ",
  "quelle        ",
  "questo        ",
  "questi        ",
  "questa        ",
  "queste        ",
  "si            ",
  "tutto         ",
  "tutti         ",
  "a             ",
  "c             ",
  "e             ",
  "i             ",
  "l             ",
  "o             ",
  "ho",
  "hai",
  "ha",
  "abbiamo",
  "avete",
  "hanno",
  "abbia",
  "abbiate",
  "abbiano",
  "avrò",
  "avro",
  "avrai",
  "avrà",
  "avra",
  "avremo",
  "avrete",
  "avranno",
  "avrei",
  "avresti",
  "avrebbe",
  "avremmo",
  "avreste",
  "avrebbero",
  "avevo",
  "avevi",
  "aveva",
  "avevamo",
  "avevate",
  "avevano",
  "ebbi",
  "avesti",
  "ebbe",
  "avemmo",
  "aveste",
  "ebbero",
  "avessi",
  "avesse",
  "avessimo",
  "avessero",
  "avendo",
  "avuto",
  "avuta",
  "avuti",
  "avute",
  "sono",
  "sei",
  "è",
  "é",
  "e",
  "siamo",
  "siete",
  "sia",
  "siate",
  "siano",
  "sarà",
  "sarai",
  "sarò",
  "saro",
  "saremo",
  "sarete",
  "saranno",
  "sarei",
  "saresti",
  "sarebbe",
  "saremmo",
  "sareste",
  "sarebbero",
  "ero",
  "eri",
  "era",
  "eravamo",
  "eravate",
  "erano",
  "fui",
  "fosti",
  "fu",
  "fummo",
  "foste",
  "furono",
  "fossi",
  "fosse",
  "fossimo",
  "fossero",
  "essendo",
  "faccio",
  "fai",
  "facciamo",
  "fanno",
  "faccia",
  "facciate",
  "facciano",
  "farà",
  "farai",
  "farò",
  "faremo",
  "farete",
  "faranno",
  "farei",
  "faresti",
  "farebbe",
  "faremmo",
  "fareste",
  "farebbero",
  "facevo",
  "facevi",
  "faceva",
  "facevamo",
  "facevate",
  "facevano",
  "feci",
  "facesti",
  "fece",
  "facemmo",
  "faceste",
  "fecero",
  "facessi",
  "facesse",
  "facessimo",
  "facessero",
  "facendo",
  "sto",
  "stai",
  "sta",
  "stiamo",
  "stanno",
  "stia",
  "stiate",
  "stiano",
  "starà",
  "starai",
  "starò",
  "staremo",
  "starete",
  "staranno",
  "starei",
  "staresti",
  "starebbe",
  "staremmo",
  "stareste",
  "starebbero",
  "stavo",
  "stavi",
  "stava",
  "stavamo",
  "stavate",
  "stavano",
  "stetti",
  "stesti",
  "stette",
  "stemmo",
  "steste",
  "stettero",
  "stessi",
  "stesse",
  "stessimo",
  "stessero",
  "stando",
  ""
]

},{}],87:[function(require,module,exports){
module.exports=[
  "을",
  "의",
  "에",
  "이",
  "를",
  "으로",
  "은",
  "는",
  "가",
  "로",
  "하고",
  "과",
  "에서",
  "도",
  "와",
  "이다",
  "고",
  "부터",
  "까지",
  "께",
  "에는",
  "이라고",
  "만",
  "라고",
  "보다",
  "에도",
  "다",
  "토록",
  "에게",
  "나",
  "대로",
  "에서는",
  "이나",
  "이며",
  "요",
  "든",
  "으로써",
  "같이",
  "로는",
  "밖에",
  "과의",
  "며",
  "로부터",
  "처럼",
  "아",
  "라",
  "여",
  "으로는",
  "이고",
  "에서의",
  "이라는",
  "만에",
  "으로부터",
  "에서도",
  "와의",
  "엔",
  "만을",
  "부터는",
  "만의",
  "야",
  "까지의",
  "과는",
  "치고",
  "과를",
  "으로의",
  "까지는",
  "보다는",
  "만이",
  "에만",
  "로의"
]

},{}],88:[function(require,module,exports){
module.exports=[
  "alle",
  "andre",
  "arbeid",
  "av",
  "begge",
  "bort",
  "bra",
  "bruke",
  "da",
  "denne",
  "der",
  "deres",
  "det",
  "din",
  "disse",
  "du",
  "eller",
  "en",
  "ene",
  "eneste",
  "enhver",
  "enn",
  "er",
  "et",
  "folk",
  "for",
  "fordi",
  "forsÛke",
  "fra",
  "fÅ",
  "fÛr",
  "fÛrst",
  "gjorde",
  "gjÛre",
  "god",
  "gÅ",
  "ha",
  "hadde",
  "han",
  "hans",
  "hennes",
  "her",
  "hva",
  "hvem",
  "hver",
  "hvilken",
  "hvis",
  "hvor",
  "hvordan",
  "hvorfor",
  "ikke",
  "inn",
  "innen",
  "kan",
  "kunne",
  "lage",
  "lang",
  "lik",
  "like",
  "makt",
  "mange",
  "med",
  "meg",
  "meget",
  "men",
  "mens",
  "mer",
  "mest",
  "min",
  "mye",
  "mÅ",
  "mÅte",
  "navn",
  "nei",
  "ny",
  "nÅ",
  "nÅr",
  "og",
  "ogsÅ",
  "om",
  "opp",
  "oss",
  "over",
  "part",
  "punkt",
  "pÅ",
  "rett",
  "riktig",
  "samme",
  "sant",
  "si",
  "siden",
  "sist",
  "skulle",
  "slik",
  "slutt",
  "som",
  "start",
  "stille",
  "tid",
  "til",
  "tilbake",
  "tilstand",
  "under",
  "ut",
  "uten",
  "var",
  "ved",
  "verdi",
  "vi",
  "vil",
  "ville",
  "vite",
  "vÅr",
  "vÖre",
  "vÖrt",
  "Å",
  ""
]

},{}],89:[function(require,module,exports){
module.exports=[
  "aan",
  "af",
  "al",
  "als",
  "bij",
  "dan",
  "dat",
  "die",
  "dit",
  "een",
  "en",
  "er",
  "had",
  "heb",
  "hem",
  "het",
  "hij",
  "hoe",
  "hun",
  "ik",
  "in",
  "is",
  "je",
  "kan",
  "me",
  "men",
  "met",
  "mij",
  "nog",
  "nu",
  "of",
  "ons",
  "ook",
  "te",
  "tot",
  "uit",
  "van",
  "was",
  "wat",
  "we",
  "wel",
  "wij",
  "zal",
  "ze",
  "zei",
  "zij",
  "zo",
  "zou",
  ""
]

},{}],90:[function(require,module,exports){
module.exports=[
  "at",
  "av",
  "de",
  "den",
  "der",
  "det",
  "du",
  "en",
  "er",
  "et",
  "for",
  "fra",
  "før",
  "med",
  "og",
  "om",
  "over",
  "på",
  "som",
  "til",
  "ved",
  "år",
  "alle",
  "bare",
  "ble",
  "bort",
  "bra",
  "da",
  "deg",
  "dem",
  "denne",
  "dere",
  "deres",
  "det",
  "dette",
  "din",
  "disse",
  "dit",
  "ditt",
  "eller",
  "ene",
  "enn",
  "er",
  "et",
  "ett",
  "etter",
  "for",
  "fram",
  "først",
  "få",
  "god",
  "gå",
  "ha",
  "han",
  "hans",
  "har",
  "her",
  "hit",
  "hun",
  "hva",
  "hvem",
  "hver",
  "ikke",
  "inn",
  "ja",
  "jeg",
  "kan",
  "kom",
  "kun",
  "kunne",
  "lage",
  "lang",
  "lik",
  "like",
  "man",
  "mer",
  "min",
  "mot",
  "mye",
  "må",
  "måte",
  "ned",
  "nei",
  "noe",
  "noen",
  "ny",
  "nå",
  "når",
  "også",
  "opp",
  "oss",
  "seg",
  "selv",
  "si",
  "siden",
  "sin",
  "sine",
  "sist",
  "skal",
  "skulle",
  "slik",
  "som",
  "så",
  "sånn",
  "tid",
  "til",
  "under",
  "ut",
  "uten",
  "var",
  "ved",
  "vi",
  "vil",
  "vite",
  "vår",
  "å",
  "dei",
  "di",
  "då",
  "eg"
]

},{}],91:[function(require,module,exports){
module.exports=[
  "a",
  "aby",
  "ach",
  "acz",
  "aczkolwiek",
  "aj",
  "albo",
  "ale",
  "ależ",
  "ani",
  "aż",
  "bardziej",
  "bardzo",
  "bo",
  "bowiem",
  "by",
  "byli",
  "bynajmniej",
  "być",
  "był",
  "była",
  "było",
  "były",
  "będzie",
  "będą",
  "cali",
  "cała",
  "cały",
  "ci",
  "cię",
  "ciebie",
  "co",
  "cokolwiek",
  "coś",
  "czasami",
  "czasem",
  "czemu",
  "czy",
  "czyli",
  "daleko",
  "dla",
  "dlaczego",
  "dlatego",
  "do",
  "dobrze",
  "dokąd",
  "dość",
  "dużo",
  "dwa",
  "dwaj",
  "dwie",
  "dwoje",
  "dziś",
  "dzisiaj",
  "gdy",
  "gdyby",
  "gdyż",
  "gdzie",
  "gdziekolwiek",
  "gdzieś",
  "i",
  "ich",
  "ile",
  "im",
  "inna",
  "inne",
  "inny",
  "innych",
  "iż",
  "ja",
  "ją",
  "jak",
  "jakaś",
  "jakby",
  "jaki",
  "jakichś",
  "jakie",
  "jakiś",
  "jakiż",
  "jakkolwiek",
  "jako",
  "jakoś",
  "je",
  "jeden",
  "jedna",
  "jedno",
  "jednak",
  "jednakże",
  "jego",
  "jej",
  "jemu",
  "jest",
  "jestem",
  "jeszcze",
  "jeśli",
  "jeżeli",
  "już",
  "ją",
  "każdy",
  "kiedy",
  "kilka",
  "kimś",
  "kto",
  "ktokolwiek",
  "ktoś",
  "która",
  "które",
  "którego",
  "której",
  "który",
  "których",
  "którym",
  "którzy",
  "ku",
  "lat",
  "lecz",
  "lub",
  "ma",
  "mają",
  "mało",
  "mam",
  "mi",
  "mimo",
  "między",
  "mną",
  "mnie",
  "mogą",
  "moi",
  "moim",
  "moja",
  "moje",
  "może",
  "możliwe",
  "można",
  "mój",
  "mu",
  "musi",
  "my",
  "na",
  "nad",
  "nam",
  "nami",
  "nas",
  "nasi",
  "nasz",
  "nasza",
  "nasze",
  "naszego",
  "naszych",
  "natomiast",
  "natychmiast",
  "nawet",
  "nią",
  "nic",
  "nich",
  "nie",
  "niech",
  "niego",
  "niej",
  "niemu",
  "nigdy",
  "nim",
  "nimi",
  "niż",
  "no",
  "o",
  "obok",
  "od",
  "około",
  "on",
  "ona",
  "one",
  "oni",
  "ono",
  "oraz",
  "oto",
  "owszem",
  "pan",
  "pana",
  "pani",
  "po",
  "pod",
  "podczas",
  "pomimo",
  "ponad",
  "ponieważ",
  "powinien",
  "powinna",
  "powinni",
  "powinno",
  "poza",
  "prawie",
  "przecież",
  "przed",
  "przede",
  "przedtem",
  "przez",
  "przy",
  "roku",
  "również",
  "sam",
  "sama",
  "są",
  "się",
  "skąd",
  "sobie",
  "sobą",
  "sposób",
  "swoje",
  "ta",
  "tak",
  "taka",
  "taki",
  "takie",
  "także",
  "tam",
  "te",
  "tego",
  "tej",
  "temu",
  "ten",
  "teraz",
  "też",
  "to",
  "tobą",
  "tobie",
  "toteż",
  "trzeba",
  "tu",
  "tutaj",
  "twoi",
  "twoim",
  "twoja",
  "twoje",
  "twym",
  "twój",
  "ty",
  "tych",
  "tylko",
  "tym",
  "u",
  "w",
  "wam",
  "wami",
  "was",
  "wasz",
  "wasza",
  "wasze",
  "we",
  "według",
  "wiele",
  "wielu",
  "więc",
  "więcej",
  "wszyscy",
  "wszystkich",
  "wszystkie",
  "wszystkim",
  "wszystko",
  "wtedy",
  "wy",
  "właśnie",
  "z",
  "za",
  "zapewne",
  "zawsze",
  "ze",
  "zł",
  "znowu",
  "znów",
  "został",
  "żaden",
  "żadna",
  "żadne",
  "żadnych",
  "że",
  "żeby"
]

},{}],92:[function(require,module,exports){
module.exports=[
  "a",
  "à",
  "abril",
  "agosto",
  "ainda",
  "ano",
  "anos",
  "ao",
  "aos",
  "apenas",
  "as",
  "às",
  "até",
  "brasil",
  "com",
  "como",
  "contra",
  "da",
  "das",
  "de",
  "depois",
  "deve",
  "dezembro",
  "dia",
  "disse",
  "diz",
  "do",
  "dois",
  "dos",
  "e",
  "é",
  "ela",
  "ele",
  "em",
  "entre",
  "era",
  "está",
  "estado",
  "estão",
  "eu",
  "foi",
  "folha",
  "foram",
  "governo",
  "grande",
  "há",
  "hoje",
  "isso",
  "já",
  "local",
  "maio",
  "maior",
  "mais",
  "mas",
  "mercado",
  "mesmo",
  "mil",
  "milhões",
  "muito",
  "mundo",
  "na",
  "não",
  "nas",
  "no",
  "nos",
  "o",
  "ontem",
  "os",
  "ou",
  "país",
  "para",
  "paulo",
  "pela",
  "pelo",
  "pessoas",
  "pode",
  "por",
  "porque",
  "presidente",
  "quando",
  "que",
  "quem",
  "r",
  "rio",
  "são",
  "se",
  "segundo",
  "sem",
  "ser",
  "será",
  "seu",
  "seus",
  "só",
  "sobre",
  "sua",
  "também",
  "tem",
  "ter",
  "todos",
  "três",
  "um",
  "uma",
  "us",
  "vaia",
  "à",
  "acordo",
  "afirmou",
  "agora",
  "ainda",
  "além",
  "alguns",
  "ano",
  "anos",
  "antes",
  "ao",
  "aos",
  "apenas",
  "as",
  "às",
  "assim",
  "até",
  "banco",
  "bem",
  "brasil",
  "brasileira",
  "brasileiro",
  "brasília",
  "cada",
  "carlos",
  "casa",
  "caso",
  "cerca",
  "cidade",
  "com",
  "como",
  "congresso",
  "contra",
  "da",
  "das",
  "de",
  "depois",
  "desde",
  "deve",
  "dia",
  "dias",
  "dinheiro",
  "disse",
  "diz",
  "do",
  "dois",
  "dos",
  "duas",
  "durante",
  "e",
  "é",
  "economia",
  "ela",
  "ele",
  "eles",
  "em",
  "empresa",
  "empresas",
  "entre",
  "era",
  "especial",
  "essa",
  "esse",
  "esta",
  "está",
  "estado",
  "estão",
  "estava",
  "este",
  "eu",
  "eua",
  "exemplo",
  "faz",
  "fazer",
  "federal",
  "fernando",
  "fevereiro",
  "fhc",
  "filme",
  "final",
  "foi",
  "folha",
  "foram",
  "forma",
  "governo",
  "grande",
  "grupo",
  "há",
  "henrique",
  "história",
  "hoje",
  "inflação",
  "isso",
  "já",
  "janeiro",
  "josé",
  "lei",
  "local",
  "maior",
  "mais",
  "março",
  "mas",
  "me",
  "melhor",
  "menos",
  "mercado",
  "mês",
  "meses",
  "mesmo",
  "mil",
  "milhões",
  "ministro",
  "muito",
  "mundo",
  "na",
  "nacional",
  "nada",
  "não",
  "nas",
  "nem",
  "no",
  "nos",
  "nova",
  "novo",
  "o",
  "onde",
  "ontem",
  "os",
  "ou",
  "outra",
  "outro",
  "outros",
  "outubro",
  "país",
  "para",
  "parte",
  "partir",
  "passado",
  "paulo",
  "pela",
  "pelo",
  "pelos",
  "pessoas",
  "plano",
  "pode",
  "polícia",
  "política",
  "por",
  "porque",
  "preços",
  "presidente",
  "primeira",
  "primeiro",
  "programa",
  "projeto",
  "público",
  "qual",
  "qualquer",
  "quando",
  "quatro",
  "que",
  "quem",
  "r",
  "real",
  "reportagem",
  "rio",
  "são",
  "se",
  "segundo",
  "seja",
  "sem",
  "semana",
  "sempre",
  "sendo",
  "ser",
  "será",
  "seria",
  "seu",
  "seus",
  "sistema",
  "só",
  "sobre",
  "sp",
  "sua",
  "suas",
  "também",
  "tem",
  "têm",
  "tempo",
  "ter",
  "todo",
  "todos",
  "trabalho",
  "três",
  "tudo",
  "um",
  "uma",
  "us",
  "vai",
  "vez",
  "vida",
  "vocêa",
  "à",
  "acordo",
  "afirma",
  "afirmou",
  "agora",
  "ainda",
  "além",
  "alguns",
  "ano",
  "anos",
  "antes",
  "ao",
  "aos",
  "apenas",
  "após",
  "aqui",
  "área",
  "as",
  "às",
  "assim",
  "até",
  "aumento",
  "banco",
  "bem",
  "bilhões",
  "bom",
  "brasil",
  "brasileira",
  "brasileiro",
  "brasília",
  "cada",
  "câmara",
  "campanha",
  "candidato",
  "carlos",
  "casa",
  "caso",
  "central",
  "centro",
  "cerca",
  "cidade",
  "cinco",
  "cinema",
  "coisa",
  "com",
  "como",
  "congresso",
  "conta",
  "contra",
  "da",
  "dar",
  "das",
  "de",
  "depois",
  "deputado",
  "desde",
  "deve",
  "dia",
  "dias",
  "dinheiro",
  "direito",
  "diretor",
  "disse",
  "diz",
  "do",
  "dois",
  "dos",
  "duas",
  "durante",
  "e",
  "é",
  "economia",
  "econômica",
  "ela",
  "ele",
  "eles",
  "em",
  "empresa",
  "empresas",
  "enquanto",
  "então",
  "entre",
  "equipe",
  "era",
  "especial",
  "essa",
  "esse",
  "esta",
  "está",
  "estado",
  "estados",
  "estão",
  "estava",
  "este",
  "eu",
  "eua",
  "exemplo",
  "falta",
  "fato",
  "faz",
  "fazer",
  "federal",
  "fernando",
  "fez",
  "fhc",
  "ficou",
  "filho",
  "filme",
  "fim",
  "final",
  "foi",
  "folha",
  "fora",
  "foram",
  "forma",
  "governo",
  "grande",
  "grupo",
  "há",
  "havia",
  "henrique",
  "história",
  "hoje",
  "inflação",
  "início",
  "isso",
  "já",
  "janeiro",
  "jogo",
  "josé",
  "junho",
  "julho",
  "juros",
  "justiça",
  "lado",
  "lei",
  "livro",
  "local",
  "lugar",
  "maior",
  "mais",
  "mas",
  "me",
  "média",
  "meio",
  "melhor",
  "menos",
  "mercado",
  "mês",
  "meses",
  "mesma",
  "mesmo",
  "meu",
  "mil",
  "milhões",
  "minha",
  "ministério",
  "ministro",
  "momento",
  "muito",
  "mulher",
  "mundo",
  "na",
  "nacional",
  "nada",
  "não",
  "nas",
  "nem",
  "neste",
  "no",
  "noite",
  "nome",
  "nos",
  "nós",
  "nova",
  "novembro",
  "novo",
  "num",
  "numa",
  "número",
  "o",
  "onde",
  "ontem",
  "os",
  "ou",
  "outra",
  "outras",
  "outro",
  "outros",
  "país",
  "países",
  "para",
  "parte",
  "partido",
  "partir",
  "passado",
  "paulo",
  "pela",
  "pelo",
  "pelos",
  "período",
  "pesquisa",
  "pessoas",
  "plano",
  "pode",
  "podem",
  "poder",
  "polícia",
  "política",
  "pontos",
  "por",
  "porque",
  "pouco",
  "prazo",
  "preço",
  "preços",
  "presidente",
  "primeira",
  "primeiro",
  "problema",
  "problemas",
  "processo",
  "produção",
  "produtos",
  "programa",
  "projeto",
  "próprio",
  "pt",
  "público",
  "qual",
  "qualquer",
  "quando",
  "quanto",
  "quase",
  "quatro",
  "que",
  "quem",
  "quer",
  "r",
  "real",
  "recursos",
  "região",
  "relação",
  "reportagem",
  "rio",
  "são",
  "saúde",
  "se",
  "segundo",
  "seja",
  "sem",
  "semana",
  "sempre",
  "sendo",
  "ser",
  "será",
  "serão",
  "seria",
  "setembro",
  "setor",
  "seu",
  "seus",
  "sido",
  "silva",
  "sistema",
  "só",
  "sobre",
  "social",
  "sociedade",
  "sp",
  "sua",
  "suas",
  "sucursal",
  "sul",
  "também",
  "tão",
  "tel",
  "tem",
  "têm",
  "tempo",
  "ter",
  "teve",
  "tinha",
  "toda",
  "todas",
  "todo",
  "todos",
  "trabalho",
  "três",
  "tudo",
  "último",
  "um",
  "uma",
  "us",
  "vai",
  "valor",
  "vão",
  "vem",
  "vez",
  "vezes",
  "vida",
  "você",
  "zona"
]

},{}],93:[function(require,module,exports){
module.exports=[
  "\ufeffа\r",
  "е\r",
  "и\r",
  "ж\r",
  "м\r",
  "о\r",
  "на\r",
  "не\r",
  "ни\r",
  "об\r",
  "но\r",
  "он\r",
  "мне\r",
  "мои\r",
  "мож\r",
  "она\r",
  "они\r",
  "оно\r",
  "мной\r",
  "много\r",
  "многочисленное\r",
  "многочисленная\r",
  "многочисленные\r",
  "многочисленный\r",
  "мною\r",
  "мой\r",
  "мог\r",
  "могут\r",
  "можно\r",
  "может\r",
  "можхо\r",
  "мор\r",
  "моя\r",
  "моё\r",
  "мочь\r",
  "над\r",
  "нее\r",
  "оба\r",
  "нам\r",
  "нем\r",
  "нами\r",
  "ними\r",
  "мимо\r",
  "немного\r",
  "одной\r",
  "одного\r",
  "менее\r",
  "однажды\r",
  "однако\r",
  "меня\r",
  "нему\r",
  "меньше\r",
  "ней\r",
  "наверху\r",
  "него\r",
  "ниже\r",
  "мало\r",
  "надо\r",
  "один\r",
  "одиннадцать\r",
  "одиннадцатый\r",
  "назад\r",
  "наиболее\r",
  "недавно\r",
  "миллионов\r",
  "недалеко\r",
  "между\r",
  "низко\r",
  "меля\r",
  "нельзя\r",
  "нибудь\r",
  "непрерывно\r",
  "наконец\r",
  "никогда\r",
  "никуда\r",
  "нас\r",
  "наш\r",
  "нет\r",
  "нею\r",
  "неё\r",
  "них\r",
  "мира\r",
  "наша\r",
  "наше\r",
  "наши\r",
  "ничего\r",
  "начала\r",
  "нередко\r",
  "несколько\r",
  "обычно\r",
  "опять\r",
  "около\r",
  "мы\r",
  "ну\r",
  "нх\r",
  "от\r",
  "отовсюду\r",
  "особенно\r",
  "нужно\r",
  "очень\r",
  "отсюда\r",
  "в\r",
  "во\r",
  "вон\r",
  "вниз\r",
  "внизу\r",
  "вокруг\r",
  "вот\r",
  "восемнадцать\r",
  "восемнадцатый\r",
  "восемь\r",
  "восьмой\r",
  "вверх\r",
  "вам\r",
  "вами\r",
  "важное\r",
  "важная\r",
  "важные\r",
  "важный\r",
  "вдали\r",
  "везде\r",
  "ведь\r",
  "вас\r",
  "ваш\r",
  "ваша\r",
  "ваше\r",
  "ваши\r",
  "впрочем\r",
  "весь\r",
  "вдруг\r",
  "вы\r",
  "все\r",
  "второй\r",
  "всем\r",
  "всеми\r",
  "времени\r",
  "время\r",
  "всему\r",
  "всего\r",
  "всегда\r",
  "всех\r",
  "всею\r",
  "всю\r",
  "вся\r",
  "всё\r",
  "всюду\r",
  "г\r",
  "год\r",
  "говорил\r",
  "говорит\r",
  "года\r",
  "году\r",
  "где\r",
  "да\r",
  "ее\r",
  "за\r",
  "из\r",
  "ли\r",
  "же\r",
  "им\r",
  "до\r",
  "по\r",
  "ими\r",
  "под\r",
  "иногда\r",
  "довольно\r",
  "именно\r",
  "долго\r",
  "позже\r",
  "более\r",
  "должно\r",
  "пожалуйста\r",
  "значит\r",
  "иметь\r",
  "больше\r",
  "пока\r",
  "ему\r",
  "имя\r",
  "пор\r",
  "пора\r",
  "потом\r",
  "потому\r",
  "после\r",
  "почему\r",
  "почти\r",
  "посреди\r",
  "ей\r",
  "два\r",
  "две\r",
  "двенадцать\r",
  "двенадцатый\r",
  "двадцать\r",
  "двадцатый\r",
  "двух\r",
  "его\r",
  "дел\r",
  "или\r",
  "без\r",
  "день\r",
  "занят\r",
  "занята\r",
  "занято\r",
  "заняты\r",
  "действительно\r",
  "давно\r",
  "девятнадцать\r",
  "девятнадцатый\r",
  "девять\r",
  "девятый\r",
  "даже\r",
  "алло\r",
  "жизнь\r",
  "далеко\r",
  "близко\r",
  "здесь\r",
  "дальше\r",
  "для\r",
  "лет\r",
  "зато\r",
  "даром\r",
  "первый\r",
  "перед\r",
  "затем\r",
  "зачем\r",
  "лишь\r",
  "десять\r",
  "десятый\r",
  "ею\r",
  "её\r",
  "их\r",
  "бы\r",
  "еще\r",
  "при\r",
  "был\r",
  "про\r",
  "процентов\r",
  "против\r",
  "просто\r",
  "бывает\r",
  "бывь\r",
  "если\r",
  "люди\r",
  "была\r",
  "были\r",
  "было\r",
  "будем\r",
  "будет\r",
  "будете\r",
  "будешь\r",
  "прекрасно\r",
  "буду\r",
  "будь\r",
  "будто\r",
  "будут\r",
  "ещё\r",
  "пятнадцать\r",
  "пятнадцатый\r",
  "друго\r",
  "другое\r",
  "другой\r",
  "другие\r",
  "другая\r",
  "других\r",
  "есть\r",
  "пять\r",
  "быть\r",
  "лучше\r",
  "пятый\r",
  "к\r",
  "ком\r",
  "конечно\r",
  "кому\r",
  "кого\r",
  "когда\r",
  "которой\r",
  "которого\r",
  "которая\r",
  "которые\r",
  "который\r",
  "которых\r",
  "кем\r",
  "каждое\r",
  "каждая\r",
  "каждые\r",
  "каждый\r",
  "кажется\r",
  "как\r",
  "какой\r",
  "какая\r",
  "кто\r",
  "кроме\r",
  "куда\r",
  "кругом\r",
  "с\r",
  "т\r",
  "у\r",
  "я\r",
  "та\r",
  "те\r",
  "уж\r",
  "со\r",
  "то\r",
  "том\r",
  "снова\r",
  "тому\r",
  "совсем\r",
  "того\r",
  "тогда\r",
  "тоже\r",
  "собой\r",
  "тобой\r",
  "собою\r",
  "тобою\r",
  "сначала\r",
  "только\r",
  "уметь\r",
  "тот\r",
  "тою\r",
  "хорошо\r",
  "хотеть\r",
  "хочешь\r",
  "хоть\r",
  "хотя\r",
  "свое\r",
  "свои\r",
  "твой\r",
  "своей\r",
  "своего\r",
  "своих\r",
  "свою\r",
  "твоя\r",
  "твоё\r",
  "раз\r",
  "уже\r",
  "сам\r",
  "там\r",
  "тем\r",
  "чем\r",
  "сама\r",
  "сами\r",
  "теми\r",
  "само\r",
  "рано\r",
  "самом\r",
  "самому\r",
  "самой\r",
  "самого\r",
  "семнадцать\r",
  "семнадцатый\r",
  "самим\r",
  "самими\r",
  "самих\r",
  "саму\r",
  "семь\r",
  "чему\r",
  "раньше\r",
  "сейчас\r",
  "чего\r",
  "сегодня\r",
  "себе\r",
  "тебе\r",
  "сеаой\r",
  "человек\r",
  "разве\r",
  "теперь\r",
  "себя\r",
  "тебя\r",
  "седьмой\r",
  "спасибо\r",
  "слишком\r",
  "так\r",
  "такое\r",
  "такой\r",
  "такие\r",
  "также\r",
  "такая\r",
  "сих\r",
  "тех\r",
  "чаще\r",
  "четвертый\r",
  "через\r",
  "часто\r",
  "шестой\r",
  "шестнадцать\r",
  "шестнадцатый\r",
  "шесть\r",
  "четыре\r",
  "четырнадцать\r",
  "четырнадцатый\r",
  "сколько\r",
  "сказал\r",
  "сказала\r",
  "сказать\r",
  "ту\r",
  "ты\r",
  "три\r",
  "эта\r",
  "эти\r",
  "что\r",
  "это\r",
  "чтоб\r",
  "этом\r",
  "этому\r",
  "этой\r",
  "этого\r",
  "чтобы\r",
  "этот\r",
  "стал\r",
  "туда\r",
  "этим\r",
  "этими\r",
  "рядом\r",
  "тринадцать\r",
  "тринадцатый\r",
  "этих\r",
  "третий\r",
  "тут\r",
  "эту\r",
  "суть\r",
  "чуть\r",
  "тысяч\r",
  ""
]

},{}],94:[function(require,module,exports){
module.exports=[
  "kunna",
  "om",
  "ovan",
  "enligt",
  "i enlighet med detta",
  "över",
  "faktiskt",
  "efter",
  "efteråt",
  "igen",
  "mot",
  "är inte",
  "alla",
  "tillåta",
  "tillåter",
  "nästan",
  "ensam",
  "längs",
  "redan",
  "också",
  "även om",
  "alltid",
  "am",
  "bland",
  "bland",
  "en",
  "och",
  "en annan",
  "någon",
  "någon",
  "hur som helst",
  "någon",
  "något",
  "ändå",
  "ändå",
  "var som helst",
  "isär",
  "visas",
  "uppskatta",
  "lämpligt",
  "är",
  "inte",
  "runt",
  "som",
  "åt sidan",
  "be",
  "frågar",
  "associerad",
  "vid",
  "tillgängliga",
  "bort",
  "väldigt",
  "vara",
  "blev",
  "eftersom",
  "bli",
  "blir",
  "blir",
  "varit",
  "innan",
  "förhand",
  "bakom",
  "vara",
  "tro",
  "nedan",
  "bredvid",
  "förutom",
  "bäst",
  "bättre",
  "mellan",
  "bortom",
  "både",
  "kort",
  "men",
  "genom",
  "c",
  "c'mon",
  "c: s",
  "kom",
  "kampanj",
  "kan",
  "kan inte",
  "kan inte",
  "cant",
  "orsaka",
  "orsaker",
  "viss",
  "säkerligen",
  "förändringar",
  "klart",
  "co",
  "com",
  "komma",
  "kommer",
  "om",
  "följaktligen",
  "överväga",
  "överväger",
  "innehålla",
  "innehållande",
  "innehåller",
  "motsvarande",
  "kunde",
  "kunde inte",
  "kurs",
  "närvarande",
  "definitivt",
  "beskrivits",
  "trots",
  "gjorde",
  "inte",
  "olika",
  "göra",
  "gör",
  "inte",
  "gör",
  "inte",
  "gjort",
  "ned",
  "nedåt",
  "under",
  "varje",
  "edu",
  "åtta",
  "antingen",
  "annars",
  "någon annanstans",
  "tillräckligt",
  "godkändes",
  "helt",
  "speciellt",
  "et",
  "etc",
  "även",
  "någonsin",
  "varje",
  "alla",
  "alla",
  "allt",
  "överallt",
  "ex",
  "exakt",
  "exempel",
  "utom",
  "långt",
  "få",
  "femte",
  "först",
  "finansiella",
  "fem",
  "följt",
  "efter",
  "följer",
  "för",
  "fd",
  "tidigare",
  "framåt",
  "fyra",
  "från",
  "ytterligare",
  "dessutom",
  "få",
  "blir",
  "få",
  "given",
  "ger",
  "gå",
  "går",
  "gå",
  "borta",
  "fick",
  "fått",
  "hälsningar",
  "hade",
  "hade inte",
  "händer",
  "knappast",
  "har",
  "har inte",
  "ha",
  "har inte",
  "med",
  "han",
  "han är",
  "hallå",
  "hjälpa",
  "hence",
  "henne",
  "här",
  "här finns",
  "härefter",
  "härmed",
  "häri",
  "härpå",
  "hennes",
  "själv",
  "hej",
  "honom",
  "själv",
  "hans",
  "hit",
  "förhoppningsvis",
  "hur",
  "howbeit",
  "dock",
  "jag skulle",
  "jag ska",
  "jag är",
  "jag har",
  "om",
  "ignoreras",
  "omedelbar",
  "i",
  "eftersom",
  "inc",
  "indeed",
  "indikera",
  "indikerade",
  "indikerar",
  "inre",
  "mån",
  "istället",
  "in",
  "inåt",
  "är",
  "är inte",
  "den",
  "det skulle",
  "det ska",
  "det är",
  "dess",
  "själv",
  "bara",
  "hålla",
  "håller",
  "hålls",
  "vet",
  "vet",
  "känd",
  "sista",
  "nyligen",
  "senare",
  "senare",
  "latterly",
  "minst",
  "mindre",
  "lest",
  "låt",
  "låt oss",
  "liknande",
  "gillade",
  "sannolikt",
  "lite",
  "ser",
  "ser",
  "ser",
  "ltd",
  "huvudsakligen",
  "många",
  "kan",
  "kanske",
  "mig",
  "betyda",
  "under tiden",
  "endast",
  "kanske",
  "mer",
  "dessutom",
  "mest",
  "mestadels",
  "mycket",
  "måste",
  "min",
  "själv",
  "namn",
  "nämligen",
  "nd",
  "nära",
  "nästan",
  "nödvändigt",
  "behöver",
  "behov",
  "varken",
  "aldrig",
  "ändå",
  "ny",
  "nästa",
  "nio",
  "ingen",
  "ingen",
  "icke",
  "ingen",
  "ingen",
  "eller",
  "normalt",
  "inte",
  "ingenting",
  "roman",
  "nu",
  "ingenstans",
  "uppenbarligen",
  "av",
  "off",
  "ofta",
  "oh",
  "ok",
  "okay",
  "gammal",
  "på",
  "en gång",
  "ett",
  "ettor",
  "endast",
  "på",
  "eller",
  "andra",
  "andra",
  "annars",
  "borde",
  "vår",
  "vårt",
  "oss",
  "ut",
  "utanför",
  "över",
  "övergripande",
  "egen",
  "särskilt",
  "särskilt",
  "per",
  "kanske",
  "placeras",
  "vänligen",
  "plus",
  "möjligt",
  "förmodligen",
  "förmodligen",
  "ger",
  "ganska",
  "citera",
  "kvartalsvis",
  "snarare",
  "verkligen",
  "rimligen",
  "om",
  "oavsett",
  "gäller",
  "relativt",
  "respektive",
  "höger",
  "sa",
  "samma",
  "såg",
  "säga",
  "säger",
  "säger",
  "andra",
  "det andra",
  "se",
  "ser",
  "verkar",
  "verkade",
  "informationsproblem",
  "verkar",
  "sett",
  "själv",
  "själva",
  "förnuftig",
  "skickas",
  "allvarlig",
  "allvarligt",
  "sju",
  "flera",
  "skall",
  "hon",
  "bör",
  "bör inte",
  "eftersom",
  "sex",
  "så",
  "några",
  "någon",
  "på något sätt",
  "någon",
  "något",
  "sometime",
  "ibland",
  "något",
  "någonstans",
  "snart",
  "sorry",
  "specificerade",
  "ange",
  "ange",
  "fortfarande",
  "sub",
  "sådan",
  "sup",
  "säker",
  "t s",
  "ta",
  "tas",
  "berätta",
  "tenderar",
  "än",
  "tacka",
  "tack",
  "thanx",
  "att",
  "det är",
  "brinner",
  "den",
  "deras",
  "deras",
  "dem",
  "själva",
  "sedan",
  "därifrån",
  "där",
  "det finns",
  "därefter",
  "därigenom",
  "därför",
  "däri",
  "theres",
  "därpå",
  "dessa",
  "de",
  "de hade",
  "de kommer",
  "de är",
  "de har",
  "tror",
  "tredje",
  "detta",
  "grundlig",
  "grundligt",
  "de",
  "though",
  "tre",
  "genom",
  "hela",
  "thru",
  "sålunda",
  "till",
  "tillsammans",
  "alltför",
  "tog",
  "mot",
  "mot",
  "försökte",
  "försöker",
  "verkligt",
  "försök",
  "försöker",
  "två gånger",
  "två",
  "enligt",
  "tyvärr",
  "såvida inte",
  "osannolikt",
  "tills",
  "åt",
  "upp",
  "på",
  "oss",
  "använda",
  "används",
  "användbar",
  "använder",
  "användning",
  "vanligtvis",
  "uucp",
  "värde",
  "olika",
  "mycket",
  "via",
  "viz",
  "vs",
  "vill",
  "vill",
  "var",
  "var inte",
  "sätt",
  "vi",
  "vi skulle",
  "vi kommer",
  "vi är",
  "vi har",
  "välkommen",
  "väl",
  "gick",
  "var",
  "var inte",
  "vad",
  "vad är",
  "oavsett",
  "när",
  "varifrån",
  "närhelst",
  "där",
  "var är",
  "varefter",
  "medan",
  "varigenom",
  "vari",
  "varpå",
  "varhelst",
  "huruvida",
  "som",
  "medan",
  "dit",
  "som",
  "vem är",
  "vem",
  "hela",
  "vem",
  "vars",
  "varför",
  "kommer",
  "villig",
  "önskar",
  "med",
  "inom",
  "utan",
  "kommer inte",
  "undrar",
  "skulle",
  "skulle inte",
  "ja",
  "ännu",
  "ni",
  "du skulle",
  "kommer du",
  "du är",
  "du har",
  "din",
  "själv",
  "er",
  "noll",
  "tjänsteman",
  "skarpt",
  "kritiserade",
  ""
]

},{}],95:[function(require,module,exports){
module.exports=[
  "\ufeffเก็บ\r",
  "เกิด\r",
  "เกิน\r",
  "เกินๆ\r",
  "เกี่ยวเนื่อง\r",
  "เกี่ยวกัน\r",
  "เกี่ยวกับ\r",
  "เกี่ยวข้อง\r",
  "เกี่ยวๆ\r",
  "เกือบ\r",
  "เกือบจะ\r",
  "เกือบๆ\r",
  "เขา\r",
  "เข้า\r",
  "เข้าใจ\r",
  "เขียน\r",
  "เคย\r",
  "เคยๆ\r",
  "เฉกเช่น\r",
  "เฉพาะ\r",
  "เฉย\r",
  "เฉยๆ\r",
  "เช่น\r",
  "เช่นเคย\r",
  "เช่นเดียวกัน\r",
  "เช่นเดียวกับ\r",
  "เช่นเมื่อ\r",
  "เช่นใด\r",
  "เช่นไร\r",
  "เช่นก่อน\r",
  "เช่นกัน\r",
  "เช่นดัง\r",
  "เช่นดังเก่า\r",
  "เช่นดังก่อน\r",
  "เช่นดังที่\r",
  "เช่นดังว่า\r",
  "เช่นที่\r",
  "เช่นที่เคย\r",
  "เช่นที่ว่า\r",
  "เช่นนั้น\r",
  "เช่นนั้นเอง\r",
  "เช่นนี้\r",
  "เชื่อ\r",
  "เชื่อถือ\r",
  "เชื่อมั่น\r",
  "เชื่อว่า\r",
  "เดิม\r",
  "เดิมที\r",
  "เดิมๆ\r",
  "เดียว\r",
  "เดี๋ยว\r",
  "เดี๋ยวก่อน\r",
  "เดียวกัน\r",
  "เดียวกับ\r",
  "เดี๋ยวนั้น\r",
  "เดี๋ยวนี้\r",
  "เต็มไปด้วย\r",
  "เต็มไปหมด\r",
  "เต็มๆ\r",
  "เถอะ\r",
  "เถิด\r",
  "เท่า\r",
  "เท่าใด\r",
  "เท่าไร\r",
  "เท่าไหร่\r",
  "เท่ากัน\r",
  "เท่ากับ\r",
  "เท่าที่\r",
  "เท่านั้น\r",
  "เท่านี้\r",
  "เธอ\r",
  "เน้น\r",
  "เนี่ย\r",
  "เนี่ยเอง\r",
  "เป็น\r",
  "เป็นเพื่อ\r",
  "เป็นแต่\r",
  "เป็นด้วย\r",
  "เป็นดัง\r",
  "เป็นต้น\r",
  "เป็นอัน\r",
  "เป็นอันมาก\r",
  "เป็นอาทิ\r",
  "เปลี่ยน\r",
  "เปลี่ยนแปลง\r",
  "เผื่อ\r",
  "เผื่อจะ\r",
  "เผื่อที่\r",
  "เผื่อว่า\r",
  "เพราะ\r",
  "เพราะฉะนั้น\r",
  "เพราะว่า\r",
  "เพิ่ง\r",
  "เพิ่งจะ\r",
  "เพิ่ม\r",
  "เพิ่มเติม\r",
  "เพี\r",
  "เพียง\r",
  "เพียงเพื่อ\r",
  "เพียงแค่\r",
  "เพียงแต่\r",
  "เพียงใด\r",
  "เพียงไหน\r",
  "เพียงพอ\r",
  "เพื่อ\r",
  "เพื่อให้\r",
  "เพื่อที่\r",
  "เพื่อว่า\r",
  "เมื่อ\r",
  "เมื่อเช้า\r",
  "เมื่อเย็น\r",
  "เมื่อใด\r",
  "เมื่อไร\r",
  "เมื่อไหร่\r",
  "เมื่อก่อน\r",
  "เมื่อครั้ง\r",
  "เมื่อครั้งก่อน\r",
  "เมื่อคราว\r",
  "เมื่อคราวก่อน\r",
  "เมื่อคราวที่\r",
  "เมื่อคืน\r",
  "เมื่อนั้น\r",
  "เมื่อนี้\r",
  "เมื่อวันวาน\r",
  "เมื่อวาน\r",
  "เยอะ\r",
  "เยอะแยะ\r",
  "เร็ว\r",
  "เร็วๆ\r",
  "เรา\r",
  "เราๆ\r",
  "เริ่ม\r",
  "เรียก\r",
  "เรียบ\r",
  "เรื่อย\r",
  "เรื่อยๆ\r",
  "เล็ก\r",
  "เล็กน้อย\r",
  "เล็กๆ\r",
  "เลย\r",
  "เล่าว่า\r",
  "เสร็จ\r",
  "เสร็จแล้ว\r",
  "เสียแล้ว\r",
  "เสียจน\r",
  "เสียด้วย\r",
  "เสียนี่\r",
  "เหตุ\r",
  "เหตุไร\r",
  "เหตุนั้น\r",
  "เหตุนี้\r",
  "เหตุมด\r",
  "เห็นแก่\r",
  "เห็นควร\r",
  "เห็นจะ\r",
  "เห็นว่า\r",
  "เหล่า\r",
  "เหล่านั้น\r",
  "เหล่านี้\r",
  "เหลือ\r",
  "เหลือเกิน\r",
  "เอง\r",
  "เอ็ง\r",
  "เอา\r",
  "แก\r",
  "แก่\r",
  "แก้ไข\r",
  "แค่\r",
  "แค่เพียง\r",
  "แค่ไหน\r",
  "แค่จะ\r",
  "แค่นั้น\r",
  "แค่นี้\r",
  "แค่ว่า\r",
  "แด่\r",
  "แต่\r",
  "แต่เดิม\r",
  "แต่เพียง\r",
  "แต่เมื่อ\r",
  "แต่ไร\r",
  "แต่ไหน\r",
  "แต่ก็\r",
  "แต่ก่อน\r",
  "แต่จะ\r",
  "แต่ต้อง\r",
  "แต่ถ้า\r",
  "แต่ทว่า\r",
  "แต่ที่\r",
  "แต่นั้น\r",
  "แต่ละ\r",
  "แต่ว่า\r",
  "แต่อย่างใด\r",
  "แท้\r",
  "แท้จริง\r",
  "แบบ\r",
  "แม้\r",
  "แม้แต่\r",
  "แม้กระทั่ง\r",
  "แม้นว่า\r",
  "แม้ว่า\r",
  "แยะ\r",
  "แล้ว\r",
  "แล้วเสร็จ\r",
  "แล้วแต่\r",
  "แล้วกัน\r",
  "แสดง\r",
  "แสดงว่า\r",
  "แห่ง\r",
  "แห่งโน้น\r",
  "แห่งใด\r",
  "แห่งไหน\r",
  "แห่งนั้น\r",
  "แห่งนี้\r",
  "แหละ\r",
  "โดย\r",
  "โดยเฉพาะ\r",
  "โดยเฉพาะอย่าง\r",
  "โดยเมื่อ\r",
  "โดยเร็ว\r",
  "โดยแท้\r",
  "โดยแท้จริง\r",
  "โดยง่าย\r",
  "โดยดี\r",
  "โดยดุษฎี\r",
  "โดยตลอด\r",
  "โดยทั่ว\r",
  "โดยทั่วไป\r",
  "โดยทั่วกัน\r",
  "โดยทั่วถึง\r",
  "โดยที่\r",
  "โดยนัย\r",
  "โดยปกติ\r",
  "โดยมัก\r",
  "โดยมักจะ\r",
  "โดยมาก\r",
  "โดยรวม\r",
  "โดยรวมๆ\r",
  "โดยละม่อม\r",
  "โดยลําดับ\r",
  "โดยส่วนใหญ่\r",
  "โดยส่วนมาก\r",
  "โดยส่วนรวม\r",
  "โต\r",
  "โตๆ\r",
  "ใกล้\r",
  "ใกล้ๆ\r",
  "ใคร\r",
  "ใคร่\r",
  "ใคร่จะ\r",
  "ใช่\r",
  "ใช้\r",
  "ใช่ไหม\r",
  "ใด\r",
  "ใดๆ\r",
  "ใต้\r",
  "ใน\r",
  "ในเมื่อ\r",
  "ในช่วง\r",
  "ในที่\r",
  "ในระหว่าง\r",
  "ให้\r",
  "ให้แก่\r",
  "ใหญ่\r",
  "ใหญ่โต\r",
  "ไกล\r",
  "ไกลๆ\r",
  "ไง\r",
  "ไฉน\r",
  "ได้\r",
  "ได้แก่\r",
  "ได้แต่\r",
  "ได้ที่\r",
  "ได้มา\r",
  "ได้รับ\r",
  "ไป\r",
  "ไม่\r",
  "ไม่เป็นไร\r",
  "ไม่ใช่\r",
  "ไม่ค่อย\r",
  "ไม่ค่อยเป็น\r",
  "ไม่ค่อยจะ\r",
  "ไม่ว่า\r",
  "ไร\r",
  "ไหน\r",
  "ไหนๆ\r",
  "ก็\r",
  "ก็แค่\r",
  "ก็แล้วแต่\r",
  "ก็ได้\r",
  "ก็คือ\r",
  "ก็จะ\r",
  "ก็ดี\r",
  "ก็ต่อเมื่อ\r",
  "ก็ตาม\r",
  "ก็ตามแต่\r",
  "ก็ตามที\r",
  "กระทั่ง\r",
  "กระทํา\r",
  "กระนั้น\r",
  "กระผม\r",
  "กลับ\r",
  "กล่าว\r",
  "กล่าวคือ\r",
  "กลุ่ม\r",
  "กลุ่มก้อน\r",
  "กลุ่มๆ\r",
  "กว่า\r",
  "กว้าง\r",
  "กว้างขวาง\r",
  "กว้างๆ\r",
  "ก่อน\r",
  "ก่อนหน้า\r",
  "ก่อนหน้านี้\r",
  "ก่อนๆ\r",
  "กัน\r",
  "กันเถอะ\r",
  "กันเอง\r",
  "กันและกัน\r",
  "กันไหม\r",
  "กันดีไหม\r",
  "กันดีกว่า\r",
  "กันนะ\r",
  "กับ\r",
  "การ\r",
  "กําลัง\r",
  "กําลังจะ\r",
  "กําหนด\r",
  "กู\r",
  "ขณะ\r",
  "ขณะเดียวกัน\r",
  "ขณะใด\r",
  "ขณะใดๆ\r",
  "ขณะที่\r",
  "ขณะนั้น\r",
  "ขณะนี้\r",
  "ขณะหนึ่ง\r",
  "ขวาง\r",
  "ขวางๆ\r",
  "ขอ\r",
  "ของ\r",
  "ขั้น\r",
  "ข้า\r",
  "ข้าง\r",
  "ข้างเคียง\r",
  "ข้างต้น\r",
  "ข้างบน\r",
  "ข้างล่าง\r",
  "ข้างๆ\r",
  "ขาด\r",
  "ข้าพเจ้า\r",
  "ข้าฯ\r",
  "ขึ้น\r",
  "คง\r",
  "คงจะ\r",
  "คงอยู่\r",
  "ครบ\r",
  "ครบครัน\r",
  "ครบถ้วน\r",
  "ครั้ง\r",
  "ครั้งใด\r",
  "ครั้งไหน\r",
  "ครั้งกระนั้น\r",
  "ครั้งก่อน\r",
  "ครั้งครา\r",
  "ครั้งคราว\r",
  "ครั้งที่\r",
  "ครั้งนั้น\r",
  "ครั้งนี้\r",
  "ครั้งละ\r",
  "ครั้งหนึ่ง\r",
  "ครั้งหลัง\r",
  "ครั้งหลังสุด\r",
  "ครั้งๆ\r",
  "ครัน\r",
  "ครับ\r",
  "ครา\r",
  "คราใด\r",
  "คราไหน\r",
  "คราที่\r",
  "ครานั้น\r",
  "ครานี้\r",
  "คราว\r",
  "คราวโน้น\r",
  "คราวใด\r",
  "คราวไหน\r",
  "คราวก่อน\r",
  "คราวที่\r",
  "คราวนั้น\r",
  "คราวนี้\r",
  "คราวละ\r",
  "คราวหน้า\r",
  "คราวหนึ่ง\r",
  "คราวหลัง\r",
  "คราวๆ\r",
  "คราหนึ่ง\r",
  "คล้าย\r",
  "คล้ายกัน\r",
  "คล้ายกันกับ\r",
  "คล้ายกับ\r",
  "คล้ายกับว่า\r",
  "คล้ายว่า\r",
  "ควร\r",
  "ความ\r",
  "ค่อน\r",
  "ค่อนข้าง\r",
  "ค่อนข้างจะ\r",
  "ค่อนมาทาง\r",
  "ค่อย\r",
  "ค่อยไปทาง\r",
  "ค่อยๆ\r",
  "คะ\r",
  "ค่ะ\r",
  "คํา\r",
  "คิด\r",
  "คิดว่า\r",
  "คือ\r",
  "คุณ\r",
  "คุณๆ\r",
  "ง่าย\r",
  "ง่ายๆ\r",
  "จง\r",
  "จด\r",
  "จนเมื่อ\r",
  "จนแม้\r",
  "จนแม้น\r",
  "จนกระทั่ง\r",
  "จนกว่า\r",
  "จนขณะนี้\r",
  "จนตลอด\r",
  "จนถึง\r",
  "จนทั่ว\r",
  "จนบัดนี้\r",
  "จรด\r",
  "จรดกับ\r",
  "จริง\r",
  "จริงจัง\r",
  "จริงๆ\r",
  "จริงๆ\r",
  "จวน\r",
  "จวนเจียน\r",
  "จวนจะ\r",
  "จวบ\r",
  "จวบกับ\r",
  "จวบจน\r",
  "จะ\r",
  "จ้ะ\r",
  "จ๊ะ\r",
  "จะได้\r",
  "จัง\r",
  "จังๆ\r",
  "จังๆ\r",
  "จัด\r",
  "จัดแจง\r",
  "จัดให้\r",
  "จัดการ\r",
  "จัดงาน\r",
  "จัดตั้ง\r",
  "จัดทํา\r",
  "จัดหา\r",
  "จับ\r",
  "จ้า\r",
  "จ้า\r",
  "จํา\r",
  "จําเป็น\r",
  "จาก\r",
  "จากนั้น\r",
  "จากนี้\r",
  "จากนี้ไป\r",
  "จําพวก\r",
  "จึง\r",
  "จึงเป็น\r",
  "จึงจะ\r",
  "จู่ๆ\r",
  "ฉะนั้น\r",
  "ฉะนี้\r",
  "ฉัน\r",
  "ช่วง\r",
  "ช่วงแรก\r",
  "ช่วงก่อน\r",
  "ช่วงต่อไป\r",
  "ช่วงถัดไป\r",
  "ช่วงท้าย\r",
  "ช่วงที่\r",
  "ช่วงนั้น\r",
  "ช่วงนี้\r",
  "ช่วงระหว่าง\r",
  "ช่วงหน้า\r",
  "ช่วงหลัง\r",
  "ช่วงๆ\r",
  "ช่วย\r",
  "ช้า\r",
  "ช้านาน\r",
  "ชาว\r",
  "ช้าๆ\r",
  "ซะ\r",
  "ซะก่อน\r",
  "ซะจน\r",
  "ซะจนกระทั่ง\r",
  "ซะจนถึง\r",
  "ซึ่ง\r",
  "ซึ่งได้แก่\r",
  "ซึ่งก็\r",
  "ซึ่งก็คือ\r",
  "ซึ่งกัน\r",
  "ซึ่งกันและกัน\r",
  "ซึ่งๆ\r",
  "ณ\r",
  "ด้วย\r",
  "ด้วยเช่นกัน\r",
  "ด้วยเพราะ\r",
  "ด้วยเหตุเพราะ\r",
  "ด้วยเหตุที่\r",
  "ด้วยเหตุนั้น\r",
  "ด้วยเหตุนี้\r",
  "ด้วยเหตุว่า\r",
  "ด้วยเหมือนกัน\r",
  "ด้วยกัน\r",
  "ด้วยที่\r",
  "ด้วยประการฉะนี้\r",
  "ด้วยว่า\r",
  "ดัง\r",
  "ดั่ง\r",
  "ดังเก่า\r",
  "ดั่งเก่า\r",
  "ดังเคย\r",
  "ดั่งเคย\r",
  "ดังเช่น\r",
  "ดั่งเช่น\r",
  "ดังเช่นที่\r",
  "ดั่งเช่นที่\r",
  "ดังเดิม\r",
  "ดั่งเดิม\r",
  "ดังเหมือน\r",
  "ดั่งเหมือน\r",
  "ดังแต่ก่อน\r",
  "ดั่งแต่ก่อน\r",
  "ดังแม้\r",
  "ดั่งแม้\r",
  "ดังกล่าว\r",
  "ดังกับ\r",
  "ดั่งกับ\r",
  "ดังกับว่า\r",
  "ดั่งกับว่า\r",
  "ดังจะ\r",
  "ดั่งจะ\r",
  "ดังต่อไปนี้\r",
  "ดังที่\r",
  "ดั่งที่\r",
  "ดังที่เคย\r",
  "ดังที่กล่าว\r",
  "ดังที่จะเป็น\r",
  "ดังนั้น\r",
  "ดังนี้\r",
  "ดังนี้เช่น\r",
  "ดังนี้เพราะ\r",
  "ดังว่า\r",
  "ดั่งว่า\r",
  "ดําเนิน\r",
  "ดําเนินไป\r",
  "ดําเนินการ\r",
  "ดําเนินงาน\r",
  "ด้าน\r",
  "ด้านๆ\r",
  "ดิฉัน\r",
  "ดี\r",
  "ดีๆ\r",
  "ดู\r",
  "ดูเหมือน\r",
  "ดูเหมือนว่า\r",
  "ดูแล\r",
  "ดูแล้ว\r",
  "ดูจะ\r",
  "ดูว่า\r",
  "ดูๆ\r",
  "ตน\r",
  "ตนเอง\r",
  "ตนฯ\r",
  "ตรง\r",
  "ตรงๆ\r",
  "ตลอด\r",
  "ตลอดเวลา\r",
  "ตลอดไป\r",
  "ตลอดกาล\r",
  "ตลอดกาลนาน\r",
  "ตลอดจน\r",
  "ตลอดถึง\r",
  "ตลอดทั้ง\r",
  "ตลอดทั่ว\r",
  "ตลอดทั่วถึง\r",
  "ตลอดทั่วทั้ง\r",
  "ตลอดปี\r",
  "ตลอดมา\r",
  "ตลอดระยะเวลา\r",
  "ตลอดวัน\r",
  "ตลอดศก\r",
  "ต่อ\r",
  "ต่อเมื่อ\r",
  "ต่อให้\r",
  "ต่อไป\r",
  "ต่อไปนี้\r",
  "ต่อกัน\r",
  "ต่อกับ\r",
  "ต้อง\r",
  "ต้องการ\r",
  "ต่อจาก\r",
  "ตอน\r",
  "ตอนแรก\r",
  "ตอนใด\r",
  "ตอนไหน\r",
  "ตอนก่อน\r",
  "ตอนต่อ\r",
  "ตอนต่อไป\r",
  "ตอนต่อมา\r",
  "ตอนถัดไป\r",
  "ตอนถัดมา\r",
  "ตอนที่\r",
  "ตอนที่แล้ว\r",
  "ตอนนั้น\r",
  "ตอนนี้\r",
  "ตอนสุดท้าย\r",
  "ตอนหน้า\r",
  "ตอนหลัง\r",
  "ตอนๆ\r",
  "ต่อมา\r",
  "ต่อว่า\r",
  "ต่อๆ\r",
  "ตะหาก\r",
  "ตั้ง\r",
  "ตั้งแต่\r",
  "ตั้งแต่แรก\r",
  "ตั้งแต่นั้น\r",
  "ตั้งแต่นี้\r",
  "ตั้งต้น\r",
  "ตั้งที่\r",
  "ตั้งอยู่\r",
  "ตัว\r",
  "ตัวเอง\r",
  "ตัวโน้น\r",
  "ตัวใด\r",
  "ตัวไหน\r",
  "ตัวที่\r",
  "ตัวนั้น\r",
  "ตัวนี้\r",
  "ตัวละ\r",
  "ตัวอย่างเช่น\r",
  "ตัวๆ\r",
  "ต่าง\r",
  "ต่างก็\r",
  "ต่างหาก\r",
  "ต่างๆ\r",
  "ตาม\r",
  "ตามแต่\r",
  "ตามด้วย\r",
  "ตามที่\r",
  "ตามๆ\r",
  "ถ้า\r",
  "ถ้าจะ\r",
  "ถ้าหาก\r",
  "ถึง\r",
  "ถึงเมื่อ\r",
  "ถึงเมื่อใด\r",
  "ถึงเมื่อไร\r",
  "ถึงแก่\r",
  "ถึงแม้\r",
  "ถึงแม้จะ\r",
  "ถึงแม้ว่า\r",
  "ถึงจะ\r",
  "ถึงบัดนั้น\r",
  "ถึงบัดนี้\r",
  "ถึงอย่างไร\r",
  "ถือ\r",
  "ถือว่า\r",
  "ถูก\r",
  "ถูกต้อง\r",
  "ถูกๆ\r",
  "ทรง\r",
  "ทว่า\r",
  "ทั้ง\r",
  "ทั้งเป็น\r",
  "ทั้งคน\r",
  "ทั้งตัว\r",
  "ทั้งที่\r",
  "ทั้งนั้น\r",
  "ทั้งนั้นเพราะ\r",
  "ทั้งนั้นด้วย\r",
  "ทั้งนี้\r",
  "ทั้งปวง\r",
  "ทั้งมวล\r",
  "ทั้งสิ้น\r",
  "ทั้งหมด\r",
  "ทั้งหลาย\r",
  "ทั้งๆ\r",
  "ทั้งๆ\r",
  "ทัน\r",
  "ทันใดนั้น\r",
  "ทันที\r",
  "ทันทีทันใด\r",
  "ทั่ว\r",
  "ทําให้\r",
  "ทําไม\r",
  "ทําไร\r",
  "ทําๆ\r",
  "ที\r",
  "ที่\r",
  "ที่\r",
  "ทีเดียว\r",
  "ทีเถอะ\r",
  "ที่แท้\r",
  "ที่แท้จริง\r",
  "ที่แล้ว\r",
  "ที่แห่งนั้น\r",
  "ทีใด\r",
  "ที่ใด\r",
  "ที่ได้\r",
  "ทีไร\r",
  "ที่ไหน\r",
  "ที่จริง\r",
  "ที่ซึ่ง\r",
  "ที่นั้น\r",
  "ที่นี้\r",
  "ทีละ\r",
  "ที่ละ\r",
  "ที่ว่า\r",
  "ที่สุด\r",
  "ทีๆ\r",
  "ที่ๆ\r",
  "ทุก\r",
  "ทุกเมื่อ\r",
  "ทุกแห่ง\r",
  "ทุกคน\r",
  "ทุกครั้ง\r",
  "ทุกครา\r",
  "ทุกคราว\r",
  "ทุกชิ้น\r",
  "ทุกตัว\r",
  "ทุกทาง\r",
  "ทุกที\r",
  "ทุกที่\r",
  "ทุกวัน\r",
  "ทุกวันนี้\r",
  "ทุกสิ่ง\r",
  "ทุกหน\r",
  "ทุกอย่าง\r",
  "ทุกอัน\r",
  "ทุกๆ\r",
  "นอก\r",
  "นอกเหนือ\r",
  "นอกจาก\r",
  "นอกจากที่\r",
  "นอกจากนั้น\r",
  "นอกจากนี้\r",
  "นอกจากว่า\r",
  "นอกนั้น\r",
  "น้อย\r",
  "น้อยกว่า\r",
  "น้อยๆ\r",
  "นะ\r",
  "น่ะ\r",
  "นัก\r",
  "นั่น\r",
  "นั้นไว\r",
  "นับแต่นี้\r",
  "นับจากนั้น\r",
  "นับจากนี้\r",
  "น่า\r",
  "นํา\r",
  "นาง\r",
  "นางสาว\r",
  "น่าจะ\r",
  "นาน\r",
  "นานๆ\r",
  "นําพา\r",
  "นํามา\r",
  "นาย\r",
  "นิด\r",
  "นิดหน่อย\r",
  "นิดๆ\r",
  "นี่\r",
  "นี้\r",
  "นี่เอง\r",
  "นี้เอง\r",
  "นี่แน่ะ\r",
  "นี้แหล่\r",
  "นี่แหละ\r",
  "นี่ไง\r",
  "นี่นา\r",
  "นู่น\r",
  "นู้น\r",
  "บน\r",
  "บอก\r",
  "บอกแล้ว\r",
  "บอกว่า\r",
  "บ่อย\r",
  "บ่อยกว่า\r",
  "บ่อยครั้ง\r",
  "บ่อยๆ\r",
  "บัดเดี๋ยวนี้\r",
  "บัดดล\r",
  "บัดนั้น\r",
  "บัดนี้\r",
  "บาง\r",
  "บ้าง\r",
  "บางแห่ง\r",
  "บางกว่า\r",
  "บางขณะ\r",
  "บางครั้ง\r",
  "บางครา\r",
  "บางคราว\r",
  "บางที\r",
  "บางที่\r",
  "บางๆ\r",
  "ปฏิบัติ\r",
  "ประกอบ\r",
  "ประการ\r",
  "ประการใด\r",
  "ประการฉะนี้\r",
  "ประการหนึ่ง\r",
  "ประมาณ\r",
  "ประสบ\r",
  "ปรับ\r",
  "ปรากฏ\r",
  "ปรากฏว่า\r",
  "ปัจจุบัน\r",
  "ปิด\r",
  "ผ่าน\r",
  "ผ่านๆ\r",
  "ผิด\r",
  "ผิดๆ\r",
  "ผู้\r",
  "ผู้ใด\r",
  "ฝ่าย\r",
  "ฝ่ายใด\r",
  "พบ\r",
  "พบว่า\r",
  "พยายาม\r",
  "พร้อม\r",
  "พร้อมเพียง\r",
  "พร้อมกัน\r",
  "พร้อมกับ\r",
  "พร้อมด้วย\r",
  "พร้อมทั้ง\r",
  "พร้อมที่\r",
  "พวก\r",
  "พวกเขา\r",
  "พวกเธอ\r",
  "พวกแก\r",
  "พวกโน้น\r",
  "พวกกัน\r",
  "พวกกู\r",
  "พวกคุณ\r",
  "พวกฉัน\r",
  "พวกท่าน\r",
  "พวกที่\r",
  "พวกนั้น\r",
  "พวกนี้\r",
  "พวกนู้น\r",
  "พวกมัน\r",
  "พวกมึง\r",
  "พอ\r",
  "พอเพียง\r",
  "พอเหมาะ\r",
  "พอแล้ว\r",
  "พอกัน\r",
  "พอควร\r",
  "พอจะ\r",
  "พอดี\r",
  "พอตัว\r",
  "พอที\r",
  "พอที่\r",
  "พอสม\r",
  "พอสมควร\r",
  "พอๆ\r",
  "พา\r",
  "พึง\r",
  "พึ่ง\r",
  "พื้นๆ\r",
  "พูด\r",
  "ภาค\r",
  "ภาย\r",
  "ภายใต้\r",
  "ภายนอก\r",
  "ภายหลัง\r",
  "มอง\r",
  "มองว่า\r",
  "มัก\r",
  "มักจะ\r",
  "มัน\r",
  "มั๊ย\r",
  "มา\r",
  "มาก\r",
  "มากกว่า\r",
  "มากมาย\r",
  "มิ\r",
  "มิใช่\r",
  "มิได้\r",
  "มิฉะนั้น\r",
  "มี\r",
  "มีแต่\r",
  "มึง\r",
  "มุ่ง\r",
  "มุ่งเน้น\r",
  "มุ่งหมาย\r",
  "ยก\r",
  "ยกให้\r",
  "ยงเพราะ\r",
  "ยอม\r",
  "ย่อม\r",
  "ยอมรับ\r",
  "ย่อย\r",
  "ยัง\r",
  "ยังแต่\r",
  "ยังโง้น\r",
  "ยังไง\r",
  "ยังคง\r",
  "ยังงั้น\r",
  "ยังงี้\r",
  "ยังจะ\r",
  "ยาก\r",
  "ยาว\r",
  "ยาวนาน\r",
  "ยิ่ง\r",
  "ยิ่งเมื่อ\r",
  "ยิ่งแล้ว\r",
  "ยิ่งใหญ่\r",
  "ยิ่งกว่า\r",
  "ยิ่งขึ้น\r",
  "ยิ่งขึ้นไป\r",
  "ยิ่งจน\r",
  "ยิ่งจะ\r",
  "ยิ่งนัก\r",
  "รวด\r",
  "รวดเร็ว\r",
  "รวม\r",
  "ร่วม\r",
  "รวมกัน\r",
  "ร่วมกัน\r",
  "รวมด้วย\r",
  "ร่วมด้วย\r",
  "รวมถึง\r",
  "รวมทั้ง\r",
  "ระยะ\r",
  "ระหว่าง\r",
  "รับ\r",
  "รึ\r",
  "รือ\r",
  "รือว่า\r",
  "ล้วน\r",
  "ล้วนแต่\r",
  "ล้วนจน\r",
  "ละ\r",
  "ล่าสุด\r",
  "วันใด\r",
  "วันไหน\r",
  "วันนั้น\r",
  "วันนี้\r",
  "สบาย\r",
  "สมัย\r",
  "สมัยโน้น\r",
  "สมัยก่อน\r",
  "สมัยนั้น\r",
  "สมัยนี้\r",
  "ส่วน\r",
  "ส่วนเกิน\r",
  "ส่วนใด\r",
  "ส่วนใหญ่\r",
  "ส่วนด้อย\r",
  "ส่วนดี\r",
  "ส่วนที่\r",
  "ส่วนน้อย\r",
  "ส่วนนั้น\r",
  "ส่วนมาก\r",
  "สั้น\r",
  "สั้นๆ\r",
  "สําคัญ\r",
  "สามารถ\r",
  "สิ่ง\r",
  "สิ่งใด\r",
  "สิ่งไหน\r",
  "สิ่งนั้น\r",
  "สิ่งนี้\r",
  "สิ้น\r",
  "สุด\r",
  "หน\r",
  "หนอ\r",
  "หนอย\r",
  "หน่อย\r",
  "หมด\r",
  "หมดกัน\r",
  "หมดสิ้น\r",
  "หรือเปล่า\r",
  "หรือไง\r",
  "หรือไม่\r",
  "หรือไร\r",
  "หรือยัง\r",
  "หลังจาก\r",
  "หาใช่\r",
  "หาก\r",
  "หากแม้\r",
  "หากแม้น\r",
  "หากแม้นว่า\r",
  "หากว่า\r",
  "หาความ\r",
  "หารือ\r",
  "อดีต\r",
  "อนึ่ง\r",
  "อยาก\r",
  "อย่าง\r",
  "อย่างเช่น\r",
  "อย่างเดียว\r",
  "อย่างโน้น\r",
  "อย่างใด\r",
  "อย่างไร\r",
  "อย่างไรเสีย\r",
  "อย่างไรก็\r",
  "อย่างไรก็ได้\r",
  "อย่างไหน\r",
  "อย่างดี\r",
  "อย่างที่\r",
  "อย่างน้อย\r",
  "อย่างนั้น\r",
  "อย่างนี้\r",
  "อย่างมาก\r",
  "อย่างยิ่ง\r",
  "อย่างละ\r",
  "อย่างหนึ่ง\r",
  "อย่างๆ\r",
  "อัน\r",
  "อันเนื่องมาจาก\r",
  "อันใด\r",
  "อันได้แก่\r",
  "อันไหน\r",
  "อันจะ\r",
  "อันที่\r",
  "อันที่จริง\r",
  "อันที่จะ\r",
  "อันละ\r",
  "อันๆ\r",
  "อาจ\r",
  "อาจเป็น\r",
  "อาจเป็นด้วย\r",
  "อาจจะ\r",
  "อีก\r",
  "อื่น\r",
  "อื่นๆ\r",
  "ฯ\r",
  "ฯพณฯ\r",
  "ฯล\r",
  ""
]

},{}],96:[function(require,module,exports){
module.exports=[
  "a",
  "acaba",
  "altı",
  "ama",
  "ancak",
  "artık",
  "asla",
  "aslında",
  "az",
  "b",
  "bana",
  "bazen",
  "bazı",
  "bazıları",
  "bazısı",
  "belki",
  "ben",
  "beni",
  "benim",
  "beş",
  "bile",
  "bir",
  "birçoğu",
  "birçok",
  "birçokları",
  "biri",
  "birisi",
  "birkaç",
  "birkaçı",
  "birşey",
  "birşeyi",
  "biz",
  "bize",
  "bizi",
  "bizim",
  "böyle",
  "böylece",
  "bu",
  "buna",
  "bunda",
  "bundan",
  "bunu",
  "bunun",
  "burada",
  "bütün",
  "c",
  "ç",
  "çoğu",
  "çoğuna",
  "çoğunu",
  "çok",
  "çünkü",
  "d",
  "da",
  "daha",
  "de",
  "değil",
  "demek",
  "diğer",
  "diğeri",
  "diğerleri",
  "diye",
  "dokuz",
  "dolayı",
  "dört",
  "e",
  "elbette",
  "en",
  "f",
  "fakat",
  "falan",
  "felan",
  "filan",
  "g",
  "gene",
  "gibi",
  "ğ",
  "h",
  "hâlâ",
  "hangi",
  "hangisi",
  "hani",
  "hatta",
  "hem",
  "henüz",
  "hep",
  "hepsi",
  "hepsine",
  "hepsini",
  "her",
  "her biri",
  "herkes",
  "herkese",
  "herkesi",
  "hiç",
  "hiç kimse",
  "hiçbiri",
  "hiçbirine",
  "hiçbirini",
  "ı",
  "i",
  "için",
  "içinde",
  "iki",
  "ile",
  "ise",
  "işte",
  "j",
  "k",
  "kaç",
  "kadar",
  "kendi",
  "kendine",
  "kendini",
  "ki",
  "kim",
  "kime",
  "kimi",
  "kimin",
  "kimisi",
  "l",
  "m",
  "madem",
  "mı",
  "mı",
  "mi",
  "mu",
  "mu",
  "mü",
  "mü",
  "n",
  "nasıl",
  "ne",
  "ne kadar",
  "ne zaman",
  "neden",
  "nedir",
  "nerde",
  "nerede",
  "nereden",
  "nereye",
  "nesi",
  "neyse",
  "niçin",
  "niye",
  "o",
  "on",
  "ona",
  "ondan",
  "onlar",
  "onlara",
  "onlardan",
  "onların",
  "onların",
  "onu",
  "onun",
  "orada",
  "oysa",
  "oysaki",
  "ö",
  "öbürü",
  "ön",
  "önce",
  "ötürü",
  "öyle",
  "p",
  "r",
  "rağmen",
  "s",
  "sana",
  "sekiz",
  "sen",
  "senden",
  "seni",
  "senin",
  "siz",
  "sizden",
  "size",
  "sizi",
  "sizin",
  "son",
  "sonra",
  "ş",
  "şayet",
  "şey",
  "şeyden",
  "şeye",
  "şeyi",
  "şeyler",
  "şimdi",
  "şöyle",
  "şu",
  "şuna",
  "şunda",
  "şundan",
  "şunlar",
  "şunu",
  "şunun",
  "t",
  "tabi",
  "tamam",
  "tüm",
  "tümü",
  "u",
  "ü",
  "üç",
  "üzere",
  "v",
  "var",
  "ve",
  "veya",
  "veyahut",
  "y",
  "ya",
  "ya da",
  "yani",
  "yedi",
  "yerine",
  "yine",
  "yoksa",
  "z",
  "zaten",
  "zira"
]

},{}],97:[function(require,module,exports){
module.exports=[
  "的\r",
  "一\r",
  "不\r",
  "在\r",
  "人\r",
  "有\r",
  "是\r",
  "为\r",
  "以\r",
  "于\r",
  "上\r",
  "他\r",
  "而\r",
  "后\r",
  "之\r",
  "来\r",
  "及\r",
  "了\r",
  "因\r",
  "下\r",
  "可\r",
  "到\r",
  "由\r",
  "这\r",
  "与\r",
  "也\r",
  "此\r",
  "但\r",
  "并\r",
  "个\r",
  "其\r",
  "已\r",
  "无\r",
  "小\r",
  "我\r",
  "们\r",
  "起\r",
  "最\r",
  "再\r",
  "今\r",
  "去\r",
  "好\r",
  "只\r",
  "又\r",
  "或\r",
  "很\r",
  "亦\r",
  "某\r",
  "把\r",
  "那\r",
  "你\r",
  "乃\r",
  "它\r",
  "吧\r",
  "被\r",
  "比\r",
  "别\r",
  "趁\r",
  "当\r",
  "从\r",
  "到\r",
  "得\r",
  "打\r",
  "凡\r",
  "儿\r",
  "尔\r",
  "该\r",
  "各\r",
  "给\r",
  "跟\r",
  "和\r",
  "何\r",
  "还\r",
  "即\r",
  "几\r",
  "既\r",
  "看\r",
  "据\r",
  "距\r",
  "靠\r",
  "啦\r",
  "了\r",
  "另\r",
  "么\r",
  "每\r",
  "们\r",
  "嘛\r",
  "拿\r",
  "哪\r",
  "那\r",
  "您\r",
  "凭\r",
  "且\r",
  "却\r",
  "让\r",
  "仍\r",
  "啥\r",
  "如\r",
  "若\r",
  "使\r",
  "谁\r",
  "虽\r",
  "随\r",
  "同\r",
  "所\r",
  "她\r",
  "哇\r",
  "嗡\r",
  "往\r",
  "哪\r",
  "些\r",
  "向\r",
  "沿\r",
  "哟\r",
  "用\r",
  "于\r",
  "咱\r",
  "则\r",
  "怎\r",
  "曾\r",
  "至\r",
  "致\r",
  "着\r",
  "诸\r",
  "自"
]

},{}],98:[function(require,module,exports){
// Generated by CoffeeScript 2.0.0-beta7
void function () {
  var _, cleanArticleTags, cleanBadTags, cleanCodeBlocks, cleanEmTags, cleaner, cleanErrantLinebreaks, cleanParaSpans, cleanUnderlines, divToPara, getReplacementNodes, removeBodyClasses, removeDropCaps, removeNodesRegex, removeScriptsStyles, replaceWithPara;
  _ = require('lodash');
  module.exports = cleaner = function (doc) {
    removeBodyClasses(doc);
    cleanArticleTags(doc);
    cleanEmTags(doc);
    cleanCodeBlocks(doc);
    removeDropCaps(doc);
    removeScriptsStyles(doc);
    cleanBadTags(doc);
    removeNodesRegex(doc, /^caption$/);
    removeNodesRegex(doc, / google /);
    removeNodesRegex(doc, /^[^entry-]more.*$/);
    removeNodesRegex(doc, /[^-]facebook/);
    removeNodesRegex(doc, /facebook-broadcasting/);
    removeNodesRegex(doc, /[^-]twitter/);
    cleanParaSpans(doc);
    cleanUnderlines(doc);
    cleanErrantLinebreaks(doc);
    divToPara(doc, 'div');
    divToPara(doc, 'span');
    return doc;
  };
  removeBodyClasses = function (doc) {
    return doc('body').removeClass();
  };
  cleanArticleTags = function (doc) {
    var articles;
    articles = doc('article');
    return articles.each(function () {
      doc(this).removeAttr('id');
      doc(this).removeAttr('name');
      return doc(this).removeAttr('class');
    });
  };
  cleanEmTags = function (doc) {
    var ems;
    ems = doc('em');
    return ems.each(function () {
      var images;
      images = ems.find('img');
      if (images.length === 0)
        return doc(this).replaceWith(doc(this).html());
    });
  };
  cleanCodeBlocks = function (doc) {
    var nodes;
    nodes = doc("[class*='highlight-'], pre code, code, pre, ul.task-list");
    return nodes.each(function () {
      return doc(this).replaceWith(doc(this).text());
    });
  };
  removeDropCaps = function (doc) {
    var nodes;
    nodes = doc('span[class~=dropcap], span[class~=drop_cap]');
    return nodes.each(function () {
      return doc(this).replaceWith(doc(this).html());
    });
  };
  removeScriptsStyles = function (doc) {
    var comments;
    doc('script').remove();
    doc('style').remove();
    comments = doc('*').contents().filter(function () {
      return this.type === 'comment';
    });
    return doc(comments).remove();
  };
  cleanBadTags = function (doc) {
    var re, removeNodesRe, toRemove;
    removeNodesRe = '^side$|combx|retweet|mediaarticlerelated|menucontainer|navbar|partner-gravity-ad|video-full-transcript|storytopbar-bucket|utility-bar|inline-share-tools|comment|PopularQuestions|contact|foot|footer|Footer|footnote|cnn_strycaptiontxt|cnn_html_slideshow|cnn_strylftcntnt|links|meta$|shoutbox|sponsor|tags|socialnetworking|socialNetworking|cnnStryHghLght|cnn_stryspcvbx|^inset$|pagetools|post-attributes|welcome_form|contentTools2|the_answers|communitypromo|runaroundLeft|subscribe|vcard|articleheadings|date|^print$|popup|author-dropdown|tools|socialtools|byline|konafilter|KonaFilter|breadcrumbs|^fn$|wp-caption-text|legende|ajoutVideo|timestamp|js_replies';
    re = new RegExp(removeNodesRe, 'i');
    toRemove = doc('*').filter(function () {
      var cache$, cache$1, cache$2;
      return (null != (cache$ = doc(this).attr('id')) ? cache$.match(re) : void 0) || (null != (cache$1 = doc(this).attr('class')) ? cache$1.match(re) : void 0) || (null != (cache$2 = doc(this).attr('name')) ? cache$2.match(re) : void 0);
    });
    return doc(toRemove).remove();
  };
  removeNodesRegex = function (doc, pattern) {
    var toRemove;
    toRemove = doc('div').filter(function () {
      var cache$, cache$1;
      return (null != (cache$ = doc(this).attr('id')) ? cache$.match(pattern) : void 0) || (null != (cache$1 = doc(this).attr('class')) ? cache$1.match(pattern) : void 0);
    });
    return doc(toRemove).remove();
  };
  cleanParaSpans = function (doc) {
    var nodes;
    nodes = doc('p span');
    return nodes.each(function () {
      return doc(this).replaceWith(doc(this).html());
    });
  };
  cleanUnderlines = function (doc) {
    var nodes;
    nodes = doc('u');
    return nodes.each(function () {
      return doc(this).replaceWith(doc(this).html());
    });
  };
  getReplacementNodes = function (doc, div) {
    var childs, nodesToRemove, nodesToReturn, replacementText, txt;
    replacementText = [];
    nodesToReturn = [];
    nodesToRemove = [];
    childs = div.contents();
    childs.each(function () {
      var kid, kidText, kidTextNode, nextSiblingNode, outer, previousSiblingNode, replaceText, txt;
      kid = doc(this);
      if (kid[0].name === 'p' && replacementText.length > 0) {
        txt = replacementText.join('');
        nodesToReturn.push(txt);
        replacementText = [];
        return nodesToReturn.push(doc(kid).html());
      } else if (kid[0].type === 'text') {
        kidTextNode = kid;
        kidText = kid.text();
        replaceText = kidText.replace(/\n/g, '\n\n').replace(/\t/g, '').replace(/^\s+$/g, '');
        if (replaceText.length > 1) {
          previousSiblingNode = kidTextNode.prev();
          while (previousSiblingNode[0] && previousSiblingNode[0].name === 'a' && previousSiblingNode.attr('grv-usedalready') !== 'yes') {
            outer = ' ' + doc.html(previousSiblingNode) + ' ';
            replacementText.push(outer);
            nodesToRemove.push(previousSiblingNode);
            previousSiblingNode.attr('grv-usedalready', 'yes');
            previousSiblingNode = previousSiblingNode.prev();
          }
          replacementText.push(replaceText);
          nextSiblingNode = kidTextNode.next();
          return function (accum$) {
            while (nextSiblingNode[0] && nextSiblingNode[0].name === 'a' && nextSiblingNode.attr('grv-usedalready') !== 'yes') {
              outer = ' ' + doc.html(nextSiblingNode) + ' ';
              replacementText.push(outer);
              nodesToRemove.push(nextSiblingNode);
              nextSiblingNode.attr('grv-usedalready', 'yes');
              accum$.push(previousSiblingNode = nextSiblingNode.next());
            }
            return accum$;
          }.call(this, []);
        }
      } else {
        return nodesToReturn.push(doc(kid).html());
      }
    });
    if (replacementText.length > 0) {
      txt = replacementText.join('');
      nodesToReturn.push(txt);
      replacementText = [];
    }
    _.each(nodesToRemove, function (n) {
      return doc(n).remove();
    });
    return nodesToReturn;
  };
  replaceWithPara = function (doc, div) {
    var divContent;
    divContent = doc(div).html();
    return doc(div).replaceWith('<p>' + divContent + '</p>');
  };
  divToPara = function (doc, domType) {
    var divs, lastCount, tags;
    divs = doc(domType);
    lastCount = divs.length + 1;
    tags = [
      'a',
      'blockquote',
      'dl',
      'div',
      'img',
      'ol',
      'p',
      'pre',
      'table',
      'ul'
    ];
    return divs.each(function () {
      var div, html, items, replaceNodes;
      div = doc(this);
      items = div.find(tags.join(', '));
      if (items.length === 0) {
        return replaceWithPara(doc, this);
      } else {
        replaceNodes = getReplacementNodes(doc, div);
        html = '';
        _.each(replaceNodes, function (node) {
          if (node !== '')
            return html += '<p>' + node + '</p>';
        });
        div.empty();
        return doc(div).replaceWith('' + html);
      }
    });
  };
  cleanErrantLinebreaks = function (doc) {
    return doc('p').each(function () {
      var c, node;
      node = doc(this);
      c = node.contents();
      return doc(c).each(function () {
        var n;
        n = doc(this);
        if (n[0].type === 'text')
          return n.replaceWith(n.text().replace(/([^\n])\n([^\n])/g, '$1 $2'));
      });
    });
  };
}.call(this);

},{"lodash":66}],99:[function(require,module,exports){
// Generated by CoffeeScript 2.0.0-beta7
void function () {
  var _, addSiblings, biggestTitleChunk, cleanText, cleanTitle, formatter, getObjectTag, getScore, getSiblingsContent, getSiblingsScore, getVideoAttrs, isBoostable, isHighlinkDensity, isNodescoreThresholdMet, isTableAndNoParaExist, postCleanup, rawTitle, stopwords, updateNodeCount, updateScore;
  _ = require('lodash');
  stopwords = require('./stopwords');
  formatter = require('./formatter');
  module.exports = {
    date: function (doc) {
      var cache$, cache$1, cache$2, cache$3, cache$4, dateCandidates;
      dateCandidates = doc("meta[property='article:published_time'],     meta[itemprop*='datePublished'], meta[name='dcterms.modified'],     meta[name='dcterms.date'],     meta[name='DC.date.issued'],  meta[name='dc.date.issued'],     meta[name='dc.date.modified'], meta[name='dc.date.created'],     meta[name='DC.date'],     meta[name='DC.Date'],     meta[name='dc.date'],     meta[name='date'],     time[itemprop*='pubDate'],     time[itemprop*='pubdate'],     span[itemprop*='datePublished'],     span[property*='datePublished'],     p[itemprop*='datePublished'],     p[property*='datePublished'],     div[itemprop*='datePublished'],     div[property*='datePublished'],     li[itemprop*='datePublished'],     li[property*='datePublished'],     time,     span[class*='date'],     p[class*='date'],     div[class*='date']");
      return (null != dateCandidates && null != (cache$ = dateCandidates.first()) && null != (cache$1 = cache$.attr('content')) ? cache$1.trim() : void 0) || (null != dateCandidates && null != (cache$2 = dateCandidates.first()) && null != (cache$3 = cache$2.attr('datetime')) ? cache$3.trim() : void 0) || cleanText(null != dateCandidates && null != (cache$4 = dateCandidates.first()) ? cache$4.text() : void 0) || null;
    },
    copyright: function (doc) {
      var cache$, copyright, copyrightCandidates, text;
      copyrightCandidates = doc("p[class*='copyright'], div[class*='copyright'], span[class*='copyright'], li[class*='copyright'],     p[id*='copyright'], div[id*='copyright'], span[id*='copyright'], li[id*='copyright']");
      text = null != copyrightCandidates && null != (cache$ = copyrightCandidates.first()) ? cache$.text() : void 0;
      if (!text) {
        text = doc('body').text().replace(/\s*[\r\n]+\s*/g, '. ');
        if (!(text.indexOf('\xa9') > 0))
          return null;
      }
      copyright = text.replace(/.*?©(\s*copyright)?([^,;:.|\r\n]+).*/gi, '$2').trim();
      return cleanText(copyright);
    },
    author: function (doc) {
      var authorCandidates, authorList, cache$, cache$1, cache$2, cache$3, cache$4, cache$5, fallbackAuthor;
      authorCandidates = doc("meta[property='article:author'],     meta[property='og:article:author'], meta[name='author'],     meta[name='dcterms.creator'],     meta[name='DC.creator'],     meta[name='DC.Creator'],     meta[name='dc.creator'],     meta[name='creator']");
      authorList = [];
      authorCandidates.each(function () {
        var author, cache$, cache$1;
        author = null != (cache$ = doc(this)) && null != (cache$1 = cache$.attr('content')) ? cache$1.trim() : void 0;
        if (author)
          return authorList.push(author);
      });
      if (authorList.length === 0) {
        fallbackAuthor = (null != (cache$ = doc("span[class*='author']").first()) ? cache$.text() : void 0) || (null != (cache$1 = doc("p[class*='author']").first()) ? cache$1.text() : void 0) || (null != (cache$2 = doc("div[class*='author']").first()) ? cache$2.text() : void 0) || (null != (cache$3 = doc("span[class*='byline']").first()) ? cache$3.text() : void 0) || (null != (cache$4 = doc("p[class*='byline']").first()) ? cache$4.text() : void 0) || (null != (cache$5 = doc("div[class*='byline']").first()) ? cache$5.text() : void 0);
        if (fallbackAuthor)
          authorList.push(cleanText(fallbackAuthor));
      }
      return authorList;
    },
    publisher: function (doc) {
      var cache$, cache$1, publisherCandidates;
      publisherCandidates = doc("meta[property='og:site_name'],     meta[name='dc.publisher'],     meta[name='DC.publisher'],     meta[name='DC.Publisher']");
      if (null != publisherCandidates && null != (cache$ = publisherCandidates.first()) && null != (cache$1 = cache$.attr('content')))
        return cache$1.trim();
    },
    title: function (doc) {
      var titleText;
      titleText = rawTitle(doc);
      return cleanTitle(titleText, [
        '|',
        ' - ',
        '\xbb',
        ':'
      ]);
    },
    softTitle: function (doc) {
      var titleText;
      titleText = rawTitle(doc);
      return cleanTitle(titleText, [
        '|',
        ' - ',
        '\xbb'
      ]);
    },
    text: function (doc, topNode, lang) {
      if (topNode) {
        topNode = postCleanup(doc, topNode, lang);
        return formatter(doc, topNode, lang);
      } else {
        return '';
      }
    },
    image: function (doc) {
      var images;
      images = doc("meta[property='og:image'], meta[itemprop=image], meta[name='twitter:image:src'], meta[name='twitter:image'], meta[name='twitter:image0']");
      if (images.length > 0 && images.first().attr('content'))
        return images.first().attr('content');
      return null;
    },
    links: function (doc, topNode, lang) {
      var gatherLinks, links;
      links = [];
      gatherLinks = function (doc, topNode) {
        var nodes;
        nodes = topNode.find('a');
        return nodes.each(function () {
          var href, text;
          href = doc(this).attr('href');
          text = doc(this).html();
          if (href && text)
            return links.push({
              text: text,
              href: href
            });
        });
      };
      if (topNode) {
        topNode = postCleanup(doc, topNode, lang);
        gatherLinks(doc, topNode);
      }
      return links;
    },
    videos: function (doc, topNode) {
      var candidates, results, urls, videoList;
      videoList = [];
      candidates = doc(topNode).find('iframe, embed, object, video');
      candidates.each(function () {
        var candidate, tag;
        candidate = doc(this);
        tag = candidate[0].name;
        if (tag === 'embed') {
          if (candidate.parent() && candidate.parent()[0].name === 'object') {
            return videoList.push(getObjectTag(doc, candidate));
          } else {
            return videoList.push(getVideoAttrs(doc, candidate));
          }
        } else if (tag === 'object') {
          return videoList.push(getObjectTag(doc, candidate));
        } else if (tag === 'iframe' || tag === 'video') {
          return videoList.push(getVideoAttrs(doc, candidate));
        }
      });
      urls = [];
      results = [];
      _.each(videoList, function (vid) {
        if (vid && vid.height && vid.width && urls.indexOf(vid.src) === -1) {
          results.push(vid);
          return urls.push(vid.src);
        }
      });
      return results;
    },
    favicon: function (doc) {
      var tag;
      tag = doc('link').filter(function () {
        var cache$;
        return (null != (cache$ = doc(this).attr('rel')) ? cache$.toLowerCase() : void 0) === 'shortcut icon';
      });
      return tag.attr('href');
    },
    lang: function (doc) {
      var cache$, l, tag, value;
      l = null != (cache$ = doc('html')) ? cache$.attr('lang') : void 0;
      if (!l) {
        tag = doc('meta[name=lang]') || doc('meta[http-equiv=content-language]');
        l = null != tag ? tag.attr('content') : void 0;
      }
      if (l) {
        value = l.slice(0, +1 + 1 || 9e9);
        if (/^[A-Za-z]{2}$/.test(value))
          return value.toLowerCase();
      }
      return null;
    },
    description: function (doc) {
      var cache$, cache$1, tag;
      tag = doc("meta[name=description], meta[property='og:description']");
      if (null != tag && null != (cache$ = tag.first()) && null != (cache$1 = cache$.attr('content')))
        return cache$1.trim();
    },
    keywords: function (doc) {
      var tag;
      tag = doc('meta[name=keywords]');
      if (null != tag)
        return tag.attr('content');
    },
    canonicalLink: function (doc) {
      var tag;
      tag = doc('link[rel=canonical]');
      if (null != tag)
        return tag.attr('href');
    },
    tags: function (doc) {
      var elements, tags;
      elements = doc("a[rel='tag']");
      if (elements.length === 0) {
        elements = doc("a[href*='/tag/'], a[href*='/tags/'], a[href*='/topic/'], a[href*='?keyword=']");
        if (elements.length === 0)
          return [];
      }
      tags = [];
      elements.each(function () {
        var el, tag;
        el = doc(this);
        tag = el.text().trim();
        tag.replace(/[\s\t\n]+/g, '');
        if (tag && tag.length > 0)
          return tags.push(tag);
      });
      return _.uniq(tags);
    },
    calculateBestNode: function (doc, lang) {
      var bottomNegativescoreNodes, cnt, i, negativeScoring, nodesNumber, nodesToCheck, nodesWithText, parentNodes, startingBoost, topNode, topNodeScore;
      topNode = null;
      nodesToCheck = doc('p, pre, td');
      startingBoost = 1;
      cnt = 0;
      i = 0;
      parentNodes = [];
      nodesWithText = [];
      nodesToCheck.each(function () {
        var highLinkDensity, node, textNode, wordStats;
        node = doc(this);
        textNode = node.text();
        wordStats = stopwords(textNode, lang);
        highLinkDensity = isHighlinkDensity(doc, node);
        if (wordStats.stopwordCount > 2 && !highLinkDensity)
          return nodesWithText.push(node);
      });
      nodesNumber = nodesWithText.length;
      negativeScoring = 0;
      bottomNegativescoreNodes = nodesNumber * .25;
      _.each(nodesWithText, function (node) {
        var booster, boostScore, negscore, parentNode, parentParentNode, textNode, upscore, wordStats;
        boostScore = 0;
        if (isBoostable(doc, node, lang) === true)
          if (cnt >= 0) {
            boostScore = 1 / startingBoost * 50;
            startingBoost += 1;
          }
        if (nodesNumber > 15)
          if (nodesNumber - i <= bottomNegativescoreNodes) {
            booster = bottomNegativescoreNodes - (nodesNumber - i);
            boostScore = -1 * Math.pow(booster, 2);
            negscore = Math.abs(boostScore) + negativeScoring;
            if (negscore > 40)
              boostScore = 5;
          }
        textNode = node.text();
        wordStats = stopwords(textNode, lang);
        upscore = Math.floor(wordStats.stopwordCount + boostScore);
        parentNode = node.parent();
        updateScore(parentNode, upscore);
        updateNodeCount(parentNode, 1);
        if (parentNodes.indexOf(parentNode[0]) === -1)
          parentNodes.push(parentNode[0]);
        parentParentNode = parentNode.parent();
        if (parentParentNode) {
          updateNodeCount(parentParentNode, 1);
          updateScore(parentParentNode, upscore / 2);
          if (parentNodes.indexOf(parentParentNode[0]) === -1)
            parentNodes.push(parentParentNode[0]);
        }
        cnt += 1;
        return i += 1;
      });
      topNodeScore = 0;
      _.each(parentNodes, function (e) {
        var score;
        score = getScore(doc(e));
        if (score > topNodeScore) {
          topNode = e;
          topNodeScore = score;
        }
        if (topNode === null)
          return topNode = e;
      });
      return doc(topNode);
    }
  };
  getVideoAttrs = function (doc, node) {
    var data, el;
    el = doc(node);
    return data = {
      src: el.attr('src'),
      height: el.attr('height'),
      width: el.attr('width')
    };
  };
  getObjectTag = function (doc, node) {
    var src, srcNode, video;
    srcNode = node.find('param[name=movie]');
    if (!(srcNode.length > 0))
      return null;
    src = srcNode.attr('value');
    video = getVideoAttrs(doc, node);
    video.src = src;
    return video;
  };
  biggestTitleChunk = function (title, splitter) {
    var largeTextIndex, largeTextLength, titlePieces;
    largeTextLength = 0;
    largeTextIndex = 0;
    titlePieces = title.split(splitter);
    _.each(titlePieces, function (piece, i) {
      if (piece.length > largeTextLength) {
        largeTextLength = piece.length;
        return largeTextIndex = i;
      }
    });
    return titlePieces[largeTextIndex];
  };
  isBoostable = function (doc, node, lang) {
    var boostable, maxStepsawayFromNode, minimumStopwordCount, nodes, stepsAway;
    stepsAway = 0;
    minimumStopwordCount = 5;
    maxStepsawayFromNode = 3;
    nodes = node.prevAll();
    boostable = false;
    nodes.each(function () {
      var currentNode, currentNodeTag, paraText, wordStats;
      currentNode = doc(this);
      currentNodeTag = currentNode[0].name;
      if (currentNodeTag === 'p') {
        if (stepsAway >= maxStepsawayFromNode) {
          boostable = false;
          return false;
        }
        paraText = currentNode.text();
        wordStats = stopwords(paraText, lang);
        if (wordStats.stopwordCount > minimumStopwordCount) {
          boostable = true;
          return false;
        }
        return stepsAway += 1;
      }
    });
    return boostable;
  };
  addSiblings = function (doc, topNode, lang) {
    var baselinescoreSiblingsPara, sibs;
    baselinescoreSiblingsPara = getSiblingsScore(doc, topNode, lang);
    sibs = topNode.prevAll();
    sibs.each(function () {
      var currentNode, ps;
      currentNode = doc(this);
      ps = getSiblingsContent(doc, lang, currentNode, baselinescoreSiblingsPara);
      return _.each(ps, function (p) {
        return topNode.prepend('<p>' + p + '</p>');
      });
    });
    return topNode;
  };
  getSiblingsContent = function (doc, lang, currentSibling, baselinescoreSiblingsPara) {
    var potentialParagraphs, ps;
    if (currentSibling[0].name === 'p' && currentSibling.text().length > 0) {
      return [currentSibling];
    } else {
      potentialParagraphs = currentSibling.find('p');
      if (potentialParagraphs === null) {
        return null;
      } else {
        ps = [];
        potentialParagraphs.each(function () {
          var firstParagraph, highLinkDensity, paragraphScore, score, siblingBaselineScore, txt, wordStats;
          firstParagraph = doc(this);
          txt = firstParagraph.text();
          if (txt.length > 0) {
            wordStats = stopwords(txt, lang);
            paragraphScore = wordStats.stopwordCount;
            siblingBaselineScore = .3;
            highLinkDensity = isHighlinkDensity(doc, firstParagraph);
            score = baselinescoreSiblingsPara * siblingBaselineScore;
            if (score < paragraphScore && !highLinkDensity)
              return ps.push(txt);
          }
        });
        return ps;
      }
    }
  };
  getSiblingsScore = function (doc, topNode, lang) {
    var base, nodesToCheck, paragraphsNumber, paragraphsScore;
    base = 1e5;
    paragraphsNumber = 0;
    paragraphsScore = 0;
    nodesToCheck = topNode.find('p');
    nodesToCheck.each(function () {
      var highLinkDensity, node, textNode, wordStats;
      node = doc(this);
      textNode = node.text();
      wordStats = stopwords(textNode, lang);
      highLinkDensity = isHighlinkDensity(doc, node);
      if (wordStats.stopwordCount > 2 && !highLinkDensity) {
        paragraphsNumber += 1;
        return paragraphsScore += wordStats.stopwordCount;
      }
    });
    if (paragraphsNumber > 0)
      base = paragraphsScore / paragraphsNumber;
    return base;
  };
  updateScore = function (node, addToScore) {
    var currentScore, newScore, scoreString;
    currentScore = 0;
    scoreString = node.attr('gravityScore');
    if (scoreString)
      currentScore = parseInt(scoreString);
    newScore = currentScore + addToScore;
    return node.attr('gravityScore', newScore);
  };
  updateNodeCount = function (node, addToCount) {
    var countString, currentScore, newScore;
    currentScore = 0;
    countString = node.attr('gravityNodes');
    if (countString)
      currentScore = parseInt(countString);
    newScore = currentScore + addToCount;
    return node.attr('gravityNodes', newScore);
  };
  isHighlinkDensity = function (doc, node) {
    var links, linkText, linkWords, numberOfLinks, numberOfLinkWords, numberOfWords, percentLinkWords, sb, score, txt, words;
    links = node.find('a');
    if (!(links.length > 0))
      return false;
    txt = node.text();
    words = txt.split(' ');
    numberOfWords = words.length;
    sb = [];
    links.each(function () {
      return sb.push(doc(this).text());
    });
    linkText = sb.join(' ');
    linkWords = linkText.split(' ');
    numberOfLinkWords = linkWords.length;
    numberOfLinks = links.length;
    percentLinkWords = numberOfLinkWords / numberOfWords;
    score = percentLinkWords * numberOfLinks;
    return score >= 1;
  };
  getScore = function (node) {
    var grvScoreString;
    grvScoreString = node.attr('gravityScore');
    if (!grvScoreString) {
      return 0;
    } else {
      return parseInt(grvScoreString);
    }
  };
  isTableAndNoParaExist = function (doc, e) {
    var subParagraphs, subParagraphs2;
    subParagraphs = e.find('p');
    subParagraphs.each(function () {
      var p, txt;
      p = doc(this);
      txt = p.text();
      if (txt.length < 25)
        return doc(p).remove();
    });
    subParagraphs2 = e.find('p');
    if (subParagraphs2.length === 0 && !(e[0].name === 'td' || e[0].name === 'ul' || e[0].name === 'ol')) {
      return true;
    } else {
      return false;
    }
  };
  isNodescoreThresholdMet = function (doc, node, e) {
    var currentNodeScore, thresholdScore, topNodeScore;
    topNodeScore = getScore(node);
    currentNodeScore = getScore(e);
    thresholdScore = topNodeScore * .08;
    if (currentNodeScore < thresholdScore && !(e[0].name === 'td' || e[0].name === 'ul' || e[0].name === 'ol' || e[0].name === 'blockquote')) {
      return false;
    } else {
      return true;
    }
  };
  postCleanup = function (doc, targetNode, lang) {
    var node;
    node = addSiblings(doc, targetNode, lang);
    node.children().each(function () {
      var e, eTag;
      e = doc(this);
      eTag = e[0].name;
      if (!(eTag === 'p' || eTag === 'a'))
        if (isHighlinkDensity(doc, e) || isTableAndNoParaExist(doc, e) || !isNodescoreThresholdMet(doc, node, e)) {
          return doc(e).remove();
        }
    });
    return node;
  };
  cleanText = function (text) {
    return text.replace(/[\r\n\t]/g, ' ').replace(/\s\s+/g, ' ').replace(/<!--.+?-->/g, '').replace(/�/g, '').trim();
  };
  cleanTitle = function (title, delimiters) {
    var titleText, usedDelimeter;
    titleText = title || '';
    usedDelimeter = false;
    _.each(delimiters, function (c) {
      if (titleText.indexOf(c) >= 0 && !usedDelimeter) {
        titleText = biggestTitleChunk(titleText, c);
        return usedDelimeter = true;
      }
    });
    return cleanText(titleText);
  };
  rawTitle = function (doc) {
    var cache$, cache$1, cache$2, cache$3, cache$4, cache$5, cache$6, cache$7, cache$8, cache$9, gotTitle, titleText;
    gotTitle = false;
    titleText = '';
    _.each([
      null != (cache$ = doc("meta[property='og:title']")) && null != (cache$1 = cache$.first()) ? cache$1.attr('content') : void 0,
      null != (cache$2 = doc("h1[class*='title']")) && null != (cache$3 = cache$2.first()) ? cache$3.text() : void 0,
      null != (cache$4 = doc('title')) && null != (cache$5 = cache$4.first()) ? cache$5.text() : void 0,
      null != (cache$6 = doc('h1')) && null != (cache$7 = cache$6.first()) ? cache$7.text() : void 0,
      null != (cache$8 = doc('h2')) && null != (cache$9 = cache$8.first()) ? cache$9.text() : void 0
    ], function (candidate) {
      if (candidate && candidate.trim() && !gotTitle) {
        titleText = candidate.trim();
        return gotTitle = true;
      }
    });
    return titleText;
  };
}.call(this);

},{"./formatter":100,"./stopwords":101,"lodash":66}],100:[function(require,module,exports){
// Generated by CoffeeScript 2.0.0-beta7
void function () {
  var _, addNewlineToBr, cleanParagraphText, convertToText, formatter, linksToText, removeFewwordsParagraphs, removeNegativescoresNodes, replaceWithText, stopwords, ulToText, XRegExp;
  stopwords = require('./stopwords');
  _ = require('lodash');
  XRegExp = require('xregexp').XRegExp;
  module.exports = formatter = function (doc, topNode, language) {
    removeNegativescoresNodes(doc, topNode);
    linksToText(doc, topNode);
    addNewlineToBr(doc, topNode);
    replaceWithText(doc, topNode);
    removeFewwordsParagraphs(doc, topNode, language);
    return convertToText(doc, topNode);
  };
  linksToText = function (doc, topNode) {
    var nodes;
    nodes = topNode.find('a');
    return nodes.each(function () {
      return doc(this).replaceWith(doc(this).html());
    });
  };
  ulToText = function (doc, node) {
    var nodes, txt;
    nodes = node.find('li');
    txt = '';
    nodes.each(function () {
      return txt = txt + ('\n * ' + doc(this).text());
    });
    txt = txt + '\n';
    return txt;
  };
  replaceWithText = function (doc, topNode) {
    var nodes;
    nodes = topNode.find('b, strong, i, br, sup');
    return nodes.each(function () {
      return doc(this).replaceWith(doc(this).text());
    });
  };
  cleanParagraphText = function (rawText) {
    var txt;
    txt = rawText.trim();
    txt.replace(/[\s\t]+/g, ' ');
    return txt;
  };
  convertToText = function (doc, topNode) {
    var hangingText, nodes, regex, txt, txts;
    txts = [];
    nodes = topNode.contents();
    hangingText = '';
    nodes.each(function () {
      var node, nodeName, nodeType, txt;
      node = doc(this);
      nodeType = node[0].type;
      nodeName = node[0].name;
      if (nodeType === 'text') {
        hangingText += node.text();
        return true;
      } else if (nodeName === 'ul') {
        hangingText += ulToText(doc, node);
        return true;
      }
      if (hangingText.length > 0) {
        txt = cleanParagraphText(hangingText);
        txts = txts.concat(txt.split(/\r?\n/));
        hangingText = '';
      }
      txt = cleanParagraphText(node.text());
      txt = txt.replace(/(\w+\.)([A-Z]+)/, '$1 $2');
      return txts = txts.concat(txt.split(/\r?\n/));
    });
    if (hangingText.length > 0) {
      txt = cleanParagraphText(hangingText);
      txts = txts.concat(txt.split(/\r?\n/));
    }
    txts = _.map(txts, function (txt) {
      return txt.trim();
    });
    regex = XRegExp('[\\p{Number}\\p{Letter}]');
    txts = _.filter(txts, function (txt) {
      return regex.test(txt);
    });
    return txts.join('\n\n');
  };
  addNewlineToBr = function (doc, topNode) {
    var brs;
    brs = topNode.find('br');
    return brs.each(function () {
      var br;
      br = doc(this);
      return br.replaceWith('\n\n');
    });
  };
  removeNegativescoresNodes = function (doc, topNode) {
    var gravityItems;
    gravityItems = topNode.find('*[gravityScore]');
    return gravityItems.each(function () {
      var item, score;
      item = doc(this);
      score = parseInt(item.attr('gravityScore')) || 0;
      if (score < 1)
        return doc(item).remove();
    });
  };
  removeFewwordsParagraphs = function (doc, topNode, language) {
    var allNodes;
    allNodes = topNode.find('*');
    return allNodes.each(function () {
      var el, stopWords, tag, text, trimmed;
      el = doc(this);
      tag = el[0].name;
      text = el.text();
      stopWords = stopwords(text, language);
      if ((tag !== 'br' || text !== '\\r') && stopWords.stopwordCount < 3 && el.find('object').length === 0 && el.find('embed').length === 0) {
        return doc(el).remove();
      } else {
        trimmed = text.trim();
        if (trimmed[0] === '(' && trimmed[trimmed.length - 1] === ')')
          return doc(el).remove();
      }
    });
  };
}.call(this);

},{"./stopwords":101,"lodash":66,"xregexp":104}],101:[function(require,module,exports){
// Generated by CoffeeScript 2.0.0-beta7
void function () {
  var _, cache, candiateWords, path, removePunctuation, stopwords, sw;
  path = require('path');
  _ = require('lodash');
  sw = require('../data/stopwords');
  cache = {};
  module.exports = stopwords = function (content, language) {
    var count, overlappingStopwords, stopWords, strippedInput, words;
    if (null == language)
      language = 'en';
    if (cache.hasOwnProperty(language)) {
      stopWords = cache[language];
    } else {
      stopWords = sw(language);
      cache[language] = stopWords;
    }
    strippedInput = removePunctuation(content);
    words = candiateWords(strippedInput);
    overlappingStopwords = [];
    count = 0;
    _.each(words, function (w) {
      count += 1;
      if (stopWords.indexOf(w.toLowerCase()) > -1)
        return overlappingStopwords.push(w.toLowerCase());
    });
    return {
      wordCount: count,
      stopwordCount: overlappingStopwords.length,
      stopWords: overlappingStopwords
    };
  };
  removePunctuation = function (content) {
    return content.replace(/[\|\@\<\>\[\]\"\'\.,-\/#\?!$%\^&\*\+;:{}=\-_`~()]/g, '');
  };
  candiateWords = function (strippedInput) {
    return strippedInput.split(' ');
  };
}.call(this);

},{"../data/stopwords":74,"lodash":66,"path":115}],102:[function(require,module,exports){
// Generated by CoffeeScript 2.0.0-beta7
void function () {
  var cheerio, cleaner, extractor, getCleanedDoc, getParsedDoc, getTopNode, unfluff;
  cheerio = require('cheerio');
  extractor = require('./extractor');
  cleaner = require('./cleaner');
  module.exports = unfluff = function (html, language) {
    var doc, lng, pageData, topNode;
    doc = cheerio.load(html);
    lng = language || extractor.lang(doc);
    pageData = {
      title: extractor.title(doc),
      softTitle: extractor.softTitle(doc),
      date: extractor.date(doc),
      author: extractor.author(doc),
      publisher: extractor.publisher(doc),
      copyright: extractor.copyright(doc),
      favicon: extractor.favicon(doc),
      description: extractor.description(doc),
      keywords: extractor.keywords(doc),
      lang: lng,
      canonicalLink: extractor.canonicalLink(doc),
      tags: extractor.tags(doc),
      image: extractor.image(doc)
    };
    cleaner(doc);
    topNode = extractor.calculateBestNode(doc, lng);
    pageData.videos = extractor.videos(doc, topNode);
    pageData.links = extractor.links(doc, topNode, lng);
    pageData.text = extractor.text(doc, topNode, lng);
    return pageData;
  };
  unfluff.lazy = function (html, language) {
    return {
      title: function () {
        var doc;
        doc = getParsedDoc.call(this, html);
        return null != this.title_ ? this.title_ : this.title_ = extractor.title(doc);
      },
      softTitle: function () {
        var doc;
        doc = getParsedDoc.call(this, html);
        return null != this.softTitle_ ? this.softTitle_ : this.softTitle_ = extractor.softTitle(doc);
      },
      date: function () {
        var doc;
        doc = getParsedDoc.call(this, html);
        return null != this.date_ ? this.date_ : this.date_ = extractor.date(doc);
      },
      copyright: function () {
        var doc;
        doc = getParsedDoc.call(this, html);
        return null != this.copyright_ ? this.copyright_ : this.copyright_ = extractor.copyright(doc);
      },
      author: function () {
        var doc;
        doc = getParsedDoc.call(this, html);
        return null != this.author_ ? this.author_ : this.author_ = extractor.author(doc);
      },
      publisher: function () {
        var doc;
        doc = getParsedDoc.call(this, html);
        return null != this.publisher_ ? this.publisher_ : this.publisher_ = extractor.publisher(doc);
      },
      favicon: function () {
        var doc;
        doc = getParsedDoc.call(this, html);
        return null != this.favicon_ ? this.favicon_ : this.favicon_ = extractor.favicon(doc);
      },
      description: function () {
        var doc;
        doc = getParsedDoc.call(this, html);
        return null != this.description_ ? this.description_ : this.description_ = extractor.description(doc);
      },
      keywords: function () {
        var doc;
        doc = getParsedDoc.call(this, html);
        return null != this.keywords_ ? this.keywords_ : this.keywords_ = extractor.keywords(doc);
      },
      lang: function () {
        var doc;
        doc = getParsedDoc.call(this, html);
        return null != this.language_ ? this.language_ : this.language_ = language || extractor.lang(doc);
      },
      canonicalLink: function () {
        var doc;
        doc = getParsedDoc.call(this, html);
        return null != this.canonicalLink_ ? this.canonicalLink_ : this.canonicalLink_ = extractor.canonicalLink(doc);
      },
      tags: function () {
        var doc;
        doc = getParsedDoc.call(this, html);
        return null != this.tags_ ? this.tags_ : this.tags_ = extractor.tags(doc);
      },
      image: function () {
        var doc;
        doc = getParsedDoc.call(this, html);
        return null != this.image_ ? this.image_ : this.image_ = extractor.image(doc);
      },
      videos: function () {
        var doc, topNode;
        if (null != this.videos_)
          return this.videos_;
        doc = getCleanedDoc.call(this, html);
        topNode = getTopNode.call(this, doc, this.lang());
        return this.videos_ = extractor.videos(doc, topNode);
      },
      text: function () {
        var doc, topNode;
        if (null != this.text_)
          return this.text_;
        doc = getCleanedDoc.call(this, html);
        topNode = getTopNode.call(this, doc, this.lang());
        return this.text_ = extractor.text(doc, topNode, this.lang());
      },
      links: function () {
        var doc, topNode;
        if (null != this.links_)
          return this.links_;
        doc = getCleanedDoc.call(this, html);
        topNode = getTopNode.call(this, doc, this.lang());
        return this.links_ = extractor.links(doc, topNode, this.lang());
      }
    };
  };
  getParsedDoc = function (html) {
    return null != this.doc_ ? this.doc_ : this.doc_ = cheerio.load(html);
  };
  getTopNode = function (doc, lng) {
    return null != this.topNode_ ? this.topNode_ : this.topNode_ = extractor.calculateBestNode(doc, lng);
  };
  getCleanedDoc = function (html) {
    var doc;
    if (null != this.cleanedDoc_)
      return this.cleanedDoc_;
    doc = getParsedDoc.call(this, html);
    this.cleanedDoc_ = cleaner(doc);
    return this.cleanedDoc_;
  };
}.call(this);

},{"./cleaner":98,"./extractor":99,"cheerio":11}],103:[function(require,module,exports){
(function(self) {
  'use strict';

  if (self.fetch) {
    return
  }

  var support = {
    searchParams: 'URLSearchParams' in self,
    iterable: 'Symbol' in self && 'iterator' in Symbol,
    blob: 'FileReader' in self && 'Blob' in self && (function() {
      try {
        new Blob()
        return true
      } catch(e) {
        return false
      }
    })(),
    formData: 'FormData' in self,
    arrayBuffer: 'ArrayBuffer' in self
  }

  if (support.arrayBuffer) {
    var viewClasses = [
      '[object Int8Array]',
      '[object Uint8Array]',
      '[object Uint8ClampedArray]',
      '[object Int16Array]',
      '[object Uint16Array]',
      '[object Int32Array]',
      '[object Uint32Array]',
      '[object Float32Array]',
      '[object Float64Array]'
    ]

    var isDataView = function(obj) {
      return obj && DataView.prototype.isPrototypeOf(obj)
    }

    var isArrayBufferView = ArrayBuffer.isView || function(obj) {
      return obj && viewClasses.indexOf(Object.prototype.toString.call(obj)) > -1
    }
  }

  function normalizeName(name) {
    if (typeof name !== 'string') {
      name = String(name)
    }
    if (/[^a-z0-9\-#$%&'*+.\^_`|~]/i.test(name)) {
      throw new TypeError('Invalid character in header field name')
    }
    return name.toLowerCase()
  }

  function normalizeValue(value) {
    if (typeof value !== 'string') {
      value = String(value)
    }
    return value
  }

  // Build a destructive iterator for the value list
  function iteratorFor(items) {
    var iterator = {
      next: function() {
        var value = items.shift()
        return {done: value === undefined, value: value}
      }
    }

    if (support.iterable) {
      iterator[Symbol.iterator] = function() {
        return iterator
      }
    }

    return iterator
  }

  function Headers(headers) {
    this.map = {}

    if (headers instanceof Headers) {
      headers.forEach(function(value, name) {
        this.append(name, value)
      }, this)

    } else if (headers) {
      Object.getOwnPropertyNames(headers).forEach(function(name) {
        this.append(name, headers[name])
      }, this)
    }
  }

  Headers.prototype.append = function(name, value) {
    name = normalizeName(name)
    value = normalizeValue(value)
    var oldValue = this.map[name]
    this.map[name] = oldValue ? oldValue+','+value : value
  }

  Headers.prototype['delete'] = function(name) {
    delete this.map[normalizeName(name)]
  }

  Headers.prototype.get = function(name) {
    name = normalizeName(name)
    return this.has(name) ? this.map[name] : null
  }

  Headers.prototype.has = function(name) {
    return this.map.hasOwnProperty(normalizeName(name))
  }

  Headers.prototype.set = function(name, value) {
    this.map[normalizeName(name)] = normalizeValue(value)
  }

  Headers.prototype.forEach = function(callback, thisArg) {
    for (var name in this.map) {
      if (this.map.hasOwnProperty(name)) {
        callback.call(thisArg, this.map[name], name, this)
      }
    }
  }

  Headers.prototype.keys = function() {
    var items = []
    this.forEach(function(value, name) { items.push(name) })
    return iteratorFor(items)
  }

  Headers.prototype.values = function() {
    var items = []
    this.forEach(function(value) { items.push(value) })
    return iteratorFor(items)
  }

  Headers.prototype.entries = function() {
    var items = []
    this.forEach(function(value, name) { items.push([name, value]) })
    return iteratorFor(items)
  }

  if (support.iterable) {
    Headers.prototype[Symbol.iterator] = Headers.prototype.entries
  }

  function consumed(body) {
    if (body.bodyUsed) {
      return Promise.reject(new TypeError('Already read'))
    }
    body.bodyUsed = true
  }

  function fileReaderReady(reader) {
    return new Promise(function(resolve, reject) {
      reader.onload = function() {
        resolve(reader.result)
      }
      reader.onerror = function() {
        reject(reader.error)
      }
    })
  }

  function readBlobAsArrayBuffer(blob) {
    var reader = new FileReader()
    var promise = fileReaderReady(reader)
    reader.readAsArrayBuffer(blob)
    return promise
  }

  function readBlobAsText(blob) {
    var reader = new FileReader()
    var promise = fileReaderReady(reader)
    reader.readAsText(blob)
    return promise
  }

  function readArrayBufferAsText(buf) {
    var view = new Uint8Array(buf)
    var chars = new Array(view.length)

    for (var i = 0; i < view.length; i++) {
      chars[i] = String.fromCharCode(view[i])
    }
    return chars.join('')
  }

  function bufferClone(buf) {
    if (buf.slice) {
      return buf.slice(0)
    } else {
      var view = new Uint8Array(buf.byteLength)
      view.set(new Uint8Array(buf))
      return view.buffer
    }
  }

  function Body() {
    this.bodyUsed = false

    this._initBody = function(body) {
      this._bodyInit = body
      if (!body) {
        this._bodyText = ''
      } else if (typeof body === 'string') {
        this._bodyText = body
      } else if (support.blob && Blob.prototype.isPrototypeOf(body)) {
        this._bodyBlob = body
      } else if (support.formData && FormData.prototype.isPrototypeOf(body)) {
        this._bodyFormData = body
      } else if (support.searchParams && URLSearchParams.prototype.isPrototypeOf(body)) {
        this._bodyText = body.toString()
      } else if (support.arrayBuffer && support.blob && isDataView(body)) {
        this._bodyArrayBuffer = bufferClone(body.buffer)
        // IE 10-11 can't handle a DataView body.
        this._bodyInit = new Blob([this._bodyArrayBuffer])
      } else if (support.arrayBuffer && (ArrayBuffer.prototype.isPrototypeOf(body) || isArrayBufferView(body))) {
        this._bodyArrayBuffer = bufferClone(body)
      } else {
        throw new Error('unsupported BodyInit type')
      }

      if (!this.headers.get('content-type')) {
        if (typeof body === 'string') {
          this.headers.set('content-type', 'text/plain;charset=UTF-8')
        } else if (this._bodyBlob && this._bodyBlob.type) {
          this.headers.set('content-type', this._bodyBlob.type)
        } else if (support.searchParams && URLSearchParams.prototype.isPrototypeOf(body)) {
          this.headers.set('content-type', 'application/x-www-form-urlencoded;charset=UTF-8')
        }
      }
    }

    if (support.blob) {
      this.blob = function() {
        var rejected = consumed(this)
        if (rejected) {
          return rejected
        }

        if (this._bodyBlob) {
          return Promise.resolve(this._bodyBlob)
        } else if (this._bodyArrayBuffer) {
          return Promise.resolve(new Blob([this._bodyArrayBuffer]))
        } else if (this._bodyFormData) {
          throw new Error('could not read FormData body as blob')
        } else {
          return Promise.resolve(new Blob([this._bodyText]))
        }
      }

      this.arrayBuffer = function() {
        if (this._bodyArrayBuffer) {
          return consumed(this) || Promise.resolve(this._bodyArrayBuffer)
        } else {
          return this.blob().then(readBlobAsArrayBuffer)
        }
      }
    }

    this.text = function() {
      var rejected = consumed(this)
      if (rejected) {
        return rejected
      }

      if (this._bodyBlob) {
        return readBlobAsText(this._bodyBlob)
      } else if (this._bodyArrayBuffer) {
        return Promise.resolve(readArrayBufferAsText(this._bodyArrayBuffer))
      } else if (this._bodyFormData) {
        throw new Error('could not read FormData body as text')
      } else {
        return Promise.resolve(this._bodyText)
      }
    }

    if (support.formData) {
      this.formData = function() {
        return this.text().then(decode)
      }
    }

    this.json = function() {
      return this.text().then(JSON.parse)
    }

    return this
  }

  // HTTP methods whose capitalization should be normalized
  var methods = ['DELETE', 'GET', 'HEAD', 'OPTIONS', 'POST', 'PUT']

  function normalizeMethod(method) {
    var upcased = method.toUpperCase()
    return (methods.indexOf(upcased) > -1) ? upcased : method
  }

  function Request(input, options) {
    options = options || {}
    var body = options.body

    if (typeof input === 'string') {
      this.url = input
    } else {
      if (input.bodyUsed) {
        throw new TypeError('Already read')
      }
      this.url = input.url
      this.credentials = input.credentials
      if (!options.headers) {
        this.headers = new Headers(input.headers)
      }
      this.method = input.method
      this.mode = input.mode
      if (!body && input._bodyInit != null) {
        body = input._bodyInit
        input.bodyUsed = true
      }
    }

    this.credentials = options.credentials || this.credentials || 'omit'
    if (options.headers || !this.headers) {
      this.headers = new Headers(options.headers)
    }
    this.method = normalizeMethod(options.method || this.method || 'GET')
    this.mode = options.mode || this.mode || null
    this.referrer = null

    if ((this.method === 'GET' || this.method === 'HEAD') && body) {
      throw new TypeError('Body not allowed for GET or HEAD requests')
    }
    this._initBody(body)
  }

  Request.prototype.clone = function() {
    return new Request(this, { body: this._bodyInit })
  }

  function decode(body) {
    var form = new FormData()
    body.trim().split('&').forEach(function(bytes) {
      if (bytes) {
        var split = bytes.split('=')
        var name = split.shift().replace(/\+/g, ' ')
        var value = split.join('=').replace(/\+/g, ' ')
        form.append(decodeURIComponent(name), decodeURIComponent(value))
      }
    })
    return form
  }

  function parseHeaders(rawHeaders) {
    var headers = new Headers()
    rawHeaders.split('\r\n').forEach(function(line) {
      var parts = line.split(':')
      var key = parts.shift().trim()
      if (key) {
        var value = parts.join(':').trim()
        headers.append(key, value)
      }
    })
    return headers
  }

  Body.call(Request.prototype)

  function Response(bodyInit, options) {
    if (!options) {
      options = {}
    }

    this.type = 'default'
    this.status = 'status' in options ? options.status : 200
    this.ok = this.status >= 200 && this.status < 300
    this.statusText = 'statusText' in options ? options.statusText : 'OK'
    this.headers = new Headers(options.headers)
    this.url = options.url || ''
    this._initBody(bodyInit)
  }

  Body.call(Response.prototype)

  Response.prototype.clone = function() {
    return new Response(this._bodyInit, {
      status: this.status,
      statusText: this.statusText,
      headers: new Headers(this.headers),
      url: this.url
    })
  }

  Response.error = function() {
    var response = new Response(null, {status: 0, statusText: ''})
    response.type = 'error'
    return response
  }

  var redirectStatuses = [301, 302, 303, 307, 308]

  Response.redirect = function(url, status) {
    if (redirectStatuses.indexOf(status) === -1) {
      throw new RangeError('Invalid status code')
    }

    return new Response(null, {status: status, headers: {location: url}})
  }

  self.Headers = Headers
  self.Request = Request
  self.Response = Response

  self.fetch = function(input, init) {
    return new Promise(function(resolve, reject) {
      var request = new Request(input, init)
      var xhr = new XMLHttpRequest()

      xhr.onload = function() {
        var options = {
          status: xhr.status,
          statusText: xhr.statusText,
          headers: parseHeaders(xhr.getAllResponseHeaders() || '')
        }
        options.url = 'responseURL' in xhr ? xhr.responseURL : options.headers.get('X-Request-URL')
        var body = 'response' in xhr ? xhr.response : xhr.responseText
        resolve(new Response(body, options))
      }

      xhr.onerror = function() {
        reject(new TypeError('Network request failed'))
      }

      xhr.ontimeout = function() {
        reject(new TypeError('Network request failed'))
      }

      xhr.open(request.method, request.url, true)

      if (request.credentials === 'include') {
        xhr.withCredentials = true
      }

      if ('responseType' in xhr && support.blob) {
        xhr.responseType = 'blob'
      }

      request.headers.forEach(function(value, name) {
        xhr.setRequestHeader(name, value)
      })

      xhr.send(typeof request._bodyInit === 'undefined' ? null : request._bodyInit)
    })
  }
  self.fetch.polyfill = true
})(typeof self !== 'undefined' ? self : this);

},{}],104:[function(require,module,exports){

/***** xregexp.js *****/

/*!
 * XRegExp v2.0.0
 * (c) 2007-2012 Steven Levithan <http://xregexp.com/>
 * MIT License
 */

/**
 * XRegExp provides augmented, extensible JavaScript regular expressions. You get new syntax,
 * flags, and methods beyond what browsers support natively. XRegExp is also a regex utility belt
 * with tools to make your client-side grepping simpler and more powerful, while freeing you from
 * worrying about pesky cross-browser inconsistencies and the dubious `lastIndex` property. See
 * XRegExp's documentation (http://xregexp.com/) for more details.
 * @module xregexp
 * @requires N/A
 */
var XRegExp;

// Avoid running twice; that would reset tokens and could break references to native globals
XRegExp = XRegExp || (function (undef) {
    "use strict";

/*--------------------------------------
 *  Private variables
 *------------------------------------*/

    var self,
        addToken,
        add,

// Optional features; can be installed and uninstalled
        features = {
            natives: false,
            extensibility: false
        },

// Store native methods to use and restore ("native" is an ES3 reserved keyword)
        nativ = {
            exec: RegExp.prototype.exec,
            test: RegExp.prototype.test,
            match: String.prototype.match,
            replace: String.prototype.replace,
            split: String.prototype.split
        },

// Storage for fixed/extended native methods
        fixed = {},

// Storage for cached regexes
        cache = {},

// Storage for addon tokens
        tokens = [],

// Token scopes
        defaultScope = "default",
        classScope = "class",

// Regexes that match native regex syntax
        nativeTokens = {
            // Any native multicharacter token in default scope (includes octals, excludes character classes)
            "default": /^(?:\\(?:0(?:[0-3][0-7]{0,2}|[4-7][0-7]?)?|[1-9]\d*|x[\dA-Fa-f]{2}|u[\dA-Fa-f]{4}|c[A-Za-z]|[\s\S])|\(\?[:=!]|[?*+]\?|{\d+(?:,\d*)?}\??)/,
            // Any native multicharacter token in character class scope (includes octals)
            "class": /^(?:\\(?:[0-3][0-7]{0,2}|[4-7][0-7]?|x[\dA-Fa-f]{2}|u[\dA-Fa-f]{4}|c[A-Za-z]|[\s\S]))/
        },

// Any backreference in replacement strings
        replacementToken = /\$(?:{([\w$]+)}|(\d\d?|[\s\S]))/g,

// Any character with a later instance in the string
        duplicateFlags = /([\s\S])(?=[\s\S]*\1)/g,

// Any greedy/lazy quantifier
        quantifier = /^(?:[?*+]|{\d+(?:,\d*)?})\??/,

// Check for correct `exec` handling of nonparticipating capturing groups
        compliantExecNpcg = nativ.exec.call(/()??/, "")[1] === undef,

// Check for flag y support (Firefox 3+)
        hasNativeY = RegExp.prototype.sticky !== undef,

// Used to kill infinite recursion during XRegExp construction
        isInsideConstructor = false,

// Storage for known flags, including addon flags
        registeredFlags = "gim" + (hasNativeY ? "y" : "");

/*--------------------------------------
 *  Private helper functions
 *------------------------------------*/

/**
 * Attaches XRegExp.prototype properties and named capture supporting data to a regex object.
 * @private
 * @param {RegExp} regex Regex to augment.
 * @param {Array} captureNames Array with capture names, or null.
 * @param {Boolean} [isNative] Whether the regex was created by `RegExp` rather than `XRegExp`.
 * @returns {RegExp} Augmented regex.
 */
    function augment(regex, captureNames, isNative) {
        var p;
        // Can't auto-inherit these since the XRegExp constructor returns a nonprimitive value
        for (p in self.prototype) {
            if (self.prototype.hasOwnProperty(p)) {
                regex[p] = self.prototype[p];
            }
        }
        regex.xregexp = {captureNames: captureNames, isNative: !!isNative};
        return regex;
    }

/**
 * Returns native `RegExp` flags used by a regex object.
 * @private
 * @param {RegExp} regex Regex to check.
 * @returns {String} Native flags in use.
 */
    function getNativeFlags(regex) {
        //return nativ.exec.call(/\/([a-z]*)$/i, String(regex))[1];
        return (regex.global     ? "g" : "") +
               (regex.ignoreCase ? "i" : "") +
               (regex.multiline  ? "m" : "") +
               (regex.extended   ? "x" : "") + // Proposed for ES6, included in AS3
               (regex.sticky     ? "y" : ""); // Proposed for ES6, included in Firefox 3+
    }

/**
 * Copies a regex object while preserving special properties for named capture and augmenting with
 * `XRegExp.prototype` methods. The copy has a fresh `lastIndex` property (set to zero). Allows
 * adding and removing flags while copying the regex.
 * @private
 * @param {RegExp} regex Regex to copy.
 * @param {String} [addFlags] Flags to be added while copying the regex.
 * @param {String} [removeFlags] Flags to be removed while copying the regex.
 * @returns {RegExp} Copy of the provided regex, possibly with modified flags.
 */
    function copy(regex, addFlags, removeFlags) {
        if (!self.isRegExp(regex)) {
            throw new TypeError("type RegExp expected");
        }
        var flags = nativ.replace.call(getNativeFlags(regex) + (addFlags || ""), duplicateFlags, "");
        if (removeFlags) {
            // Would need to escape `removeFlags` if this was public
            flags = nativ.replace.call(flags, new RegExp("[" + removeFlags + "]+", "g"), "");
        }
        if (regex.xregexp && !regex.xregexp.isNative) {
            // Compiling the current (rather than precompilation) source preserves the effects of nonnative source flags
            regex = augment(self(regex.source, flags),
                            regex.xregexp.captureNames ? regex.xregexp.captureNames.slice(0) : null);
        } else {
            // Augment with `XRegExp.prototype` methods, but use native `RegExp` (avoid searching for special tokens)
            regex = augment(new RegExp(regex.source, flags), null, true);
        }
        return regex;
    }

/*
 * Returns the last index at which a given value can be found in an array, or `-1` if it's not
 * present. The array is searched backwards.
 * @private
 * @param {Array} array Array to search.
 * @param {*} value Value to locate in the array.
 * @returns {Number} Last zero-based index at which the item is found, or -1.
 */
    function lastIndexOf(array, value) {
        var i = array.length;
        if (Array.prototype.lastIndexOf) {
            return array.lastIndexOf(value); // Use the native method if available
        }
        while (i--) {
            if (array[i] === value) {
                return i;
            }
        }
        return -1;
    }

/**
 * Determines whether an object is of the specified type.
 * @private
 * @param {*} value Object to check.
 * @param {String} type Type to check for, in lowercase.
 * @returns {Boolean} Whether the object matches the type.
 */
    function isType(value, type) {
        return Object.prototype.toString.call(value).toLowerCase() === "[object " + type + "]";
    }

/**
 * Prepares an options object from the given value.
 * @private
 * @param {String|Object} value Value to convert to an options object.
 * @returns {Object} Options object.
 */
    function prepareOptions(value) {
        value = value || {};
        if (value === "all" || value.all) {
            value = {natives: true, extensibility: true};
        } else if (isType(value, "string")) {
            value = self.forEach(value, /[^\s,]+/, function (m) {
                this[m] = true;
            }, {});
        }
        return value;
    }

/**
 * Runs built-in/custom tokens in reverse insertion order, until a match is found.
 * @private
 * @param {String} pattern Original pattern from which an XRegExp object is being built.
 * @param {Number} pos Position to search for tokens within `pattern`.
 * @param {Number} scope Current regex scope.
 * @param {Object} context Context object assigned to token handler functions.
 * @returns {Object} Object with properties `output` (the substitution string returned by the
 *   successful token handler) and `match` (the token's match array), or null.
 */
    function runTokens(pattern, pos, scope, context) {
        var i = tokens.length,
            result = null,
            match,
            t;
        // Protect against constructing XRegExps within token handler and trigger functions
        isInsideConstructor = true;
        // Must reset `isInsideConstructor`, even if a `trigger` or `handler` throws
        try {
            while (i--) { // Run in reverse order
                t = tokens[i];
                if ((t.scope === "all" || t.scope === scope) && (!t.trigger || t.trigger.call(context))) {
                    t.pattern.lastIndex = pos;
                    match = fixed.exec.call(t.pattern, pattern); // Fixed `exec` here allows use of named backreferences, etc.
                    if (match && match.index === pos) {
                        result = {
                            output: t.handler.call(context, match, scope),
                            match: match
                        };
                        break;
                    }
                }
            }
        } catch (err) {
            throw err;
        } finally {
            isInsideConstructor = false;
        }
        return result;
    }

/**
 * Enables or disables XRegExp syntax and flag extensibility.
 * @private
 * @param {Boolean} on `true` to enable; `false` to disable.
 */
    function setExtensibility(on) {
        self.addToken = addToken[on ? "on" : "off"];
        features.extensibility = on;
    }

/**
 * Enables or disables native method overrides.
 * @private
 * @param {Boolean} on `true` to enable; `false` to disable.
 */
    function setNatives(on) {
        RegExp.prototype.exec = (on ? fixed : nativ).exec;
        RegExp.prototype.test = (on ? fixed : nativ).test;
        String.prototype.match = (on ? fixed : nativ).match;
        String.prototype.replace = (on ? fixed : nativ).replace;
        String.prototype.split = (on ? fixed : nativ).split;
        features.natives = on;
    }

/*--------------------------------------
 *  Constructor
 *------------------------------------*/

/**
 * Creates an extended regular expression object for matching text with a pattern. Differs from a
 * native regular expression in that additional syntax and flags are supported. The returned object
 * is in fact a native `RegExp` and works with all native methods.
 * @class XRegExp
 * @constructor
 * @param {String|RegExp} pattern Regex pattern string, or an existing `RegExp` object to copy.
 * @param {String} [flags] Any combination of flags:
 *   <li>`g` - global
 *   <li>`i` - ignore case
 *   <li>`m` - multiline anchors
 *   <li>`n` - explicit capture
 *   <li>`s` - dot matches all (aka singleline)
 *   <li>`x` - free-spacing and line comments (aka extended)
 *   <li>`y` - sticky (Firefox 3+ only)
 *   Flags cannot be provided when constructing one `RegExp` from another.
 * @returns {RegExp} Extended regular expression object.
 * @example
 *
 * // With named capture and flag x
 * date = XRegExp('(?<year>  [0-9]{4}) -?  # year  \n\
 *                 (?<month> [0-9]{2}) -?  # month \n\
 *                 (?<day>   [0-9]{2})     # day   ', 'x');
 *
 * // Passing a regex object to copy it. The copy maintains special properties for named capture,
 * // is augmented with `XRegExp.prototype` methods, and has a fresh `lastIndex` property (set to
 * // zero). Native regexes are not recompiled using XRegExp syntax.
 * XRegExp(/regex/);
 */
    self = function (pattern, flags) {
        if (self.isRegExp(pattern)) {
            if (flags !== undef) {
                throw new TypeError("can't supply flags when constructing one RegExp from another");
            }
            return copy(pattern);
        }
        // Tokens become part of the regex construction process, so protect against infinite recursion
        // when an XRegExp is constructed within a token handler function
        if (isInsideConstructor) {
            throw new Error("can't call the XRegExp constructor within token definition functions");
        }

        var output = [],
            scope = defaultScope,
            tokenContext = {
                hasNamedCapture: false,
                captureNames: [],
                hasFlag: function (flag) {
                    return flags.indexOf(flag) > -1;
                }
            },
            pos = 0,
            tokenResult,
            match,
            chr;
        pattern = pattern === undef ? "" : String(pattern);
        flags = flags === undef ? "" : String(flags);

        if (nativ.match.call(flags, duplicateFlags)) { // Don't use test/exec because they would update lastIndex
            throw new SyntaxError("invalid duplicate regular expression flag");
        }
        // Strip/apply leading mode modifier with any combination of flags except g or y: (?imnsx)
        pattern = nativ.replace.call(pattern, /^\(\?([\w$]+)\)/, function ($0, $1) {
            if (nativ.test.call(/[gy]/, $1)) {
                throw new SyntaxError("can't use flag g or y in mode modifier");
            }
            flags = nativ.replace.call(flags + $1, duplicateFlags, "");
            return "";
        });
        self.forEach(flags, /[\s\S]/, function (m) {
            if (registeredFlags.indexOf(m[0]) < 0) {
                throw new SyntaxError("invalid regular expression flag " + m[0]);
            }
        });

        while (pos < pattern.length) {
            // Check for custom tokens at the current position
            tokenResult = runTokens(pattern, pos, scope, tokenContext);
            if (tokenResult) {
                output.push(tokenResult.output);
                pos += (tokenResult.match[0].length || 1);
            } else {
                // Check for native tokens (except character classes) at the current position
                match = nativ.exec.call(nativeTokens[scope], pattern.slice(pos));
                if (match) {
                    output.push(match[0]);
                    pos += match[0].length;
                } else {
                    chr = pattern.charAt(pos);
                    if (chr === "[") {
                        scope = classScope;
                    } else if (chr === "]") {
                        scope = defaultScope;
                    }
                    // Advance position by one character
                    output.push(chr);
                    ++pos;
                }
            }
        }

        return augment(new RegExp(output.join(""), nativ.replace.call(flags, /[^gimy]+/g, "")),
                       tokenContext.hasNamedCapture ? tokenContext.captureNames : null);
    };

/*--------------------------------------
 *  Public methods/properties
 *------------------------------------*/

// Installed and uninstalled states for `XRegExp.addToken`
    addToken = {
        on: function (regex, handler, options) {
            options = options || {};
            if (regex) {
                tokens.push({
                    pattern: copy(regex, "g" + (hasNativeY ? "y" : "")),
                    handler: handler,
                    scope: options.scope || defaultScope,
                    trigger: options.trigger || null
                });
            }
            // Providing `customFlags` with null `regex` and `handler` allows adding flags that do
            // nothing, but don't throw an error
            if (options.customFlags) {
                registeredFlags = nativ.replace.call(registeredFlags + options.customFlags, duplicateFlags, "");
            }
        },
        off: function () {
            throw new Error("extensibility must be installed before using addToken");
        }
    };

/**
 * Extends or changes XRegExp syntax and allows custom flags. This is used internally and can be
 * used to create XRegExp addons. `XRegExp.install('extensibility')` must be run before calling
 * this function, or an error is thrown. If more than one token can match the same string, the last
 * added wins.
 * @memberOf XRegExp
 * @param {RegExp} regex Regex object that matches the new token.
 * @param {Function} handler Function that returns a new pattern string (using native regex syntax)
 *   to replace the matched token within all future XRegExp regexes. Has access to persistent
 *   properties of the regex being built, through `this`. Invoked with two arguments:
 *   <li>The match array, with named backreference properties.
 *   <li>The regex scope where the match was found.
 * @param {Object} [options] Options object with optional properties:
 *   <li>`scope` {String} Scopes where the token applies: 'default', 'class', or 'all'.
 *   <li>`trigger` {Function} Function that returns `true` when the token should be applied; e.g.,
 *     if a flag is set. If `false` is returned, the matched string can be matched by other tokens.
 *     Has access to persistent properties of the regex being built, through `this` (including
 *     function `this.hasFlag`).
 *   <li>`customFlags` {String} Nonnative flags used by the token's handler or trigger functions.
 *     Prevents XRegExp from throwing an invalid flag error when the specified flags are used.
 * @example
 *
 * // Basic usage: Adds \a for ALERT character
 * XRegExp.addToken(
 *   /\\a/,
 *   function () {return '\\x07';},
 *   {scope: 'all'}
 * );
 * XRegExp('\\a[\\a-\\n]+').test('\x07\n\x07'); // -> true
 */
    self.addToken = addToken.off;

/**
 * Caches and returns the result of calling `XRegExp(pattern, flags)`. On any subsequent call with
 * the same pattern and flag combination, the cached copy is returned.
 * @memberOf XRegExp
 * @param {String} pattern Regex pattern string.
 * @param {String} [flags] Any combination of XRegExp flags.
 * @returns {RegExp} Cached XRegExp object.
 * @example
 *
 * while (match = XRegExp.cache('.', 'gs').exec(str)) {
 *   // The regex is compiled once only
 * }
 */
    self.cache = function (pattern, flags) {
        var key = pattern + "/" + (flags || "");
        return cache[key] || (cache[key] = self(pattern, flags));
    };

/**
 * Escapes any regular expression metacharacters, for use when matching literal strings. The result
 * can safely be used at any point within a regex that uses any flags.
 * @memberOf XRegExp
 * @param {String} str String to escape.
 * @returns {String} String with regex metacharacters escaped.
 * @example
 *
 * XRegExp.escape('Escaped? <.>');
 * // -> 'Escaped\?\ <\.>'
 */
    self.escape = function (str) {
        return nativ.replace.call(str, /[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
    };

/**
 * Executes a regex search in a specified string. Returns a match array or `null`. If the provided
 * regex uses named capture, named backreference properties are included on the match array.
 * Optional `pos` and `sticky` arguments specify the search start position, and whether the match
 * must start at the specified position only. The `lastIndex` property of the provided regex is not
 * used, but is updated for compatibility. Also fixes browser bugs compared to the native
 * `RegExp.prototype.exec` and can be used reliably cross-browser.
 * @memberOf XRegExp
 * @param {String} str String to search.
 * @param {RegExp} regex Regex to search with.
 * @param {Number} [pos=0] Zero-based index at which to start the search.
 * @param {Boolean|String} [sticky=false] Whether the match must start at the specified position
 *   only. The string `'sticky'` is accepted as an alternative to `true`.
 * @returns {Array} Match array with named backreference properties, or null.
 * @example
 *
 * // Basic use, with named backreference
 * var match = XRegExp.exec('U+2620', XRegExp('U\\+(?<hex>[0-9A-F]{4})'));
 * match.hex; // -> '2620'
 *
 * // With pos and sticky, in a loop
 * var pos = 2, result = [], match;
 * while (match = XRegExp.exec('<1><2><3><4>5<6>', /<(\d)>/, pos, 'sticky')) {
 *   result.push(match[1]);
 *   pos = match.index + match[0].length;
 * }
 * // result -> ['2', '3', '4']
 */
    self.exec = function (str, regex, pos, sticky) {
        var r2 = copy(regex, "g" + (sticky && hasNativeY ? "y" : ""), (sticky === false ? "y" : "")),
            match;
        r2.lastIndex = pos = pos || 0;
        match = fixed.exec.call(r2, str); // Fixed `exec` required for `lastIndex` fix, etc.
        if (sticky && match && match.index !== pos) {
            match = null;
        }
        if (regex.global) {
            regex.lastIndex = match ? r2.lastIndex : 0;
        }
        return match;
    };

/**
 * Executes a provided function once per regex match.
 * @memberOf XRegExp
 * @param {String} str String to search.
 * @param {RegExp} regex Regex to search with.
 * @param {Function} callback Function to execute for each match. Invoked with four arguments:
 *   <li>The match array, with named backreference properties.
 *   <li>The zero-based match index.
 *   <li>The string being traversed.
 *   <li>The regex object being used to traverse the string.
 * @param {*} [context] Object to use as `this` when executing `callback`.
 * @returns {*} Provided `context` object.
 * @example
 *
 * // Extracts every other digit from a string
 * XRegExp.forEach('1a2345', /\d/, function (match, i) {
 *   if (i % 2) this.push(+match[0]);
 * }, []);
 * // -> [2, 4]
 */
    self.forEach = function (str, regex, callback, context) {
        var pos = 0,
            i = -1,
            match;
        while ((match = self.exec(str, regex, pos))) {
            callback.call(context, match, ++i, str, regex);
            pos = match.index + (match[0].length || 1);
        }
        return context;
    };

/**
 * Copies a regex object and adds flag `g`. The copy maintains special properties for named
 * capture, is augmented with `XRegExp.prototype` methods, and has a fresh `lastIndex` property
 * (set to zero). Native regexes are not recompiled using XRegExp syntax.
 * @memberOf XRegExp
 * @param {RegExp} regex Regex to globalize.
 * @returns {RegExp} Copy of the provided regex with flag `g` added.
 * @example
 *
 * var globalCopy = XRegExp.globalize(/regex/);
 * globalCopy.global; // -> true
 */
    self.globalize = function (regex) {
        return copy(regex, "g");
    };

/**
 * Installs optional features according to the specified options.
 * @memberOf XRegExp
 * @param {Object|String} options Options object or string.
 * @example
 *
 * // With an options object
 * XRegExp.install({
 *   // Overrides native regex methods with fixed/extended versions that support named
 *   // backreferences and fix numerous cross-browser bugs
 *   natives: true,
 *
 *   // Enables extensibility of XRegExp syntax and flags
 *   extensibility: true
 * });
 *
 * // With an options string
 * XRegExp.install('natives extensibility');
 *
 * // Using a shortcut to install all optional features
 * XRegExp.install('all');
 */
    self.install = function (options) {
        options = prepareOptions(options);
        if (!features.natives && options.natives) {
            setNatives(true);
        }
        if (!features.extensibility && options.extensibility) {
            setExtensibility(true);
        }
    };

/**
 * Checks whether an individual optional feature is installed.
 * @memberOf XRegExp
 * @param {String} feature Name of the feature to check. One of:
 *   <li>`natives`
 *   <li>`extensibility`
 * @returns {Boolean} Whether the feature is installed.
 * @example
 *
 * XRegExp.isInstalled('natives');
 */
    self.isInstalled = function (feature) {
        return !!(features[feature]);
    };

/**
 * Returns `true` if an object is a regex; `false` if it isn't. This works correctly for regexes
 * created in another frame, when `instanceof` and `constructor` checks would fail.
 * @memberOf XRegExp
 * @param {*} value Object to check.
 * @returns {Boolean} Whether the object is a `RegExp` object.
 * @example
 *
 * XRegExp.isRegExp('string'); // -> false
 * XRegExp.isRegExp(/regex/i); // -> true
 * XRegExp.isRegExp(RegExp('^', 'm')); // -> true
 * XRegExp.isRegExp(XRegExp('(?s).')); // -> true
 */
    self.isRegExp = function (value) {
        return isType(value, "regexp");
    };

/**
 * Retrieves the matches from searching a string using a chain of regexes that successively search
 * within previous matches. The provided `chain` array can contain regexes and objects with `regex`
 * and `backref` properties. When a backreference is specified, the named or numbered backreference
 * is passed forward to the next regex or returned.
 * @memberOf XRegExp
 * @param {String} str String to search.
 * @param {Array} chain Regexes that each search for matches within preceding results.
 * @returns {Array} Matches by the last regex in the chain, or an empty array.
 * @example
 *
 * // Basic usage; matches numbers within <b> tags
 * XRegExp.matchChain('1 <b>2</b> 3 <b>4 a 56</b>', [
 *   XRegExp('(?is)<b>.*?</b>'),
 *   /\d+/
 * ]);
 * // -> ['2', '4', '56']
 *
 * // Passing forward and returning specific backreferences
 * html = '<a href="http://xregexp.com/api/">XRegExp</a>\
 *         <a href="http://www.google.com/">Google</a>';
 * XRegExp.matchChain(html, [
 *   {regex: /<a href="([^"]+)">/i, backref: 1},
 *   {regex: XRegExp('(?i)^https?://(?<domain>[^/?#]+)'), backref: 'domain'}
 * ]);
 * // -> ['xregexp.com', 'www.google.com']
 */
    self.matchChain = function (str, chain) {
        return (function recurseChain(values, level) {
            var item = chain[level].regex ? chain[level] : {regex: chain[level]},
                matches = [],
                addMatch = function (match) {
                    matches.push(item.backref ? (match[item.backref] || "") : match[0]);
                },
                i;
            for (i = 0; i < values.length; ++i) {
                self.forEach(values[i], item.regex, addMatch);
            }
            return ((level === chain.length - 1) || !matches.length) ?
                    matches :
                    recurseChain(matches, level + 1);
        }([str], 0));
    };

/**
 * Returns a new string with one or all matches of a pattern replaced. The pattern can be a string
 * or regex, and the replacement can be a string or a function to be called for each match. To
 * perform a global search and replace, use the optional `scope` argument or include flag `g` if
 * using a regex. Replacement strings can use `${n}` for named and numbered backreferences.
 * Replacement functions can use named backreferences via `arguments[0].name`. Also fixes browser
 * bugs compared to the native `String.prototype.replace` and can be used reliably cross-browser.
 * @memberOf XRegExp
 * @param {String} str String to search.
 * @param {RegExp|String} search Search pattern to be replaced.
 * @param {String|Function} replacement Replacement string or a function invoked to create it.
 *   Replacement strings can include special replacement syntax:
 *     <li>$$ - Inserts a literal '$'.
 *     <li>$&, $0 - Inserts the matched substring.
 *     <li>$` - Inserts the string that precedes the matched substring (left context).
 *     <li>$' - Inserts the string that follows the matched substring (right context).
 *     <li>$n, $nn - Where n/nn are digits referencing an existent capturing group, inserts
 *       backreference n/nn.
 *     <li>${n} - Where n is a name or any number of digits that reference an existent capturing
 *       group, inserts backreference n.
 *   Replacement functions are invoked with three or more arguments:
 *     <li>The matched substring (corresponds to $& above). Named backreferences are accessible as
 *       properties of this first argument.
 *     <li>0..n arguments, one for each backreference (corresponding to $1, $2, etc. above).
 *     <li>The zero-based index of the match within the total search string.
 *     <li>The total string being searched.
 * @param {String} [scope='one'] Use 'one' to replace the first match only, or 'all'. If not
 *   explicitly specified and using a regex with flag `g`, `scope` is 'all'.
 * @returns {String} New string with one or all matches replaced.
 * @example
 *
 * // Regex search, using named backreferences in replacement string
 * var name = XRegExp('(?<first>\\w+) (?<last>\\w+)');
 * XRegExp.replace('John Smith', name, '${last}, ${first}');
 * // -> 'Smith, John'
 *
 * // Regex search, using named backreferences in replacement function
 * XRegExp.replace('John Smith', name, function (match) {
 *   return match.last + ', ' + match.first;
 * });
 * // -> 'Smith, John'
 *
 * // Global string search/replacement
 * XRegExp.replace('RegExp builds RegExps', 'RegExp', 'XRegExp', 'all');
 * // -> 'XRegExp builds XRegExps'
 */
    self.replace = function (str, search, replacement, scope) {
        var isRegex = self.isRegExp(search),
            search2 = search,
            result;
        if (isRegex) {
            if (scope === undef && search.global) {
                scope = "all"; // Follow flag g when `scope` isn't explicit
            }
            // Note that since a copy is used, `search`'s `lastIndex` isn't updated *during* replacement iterations
            search2 = copy(search, scope === "all" ? "g" : "", scope === "all" ? "" : "g");
        } else if (scope === "all") {
            search2 = new RegExp(self.escape(String(search)), "g");
        }
        result = fixed.replace.call(String(str), search2, replacement); // Fixed `replace` required for named backreferences, etc.
        if (isRegex && search.global) {
            search.lastIndex = 0; // Fixes IE, Safari bug (last tested IE 9, Safari 5.1)
        }
        return result;
    };

/**
 * Splits a string into an array of strings using a regex or string separator. Matches of the
 * separator are not included in the result array. However, if `separator` is a regex that contains
 * capturing groups, backreferences are spliced into the result each time `separator` is matched.
 * Fixes browser bugs compared to the native `String.prototype.split` and can be used reliably
 * cross-browser.
 * @memberOf XRegExp
 * @param {String} str String to split.
 * @param {RegExp|String} separator Regex or string to use for separating the string.
 * @param {Number} [limit] Maximum number of items to include in the result array.
 * @returns {Array} Array of substrings.
 * @example
 *
 * // Basic use
 * XRegExp.split('a b c', ' ');
 * // -> ['a', 'b', 'c']
 *
 * // With limit
 * XRegExp.split('a b c', ' ', 2);
 * // -> ['a', 'b']
 *
 * // Backreferences in result array
 * XRegExp.split('..word1..', /([a-z]+)(\d+)/i);
 * // -> ['..', 'word', '1', '..']
 */
    self.split = function (str, separator, limit) {
        return fixed.split.call(str, separator, limit);
    };

/**
 * Executes a regex search in a specified string. Returns `true` or `false`. Optional `pos` and
 * `sticky` arguments specify the search start position, and whether the match must start at the
 * specified position only. The `lastIndex` property of the provided regex is not used, but is
 * updated for compatibility. Also fixes browser bugs compared to the native
 * `RegExp.prototype.test` and can be used reliably cross-browser.
 * @memberOf XRegExp
 * @param {String} str String to search.
 * @param {RegExp} regex Regex to search with.
 * @param {Number} [pos=0] Zero-based index at which to start the search.
 * @param {Boolean|String} [sticky=false] Whether the match must start at the specified position
 *   only. The string `'sticky'` is accepted as an alternative to `true`.
 * @returns {Boolean} Whether the regex matched the provided value.
 * @example
 *
 * // Basic use
 * XRegExp.test('abc', /c/); // -> true
 *
 * // With pos and sticky
 * XRegExp.test('abc', /c/, 0, 'sticky'); // -> false
 */
    self.test = function (str, regex, pos, sticky) {
        // Do this the easy way :-)
        return !!self.exec(str, regex, pos, sticky);
    };

/**
 * Uninstalls optional features according to the specified options.
 * @memberOf XRegExp
 * @param {Object|String} options Options object or string.
 * @example
 *
 * // With an options object
 * XRegExp.uninstall({
 *   // Restores native regex methods
 *   natives: true,
 *
 *   // Disables additional syntax and flag extensions
 *   extensibility: true
 * });
 *
 * // With an options string
 * XRegExp.uninstall('natives extensibility');
 *
 * // Using a shortcut to uninstall all optional features
 * XRegExp.uninstall('all');
 */
    self.uninstall = function (options) {
        options = prepareOptions(options);
        if (features.natives && options.natives) {
            setNatives(false);
        }
        if (features.extensibility && options.extensibility) {
            setExtensibility(false);
        }
    };

/**
 * Returns an XRegExp object that is the union of the given patterns. Patterns can be provided as
 * regex objects or strings. Metacharacters are escaped in patterns provided as strings.
 * Backreferences in provided regex objects are automatically renumbered to work correctly. Native
 * flags used by provided regexes are ignored in favor of the `flags` argument.
 * @memberOf XRegExp
 * @param {Array} patterns Regexes and strings to combine.
 * @param {String} [flags] Any combination of XRegExp flags.
 * @returns {RegExp} Union of the provided regexes and strings.
 * @example
 *
 * XRegExp.union(['a+b*c', /(dogs)\1/, /(cats)\1/], 'i');
 * // -> /a\+b\*c|(dogs)\1|(cats)\2/i
 *
 * XRegExp.union([XRegExp('(?<pet>dogs)\\k<pet>'), XRegExp('(?<pet>cats)\\k<pet>')]);
 * // -> XRegExp('(?<pet>dogs)\\k<pet>|(?<pet>cats)\\k<pet>')
 */
    self.union = function (patterns, flags) {
        var parts = /(\()(?!\?)|\\([1-9]\d*)|\\[\s\S]|\[(?:[^\\\]]|\\[\s\S])*]/g,
            numCaptures = 0,
            numPriorCaptures,
            captureNames,
            rewrite = function (match, paren, backref) {
                var name = captureNames[numCaptures - numPriorCaptures];
                if (paren) { // Capturing group
                    ++numCaptures;
                    if (name) { // If the current capture has a name
                        return "(?<" + name + ">";
                    }
                } else if (backref) { // Backreference
                    return "\\" + (+backref + numPriorCaptures);
                }
                return match;
            },
            output = [],
            pattern,
            i;
        if (!(isType(patterns, "array") && patterns.length)) {
            throw new TypeError("patterns must be a nonempty array");
        }
        for (i = 0; i < patterns.length; ++i) {
            pattern = patterns[i];
            if (self.isRegExp(pattern)) {
                numPriorCaptures = numCaptures;
                captureNames = (pattern.xregexp && pattern.xregexp.captureNames) || [];
                // Rewrite backreferences. Passing to XRegExp dies on octals and ensures patterns
                // are independently valid; helps keep this simple. Named captures are put back
                output.push(self(pattern.source).source.replace(parts, rewrite));
            } else {
                output.push(self.escape(pattern));
            }
        }
        return self(output.join("|"), flags);
    };

/**
 * The XRegExp version number.
 * @static
 * @memberOf XRegExp
 * @type String
 */
    self.version = "2.0.0";

/*--------------------------------------
 *  Fixed/extended native methods
 *------------------------------------*/

/**
 * Adds named capture support (with backreferences returned as `result.name`), and fixes browser
 * bugs in the native `RegExp.prototype.exec`. Calling `XRegExp.install('natives')` uses this to
 * override the native method. Use via `XRegExp.exec` without overriding natives.
 * @private
 * @param {String} str String to search.
 * @returns {Array} Match array with named backreference properties, or null.
 */
    fixed.exec = function (str) {
        var match, name, r2, origLastIndex, i;
        if (!this.global) {
            origLastIndex = this.lastIndex;
        }
        match = nativ.exec.apply(this, arguments);
        if (match) {
            // Fix browsers whose `exec` methods don't consistently return `undefined` for
            // nonparticipating capturing groups
            if (!compliantExecNpcg && match.length > 1 && lastIndexOf(match, "") > -1) {
                r2 = new RegExp(this.source, nativ.replace.call(getNativeFlags(this), "g", ""));
                // Using `str.slice(match.index)` rather than `match[0]` in case lookahead allowed
                // matching due to characters outside the match
                nativ.replace.call(String(str).slice(match.index), r2, function () {
                    var i;
                    for (i = 1; i < arguments.length - 2; ++i) {
                        if (arguments[i] === undef) {
                            match[i] = undef;
                        }
                    }
                });
            }
            // Attach named capture properties
            if (this.xregexp && this.xregexp.captureNames) {
                for (i = 1; i < match.length; ++i) {
                    name = this.xregexp.captureNames[i - 1];
                    if (name) {
                        match[name] = match[i];
                    }
                }
            }
            // Fix browsers that increment `lastIndex` after zero-length matches
            if (this.global && !match[0].length && (this.lastIndex > match.index)) {
                this.lastIndex = match.index;
            }
        }
        if (!this.global) {
            this.lastIndex = origLastIndex; // Fixes IE, Opera bug (last tested IE 9, Opera 11.6)
        }
        return match;
    };

/**
 * Fixes browser bugs in the native `RegExp.prototype.test`. Calling `XRegExp.install('natives')`
 * uses this to override the native method.
 * @private
 * @param {String} str String to search.
 * @returns {Boolean} Whether the regex matched the provided value.
 */
    fixed.test = function (str) {
        // Do this the easy way :-)
        return !!fixed.exec.call(this, str);
    };

/**
 * Adds named capture support (with backreferences returned as `result.name`), and fixes browser
 * bugs in the native `String.prototype.match`. Calling `XRegExp.install('natives')` uses this to
 * override the native method.
 * @private
 * @param {RegExp} regex Regex to search with.
 * @returns {Array} If `regex` uses flag g, an array of match strings or null. Without flag g, the
 *   result of calling `regex.exec(this)`.
 */
    fixed.match = function (regex) {
        if (!self.isRegExp(regex)) {
            regex = new RegExp(regex); // Use native `RegExp`
        } else if (regex.global) {
            var result = nativ.match.apply(this, arguments);
            regex.lastIndex = 0; // Fixes IE bug
            return result;
        }
        return fixed.exec.call(regex, this);
    };

/**
 * Adds support for `${n}` tokens for named and numbered backreferences in replacement text, and
 * provides named backreferences to replacement functions as `arguments[0].name`. Also fixes
 * browser bugs in replacement text syntax when performing a replacement using a nonregex search
 * value, and the value of a replacement regex's `lastIndex` property during replacement iterations
 * and upon completion. Note that this doesn't support SpiderMonkey's proprietary third (`flags`)
 * argument. Calling `XRegExp.install('natives')` uses this to override the native method. Use via
 * `XRegExp.replace` without overriding natives.
 * @private
 * @param {RegExp|String} search Search pattern to be replaced.
 * @param {String|Function} replacement Replacement string or a function invoked to create it.
 * @returns {String} New string with one or all matches replaced.
 */
    fixed.replace = function (search, replacement) {
        var isRegex = self.isRegExp(search), captureNames, result, str, origLastIndex;
        if (isRegex) {
            if (search.xregexp) {
                captureNames = search.xregexp.captureNames;
            }
            if (!search.global) {
                origLastIndex = search.lastIndex;
            }
        } else {
            search += "";
        }
        if (isType(replacement, "function")) {
            result = nativ.replace.call(String(this), search, function () {
                var args = arguments, i;
                if (captureNames) {
                    // Change the `arguments[0]` string primitive to a `String` object that can store properties
                    args[0] = new String(args[0]);
                    // Store named backreferences on the first argument
                    for (i = 0; i < captureNames.length; ++i) {
                        if (captureNames[i]) {
                            args[0][captureNames[i]] = args[i + 1];
                        }
                    }
                }
                // Update `lastIndex` before calling `replacement`.
                // Fixes IE, Chrome, Firefox, Safari bug (last tested IE 9, Chrome 17, Firefox 11, Safari 5.1)
                if (isRegex && search.global) {
                    search.lastIndex = args[args.length - 2] + args[0].length;
                }
                return replacement.apply(null, args);
            });
        } else {
            str = String(this); // Ensure `args[args.length - 1]` will be a string when given nonstring `this`
            result = nativ.replace.call(str, search, function () {
                var args = arguments; // Keep this function's `arguments` available through closure
                return nativ.replace.call(String(replacement), replacementToken, function ($0, $1, $2) {
                    var n;
                    // Named or numbered backreference with curly brackets
                    if ($1) {
                        /* XRegExp behavior for `${n}`:
                         * 1. Backreference to numbered capture, where `n` is 1+ digits. `0`, `00`, etc. is the entire match.
                         * 2. Backreference to named capture `n`, if it exists and is not a number overridden by numbered capture.
                         * 3. Otherwise, it's an error.
                         */
                        n = +$1; // Type-convert; drop leading zeros
                        if (n <= args.length - 3) {
                            return args[n] || "";
                        }
                        n = captureNames ? lastIndexOf(captureNames, $1) : -1;
                        if (n < 0) {
                            throw new SyntaxError("backreference to undefined group " + $0);
                        }
                        return args[n + 1] || "";
                    }
                    // Else, special variable or numbered backreference (without curly brackets)
                    if ($2 === "$") return "$";
                    if ($2 === "&" || +$2 === 0) return args[0]; // $&, $0 (not followed by 1-9), $00
                    if ($2 === "`") return args[args.length - 1].slice(0, args[args.length - 2]);
                    if ($2 === "'") return args[args.length - 1].slice(args[args.length - 2] + args[0].length);
                    // Else, numbered backreference (without curly brackets)
                    $2 = +$2; // Type-convert; drop leading zero
                    /* XRegExp behavior:
                     * - Backreferences without curly brackets end after 1 or 2 digits. Use `${..}` for more digits.
                     * - `$1` is an error if there are no capturing groups.
                     * - `$10` is an error if there are less than 10 capturing groups. Use `${1}0` instead.
                     * - `$01` is equivalent to `$1` if a capturing group exists, otherwise it's an error.
                     * - `$0` (not followed by 1-9), `$00`, and `$&` are the entire match.
                     * Native behavior, for comparison:
                     * - Backreferences end after 1 or 2 digits. Cannot use backreference to capturing group 100+.
                     * - `$1` is a literal `$1` if there are no capturing groups.
                     * - `$10` is `$1` followed by a literal `0` if there are less than 10 capturing groups.
                     * - `$01` is equivalent to `$1` if a capturing group exists, otherwise it's a literal `$01`.
                     * - `$0` is a literal `$0`. `$&` is the entire match.
                     */
                    if (!isNaN($2)) {
                        if ($2 > args.length - 3) {
                            throw new SyntaxError("backreference to undefined group " + $0);
                        }
                        return args[$2] || "";
                    }
                    throw new SyntaxError("invalid token " + $0);
                });
            });
        }
        if (isRegex) {
            if (search.global) {
                search.lastIndex = 0; // Fixes IE, Safari bug (last tested IE 9, Safari 5.1)
            } else {
                search.lastIndex = origLastIndex; // Fixes IE, Opera bug (last tested IE 9, Opera 11.6)
            }
        }
        return result;
    };

/**
 * Fixes browser bugs in the native `String.prototype.split`. Calling `XRegExp.install('natives')`
 * uses this to override the native method. Use via `XRegExp.split` without overriding natives.
 * @private
 * @param {RegExp|String} separator Regex or string to use for separating the string.
 * @param {Number} [limit] Maximum number of items to include in the result array.
 * @returns {Array} Array of substrings.
 */
    fixed.split = function (separator, limit) {
        if (!self.isRegExp(separator)) {
            return nativ.split.apply(this, arguments); // use faster native method
        }
        var str = String(this),
            origLastIndex = separator.lastIndex,
            output = [],
            lastLastIndex = 0,
            lastLength;
        /* Values for `limit`, per the spec:
         * If undefined: pow(2,32) - 1
         * If 0, Infinity, or NaN: 0
         * If positive number: limit = floor(limit); if (limit >= pow(2,32)) limit -= pow(2,32);
         * If negative number: pow(2,32) - floor(abs(limit))
         * If other: Type-convert, then use the above rules
         */
        limit = (limit === undef ? -1 : limit) >>> 0;
        self.forEach(str, separator, function (match) {
            if ((match.index + match[0].length) > lastLastIndex) { // != `if (match[0].length)`
                output.push(str.slice(lastLastIndex, match.index));
                if (match.length > 1 && match.index < str.length) {
                    Array.prototype.push.apply(output, match.slice(1));
                }
                lastLength = match[0].length;
                lastLastIndex = match.index + lastLength;
            }
        });
        if (lastLastIndex === str.length) {
            if (!nativ.test.call(separator, "") || lastLength) {
                output.push("");
            }
        } else {
            output.push(str.slice(lastLastIndex));
        }
        separator.lastIndex = origLastIndex;
        return output.length > limit ? output.slice(0, limit) : output;
    };

/*--------------------------------------
 *  Built-in tokens
 *------------------------------------*/

// Shortcut
    add = addToken.on;

/* Letter identity escapes that natively match literal characters: \p, \P, etc.
 * Should be SyntaxErrors but are allowed in web reality. XRegExp makes them errors for cross-
 * browser consistency and to reserve their syntax, but lets them be superseded by XRegExp addons.
 */
    add(/\\([ABCE-RTUVXYZaeg-mopqyz]|c(?![A-Za-z])|u(?![\dA-Fa-f]{4})|x(?![\dA-Fa-f]{2}))/,
        function (match, scope) {
            // \B is allowed in default scope only
            if (match[1] === "B" && scope === defaultScope) {
                return match[0];
            }
            throw new SyntaxError("invalid escape " + match[0]);
        },
        {scope: "all"});

/* Empty character class: [] or [^]
 * Fixes a critical cross-browser syntax inconsistency. Unless this is standardized (per the spec),
 * regex syntax can't be accurately parsed because character class endings can't be determined.
 */
    add(/\[(\^?)]/,
        function (match) {
            // For cross-browser compatibility with ES3, convert [] to \b\B and [^] to [\s\S].
            // (?!) should work like \b\B, but is unreliable in Firefox
            return match[1] ? "[\\s\\S]" : "\\b\\B";
        });

/* Comment pattern: (?# )
 * Inline comments are an alternative to the line comments allowed in free-spacing mode (flag x).
 */
    add(/(?:\(\?#[^)]*\))+/,
        function (match) {
            // Keep tokens separated unless the following token is a quantifier
            return nativ.test.call(quantifier, match.input.slice(match.index + match[0].length)) ? "" : "(?:)";
        });

/* Named backreference: \k<name>
 * Backreference names can use the characters A-Z, a-z, 0-9, _, and $ only.
 */
    add(/\\k<([\w$]+)>/,
        function (match) {
            var index = isNaN(match[1]) ? (lastIndexOf(this.captureNames, match[1]) + 1) : +match[1],
                endIndex = match.index + match[0].length;
            if (!index || index > this.captureNames.length) {
                throw new SyntaxError("backreference to undefined group " + match[0]);
            }
            // Keep backreferences separate from subsequent literal numbers
            return "\\" + index + (
                endIndex === match.input.length || isNaN(match.input.charAt(endIndex)) ? "" : "(?:)"
            );
        });

/* Whitespace and line comments, in free-spacing mode (aka extended mode, flag x) only.
 */
    add(/(?:\s+|#.*)+/,
        function (match) {
            // Keep tokens separated unless the following token is a quantifier
            return nativ.test.call(quantifier, match.input.slice(match.index + match[0].length)) ? "" : "(?:)";
        },
        {
            trigger: function () {
                return this.hasFlag("x");
            },
            customFlags: "x"
        });

/* Dot, in dotall mode (aka singleline mode, flag s) only.
 */
    add(/\./,
        function () {
            return "[\\s\\S]";
        },
        {
            trigger: function () {
                return this.hasFlag("s");
            },
            customFlags: "s"
        });

/* Named capturing group; match the opening delimiter only: (?<name>
 * Capture names can use the characters A-Z, a-z, 0-9, _, and $ only. Names can't be integers.
 * Supports Python-style (?P<name> as an alternate syntax to avoid issues in recent Opera (which
 * natively supports the Python-style syntax). Otherwise, XRegExp might treat numbered
 * backreferences to Python-style named capture as octals.
 */
    add(/\(\?P?<([\w$]+)>/,
        function (match) {
            if (!isNaN(match[1])) {
                // Avoid incorrect lookups, since named backreferences are added to match arrays
                throw new SyntaxError("can't use integer as capture name " + match[0]);
            }
            this.captureNames.push(match[1]);
            this.hasNamedCapture = true;
            return "(";
        });

/* Numbered backreference or octal, plus any following digits: \0, \11, etc.
 * Octals except \0 not followed by 0-9 and backreferences to unopened capture groups throw an
 * error. Other matches are returned unaltered. IE <= 8 doesn't support backreferences greater than
 * \99 in regex syntax.
 */
    add(/\\(\d+)/,
        function (match, scope) {
            if (!(scope === defaultScope && /^[1-9]/.test(match[1]) && +match[1] <= this.captureNames.length) &&
                    match[1] !== "0") {
                throw new SyntaxError("can't use octal escape or backreference to undefined group " + match[0]);
            }
            return match[0];
        },
        {scope: "all"});

/* Capturing group; match the opening parenthesis only.
 * Required for support of named capturing groups. Also adds explicit capture mode (flag n).
 */
    add(/\((?!\?)/,
        function () {
            if (this.hasFlag("n")) {
                return "(?:";
            }
            this.captureNames.push(null);
            return "(";
        },
        {customFlags: "n"});

/*--------------------------------------
 *  Expose XRegExp
 *------------------------------------*/

// For CommonJS enviroments
    if (typeof exports !== "undefined") {
        exports.XRegExp = self;
    }

    return self;

}());


/***** unicode-base.js *****/

/*!
 * XRegExp Unicode Base v1.0.0
 * (c) 2008-2012 Steven Levithan <http://xregexp.com/>
 * MIT License
 * Uses Unicode 6.1 <http://unicode.org/>
 */

/**
 * Adds support for the `\p{L}` or `\p{Letter}` Unicode category. Addon packages for other Unicode
 * categories, scripts, blocks, and properties are available separately. All Unicode tokens can be
 * inverted using `\P{..}` or `\p{^..}`. Token names are case insensitive, and any spaces, hyphens,
 * and underscores are ignored.
 * @requires XRegExp
 */
(function (XRegExp) {
    "use strict";

    var unicode = {};

/*--------------------------------------
 *  Private helper functions
 *------------------------------------*/

// Generates a standardized token name (lowercase, with hyphens, spaces, and underscores removed)
    function slug(name) {
        return name.replace(/[- _]+/g, "").toLowerCase();
    }

// Expands a list of Unicode code points and ranges to be usable in a regex character class
    function expand(str) {
        return str.replace(/\w{4}/g, "\\u$&");
    }

// Adds leading zeros if shorter than four characters
    function pad4(str) {
        while (str.length < 4) {
            str = "0" + str;
        }
        return str;
    }

// Converts a hexadecimal number to decimal
    function dec(hex) {
        return parseInt(hex, 16);
    }

// Converts a decimal number to hexadecimal
    function hex(dec) {
        return parseInt(dec, 10).toString(16);
    }

// Inverts a list of Unicode code points and ranges
    function invert(range) {
        var output = [],
            lastEnd = -1,
            start;
        XRegExp.forEach(range, /\\u(\w{4})(?:-\\u(\w{4}))?/, function (m) {
            start = dec(m[1]);
            if (start > (lastEnd + 1)) {
                output.push("\\u" + pad4(hex(lastEnd + 1)));
                if (start > (lastEnd + 2)) {
                    output.push("-\\u" + pad4(hex(start - 1)));
                }
            }
            lastEnd = dec(m[2] || m[1]);
        });
        if (lastEnd < 0xFFFF) {
            output.push("\\u" + pad4(hex(lastEnd + 1)));
            if (lastEnd < 0xFFFE) {
                output.push("-\\uFFFF");
            }
        }
        return output.join("");
    }

// Generates an inverted token on first use
    function cacheInversion(item) {
        return unicode["^" + item] || (unicode["^" + item] = invert(unicode[item]));
    }

/*--------------------------------------
 *  Core functionality
 *------------------------------------*/

    XRegExp.install("extensibility");

/**
 * Adds to the list of Unicode properties that XRegExp regexes can match via \p{..} or \P{..}.
 * @memberOf XRegExp
 * @param {Object} pack Named sets of Unicode code points and ranges.
 * @param {Object} [aliases] Aliases for the primary token names.
 * @example
 *
 * XRegExp.addUnicodePackage({
 *   XDigit: '0030-00390041-00460061-0066' // 0-9A-Fa-f
 * }, {
 *   XDigit: 'Hexadecimal'
 * });
 */
    XRegExp.addUnicodePackage = function (pack, aliases) {
        var p;
        if (!XRegExp.isInstalled("extensibility")) {
            throw new Error("extensibility must be installed before adding Unicode packages");
        }
        if (pack) {
            for (p in pack) {
                if (pack.hasOwnProperty(p)) {
                    unicode[slug(p)] = expand(pack[p]);
                }
            }
        }
        if (aliases) {
            for (p in aliases) {
                if (aliases.hasOwnProperty(p)) {
                    unicode[slug(aliases[p])] = unicode[slug(p)];
                }
            }
        }
    };

/* Adds data for the Unicode `Letter` category. Addon packages include other categories, scripts,
 * blocks, and properties.
 */
    XRegExp.addUnicodePackage({
        L: "0041-005A0061-007A00AA00B500BA00C0-00D600D8-00F600F8-02C102C6-02D102E0-02E402EC02EE0370-037403760377037A-037D03860388-038A038C038E-03A103A3-03F503F7-0481048A-05270531-055605590561-058705D0-05EA05F0-05F20620-064A066E066F0671-06D306D506E506E606EE06EF06FA-06FC06FF07100712-072F074D-07A507B107CA-07EA07F407F507FA0800-0815081A082408280840-085808A008A2-08AC0904-0939093D09500958-09610971-09770979-097F0985-098C098F09900993-09A809AA-09B009B209B6-09B909BD09CE09DC09DD09DF-09E109F009F10A05-0A0A0A0F0A100A13-0A280A2A-0A300A320A330A350A360A380A390A59-0A5C0A5E0A72-0A740A85-0A8D0A8F-0A910A93-0AA80AAA-0AB00AB20AB30AB5-0AB90ABD0AD00AE00AE10B05-0B0C0B0F0B100B13-0B280B2A-0B300B320B330B35-0B390B3D0B5C0B5D0B5F-0B610B710B830B85-0B8A0B8E-0B900B92-0B950B990B9A0B9C0B9E0B9F0BA30BA40BA8-0BAA0BAE-0BB90BD00C05-0C0C0C0E-0C100C12-0C280C2A-0C330C35-0C390C3D0C580C590C600C610C85-0C8C0C8E-0C900C92-0CA80CAA-0CB30CB5-0CB90CBD0CDE0CE00CE10CF10CF20D05-0D0C0D0E-0D100D12-0D3A0D3D0D4E0D600D610D7A-0D7F0D85-0D960D9A-0DB10DB3-0DBB0DBD0DC0-0DC60E01-0E300E320E330E40-0E460E810E820E840E870E880E8A0E8D0E94-0E970E99-0E9F0EA1-0EA30EA50EA70EAA0EAB0EAD-0EB00EB20EB30EBD0EC0-0EC40EC60EDC-0EDF0F000F40-0F470F49-0F6C0F88-0F8C1000-102A103F1050-1055105A-105D106110651066106E-10701075-1081108E10A0-10C510C710CD10D0-10FA10FC-1248124A-124D1250-12561258125A-125D1260-1288128A-128D1290-12B012B2-12B512B8-12BE12C012C2-12C512C8-12D612D8-13101312-13151318-135A1380-138F13A0-13F41401-166C166F-167F1681-169A16A0-16EA1700-170C170E-17111720-17311740-17511760-176C176E-17701780-17B317D717DC1820-18771880-18A818AA18B0-18F51900-191C1950-196D1970-19741980-19AB19C1-19C71A00-1A161A20-1A541AA71B05-1B331B45-1B4B1B83-1BA01BAE1BAF1BBA-1BE51C00-1C231C4D-1C4F1C5A-1C7D1CE9-1CEC1CEE-1CF11CF51CF61D00-1DBF1E00-1F151F18-1F1D1F20-1F451F48-1F4D1F50-1F571F591F5B1F5D1F5F-1F7D1F80-1FB41FB6-1FBC1FBE1FC2-1FC41FC6-1FCC1FD0-1FD31FD6-1FDB1FE0-1FEC1FF2-1FF41FF6-1FFC2071207F2090-209C21022107210A-211321152119-211D212421262128212A-212D212F-2139213C-213F2145-2149214E218321842C00-2C2E2C30-2C5E2C60-2CE42CEB-2CEE2CF22CF32D00-2D252D272D2D2D30-2D672D6F2D80-2D962DA0-2DA62DA8-2DAE2DB0-2DB62DB8-2DBE2DC0-2DC62DC8-2DCE2DD0-2DD62DD8-2DDE2E2F300530063031-3035303B303C3041-3096309D-309F30A1-30FA30FC-30FF3105-312D3131-318E31A0-31BA31F0-31FF3400-4DB54E00-9FCCA000-A48CA4D0-A4FDA500-A60CA610-A61FA62AA62BA640-A66EA67F-A697A6A0-A6E5A717-A71FA722-A788A78B-A78EA790-A793A7A0-A7AAA7F8-A801A803-A805A807-A80AA80C-A822A840-A873A882-A8B3A8F2-A8F7A8FBA90A-A925A930-A946A960-A97CA984-A9B2A9CFAA00-AA28AA40-AA42AA44-AA4BAA60-AA76AA7AAA80-AAAFAAB1AAB5AAB6AAB9-AABDAAC0AAC2AADB-AADDAAE0-AAEAAAF2-AAF4AB01-AB06AB09-AB0EAB11-AB16AB20-AB26AB28-AB2EABC0-ABE2AC00-D7A3D7B0-D7C6D7CB-D7FBF900-FA6DFA70-FAD9FB00-FB06FB13-FB17FB1DFB1F-FB28FB2A-FB36FB38-FB3CFB3EFB40FB41FB43FB44FB46-FBB1FBD3-FD3DFD50-FD8FFD92-FDC7FDF0-FDFBFE70-FE74FE76-FEFCFF21-FF3AFF41-FF5AFF66-FFBEFFC2-FFC7FFCA-FFCFFFD2-FFD7FFDA-FFDC"
    }, {
        L: "Letter"
    });

/* Adds Unicode property syntax to XRegExp: \p{..}, \P{..}, \p{^..}
 */
    XRegExp.addToken(
        /\\([pP]){(\^?)([^}]*)}/,
        function (match, scope) {
            var inv = (match[1] === "P" || match[2]) ? "^" : "",
                item = slug(match[3]);
            // The double negative \P{^..} is invalid
            if (match[1] === "P" && match[2]) {
                throw new SyntaxError("invalid double negation \\P{^");
            }
            if (!unicode.hasOwnProperty(item)) {
                throw new SyntaxError("invalid or unknown Unicode property " + match[0]);
            }
            return scope === "class" ?
                    (inv ? cacheInversion(item) : unicode[item]) :
                    "[" + inv + unicode[item] + "]";
        },
        {scope: "all"}
    );

}(XRegExp));


/***** unicode-categories.js *****/

/*!
 * XRegExp Unicode Categories v1.2.0
 * (c) 2010-2012 Steven Levithan <http://xregexp.com/>
 * MIT License
 * Uses Unicode 6.1 <http://unicode.org/>
 */

/**
 * Adds support for all Unicode categories (aka properties) E.g., `\p{Lu}` or
 * `\p{Uppercase Letter}`. Token names are case insensitive, and any spaces, hyphens, and
 * underscores are ignored.
 * @requires XRegExp, XRegExp Unicode Base
 */
(function (XRegExp) {
    "use strict";

    if (!XRegExp.addUnicodePackage) {
        throw new ReferenceError("Unicode Base must be loaded before Unicode Categories");
    }

    XRegExp.install("extensibility");

    XRegExp.addUnicodePackage({
        //L: "", // Included in the Unicode Base addon
        Ll: "0061-007A00B500DF-00F600F8-00FF01010103010501070109010B010D010F01110113011501170119011B011D011F01210123012501270129012B012D012F01310133013501370138013A013C013E014001420144014601480149014B014D014F01510153015501570159015B015D015F01610163016501670169016B016D016F0171017301750177017A017C017E-0180018301850188018C018D019201950199-019B019E01A101A301A501A801AA01AB01AD01B001B401B601B901BA01BD-01BF01C601C901CC01CE01D001D201D401D601D801DA01DC01DD01DF01E101E301E501E701E901EB01ED01EF01F001F301F501F901FB01FD01FF02010203020502070209020B020D020F02110213021502170219021B021D021F02210223022502270229022B022D022F02310233-0239023C023F0240024202470249024B024D024F-02930295-02AF037103730377037B-037D039003AC-03CE03D003D103D5-03D703D903DB03DD03DF03E103E303E503E703E903EB03ED03EF-03F303F503F803FB03FC0430-045F04610463046504670469046B046D046F04710473047504770479047B047D047F0481048B048D048F04910493049504970499049B049D049F04A104A304A504A704A904AB04AD04AF04B104B304B504B704B904BB04BD04BF04C204C404C604C804CA04CC04CE04CF04D104D304D504D704D904DB04DD04DF04E104E304E504E704E904EB04ED04EF04F104F304F504F704F904FB04FD04FF05010503050505070509050B050D050F05110513051505170519051B051D051F05210523052505270561-05871D00-1D2B1D6B-1D771D79-1D9A1E011E031E051E071E091E0B1E0D1E0F1E111E131E151E171E191E1B1E1D1E1F1E211E231E251E271E291E2B1E2D1E2F1E311E331E351E371E391E3B1E3D1E3F1E411E431E451E471E491E4B1E4D1E4F1E511E531E551E571E591E5B1E5D1E5F1E611E631E651E671E691E6B1E6D1E6F1E711E731E751E771E791E7B1E7D1E7F1E811E831E851E871E891E8B1E8D1E8F1E911E931E95-1E9D1E9F1EA11EA31EA51EA71EA91EAB1EAD1EAF1EB11EB31EB51EB71EB91EBB1EBD1EBF1EC11EC31EC51EC71EC91ECB1ECD1ECF1ED11ED31ED51ED71ED91EDB1EDD1EDF1EE11EE31EE51EE71EE91EEB1EED1EEF1EF11EF31EF51EF71EF91EFB1EFD1EFF-1F071F10-1F151F20-1F271F30-1F371F40-1F451F50-1F571F60-1F671F70-1F7D1F80-1F871F90-1F971FA0-1FA71FB0-1FB41FB61FB71FBE1FC2-1FC41FC61FC71FD0-1FD31FD61FD71FE0-1FE71FF2-1FF41FF61FF7210A210E210F2113212F21342139213C213D2146-2149214E21842C30-2C5E2C612C652C662C682C6A2C6C2C712C732C742C76-2C7B2C812C832C852C872C892C8B2C8D2C8F2C912C932C952C972C992C9B2C9D2C9F2CA12CA32CA52CA72CA92CAB2CAD2CAF2CB12CB32CB52CB72CB92CBB2CBD2CBF2CC12CC32CC52CC72CC92CCB2CCD2CCF2CD12CD32CD52CD72CD92CDB2CDD2CDF2CE12CE32CE42CEC2CEE2CF32D00-2D252D272D2DA641A643A645A647A649A64BA64DA64FA651A653A655A657A659A65BA65DA65FA661A663A665A667A669A66BA66DA681A683A685A687A689A68BA68DA68FA691A693A695A697A723A725A727A729A72BA72DA72F-A731A733A735A737A739A73BA73DA73FA741A743A745A747A749A74BA74DA74FA751A753A755A757A759A75BA75DA75FA761A763A765A767A769A76BA76DA76FA771-A778A77AA77CA77FA781A783A785A787A78CA78EA791A793A7A1A7A3A7A5A7A7A7A9A7FAFB00-FB06FB13-FB17FF41-FF5A",
        Lu: "0041-005A00C0-00D600D8-00DE01000102010401060108010A010C010E01100112011401160118011A011C011E01200122012401260128012A012C012E01300132013401360139013B013D013F0141014301450147014A014C014E01500152015401560158015A015C015E01600162016401660168016A016C016E017001720174017601780179017B017D018101820184018601870189-018B018E-0191019301940196-0198019C019D019F01A001A201A401A601A701A901AC01AE01AF01B1-01B301B501B701B801BC01C401C701CA01CD01CF01D101D301D501D701D901DB01DE01E001E201E401E601E801EA01EC01EE01F101F401F6-01F801FA01FC01FE02000202020402060208020A020C020E02100212021402160218021A021C021E02200222022402260228022A022C022E02300232023A023B023D023E02410243-02460248024A024C024E03700372037603860388-038A038C038E038F0391-03A103A3-03AB03CF03D2-03D403D803DA03DC03DE03E003E203E403E603E803EA03EC03EE03F403F703F903FA03FD-042F04600462046404660468046A046C046E04700472047404760478047A047C047E0480048A048C048E04900492049404960498049A049C049E04A004A204A404A604A804AA04AC04AE04B004B204B404B604B804BA04BC04BE04C004C104C304C504C704C904CB04CD04D004D204D404D604D804DA04DC04DE04E004E204E404E604E804EA04EC04EE04F004F204F404F604F804FA04FC04FE05000502050405060508050A050C050E05100512051405160518051A051C051E05200522052405260531-055610A0-10C510C710CD1E001E021E041E061E081E0A1E0C1E0E1E101E121E141E161E181E1A1E1C1E1E1E201E221E241E261E281E2A1E2C1E2E1E301E321E341E361E381E3A1E3C1E3E1E401E421E441E461E481E4A1E4C1E4E1E501E521E541E561E581E5A1E5C1E5E1E601E621E641E661E681E6A1E6C1E6E1E701E721E741E761E781E7A1E7C1E7E1E801E821E841E861E881E8A1E8C1E8E1E901E921E941E9E1EA01EA21EA41EA61EA81EAA1EAC1EAE1EB01EB21EB41EB61EB81EBA1EBC1EBE1EC01EC21EC41EC61EC81ECA1ECC1ECE1ED01ED21ED41ED61ED81EDA1EDC1EDE1EE01EE21EE41EE61EE81EEA1EEC1EEE1EF01EF21EF41EF61EF81EFA1EFC1EFE1F08-1F0F1F18-1F1D1F28-1F2F1F38-1F3F1F48-1F4D1F591F5B1F5D1F5F1F68-1F6F1FB8-1FBB1FC8-1FCB1FD8-1FDB1FE8-1FEC1FF8-1FFB21022107210B-210D2110-211221152119-211D212421262128212A-212D2130-2133213E213F214521832C00-2C2E2C602C62-2C642C672C692C6B2C6D-2C702C722C752C7E-2C802C822C842C862C882C8A2C8C2C8E2C902C922C942C962C982C9A2C9C2C9E2CA02CA22CA42CA62CA82CAA2CAC2CAE2CB02CB22CB42CB62CB82CBA2CBC2CBE2CC02CC22CC42CC62CC82CCA2CCC2CCE2CD02CD22CD42CD62CD82CDA2CDC2CDE2CE02CE22CEB2CED2CF2A640A642A644A646A648A64AA64CA64EA650A652A654A656A658A65AA65CA65EA660A662A664A666A668A66AA66CA680A682A684A686A688A68AA68CA68EA690A692A694A696A722A724A726A728A72AA72CA72EA732A734A736A738A73AA73CA73EA740A742A744A746A748A74AA74CA74EA750A752A754A756A758A75AA75CA75EA760A762A764A766A768A76AA76CA76EA779A77BA77DA77EA780A782A784A786A78BA78DA790A792A7A0A7A2A7A4A7A6A7A8A7AAFF21-FF3A",
        Lt: "01C501C801CB01F21F88-1F8F1F98-1F9F1FA8-1FAF1FBC1FCC1FFC",
        Lm: "02B0-02C102C6-02D102E0-02E402EC02EE0374037A0559064006E506E607F407F507FA081A0824082809710E460EC610FC17D718431AA71C78-1C7D1D2C-1D6A1D781D9B-1DBF2071207F2090-209C2C7C2C7D2D6F2E2F30053031-3035303B309D309E30FC-30FEA015A4F8-A4FDA60CA67FA717-A71FA770A788A7F8A7F9A9CFAA70AADDAAF3AAF4FF70FF9EFF9F",
        Lo: "00AA00BA01BB01C0-01C3029405D0-05EA05F0-05F20620-063F0641-064A066E066F0671-06D306D506EE06EF06FA-06FC06FF07100712-072F074D-07A507B107CA-07EA0800-08150840-085808A008A2-08AC0904-0939093D09500958-09610972-09770979-097F0985-098C098F09900993-09A809AA-09B009B209B6-09B909BD09CE09DC09DD09DF-09E109F009F10A05-0A0A0A0F0A100A13-0A280A2A-0A300A320A330A350A360A380A390A59-0A5C0A5E0A72-0A740A85-0A8D0A8F-0A910A93-0AA80AAA-0AB00AB20AB30AB5-0AB90ABD0AD00AE00AE10B05-0B0C0B0F0B100B13-0B280B2A-0B300B320B330B35-0B390B3D0B5C0B5D0B5F-0B610B710B830B85-0B8A0B8E-0B900B92-0B950B990B9A0B9C0B9E0B9F0BA30BA40BA8-0BAA0BAE-0BB90BD00C05-0C0C0C0E-0C100C12-0C280C2A-0C330C35-0C390C3D0C580C590C600C610C85-0C8C0C8E-0C900C92-0CA80CAA-0CB30CB5-0CB90CBD0CDE0CE00CE10CF10CF20D05-0D0C0D0E-0D100D12-0D3A0D3D0D4E0D600D610D7A-0D7F0D85-0D960D9A-0DB10DB3-0DBB0DBD0DC0-0DC60E01-0E300E320E330E40-0E450E810E820E840E870E880E8A0E8D0E94-0E970E99-0E9F0EA1-0EA30EA50EA70EAA0EAB0EAD-0EB00EB20EB30EBD0EC0-0EC40EDC-0EDF0F000F40-0F470F49-0F6C0F88-0F8C1000-102A103F1050-1055105A-105D106110651066106E-10701075-1081108E10D0-10FA10FD-1248124A-124D1250-12561258125A-125D1260-1288128A-128D1290-12B012B2-12B512B8-12BE12C012C2-12C512C8-12D612D8-13101312-13151318-135A1380-138F13A0-13F41401-166C166F-167F1681-169A16A0-16EA1700-170C170E-17111720-17311740-17511760-176C176E-17701780-17B317DC1820-18421844-18771880-18A818AA18B0-18F51900-191C1950-196D1970-19741980-19AB19C1-19C71A00-1A161A20-1A541B05-1B331B45-1B4B1B83-1BA01BAE1BAF1BBA-1BE51C00-1C231C4D-1C4F1C5A-1C771CE9-1CEC1CEE-1CF11CF51CF62135-21382D30-2D672D80-2D962DA0-2DA62DA8-2DAE2DB0-2DB62DB8-2DBE2DC0-2DC62DC8-2DCE2DD0-2DD62DD8-2DDE3006303C3041-3096309F30A1-30FA30FF3105-312D3131-318E31A0-31BA31F0-31FF3400-4DB54E00-9FCCA000-A014A016-A48CA4D0-A4F7A500-A60BA610-A61FA62AA62BA66EA6A0-A6E5A7FB-A801A803-A805A807-A80AA80C-A822A840-A873A882-A8B3A8F2-A8F7A8FBA90A-A925A930-A946A960-A97CA984-A9B2AA00-AA28AA40-AA42AA44-AA4BAA60-AA6FAA71-AA76AA7AAA80-AAAFAAB1AAB5AAB6AAB9-AABDAAC0AAC2AADBAADCAAE0-AAEAAAF2AB01-AB06AB09-AB0EAB11-AB16AB20-AB26AB28-AB2EABC0-ABE2AC00-D7A3D7B0-D7C6D7CB-D7FBF900-FA6DFA70-FAD9FB1DFB1F-FB28FB2A-FB36FB38-FB3CFB3EFB40FB41FB43FB44FB46-FBB1FBD3-FD3DFD50-FD8FFD92-FDC7FDF0-FDFBFE70-FE74FE76-FEFCFF66-FF6FFF71-FF9DFFA0-FFBEFFC2-FFC7FFCA-FFCFFFD2-FFD7FFDA-FFDC",
        M: "0300-036F0483-04890591-05BD05BF05C105C205C405C505C70610-061A064B-065F067006D6-06DC06DF-06E406E706E806EA-06ED07110730-074A07A6-07B007EB-07F30816-0819081B-08230825-08270829-082D0859-085B08E4-08FE0900-0903093A-093C093E-094F0951-0957096209630981-098309BC09BE-09C409C709C809CB-09CD09D709E209E30A01-0A030A3C0A3E-0A420A470A480A4B-0A4D0A510A700A710A750A81-0A830ABC0ABE-0AC50AC7-0AC90ACB-0ACD0AE20AE30B01-0B030B3C0B3E-0B440B470B480B4B-0B4D0B560B570B620B630B820BBE-0BC20BC6-0BC80BCA-0BCD0BD70C01-0C030C3E-0C440C46-0C480C4A-0C4D0C550C560C620C630C820C830CBC0CBE-0CC40CC6-0CC80CCA-0CCD0CD50CD60CE20CE30D020D030D3E-0D440D46-0D480D4A-0D4D0D570D620D630D820D830DCA0DCF-0DD40DD60DD8-0DDF0DF20DF30E310E34-0E3A0E47-0E4E0EB10EB4-0EB90EBB0EBC0EC8-0ECD0F180F190F350F370F390F3E0F3F0F71-0F840F860F870F8D-0F970F99-0FBC0FC6102B-103E1056-1059105E-10601062-10641067-106D1071-10741082-108D108F109A-109D135D-135F1712-17141732-1734175217531772177317B4-17D317DD180B-180D18A91920-192B1930-193B19B0-19C019C819C91A17-1A1B1A55-1A5E1A60-1A7C1A7F1B00-1B041B34-1B441B6B-1B731B80-1B821BA1-1BAD1BE6-1BF31C24-1C371CD0-1CD21CD4-1CE81CED1CF2-1CF41DC0-1DE61DFC-1DFF20D0-20F02CEF-2CF12D7F2DE0-2DFF302A-302F3099309AA66F-A672A674-A67DA69FA6F0A6F1A802A806A80BA823-A827A880A881A8B4-A8C4A8E0-A8F1A926-A92DA947-A953A980-A983A9B3-A9C0AA29-AA36AA43AA4CAA4DAA7BAAB0AAB2-AAB4AAB7AAB8AABEAABFAAC1AAEB-AAEFAAF5AAF6ABE3-ABEAABECABEDFB1EFE00-FE0FFE20-FE26",
        Mn: "0300-036F0483-04870591-05BD05BF05C105C205C405C505C70610-061A064B-065F067006D6-06DC06DF-06E406E706E806EA-06ED07110730-074A07A6-07B007EB-07F30816-0819081B-08230825-08270829-082D0859-085B08E4-08FE0900-0902093A093C0941-0948094D0951-095709620963098109BC09C1-09C409CD09E209E30A010A020A3C0A410A420A470A480A4B-0A4D0A510A700A710A750A810A820ABC0AC1-0AC50AC70AC80ACD0AE20AE30B010B3C0B3F0B41-0B440B4D0B560B620B630B820BC00BCD0C3E-0C400C46-0C480C4A-0C4D0C550C560C620C630CBC0CBF0CC60CCC0CCD0CE20CE30D41-0D440D4D0D620D630DCA0DD2-0DD40DD60E310E34-0E3A0E47-0E4E0EB10EB4-0EB90EBB0EBC0EC8-0ECD0F180F190F350F370F390F71-0F7E0F80-0F840F860F870F8D-0F970F99-0FBC0FC6102D-10301032-10371039103A103D103E10581059105E-10601071-1074108210851086108D109D135D-135F1712-17141732-1734175217531772177317B417B517B7-17BD17C617C9-17D317DD180B-180D18A91920-19221927192819321939-193B1A171A181A561A58-1A5E1A601A621A65-1A6C1A73-1A7C1A7F1B00-1B031B341B36-1B3A1B3C1B421B6B-1B731B801B811BA2-1BA51BA81BA91BAB1BE61BE81BE91BED1BEF-1BF11C2C-1C331C361C371CD0-1CD21CD4-1CE01CE2-1CE81CED1CF41DC0-1DE61DFC-1DFF20D0-20DC20E120E5-20F02CEF-2CF12D7F2DE0-2DFF302A-302D3099309AA66FA674-A67DA69FA6F0A6F1A802A806A80BA825A826A8C4A8E0-A8F1A926-A92DA947-A951A980-A982A9B3A9B6-A9B9A9BCAA29-AA2EAA31AA32AA35AA36AA43AA4CAAB0AAB2-AAB4AAB7AAB8AABEAABFAAC1AAECAAEDAAF6ABE5ABE8ABEDFB1EFE00-FE0FFE20-FE26",
        Mc: "0903093B093E-09400949-094C094E094F0982098309BE-09C009C709C809CB09CC09D70A030A3E-0A400A830ABE-0AC00AC90ACB0ACC0B020B030B3E0B400B470B480B4B0B4C0B570BBE0BBF0BC10BC20BC6-0BC80BCA-0BCC0BD70C01-0C030C41-0C440C820C830CBE0CC0-0CC40CC70CC80CCA0CCB0CD50CD60D020D030D3E-0D400D46-0D480D4A-0D4C0D570D820D830DCF-0DD10DD8-0DDF0DF20DF30F3E0F3F0F7F102B102C10311038103B103C105610571062-10641067-106D108310841087-108C108F109A-109C17B617BE-17C517C717C81923-19261929-192B193019311933-193819B0-19C019C819C91A19-1A1B1A551A571A611A631A641A6D-1A721B041B351B3B1B3D-1B411B431B441B821BA11BA61BA71BAA1BAC1BAD1BE71BEA-1BEC1BEE1BF21BF31C24-1C2B1C341C351CE11CF21CF3302E302FA823A824A827A880A881A8B4-A8C3A952A953A983A9B4A9B5A9BAA9BBA9BD-A9C0AA2FAA30AA33AA34AA4DAA7BAAEBAAEEAAEFAAF5ABE3ABE4ABE6ABE7ABE9ABEAABEC",
        Me: "0488048920DD-20E020E2-20E4A670-A672",
        N: "0030-003900B200B300B900BC-00BE0660-066906F0-06F907C0-07C90966-096F09E6-09EF09F4-09F90A66-0A6F0AE6-0AEF0B66-0B6F0B72-0B770BE6-0BF20C66-0C6F0C78-0C7E0CE6-0CEF0D66-0D750E50-0E590ED0-0ED90F20-0F331040-10491090-10991369-137C16EE-16F017E0-17E917F0-17F91810-18191946-194F19D0-19DA1A80-1A891A90-1A991B50-1B591BB0-1BB91C40-1C491C50-1C5920702074-20792080-20892150-21822185-21892460-249B24EA-24FF2776-27932CFD30073021-30293038-303A3192-31953220-32293248-324F3251-325F3280-328932B1-32BFA620-A629A6E6-A6EFA830-A835A8D0-A8D9A900-A909A9D0-A9D9AA50-AA59ABF0-ABF9FF10-FF19",
        Nd: "0030-00390660-066906F0-06F907C0-07C90966-096F09E6-09EF0A66-0A6F0AE6-0AEF0B66-0B6F0BE6-0BEF0C66-0C6F0CE6-0CEF0D66-0D6F0E50-0E590ED0-0ED90F20-0F291040-10491090-109917E0-17E91810-18191946-194F19D0-19D91A80-1A891A90-1A991B50-1B591BB0-1BB91C40-1C491C50-1C59A620-A629A8D0-A8D9A900-A909A9D0-A9D9AA50-AA59ABF0-ABF9FF10-FF19",
        Nl: "16EE-16F02160-21822185-218830073021-30293038-303AA6E6-A6EF",
        No: "00B200B300B900BC-00BE09F4-09F90B72-0B770BF0-0BF20C78-0C7E0D70-0D750F2A-0F331369-137C17F0-17F919DA20702074-20792080-20892150-215F21892460-249B24EA-24FF2776-27932CFD3192-31953220-32293248-324F3251-325F3280-328932B1-32BFA830-A835",
        P: "0021-00230025-002A002C-002F003A003B003F0040005B-005D005F007B007D00A100A700AB00B600B700BB00BF037E0387055A-055F0589058A05BE05C005C305C605F305F40609060A060C060D061B061E061F066A-066D06D40700-070D07F7-07F90830-083E085E0964096509700AF00DF40E4F0E5A0E5B0F04-0F120F140F3A-0F3D0F850FD0-0FD40FD90FDA104A-104F10FB1360-13681400166D166E169B169C16EB-16ED1735173617D4-17D617D8-17DA1800-180A194419451A1E1A1F1AA0-1AA61AA8-1AAD1B5A-1B601BFC-1BFF1C3B-1C3F1C7E1C7F1CC0-1CC71CD32010-20272030-20432045-20512053-205E207D207E208D208E2329232A2768-277527C527C627E6-27EF2983-299829D8-29DB29FC29FD2CF9-2CFC2CFE2CFF2D702E00-2E2E2E30-2E3B3001-30033008-30113014-301F3030303D30A030FBA4FEA4FFA60D-A60FA673A67EA6F2-A6F7A874-A877A8CEA8CFA8F8-A8FAA92EA92FA95FA9C1-A9CDA9DEA9DFAA5C-AA5FAADEAADFAAF0AAF1ABEBFD3EFD3FFE10-FE19FE30-FE52FE54-FE61FE63FE68FE6AFE6BFF01-FF03FF05-FF0AFF0C-FF0FFF1AFF1BFF1FFF20FF3B-FF3DFF3FFF5BFF5DFF5F-FF65",
        Pd: "002D058A05BE140018062010-20152E172E1A2E3A2E3B301C303030A0FE31FE32FE58FE63FF0D",
        Ps: "0028005B007B0F3A0F3C169B201A201E2045207D208D23292768276A276C276E27702772277427C527E627E827EA27EC27EE2983298529872989298B298D298F299129932995299729D829DA29FC2E222E242E262E283008300A300C300E3010301430163018301A301DFD3EFE17FE35FE37FE39FE3BFE3DFE3FFE41FE43FE47FE59FE5BFE5DFF08FF3BFF5BFF5FFF62",
        Pe: "0029005D007D0F3B0F3D169C2046207E208E232A2769276B276D276F27712773277527C627E727E927EB27ED27EF298429862988298A298C298E2990299229942996299829D929DB29FD2E232E252E272E293009300B300D300F3011301530173019301B301E301FFD3FFE18FE36FE38FE3AFE3CFE3EFE40FE42FE44FE48FE5AFE5CFE5EFF09FF3DFF5DFF60FF63",
        Pi: "00AB2018201B201C201F20392E022E042E092E0C2E1C2E20",
        Pf: "00BB2019201D203A2E032E052E0A2E0D2E1D2E21",
        Pc: "005F203F20402054FE33FE34FE4D-FE4FFF3F",
        Po: "0021-00230025-0027002A002C002E002F003A003B003F0040005C00A100A700B600B700BF037E0387055A-055F058905C005C305C605F305F40609060A060C060D061B061E061F066A-066D06D40700-070D07F7-07F90830-083E085E0964096509700AF00DF40E4F0E5A0E5B0F04-0F120F140F850FD0-0FD40FD90FDA104A-104F10FB1360-1368166D166E16EB-16ED1735173617D4-17D617D8-17DA1800-18051807-180A194419451A1E1A1F1AA0-1AA61AA8-1AAD1B5A-1B601BFC-1BFF1C3B-1C3F1C7E1C7F1CC0-1CC71CD3201620172020-20272030-2038203B-203E2041-20432047-205120532055-205E2CF9-2CFC2CFE2CFF2D702E002E012E06-2E082E0B2E0E-2E162E182E192E1B2E1E2E1F2E2A-2E2E2E30-2E393001-3003303D30FBA4FEA4FFA60D-A60FA673A67EA6F2-A6F7A874-A877A8CEA8CFA8F8-A8FAA92EA92FA95FA9C1-A9CDA9DEA9DFAA5C-AA5FAADEAADFAAF0AAF1ABEBFE10-FE16FE19FE30FE45FE46FE49-FE4CFE50-FE52FE54-FE57FE5F-FE61FE68FE6AFE6BFF01-FF03FF05-FF07FF0AFF0CFF0EFF0FFF1AFF1BFF1FFF20FF3CFF61FF64FF65",
        S: "0024002B003C-003E005E0060007C007E00A2-00A600A800A900AC00AE-00B100B400B800D700F702C2-02C502D2-02DF02E5-02EB02ED02EF-02FF03750384038503F60482058F0606-0608060B060E060F06DE06E906FD06FE07F609F209F309FA09FB0AF10B700BF3-0BFA0C7F0D790E3F0F01-0F030F130F15-0F170F1A-0F1F0F340F360F380FBE-0FC50FC7-0FCC0FCE0FCF0FD5-0FD8109E109F1390-139917DB194019DE-19FF1B61-1B6A1B74-1B7C1FBD1FBF-1FC11FCD-1FCF1FDD-1FDF1FED-1FEF1FFD1FFE20442052207A-207C208A-208C20A0-20B9210021012103-21062108210921142116-2118211E-2123212521272129212E213A213B2140-2144214A-214D214F2190-2328232B-23F32400-24262440-244A249C-24E92500-26FF2701-27672794-27C427C7-27E527F0-29822999-29D729DC-29FB29FE-2B4C2B50-2B592CE5-2CEA2E80-2E992E9B-2EF32F00-2FD52FF0-2FFB300430123013302030363037303E303F309B309C319031913196-319F31C0-31E33200-321E322A-324732503260-327F328A-32B032C0-32FE3300-33FF4DC0-4DFFA490-A4C6A700-A716A720A721A789A78AA828-A82BA836-A839AA77-AA79FB29FBB2-FBC1FDFCFDFDFE62FE64-FE66FE69FF04FF0BFF1C-FF1EFF3EFF40FF5CFF5EFFE0-FFE6FFE8-FFEEFFFCFFFD",
        Sm: "002B003C-003E007C007E00AC00B100D700F703F60606-060820442052207A-207C208A-208C21182140-2144214B2190-2194219A219B21A021A321A621AE21CE21CF21D221D421F4-22FF2308-230B23202321237C239B-23B323DC-23E125B725C125F8-25FF266F27C0-27C427C7-27E527F0-27FF2900-29822999-29D729DC-29FB29FE-2AFF2B30-2B442B47-2B4CFB29FE62FE64-FE66FF0BFF1C-FF1EFF5CFF5EFFE2FFE9-FFEC",
        Sc: "002400A2-00A5058F060B09F209F309FB0AF10BF90E3F17DB20A0-20B9A838FDFCFE69FF04FFE0FFE1FFE5FFE6",
        Sk: "005E006000A800AF00B400B802C2-02C502D2-02DF02E5-02EB02ED02EF-02FF0375038403851FBD1FBF-1FC11FCD-1FCF1FDD-1FDF1FED-1FEF1FFD1FFE309B309CA700-A716A720A721A789A78AFBB2-FBC1FF3EFF40FFE3",
        So: "00A600A900AE00B00482060E060F06DE06E906FD06FE07F609FA0B700BF3-0BF80BFA0C7F0D790F01-0F030F130F15-0F170F1A-0F1F0F340F360F380FBE-0FC50FC7-0FCC0FCE0FCF0FD5-0FD8109E109F1390-1399194019DE-19FF1B61-1B6A1B74-1B7C210021012103-210621082109211421162117211E-2123212521272129212E213A213B214A214C214D214F2195-2199219C-219F21A121A221A421A521A7-21AD21AF-21CD21D021D121D321D5-21F32300-2307230C-231F2322-2328232B-237B237D-239A23B4-23DB23E2-23F32400-24262440-244A249C-24E92500-25B625B8-25C025C2-25F72600-266E2670-26FF2701-27672794-27BF2800-28FF2B00-2B2F2B452B462B50-2B592CE5-2CEA2E80-2E992E9B-2EF32F00-2FD52FF0-2FFB300430123013302030363037303E303F319031913196-319F31C0-31E33200-321E322A-324732503260-327F328A-32B032C0-32FE3300-33FF4DC0-4DFFA490-A4C6A828-A82BA836A837A839AA77-AA79FDFDFFE4FFE8FFEDFFEEFFFCFFFD",
        Z: "002000A01680180E2000-200A20282029202F205F3000",
        Zs: "002000A01680180E2000-200A202F205F3000",
        Zl: "2028",
        Zp: "2029",
        C: "0000-001F007F-009F00AD03780379037F-0383038B038D03A20528-05300557055805600588058B-058E059005C8-05CF05EB-05EF05F5-0605061C061D06DD070E070F074B074C07B2-07BF07FB-07FF082E082F083F085C085D085F-089F08A108AD-08E308FF097809800984098D098E0991099209A909B109B3-09B509BA09BB09C509C609C909CA09CF-09D609D8-09DB09DE09E409E509FC-0A000A040A0B-0A0E0A110A120A290A310A340A370A3A0A3B0A3D0A43-0A460A490A4A0A4E-0A500A52-0A580A5D0A5F-0A650A76-0A800A840A8E0A920AA90AB10AB40ABA0ABB0AC60ACA0ACE0ACF0AD1-0ADF0AE40AE50AF2-0B000B040B0D0B0E0B110B120B290B310B340B3A0B3B0B450B460B490B4A0B4E-0B550B58-0B5B0B5E0B640B650B78-0B810B840B8B-0B8D0B910B96-0B980B9B0B9D0BA0-0BA20BA5-0BA70BAB-0BAD0BBA-0BBD0BC3-0BC50BC90BCE0BCF0BD1-0BD60BD8-0BE50BFB-0C000C040C0D0C110C290C340C3A-0C3C0C450C490C4E-0C540C570C5A-0C5F0C640C650C70-0C770C800C810C840C8D0C910CA90CB40CBA0CBB0CC50CC90CCE-0CD40CD7-0CDD0CDF0CE40CE50CF00CF3-0D010D040D0D0D110D3B0D3C0D450D490D4F-0D560D58-0D5F0D640D650D76-0D780D800D810D840D97-0D990DB20DBC0DBE0DBF0DC7-0DC90DCB-0DCE0DD50DD70DE0-0DF10DF5-0E000E3B-0E3E0E5C-0E800E830E850E860E890E8B0E8C0E8E-0E930E980EA00EA40EA60EA80EA90EAC0EBA0EBE0EBF0EC50EC70ECE0ECF0EDA0EDB0EE0-0EFF0F480F6D-0F700F980FBD0FCD0FDB-0FFF10C610C8-10CC10CE10CF1249124E124F12571259125E125F1289128E128F12B112B612B712BF12C112C612C712D7131113161317135B135C137D-137F139A-139F13F5-13FF169D-169F16F1-16FF170D1715-171F1737-173F1754-175F176D17711774-177F17DE17DF17EA-17EF17FA-17FF180F181A-181F1878-187F18AB-18AF18F6-18FF191D-191F192C-192F193C-193F1941-1943196E196F1975-197F19AC-19AF19CA-19CF19DB-19DD1A1C1A1D1A5F1A7D1A7E1A8A-1A8F1A9A-1A9F1AAE-1AFF1B4C-1B4F1B7D-1B7F1BF4-1BFB1C38-1C3A1C4A-1C4C1C80-1CBF1CC8-1CCF1CF7-1CFF1DE7-1DFB1F161F171F1E1F1F1F461F471F4E1F4F1F581F5A1F5C1F5E1F7E1F7F1FB51FC51FD41FD51FDC1FF01FF11FF51FFF200B-200F202A-202E2060-206F20722073208F209D-209F20BA-20CF20F1-20FF218A-218F23F4-23FF2427-243F244B-245F27002B4D-2B4F2B5A-2BFF2C2F2C5F2CF4-2CF82D262D28-2D2C2D2E2D2F2D68-2D6E2D71-2D7E2D97-2D9F2DA72DAF2DB72DBF2DC72DCF2DD72DDF2E3C-2E7F2E9A2EF4-2EFF2FD6-2FEF2FFC-2FFF3040309730983100-3104312E-3130318F31BB-31BF31E4-31EF321F32FF4DB6-4DBF9FCD-9FFFA48D-A48FA4C7-A4CFA62C-A63FA698-A69EA6F8-A6FFA78FA794-A79FA7AB-A7F7A82C-A82FA83A-A83FA878-A87FA8C5-A8CDA8DA-A8DFA8FC-A8FFA954-A95EA97D-A97FA9CEA9DA-A9DDA9E0-A9FFAA37-AA3FAA4EAA4FAA5AAA5BAA7C-AA7FAAC3-AADAAAF7-AB00AB07AB08AB0FAB10AB17-AB1FAB27AB2F-ABBFABEEABEFABFA-ABFFD7A4-D7AFD7C7-D7CAD7FC-F8FFFA6EFA6FFADA-FAFFFB07-FB12FB18-FB1CFB37FB3DFB3FFB42FB45FBC2-FBD2FD40-FD4FFD90FD91FDC8-FDEFFDFEFDFFFE1A-FE1FFE27-FE2FFE53FE67FE6C-FE6FFE75FEFD-FF00FFBF-FFC1FFC8FFC9FFD0FFD1FFD8FFD9FFDD-FFDFFFE7FFEF-FFFBFFFEFFFF",
        Cc: "0000-001F007F-009F",
        Cf: "00AD0600-060406DD070F200B-200F202A-202E2060-2064206A-206FFEFFFFF9-FFFB",
        Co: "E000-F8FF",
        Cs: "D800-DFFF",
        Cn: "03780379037F-0383038B038D03A20528-05300557055805600588058B-058E059005C8-05CF05EB-05EF05F5-05FF0605061C061D070E074B074C07B2-07BF07FB-07FF082E082F083F085C085D085F-089F08A108AD-08E308FF097809800984098D098E0991099209A909B109B3-09B509BA09BB09C509C609C909CA09CF-09D609D8-09DB09DE09E409E509FC-0A000A040A0B-0A0E0A110A120A290A310A340A370A3A0A3B0A3D0A43-0A460A490A4A0A4E-0A500A52-0A580A5D0A5F-0A650A76-0A800A840A8E0A920AA90AB10AB40ABA0ABB0AC60ACA0ACE0ACF0AD1-0ADF0AE40AE50AF2-0B000B040B0D0B0E0B110B120B290B310B340B3A0B3B0B450B460B490B4A0B4E-0B550B58-0B5B0B5E0B640B650B78-0B810B840B8B-0B8D0B910B96-0B980B9B0B9D0BA0-0BA20BA5-0BA70BAB-0BAD0BBA-0BBD0BC3-0BC50BC90BCE0BCF0BD1-0BD60BD8-0BE50BFB-0C000C040C0D0C110C290C340C3A-0C3C0C450C490C4E-0C540C570C5A-0C5F0C640C650C70-0C770C800C810C840C8D0C910CA90CB40CBA0CBB0CC50CC90CCE-0CD40CD7-0CDD0CDF0CE40CE50CF00CF3-0D010D040D0D0D110D3B0D3C0D450D490D4F-0D560D58-0D5F0D640D650D76-0D780D800D810D840D97-0D990DB20DBC0DBE0DBF0DC7-0DC90DCB-0DCE0DD50DD70DE0-0DF10DF5-0E000E3B-0E3E0E5C-0E800E830E850E860E890E8B0E8C0E8E-0E930E980EA00EA40EA60EA80EA90EAC0EBA0EBE0EBF0EC50EC70ECE0ECF0EDA0EDB0EE0-0EFF0F480F6D-0F700F980FBD0FCD0FDB-0FFF10C610C8-10CC10CE10CF1249124E124F12571259125E125F1289128E128F12B112B612B712BF12C112C612C712D7131113161317135B135C137D-137F139A-139F13F5-13FF169D-169F16F1-16FF170D1715-171F1737-173F1754-175F176D17711774-177F17DE17DF17EA-17EF17FA-17FF180F181A-181F1878-187F18AB-18AF18F6-18FF191D-191F192C-192F193C-193F1941-1943196E196F1975-197F19AC-19AF19CA-19CF19DB-19DD1A1C1A1D1A5F1A7D1A7E1A8A-1A8F1A9A-1A9F1AAE-1AFF1B4C-1B4F1B7D-1B7F1BF4-1BFB1C38-1C3A1C4A-1C4C1C80-1CBF1CC8-1CCF1CF7-1CFF1DE7-1DFB1F161F171F1E1F1F1F461F471F4E1F4F1F581F5A1F5C1F5E1F7E1F7F1FB51FC51FD41FD51FDC1FF01FF11FF51FFF2065-206920722073208F209D-209F20BA-20CF20F1-20FF218A-218F23F4-23FF2427-243F244B-245F27002B4D-2B4F2B5A-2BFF2C2F2C5F2CF4-2CF82D262D28-2D2C2D2E2D2F2D68-2D6E2D71-2D7E2D97-2D9F2DA72DAF2DB72DBF2DC72DCF2DD72DDF2E3C-2E7F2E9A2EF4-2EFF2FD6-2FEF2FFC-2FFF3040309730983100-3104312E-3130318F31BB-31BF31E4-31EF321F32FF4DB6-4DBF9FCD-9FFFA48D-A48FA4C7-A4CFA62C-A63FA698-A69EA6F8-A6FFA78FA794-A79FA7AB-A7F7A82C-A82FA83A-A83FA878-A87FA8C5-A8CDA8DA-A8DFA8FC-A8FFA954-A95EA97D-A97FA9CEA9DA-A9DDA9E0-A9FFAA37-AA3FAA4EAA4FAA5AAA5BAA7C-AA7FAAC3-AADAAAF7-AB00AB07AB08AB0FAB10AB17-AB1FAB27AB2F-ABBFABEEABEFABFA-ABFFD7A4-D7AFD7C7-D7CAD7FC-D7FFFA6EFA6FFADA-FAFFFB07-FB12FB18-FB1CFB37FB3DFB3FFB42FB45FBC2-FBD2FD40-FD4FFD90FD91FDC8-FDEFFDFEFDFFFE1A-FE1FFE27-FE2FFE53FE67FE6C-FE6FFE75FEFDFEFEFF00FFBF-FFC1FFC8FFC9FFD0FFD1FFD8FFD9FFDD-FFDFFFE7FFEF-FFF8FFFEFFFF"
    }, {
        //L: "Letter", // Included in the Unicode Base addon
        Ll: "Lowercase_Letter",
        Lu: "Uppercase_Letter",
        Lt: "Titlecase_Letter",
        Lm: "Modifier_Letter",
        Lo: "Other_Letter",
        M: "Mark",
        Mn: "Nonspacing_Mark",
        Mc: "Spacing_Mark",
        Me: "Enclosing_Mark",
        N: "Number",
        Nd: "Decimal_Number",
        Nl: "Letter_Number",
        No: "Other_Number",
        P: "Punctuation",
        Pd: "Dash_Punctuation",
        Ps: "Open_Punctuation",
        Pe: "Close_Punctuation",
        Pi: "Initial_Punctuation",
        Pf: "Final_Punctuation",
        Pc: "Connector_Punctuation",
        Po: "Other_Punctuation",
        S: "Symbol",
        Sm: "Math_Symbol",
        Sc: "Currency_Symbol",
        Sk: "Modifier_Symbol",
        So: "Other_Symbol",
        Z: "Separator",
        Zs: "Space_Separator",
        Zl: "Line_Separator",
        Zp: "Paragraph_Separator",
        C: "Other",
        Cc: "Control",
        Cf: "Format",
        Co: "Private_Use",
        Cs: "Surrogate",
        Cn: "Unassigned"
    });

}(XRegExp));


/***** unicode-scripts.js *****/

/*!
 * XRegExp Unicode Scripts v1.2.0
 * (c) 2010-2012 Steven Levithan <http://xregexp.com/>
 * MIT License
 * Uses Unicode 6.1 <http://unicode.org/>
 */

/**
 * Adds support for all Unicode scripts in the Basic Multilingual Plane (U+0000-U+FFFF).
 * E.g., `\p{Latin}`. Token names are case insensitive, and any spaces, hyphens, and underscores
 * are ignored.
 * @requires XRegExp, XRegExp Unicode Base
 */
(function (XRegExp) {
    "use strict";

    if (!XRegExp.addUnicodePackage) {
        throw new ReferenceError("Unicode Base must be loaded before Unicode Scripts");
    }

    XRegExp.install("extensibility");

    XRegExp.addUnicodePackage({
        Arabic: "0600-06040606-060B060D-061A061E0620-063F0641-064A0656-065E066A-066F0671-06DC06DE-06FF0750-077F08A008A2-08AC08E4-08FEFB50-FBC1FBD3-FD3DFD50-FD8FFD92-FDC7FDF0-FDFCFE70-FE74FE76-FEFC",
        Armenian: "0531-05560559-055F0561-0587058A058FFB13-FB17",
        Balinese: "1B00-1B4B1B50-1B7C",
        Bamum: "A6A0-A6F7",
        Batak: "1BC0-1BF31BFC-1BFF",
        Bengali: "0981-09830985-098C098F09900993-09A809AA-09B009B209B6-09B909BC-09C409C709C809CB-09CE09D709DC09DD09DF-09E309E6-09FB",
        Bopomofo: "02EA02EB3105-312D31A0-31BA",
        Braille: "2800-28FF",
        Buginese: "1A00-1A1B1A1E1A1F",
        Buhid: "1740-1753",
        Canadian_Aboriginal: "1400-167F18B0-18F5",
        Cham: "AA00-AA36AA40-AA4DAA50-AA59AA5C-AA5F",
        Cherokee: "13A0-13F4",
        Common: "0000-0040005B-0060007B-00A900AB-00B900BB-00BF00D700F702B9-02DF02E5-02E902EC-02FF0374037E038503870589060C061B061F06400660-066906DD096409650E3F0FD5-0FD810FB16EB-16ED173517361802180318051CD31CE11CE9-1CEC1CEE-1CF31CF51CF62000-200B200E-2064206A-20702074-207E2080-208E20A0-20B92100-21252127-2129212C-21312133-214D214F-215F21892190-23F32400-24262440-244A2460-26FF2701-27FF2900-2B4C2B50-2B592E00-2E3B2FF0-2FFB3000-300430063008-30203030-3037303C-303F309B309C30A030FB30FC3190-319F31C0-31E33220-325F327F-32CF3358-33FF4DC0-4DFFA700-A721A788-A78AA830-A839FD3EFD3FFDFDFE10-FE19FE30-FE52FE54-FE66FE68-FE6BFEFFFF01-FF20FF3B-FF40FF5B-FF65FF70FF9EFF9FFFE0-FFE6FFE8-FFEEFFF9-FFFD",
        Coptic: "03E2-03EF2C80-2CF32CF9-2CFF",
        Cyrillic: "0400-04840487-05271D2B1D782DE0-2DFFA640-A697A69F",
        Devanagari: "0900-09500953-09630966-09770979-097FA8E0-A8FB",
        Ethiopic: "1200-1248124A-124D1250-12561258125A-125D1260-1288128A-128D1290-12B012B2-12B512B8-12BE12C012C2-12C512C8-12D612D8-13101312-13151318-135A135D-137C1380-13992D80-2D962DA0-2DA62DA8-2DAE2DB0-2DB62DB8-2DBE2DC0-2DC62DC8-2DCE2DD0-2DD62DD8-2DDEAB01-AB06AB09-AB0EAB11-AB16AB20-AB26AB28-AB2E",
        Georgian: "10A0-10C510C710CD10D0-10FA10FC-10FF2D00-2D252D272D2D",
        Glagolitic: "2C00-2C2E2C30-2C5E",
        Greek: "0370-03730375-0377037A-037D038403860388-038A038C038E-03A103A3-03E103F0-03FF1D26-1D2A1D5D-1D611D66-1D6A1DBF1F00-1F151F18-1F1D1F20-1F451F48-1F4D1F50-1F571F591F5B1F5D1F5F-1F7D1F80-1FB41FB6-1FC41FC6-1FD31FD6-1FDB1FDD-1FEF1FF2-1FF41FF6-1FFE2126",
        Gujarati: "0A81-0A830A85-0A8D0A8F-0A910A93-0AA80AAA-0AB00AB20AB30AB5-0AB90ABC-0AC50AC7-0AC90ACB-0ACD0AD00AE0-0AE30AE6-0AF1",
        Gurmukhi: "0A01-0A030A05-0A0A0A0F0A100A13-0A280A2A-0A300A320A330A350A360A380A390A3C0A3E-0A420A470A480A4B-0A4D0A510A59-0A5C0A5E0A66-0A75",
        Han: "2E80-2E992E9B-2EF32F00-2FD5300530073021-30293038-303B3400-4DB54E00-9FCCF900-FA6DFA70-FAD9",
        Hangul: "1100-11FF302E302F3131-318E3200-321E3260-327EA960-A97CAC00-D7A3D7B0-D7C6D7CB-D7FBFFA0-FFBEFFC2-FFC7FFCA-FFCFFFD2-FFD7FFDA-FFDC",
        Hanunoo: "1720-1734",
        Hebrew: "0591-05C705D0-05EA05F0-05F4FB1D-FB36FB38-FB3CFB3EFB40FB41FB43FB44FB46-FB4F",
        Hiragana: "3041-3096309D-309F",
        Inherited: "0300-036F04850486064B-0655065F0670095109521CD0-1CD21CD4-1CE01CE2-1CE81CED1CF41DC0-1DE61DFC-1DFF200C200D20D0-20F0302A-302D3099309AFE00-FE0FFE20-FE26",
        Javanese: "A980-A9CDA9CF-A9D9A9DEA9DF",
        Kannada: "0C820C830C85-0C8C0C8E-0C900C92-0CA80CAA-0CB30CB5-0CB90CBC-0CC40CC6-0CC80CCA-0CCD0CD50CD60CDE0CE0-0CE30CE6-0CEF0CF10CF2",
        Katakana: "30A1-30FA30FD-30FF31F0-31FF32D0-32FE3300-3357FF66-FF6FFF71-FF9D",
        Kayah_Li: "A900-A92F",
        Khmer: "1780-17DD17E0-17E917F0-17F919E0-19FF",
        Lao: "0E810E820E840E870E880E8A0E8D0E94-0E970E99-0E9F0EA1-0EA30EA50EA70EAA0EAB0EAD-0EB90EBB-0EBD0EC0-0EC40EC60EC8-0ECD0ED0-0ED90EDC-0EDF",
        Latin: "0041-005A0061-007A00AA00BA00C0-00D600D8-00F600F8-02B802E0-02E41D00-1D251D2C-1D5C1D62-1D651D6B-1D771D79-1DBE1E00-1EFF2071207F2090-209C212A212B2132214E2160-21882C60-2C7FA722-A787A78B-A78EA790-A793A7A0-A7AAA7F8-A7FFFB00-FB06FF21-FF3AFF41-FF5A",
        Lepcha: "1C00-1C371C3B-1C491C4D-1C4F",
        Limbu: "1900-191C1920-192B1930-193B19401944-194F",
        Lisu: "A4D0-A4FF",
        Malayalam: "0D020D030D05-0D0C0D0E-0D100D12-0D3A0D3D-0D440D46-0D480D4A-0D4E0D570D60-0D630D66-0D750D79-0D7F",
        Mandaic: "0840-085B085E",
        Meetei_Mayek: "AAE0-AAF6ABC0-ABEDABF0-ABF9",
        Mongolian: "1800180118041806-180E1810-18191820-18771880-18AA",
        Myanmar: "1000-109FAA60-AA7B",
        New_Tai_Lue: "1980-19AB19B0-19C919D0-19DA19DE19DF",
        Nko: "07C0-07FA",
        Ogham: "1680-169C",
        Ol_Chiki: "1C50-1C7F",
        Oriya: "0B01-0B030B05-0B0C0B0F0B100B13-0B280B2A-0B300B320B330B35-0B390B3C-0B440B470B480B4B-0B4D0B560B570B5C0B5D0B5F-0B630B66-0B77",
        Phags_Pa: "A840-A877",
        Rejang: "A930-A953A95F",
        Runic: "16A0-16EA16EE-16F0",
        Samaritan: "0800-082D0830-083E",
        Saurashtra: "A880-A8C4A8CE-A8D9",
        Sinhala: "0D820D830D85-0D960D9A-0DB10DB3-0DBB0DBD0DC0-0DC60DCA0DCF-0DD40DD60DD8-0DDF0DF2-0DF4",
        Sundanese: "1B80-1BBF1CC0-1CC7",
        Syloti_Nagri: "A800-A82B",
        Syriac: "0700-070D070F-074A074D-074F",
        Tagalog: "1700-170C170E-1714",
        Tagbanwa: "1760-176C176E-177017721773",
        Tai_Le: "1950-196D1970-1974",
        Tai_Tham: "1A20-1A5E1A60-1A7C1A7F-1A891A90-1A991AA0-1AAD",
        Tai_Viet: "AA80-AAC2AADB-AADF",
        Tamil: "0B820B830B85-0B8A0B8E-0B900B92-0B950B990B9A0B9C0B9E0B9F0BA30BA40BA8-0BAA0BAE-0BB90BBE-0BC20BC6-0BC80BCA-0BCD0BD00BD70BE6-0BFA",
        Telugu: "0C01-0C030C05-0C0C0C0E-0C100C12-0C280C2A-0C330C35-0C390C3D-0C440C46-0C480C4A-0C4D0C550C560C580C590C60-0C630C66-0C6F0C78-0C7F",
        Thaana: "0780-07B1",
        Thai: "0E01-0E3A0E40-0E5B",
        Tibetan: "0F00-0F470F49-0F6C0F71-0F970F99-0FBC0FBE-0FCC0FCE-0FD40FD90FDA",
        Tifinagh: "2D30-2D672D6F2D702D7F",
        Vai: "A500-A62B",
        Yi: "A000-A48CA490-A4C6"
    });

}(XRegExp));


/***** unicode-blocks.js *****/

/*!
 * XRegExp Unicode Blocks v1.2.0
 * (c) 2010-2012 Steven Levithan <http://xregexp.com/>
 * MIT License
 * Uses Unicode 6.1 <http://unicode.org/>
 */

/**
 * Adds support for all Unicode blocks in the Basic Multilingual Plane (U+0000-U+FFFF). Unicode
 * blocks use the prefix "In". E.g., `\p{InBasicLatin}`. Token names are case insensitive, and any
 * spaces, hyphens, and underscores are ignored.
 * @requires XRegExp, XRegExp Unicode Base
 */
(function (XRegExp) {
    "use strict";

    if (!XRegExp.addUnicodePackage) {
        throw new ReferenceError("Unicode Base must be loaded before Unicode Blocks");
    }

    XRegExp.install("extensibility");

    XRegExp.addUnicodePackage({
        InBasic_Latin: "0000-007F",
        InLatin_1_Supplement: "0080-00FF",
        InLatin_Extended_A: "0100-017F",
        InLatin_Extended_B: "0180-024F",
        InIPA_Extensions: "0250-02AF",
        InSpacing_Modifier_Letters: "02B0-02FF",
        InCombining_Diacritical_Marks: "0300-036F",
        InGreek_and_Coptic: "0370-03FF",
        InCyrillic: "0400-04FF",
        InCyrillic_Supplement: "0500-052F",
        InArmenian: "0530-058F",
        InHebrew: "0590-05FF",
        InArabic: "0600-06FF",
        InSyriac: "0700-074F",
        InArabic_Supplement: "0750-077F",
        InThaana: "0780-07BF",
        InNKo: "07C0-07FF",
        InSamaritan: "0800-083F",
        InMandaic: "0840-085F",
        InArabic_Extended_A: "08A0-08FF",
        InDevanagari: "0900-097F",
        InBengali: "0980-09FF",
        InGurmukhi: "0A00-0A7F",
        InGujarati: "0A80-0AFF",
        InOriya: "0B00-0B7F",
        InTamil: "0B80-0BFF",
        InTelugu: "0C00-0C7F",
        InKannada: "0C80-0CFF",
        InMalayalam: "0D00-0D7F",
        InSinhala: "0D80-0DFF",
        InThai: "0E00-0E7F",
        InLao: "0E80-0EFF",
        InTibetan: "0F00-0FFF",
        InMyanmar: "1000-109F",
        InGeorgian: "10A0-10FF",
        InHangul_Jamo: "1100-11FF",
        InEthiopic: "1200-137F",
        InEthiopic_Supplement: "1380-139F",
        InCherokee: "13A0-13FF",
        InUnified_Canadian_Aboriginal_Syllabics: "1400-167F",
        InOgham: "1680-169F",
        InRunic: "16A0-16FF",
        InTagalog: "1700-171F",
        InHanunoo: "1720-173F",
        InBuhid: "1740-175F",
        InTagbanwa: "1760-177F",
        InKhmer: "1780-17FF",
        InMongolian: "1800-18AF",
        InUnified_Canadian_Aboriginal_Syllabics_Extended: "18B0-18FF",
        InLimbu: "1900-194F",
        InTai_Le: "1950-197F",
        InNew_Tai_Lue: "1980-19DF",
        InKhmer_Symbols: "19E0-19FF",
        InBuginese: "1A00-1A1F",
        InTai_Tham: "1A20-1AAF",
        InBalinese: "1B00-1B7F",
        InSundanese: "1B80-1BBF",
        InBatak: "1BC0-1BFF",
        InLepcha: "1C00-1C4F",
        InOl_Chiki: "1C50-1C7F",
        InSundanese_Supplement: "1CC0-1CCF",
        InVedic_Extensions: "1CD0-1CFF",
        InPhonetic_Extensions: "1D00-1D7F",
        InPhonetic_Extensions_Supplement: "1D80-1DBF",
        InCombining_Diacritical_Marks_Supplement: "1DC0-1DFF",
        InLatin_Extended_Additional: "1E00-1EFF",
        InGreek_Extended: "1F00-1FFF",
        InGeneral_Punctuation: "2000-206F",
        InSuperscripts_and_Subscripts: "2070-209F",
        InCurrency_Symbols: "20A0-20CF",
        InCombining_Diacritical_Marks_for_Symbols: "20D0-20FF",
        InLetterlike_Symbols: "2100-214F",
        InNumber_Forms: "2150-218F",
        InArrows: "2190-21FF",
        InMathematical_Operators: "2200-22FF",
        InMiscellaneous_Technical: "2300-23FF",
        InControl_Pictures: "2400-243F",
        InOptical_Character_Recognition: "2440-245F",
        InEnclosed_Alphanumerics: "2460-24FF",
        InBox_Drawing: "2500-257F",
        InBlock_Elements: "2580-259F",
        InGeometric_Shapes: "25A0-25FF",
        InMiscellaneous_Symbols: "2600-26FF",
        InDingbats: "2700-27BF",
        InMiscellaneous_Mathematical_Symbols_A: "27C0-27EF",
        InSupplemental_Arrows_A: "27F0-27FF",
        InBraille_Patterns: "2800-28FF",
        InSupplemental_Arrows_B: "2900-297F",
        InMiscellaneous_Mathematical_Symbols_B: "2980-29FF",
        InSupplemental_Mathematical_Operators: "2A00-2AFF",
        InMiscellaneous_Symbols_and_Arrows: "2B00-2BFF",
        InGlagolitic: "2C00-2C5F",
        InLatin_Extended_C: "2C60-2C7F",
        InCoptic: "2C80-2CFF",
        InGeorgian_Supplement: "2D00-2D2F",
        InTifinagh: "2D30-2D7F",
        InEthiopic_Extended: "2D80-2DDF",
        InCyrillic_Extended_A: "2DE0-2DFF",
        InSupplemental_Punctuation: "2E00-2E7F",
        InCJK_Radicals_Supplement: "2E80-2EFF",
        InKangxi_Radicals: "2F00-2FDF",
        InIdeographic_Description_Characters: "2FF0-2FFF",
        InCJK_Symbols_and_Punctuation: "3000-303F",
        InHiragana: "3040-309F",
        InKatakana: "30A0-30FF",
        InBopomofo: "3100-312F",
        InHangul_Compatibility_Jamo: "3130-318F",
        InKanbun: "3190-319F",
        InBopomofo_Extended: "31A0-31BF",
        InCJK_Strokes: "31C0-31EF",
        InKatakana_Phonetic_Extensions: "31F0-31FF",
        InEnclosed_CJK_Letters_and_Months: "3200-32FF",
        InCJK_Compatibility: "3300-33FF",
        InCJK_Unified_Ideographs_Extension_A: "3400-4DBF",
        InYijing_Hexagram_Symbols: "4DC0-4DFF",
        InCJK_Unified_Ideographs: "4E00-9FFF",
        InYi_Syllables: "A000-A48F",
        InYi_Radicals: "A490-A4CF",
        InLisu: "A4D0-A4FF",
        InVai: "A500-A63F",
        InCyrillic_Extended_B: "A640-A69F",
        InBamum: "A6A0-A6FF",
        InModifier_Tone_Letters: "A700-A71F",
        InLatin_Extended_D: "A720-A7FF",
        InSyloti_Nagri: "A800-A82F",
        InCommon_Indic_Number_Forms: "A830-A83F",
        InPhags_pa: "A840-A87F",
        InSaurashtra: "A880-A8DF",
        InDevanagari_Extended: "A8E0-A8FF",
        InKayah_Li: "A900-A92F",
        InRejang: "A930-A95F",
        InHangul_Jamo_Extended_A: "A960-A97F",
        InJavanese: "A980-A9DF",
        InCham: "AA00-AA5F",
        InMyanmar_Extended_A: "AA60-AA7F",
        InTai_Viet: "AA80-AADF",
        InMeetei_Mayek_Extensions: "AAE0-AAFF",
        InEthiopic_Extended_A: "AB00-AB2F",
        InMeetei_Mayek: "ABC0-ABFF",
        InHangul_Syllables: "AC00-D7AF",
        InHangul_Jamo_Extended_B: "D7B0-D7FF",
        InHigh_Surrogates: "D800-DB7F",
        InHigh_Private_Use_Surrogates: "DB80-DBFF",
        InLow_Surrogates: "DC00-DFFF",
        InPrivate_Use_Area: "E000-F8FF",
        InCJK_Compatibility_Ideographs: "F900-FAFF",
        InAlphabetic_Presentation_Forms: "FB00-FB4F",
        InArabic_Presentation_Forms_A: "FB50-FDFF",
        InVariation_Selectors: "FE00-FE0F",
        InVertical_Forms: "FE10-FE1F",
        InCombining_Half_Marks: "FE20-FE2F",
        InCJK_Compatibility_Forms: "FE30-FE4F",
        InSmall_Form_Variants: "FE50-FE6F",
        InArabic_Presentation_Forms_B: "FE70-FEFF",
        InHalfwidth_and_Fullwidth_Forms: "FF00-FFEF",
        InSpecials: "FFF0-FFFF"
    });

}(XRegExp));


/***** unicode-properties.js *****/

/*!
 * XRegExp Unicode Properties v1.0.0
 * (c) 2012 Steven Levithan <http://xregexp.com/>
 * MIT License
 * Uses Unicode 6.1 <http://unicode.org/>
 */

/**
 * Adds Unicode properties necessary to meet Level 1 Unicode support (detailed in UTS#18 RL1.2).
 * Includes code points from the Basic Multilingual Plane (U+0000-U+FFFF) only. Token names are
 * case insensitive, and any spaces, hyphens, and underscores are ignored.
 * @requires XRegExp, XRegExp Unicode Base
 */
(function (XRegExp) {
    "use strict";

    if (!XRegExp.addUnicodePackage) {
        throw new ReferenceError("Unicode Base must be loaded before Unicode Properties");
    }

    XRegExp.install("extensibility");

    XRegExp.addUnicodePackage({
        Alphabetic: "0041-005A0061-007A00AA00B500BA00C0-00D600D8-00F600F8-02C102C6-02D102E0-02E402EC02EE03450370-037403760377037A-037D03860388-038A038C038E-03A103A3-03F503F7-0481048A-05270531-055605590561-058705B0-05BD05BF05C105C205C405C505C705D0-05EA05F0-05F20610-061A0620-06570659-065F066E-06D306D5-06DC06E1-06E806ED-06EF06FA-06FC06FF0710-073F074D-07B107CA-07EA07F407F507FA0800-0817081A-082C0840-085808A008A2-08AC08E4-08E908F0-08FE0900-093B093D-094C094E-09500955-09630971-09770979-097F0981-09830985-098C098F09900993-09A809AA-09B009B209B6-09B909BD-09C409C709C809CB09CC09CE09D709DC09DD09DF-09E309F009F10A01-0A030A05-0A0A0A0F0A100A13-0A280A2A-0A300A320A330A350A360A380A390A3E-0A420A470A480A4B0A4C0A510A59-0A5C0A5E0A70-0A750A81-0A830A85-0A8D0A8F-0A910A93-0AA80AAA-0AB00AB20AB30AB5-0AB90ABD-0AC50AC7-0AC90ACB0ACC0AD00AE0-0AE30B01-0B030B05-0B0C0B0F0B100B13-0B280B2A-0B300B320B330B35-0B390B3D-0B440B470B480B4B0B4C0B560B570B5C0B5D0B5F-0B630B710B820B830B85-0B8A0B8E-0B900B92-0B950B990B9A0B9C0B9E0B9F0BA30BA40BA8-0BAA0BAE-0BB90BBE-0BC20BC6-0BC80BCA-0BCC0BD00BD70C01-0C030C05-0C0C0C0E-0C100C12-0C280C2A-0C330C35-0C390C3D-0C440C46-0C480C4A-0C4C0C550C560C580C590C60-0C630C820C830C85-0C8C0C8E-0C900C92-0CA80CAA-0CB30CB5-0CB90CBD-0CC40CC6-0CC80CCA-0CCC0CD50CD60CDE0CE0-0CE30CF10CF20D020D030D05-0D0C0D0E-0D100D12-0D3A0D3D-0D440D46-0D480D4A-0D4C0D4E0D570D60-0D630D7A-0D7F0D820D830D85-0D960D9A-0DB10DB3-0DBB0DBD0DC0-0DC60DCF-0DD40DD60DD8-0DDF0DF20DF30E01-0E3A0E40-0E460E4D0E810E820E840E870E880E8A0E8D0E94-0E970E99-0E9F0EA1-0EA30EA50EA70EAA0EAB0EAD-0EB90EBB-0EBD0EC0-0EC40EC60ECD0EDC-0EDF0F000F40-0F470F49-0F6C0F71-0F810F88-0F970F99-0FBC1000-10361038103B-103F1050-10621065-1068106E-1086108E109C109D10A0-10C510C710CD10D0-10FA10FC-1248124A-124D1250-12561258125A-125D1260-1288128A-128D1290-12B012B2-12B512B8-12BE12C012C2-12C512C8-12D612D8-13101312-13151318-135A135F1380-138F13A0-13F41401-166C166F-167F1681-169A16A0-16EA16EE-16F01700-170C170E-17131720-17331740-17531760-176C176E-1770177217731780-17B317B6-17C817D717DC1820-18771880-18AA18B0-18F51900-191C1920-192B1930-19381950-196D1970-19741980-19AB19B0-19C91A00-1A1B1A20-1A5E1A61-1A741AA71B00-1B331B35-1B431B45-1B4B1B80-1BA91BAC-1BAF1BBA-1BE51BE7-1BF11C00-1C351C4D-1C4F1C5A-1C7D1CE9-1CEC1CEE-1CF31CF51CF61D00-1DBF1E00-1F151F18-1F1D1F20-1F451F48-1F4D1F50-1F571F591F5B1F5D1F5F-1F7D1F80-1FB41FB6-1FBC1FBE1FC2-1FC41FC6-1FCC1FD0-1FD31FD6-1FDB1FE0-1FEC1FF2-1FF41FF6-1FFC2071207F2090-209C21022107210A-211321152119-211D212421262128212A-212D212F-2139213C-213F2145-2149214E2160-218824B6-24E92C00-2C2E2C30-2C5E2C60-2CE42CEB-2CEE2CF22CF32D00-2D252D272D2D2D30-2D672D6F2D80-2D962DA0-2DA62DA8-2DAE2DB0-2DB62DB8-2DBE2DC0-2DC62DC8-2DCE2DD0-2DD62DD8-2DDE2DE0-2DFF2E2F3005-30073021-30293031-30353038-303C3041-3096309D-309F30A1-30FA30FC-30FF3105-312D3131-318E31A0-31BA31F0-31FF3400-4DB54E00-9FCCA000-A48CA4D0-A4FDA500-A60CA610-A61FA62AA62BA640-A66EA674-A67BA67F-A697A69F-A6EFA717-A71FA722-A788A78B-A78EA790-A793A7A0-A7AAA7F8-A801A803-A805A807-A80AA80C-A827A840-A873A880-A8C3A8F2-A8F7A8FBA90A-A92AA930-A952A960-A97CA980-A9B2A9B4-A9BFA9CFAA00-AA36AA40-AA4DAA60-AA76AA7AAA80-AABEAAC0AAC2AADB-AADDAAE0-AAEFAAF2-AAF5AB01-AB06AB09-AB0EAB11-AB16AB20-AB26AB28-AB2EABC0-ABEAAC00-D7A3D7B0-D7C6D7CB-D7FBF900-FA6DFA70-FAD9FB00-FB06FB13-FB17FB1D-FB28FB2A-FB36FB38-FB3CFB3EFB40FB41FB43FB44FB46-FBB1FBD3-FD3DFD50-FD8FFD92-FDC7FDF0-FDFBFE70-FE74FE76-FEFCFF21-FF3AFF41-FF5AFF66-FFBEFFC2-FFC7FFCA-FFCFFFD2-FFD7FFDA-FFDC",
        Uppercase: "0041-005A00C0-00D600D8-00DE01000102010401060108010A010C010E01100112011401160118011A011C011E01200122012401260128012A012C012E01300132013401360139013B013D013F0141014301450147014A014C014E01500152015401560158015A015C015E01600162016401660168016A016C016E017001720174017601780179017B017D018101820184018601870189-018B018E-0191019301940196-0198019C019D019F01A001A201A401A601A701A901AC01AE01AF01B1-01B301B501B701B801BC01C401C701CA01CD01CF01D101D301D501D701D901DB01DE01E001E201E401E601E801EA01EC01EE01F101F401F6-01F801FA01FC01FE02000202020402060208020A020C020E02100212021402160218021A021C021E02200222022402260228022A022C022E02300232023A023B023D023E02410243-02460248024A024C024E03700372037603860388-038A038C038E038F0391-03A103A3-03AB03CF03D2-03D403D803DA03DC03DE03E003E203E403E603E803EA03EC03EE03F403F703F903FA03FD-042F04600462046404660468046A046C046E04700472047404760478047A047C047E0480048A048C048E04900492049404960498049A049C049E04A004A204A404A604A804AA04AC04AE04B004B204B404B604B804BA04BC04BE04C004C104C304C504C704C904CB04CD04D004D204D404D604D804DA04DC04DE04E004E204E404E604E804EA04EC04EE04F004F204F404F604F804FA04FC04FE05000502050405060508050A050C050E05100512051405160518051A051C051E05200522052405260531-055610A0-10C510C710CD1E001E021E041E061E081E0A1E0C1E0E1E101E121E141E161E181E1A1E1C1E1E1E201E221E241E261E281E2A1E2C1E2E1E301E321E341E361E381E3A1E3C1E3E1E401E421E441E461E481E4A1E4C1E4E1E501E521E541E561E581E5A1E5C1E5E1E601E621E641E661E681E6A1E6C1E6E1E701E721E741E761E781E7A1E7C1E7E1E801E821E841E861E881E8A1E8C1E8E1E901E921E941E9E1EA01EA21EA41EA61EA81EAA1EAC1EAE1EB01EB21EB41EB61EB81EBA1EBC1EBE1EC01EC21EC41EC61EC81ECA1ECC1ECE1ED01ED21ED41ED61ED81EDA1EDC1EDE1EE01EE21EE41EE61EE81EEA1EEC1EEE1EF01EF21EF41EF61EF81EFA1EFC1EFE1F08-1F0F1F18-1F1D1F28-1F2F1F38-1F3F1F48-1F4D1F591F5B1F5D1F5F1F68-1F6F1FB8-1FBB1FC8-1FCB1FD8-1FDB1FE8-1FEC1FF8-1FFB21022107210B-210D2110-211221152119-211D212421262128212A-212D2130-2133213E213F21452160-216F218324B6-24CF2C00-2C2E2C602C62-2C642C672C692C6B2C6D-2C702C722C752C7E-2C802C822C842C862C882C8A2C8C2C8E2C902C922C942C962C982C9A2C9C2C9E2CA02CA22CA42CA62CA82CAA2CAC2CAE2CB02CB22CB42CB62CB82CBA2CBC2CBE2CC02CC22CC42CC62CC82CCA2CCC2CCE2CD02CD22CD42CD62CD82CDA2CDC2CDE2CE02CE22CEB2CED2CF2A640A642A644A646A648A64AA64CA64EA650A652A654A656A658A65AA65CA65EA660A662A664A666A668A66AA66CA680A682A684A686A688A68AA68CA68EA690A692A694A696A722A724A726A728A72AA72CA72EA732A734A736A738A73AA73CA73EA740A742A744A746A748A74AA74CA74EA750A752A754A756A758A75AA75CA75EA760A762A764A766A768A76AA76CA76EA779A77BA77DA77EA780A782A784A786A78BA78DA790A792A7A0A7A2A7A4A7A6A7A8A7AAFF21-FF3A",
        Lowercase: "0061-007A00AA00B500BA00DF-00F600F8-00FF01010103010501070109010B010D010F01110113011501170119011B011D011F01210123012501270129012B012D012F01310133013501370138013A013C013E014001420144014601480149014B014D014F01510153015501570159015B015D015F01610163016501670169016B016D016F0171017301750177017A017C017E-0180018301850188018C018D019201950199-019B019E01A101A301A501A801AA01AB01AD01B001B401B601B901BA01BD-01BF01C601C901CC01CE01D001D201D401D601D801DA01DC01DD01DF01E101E301E501E701E901EB01ED01EF01F001F301F501F901FB01FD01FF02010203020502070209020B020D020F02110213021502170219021B021D021F02210223022502270229022B022D022F02310233-0239023C023F0240024202470249024B024D024F-02930295-02B802C002C102E0-02E40345037103730377037A-037D039003AC-03CE03D003D103D5-03D703D903DB03DD03DF03E103E303E503E703E903EB03ED03EF-03F303F503F803FB03FC0430-045F04610463046504670469046B046D046F04710473047504770479047B047D047F0481048B048D048F04910493049504970499049B049D049F04A104A304A504A704A904AB04AD04AF04B104B304B504B704B904BB04BD04BF04C204C404C604C804CA04CC04CE04CF04D104D304D504D704D904DB04DD04DF04E104E304E504E704E904EB04ED04EF04F104F304F504F704F904FB04FD04FF05010503050505070509050B050D050F05110513051505170519051B051D051F05210523052505270561-05871D00-1DBF1E011E031E051E071E091E0B1E0D1E0F1E111E131E151E171E191E1B1E1D1E1F1E211E231E251E271E291E2B1E2D1E2F1E311E331E351E371E391E3B1E3D1E3F1E411E431E451E471E491E4B1E4D1E4F1E511E531E551E571E591E5B1E5D1E5F1E611E631E651E671E691E6B1E6D1E6F1E711E731E751E771E791E7B1E7D1E7F1E811E831E851E871E891E8B1E8D1E8F1E911E931E95-1E9D1E9F1EA11EA31EA51EA71EA91EAB1EAD1EAF1EB11EB31EB51EB71EB91EBB1EBD1EBF1EC11EC31EC51EC71EC91ECB1ECD1ECF1ED11ED31ED51ED71ED91EDB1EDD1EDF1EE11EE31EE51EE71EE91EEB1EED1EEF1EF11EF31EF51EF71EF91EFB1EFD1EFF-1F071F10-1F151F20-1F271F30-1F371F40-1F451F50-1F571F60-1F671F70-1F7D1F80-1F871F90-1F971FA0-1FA71FB0-1FB41FB61FB71FBE1FC2-1FC41FC61FC71FD0-1FD31FD61FD71FE0-1FE71FF2-1FF41FF61FF72071207F2090-209C210A210E210F2113212F21342139213C213D2146-2149214E2170-217F218424D0-24E92C30-2C5E2C612C652C662C682C6A2C6C2C712C732C742C76-2C7D2C812C832C852C872C892C8B2C8D2C8F2C912C932C952C972C992C9B2C9D2C9F2CA12CA32CA52CA72CA92CAB2CAD2CAF2CB12CB32CB52CB72CB92CBB2CBD2CBF2CC12CC32CC52CC72CC92CCB2CCD2CCF2CD12CD32CD52CD72CD92CDB2CDD2CDF2CE12CE32CE42CEC2CEE2CF32D00-2D252D272D2DA641A643A645A647A649A64BA64DA64FA651A653A655A657A659A65BA65DA65FA661A663A665A667A669A66BA66DA681A683A685A687A689A68BA68DA68FA691A693A695A697A723A725A727A729A72BA72DA72F-A731A733A735A737A739A73BA73DA73FA741A743A745A747A749A74BA74DA74FA751A753A755A757A759A75BA75DA75FA761A763A765A767A769A76BA76DA76F-A778A77AA77CA77FA781A783A785A787A78CA78EA791A793A7A1A7A3A7A5A7A7A7A9A7F8-A7FAFB00-FB06FB13-FB17FF41-FF5A",
        White_Space: "0009-000D0020008500A01680180E2000-200A20282029202F205F3000",
        Noncharacter_Code_Point: "FDD0-FDEFFFFEFFFF",
        Default_Ignorable_Code_Point: "00AD034F115F116017B417B5180B-180D200B-200F202A-202E2060-206F3164FE00-FE0FFEFFFFA0FFF0-FFF8",
        // \p{Any} matches a code unit. To match any code point via surrogate pairs, use (?:[\0-\uD7FF\uDC00-\uFFFF]|[\uD800-\uDBFF][\uDC00-\uDFFF]|[\uD800-\uDBFF])
        Any: "0000-FFFF", // \p{^Any} compiles to [^\u0000-\uFFFF]; [\p{^Any}] to []
        Ascii: "0000-007F",
        // \p{Assigned} is equivalent to \p{^Cn}
        //Assigned: XRegExp("[\\p{^Cn}]").source.replace(/[[\]]|\\u/g, "") // Negation inside a character class triggers inversion
        Assigned: "0000-0377037A-037E0384-038A038C038E-03A103A3-05270531-05560559-055F0561-05870589058A058F0591-05C705D0-05EA05F0-05F40600-06040606-061B061E-070D070F-074A074D-07B107C0-07FA0800-082D0830-083E0840-085B085E08A008A2-08AC08E4-08FE0900-09770979-097F0981-09830985-098C098F09900993-09A809AA-09B009B209B6-09B909BC-09C409C709C809CB-09CE09D709DC09DD09DF-09E309E6-09FB0A01-0A030A05-0A0A0A0F0A100A13-0A280A2A-0A300A320A330A350A360A380A390A3C0A3E-0A420A470A480A4B-0A4D0A510A59-0A5C0A5E0A66-0A750A81-0A830A85-0A8D0A8F-0A910A93-0AA80AAA-0AB00AB20AB30AB5-0AB90ABC-0AC50AC7-0AC90ACB-0ACD0AD00AE0-0AE30AE6-0AF10B01-0B030B05-0B0C0B0F0B100B13-0B280B2A-0B300B320B330B35-0B390B3C-0B440B470B480B4B-0B4D0B560B570B5C0B5D0B5F-0B630B66-0B770B820B830B85-0B8A0B8E-0B900B92-0B950B990B9A0B9C0B9E0B9F0BA30BA40BA8-0BAA0BAE-0BB90BBE-0BC20BC6-0BC80BCA-0BCD0BD00BD70BE6-0BFA0C01-0C030C05-0C0C0C0E-0C100C12-0C280C2A-0C330C35-0C390C3D-0C440C46-0C480C4A-0C4D0C550C560C580C590C60-0C630C66-0C6F0C78-0C7F0C820C830C85-0C8C0C8E-0C900C92-0CA80CAA-0CB30CB5-0CB90CBC-0CC40CC6-0CC80CCA-0CCD0CD50CD60CDE0CE0-0CE30CE6-0CEF0CF10CF20D020D030D05-0D0C0D0E-0D100D12-0D3A0D3D-0D440D46-0D480D4A-0D4E0D570D60-0D630D66-0D750D79-0D7F0D820D830D85-0D960D9A-0DB10DB3-0DBB0DBD0DC0-0DC60DCA0DCF-0DD40DD60DD8-0DDF0DF2-0DF40E01-0E3A0E3F-0E5B0E810E820E840E870E880E8A0E8D0E94-0E970E99-0E9F0EA1-0EA30EA50EA70EAA0EAB0EAD-0EB90EBB-0EBD0EC0-0EC40EC60EC8-0ECD0ED0-0ED90EDC-0EDF0F00-0F470F49-0F6C0F71-0F970F99-0FBC0FBE-0FCC0FCE-0FDA1000-10C510C710CD10D0-1248124A-124D1250-12561258125A-125D1260-1288128A-128D1290-12B012B2-12B512B8-12BE12C012C2-12C512C8-12D612D8-13101312-13151318-135A135D-137C1380-139913A0-13F41400-169C16A0-16F01700-170C170E-17141720-17361740-17531760-176C176E-1770177217731780-17DD17E0-17E917F0-17F91800-180E1810-18191820-18771880-18AA18B0-18F51900-191C1920-192B1930-193B19401944-196D1970-19741980-19AB19B0-19C919D0-19DA19DE-1A1B1A1E-1A5E1A60-1A7C1A7F-1A891A90-1A991AA0-1AAD1B00-1B4B1B50-1B7C1B80-1BF31BFC-1C371C3B-1C491C4D-1C7F1CC0-1CC71CD0-1CF61D00-1DE61DFC-1F151F18-1F1D1F20-1F451F48-1F4D1F50-1F571F591F5B1F5D1F5F-1F7D1F80-1FB41FB6-1FC41FC6-1FD31FD6-1FDB1FDD-1FEF1FF2-1FF41FF6-1FFE2000-2064206A-20712074-208E2090-209C20A0-20B920D0-20F02100-21892190-23F32400-24262440-244A2460-26FF2701-2B4C2B50-2B592C00-2C2E2C30-2C5E2C60-2CF32CF9-2D252D272D2D2D30-2D672D6F2D702D7F-2D962DA0-2DA62DA8-2DAE2DB0-2DB62DB8-2DBE2DC0-2DC62DC8-2DCE2DD0-2DD62DD8-2DDE2DE0-2E3B2E80-2E992E9B-2EF32F00-2FD52FF0-2FFB3000-303F3041-30963099-30FF3105-312D3131-318E3190-31BA31C0-31E331F0-321E3220-32FE3300-4DB54DC0-9FCCA000-A48CA490-A4C6A4D0-A62BA640-A697A69F-A6F7A700-A78EA790-A793A7A0-A7AAA7F8-A82BA830-A839A840-A877A880-A8C4A8CE-A8D9A8E0-A8FBA900-A953A95F-A97CA980-A9CDA9CF-A9D9A9DEA9DFAA00-AA36AA40-AA4DAA50-AA59AA5C-AA7BAA80-AAC2AADB-AAF6AB01-AB06AB09-AB0EAB11-AB16AB20-AB26AB28-AB2EABC0-ABEDABF0-ABF9AC00-D7A3D7B0-D7C6D7CB-D7FBD800-FA6DFA70-FAD9FB00-FB06FB13-FB17FB1D-FB36FB38-FB3CFB3EFB40FB41FB43FB44FB46-FBC1FBD3-FD3FFD50-FD8FFD92-FDC7FDF0-FDFDFE00-FE19FE20-FE26FE30-FE52FE54-FE66FE68-FE6BFE70-FE74FE76-FEFCFEFFFF01-FFBEFFC2-FFC7FFCA-FFCFFFD2-FFD7FFDA-FFDCFFE0-FFE6FFE8-FFEEFFF9-FFFD"
    });

}(XRegExp));


/***** matchrecursive.js *****/

/*!
 * XRegExp.matchRecursive v0.2.0
 * (c) 2009-2012 Steven Levithan <http://xregexp.com/>
 * MIT License
 */

(function (XRegExp) {
    "use strict";

/**
 * Returns a match detail object composed of the provided values.
 * @private
 */
    function row(value, name, start, end) {
        return {value:value, name:name, start:start, end:end};
    }

/**
 * Returns an array of match strings between outermost left and right delimiters, or an array of
 * objects with detailed match parts and position data. An error is thrown if delimiters are
 * unbalanced within the data.
 * @memberOf XRegExp
 * @param {String} str String to search.
 * @param {String} left Left delimiter as an XRegExp pattern.
 * @param {String} right Right delimiter as an XRegExp pattern.
 * @param {String} [flags] Flags for the left and right delimiters. Use any of: `gimnsxy`.
 * @param {Object} [options] Lets you specify `valueNames` and `escapeChar` options.
 * @returns {Array} Array of matches, or an empty array.
 * @example
 *
 * // Basic usage
 * var str = '(t((e))s)t()(ing)';
 * XRegExp.matchRecursive(str, '\\(', '\\)', 'g');
 * // -> ['t((e))s', '', 'ing']
 *
 * // Extended information mode with valueNames
 * str = 'Here is <div> <div>an</div></div> example';
 * XRegExp.matchRecursive(str, '<div\\s*>', '</div>', 'gi', {
 *   valueNames: ['between', 'left', 'match', 'right']
 * });
 * // -> [
 * // {name: 'between', value: 'Here is ',       start: 0,  end: 8},
 * // {name: 'left',    value: '<div>',          start: 8,  end: 13},
 * // {name: 'match',   value: ' <div>an</div>', start: 13, end: 27},
 * // {name: 'right',   value: '</div>',         start: 27, end: 33},
 * // {name: 'between', value: ' example',       start: 33, end: 41}
 * // ]
 *
 * // Omitting unneeded parts with null valueNames, and using escapeChar
 * str = '...{1}\\{{function(x,y){return y+x;}}';
 * XRegExp.matchRecursive(str, '{', '}', 'g', {
 *   valueNames: ['literal', null, 'value', null],
 *   escapeChar: '\\'
 * });
 * // -> [
 * // {name: 'literal', value: '...', start: 0, end: 3},
 * // {name: 'value',   value: '1',   start: 4, end: 5},
 * // {name: 'literal', value: '\\{', start: 6, end: 8},
 * // {name: 'value',   value: 'function(x,y){return y+x;}', start: 9, end: 35}
 * // ]
 *
 * // Sticky mode via flag y
 * str = '<1><<<2>>><3>4<5>';
 * XRegExp.matchRecursive(str, '<', '>', 'gy');
 * // -> ['1', '<<2>>', '3']
 */
    XRegExp.matchRecursive = function (str, left, right, flags, options) {
        flags = flags || "";
        options = options || {};
        var global = flags.indexOf("g") > -1,
            sticky = flags.indexOf("y") > -1,
            basicFlags = flags.replace(/y/g, ""), // Flag y controlled internally
            escapeChar = options.escapeChar,
            vN = options.valueNames,
            output = [],
            openTokens = 0,
            delimStart = 0,
            delimEnd = 0,
            lastOuterEnd = 0,
            outerStart,
            innerStart,
            leftMatch,
            rightMatch,
            esc;
        left = XRegExp(left, basicFlags);
        right = XRegExp(right, basicFlags);

        if (escapeChar) {
            if (escapeChar.length > 1) {
                throw new SyntaxError("can't use more than one escape character");
            }
            escapeChar = XRegExp.escape(escapeChar);
            // Using XRegExp.union safely rewrites backreferences in `left` and `right`
            esc = new RegExp(
                "(?:" + escapeChar + "[\\S\\s]|(?:(?!" + XRegExp.union([left, right]).source + ")[^" + escapeChar + "])+)+",
                flags.replace(/[^im]+/g, "") // Flags gy not needed here; flags nsx handled by XRegExp
            );
        }

        while (true) {
            // If using an escape character, advance to the delimiter's next starting position,
            // skipping any escaped characters in between
            if (escapeChar) {
                delimEnd += (XRegExp.exec(str, esc, delimEnd, "sticky") || [""])[0].length;
            }
            leftMatch = XRegExp.exec(str, left, delimEnd);
            rightMatch = XRegExp.exec(str, right, delimEnd);
            // Keep the leftmost match only
            if (leftMatch && rightMatch) {
                if (leftMatch.index <= rightMatch.index) {
                    rightMatch = null;
                } else {
                    leftMatch = null;
                }
            }
            /* Paths (LM:leftMatch, RM:rightMatch, OT:openTokens):
            LM | RM | OT | Result
            1  | 0  | 1  | loop
            1  | 0  | 0  | loop
            0  | 1  | 1  | loop
            0  | 1  | 0  | throw
            0  | 0  | 1  | throw
            0  | 0  | 0  | break
            * Doesn't include the sticky mode special case
            * Loop ends after the first completed match if `!global` */
            if (leftMatch || rightMatch) {
                delimStart = (leftMatch || rightMatch).index;
                delimEnd = delimStart + (leftMatch || rightMatch)[0].length;
            } else if (!openTokens) {
                break;
            }
            if (sticky && !openTokens && delimStart > lastOuterEnd) {
                break;
            }
            if (leftMatch) {
                if (!openTokens) {
                    outerStart = delimStart;
                    innerStart = delimEnd;
                }
                ++openTokens;
            } else if (rightMatch && openTokens) {
                if (!--openTokens) {
                    if (vN) {
                        if (vN[0] && outerStart > lastOuterEnd) {
                            output.push(row(vN[0], str.slice(lastOuterEnd, outerStart), lastOuterEnd, outerStart));
                        }
                        if (vN[1]) {
                            output.push(row(vN[1], str.slice(outerStart, innerStart), outerStart, innerStart));
                        }
                        if (vN[2]) {
                            output.push(row(vN[2], str.slice(innerStart, delimStart), innerStart, delimStart));
                        }
                        if (vN[3]) {
                            output.push(row(vN[3], str.slice(delimStart, delimEnd), delimStart, delimEnd));
                        }
                    } else {
                        output.push(str.slice(innerStart, delimStart));
                    }
                    lastOuterEnd = delimEnd;
                    if (!global) {
                        break;
                    }
                }
            } else {
                throw new Error("string contains unbalanced delimiters");
            }
            // If the delimiter matched an empty string, avoid an infinite loop
            if (delimStart === delimEnd) {
                ++delimEnd;
            }
        }

        if (global && !sticky && vN && vN[0] && str.length > lastOuterEnd) {
            output.push(row(vN[0], str.slice(lastOuterEnd), lastOuterEnd, str.length));
        }

        return output;
    };

}(XRegExp));


/***** build.js *****/

/*!
 * XRegExp.build v0.1.0
 * (c) 2012 Steven Levithan <http://xregexp.com/>
 * MIT License
 * Inspired by RegExp.create by Lea Verou <http://lea.verou.me/>
 */

(function (XRegExp) {
    "use strict";

    var subparts = /(\()(?!\?)|\\([1-9]\d*)|\\[\s\S]|\[(?:[^\\\]]|\\[\s\S])*]/g,
        parts = XRegExp.union([/\({{([\w$]+)}}\)|{{([\w$]+)}}/, subparts], "g");

/**
 * Strips a leading `^` and trailing unescaped `$`, if both are present.
 * @private
 * @param {String} pattern Pattern to process.
 * @returns {String} Pattern with edge anchors removed.
 */
    function deanchor(pattern) {
        var startAnchor = /^(?:\(\?:\))?\^/, // Leading `^` or `(?:)^` (handles /x cruft)
            endAnchor = /\$(?:\(\?:\))?$/; // Trailing `$` or `$(?:)` (handles /x cruft)
        if (endAnchor.test(pattern.replace(/\\[\s\S]/g, ""))) { // Ensure trailing `$` isn't escaped
            return pattern.replace(startAnchor, "").replace(endAnchor, "");
        }
        return pattern;
    }

/**
 * Converts the provided value to an XRegExp.
 * @private
 * @param {String|RegExp} value Value to convert.
 * @returns {RegExp} XRegExp object with XRegExp syntax applied.
 */
    function asXRegExp(value) {
        return XRegExp.isRegExp(value) ?
                (value.xregexp && !value.xregexp.isNative ? value : XRegExp(value.source)) :
                XRegExp(value);
    }

/**
 * Builds regexes using named subpatterns, for readability and pattern reuse. Backreferences in the
 * outer pattern and provided subpatterns are automatically renumbered to work correctly. Native
 * flags used by provided subpatterns are ignored in favor of the `flags` argument.
 * @memberOf XRegExp
 * @param {String} pattern XRegExp pattern using `{{name}}` for embedded subpatterns. Allows
 *   `({{name}})` as shorthand for `(?<name>{{name}})`. Patterns cannot be embedded within
 *   character classes.
 * @param {Object} subs Lookup object for named subpatterns. Values can be strings or regexes. A
 *   leading `^` and trailing unescaped `$` are stripped from subpatterns, if both are present.
 * @param {String} [flags] Any combination of XRegExp flags.
 * @returns {RegExp} Regex with interpolated subpatterns.
 * @example
 *
 * var time = XRegExp.build('(?x)^ {{hours}} ({{minutes}}) $', {
 *   hours: XRegExp.build('{{h12}} : | {{h24}}', {
 *     h12: /1[0-2]|0?[1-9]/,
 *     h24: /2[0-3]|[01][0-9]/
 *   }, 'x'),
 *   minutes: /^[0-5][0-9]$/
 * });
 * time.test('10:59'); // -> true
 * XRegExp.exec('10:59', time).minutes; // -> '59'
 */
    XRegExp.build = function (pattern, subs, flags) {
        var inlineFlags = /^\(\?([\w$]+)\)/.exec(pattern),
            data = {},
            numCaps = 0, // Caps is short for captures
            numPriorCaps,
            numOuterCaps = 0,
            outerCapsMap = [0],
            outerCapNames,
            sub,
            p;

        // Add flags within a leading mode modifier to the overall pattern's flags
        if (inlineFlags) {
            flags = flags || "";
            inlineFlags[1].replace(/./g, function (flag) {
                flags += (flags.indexOf(flag) > -1 ? "" : flag); // Don't add duplicates
            });
        }

        for (p in subs) {
            if (subs.hasOwnProperty(p)) {
                // Passing to XRegExp enables entended syntax for subpatterns provided as strings
                // and ensures independent validity, lest an unescaped `(`, `)`, `[`, or trailing
                // `\` breaks the `(?:)` wrapper. For subpatterns provided as regexes, it dies on
                // octals and adds the `xregexp` property, for simplicity
                sub = asXRegExp(subs[p]);
                // Deanchoring allows embedding independently useful anchored regexes. If you
                // really need to keep your anchors, double them (i.e., `^^...$$`)
                data[p] = {pattern: deanchor(sub.source), names: sub.xregexp.captureNames || []};
            }
        }

        // Passing to XRegExp dies on octals and ensures the outer pattern is independently valid;
        // helps keep this simple. Named captures will be put back
        pattern = asXRegExp(pattern);
        outerCapNames = pattern.xregexp.captureNames || [];
        pattern = pattern.source.replace(parts, function ($0, $1, $2, $3, $4) {
            var subName = $1 || $2, capName, intro;
            if (subName) { // Named subpattern
                if (!data.hasOwnProperty(subName)) {
                    throw new ReferenceError("undefined property " + $0);
                }
                if ($1) { // Named subpattern was wrapped in a capturing group
                    capName = outerCapNames[numOuterCaps];
                    outerCapsMap[++numOuterCaps] = ++numCaps;
                    // If it's a named group, preserve the name. Otherwise, use the subpattern name
                    // as the capture name
                    intro = "(?<" + (capName || subName) + ">";
                } else {
                    intro = "(?:";
                }
                numPriorCaps = numCaps;
                return intro + data[subName].pattern.replace(subparts, function (match, paren, backref) {
                    if (paren) { // Capturing group
                        capName = data[subName].names[numCaps - numPriorCaps];
                        ++numCaps;
                        if (capName) { // If the current capture has a name, preserve the name
                            return "(?<" + capName + ">";
                        }
                    } else if (backref) { // Backreference
                        return "\\" + (+backref + numPriorCaps); // Rewrite the backreference
                    }
                    return match;
                }) + ")";
            }
            if ($3) { // Capturing group
                capName = outerCapNames[numOuterCaps];
                outerCapsMap[++numOuterCaps] = ++numCaps;
                if (capName) { // If the current capture has a name, preserve the name
                    return "(?<" + capName + ">";
                }
            } else if ($4) { // Backreference
                return "\\" + outerCapsMap[+$4]; // Rewrite the backreference
            }
            return $0;
        });

        return XRegExp(pattern, flags);
    };

}(XRegExp));


/***** prototypes.js *****/

/*!
 * XRegExp Prototype Methods v1.0.0
 * (c) 2012 Steven Levithan <http://xregexp.com/>
 * MIT License
 */

/**
 * Adds a collection of methods to `XRegExp.prototype`. RegExp objects copied by XRegExp are also
 * augmented with any `XRegExp.prototype` methods. Hence, the following work equivalently:
 *
 * XRegExp('[a-z]', 'ig').xexec('abc');
 * XRegExp(/[a-z]/ig).xexec('abc');
 * XRegExp.globalize(/[a-z]/i).xexec('abc');
 */
(function (XRegExp) {
    "use strict";

/**
 * Copy properties of `b` to `a`.
 * @private
 * @param {Object} a Object that will receive new properties.
 * @param {Object} b Object whose properties will be copied.
 */
    function extend(a, b) {
        for (var p in b) {
            if (b.hasOwnProperty(p)) {
                a[p] = b[p];
            }
        }
        //return a;
    }

    extend(XRegExp.prototype, {

/**
 * Implicitly calls the regex's `test` method with the first value in the provided arguments array.
 * @memberOf XRegExp.prototype
 * @param {*} context Ignored. Accepted only for congruity with `Function.prototype.apply`.
 * @param {Array} args Array with the string to search as its first value.
 * @returns {Boolean} Whether the regex matched the provided value.
 * @example
 *
 * XRegExp('[a-z]').apply(null, ['abc']); // -> true
 */
        apply: function (context, args) {
            return this.test(args[0]);
        },

/**
 * Implicitly calls the regex's `test` method with the provided string.
 * @memberOf XRegExp.prototype
 * @param {*} context Ignored. Accepted only for congruity with `Function.prototype.call`.
 * @param {String} str String to search.
 * @returns {Boolean} Whether the regex matched the provided value.
 * @example
 *
 * XRegExp('[a-z]').call(null, 'abc'); // -> true
 */
        call: function (context, str) {
            return this.test(str);
        },

/**
 * Implicitly calls {@link #XRegExp.forEach}.
 * @memberOf XRegExp.prototype
 * @example
 *
 * XRegExp('\\d').forEach('1a2345', function (match, i) {
 *   if (i % 2) this.push(+match[0]);
 * }, []);
 * // -> [2, 4]
 */
        forEach: function (str, callback, context) {
            return XRegExp.forEach(str, this, callback, context);
        },

/**
 * Implicitly calls {@link #XRegExp.globalize}.
 * @memberOf XRegExp.prototype
 * @example
 *
 * var globalCopy = XRegExp('regex').globalize();
 * globalCopy.global; // -> true
 */
        globalize: function () {
            return XRegExp.globalize(this);
        },

/**
 * Implicitly calls {@link #XRegExp.exec}.
 * @memberOf XRegExp.prototype
 * @example
 *
 * var match = XRegExp('U\\+(?<hex>[0-9A-F]{4})').xexec('U+2620');
 * match.hex; // -> '2620'
 */
        xexec: function (str, pos, sticky) {
            return XRegExp.exec(str, this, pos, sticky);
        },

/**
 * Implicitly calls {@link #XRegExp.test}.
 * @memberOf XRegExp.prototype
 * @example
 *
 * XRegExp('c').xtest('abc'); // -> true
 */
        xtest: function (str, pos, sticky) {
            return XRegExp.test(str, this, pos, sticky);
        }

    });

}(XRegExp));


},{}],105:[function(require,module,exports){
'use strict'

exports.byteLength = byteLength
exports.toByteArray = toByteArray
exports.fromByteArray = fromByteArray

var lookup = []
var revLookup = []
var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array

var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
for (var i = 0, len = code.length; i < len; ++i) {
  lookup[i] = code[i]
  revLookup[code.charCodeAt(i)] = i
}

revLookup['-'.charCodeAt(0)] = 62
revLookup['_'.charCodeAt(0)] = 63

function placeHoldersCount (b64) {
  var len = b64.length
  if (len % 4 > 0) {
    throw new Error('Invalid string. Length must be a multiple of 4')
  }

  // the number of equal signs (place holders)
  // if there are two placeholders, than the two characters before it
  // represent one byte
  // if there is only one, then the three characters before it represent 2 bytes
  // this is just a cheap hack to not do indexOf twice
  return b64[len - 2] === '=' ? 2 : b64[len - 1] === '=' ? 1 : 0
}

function byteLength (b64) {
  // base64 is 4/3 + up to two characters of the original data
  return b64.length * 3 / 4 - placeHoldersCount(b64)
}

function toByteArray (b64) {
  var i, j, l, tmp, placeHolders, arr
  var len = b64.length
  placeHolders = placeHoldersCount(b64)

  arr = new Arr(len * 3 / 4 - placeHolders)

  // if there are placeholders, only get up to the last complete 4 chars
  l = placeHolders > 0 ? len - 4 : len

  var L = 0

  for (i = 0, j = 0; i < l; i += 4, j += 3) {
    tmp = (revLookup[b64.charCodeAt(i)] << 18) | (revLookup[b64.charCodeAt(i + 1)] << 12) | (revLookup[b64.charCodeAt(i + 2)] << 6) | revLookup[b64.charCodeAt(i + 3)]
    arr[L++] = (tmp >> 16) & 0xFF
    arr[L++] = (tmp >> 8) & 0xFF
    arr[L++] = tmp & 0xFF
  }

  if (placeHolders === 2) {
    tmp = (revLookup[b64.charCodeAt(i)] << 2) | (revLookup[b64.charCodeAt(i + 1)] >> 4)
    arr[L++] = tmp & 0xFF
  } else if (placeHolders === 1) {
    tmp = (revLookup[b64.charCodeAt(i)] << 10) | (revLookup[b64.charCodeAt(i + 1)] << 4) | (revLookup[b64.charCodeAt(i + 2)] >> 2)
    arr[L++] = (tmp >> 8) & 0xFF
    arr[L++] = tmp & 0xFF
  }

  return arr
}

function tripletToBase64 (num) {
  return lookup[num >> 18 & 0x3F] + lookup[num >> 12 & 0x3F] + lookup[num >> 6 & 0x3F] + lookup[num & 0x3F]
}

function encodeChunk (uint8, start, end) {
  var tmp
  var output = []
  for (var i = start; i < end; i += 3) {
    tmp = (uint8[i] << 16) + (uint8[i + 1] << 8) + (uint8[i + 2])
    output.push(tripletToBase64(tmp))
  }
  return output.join('')
}

function fromByteArray (uint8) {
  var tmp
  var len = uint8.length
  var extraBytes = len % 3 // if we have 1 byte left, pad 2 bytes
  var output = ''
  var parts = []
  var maxChunkLength = 16383 // must be multiple of 3

  // go through the array every three bytes, we'll deal with trailing stuff later
  for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
    parts.push(encodeChunk(uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)))
  }

  // pad the end with zeros, but make sure to not forget the extra bytes
  if (extraBytes === 1) {
    tmp = uint8[len - 1]
    output += lookup[tmp >> 2]
    output += lookup[(tmp << 4) & 0x3F]
    output += '=='
  } else if (extraBytes === 2) {
    tmp = (uint8[len - 2] << 8) + (uint8[len - 1])
    output += lookup[tmp >> 10]
    output += lookup[(tmp >> 4) & 0x3F]
    output += lookup[(tmp << 2) & 0x3F]
    output += '='
  }

  parts.push(output)

  return parts.join('')
}

},{}],106:[function(require,module,exports){

},{}],107:[function(require,module,exports){
(function (global){
'use strict';

var buffer = require('buffer');
var Buffer = buffer.Buffer;
var SlowBuffer = buffer.SlowBuffer;
var MAX_LEN = buffer.kMaxLength || 2147483647;
exports.alloc = function alloc(size, fill, encoding) {
  if (typeof Buffer.alloc === 'function') {
    return Buffer.alloc(size, fill, encoding);
  }
  if (typeof encoding === 'number') {
    throw new TypeError('encoding must not be number');
  }
  if (typeof size !== 'number') {
    throw new TypeError('size must be a number');
  }
  if (size > MAX_LEN) {
    throw new RangeError('size is too large');
  }
  var enc = encoding;
  var _fill = fill;
  if (_fill === undefined) {
    enc = undefined;
    _fill = 0;
  }
  var buf = new Buffer(size);
  if (typeof _fill === 'string') {
    var fillBuf = new Buffer(_fill, enc);
    var flen = fillBuf.length;
    var i = -1;
    while (++i < size) {
      buf[i] = fillBuf[i % flen];
    }
  } else {
    buf.fill(_fill);
  }
  return buf;
}
exports.allocUnsafe = function allocUnsafe(size) {
  if (typeof Buffer.allocUnsafe === 'function') {
    return Buffer.allocUnsafe(size);
  }
  if (typeof size !== 'number') {
    throw new TypeError('size must be a number');
  }
  if (size > MAX_LEN) {
    throw new RangeError('size is too large');
  }
  return new Buffer(size);
}
exports.from = function from(value, encodingOrOffset, length) {
  if (typeof Buffer.from === 'function' && (!global.Uint8Array || Uint8Array.from !== Buffer.from)) {
    return Buffer.from(value, encodingOrOffset, length);
  }
  if (typeof value === 'number') {
    throw new TypeError('"value" argument must not be a number');
  }
  if (typeof value === 'string') {
    return new Buffer(value, encodingOrOffset);
  }
  if (typeof ArrayBuffer !== 'undefined' && value instanceof ArrayBuffer) {
    var offset = encodingOrOffset;
    if (arguments.length === 1) {
      return new Buffer(value);
    }
    if (typeof offset === 'undefined') {
      offset = 0;
    }
    var len = length;
    if (typeof len === 'undefined') {
      len = value.byteLength - offset;
    }
    if (offset >= value.byteLength) {
      throw new RangeError('\'offset\' is out of bounds');
    }
    if (len > value.byteLength - offset) {
      throw new RangeError('\'length\' is out of bounds');
    }
    return new Buffer(value.slice(offset, offset + len));
  }
  if (Buffer.isBuffer(value)) {
    var out = new Buffer(value.length);
    value.copy(out, 0, 0, value.length);
    return out;
  }
  if (value) {
    if (Array.isArray(value) || (typeof ArrayBuffer !== 'undefined' && value.buffer instanceof ArrayBuffer) || 'length' in value) {
      return new Buffer(value);
    }
    if (value.type === 'Buffer' && Array.isArray(value.data)) {
      return new Buffer(value.data);
    }
  }

  throw new TypeError('First argument must be a string, Buffer, ' + 'ArrayBuffer, Array, or array-like object.');
}
exports.allocUnsafeSlow = function allocUnsafeSlow(size) {
  if (typeof Buffer.allocUnsafeSlow === 'function') {
    return Buffer.allocUnsafeSlow(size);
  }
  if (typeof size !== 'number') {
    throw new TypeError('size must be a number');
  }
  if (size >= MAX_LEN) {
    throw new RangeError('size is too large');
  }
  return new SlowBuffer(size);
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"buffer":108}],108:[function(require,module,exports){
(function (global){
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
 * @license  MIT
 */
/* eslint-disable no-proto */

'use strict'

var base64 = require('base64-js')
var ieee754 = require('ieee754')
var isArray = require('isarray')

exports.Buffer = Buffer
exports.SlowBuffer = SlowBuffer
exports.INSPECT_MAX_BYTES = 50

/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Use Object implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * Due to various browser bugs, sometimes the Object implementation will be used even
 * when the browser supports typed arrays.
 *
 * Note:
 *
 *   - Firefox 4-29 lacks support for adding new properties to `Uint8Array` instances,
 *     See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438.
 *
 *   - Chrome 9-10 is missing the `TypedArray.prototype.subarray` function.
 *
 *   - IE10 has a broken `TypedArray.prototype.subarray` function which returns arrays of
 *     incorrect length in some situations.

 * We detect these buggy browsers and set `Buffer.TYPED_ARRAY_SUPPORT` to `false` so they
 * get the Object implementation, which is slower but behaves correctly.
 */
Buffer.TYPED_ARRAY_SUPPORT = global.TYPED_ARRAY_SUPPORT !== undefined
  ? global.TYPED_ARRAY_SUPPORT
  : typedArraySupport()

/*
 * Export kMaxLength after typed array support is determined.
 */
exports.kMaxLength = kMaxLength()

function typedArraySupport () {
  try {
    var arr = new Uint8Array(1)
    arr.__proto__ = {__proto__: Uint8Array.prototype, foo: function () { return 42 }}
    return arr.foo() === 42 && // typed array instances can be augmented
        typeof arr.subarray === 'function' && // chrome 9-10 lack `subarray`
        arr.subarray(1, 1).byteLength === 0 // ie10 has broken `subarray`
  } catch (e) {
    return false
  }
}

function kMaxLength () {
  return Buffer.TYPED_ARRAY_SUPPORT
    ? 0x7fffffff
    : 0x3fffffff
}

function createBuffer (that, length) {
  if (kMaxLength() < length) {
    throw new RangeError('Invalid typed array length')
  }
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    // Return an augmented `Uint8Array` instance, for best performance
    that = new Uint8Array(length)
    that.__proto__ = Buffer.prototype
  } else {
    // Fallback: Return an object instance of the Buffer class
    if (that === null) {
      that = new Buffer(length)
    }
    that.length = length
  }

  return that
}

/**
 * The Buffer constructor returns instances of `Uint8Array` that have their
 * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
 * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
 * and the `Uint8Array` methods. Square bracket notation works as expected -- it
 * returns a single octet.
 *
 * The `Uint8Array` prototype remains unmodified.
 */

function Buffer (arg, encodingOrOffset, length) {
  if (!Buffer.TYPED_ARRAY_SUPPORT && !(this instanceof Buffer)) {
    return new Buffer(arg, encodingOrOffset, length)
  }

  // Common case.
  if (typeof arg === 'number') {
    if (typeof encodingOrOffset === 'string') {
      throw new Error(
        'If encoding is specified then the first argument must be a string'
      )
    }
    return allocUnsafe(this, arg)
  }
  return from(this, arg, encodingOrOffset, length)
}

Buffer.poolSize = 8192 // not used by this implementation

// TODO: Legacy, not needed anymore. Remove in next major version.
Buffer._augment = function (arr) {
  arr.__proto__ = Buffer.prototype
  return arr
}

function from (that, value, encodingOrOffset, length) {
  if (typeof value === 'number') {
    throw new TypeError('"value" argument must not be a number')
  }

  if (typeof ArrayBuffer !== 'undefined' && value instanceof ArrayBuffer) {
    return fromArrayBuffer(that, value, encodingOrOffset, length)
  }

  if (typeof value === 'string') {
    return fromString(that, value, encodingOrOffset)
  }

  return fromObject(that, value)
}

/**
 * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
 * if value is a number.
 * Buffer.from(str[, encoding])
 * Buffer.from(array)
 * Buffer.from(buffer)
 * Buffer.from(arrayBuffer[, byteOffset[, length]])
 **/
Buffer.from = function (value, encodingOrOffset, length) {
  return from(null, value, encodingOrOffset, length)
}

if (Buffer.TYPED_ARRAY_SUPPORT) {
  Buffer.prototype.__proto__ = Uint8Array.prototype
  Buffer.__proto__ = Uint8Array
  if (typeof Symbol !== 'undefined' && Symbol.species &&
      Buffer[Symbol.species] === Buffer) {
    // Fix subarray() in ES2016. See: https://github.com/feross/buffer/pull/97
    Object.defineProperty(Buffer, Symbol.species, {
      value: null,
      configurable: true
    })
  }
}

function assertSize (size) {
  if (typeof size !== 'number') {
    throw new TypeError('"size" argument must be a number')
  } else if (size < 0) {
    throw new RangeError('"size" argument must not be negative')
  }
}

function alloc (that, size, fill, encoding) {
  assertSize(size)
  if (size <= 0) {
    return createBuffer(that, size)
  }
  if (fill !== undefined) {
    // Only pay attention to encoding if it's a string. This
    // prevents accidentally sending in a number that would
    // be interpretted as a start offset.
    return typeof encoding === 'string'
      ? createBuffer(that, size).fill(fill, encoding)
      : createBuffer(that, size).fill(fill)
  }
  return createBuffer(that, size)
}

/**
 * Creates a new filled Buffer instance.
 * alloc(size[, fill[, encoding]])
 **/
Buffer.alloc = function (size, fill, encoding) {
  return alloc(null, size, fill, encoding)
}

function allocUnsafe (that, size) {
  assertSize(size)
  that = createBuffer(that, size < 0 ? 0 : checked(size) | 0)
  if (!Buffer.TYPED_ARRAY_SUPPORT) {
    for (var i = 0; i < size; ++i) {
      that[i] = 0
    }
  }
  return that
}

/**
 * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
 * */
Buffer.allocUnsafe = function (size) {
  return allocUnsafe(null, size)
}
/**
 * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
 */
Buffer.allocUnsafeSlow = function (size) {
  return allocUnsafe(null, size)
}

function fromString (that, string, encoding) {
  if (typeof encoding !== 'string' || encoding === '') {
    encoding = 'utf8'
  }

  if (!Buffer.isEncoding(encoding)) {
    throw new TypeError('"encoding" must be a valid string encoding')
  }

  var length = byteLength(string, encoding) | 0
  that = createBuffer(that, length)

  var actual = that.write(string, encoding)

  if (actual !== length) {
    // Writing a hex string, for example, that contains invalid characters will
    // cause everything after the first invalid character to be ignored. (e.g.
    // 'abxxcd' will be treated as 'ab')
    that = that.slice(0, actual)
  }

  return that
}

function fromArrayLike (that, array) {
  var length = array.length < 0 ? 0 : checked(array.length) | 0
  that = createBuffer(that, length)
  for (var i = 0; i < length; i += 1) {
    that[i] = array[i] & 255
  }
  return that
}

function fromArrayBuffer (that, array, byteOffset, length) {
  array.byteLength // this throws if `array` is not a valid ArrayBuffer

  if (byteOffset < 0 || array.byteLength < byteOffset) {
    throw new RangeError('\'offset\' is out of bounds')
  }

  if (array.byteLength < byteOffset + (length || 0)) {
    throw new RangeError('\'length\' is out of bounds')
  }

  if (byteOffset === undefined && length === undefined) {
    array = new Uint8Array(array)
  } else if (length === undefined) {
    array = new Uint8Array(array, byteOffset)
  } else {
    array = new Uint8Array(array, byteOffset, length)
  }

  if (Buffer.TYPED_ARRAY_SUPPORT) {
    // Return an augmented `Uint8Array` instance, for best performance
    that = array
    that.__proto__ = Buffer.prototype
  } else {
    // Fallback: Return an object instance of the Buffer class
    that = fromArrayLike(that, array)
  }
  return that
}

function fromObject (that, obj) {
  if (Buffer.isBuffer(obj)) {
    var len = checked(obj.length) | 0
    that = createBuffer(that, len)

    if (that.length === 0) {
      return that
    }

    obj.copy(that, 0, 0, len)
    return that
  }

  if (obj) {
    if ((typeof ArrayBuffer !== 'undefined' &&
        obj.buffer instanceof ArrayBuffer) || 'length' in obj) {
      if (typeof obj.length !== 'number' || isnan(obj.length)) {
        return createBuffer(that, 0)
      }
      return fromArrayLike(that, obj)
    }

    if (obj.type === 'Buffer' && isArray(obj.data)) {
      return fromArrayLike(that, obj.data)
    }
  }

  throw new TypeError('First argument must be a string, Buffer, ArrayBuffer, Array, or array-like object.')
}

function checked (length) {
  // Note: cannot use `length < kMaxLength()` here because that fails when
  // length is NaN (which is otherwise coerced to zero.)
  if (length >= kMaxLength()) {
    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                         'size: 0x' + kMaxLength().toString(16) + ' bytes')
  }
  return length | 0
}

function SlowBuffer (length) {
  if (+length != length) { // eslint-disable-line eqeqeq
    length = 0
  }
  return Buffer.alloc(+length)
}

Buffer.isBuffer = function isBuffer (b) {
  return !!(b != null && b._isBuffer)
}

Buffer.compare = function compare (a, b) {
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
    throw new TypeError('Arguments must be Buffers')
  }

  if (a === b) return 0

  var x = a.length
  var y = b.length

  for (var i = 0, len = Math.min(x, y); i < len; ++i) {
    if (a[i] !== b[i]) {
      x = a[i]
      y = b[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

Buffer.isEncoding = function isEncoding (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'latin1':
    case 'binary':
    case 'base64':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.concat = function concat (list, length) {
  if (!isArray(list)) {
    throw new TypeError('"list" argument must be an Array of Buffers')
  }

  if (list.length === 0) {
    return Buffer.alloc(0)
  }

  var i
  if (length === undefined) {
    length = 0
    for (i = 0; i < list.length; ++i) {
      length += list[i].length
    }
  }

  var buffer = Buffer.allocUnsafe(length)
  var pos = 0
  for (i = 0; i < list.length; ++i) {
    var buf = list[i]
    if (!Buffer.isBuffer(buf)) {
      throw new TypeError('"list" argument must be an Array of Buffers')
    }
    buf.copy(buffer, pos)
    pos += buf.length
  }
  return buffer
}

function byteLength (string, encoding) {
  if (Buffer.isBuffer(string)) {
    return string.length
  }
  if (typeof ArrayBuffer !== 'undefined' && typeof ArrayBuffer.isView === 'function' &&
      (ArrayBuffer.isView(string) || string instanceof ArrayBuffer)) {
    return string.byteLength
  }
  if (typeof string !== 'string') {
    string = '' + string
  }

  var len = string.length
  if (len === 0) return 0

  // Use a for loop to avoid recursion
  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'ascii':
      case 'latin1':
      case 'binary':
        return len
      case 'utf8':
      case 'utf-8':
      case undefined:
        return utf8ToBytes(string).length
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return len * 2
      case 'hex':
        return len >>> 1
      case 'base64':
        return base64ToBytes(string).length
      default:
        if (loweredCase) return utf8ToBytes(string).length // assume utf8
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}
Buffer.byteLength = byteLength

function slowToString (encoding, start, end) {
  var loweredCase = false

  // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
  // property of a typed array.

  // This behaves neither like String nor Uint8Array in that we set start/end
  // to their upper/lower bounds if the value passed is out of range.
  // undefined is handled specially as per ECMA-262 6th Edition,
  // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
  if (start === undefined || start < 0) {
    start = 0
  }
  // Return early if start > this.length. Done here to prevent potential uint32
  // coercion fail below.
  if (start > this.length) {
    return ''
  }

  if (end === undefined || end > this.length) {
    end = this.length
  }

  if (end <= 0) {
    return ''
  }

  // Force coersion to uint32. This will also coerce falsey/NaN values to 0.
  end >>>= 0
  start >>>= 0

  if (end <= start) {
    return ''
  }

  if (!encoding) encoding = 'utf8'

  while (true) {
    switch (encoding) {
      case 'hex':
        return hexSlice(this, start, end)

      case 'utf8':
      case 'utf-8':
        return utf8Slice(this, start, end)

      case 'ascii':
        return asciiSlice(this, start, end)

      case 'latin1':
      case 'binary':
        return latin1Slice(this, start, end)

      case 'base64':
        return base64Slice(this, start, end)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return utf16leSlice(this, start, end)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = (encoding + '').toLowerCase()
        loweredCase = true
    }
  }
}

// The property is used by `Buffer.isBuffer` and `is-buffer` (in Safari 5-7) to detect
// Buffer instances.
Buffer.prototype._isBuffer = true

function swap (b, n, m) {
  var i = b[n]
  b[n] = b[m]
  b[m] = i
}

Buffer.prototype.swap16 = function swap16 () {
  var len = this.length
  if (len % 2 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 16-bits')
  }
  for (var i = 0; i < len; i += 2) {
    swap(this, i, i + 1)
  }
  return this
}

Buffer.prototype.swap32 = function swap32 () {
  var len = this.length
  if (len % 4 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 32-bits')
  }
  for (var i = 0; i < len; i += 4) {
    swap(this, i, i + 3)
    swap(this, i + 1, i + 2)
  }
  return this
}

Buffer.prototype.swap64 = function swap64 () {
  var len = this.length
  if (len % 8 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 64-bits')
  }
  for (var i = 0; i < len; i += 8) {
    swap(this, i, i + 7)
    swap(this, i + 1, i + 6)
    swap(this, i + 2, i + 5)
    swap(this, i + 3, i + 4)
  }
  return this
}

Buffer.prototype.toString = function toString () {
  var length = this.length | 0
  if (length === 0) return ''
  if (arguments.length === 0) return utf8Slice(this, 0, length)
  return slowToString.apply(this, arguments)
}

Buffer.prototype.equals = function equals (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return true
  return Buffer.compare(this, b) === 0
}

Buffer.prototype.inspect = function inspect () {
  var str = ''
  var max = exports.INSPECT_MAX_BYTES
  if (this.length > 0) {
    str = this.toString('hex', 0, max).match(/.{2}/g).join(' ')
    if (this.length > max) str += ' ... '
  }
  return '<Buffer ' + str + '>'
}

Buffer.prototype.compare = function compare (target, start, end, thisStart, thisEnd) {
  if (!Buffer.isBuffer(target)) {
    throw new TypeError('Argument must be a Buffer')
  }

  if (start === undefined) {
    start = 0
  }
  if (end === undefined) {
    end = target ? target.length : 0
  }
  if (thisStart === undefined) {
    thisStart = 0
  }
  if (thisEnd === undefined) {
    thisEnd = this.length
  }

  if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
    throw new RangeError('out of range index')
  }

  if (thisStart >= thisEnd && start >= end) {
    return 0
  }
  if (thisStart >= thisEnd) {
    return -1
  }
  if (start >= end) {
    return 1
  }

  start >>>= 0
  end >>>= 0
  thisStart >>>= 0
  thisEnd >>>= 0

  if (this === target) return 0

  var x = thisEnd - thisStart
  var y = end - start
  var len = Math.min(x, y)

  var thisCopy = this.slice(thisStart, thisEnd)
  var targetCopy = target.slice(start, end)

  for (var i = 0; i < len; ++i) {
    if (thisCopy[i] !== targetCopy[i]) {
      x = thisCopy[i]
      y = targetCopy[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

// Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
// OR the last index of `val` in `buffer` at offset <= `byteOffset`.
//
// Arguments:
// - buffer - a Buffer to search
// - val - a string, Buffer, or number
// - byteOffset - an index into `buffer`; will be clamped to an int32
// - encoding - an optional encoding, relevant is val is a string
// - dir - true for indexOf, false for lastIndexOf
function bidirectionalIndexOf (buffer, val, byteOffset, encoding, dir) {
  // Empty buffer means no match
  if (buffer.length === 0) return -1

  // Normalize byteOffset
  if (typeof byteOffset === 'string') {
    encoding = byteOffset
    byteOffset = 0
  } else if (byteOffset > 0x7fffffff) {
    byteOffset = 0x7fffffff
  } else if (byteOffset < -0x80000000) {
    byteOffset = -0x80000000
  }
  byteOffset = +byteOffset  // Coerce to Number.
  if (isNaN(byteOffset)) {
    // byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
    byteOffset = dir ? 0 : (buffer.length - 1)
  }

  // Normalize byteOffset: negative offsets start from the end of the buffer
  if (byteOffset < 0) byteOffset = buffer.length + byteOffset
  if (byteOffset >= buffer.length) {
    if (dir) return -1
    else byteOffset = buffer.length - 1
  } else if (byteOffset < 0) {
    if (dir) byteOffset = 0
    else return -1
  }

  // Normalize val
  if (typeof val === 'string') {
    val = Buffer.from(val, encoding)
  }

  // Finally, search either indexOf (if dir is true) or lastIndexOf
  if (Buffer.isBuffer(val)) {
    // Special case: looking for empty string/buffer always fails
    if (val.length === 0) {
      return -1
    }
    return arrayIndexOf(buffer, val, byteOffset, encoding, dir)
  } else if (typeof val === 'number') {
    val = val & 0xFF // Search for a byte value [0-255]
    if (Buffer.TYPED_ARRAY_SUPPORT &&
        typeof Uint8Array.prototype.indexOf === 'function') {
      if (dir) {
        return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset)
      } else {
        return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset)
      }
    }
    return arrayIndexOf(buffer, [ val ], byteOffset, encoding, dir)
  }

  throw new TypeError('val must be string, number or Buffer')
}

function arrayIndexOf (arr, val, byteOffset, encoding, dir) {
  var indexSize = 1
  var arrLength = arr.length
  var valLength = val.length

  if (encoding !== undefined) {
    encoding = String(encoding).toLowerCase()
    if (encoding === 'ucs2' || encoding === 'ucs-2' ||
        encoding === 'utf16le' || encoding === 'utf-16le') {
      if (arr.length < 2 || val.length < 2) {
        return -1
      }
      indexSize = 2
      arrLength /= 2
      valLength /= 2
      byteOffset /= 2
    }
  }

  function read (buf, i) {
    if (indexSize === 1) {
      return buf[i]
    } else {
      return buf.readUInt16BE(i * indexSize)
    }
  }

  var i
  if (dir) {
    var foundIndex = -1
    for (i = byteOffset; i < arrLength; i++) {
      if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
        if (foundIndex === -1) foundIndex = i
        if (i - foundIndex + 1 === valLength) return foundIndex * indexSize
      } else {
        if (foundIndex !== -1) i -= i - foundIndex
        foundIndex = -1
      }
    }
  } else {
    if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength
    for (i = byteOffset; i >= 0; i--) {
      var found = true
      for (var j = 0; j < valLength; j++) {
        if (read(arr, i + j) !== read(val, j)) {
          found = false
          break
        }
      }
      if (found) return i
    }
  }

  return -1
}

Buffer.prototype.includes = function includes (val, byteOffset, encoding) {
  return this.indexOf(val, byteOffset, encoding) !== -1
}

Buffer.prototype.indexOf = function indexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, true)
}

Buffer.prototype.lastIndexOf = function lastIndexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, false)
}

function hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  // must be an even number of digits
  var strLen = string.length
  if (strLen % 2 !== 0) throw new TypeError('Invalid hex string')

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; ++i) {
    var parsed = parseInt(string.substr(i * 2, 2), 16)
    if (isNaN(parsed)) return i
    buf[offset + i] = parsed
  }
  return i
}

function utf8Write (buf, string, offset, length) {
  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
}

function asciiWrite (buf, string, offset, length) {
  return blitBuffer(asciiToBytes(string), buf, offset, length)
}

function latin1Write (buf, string, offset, length) {
  return asciiWrite(buf, string, offset, length)
}

function base64Write (buf, string, offset, length) {
  return blitBuffer(base64ToBytes(string), buf, offset, length)
}

function ucs2Write (buf, string, offset, length) {
  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
}

Buffer.prototype.write = function write (string, offset, length, encoding) {
  // Buffer#write(string)
  if (offset === undefined) {
    encoding = 'utf8'
    length = this.length
    offset = 0
  // Buffer#write(string, encoding)
  } else if (length === undefined && typeof offset === 'string') {
    encoding = offset
    length = this.length
    offset = 0
  // Buffer#write(string, offset[, length][, encoding])
  } else if (isFinite(offset)) {
    offset = offset | 0
    if (isFinite(length)) {
      length = length | 0
      if (encoding === undefined) encoding = 'utf8'
    } else {
      encoding = length
      length = undefined
    }
  // legacy write(string, encoding, offset, length) - remove in v0.13
  } else {
    throw new Error(
      'Buffer.write(string, encoding, offset[, length]) is no longer supported'
    )
  }

  var remaining = this.length - offset
  if (length === undefined || length > remaining) length = remaining

  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
    throw new RangeError('Attempt to write outside buffer bounds')
  }

  if (!encoding) encoding = 'utf8'

  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'hex':
        return hexWrite(this, string, offset, length)

      case 'utf8':
      case 'utf-8':
        return utf8Write(this, string, offset, length)

      case 'ascii':
        return asciiWrite(this, string, offset, length)

      case 'latin1':
      case 'binary':
        return latin1Write(this, string, offset, length)

      case 'base64':
        // Warning: maxLength not taken into account in base64Write
        return base64Write(this, string, offset, length)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return ucs2Write(this, string, offset, length)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.toJSON = function toJSON () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

function base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function utf8Slice (buf, start, end) {
  end = Math.min(buf.length, end)
  var res = []

  var i = start
  while (i < end) {
    var firstByte = buf[i]
    var codePoint = null
    var bytesPerSequence = (firstByte > 0xEF) ? 4
      : (firstByte > 0xDF) ? 3
      : (firstByte > 0xBF) ? 2
      : 1

    if (i + bytesPerSequence <= end) {
      var secondByte, thirdByte, fourthByte, tempCodePoint

      switch (bytesPerSequence) {
        case 1:
          if (firstByte < 0x80) {
            codePoint = firstByte
          }
          break
        case 2:
          secondByte = buf[i + 1]
          if ((secondByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
            if (tempCodePoint > 0x7F) {
              codePoint = tempCodePoint
            }
          }
          break
        case 3:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
              codePoint = tempCodePoint
            }
          }
          break
        case 4:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          fourthByte = buf[i + 3]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
              codePoint = tempCodePoint
            }
          }
      }
    }

    if (codePoint === null) {
      // we did not generate a valid codePoint so insert a
      // replacement char (U+FFFD) and advance only 1 byte
      codePoint = 0xFFFD
      bytesPerSequence = 1
    } else if (codePoint > 0xFFFF) {
      // encode to utf16 (surrogate pair dance)
      codePoint -= 0x10000
      res.push(codePoint >>> 10 & 0x3FF | 0xD800)
      codePoint = 0xDC00 | codePoint & 0x3FF
    }

    res.push(codePoint)
    i += bytesPerSequence
  }

  return decodeCodePointsArray(res)
}

// Based on http://stackoverflow.com/a/22747272/680742, the browser with
// the lowest limit is Chrome, with 0x10000 args.
// We go 1 magnitude less, for safety
var MAX_ARGUMENTS_LENGTH = 0x1000

function decodeCodePointsArray (codePoints) {
  var len = codePoints.length
  if (len <= MAX_ARGUMENTS_LENGTH) {
    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
  }

  // Decode in chunks to avoid "call stack size exceeded".
  var res = ''
  var i = 0
  while (i < len) {
    res += String.fromCharCode.apply(
      String,
      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
    )
  }
  return res
}

function asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i] & 0x7F)
  }
  return ret
}

function latin1Slice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i])
  }
  return ret
}

function hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; ++i) {
    out += toHex(buf[i])
  }
  return out
}

function utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var res = ''
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + bytes[i + 1] * 256)
  }
  return res
}

Buffer.prototype.slice = function slice (start, end) {
  var len = this.length
  start = ~~start
  end = end === undefined ? len : ~~end

  if (start < 0) {
    start += len
    if (start < 0) start = 0
  } else if (start > len) {
    start = len
  }

  if (end < 0) {
    end += len
    if (end < 0) end = 0
  } else if (end > len) {
    end = len
  }

  if (end < start) end = start

  var newBuf
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    newBuf = this.subarray(start, end)
    newBuf.__proto__ = Buffer.prototype
  } else {
    var sliceLen = end - start
    newBuf = new Buffer(sliceLen, undefined)
    for (var i = 0; i < sliceLen; ++i) {
      newBuf[i] = this[i + start]
    }
  }

  return newBuf
}

/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
function checkOffset (offset, ext, length) {
  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
}

Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }

  return val
}

Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) {
    checkOffset(offset, byteLength, this.length)
  }

  var val = this[offset + --byteLength]
  var mul = 1
  while (byteLength > 0 && (mul *= 0x100)) {
    val += this[offset + --byteLength] * mul
  }

  return val
}

Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 1, this.length)
  return this[offset]
}

Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  return this[offset] | (this[offset + 1] << 8)
}

Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  return (this[offset] << 8) | this[offset + 1]
}

Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return ((this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16)) +
      (this[offset + 3] * 0x1000000)
}

Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] * 0x1000000) +
    ((this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    this[offset + 3])
}

Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var i = byteLength
  var mul = 1
  var val = this[offset + --i]
  while (i > 0 && (mul *= 0x100)) {
    val += this[offset + --i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 1, this.length)
  if (!(this[offset] & 0x80)) return (this[offset])
  return ((0xff - this[offset] + 1) * -1)
}

Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset] | (this[offset + 1] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset + 1] | (this[offset] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset]) |
    (this[offset + 1] << 8) |
    (this[offset + 2] << 16) |
    (this[offset + 3] << 24)
}

Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] << 24) |
    (this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    (this[offset + 3])
}

Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, true, 23, 4)
}

Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, false, 23, 4)
}

Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, true, 52, 8)
}

Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, false, 52, 8)
}

function checkInt (buf, value, offset, ext, max, min) {
  if (!Buffer.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance')
  if (value > max || value < min) throw new RangeError('"value" argument is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
}

Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var mul = 1
  var i = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var i = byteLength - 1
  var mul = 1
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
  this[offset] = (value & 0xff)
  return offset + 1
}

function objectWriteUInt16 (buf, value, offset, littleEndian) {
  if (value < 0) value = 0xffff + value + 1
  for (var i = 0, j = Math.min(buf.length - offset, 2); i < j; ++i) {
    buf[offset + i] = (value & (0xff << (8 * (littleEndian ? i : 1 - i)))) >>>
      (littleEndian ? i : 1 - i) * 8
  }
}

Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff)
    this[offset + 1] = (value >>> 8)
  } else {
    objectWriteUInt16(this, value, offset, true)
  }
  return offset + 2
}

Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 8)
    this[offset + 1] = (value & 0xff)
  } else {
    objectWriteUInt16(this, value, offset, false)
  }
  return offset + 2
}

function objectWriteUInt32 (buf, value, offset, littleEndian) {
  if (value < 0) value = 0xffffffff + value + 1
  for (var i = 0, j = Math.min(buf.length - offset, 4); i < j; ++i) {
    buf[offset + i] = (value >>> (littleEndian ? i : 3 - i) * 8) & 0xff
  }
}

Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset + 3] = (value >>> 24)
    this[offset + 2] = (value >>> 16)
    this[offset + 1] = (value >>> 8)
    this[offset] = (value & 0xff)
  } else {
    objectWriteUInt32(this, value, offset, true)
  }
  return offset + 4
}

Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 24)
    this[offset + 1] = (value >>> 16)
    this[offset + 2] = (value >>> 8)
    this[offset + 3] = (value & 0xff)
  } else {
    objectWriteUInt32(this, value, offset, false)
  }
  return offset + 4
}

Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) {
    var limit = Math.pow(2, 8 * byteLength - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = 0
  var mul = 1
  var sub = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) {
    var limit = Math.pow(2, 8 * byteLength - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = byteLength - 1
  var mul = 1
  var sub = 0
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
  if (value < 0) value = 0xff + value + 1
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff)
    this[offset + 1] = (value >>> 8)
  } else {
    objectWriteUInt16(this, value, offset, true)
  }
  return offset + 2
}

Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 8)
    this[offset + 1] = (value & 0xff)
  } else {
    objectWriteUInt16(this, value, offset, false)
  }
  return offset + 2
}

Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff)
    this[offset + 1] = (value >>> 8)
    this[offset + 2] = (value >>> 16)
    this[offset + 3] = (value >>> 24)
  } else {
    objectWriteUInt32(this, value, offset, true)
  }
  return offset + 4
}

Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (value < 0) value = 0xffffffff + value + 1
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 24)
    this[offset + 1] = (value >>> 16)
    this[offset + 2] = (value >>> 8)
    this[offset + 3] = (value & 0xff)
  } else {
    objectWriteUInt32(this, value, offset, false)
  }
  return offset + 4
}

function checkIEEE754 (buf, value, offset, ext, max, min) {
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
  if (offset < 0) throw new RangeError('Index out of range')
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
  }
  ieee754.write(buf, value, offset, littleEndian, 23, 4)
  return offset + 4
}

Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert)
}

function writeDouble (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
  }
  ieee754.write(buf, value, offset, littleEndian, 52, 8)
  return offset + 8
}

Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert)
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function copy (target, targetStart, start, end) {
  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (targetStart >= target.length) targetStart = target.length
  if (!targetStart) targetStart = 0
  if (end > 0 && end < start) end = start

  // Copy 0 bytes; we're done
  if (end === start) return 0
  if (target.length === 0 || this.length === 0) return 0

  // Fatal error conditions
  if (targetStart < 0) {
    throw new RangeError('targetStart out of bounds')
  }
  if (start < 0 || start >= this.length) throw new RangeError('sourceStart out of bounds')
  if (end < 0) throw new RangeError('sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length) end = this.length
  if (target.length - targetStart < end - start) {
    end = target.length - targetStart + start
  }

  var len = end - start
  var i

  if (this === target && start < targetStart && targetStart < end) {
    // descending copy from end
    for (i = len - 1; i >= 0; --i) {
      target[i + targetStart] = this[i + start]
    }
  } else if (len < 1000 || !Buffer.TYPED_ARRAY_SUPPORT) {
    // ascending copy from start
    for (i = 0; i < len; ++i) {
      target[i + targetStart] = this[i + start]
    }
  } else {
    Uint8Array.prototype.set.call(
      target,
      this.subarray(start, start + len),
      targetStart
    )
  }

  return len
}

// Usage:
//    buffer.fill(number[, offset[, end]])
//    buffer.fill(buffer[, offset[, end]])
//    buffer.fill(string[, offset[, end]][, encoding])
Buffer.prototype.fill = function fill (val, start, end, encoding) {
  // Handle string cases:
  if (typeof val === 'string') {
    if (typeof start === 'string') {
      encoding = start
      start = 0
      end = this.length
    } else if (typeof end === 'string') {
      encoding = end
      end = this.length
    }
    if (val.length === 1) {
      var code = val.charCodeAt(0)
      if (code < 256) {
        val = code
      }
    }
    if (encoding !== undefined && typeof encoding !== 'string') {
      throw new TypeError('encoding must be a string')
    }
    if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
      throw new TypeError('Unknown encoding: ' + encoding)
    }
  } else if (typeof val === 'number') {
    val = val & 255
  }

  // Invalid ranges are not set to a default, so can range check early.
  if (start < 0 || this.length < start || this.length < end) {
    throw new RangeError('Out of range index')
  }

  if (end <= start) {
    return this
  }

  start = start >>> 0
  end = end === undefined ? this.length : end >>> 0

  if (!val) val = 0

  var i
  if (typeof val === 'number') {
    for (i = start; i < end; ++i) {
      this[i] = val
    }
  } else {
    var bytes = Buffer.isBuffer(val)
      ? val
      : utf8ToBytes(new Buffer(val, encoding).toString())
    var len = bytes.length
    for (i = 0; i < end - start; ++i) {
      this[i + start] = bytes[i % len]
    }
  }

  return this
}

// HELPER FUNCTIONS
// ================

var INVALID_BASE64_RE = /[^+\/0-9A-Za-z-_]/g

function base64clean (str) {
  // Node strips out invalid characters like \n and \t from the string, base64-js does not
  str = stringtrim(str).replace(INVALID_BASE64_RE, '')
  // Node converts strings with length < 2 to ''
  if (str.length < 2) return ''
  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
  while (str.length % 4 !== 0) {
    str = str + '='
  }
  return str
}

function stringtrim (str) {
  if (str.trim) return str.trim()
  return str.replace(/^\s+|\s+$/g, '')
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes (string, units) {
  units = units || Infinity
  var codePoint
  var length = string.length
  var leadSurrogate = null
  var bytes = []

  for (var i = 0; i < length; ++i) {
    codePoint = string.charCodeAt(i)

    // is surrogate component
    if (codePoint > 0xD7FF && codePoint < 0xE000) {
      // last char was a lead
      if (!leadSurrogate) {
        // no lead yet
        if (codePoint > 0xDBFF) {
          // unexpected trail
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        } else if (i + 1 === length) {
          // unpaired lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        }

        // valid lead
        leadSurrogate = codePoint

        continue
      }

      // 2 leads in a row
      if (codePoint < 0xDC00) {
        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
        leadSurrogate = codePoint
        continue
      }

      // valid surrogate pair
      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000
    } else if (leadSurrogate) {
      // valid bmp char, but last char was a lead
      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
    }

    leadSurrogate = null

    // encode utf8
    if (codePoint < 0x80) {
      if ((units -= 1) < 0) break
      bytes.push(codePoint)
    } else if (codePoint < 0x800) {
      if ((units -= 2) < 0) break
      bytes.push(
        codePoint >> 0x6 | 0xC0,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x10000) {
      if ((units -= 3) < 0) break
      bytes.push(
        codePoint >> 0xC | 0xE0,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x110000) {
      if ((units -= 4) < 0) break
      bytes.push(
        codePoint >> 0x12 | 0xF0,
        codePoint >> 0xC & 0x3F | 0x80,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else {
      throw new Error('Invalid code point')
    }
  }

  return bytes
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str, units) {
  var c, hi, lo
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    if ((units -= 2) < 0) break

    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(base64clean(str))
}

function blitBuffer (src, dst, offset, length) {
  for (var i = 0; i < length; ++i) {
    if ((i + offset >= dst.length) || (i >= src.length)) break
    dst[i + offset] = src[i]
  }
  return i
}

function isnan (val) {
  return val !== val // eslint-disable-line no-self-compare
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"base64-js":105,"ieee754":111,"isarray":114}],109:[function(require,module,exports){
(function (Buffer){
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

// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.

function isArray(arg) {
  if (Array.isArray) {
    return Array.isArray(arg);
  }
  return objectToString(arg) === '[object Array]';
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
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = Buffer.isBuffer;

function objectToString(o) {
  return Object.prototype.toString.call(o);
}

}).call(this,{"isBuffer":require("../../is-buffer/index.js")})
},{"../../is-buffer/index.js":113}],110:[function(require,module,exports){
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

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      } else {
        // At least give some kind of context to the user
        var err = new Error('Uncaught, unspecified "error" event. (' + er + ')');
        err.context = er;
        throw err;
      }
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        args = Array.prototype.slice.call(arguments, 1);
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    args = Array.prototype.slice.call(arguments, 1);
    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      if (typeof console.trace === 'function') {
        // not supported in IE 10
        console.trace();
      }
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else if (listeners) {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.prototype.listenerCount = function(type) {
  if (this._events) {
    var evlistener = this._events[type];

    if (isFunction(evlistener))
      return 1;
    else if (evlistener)
      return evlistener.length;
  }
  return 0;
};

EventEmitter.listenerCount = function(emitter, type) {
  return emitter.listenerCount(type);
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}

},{}],111:[function(require,module,exports){
exports.read = function (buffer, offset, isLE, mLen, nBytes) {
  var e, m
  var eLen = nBytes * 8 - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var nBits = -7
  var i = isLE ? (nBytes - 1) : 0
  var d = isLE ? -1 : 1
  var s = buffer[offset + i]

  i += d

  e = s & ((1 << (-nBits)) - 1)
  s >>= (-nBits)
  nBits += eLen
  for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & ((1 << (-nBits)) - 1)
  e >>= (-nBits)
  nBits += mLen
  for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity)
  } else {
    m = m + Math.pow(2, mLen)
    e = e - eBias
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
}

exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c
  var eLen = nBytes * 8 - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
  var i = isLE ? 0 : (nBytes - 1)
  var d = isLE ? 1 : -1
  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

  value = Math.abs(value)

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0
    e = eMax
  } else {
    e = Math.floor(Math.log(value) / Math.LN2)
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--
      c *= 2
    }
    if (e + eBias >= 1) {
      value += rt / c
    } else {
      value += rt * Math.pow(2, 1 - eBias)
    }
    if (value * c >= 2) {
      e++
      c /= 2
    }

    if (e + eBias >= eMax) {
      m = 0
      e = eMax
    } else if (e + eBias >= 1) {
      m = (value * c - 1) * Math.pow(2, mLen)
      e = e + eBias
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
      e = 0
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = (e << mLen) | m
  eLen += mLen
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128
}

},{}],112:[function(require,module,exports){
arguments[4][64][0].apply(exports,arguments)
},{"dup":64}],113:[function(require,module,exports){
/*!
 * Determine if an object is a Buffer
 *
 * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
 * @license  MIT
 */

// The _isBuffer check is for Safari 5-7 support, because it's missing
// Object.prototype.constructor. Remove this eventually
module.exports = function (obj) {
  return obj != null && (isBuffer(obj) || isSlowBuffer(obj) || !!obj._isBuffer)
}

function isBuffer (obj) {
  return !!obj.constructor && typeof obj.constructor.isBuffer === 'function' && obj.constructor.isBuffer(obj)
}

// For Node v0.10 support. Remove this eventually.
function isSlowBuffer (obj) {
  return typeof obj.readFloatLE === 'function' && typeof obj.slice === 'function' && isBuffer(obj.slice(0, 0))
}

},{}],114:[function(require,module,exports){
var toString = {}.toString;

module.exports = Array.isArray || function (arr) {
  return toString.call(arr) == '[object Array]';
};

},{}],115:[function(require,module,exports){
(function (process){
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

// Split a filename into [root, dir, basename, ext], unix version
// 'root' is just a slash, or nothing.
var splitPathRe =
    /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
var splitPath = function(filename) {
  return splitPathRe.exec(filename).slice(1);
};

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

exports.dirname = function(path) {
  var result = splitPath(path),
      root = result[0],
      dir = result[1];

  if (!root && !dir) {
    // No dirname whatsoever
    return '.';
  }

  if (dir) {
    // It has a dirname, strip trailing slash
    dir = dir.substr(0, dir.length - 1);
  }

  return root + dir;
};


exports.basename = function(path, ext) {
  var f = splitPath(path)[2];
  // TODO: make this comparison case-insensitive on windows?
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
};


exports.extname = function(path) {
  return splitPath(path)[3];
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
},{"_process":117}],116:[function(require,module,exports){
(function (process){
'use strict';

if (!process.version ||
    process.version.indexOf('v0.') === 0 ||
    process.version.indexOf('v1.') === 0 && process.version.indexOf('v1.8.') !== 0) {
  module.exports = nextTick;
} else {
  module.exports = process.nextTick;
}

function nextTick(fn, arg1, arg2, arg3) {
  if (typeof fn !== 'function') {
    throw new TypeError('"callback" argument must be a function');
  }
  var len = arguments.length;
  var args, i;
  switch (len) {
  case 0:
  case 1:
    return process.nextTick(fn);
  case 2:
    return process.nextTick(function afterTickOne() {
      fn.call(null, arg1);
    });
  case 3:
    return process.nextTick(function afterTickTwo() {
      fn.call(null, arg1, arg2);
    });
  case 4:
    return process.nextTick(function afterTickThree() {
      fn.call(null, arg1, arg2, arg3);
    });
  default:
    args = new Array(len - 1);
    i = 0;
    while (i < args.length) {
      args[i++] = arguments[i];
    }
    return process.nextTick(function afterTick() {
      fn.apply(null, args);
    });
  }
}

}).call(this,require('_process'))
},{"_process":117}],117:[function(require,module,exports){
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

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],118:[function(require,module,exports){
module.exports = require("./lib/_stream_duplex.js")

},{"./lib/_stream_duplex.js":119}],119:[function(require,module,exports){
// a duplex stream is just a stream that is both readable and writable.
// Since JS doesn't have multiple prototypal inheritance, this class
// prototypally inherits from Readable, and then parasitically from
// Writable.

'use strict';

/*<replacement>*/

var objectKeys = Object.keys || function (obj) {
  var keys = [];
  for (var key in obj) {
    keys.push(key);
  }return keys;
};
/*</replacement>*/

module.exports = Duplex;

/*<replacement>*/
var processNextTick = require('process-nextick-args');
/*</replacement>*/

/*<replacement>*/
var util = require('core-util-is');
util.inherits = require('inherits');
/*</replacement>*/

var Readable = require('./_stream_readable');
var Writable = require('./_stream_writable');

util.inherits(Duplex, Readable);

var keys = objectKeys(Writable.prototype);
for (var v = 0; v < keys.length; v++) {
  var method = keys[v];
  if (!Duplex.prototype[method]) Duplex.prototype[method] = Writable.prototype[method];
}

function Duplex(options) {
  if (!(this instanceof Duplex)) return new Duplex(options);

  Readable.call(this, options);
  Writable.call(this, options);

  if (options && options.readable === false) this.readable = false;

  if (options && options.writable === false) this.writable = false;

  this.allowHalfOpen = true;
  if (options && options.allowHalfOpen === false) this.allowHalfOpen = false;

  this.once('end', onend);
}

// the no-half-open enforcer
function onend() {
  // if we allow half-open state, or if the writable side ended,
  // then we're ok.
  if (this.allowHalfOpen || this._writableState.ended) return;

  // no more data can be written.
  // But allow more writes to happen in this tick.
  processNextTick(onEndNT, this);
}

function onEndNT(self) {
  self.end();
}

function forEach(xs, f) {
  for (var i = 0, l = xs.length; i < l; i++) {
    f(xs[i], i);
  }
}
},{"./_stream_readable":121,"./_stream_writable":123,"core-util-is":109,"inherits":112,"process-nextick-args":116}],120:[function(require,module,exports){
// a passthrough stream.
// basically just the most minimal sort of Transform stream.
// Every written chunk gets output as-is.

'use strict';

module.exports = PassThrough;

var Transform = require('./_stream_transform');

/*<replacement>*/
var util = require('core-util-is');
util.inherits = require('inherits');
/*</replacement>*/

util.inherits(PassThrough, Transform);

function PassThrough(options) {
  if (!(this instanceof PassThrough)) return new PassThrough(options);

  Transform.call(this, options);
}

PassThrough.prototype._transform = function (chunk, encoding, cb) {
  cb(null, chunk);
};
},{"./_stream_transform":122,"core-util-is":109,"inherits":112}],121:[function(require,module,exports){
(function (process){
'use strict';

module.exports = Readable;

/*<replacement>*/
var processNextTick = require('process-nextick-args');
/*</replacement>*/

/*<replacement>*/
var isArray = require('isarray');
/*</replacement>*/

/*<replacement>*/
var Duplex;
/*</replacement>*/

Readable.ReadableState = ReadableState;

/*<replacement>*/
var EE = require('events').EventEmitter;

var EElistenerCount = function (emitter, type) {
  return emitter.listeners(type).length;
};
/*</replacement>*/

/*<replacement>*/
var Stream;
(function () {
  try {
    Stream = require('st' + 'ream');
  } catch (_) {} finally {
    if (!Stream) Stream = require('events').EventEmitter;
  }
})();
/*</replacement>*/

var Buffer = require('buffer').Buffer;
/*<replacement>*/
var bufferShim = require('buffer-shims');
/*</replacement>*/

/*<replacement>*/
var util = require('core-util-is');
util.inherits = require('inherits');
/*</replacement>*/

/*<replacement>*/
var debugUtil = require('util');
var debug = void 0;
if (debugUtil && debugUtil.debuglog) {
  debug = debugUtil.debuglog('stream');
} else {
  debug = function () {};
}
/*</replacement>*/

var BufferList = require('./internal/streams/BufferList');
var StringDecoder;

util.inherits(Readable, Stream);

function prependListener(emitter, event, fn) {
  // Sadly this is not cacheable as some libraries bundle their own
  // event emitter implementation with them.
  if (typeof emitter.prependListener === 'function') {
    return emitter.prependListener(event, fn);
  } else {
    // This is a hack to make sure that our error handler is attached before any
    // userland ones.  NEVER DO THIS. This is here only because this code needs
    // to continue to work with older versions of Node.js that do not include
    // the prependListener() method. The goal is to eventually remove this hack.
    if (!emitter._events || !emitter._events[event]) emitter.on(event, fn);else if (isArray(emitter._events[event])) emitter._events[event].unshift(fn);else emitter._events[event] = [fn, emitter._events[event]];
  }
}

function ReadableState(options, stream) {
  Duplex = Duplex || require('./_stream_duplex');

  options = options || {};

  // object stream flag. Used to make read(n) ignore n and to
  // make all the buffer merging and length checks go away
  this.objectMode = !!options.objectMode;

  if (stream instanceof Duplex) this.objectMode = this.objectMode || !!options.readableObjectMode;

  // the point at which it stops calling _read() to fill the buffer
  // Note: 0 is a valid value, means "don't call _read preemptively ever"
  var hwm = options.highWaterMark;
  var defaultHwm = this.objectMode ? 16 : 16 * 1024;
  this.highWaterMark = hwm || hwm === 0 ? hwm : defaultHwm;

  // cast to ints.
  this.highWaterMark = ~ ~this.highWaterMark;

  // A linked list is used to store data chunks instead of an array because the
  // linked list can remove elements from the beginning faster than
  // array.shift()
  this.buffer = new BufferList();
  this.length = 0;
  this.pipes = null;
  this.pipesCount = 0;
  this.flowing = null;
  this.ended = false;
  this.endEmitted = false;
  this.reading = false;

  // a flag to be able to tell if the onwrite cb is called immediately,
  // or on a later tick.  We set this to true at first, because any
  // actions that shouldn't happen until "later" should generally also
  // not happen before the first write call.
  this.sync = true;

  // whenever we return null, then we set a flag to say
  // that we're awaiting a 'readable' event emission.
  this.needReadable = false;
  this.emittedReadable = false;
  this.readableListening = false;
  this.resumeScheduled = false;

  // Crypto is kind of old and crusty.  Historically, its default string
  // encoding is 'binary' so we have to make this configurable.
  // Everything else in the universe uses 'utf8', though.
  this.defaultEncoding = options.defaultEncoding || 'utf8';

  // when piping, we only care about 'readable' events that happen
  // after read()ing all the bytes and not getting any pushback.
  this.ranOut = false;

  // the number of writers that are awaiting a drain event in .pipe()s
  this.awaitDrain = 0;

  // if true, a maybeReadMore has been scheduled
  this.readingMore = false;

  this.decoder = null;
  this.encoding = null;
  if (options.encoding) {
    if (!StringDecoder) StringDecoder = require('string_decoder/').StringDecoder;
    this.decoder = new StringDecoder(options.encoding);
    this.encoding = options.encoding;
  }
}

function Readable(options) {
  Duplex = Duplex || require('./_stream_duplex');

  if (!(this instanceof Readable)) return new Readable(options);

  this._readableState = new ReadableState(options, this);

  // legacy
  this.readable = true;

  if (options && typeof options.read === 'function') this._read = options.read;

  Stream.call(this);
}

// Manually shove something into the read() buffer.
// This returns true if the highWaterMark has not been hit yet,
// similar to how Writable.write() returns true if you should
// write() some more.
Readable.prototype.push = function (chunk, encoding) {
  var state = this._readableState;

  if (!state.objectMode && typeof chunk === 'string') {
    encoding = encoding || state.defaultEncoding;
    if (encoding !== state.encoding) {
      chunk = bufferShim.from(chunk, encoding);
      encoding = '';
    }
  }

  return readableAddChunk(this, state, chunk, encoding, false);
};

// Unshift should *always* be something directly out of read()
Readable.prototype.unshift = function (chunk) {
  var state = this._readableState;
  return readableAddChunk(this, state, chunk, '', true);
};

Readable.prototype.isPaused = function () {
  return this._readableState.flowing === false;
};

function readableAddChunk(stream, state, chunk, encoding, addToFront) {
  var er = chunkInvalid(state, chunk);
  if (er) {
    stream.emit('error', er);
  } else if (chunk === null) {
    state.reading = false;
    onEofChunk(stream, state);
  } else if (state.objectMode || chunk && chunk.length > 0) {
    if (state.ended && !addToFront) {
      var e = new Error('stream.push() after EOF');
      stream.emit('error', e);
    } else if (state.endEmitted && addToFront) {
      var _e = new Error('stream.unshift() after end event');
      stream.emit('error', _e);
    } else {
      var skipAdd;
      if (state.decoder && !addToFront && !encoding) {
        chunk = state.decoder.write(chunk);
        skipAdd = !state.objectMode && chunk.length === 0;
      }

      if (!addToFront) state.reading = false;

      // Don't add to the buffer if we've decoded to an empty string chunk and
      // we're not in object mode
      if (!skipAdd) {
        // if we want the data now, just emit it.
        if (state.flowing && state.length === 0 && !state.sync) {
          stream.emit('data', chunk);
          stream.read(0);
        } else {
          // update the buffer info.
          state.length += state.objectMode ? 1 : chunk.length;
          if (addToFront) state.buffer.unshift(chunk);else state.buffer.push(chunk);

          if (state.needReadable) emitReadable(stream);
        }
      }

      maybeReadMore(stream, state);
    }
  } else if (!addToFront) {
    state.reading = false;
  }

  return needMoreData(state);
}

// if it's past the high water mark, we can push in some more.
// Also, if we have no data yet, we can stand some
// more bytes.  This is to work around cases where hwm=0,
// such as the repl.  Also, if the push() triggered a
// readable event, and the user called read(largeNumber) such that
// needReadable was set, then we ought to push more, so that another
// 'readable' event will be triggered.
function needMoreData(state) {
  return !state.ended && (state.needReadable || state.length < state.highWaterMark || state.length === 0);
}

// backwards compatibility.
Readable.prototype.setEncoding = function (enc) {
  if (!StringDecoder) StringDecoder = require('string_decoder/').StringDecoder;
  this._readableState.decoder = new StringDecoder(enc);
  this._readableState.encoding = enc;
  return this;
};

// Don't raise the hwm > 8MB
var MAX_HWM = 0x800000;
function computeNewHighWaterMark(n) {
  if (n >= MAX_HWM) {
    n = MAX_HWM;
  } else {
    // Get the next highest power of 2 to prevent increasing hwm excessively in
    // tiny amounts
    n--;
    n |= n >>> 1;
    n |= n >>> 2;
    n |= n >>> 4;
    n |= n >>> 8;
    n |= n >>> 16;
    n++;
  }
  return n;
}

// This function is designed to be inlinable, so please take care when making
// changes to the function body.
function howMuchToRead(n, state) {
  if (n <= 0 || state.length === 0 && state.ended) return 0;
  if (state.objectMode) return 1;
  if (n !== n) {
    // Only flow one buffer at a time
    if (state.flowing && state.length) return state.buffer.head.data.length;else return state.length;
  }
  // If we're asking for more than the current hwm, then raise the hwm.
  if (n > state.highWaterMark) state.highWaterMark = computeNewHighWaterMark(n);
  if (n <= state.length) return n;
  // Don't have enough
  if (!state.ended) {
    state.needReadable = true;
    return 0;
  }
  return state.length;
}

// you can override either this method, or the async _read(n) below.
Readable.prototype.read = function (n) {
  debug('read', n);
  n = parseInt(n, 10);
  var state = this._readableState;
  var nOrig = n;

  if (n !== 0) state.emittedReadable = false;

  // if we're doing read(0) to trigger a readable event, but we
  // already have a bunch of data in the buffer, then just trigger
  // the 'readable' event and move on.
  if (n === 0 && state.needReadable && (state.length >= state.highWaterMark || state.ended)) {
    debug('read: emitReadable', state.length, state.ended);
    if (state.length === 0 && state.ended) endReadable(this);else emitReadable(this);
    return null;
  }

  n = howMuchToRead(n, state);

  // if we've ended, and we're now clear, then finish it up.
  if (n === 0 && state.ended) {
    if (state.length === 0) endReadable(this);
    return null;
  }

  // All the actual chunk generation logic needs to be
  // *below* the call to _read.  The reason is that in certain
  // synthetic stream cases, such as passthrough streams, _read
  // may be a completely synchronous operation which may change
  // the state of the read buffer, providing enough data when
  // before there was *not* enough.
  //
  // So, the steps are:
  // 1. Figure out what the state of things will be after we do
  // a read from the buffer.
  //
  // 2. If that resulting state will trigger a _read, then call _read.
  // Note that this may be asynchronous, or synchronous.  Yes, it is
  // deeply ugly to write APIs this way, but that still doesn't mean
  // that the Readable class should behave improperly, as streams are
  // designed to be sync/async agnostic.
  // Take note if the _read call is sync or async (ie, if the read call
  // has returned yet), so that we know whether or not it's safe to emit
  // 'readable' etc.
  //
  // 3. Actually pull the requested chunks out of the buffer and return.

  // if we need a readable event, then we need to do some reading.
  var doRead = state.needReadable;
  debug('need readable', doRead);

  // if we currently have less than the highWaterMark, then also read some
  if (state.length === 0 || state.length - n < state.highWaterMark) {
    doRead = true;
    debug('length less than watermark', doRead);
  }

  // however, if we've ended, then there's no point, and if we're already
  // reading, then it's unnecessary.
  if (state.ended || state.reading) {
    doRead = false;
    debug('reading or ended', doRead);
  } else if (doRead) {
    debug('do read');
    state.reading = true;
    state.sync = true;
    // if the length is currently zero, then we *need* a readable event.
    if (state.length === 0) state.needReadable = true;
    // call internal read method
    this._read(state.highWaterMark);
    state.sync = false;
    // If _read pushed data synchronously, then `reading` will be false,
    // and we need to re-evaluate how much data we can return to the user.
    if (!state.reading) n = howMuchToRead(nOrig, state);
  }

  var ret;
  if (n > 0) ret = fromList(n, state);else ret = null;

  if (ret === null) {
    state.needReadable = true;
    n = 0;
  } else {
    state.length -= n;
  }

  if (state.length === 0) {
    // If we have nothing in the buffer, then we want to know
    // as soon as we *do* get something into the buffer.
    if (!state.ended) state.needReadable = true;

    // If we tried to read() past the EOF, then emit end on the next tick.
    if (nOrig !== n && state.ended) endReadable(this);
  }

  if (ret !== null) this.emit('data', ret);

  return ret;
};

function chunkInvalid(state, chunk) {
  var er = null;
  if (!Buffer.isBuffer(chunk) && typeof chunk !== 'string' && chunk !== null && chunk !== undefined && !state.objectMode) {
    er = new TypeError('Invalid non-string/buffer chunk');
  }
  return er;
}

function onEofChunk(stream, state) {
  if (state.ended) return;
  if (state.decoder) {
    var chunk = state.decoder.end();
    if (chunk && chunk.length) {
      state.buffer.push(chunk);
      state.length += state.objectMode ? 1 : chunk.length;
    }
  }
  state.ended = true;

  // emit 'readable' now to make sure it gets picked up.
  emitReadable(stream);
}

// Don't emit readable right away in sync mode, because this can trigger
// another read() call => stack overflow.  This way, it might trigger
// a nextTick recursion warning, but that's not so bad.
function emitReadable(stream) {
  var state = stream._readableState;
  state.needReadable = false;
  if (!state.emittedReadable) {
    debug('emitReadable', state.flowing);
    state.emittedReadable = true;
    if (state.sync) processNextTick(emitReadable_, stream);else emitReadable_(stream);
  }
}

function emitReadable_(stream) {
  debug('emit readable');
  stream.emit('readable');
  flow(stream);
}

// at this point, the user has presumably seen the 'readable' event,
// and called read() to consume some data.  that may have triggered
// in turn another _read(n) call, in which case reading = true if
// it's in progress.
// However, if we're not ended, or reading, and the length < hwm,
// then go ahead and try to read some more preemptively.
function maybeReadMore(stream, state) {
  if (!state.readingMore) {
    state.readingMore = true;
    processNextTick(maybeReadMore_, stream, state);
  }
}

function maybeReadMore_(stream, state) {
  var len = state.length;
  while (!state.reading && !state.flowing && !state.ended && state.length < state.highWaterMark) {
    debug('maybeReadMore read 0');
    stream.read(0);
    if (len === state.length)
      // didn't get any data, stop spinning.
      break;else len = state.length;
  }
  state.readingMore = false;
}

// abstract method.  to be overridden in specific implementation classes.
// call cb(er, data) where data is <= n in length.
// for virtual (non-string, non-buffer) streams, "length" is somewhat
// arbitrary, and perhaps not very meaningful.
Readable.prototype._read = function (n) {
  this.emit('error', new Error('_read() is not implemented'));
};

Readable.prototype.pipe = function (dest, pipeOpts) {
  var src = this;
  var state = this._readableState;

  switch (state.pipesCount) {
    case 0:
      state.pipes = dest;
      break;
    case 1:
      state.pipes = [state.pipes, dest];
      break;
    default:
      state.pipes.push(dest);
      break;
  }
  state.pipesCount += 1;
  debug('pipe count=%d opts=%j', state.pipesCount, pipeOpts);

  var doEnd = (!pipeOpts || pipeOpts.end !== false) && dest !== process.stdout && dest !== process.stderr;

  var endFn = doEnd ? onend : cleanup;
  if (state.endEmitted) processNextTick(endFn);else src.once('end', endFn);

  dest.on('unpipe', onunpipe);
  function onunpipe(readable) {
    debug('onunpipe');
    if (readable === src) {
      cleanup();
    }
  }

  function onend() {
    debug('onend');
    dest.end();
  }

  // when the dest drains, it reduces the awaitDrain counter
  // on the source.  This would be more elegant with a .once()
  // handler in flow(), but adding and removing repeatedly is
  // too slow.
  var ondrain = pipeOnDrain(src);
  dest.on('drain', ondrain);

  var cleanedUp = false;
  function cleanup() {
    debug('cleanup');
    // cleanup event handlers once the pipe is broken
    dest.removeListener('close', onclose);
    dest.removeListener('finish', onfinish);
    dest.removeListener('drain', ondrain);
    dest.removeListener('error', onerror);
    dest.removeListener('unpipe', onunpipe);
    src.removeListener('end', onend);
    src.removeListener('end', cleanup);
    src.removeListener('data', ondata);

    cleanedUp = true;

    // if the reader is waiting for a drain event from this
    // specific writer, then it would cause it to never start
    // flowing again.
    // So, if this is awaiting a drain, then we just call it now.
    // If we don't know, then assume that we are waiting for one.
    if (state.awaitDrain && (!dest._writableState || dest._writableState.needDrain)) ondrain();
  }

  // If the user pushes more data while we're writing to dest then we'll end up
  // in ondata again. However, we only want to increase awaitDrain once because
  // dest will only emit one 'drain' event for the multiple writes.
  // => Introduce a guard on increasing awaitDrain.
  var increasedAwaitDrain = false;
  src.on('data', ondata);
  function ondata(chunk) {
    debug('ondata');
    increasedAwaitDrain = false;
    var ret = dest.write(chunk);
    if (false === ret && !increasedAwaitDrain) {
      // If the user unpiped during `dest.write()`, it is possible
      // to get stuck in a permanently paused state if that write
      // also returned false.
      // => Check whether `dest` is still a piping destination.
      if ((state.pipesCount === 1 && state.pipes === dest || state.pipesCount > 1 && indexOf(state.pipes, dest) !== -1) && !cleanedUp) {
        debug('false write response, pause', src._readableState.awaitDrain);
        src._readableState.awaitDrain++;
        increasedAwaitDrain = true;
      }
      src.pause();
    }
  }

  // if the dest has an error, then stop piping into it.
  // however, don't suppress the throwing behavior for this.
  function onerror(er) {
    debug('onerror', er);
    unpipe();
    dest.removeListener('error', onerror);
    if (EElistenerCount(dest, 'error') === 0) dest.emit('error', er);
  }

  // Make sure our error handler is attached before userland ones.
  prependListener(dest, 'error', onerror);

  // Both close and finish should trigger unpipe, but only once.
  function onclose() {
    dest.removeListener('finish', onfinish);
    unpipe();
  }
  dest.once('close', onclose);
  function onfinish() {
    debug('onfinish');
    dest.removeListener('close', onclose);
    unpipe();
  }
  dest.once('finish', onfinish);

  function unpipe() {
    debug('unpipe');
    src.unpipe(dest);
  }

  // tell the dest that it's being piped to
  dest.emit('pipe', src);

  // start the flow if it hasn't been started already.
  if (!state.flowing) {
    debug('pipe resume');
    src.resume();
  }

  return dest;
};

function pipeOnDrain(src) {
  return function () {
    var state = src._readableState;
    debug('pipeOnDrain', state.awaitDrain);
    if (state.awaitDrain) state.awaitDrain--;
    if (state.awaitDrain === 0 && EElistenerCount(src, 'data')) {
      state.flowing = true;
      flow(src);
    }
  };
}

Readable.prototype.unpipe = function (dest) {
  var state = this._readableState;

  // if we're not piping anywhere, then do nothing.
  if (state.pipesCount === 0) return this;

  // just one destination.  most common case.
  if (state.pipesCount === 1) {
    // passed in one, but it's not the right one.
    if (dest && dest !== state.pipes) return this;

    if (!dest) dest = state.pipes;

    // got a match.
    state.pipes = null;
    state.pipesCount = 0;
    state.flowing = false;
    if (dest) dest.emit('unpipe', this);
    return this;
  }

  // slow case. multiple pipe destinations.

  if (!dest) {
    // remove all.
    var dests = state.pipes;
    var len = state.pipesCount;
    state.pipes = null;
    state.pipesCount = 0;
    state.flowing = false;

    for (var i = 0; i < len; i++) {
      dests[i].emit('unpipe', this);
    }return this;
  }

  // try to find the right one.
  var index = indexOf(state.pipes, dest);
  if (index === -1) return this;

  state.pipes.splice(index, 1);
  state.pipesCount -= 1;
  if (state.pipesCount === 1) state.pipes = state.pipes[0];

  dest.emit('unpipe', this);

  return this;
};

// set up data events if they are asked for
// Ensure readable listeners eventually get something
Readable.prototype.on = function (ev, fn) {
  var res = Stream.prototype.on.call(this, ev, fn);

  if (ev === 'data') {
    // Start flowing on next tick if stream isn't explicitly paused
    if (this._readableState.flowing !== false) this.resume();
  } else if (ev === 'readable') {
    var state = this._readableState;
    if (!state.endEmitted && !state.readableListening) {
      state.readableListening = state.needReadable = true;
      state.emittedReadable = false;
      if (!state.reading) {
        processNextTick(nReadingNextTick, this);
      } else if (state.length) {
        emitReadable(this, state);
      }
    }
  }

  return res;
};
Readable.prototype.addListener = Readable.prototype.on;

function nReadingNextTick(self) {
  debug('readable nexttick read 0');
  self.read(0);
}

// pause() and resume() are remnants of the legacy readable stream API
// If the user uses them, then switch into old mode.
Readable.prototype.resume = function () {
  var state = this._readableState;
  if (!state.flowing) {
    debug('resume');
    state.flowing = true;
    resume(this, state);
  }
  return this;
};

function resume(stream, state) {
  if (!state.resumeScheduled) {
    state.resumeScheduled = true;
    processNextTick(resume_, stream, state);
  }
}

function resume_(stream, state) {
  if (!state.reading) {
    debug('resume read 0');
    stream.read(0);
  }

  state.resumeScheduled = false;
  state.awaitDrain = 0;
  stream.emit('resume');
  flow(stream);
  if (state.flowing && !state.reading) stream.read(0);
}

Readable.prototype.pause = function () {
  debug('call pause flowing=%j', this._readableState.flowing);
  if (false !== this._readableState.flowing) {
    debug('pause');
    this._readableState.flowing = false;
    this.emit('pause');
  }
  return this;
};

function flow(stream) {
  var state = stream._readableState;
  debug('flow', state.flowing);
  while (state.flowing && stream.read() !== null) {}
}

// wrap an old-style stream as the async data source.
// This is *not* part of the readable stream interface.
// It is an ugly unfortunate mess of history.
Readable.prototype.wrap = function (stream) {
  var state = this._readableState;
  var paused = false;

  var self = this;
  stream.on('end', function () {
    debug('wrapped end');
    if (state.decoder && !state.ended) {
      var chunk = state.decoder.end();
      if (chunk && chunk.length) self.push(chunk);
    }

    self.push(null);
  });

  stream.on('data', function (chunk) {
    debug('wrapped data');
    if (state.decoder) chunk = state.decoder.write(chunk);

    // don't skip over falsy values in objectMode
    if (state.objectMode && (chunk === null || chunk === undefined)) return;else if (!state.objectMode && (!chunk || !chunk.length)) return;

    var ret = self.push(chunk);
    if (!ret) {
      paused = true;
      stream.pause();
    }
  });

  // proxy all the other methods.
  // important when wrapping filters and duplexes.
  for (var i in stream) {
    if (this[i] === undefined && typeof stream[i] === 'function') {
      this[i] = function (method) {
        return function () {
          return stream[method].apply(stream, arguments);
        };
      }(i);
    }
  }

  // proxy certain important events.
  var events = ['error', 'close', 'destroy', 'pause', 'resume'];
  forEach(events, function (ev) {
    stream.on(ev, self.emit.bind(self, ev));
  });

  // when we try to consume some more bytes, simply unpause the
  // underlying stream.
  self._read = function (n) {
    debug('wrapped _read', n);
    if (paused) {
      paused = false;
      stream.resume();
    }
  };

  return self;
};

// exposed for testing purposes only.
Readable._fromList = fromList;

// Pluck off n bytes from an array of buffers.
// Length is the combined lengths of all the buffers in the list.
// This function is designed to be inlinable, so please take care when making
// changes to the function body.
function fromList(n, state) {
  // nothing buffered
  if (state.length === 0) return null;

  var ret;
  if (state.objectMode) ret = state.buffer.shift();else if (!n || n >= state.length) {
    // read it all, truncate the list
    if (state.decoder) ret = state.buffer.join('');else if (state.buffer.length === 1) ret = state.buffer.head.data;else ret = state.buffer.concat(state.length);
    state.buffer.clear();
  } else {
    // read part of list
    ret = fromListPartial(n, state.buffer, state.decoder);
  }

  return ret;
}

// Extracts only enough buffered data to satisfy the amount requested.
// This function is designed to be inlinable, so please take care when making
// changes to the function body.
function fromListPartial(n, list, hasStrings) {
  var ret;
  if (n < list.head.data.length) {
    // slice is the same for buffers and strings
    ret = list.head.data.slice(0, n);
    list.head.data = list.head.data.slice(n);
  } else if (n === list.head.data.length) {
    // first chunk is a perfect match
    ret = list.shift();
  } else {
    // result spans more than one buffer
    ret = hasStrings ? copyFromBufferString(n, list) : copyFromBuffer(n, list);
  }
  return ret;
}

// Copies a specified amount of characters from the list of buffered data
// chunks.
// This function is designed to be inlinable, so please take care when making
// changes to the function body.
function copyFromBufferString(n, list) {
  var p = list.head;
  var c = 1;
  var ret = p.data;
  n -= ret.length;
  while (p = p.next) {
    var str = p.data;
    var nb = n > str.length ? str.length : n;
    if (nb === str.length) ret += str;else ret += str.slice(0, n);
    n -= nb;
    if (n === 0) {
      if (nb === str.length) {
        ++c;
        if (p.next) list.head = p.next;else list.head = list.tail = null;
      } else {
        list.head = p;
        p.data = str.slice(nb);
      }
      break;
    }
    ++c;
  }
  list.length -= c;
  return ret;
}

// Copies a specified amount of bytes from the list of buffered data chunks.
// This function is designed to be inlinable, so please take care when making
// changes to the function body.
function copyFromBuffer(n, list) {
  var ret = bufferShim.allocUnsafe(n);
  var p = list.head;
  var c = 1;
  p.data.copy(ret);
  n -= p.data.length;
  while (p = p.next) {
    var buf = p.data;
    var nb = n > buf.length ? buf.length : n;
    buf.copy(ret, ret.length - n, 0, nb);
    n -= nb;
    if (n === 0) {
      if (nb === buf.length) {
        ++c;
        if (p.next) list.head = p.next;else list.head = list.tail = null;
      } else {
        list.head = p;
        p.data = buf.slice(nb);
      }
      break;
    }
    ++c;
  }
  list.length -= c;
  return ret;
}

function endReadable(stream) {
  var state = stream._readableState;

  // If we get here before consuming all the bytes, then that is a
  // bug in node.  Should never happen.
  if (state.length > 0) throw new Error('"endReadable()" called on non-empty stream');

  if (!state.endEmitted) {
    state.ended = true;
    processNextTick(endReadableNT, state, stream);
  }
}

function endReadableNT(state, stream) {
  // Check that we didn't get one last unshift.
  if (!state.endEmitted && state.length === 0) {
    state.endEmitted = true;
    stream.readable = false;
    stream.emit('end');
  }
}

function forEach(xs, f) {
  for (var i = 0, l = xs.length; i < l; i++) {
    f(xs[i], i);
  }
}

function indexOf(xs, x) {
  for (var i = 0, l = xs.length; i < l; i++) {
    if (xs[i] === x) return i;
  }
  return -1;
}
}).call(this,require('_process'))
},{"./_stream_duplex":119,"./internal/streams/BufferList":124,"_process":117,"buffer":108,"buffer-shims":107,"core-util-is":109,"events":110,"inherits":112,"isarray":114,"process-nextick-args":116,"string_decoder/":130,"util":106}],122:[function(require,module,exports){
// a transform stream is a readable/writable stream where you do
// something with the data.  Sometimes it's called a "filter",
// but that's not a great name for it, since that implies a thing where
// some bits pass through, and others are simply ignored.  (That would
// be a valid example of a transform, of course.)
//
// While the output is causally related to the input, it's not a
// necessarily symmetric or synchronous transformation.  For example,
// a zlib stream might take multiple plain-text writes(), and then
// emit a single compressed chunk some time in the future.
//
// Here's how this works:
//
// The Transform stream has all the aspects of the readable and writable
// stream classes.  When you write(chunk), that calls _write(chunk,cb)
// internally, and returns false if there's a lot of pending writes
// buffered up.  When you call read(), that calls _read(n) until
// there's enough pending readable data buffered up.
//
// In a transform stream, the written data is placed in a buffer.  When
// _read(n) is called, it transforms the queued up data, calling the
// buffered _write cb's as it consumes chunks.  If consuming a single
// written chunk would result in multiple output chunks, then the first
// outputted bit calls the readcb, and subsequent chunks just go into
// the read buffer, and will cause it to emit 'readable' if necessary.
//
// This way, back-pressure is actually determined by the reading side,
// since _read has to be called to start processing a new chunk.  However,
// a pathological inflate type of transform can cause excessive buffering
// here.  For example, imagine a stream where every byte of input is
// interpreted as an integer from 0-255, and then results in that many
// bytes of output.  Writing the 4 bytes {ff,ff,ff,ff} would result in
// 1kb of data being output.  In this case, you could write a very small
// amount of input, and end up with a very large amount of output.  In
// such a pathological inflating mechanism, there'd be no way to tell
// the system to stop doing the transform.  A single 4MB write could
// cause the system to run out of memory.
//
// However, even in such a pathological case, only a single written chunk
// would be consumed, and then the rest would wait (un-transformed) until
// the results of the previous transformed chunk were consumed.

'use strict';

module.exports = Transform;

var Duplex = require('./_stream_duplex');

/*<replacement>*/
var util = require('core-util-is');
util.inherits = require('inherits');
/*</replacement>*/

util.inherits(Transform, Duplex);

function TransformState(stream) {
  this.afterTransform = function (er, data) {
    return afterTransform(stream, er, data);
  };

  this.needTransform = false;
  this.transforming = false;
  this.writecb = null;
  this.writechunk = null;
  this.writeencoding = null;
}

function afterTransform(stream, er, data) {
  var ts = stream._transformState;
  ts.transforming = false;

  var cb = ts.writecb;

  if (!cb) return stream.emit('error', new Error('no writecb in Transform class'));

  ts.writechunk = null;
  ts.writecb = null;

  if (data !== null && data !== undefined) stream.push(data);

  cb(er);

  var rs = stream._readableState;
  rs.reading = false;
  if (rs.needReadable || rs.length < rs.highWaterMark) {
    stream._read(rs.highWaterMark);
  }
}

function Transform(options) {
  if (!(this instanceof Transform)) return new Transform(options);

  Duplex.call(this, options);

  this._transformState = new TransformState(this);

  var stream = this;

  // start out asking for a readable event once data is transformed.
  this._readableState.needReadable = true;

  // we have implemented the _read method, and done the other things
  // that Readable wants before the first _read call, so unset the
  // sync guard flag.
  this._readableState.sync = false;

  if (options) {
    if (typeof options.transform === 'function') this._transform = options.transform;

    if (typeof options.flush === 'function') this._flush = options.flush;
  }

  // When the writable side finishes, then flush out anything remaining.
  this.once('prefinish', function () {
    if (typeof this._flush === 'function') this._flush(function (er, data) {
      done(stream, er, data);
    });else done(stream);
  });
}

Transform.prototype.push = function (chunk, encoding) {
  this._transformState.needTransform = false;
  return Duplex.prototype.push.call(this, chunk, encoding);
};

// This is the part where you do stuff!
// override this function in implementation classes.
// 'chunk' is an input chunk.
//
// Call `push(newChunk)` to pass along transformed output
// to the readable side.  You may call 'push' zero or more times.
//
// Call `cb(err)` when you are done with this chunk.  If you pass
// an error, then that'll put the hurt on the whole operation.  If you
// never call cb(), then you'll never get another chunk.
Transform.prototype._transform = function (chunk, encoding, cb) {
  throw new Error('_transform() is not implemented');
};

Transform.prototype._write = function (chunk, encoding, cb) {
  var ts = this._transformState;
  ts.writecb = cb;
  ts.writechunk = chunk;
  ts.writeencoding = encoding;
  if (!ts.transforming) {
    var rs = this._readableState;
    if (ts.needTransform || rs.needReadable || rs.length < rs.highWaterMark) this._read(rs.highWaterMark);
  }
};

// Doesn't matter what the args are here.
// _transform does all the work.
// That we got here means that the readable side wants more data.
Transform.prototype._read = function (n) {
  var ts = this._transformState;

  if (ts.writechunk !== null && ts.writecb && !ts.transforming) {
    ts.transforming = true;
    this._transform(ts.writechunk, ts.writeencoding, ts.afterTransform);
  } else {
    // mark that we need a transform, so that any data that comes in
    // will get processed, now that we've asked for it.
    ts.needTransform = true;
  }
};

function done(stream, er, data) {
  if (er) return stream.emit('error', er);

  if (data !== null && data !== undefined) stream.push(data);

  // if there's nothing in the write buffer, then that means
  // that nothing more will ever be provided
  var ws = stream._writableState;
  var ts = stream._transformState;

  if (ws.length) throw new Error('Calling transform done when ws.length != 0');

  if (ts.transforming) throw new Error('Calling transform done when still transforming');

  return stream.push(null);
}
},{"./_stream_duplex":119,"core-util-is":109,"inherits":112}],123:[function(require,module,exports){
(function (process){
// A bit simpler than readable streams.
// Implement an async ._write(chunk, encoding, cb), and it'll handle all
// the drain event emission and buffering.

'use strict';

module.exports = Writable;

/*<replacement>*/
var processNextTick = require('process-nextick-args');
/*</replacement>*/

/*<replacement>*/
var asyncWrite = !process.browser && ['v0.10', 'v0.9.'].indexOf(process.version.slice(0, 5)) > -1 ? setImmediate : processNextTick;
/*</replacement>*/

/*<replacement>*/
var Duplex;
/*</replacement>*/

Writable.WritableState = WritableState;

/*<replacement>*/
var util = require('core-util-is');
util.inherits = require('inherits');
/*</replacement>*/

/*<replacement>*/
var internalUtil = {
  deprecate: require('util-deprecate')
};
/*</replacement>*/

/*<replacement>*/
var Stream;
(function () {
  try {
    Stream = require('st' + 'ream');
  } catch (_) {} finally {
    if (!Stream) Stream = require('events').EventEmitter;
  }
})();
/*</replacement>*/

var Buffer = require('buffer').Buffer;
/*<replacement>*/
var bufferShim = require('buffer-shims');
/*</replacement>*/

util.inherits(Writable, Stream);

function nop() {}

function WriteReq(chunk, encoding, cb) {
  this.chunk = chunk;
  this.encoding = encoding;
  this.callback = cb;
  this.next = null;
}

function WritableState(options, stream) {
  Duplex = Duplex || require('./_stream_duplex');

  options = options || {};

  // object stream flag to indicate whether or not this stream
  // contains buffers or objects.
  this.objectMode = !!options.objectMode;

  if (stream instanceof Duplex) this.objectMode = this.objectMode || !!options.writableObjectMode;

  // the point at which write() starts returning false
  // Note: 0 is a valid value, means that we always return false if
  // the entire buffer is not flushed immediately on write()
  var hwm = options.highWaterMark;
  var defaultHwm = this.objectMode ? 16 : 16 * 1024;
  this.highWaterMark = hwm || hwm === 0 ? hwm : defaultHwm;

  // cast to ints.
  this.highWaterMark = ~ ~this.highWaterMark;

  // drain event flag.
  this.needDrain = false;
  // at the start of calling end()
  this.ending = false;
  // when end() has been called, and returned
  this.ended = false;
  // when 'finish' is emitted
  this.finished = false;

  // should we decode strings into buffers before passing to _write?
  // this is here so that some node-core streams can optimize string
  // handling at a lower level.
  var noDecode = options.decodeStrings === false;
  this.decodeStrings = !noDecode;

  // Crypto is kind of old and crusty.  Historically, its default string
  // encoding is 'binary' so we have to make this configurable.
  // Everything else in the universe uses 'utf8', though.
  this.defaultEncoding = options.defaultEncoding || 'utf8';

  // not an actual buffer we keep track of, but a measurement
  // of how much we're waiting to get pushed to some underlying
  // socket or file.
  this.length = 0;

  // a flag to see when we're in the middle of a write.
  this.writing = false;

  // when true all writes will be buffered until .uncork() call
  this.corked = 0;

  // a flag to be able to tell if the onwrite cb is called immediately,
  // or on a later tick.  We set this to true at first, because any
  // actions that shouldn't happen until "later" should generally also
  // not happen before the first write call.
  this.sync = true;

  // a flag to know if we're processing previously buffered items, which
  // may call the _write() callback in the same tick, so that we don't
  // end up in an overlapped onwrite situation.
  this.bufferProcessing = false;

  // the callback that's passed to _write(chunk,cb)
  this.onwrite = function (er) {
    onwrite(stream, er);
  };

  // the callback that the user supplies to write(chunk,encoding,cb)
  this.writecb = null;

  // the amount that is being written when _write is called.
  this.writelen = 0;

  this.bufferedRequest = null;
  this.lastBufferedRequest = null;

  // number of pending user-supplied write callbacks
  // this must be 0 before 'finish' can be emitted
  this.pendingcb = 0;

  // emit prefinish if the only thing we're waiting for is _write cbs
  // This is relevant for synchronous Transform streams
  this.prefinished = false;

  // True if the error was already emitted and should not be thrown again
  this.errorEmitted = false;

  // count buffered requests
  this.bufferedRequestCount = 0;

  // allocate the first CorkedRequest, there is always
  // one allocated and free to use, and we maintain at most two
  this.corkedRequestsFree = new CorkedRequest(this);
}

WritableState.prototype.getBuffer = function getBuffer() {
  var current = this.bufferedRequest;
  var out = [];
  while (current) {
    out.push(current);
    current = current.next;
  }
  return out;
};

(function () {
  try {
    Object.defineProperty(WritableState.prototype, 'buffer', {
      get: internalUtil.deprecate(function () {
        return this.getBuffer();
      }, '_writableState.buffer is deprecated. Use _writableState.getBuffer ' + 'instead.')
    });
  } catch (_) {}
})();

// Test _writableState for inheritance to account for Duplex streams,
// whose prototype chain only points to Readable.
var realHasInstance;
if (typeof Symbol === 'function' && Symbol.hasInstance && typeof Function.prototype[Symbol.hasInstance] === 'function') {
  realHasInstance = Function.prototype[Symbol.hasInstance];
  Object.defineProperty(Writable, Symbol.hasInstance, {
    value: function (object) {
      if (realHasInstance.call(this, object)) return true;

      return object && object._writableState instanceof WritableState;
    }
  });
} else {
  realHasInstance = function (object) {
    return object instanceof this;
  };
}

function Writable(options) {
  Duplex = Duplex || require('./_stream_duplex');

  // Writable ctor is applied to Duplexes, too.
  // `realHasInstance` is necessary because using plain `instanceof`
  // would return false, as no `_writableState` property is attached.

  // Trying to use the custom `instanceof` for Writable here will also break the
  // Node.js LazyTransform implementation, which has a non-trivial getter for
  // `_writableState` that would lead to infinite recursion.
  if (!realHasInstance.call(Writable, this) && !(this instanceof Duplex)) {
    return new Writable(options);
  }

  this._writableState = new WritableState(options, this);

  // legacy.
  this.writable = true;

  if (options) {
    if (typeof options.write === 'function') this._write = options.write;

    if (typeof options.writev === 'function') this._writev = options.writev;
  }

  Stream.call(this);
}

// Otherwise people can pipe Writable streams, which is just wrong.
Writable.prototype.pipe = function () {
  this.emit('error', new Error('Cannot pipe, not readable'));
};

function writeAfterEnd(stream, cb) {
  var er = new Error('write after end');
  // TODO: defer error events consistently everywhere, not just the cb
  stream.emit('error', er);
  processNextTick(cb, er);
}

// If we get something that is not a buffer, string, null, or undefined,
// and we're not in objectMode, then that's an error.
// Otherwise stream chunks are all considered to be of length=1, and the
// watermarks determine how many objects to keep in the buffer, rather than
// how many bytes or characters.
function validChunk(stream, state, chunk, cb) {
  var valid = true;
  var er = false;
  // Always throw error if a null is written
  // if we are not in object mode then throw
  // if it is not a buffer, string, or undefined.
  if (chunk === null) {
    er = new TypeError('May not write null values to stream');
  } else if (!Buffer.isBuffer(chunk) && typeof chunk !== 'string' && chunk !== undefined && !state.objectMode) {
    er = new TypeError('Invalid non-string/buffer chunk');
  }
  if (er) {
    stream.emit('error', er);
    processNextTick(cb, er);
    valid = false;
  }
  return valid;
}

Writable.prototype.write = function (chunk, encoding, cb) {
  var state = this._writableState;
  var ret = false;

  if (typeof encoding === 'function') {
    cb = encoding;
    encoding = null;
  }

  if (Buffer.isBuffer(chunk)) encoding = 'buffer';else if (!encoding) encoding = state.defaultEncoding;

  if (typeof cb !== 'function') cb = nop;

  if (state.ended) writeAfterEnd(this, cb);else if (validChunk(this, state, chunk, cb)) {
    state.pendingcb++;
    ret = writeOrBuffer(this, state, chunk, encoding, cb);
  }

  return ret;
};

Writable.prototype.cork = function () {
  var state = this._writableState;

  state.corked++;
};

Writable.prototype.uncork = function () {
  var state = this._writableState;

  if (state.corked) {
    state.corked--;

    if (!state.writing && !state.corked && !state.finished && !state.bufferProcessing && state.bufferedRequest) clearBuffer(this, state);
  }
};

Writable.prototype.setDefaultEncoding = function setDefaultEncoding(encoding) {
  // node::ParseEncoding() requires lower case.
  if (typeof encoding === 'string') encoding = encoding.toLowerCase();
  if (!(['hex', 'utf8', 'utf-8', 'ascii', 'binary', 'base64', 'ucs2', 'ucs-2', 'utf16le', 'utf-16le', 'raw'].indexOf((encoding + '').toLowerCase()) > -1)) throw new TypeError('Unknown encoding: ' + encoding);
  this._writableState.defaultEncoding = encoding;
  return this;
};

function decodeChunk(state, chunk, encoding) {
  if (!state.objectMode && state.decodeStrings !== false && typeof chunk === 'string') {
    chunk = bufferShim.from(chunk, encoding);
  }
  return chunk;
}

// if we're already writing something, then just put this
// in the queue, and wait our turn.  Otherwise, call _write
// If we return false, then we need a drain event, so set that flag.
function writeOrBuffer(stream, state, chunk, encoding, cb) {
  chunk = decodeChunk(state, chunk, encoding);

  if (Buffer.isBuffer(chunk)) encoding = 'buffer';
  var len = state.objectMode ? 1 : chunk.length;

  state.length += len;

  var ret = state.length < state.highWaterMark;
  // we must ensure that previous needDrain will not be reset to false.
  if (!ret) state.needDrain = true;

  if (state.writing || state.corked) {
    var last = state.lastBufferedRequest;
    state.lastBufferedRequest = new WriteReq(chunk, encoding, cb);
    if (last) {
      last.next = state.lastBufferedRequest;
    } else {
      state.bufferedRequest = state.lastBufferedRequest;
    }
    state.bufferedRequestCount += 1;
  } else {
    doWrite(stream, state, false, len, chunk, encoding, cb);
  }

  return ret;
}

function doWrite(stream, state, writev, len, chunk, encoding, cb) {
  state.writelen = len;
  state.writecb = cb;
  state.writing = true;
  state.sync = true;
  if (writev) stream._writev(chunk, state.onwrite);else stream._write(chunk, encoding, state.onwrite);
  state.sync = false;
}

function onwriteError(stream, state, sync, er, cb) {
  --state.pendingcb;
  if (sync) processNextTick(cb, er);else cb(er);

  stream._writableState.errorEmitted = true;
  stream.emit('error', er);
}

function onwriteStateUpdate(state) {
  state.writing = false;
  state.writecb = null;
  state.length -= state.writelen;
  state.writelen = 0;
}

function onwrite(stream, er) {
  var state = stream._writableState;
  var sync = state.sync;
  var cb = state.writecb;

  onwriteStateUpdate(state);

  if (er) onwriteError(stream, state, sync, er, cb);else {
    // Check if we're actually ready to finish, but don't emit yet
    var finished = needFinish(state);

    if (!finished && !state.corked && !state.bufferProcessing && state.bufferedRequest) {
      clearBuffer(stream, state);
    }

    if (sync) {
      /*<replacement>*/
      asyncWrite(afterWrite, stream, state, finished, cb);
      /*</replacement>*/
    } else {
        afterWrite(stream, state, finished, cb);
      }
  }
}

function afterWrite(stream, state, finished, cb) {
  if (!finished) onwriteDrain(stream, state);
  state.pendingcb--;
  cb();
  finishMaybe(stream, state);
}

// Must force callback to be called on nextTick, so that we don't
// emit 'drain' before the write() consumer gets the 'false' return
// value, and has a chance to attach a 'drain' listener.
function onwriteDrain(stream, state) {
  if (state.length === 0 && state.needDrain) {
    state.needDrain = false;
    stream.emit('drain');
  }
}

// if there's something in the buffer waiting, then process it
function clearBuffer(stream, state) {
  state.bufferProcessing = true;
  var entry = state.bufferedRequest;

  if (stream._writev && entry && entry.next) {
    // Fast case, write everything using _writev()
    var l = state.bufferedRequestCount;
    var buffer = new Array(l);
    var holder = state.corkedRequestsFree;
    holder.entry = entry;

    var count = 0;
    while (entry) {
      buffer[count] = entry;
      entry = entry.next;
      count += 1;
    }

    doWrite(stream, state, true, state.length, buffer, '', holder.finish);

    // doWrite is almost always async, defer these to save a bit of time
    // as the hot path ends with doWrite
    state.pendingcb++;
    state.lastBufferedRequest = null;
    if (holder.next) {
      state.corkedRequestsFree = holder.next;
      holder.next = null;
    } else {
      state.corkedRequestsFree = new CorkedRequest(state);
    }
  } else {
    // Slow case, write chunks one-by-one
    while (entry) {
      var chunk = entry.chunk;
      var encoding = entry.encoding;
      var cb = entry.callback;
      var len = state.objectMode ? 1 : chunk.length;

      doWrite(stream, state, false, len, chunk, encoding, cb);
      entry = entry.next;
      // if we didn't call the onwrite immediately, then
      // it means that we need to wait until it does.
      // also, that means that the chunk and cb are currently
      // being processed, so move the buffer counter past them.
      if (state.writing) {
        break;
      }
    }

    if (entry === null) state.lastBufferedRequest = null;
  }

  state.bufferedRequestCount = 0;
  state.bufferedRequest = entry;
  state.bufferProcessing = false;
}

Writable.prototype._write = function (chunk, encoding, cb) {
  cb(new Error('_write() is not implemented'));
};

Writable.prototype._writev = null;

Writable.prototype.end = function (chunk, encoding, cb) {
  var state = this._writableState;

  if (typeof chunk === 'function') {
    cb = chunk;
    chunk = null;
    encoding = null;
  } else if (typeof encoding === 'function') {
    cb = encoding;
    encoding = null;
  }

  if (chunk !== null && chunk !== undefined) this.write(chunk, encoding);

  // .end() fully uncorks
  if (state.corked) {
    state.corked = 1;
    this.uncork();
  }

  // ignore unnecessary end() calls.
  if (!state.ending && !state.finished) endWritable(this, state, cb);
};

function needFinish(state) {
  return state.ending && state.length === 0 && state.bufferedRequest === null && !state.finished && !state.writing;
}

function prefinish(stream, state) {
  if (!state.prefinished) {
    state.prefinished = true;
    stream.emit('prefinish');
  }
}

function finishMaybe(stream, state) {
  var need = needFinish(state);
  if (need) {
    if (state.pendingcb === 0) {
      prefinish(stream, state);
      state.finished = true;
      stream.emit('finish');
    } else {
      prefinish(stream, state);
    }
  }
  return need;
}

function endWritable(stream, state, cb) {
  state.ending = true;
  finishMaybe(stream, state);
  if (cb) {
    if (state.finished) processNextTick(cb);else stream.once('finish', cb);
  }
  state.ended = true;
  stream.writable = false;
}

// It seems a linked list but it is not
// there will be only 2 of these for each stream
function CorkedRequest(state) {
  var _this = this;

  this.next = null;
  this.entry = null;

  this.finish = function (err) {
    var entry = _this.entry;
    _this.entry = null;
    while (entry) {
      var cb = entry.callback;
      state.pendingcb--;
      cb(err);
      entry = entry.next;
    }
    if (state.corkedRequestsFree) {
      state.corkedRequestsFree.next = _this;
    } else {
      state.corkedRequestsFree = _this;
    }
  };
}
}).call(this,require('_process'))
},{"./_stream_duplex":119,"_process":117,"buffer":108,"buffer-shims":107,"core-util-is":109,"events":110,"inherits":112,"process-nextick-args":116,"util-deprecate":131}],124:[function(require,module,exports){
'use strict';

var Buffer = require('buffer').Buffer;
/*<replacement>*/
var bufferShim = require('buffer-shims');
/*</replacement>*/

module.exports = BufferList;

function BufferList() {
  this.head = null;
  this.tail = null;
  this.length = 0;
}

BufferList.prototype.push = function (v) {
  var entry = { data: v, next: null };
  if (this.length > 0) this.tail.next = entry;else this.head = entry;
  this.tail = entry;
  ++this.length;
};

BufferList.prototype.unshift = function (v) {
  var entry = { data: v, next: this.head };
  if (this.length === 0) this.tail = entry;
  this.head = entry;
  ++this.length;
};

BufferList.prototype.shift = function () {
  if (this.length === 0) return;
  var ret = this.head.data;
  if (this.length === 1) this.head = this.tail = null;else this.head = this.head.next;
  --this.length;
  return ret;
};

BufferList.prototype.clear = function () {
  this.head = this.tail = null;
  this.length = 0;
};

BufferList.prototype.join = function (s) {
  if (this.length === 0) return '';
  var p = this.head;
  var ret = '' + p.data;
  while (p = p.next) {
    ret += s + p.data;
  }return ret;
};

BufferList.prototype.concat = function (n) {
  if (this.length === 0) return bufferShim.alloc(0);
  if (this.length === 1) return this.head.data;
  var ret = bufferShim.allocUnsafe(n >>> 0);
  var p = this.head;
  var i = 0;
  while (p) {
    p.data.copy(ret, i);
    i += p.data.length;
    p = p.next;
  }
  return ret;
};
},{"buffer":108,"buffer-shims":107}],125:[function(require,module,exports){
module.exports = require("./lib/_stream_passthrough.js")

},{"./lib/_stream_passthrough.js":120}],126:[function(require,module,exports){
(function (process){
var Stream = (function (){
  try {
    return require('st' + 'ream'); // hack to fix a circular dependency issue when used with browserify
  } catch(_){}
}());
exports = module.exports = require('./lib/_stream_readable.js');
exports.Stream = Stream || exports;
exports.Readable = exports;
exports.Writable = require('./lib/_stream_writable.js');
exports.Duplex = require('./lib/_stream_duplex.js');
exports.Transform = require('./lib/_stream_transform.js');
exports.PassThrough = require('./lib/_stream_passthrough.js');

if (!process.browser && process.env.READABLE_STREAM === 'disable' && Stream) {
  module.exports = Stream;
}

}).call(this,require('_process'))
},{"./lib/_stream_duplex.js":119,"./lib/_stream_passthrough.js":120,"./lib/_stream_readable.js":121,"./lib/_stream_transform.js":122,"./lib/_stream_writable.js":123,"_process":117}],127:[function(require,module,exports){
module.exports = require("./lib/_stream_transform.js")

},{"./lib/_stream_transform.js":122}],128:[function(require,module,exports){
module.exports = require("./lib/_stream_writable.js")

},{"./lib/_stream_writable.js":123}],129:[function(require,module,exports){
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

module.exports = Stream;

var EE = require('events').EventEmitter;
var inherits = require('inherits');

inherits(Stream, EE);
Stream.Readable = require('readable-stream/readable.js');
Stream.Writable = require('readable-stream/writable.js');
Stream.Duplex = require('readable-stream/duplex.js');
Stream.Transform = require('readable-stream/transform.js');
Stream.PassThrough = require('readable-stream/passthrough.js');

// Backwards-compat with node 0.4.x
Stream.Stream = Stream;



// old-style streams.  Note that the pipe method (the only relevant
// part of this class) is overridden in the Readable class.

function Stream() {
  EE.call(this);
}

Stream.prototype.pipe = function(dest, options) {
  var source = this;

  function ondata(chunk) {
    if (dest.writable) {
      if (false === dest.write(chunk) && source.pause) {
        source.pause();
      }
    }
  }

  source.on('data', ondata);

  function ondrain() {
    if (source.readable && source.resume) {
      source.resume();
    }
  }

  dest.on('drain', ondrain);

  // If the 'end' option is not supplied, dest.end() will be called when
  // source gets the 'end' or 'close' events.  Only dest.end() once.
  if (!dest._isStdio && (!options || options.end !== false)) {
    source.on('end', onend);
    source.on('close', onclose);
  }

  var didOnEnd = false;
  function onend() {
    if (didOnEnd) return;
    didOnEnd = true;

    dest.end();
  }


  function onclose() {
    if (didOnEnd) return;
    didOnEnd = true;

    if (typeof dest.destroy === 'function') dest.destroy();
  }

  // don't leave dangling pipes when there are errors.
  function onerror(er) {
    cleanup();
    if (EE.listenerCount(this, 'error') === 0) {
      throw er; // Unhandled stream error in pipe.
    }
  }

  source.on('error', onerror);
  dest.on('error', onerror);

  // remove all the event listeners that were added.
  function cleanup() {
    source.removeListener('data', ondata);
    dest.removeListener('drain', ondrain);

    source.removeListener('end', onend);
    source.removeListener('close', onclose);

    source.removeListener('error', onerror);
    dest.removeListener('error', onerror);

    source.removeListener('end', cleanup);
    source.removeListener('close', cleanup);

    dest.removeListener('close', cleanup);
  }

  source.on('end', cleanup);
  source.on('close', cleanup);

  dest.on('close', cleanup);

  dest.emit('pipe', source);

  // Allow for unix-like usage: A.pipe(B).pipe(C)
  return dest;
};

},{"events":110,"inherits":112,"readable-stream/duplex.js":118,"readable-stream/passthrough.js":125,"readable-stream/readable.js":126,"readable-stream/transform.js":127,"readable-stream/writable.js":128}],130:[function(require,module,exports){
arguments[4][73][0].apply(exports,arguments)
},{"buffer":108,"dup":73}],131:[function(require,module,exports){
(function (global){

/**
 * Module exports.
 */

module.exports = deprecate;

/**
 * Mark that a method should not be used.
 * Returns a modified function which warns once by default.
 *
 * If `localStorage.noDeprecation = true` is set, then it is a no-op.
 *
 * If `localStorage.throwDeprecation = true` is set, then deprecated functions
 * will throw an Error when invoked.
 *
 * If `localStorage.traceDeprecation = true` is set, then deprecated functions
 * will invoke `console.trace()` instead of `console.error()`.
 *
 * @param {Function} fn - the function to deprecate
 * @param {String} msg - the string to print to the console when `fn` is invoked
 * @returns {Function} a new "deprecated" version of `fn`
 * @api public
 */

function deprecate (fn, msg) {
  if (config('noDeprecation')) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (config('throwDeprecation')) {
        throw new Error(msg);
      } else if (config('traceDeprecation')) {
        console.trace(msg);
      } else {
        console.warn(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
}

/**
 * Checks `localStorage` for boolean values for the given `name`.
 *
 * @param {String} name
 * @returns {Boolean}
 * @api private
 */

function config (name) {
  // accessing global.localStorage can trigger a DOMException in sandboxed iframes
  try {
    if (!global.localStorage) return false;
  } catch (_) {
    return false;
  }
  var val = global.localStorage[name];
  if (null == val) return false;
  return String(val).toLowerCase() === 'true';
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],132:[function(require,module,exports){
arguments[4][64][0].apply(exports,arguments)
},{"dup":64}],133:[function(require,module,exports){
module.exports = function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.readUInt8 === 'function';
}
},{}],134:[function(require,module,exports){
(function (process,global){
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
exports.format = function(f) {
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
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
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
exports.deprecate = function(fn, msg) {
  // Allow for deprecating things in the process of starting up.
  if (isUndefined(global.process)) {
    return function() {
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
exports.debuglog = function(set) {
  if (isUndefined(debugEnviron))
    debugEnviron = process.env.NODE_DEBUG || '';
  set = set.toUpperCase();
  if (!debugs[set]) {
    if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
      var pid = process.pid;
      debugs[set] = function() {
        var msg = exports.format.apply(exports, arguments);
        console.error('%s %d: %s', set, pid, msg);
      };
    } else {
      debugs[set] = function() {};
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
  'bold' : [1, 22],
  'italic' : [3, 23],
  'underline' : [4, 24],
  'inverse' : [7, 27],
  'white' : [37, 39],
  'grey' : [90, 39],
  'black' : [30, 39],
  'blue' : [34, 39],
  'cyan' : [36, 39],
  'green' : [32, 39],
  'magenta' : [35, 39],
  'red' : [31, 39],
  'yellow' : [33, 39]
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
    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
           '\u001b[' + inspect.colors[style][1] + 'm';
  } else {
    return str;
  }
}


function stylizeNoColor(str, styleType) {
  return str;
}


function arrayToHash(array) {
  var hash = {};

  array.forEach(function(val, idx) {
    hash[val] = true;
  });

  return hash;
}


function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (ctx.customInspect &&
      value &&
      isFunction(value.inspect) &&
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
  if (isError(value)
      && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
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

  var base = '', array = false, braces = ['{', '}'];

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
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}


function formatPrimitive(ctx, value) {
  if (isUndefined(value))
    return ctx.stylize('undefined', 'undefined');
  if (isString(value)) {
    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                             .replace(/'/g, "\\'")
                                             .replace(/\\"/g, '"') + '\'';
    return ctx.stylize(simple, 'string');
  }
  if (isNumber(value))
    return ctx.stylize('' + value, 'number');
  if (isBoolean(value))
    return ctx.stylize('' + value, 'boolean');
  // For some reason typeof null is "object", so special case here.
  if (isNull(value))
    return ctx.stylize('null', 'null');
}


function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}


function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (hasOwnProperty(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }
  keys.forEach(function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
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
          str = str.split('\n').map(function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function(line) {
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
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}


function reduceToSingleString(output, base, braces) {
  var numLinesEst = 0;
  var length = output.reduce(function(prev, cur) {
    numLinesEst++;
    if (cur.indexOf('\n') >= 0) numLinesEst++;
    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
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
  return typeof arg === 'symbol';
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
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return isObject(e) &&
      (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = require('./support/isBuffer');

function objectToString(o) {
  return Object.prototype.toString.call(o);
}


function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}


var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}


// log is just a thin wrapper to console.log that prepends a timestamp
exports.log = function() {
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
exports.inherits = require('inherits');

exports._extend = function(origin, add) {
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

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./support/isBuffer":133,"_process":117,"inherits":132}]},{},[1]);
