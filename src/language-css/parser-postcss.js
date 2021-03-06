"use strict";

const createError = require("../common/parser-create-error");
const parseFrontMatter = require("../utils/front-matter");
const { hasPragma } = require("./pragma");
const { isLessParser, isSCSS, isSCSSNestedPropertyNode } = require("./utils");
const { calculateLoc, replaceQuotesInInlineComments } = require("./loc");

function parseValueNodes(nodes) {
  let parenGroup = {
    open: null,
    close: null,
    groups: [],
    type: "paren_group",
  };
  const parenGroupStack = [parenGroup];
  const rootParenGroup = parenGroup;
  let commaGroup = {
    groups: [],
    type: "comma_group",
  };
  const commaGroupStack = [commaGroup];

  for (let i = 0; i < nodes.length; ++i) {
    const node = nodes[i];
    const isUnquotedDataURLCall =
      node.type === "func" &&
      node.value === "url" &&
      node.group &&
      node.group.groups &&
      node.group.groups[0] &&
      node.group.groups[0].groups &&
      node.group.groups[0].groups.length > 2 &&
      node.group.groups[0].groups[0].type === "word" &&
      node.group.groups[0].groups[0].value === "data" &&
      node.group.groups[0].groups[1].type === "colon" &&
      node.group.groups[0].groups[1].value === ":";

    if (isUnquotedDataURLCall) {
      node.group.groups = [stringifyGroup(node)];
    }

    if (node.type === "paren" && node.value === "(") {
      parenGroup = {
        open: node,
        close: null,
        groups: [],
        type: "paren_group",
      };
      parenGroupStack.push(parenGroup);

      commaGroup = {
        groups: [],
        type: "comma_group",
      };
      commaGroupStack.push(commaGroup);
    } else if (node.type === "paren" && node.value === ")") {
      if (commaGroup.groups.length) {
        parenGroup.groups.push(commaGroup);
      }
      parenGroup.close = node;

      if (commaGroupStack.length === 1) {
        throw new Error("Unbalanced parenthesis");
      }

      commaGroupStack.pop();
      commaGroup = commaGroupStack[commaGroupStack.length - 1];
      commaGroup.groups.push(parenGroup);

      parenGroupStack.pop();
      parenGroup = parenGroupStack[parenGroupStack.length - 1];
    } else if (node.type === "comma") {
      parenGroup.groups.push(commaGroup);
      commaGroup = {
        groups: [],
        type: "comma_group",
      };
      commaGroupStack[commaGroupStack.length - 1] = commaGroup;
    } else {
      commaGroup.groups.push(node);
    }
  }
  if (commaGroup.groups.length > 0) {
    parenGroup.groups.push(commaGroup);
  }
  return rootParenGroup;
}

function stringifyGroup(node) {
  if (node.group) {
    return stringifyGroup(node.group);
  }

  if (node.groups) {
    return node.groups.reduce((previousValue, currentValue, index) => {
      return (
        previousValue +
        stringifyGroup(currentValue) +
        (currentValue.type === "comma_group" && index !== node.groups.length - 1
          ? ","
          : "")
      );
    }, "");
  }

  const before = node.raws && node.raws.before ? node.raws.before : "";
  const value = node.value ? node.value : "";
  const unit = node.unit ? node.unit : "";
  const after = node.raws && node.raws.after ? node.raws.after : "";

  return before + value + unit + after;
}

function flattenGroups(node) {
  if (
    node.type === "paren_group" &&
    !node.open &&
    !node.close &&
    node.groups.length === 1
  ) {
    return flattenGroups(node.groups[0]);
  }

  if (node.type === "comma_group" && node.groups.length === 1) {
    return flattenGroups(node.groups[0]);
  }

  if (node.type === "paren_group" || node.type === "comma_group") {
    return { ...node, groups: node.groups.map(flattenGroups) };
  }

  return node;
}

function addTypePrefix(node, prefix) {
  if (node && typeof node === "object") {
    delete node.parent;
    for (const key in node) {
      addTypePrefix(node[key], prefix);
      if (key === "type" && typeof node[key] === "string") {
        if (!node[key].startsWith(prefix)) {
          node[key] = prefix + node[key];
        }
      }
    }
  }
  return node;
}

function addMissingType(node) {
  if (node && typeof node === "object") {
    delete node.parent;
    for (const key in node) {
      addMissingType(node[key]);
    }
    if (!Array.isArray(node) && node.value && !node.type) {
      node.type = "unknown";
    }
  }
  return node;
}

function parseNestedValue(node) {
  if (node && typeof node === "object") {
    delete node.parent;
    for (const key in node) {
      parseNestedValue(node[key]);
      if (key === "nodes") {
        node.group = flattenGroups(parseValueNodes(node[key]));
        delete node[key];
      }
    }
  }
  return node;
}

function parseValue(value) {
  const valueParser = require("postcss-values-parser");

  let result = null;

  try {
    result = valueParser(value, { loose: true }).parse();
  } catch (e) {
    return {
      type: "value-unknown",
      value,
    };
  }

  const parsedResult = parseNestedValue(result);

  return addTypePrefix(parsedResult, "value-");
}

