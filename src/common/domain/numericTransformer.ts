import {ValueTransformer} from 'typeorm';

export const numericTransformer: ValueTransformer = {
  // When reading from the database, convert the string to a number.
  from: (value: string | null): number | null => {
    return value === null ? null : parseFloat(value);
  },
  // When writing to the database, keep it as is.
  to: (value: number | null): number | null => {
    return value;
  },
};
