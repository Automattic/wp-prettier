// Decorators and auto accessors, which the paren spacing patch predates.
class Widget {
  @decorate(firstArgument, secondArgument) accessor label = "";
  @decorate accessor [computedName] = 0;

  @decorate({ option: true, other: false })
  method(firstParameter: string, secondParameter: number): void {}
}
