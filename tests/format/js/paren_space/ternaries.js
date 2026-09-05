a => a ? () => { a } : () => { a }

const devOnly = (block) => (!!__DEV__?block:null);

f(result => (result ? result : candidate), 'foobar');

const obj = {
  foo: 'foo',
  bar: 'bar',
  text: () => (typeof text === 'function' ? text() : text),
};

const call = (foo ? bar : baz).get();
(foo ? bar : baz).get();

const longCall = (
  'Something long enough that prettier wraps the parens'
    ? 'and has to be'
    : 'an expression so it keeps them'
).bar();

('Something long enough that prettier wraps the parens'
  ? 'and has to be'
  : 'an expression so it keeps them'
).bar();