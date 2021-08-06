import { HexadecimalPipe } from './hexadecimal.pipe';

describe('HexPipe', () => {
  it('create an instance', () => {
    const pipe = new HexadecimalPipe();
    expect(pipe).toBeTruthy();
  });
});
