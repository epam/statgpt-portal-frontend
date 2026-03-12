import {
  EXCEEDED_LIMIT_ORDER,
  ExceededLimit,
} from '@epam/statgpt-dial-toolkit';

function uniqExceededLimits(limits: ExceededLimit[]): ExceededLimit[] {
  return [...new Set(limits)];
}

function sortExceededLimits(limits: ExceededLimit[]): ExceededLimit[] {
  return [...limits].sort(
    (a, b) => EXCEEDED_LIMIT_ORDER.indexOf(a) - EXCEEDED_LIMIT_ORDER.indexOf(b),
  );
}

function formatExceededLimitsList(
  limits: ExceededLimit[],
  t: (key: string, params?: Record<string, string>) => string,
): string {
  const labels = sortExceededLimits(uniqExceededLimits(limits)).map((limit) =>
    t(`statusMessages.rateLimit.limit.${limit}`),
  );

  if (labels.length === 0) {
    return '';
  }

  if (labels.length === 1) {
    return labels[0];
  }

  if (labels.length === 2) {
    return t('statusMessages.rateLimit.list.two', {
      first: labels[0],
      second: labels[1],
    });
  }

  return t('statusMessages.rateLimit.list.many', {
    items: labels.slice(0, -1).join(', '),
    last: labels[labels.length - 1],
  });
}

export function getExceededLimitsMessage(
  limits: ExceededLimit[],
  t: (key: string, params?: Record<string, string>) => string,
): string {
  const normalizedLimits = sortExceededLimits(uniqExceededLimits(limits));
  const formattedLimits = formatExceededLimitsList(normalizedLimits, t);

  if (!formattedLimits) {
    return '';
  }

  return t(
    normalizedLimits.length === 1
      ? 'statusMessages.rateLimit.message.exceeded.one'
      : 'statusMessages.rateLimit.message.exceeded.many',
    {
      limits: formattedLimits,
    },
  );
}
