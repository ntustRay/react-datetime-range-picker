import { expect, test } from "vitest";

test("consumer can import the public package entry point", async () => {
  const publicModule: unknown = await import("../src/index.js");

  expect(publicModule).toBeDefined();
});
