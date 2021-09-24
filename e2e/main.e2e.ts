import { expect } from 'chai';
import commonSetup from './_common-setup';

describe('angular-electron App', function () {

  commonSetup.apply(this);

  beforeEach(async function () {
    await this.app.client.waitUntilWindowLoaded()
  });

  it('creates initial windows', async function () {
    const count = await this.app.client.getWindowCount();
    expect(count).to.equal(1);
  });

  it('should display message saying App works !', async function () {
    const elem = await this.app.client.$('app-home h1');
    const text = await elem.getText();
    expect(text).to.equal('THUMDER');
  });

});
