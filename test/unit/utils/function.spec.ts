import { describe, expect, it } from 'vitest';

import { getFunctionName } from '../../../src/utils/function.js';

describe('getFunctionName()', () => {
  it('should return Function name', () => {
    function myFunction() {}
    expect(getFunctionName(myFunction)).toBe('myFunction');
  });

  it('should return arrow Function name', () => {
    const myArrowFunction = () => {};
    expect(getFunctionName(myArrowFunction)).toBe('myArrowFunction');
  });

  it('should return anonymous Function name', () => {
    expect(getFunctionName(() => {})).toBe('[anonymous Function]');
  });
});
