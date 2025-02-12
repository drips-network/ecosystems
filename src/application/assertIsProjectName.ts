import {ProjectName} from '../domain/types';

export default function assertIsProjectName(
  value: unknown,
): asserts value is ProjectName {
  if (typeof value !== 'string') {
    throw new Error(`Expected a string, but got ${value}.`);
  }
}
