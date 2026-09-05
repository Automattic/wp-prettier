// TypeScript syntax that did not exist yet when the paren spacing patch was written.

// const type parameters, variance annotations, instantiation expressions
function identity<const T extends readonly unknown[]>(value: T): T {
  return value;
}
interface Box<in out T> {
  unwrap(value: T): T;
}
const boundIdentity = identity<string>;

// satisfies
const config = { port: 1 } satisfies Record<string, number>;

// import types, with import attributes
type Thing = import("./m.js").Thing;
type Resolved = import("./m.js", {
  with: { "resolution-mode": "import" },
}).Thing;

// template literal types and key remapping
type Prefixed = `prefix-${string}-suffix`;
type Getters<T> = {
  [K in keyof T as `get${Capitalize<K & string>}`]: () => T[K];
};

// infer with constraints inside tuple types
type Head<T> = T extends [infer H extends string, ...infer R] ? H : never;

// abstract accessors and override
abstract class Base {
  abstract accessor id: number;
}
class Derived extends Base {
  accessor id = 0;
  override toString(): string {
    return String(this.id);
  }
}

// enum bodies
enum Direction {
  Up = 1,
  Down = 2,
}
