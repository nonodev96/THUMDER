import { ObjectsPipe } from "@shared/pipes/Objects/objects.pipe";
import { describe, expect, it } from "vitest";

describe("ObjectsPipe", () => {
  it("create an instance", () => {
    const pipe = new ObjectsPipe();
    expect(pipe).toBeTruthy();
  });
});
