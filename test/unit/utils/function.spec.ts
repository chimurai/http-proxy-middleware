/* eslint-disable @typescript-eslint/no-empty-function */
import { getFunctionName } from '../../../src/utils/function';

describe('getFunctionName()', () => {
  it('should return Function name', () => {
    function myFunction() {}
    expect(getFunctionName(myFunction)).toBe('myFunction');
  });

  it('should return arrow Function name', () => {
    const myFunction = () => {};
    expect(getFunctionName(myFunction)).toBe('myFunction');
  });

  it('should return anonymous Function name', () => {
    expect(getFunctionName(() => {})).toBe('[anonymous Function]');
  });
});
