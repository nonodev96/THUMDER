import { ObjectsPipe } from '@shared/pipes/Objects/objects.pipe';

describe('ObjectsPipe', () => {
  it('create an instance', () => {
    const pipe = new ObjectsPipe();
    expect(pipe).toBeTruthy();
  });
});
