import { printOptionalToken } from "./miscellaneous.js";

/*
- `TSIndexedAccessType`(TypeScript)
- `IndexedAccessType`(flow)
- `OptionalIndexedAccessType`(flow)
*/
function printIndexedAccessType(path, options, print) {
  const parenSpace = options.parenSpacing ? " " : "";
  return [
    print("objectType"),
    printOptionalToken(path),
    "[",
    parenSpace,
    print("indexType"),
    parenSpace,
    "]",
  ];
}

export { printIndexedAccessType };
