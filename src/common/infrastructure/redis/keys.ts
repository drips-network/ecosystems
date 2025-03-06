export type ProcessingKeys = {
  queueKey: string;
  resultsKey: string;
  successCountKey: string;
  failureCountKey: string;
  lockKey: string;
};

type KeyBuilderOptions = {
  prefix?: string;
  separator?: string;
  resultsSuffix?: string;
  successCountSuffix?: string;
  failureCountSuffix?: string;
  lockSuffix?: string;
};

const DEFAULT_OPTIONS: Required<KeyBuilderOptions> = {
  prefix: '',
  separator: ':',
  resultsSuffix: 'results',
  successCountSuffix: 'success-count',
  failureCountSuffix: 'failed-count',
  lockSuffix: 'lock',
};

function buildBaseKey(
  parts: string[],
  options: Required<KeyBuilderOptions>,
): string {
  return [options.prefix, ...parts].filter(Boolean).join(options.separator);
}

export function createKeyBuilder(customOptions: KeyBuilderOptions = {}) {
  const options = {...DEFAULT_OPTIONS, ...customOptions};

  return {
    buildQueueKey: (...parts: string[]) => {
      return buildBaseKey(parts, options);
    },

    buildResultsKey: (...parts: string[]) => {
      const baseKey = buildBaseKey(parts, options);

      return `${baseKey}${options.separator}${options.resultsSuffix}`;
    },

    buildSuccessCountKey: (...parts: string[]) => {
      const baseKey = buildBaseKey(parts, options);

      return `${baseKey}${options.separator}${options.successCountSuffix}`;
    },

    buildFailureCountKey: (...parts: string[]) => {
      const baseKey = buildBaseKey(parts, options);

      return `${baseKey}${options.separator}${options.failureCountSuffix}`;
    },

    buildLockKey: (...parts: string[]) => {
      const baseKey = buildBaseKey(parts, options);

      return `${baseKey}${options.separator}${options.lockSuffix}`;
    },

    buildAllKeys: (...parts: string[]): ProcessingKeys => {
      const baseKey = buildBaseKey(parts, options);

      return {
        queueKey: baseKey,
        resultsKey: `${baseKey}${options.separator}${options.resultsSuffix}`,
        successCountKey: `${baseKey}${options.separator}${options.successCountSuffix}`,
        failureCountKey: `${baseKey}${options.separator}${options.failureCountSuffix}`,
        lockKey: `${baseKey}${options.separator}${options.lockSuffix}`,
      };
    },
  };
}
