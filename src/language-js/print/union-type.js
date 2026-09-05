import {
  align,
  group,
  ifBreak,
  indent,
  join,
  line,
  softline,
} from "../../document/index.js";
import { printComments } from "../../main/comments/print.js";
import { CommentCheckFlags, hasComment } from "../utilities/comments.js";
import { isFlowObjectTypePropertyAFunction } from "../utilities/is-flow-object-type-property-a-function.js";
import {
  isConditionalType,
  isTupleType,
  isTypeParameterInstantiation,
} from "../utilities/node-types.js";
import {
  isMultipleTupleTypeElement,
  shouldHugUnionType,
  shouldUnionTypePrintOwnComments,
} from "../utilities/union-type-print.js";

/**
@import {Doc} from "../../document/index.js";
*/

// copy of the `TSUnionType` and `UnionTypeAnnotation` conditions from
// `needsParentheses`, which defers to us so the parens can be spaced
function needsParens(path) {
  const { node, parent, key } = path;

  if (node.type === "TSUnionType") {
    if (
      parent.type === "TSUnionType" ||
      parent.type === "TSIntersectionType"
    ) {
      return true;
    }

    if (node.type === "TSInferType" && parent.type === "TSRestType") {
      return false;
    }

    return (
      parent.type === "TSArrayType" ||
      parent.type === "TSOptionalType" ||
      parent.type === "TSRestType" ||
      (key === "objectType" && parent.type === "TSIndexedAccessType") ||
      parent.type === "TSTypeOperator" ||
      (parent.type === "TSTypeAnnotation" &&
        path.grandparent.type.startsWith("TSJSDoc"))
    );
  }

  if (node.type === "UnionTypeAnnotation") {
    return (
      parent.type === "ArrayTypeAnnotation" ||
      parent.type === "NullableTypeAnnotation" ||
      parent.type === "IntersectionTypeAnnotation" ||
      parent.type === "UnionTypeAnnotation" ||
      (key === "objectType" &&
        (parent.type === "IndexedAccessType" ||
          parent.type === "OptionalIndexedAccessType"))
    );
  }
}

// `TSUnionType` and `UnionTypeAnnotation`
function printUnionType(path, options, print, args) {
  const parenSpace = options.parenSpacing ? " " : "";
  const parenLine = options.parenSpacing ? line : softline;
  const { node } = path;

  // {
  //   a: string
  // } | null | void
  // should be inlined and not be printed in the multi-line variant
  if (shouldHugUnionType(node)) {
    const joined = join(" | ", path.map(print, "types"));
    return needsParens(path)
      ? ["(", parenSpace, joined, parenSpace, ")"]
      : joined;
  }

  // single-line variation
  // A | B | C

  // multi-line variation
  // | A
  // | B
  // | C

  // We want to align the children but without its comment, so it looks like
  // | child1
  // // comment
  // | child2
  /** @type {Doc} */
  let printed = group(
    path.map(({ isFirst }) => {
      const bar = isFirst ? ifBreak("| ") : [line, "| "];
      const typeDoc = print();
      if (hasComment(path.node, CommentCheckFlags.Leading)) {
        return [bar, align(2, printComments(path, typeDoc, options))];
      }

      return [bar, printComments(path, align(2, typeDoc), options)];
    }, "types"),
  );

  if (shouldUnionTypePrintOwnComments(path)) {
    printed = printComments(path, printed, options);
  }

  if (needsParens(path)) {
    return group(["(", indent([parenLine, printed]), parenLine, ")"]);
  }

  if (isMultipleTupleTypeElement(path)) {
    return group([
      indent([ifBreak(["(", parenLine]), printed]),
      ifBreak([parenLine, ")"]),
    ]);
  }

  // Already indent in parent
  if (
    args?.assignmentLayout === "break-after-operator" ||
    !shouldIndentUnionType(path)
  ) {
    return printed;
  }

  return group(indent([softline, printed]));
}

function shouldIndentUnionType(path) {
  const { key, parent } = path;
  if (
    (key === "typeAnnotation" && parent.type === "TSTypeAssertion") ||
    (key === "elementTypes" && isTupleType(parent)) ||
    ((key === "trueType" || key === "falseType") &&
      isConditionalType(parent)) ||
    (key === "params" && isTypeParameterInstantiation(parent)) ||
    (key === "typeAnnotation" &&
      parent.type === "FunctionTypeParam" &&
      !parent.name &&
      path.grandparent.this !== parent)
  ) {
    return false;
  }

  if (
    path.match(
      undefined,
      (node, key) =>
        key === "typeAnnotation" && node.type === "FunctionTypeParam",
      (node, key) => key === "params" && node.type === "FunctionTypeAnnotation",
      (node, key) =>
        key === "value" &&
        node.type === "ObjectTypeProperty" &&
        isFlowObjectTypePropertyAFunction(node),
    )
  ) {
    return false;
  }

  return true;
}

export { printUnionType, shouldHugUnionType };
