import { DataQuery, JsonDataQuery } from '@epam/statgpt-shared-toolkit';
import { isJsonAttachment } from './attachment-parser';
import { Attachment } from '@epam/ai-dial-shared';

export function getDataQueries(
  attachments: Attachment[],
): DataQuery[] | undefined {
  const jsonAttachments = attachments?.filter((attachment) =>
    isJsonAttachment(attachment),
  );

  if (!jsonAttachments?.every((json) => !!json?.data)) {
    return void 0;
  }

  return jsonAttachments?.map((json) => ({
    title: json?.title,
    ...getDataQueryFromJson(extractJsonFromAttachment(json?.data)),
  }));
}

function extractJsonFromAttachment(mdContent?: string) {
  if (mdContent) {
    try {
      return JSON.parse(mdContent);
    } catch (err) {
      console.error('Invalid JSON:', err);
    }
  }
  return null;
}

function getDataQueryFromJson(jsonDataQuery: JsonDataQuery): DataQuery {
  return {
    ...jsonDataQuery,
    filters: jsonDataQuery?.filters?.map((filter) => ({
      ...filter,
      componentCode: filter?.component_code || filter?.componentCode,
    })),
    metadata: {
      datasetUrl: jsonDataQuery?.metadata?.datasetUrl,
      countryDimension:
        jsonDataQuery?.metadata?.country_dimension ||
        jsonDataQuery?.metadata?.countryDimension,
      indicatorDimensions:
        jsonDataQuery?.metadata?.indicator_dimensions ||
        jsonDataQuery?.metadata?.indicatorDimensions,
    },
  };
}