function parseSelector(selector) {
  // If there's a comment inside of a selector, the parser tries to parse
  // the content of the comment as selectors which turns it into complete
  // garbage. Better to print the whole selector as-is and not try to parse
  // and reformat it.
  if (/\/\/|\/\*/.test(selector)) {
    return {
      type: "selector-unknown",
      value: selector.trim(),
    };
  }

  const selectorParser = require("postcss-selector-parser");

  let result = null;

  try {
    selectorParser((result_) => {
      result = result_;
    }).process(selector);
  } catch (e) {
    // Fail silently. It's better to print it as is than to try and parse it
    // Note: A common failure is for SCSS nested properties. `background:
    // none { color: red; }` is parsed as a NestedDeclaration by
    // postcss-scss, while `background: { color: red; }` is parsed as a Rule
    // with a selector ending with a colon. See:
    // https://github.com/postcss/postcss-scss/issues/39
    return {
      type: "selector-unknown",
      value: selector,
    };
  }

  return addTypePrefix(result, "selector-");
}

function parseMediaQuery(params) {
  const mediaParser = require("postcss-media-query-parser").default;

  let result = null;

  try {
    result = mediaParser(params);
  } catch (e) {
    // Ignore bad media queries
    return {
      type: "selector-unknown",
      value: params,
    };
  }

  return addTypePrefix(addMissingType(result), "media-");
}

const DEFAULT_SCSS_DIRECTIVE = /(\s*?)(!default).*$/;
const GLOBAL_SCSS_DIRECTIVE = /(\s*?)(!global).*$/;

