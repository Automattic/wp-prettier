import { indent, line, softline } from "../../document/index.js";
import hasNewline from "../../utilities/has-newline.js";
import { locEnd, locStart } from "../location/index.js";
import { isBlockComment } from "../utilities/comment-types.js";
import { hasComment } from "../utilities/comments.js";

function printTryStatement(path, options, print) {
  const { node } = path;
  return [
    "try ",
    print("block"),
    node.handler ? [" ", print("handler")] : "",
    node.finalizer ? [" finally ", print("finalizer")] : "",
  ];
}

function printCatchClause(path, options, print) {
  const parenSpace = options.parenSpacing ? " " : "";
  const parenLine = options.parenSpacing ? line : softline;
  const { node } = path;
  if (node.param) {
    const parameterHasComments = hasComment(
      node.param,
      (comment) =>
        !isBlockComment(comment) ||
        (comment.leading &&
          hasNewline(options.originalText, locEnd(comment))) ||
        (comment.trailing &&
          hasNewline(options.originalText, locStart(comment), {
            backwards: true,
          })),
    );
    const param = print("param");

    return [
      "catch ",
      parameterHasComments
        ? ["(", indent([parenLine, param]), parenLine, ") "]
        : ["(", parenSpace, param, parenSpace, ") "],
      print("body"),
    ];
  }

  return ["catch ", print("body")];
}

export { printCatchClause, printTryStatement };
