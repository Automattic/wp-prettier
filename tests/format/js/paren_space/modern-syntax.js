// Syntax that did not exist yet when the paren spacing patch was written.

// import attributes and the deferred import phase
import json from "./f.json" with { type: "json" };
export { a } from "./m.js" with { type: "json" };
export * from "./m.js" with { type: "json" };
const loaded = await import("./f.json", { with: { type: "json" } });
// static blocks
class Widget {
  static {
    register(Widget, options);
  }
}

// optional chaining call and computed access, logical assignment
const value = target?.[computedKey];
const result = target?.(firstArgument, secondArgument);
cache ??= createCache(firstArgument, secondArgument);

// private brand checks
class Brand {
  #tag = 1;
  static has(x) {
    return #tag in x;
  }
}
