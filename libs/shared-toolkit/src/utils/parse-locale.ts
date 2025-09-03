export function parseLocale(locale: string): string {
  return locale.split(',')[0].split('-')[0];
}
