const JSON_KEY = 'json';

export function prepareMarkdownContent(
  rawData: string | undefined,
): string | undefined {
  return isJSON(rawData)
    ? validateJson(rawData?.slice(JSON_KEY.length))
    : rawData;
}

export function validateJson(rawJson: string | undefined): string {
  let jsonString = '';

  if (rawJson) {
    try {
      jsonString = JSON.stringify(JSON.parse(rawJson), null, 2);
    } catch {
      jsonString = rawJson.toString();
    }
  }

  return jsonString;
}

function isJSON(data: string | undefined): boolean {
  return data?.startsWith(JSON_KEY) || false;
}
