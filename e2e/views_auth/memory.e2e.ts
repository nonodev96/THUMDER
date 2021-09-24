import { SpectronClient } from 'spectron';

import commonSetup from '../_common-setup';
import { expect } from "chai";

describe('THUMDER App Memory', function () {

  commonSetup.apply(this);

  let client: SpectronClient;

  beforeEach(function () {
    client = this.app.client;
  });

  it('example', function () {

    // done();
  });

  it('example async', async function () {
    expect(true).to.equal(true);
  });

});
