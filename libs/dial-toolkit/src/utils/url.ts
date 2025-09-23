export function encodeApiUrl(path: string): string {
  return path
    .split('/')
    .map((part) => encodeURIComponent(part))
    .join('/');
}

export function decodeApiUrl(path: string): string {
  return path
    .split('/')
    .map((part) => decodeURIComponent(part))
    .join('/');
}
