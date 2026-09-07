declare function fn<T>(value: T): T;
type Fn = typeof fn;

const satisfiesThenInstantiate = (fn satisfies Fn)<string>;
const asThenInstantiate = (fn as Fn)<string>;
const assertionThenInstantiate = (<Fn>fn)<string>;
const chained = (fn as Fn)<string>("value");

// No parentheses needed here, the type arguments belong to the callee already.
const plain = fn<string>;
