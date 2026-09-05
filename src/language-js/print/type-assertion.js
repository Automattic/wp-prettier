import {
  conditionalGroup,
  group,
  ifBreak,
  indent,
  line,
  softline,
} from "../../document/index.js";
import {
  isArrayExpression,
  isObjectExpression,
} from "../utilities/node-types.js";

/*
- `TSTypeAssertion` (TypeScript)
*/
function printTypeAssertion(path, options, print) {
  const parenLine = options.parenSpacing ? line : softline;
  const { node } = path;
  const shouldBreakAfterCast = !(
    isArrayExpression(node.expression) || isObjectExpression(node.expression)
  );

  const castGroup = group([
    "<",
    indent([parenLine, print("typeAnnotation")]),
    parenLine,
    ">",
  ]);

  const exprContents = [
    ifBreak("("),
    indent([softline, print("expression")]),
    softline,
    ifBreak(")"),
  ];

  if (shouldBreakAfterCast) {
    return conditionalGroup([
      [castGroup, print("expression")],
      [castGroup, group(exprContents, { shouldBreak: true })],
      [castGroup, print("expression")],
    ]);
  }
  return group([castGroup, print("expression")]);
}

export { printTypeAssertion };
