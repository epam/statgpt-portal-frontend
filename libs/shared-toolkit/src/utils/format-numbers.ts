import { defaultFormatNumbers } from '@statgpt/shared-toolkit/src/constants/format-numbers-default';
import { FormatNumbersType } from '@statgpt/shared-toolkit/src/models/format-numbers-type';

// fixing JS math errors
const roundNumber = (num: number, length: number): string => {
  const number = Math.round(num * 10 ** length) / 10 ** length;

  return number.toFixed(length);
};

export const formatNumberBySign = (
  num: string,
  formatNumbers: FormatNumbersType,
): string => {
  const decimal = formatNumbers?.decimal || defaultFormatNumbers.decimal;
  const decimalSymbol =
    formatNumbers?.decimalSymbol || defaultFormatNumbers.decimalSymbol;
  const digitGroupingSymbol =
    formatNumbers?.digitGroupingSymbol ??
    defaultFormatNumbers.digitGroupingSymbol;

  const formatNumber = Number(num);
  if (
    formatNumber == null ||
    Number.isNaN(formatNumber) ||
    num === null ||
    num === ''
  ) {
    return '';
  }

  const precisionNum = decimal.replace('0.', '');
  const formatNumberStr =
    decimal === '0'
      ? Math.trunc(formatNumber)
      : roundNumber(formatNumber, precisionNum.length);

  const parts = `${formatNumberStr} `.split('.');
  parts[0] = parts[0].replace(
    /(\d)(?=(\d\d\d)+(?!\d))/g,
    `$1${digitGroupingSymbol}`,
  );

  return `${parts.join(decimalSymbol)}`;
};
