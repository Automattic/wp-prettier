// Explicit resource management, which the paren spacing patch predates.
function withResource() {
  using handle = openResource(firstArgument, secondArgument);
}

async function withAsyncResource() {
  await using handle = openResource(firstArgument, secondArgument, thirdOne);
}