function parseNestedCSS(node, options) {
  if (node && typeof node === "object") {
    delete node.parent;

    for (const key in node) {
      parseNestedCSS(node[key], options);
    }

    if (!node.type) {
      return node;
    }

    if (!node.raws) {
      node.raws = {};
    }

    let selector = "";

    if (typeof node.selector === "string") {
      selector = node.raws.selector
        ? node.raws.selector.scss
          ? node.raws.selector.scss
          : node.raws.selector.raw
        : node.selector;

      if (node.raws.between && node.raws.between.trim().length > 0) {
        selector += node.raws.between;
      }

      node.raws.selector = selector;
    }

    let value = "";

    if (typeof node.value === "string") {
      value = node.raws.value
        ? node.raws.value.scss
          ? node.raws.value.scss
          : node.raws.value.raw
        : node.value;

      value = value.trim();

      node.raws.value = value;
    }

    let params = "";

    if (typeof node.params === "string") {
      params = node.raws.params
        ? node.raws.params.scss
          ? node.raws.params.scss
          : node.raws.params.raw
        : node.params;

      if (node.raws.afterName && node.raws.afterName.trim().length > 0) {
        params = node.raws.afterName + params;
      }

      if (node.raws.between && node.raws.between.trim().length > 0) {
        params = params + node.raws.between;
      }

      params = params.trim();

      node.raws.params = params;
    }

    // Ignore LESS mixin declaration
    if (selector.trim().length > 0) {
      if (selector.startsWith("@") && selector.endsWith(":")) {
        return node;
      }

      // Ignore LESS mixins
      if (node.mixin) {
        node.selector = parseValue(selector);

        return node;
      }

      // Check on SCSS nested property
      if (isSCSSNestedPropertyNode(node)) {
        node.isSCSSNesterProperty = true;
      }

      node.selector = parseSelector(selector);

      return node;
    }

    if (value.length > 0) {
      const defaultSCSSDirectiveIndex = value.match(DEFAULT_SCSS_DIRECTIVE);

      if (defaultSCSSDirectiveIndex) {
        value = value.slice(0, defaultSCSSDirectiveIndex.index);
        node.scssDefault = true;

        if (defaultSCSSDirectiveIndex[0].trim() !== "!default") {
          node.raws.scssDefault = defaultSCSSDirectiveIndex[0];
        }
      }

      const globalSCSSDirectiveIndex = value.match(GLOBAL_SCSS_DIRECTIVE);

      if (globalSCSSDirectiveIndex) {
        value = value.slice(0, globalSCSSDirectiveIndex.index);
        node.scssGlobal = true;

        if (globalSCSSDirectiveIndex[0].trim() !== "!global") {
          node.raws.scssGlobal = globalSCSSDirectiveIndex[0];
        }
      }

      if (value.startsWith("progid:")) {
        return {
          type: "value-unknown",
          value,
        };
      }

      node.value = parseValue(value);
    }

    // extend is missing
    if (
      isLessParser(options) &&
      node.type === "css-decl" &&
      !node.extend &&
      value.startsWith("extend(")
    ) {
      node.extend = node.raws.between === ":";
    }

    if (node.type === "css-atrule") {
      if (isLessParser(options)) {
        // mixin
        if (node.mixin) {
          const source =
            node.raws.identifier +
            node.name +
            node.raws.afterName +
            node.raws.params;
          node.selector = parseSelector(source);
          delete node.params;
          return node;
        }

        // function
        if (node.function) {
          return node;
        }
      }

      // only css support custom-selector
      if (options.parser === "css" && node.name === "custom-selector") {
        const customSelector = node.params.match(/:--\S+?\s+/)[0].trim();
        node.customSelector = customSelector;
        node.selector = parseSelector(
          node.params.slice(customSelector.length).trim()
        );
        delete node.params;
        return node;
      }

      if (isLessParser(options)) {
        // Whitespace between variable and colon
        if (node.name.includes(":") && !node.params) {
          node.variable = true;
          const parts = node.name.split(":");
          node.name = parts[0];
          node.value = parseValue(parts.slice(1).join(":"));
        }

        // Missing whitespace between variable and colon
        if (
          !["page", "nest"].includes(node.name) &&
          node.params &&
          node.params[0] === ":"
        ) {
          node.variable = true;
          node.value = parseValue(node.params.slice(1));
        }

        // Less variable
        if (node.variable) {
          delete node.params;
          return node;
        }
      }
    }

    if (node.type === "css-atrule" && params.length > 0) {
      const { name } = node;
      const lowercasedName = node.name.toLowerCase();

      if (name === "warn" || name === "error") {
        node.params = {
          type: "media-unknown",
          value: params,
        };

        return node;
      }

      if (name === "extend" || name === "nest") {
        node.selector = parseSelector(params);
        delete node.params;

        return node;
      }

      if (name === "at-root") {
        if (/^\(\s*(without|with)\s*:[\s\S]+\)$/.test(params)) {
          node.params = parseValue(params);
        } else {
          node.selector = parseSelector(params);
          delete node.params;
        }

        return node;
      }

      if (lowercasedName === "import") {
        node.import = true;
        delete node.filename;
        node.params = parseValue(params);
        return node;
      }

      if (
        [
          "namespace",
          "supports",
          "if",
          "else",
          "for",
          "each",
          "while",
          "debug",
          "mixin",
          "include",
          "function",
          "return",
          "define-mixin",
          "add-mixin",
        ].includes(name)
      ) {
        // Remove unnecessary spaces in SCSS variable arguments
        params = params.replace(/(\$\S+?)\s+?\.\.\./, "$1...");
        // Remove unnecessary spaces before SCSS control, mixin and function directives
        params = params.replace(/^(?!if)(\S+)\s+\(/, "$1(");

        node.value = parseValue(params);
        delete node.params;

        return node;
      }

      if (["media", "custom-media"].includes(lowercasedName)) {
        if (params.includes("#{")) {
          // Workaround for media at rule with scss interpolation
          return {
            type: "media-unknown",
            value: params,
          };
        }

        node.params = parseMediaQuery(params);

        return node;
      }

      node.params = params;

      return node;
    }
  }

  return node;
}

function parseWithParser(parse, text, options) {
  const parsed = parseFrontMatter(text);
  const { frontMatter } = parsed;
  text = parsed.content;

  let result;

  try {
    result = parse(text);
  } catch (e) {
    if (typeof e.line !== "number") {
      throw e;
    }
    throw createError("(postcss) " + e.name + " " + e.reason, { start: e });
  }

  result = parseNestedCSS(addTypePrefix(result, "css-"), options);

  calculateLoc(result, text);

  if (frontMatter) {
    result.nodes.unshift(frontMatter);
  }

  return result;
}

// TODO: make this only work on css
function parseCss(text, parsers, options) {
  const isSCSSParser = isSCSS(options.parser, text);
  const parseFunctions = isSCSSParser
    ? [parseScss, parseLess]
    : [parseLess, parseScss];

  let error;
  for (const parse of parseFunctions) {
    try {
      return parse(text, parsers, options);
    } catch (parseError) {
      error = error || parseError;
    }
  }

  /* istanbul ignore next */
  if (error) {
    throw error;
  }
}

function parseLess(text, parsers, options) {
  const lessParser = require("postcss-less");
  return parseWithParser(
    // Workaround for https://github.com/shellscape/postcss-less/issues/145
    // See comments for `replaceQuotesInInlineComments` in `loc.js`.
    (text) => lessParser.parse(replaceQuotesInInlineComments(text)),
    text,
    options
  );
}

function parseScss(text, parsers, options) {
  const { parse } = require("postcss-scss");
  return parseWithParser(parse, text, options);
}

const postCssParser = {
  astFormat: "postcss",
  hasPragma,
  locStart(node) {
    if (node.source) {
      return node.source.startOffset;
    }
    /* istanbul ignore next */
    return null;
  },
  locEnd(node) {
    if (node.source) {
      return node.source.endOffset;
    }
    return null;
  },
};

// Export as a plugin so we can reuse the same bundle for UMD loading
module.exports = {
  parsers: {
    css: {
      ...postCssParser,
      parse: parseCss,
    },
    less: {
      ...postCssParser,
      parse: parseLess,
    },
    scss: {
      ...postCssParser,
      parse: parseScss,
    },
  },
};
