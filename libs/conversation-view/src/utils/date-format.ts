import { format, isValid } from 'date-fns';
import { uk } from 'date-fns/locale';
import { Locale } from '@statgpt/shared-toolkit/src/types/locale';

const getDateFormatByLocale = (locale: string): string => {
  return locale === Locale.UK ? 'dd MMM, yyyy' : ' MMM dd, yyyy hh:mm aa';
};

export const getDateFormattedValue = (
  value: string | number | undefined,
  locale: string,
): string => {
  const dateFormat = getDateFormatByLocale(locale);

  return value != null && value !== '' && dateFormat && isValid(new Date(value))
    ? format(
        new Date(value),
        dateFormat,
        locale === Locale.UK ? { locale: uk } : void 0,
      )
    : '';
};
