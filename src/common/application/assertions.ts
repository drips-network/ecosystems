import {UUID} from 'crypto';
import {OxString, ProjectName} from '../domain/types';

export function assertIsProjectName(
  value: unknown,
): asserts value is ProjectName {
  if (typeof value !== 'string') {
    throw new Error(`Expected a string, but got ${value}.`);
  }
}

export function assertIsUUID(value: unknown): asserts value is UUID {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  if (typeof value !== 'string' || !uuidRegex.test(value)) {
    throw new Error(`Value '${value}' is not a valid UUID.`);
  }
}

export function assertIsOxString(value: unknown): asserts value is OxString {
  if (typeof value !== 'string' || !value.startsWith('0x')) {
    throw new Error(`Value '${value}' is not a valid OxString.`);
  }
}
