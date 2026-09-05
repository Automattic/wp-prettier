import { group } from "../../document/index.js";
import { printForXStatementBody } from "./clause.js";

function printForXStatement(path, options, print) {
  const parenSpace = options.parenSpacing ? " " : "";
  const { node } = path;
  const isForOfStatement = node.type === "ForOfStatement";
  return group([
    "for",
    isForOfStatement && node.await ? " await" : "",
    " (",
    parenSpace,
    print("left"),
    " ",
    isForOfStatement ? "of" : "in",
    " ",
    print("right"),
    parenSpace,
    ")",
    printForXStatementBody(path, options, print),
  ]);
}

export { printForXStatement };
