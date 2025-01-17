export const single = <T>(array: T[]): T => {
  if (array.length === 1) {
    return array[0];
  }

  if (array.length === 0) {
    throw new Error('The array contains no elements.');
  }

  throw new Error('The array contains more than one element.');
};
