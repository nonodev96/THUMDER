import { expect } from "chai";
import type { SpectronClient } from "spectron";
import commonSetup from "../_common-setup";

describe("THUMDER App Memory", function () {
  commonSetup.apply(this);

  let _client: SpectronClient;

  beforeEach(function () {
    _client = this.app.client;
  });

  it("example", () => {
    // done();
  });

  it("example async", async () => {
    expect(true).to.equal(true);
  });
});
