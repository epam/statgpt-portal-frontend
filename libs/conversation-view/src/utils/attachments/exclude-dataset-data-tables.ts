import { Attachment } from '@epam/ai-dial-shared';
import { DataQuery } from '@epam/statgpt-shared-toolkit';

const TITLE_PREFIX_SEPARATOR = ': ';

/**
 * Returns the part of an attachment title after the first `": "`, i.e. the
 * dataset source id when the title follows the `"<Prefix>: {dataset_source_id}"`
 * template. Titles without the separator yield `undefined`.
 * @param title - attachment or data query title
 */
function getTitleSuffix(title?: string): string | undefined {
  const separatorIndex = title?.indexOf(TITLE_PREFIX_SEPARATOR) ?? -1;
  if (!title || separatorIndex < 0) return undefined;
  return (
    title.slice(separatorIndex + TITLE_PREFIX_SEPARATOR.length) || undefined
  );
}

/**
 * Drops raw table attachments that merely duplicate a dataset already shown
 * through its data query (e.g. `"Data: <id>"` next to `"Query (JSON): <id>"`),
 * while keeping standalone tables such as the missing-dimension pick lists,
 * whose titles carry no `"<Prefix>: <dataset id>"` form. Matching is done on the
 * dataset id part of the title, so it holds only while both attachment names are
 * built from the same dataset source id template.
 * @param tableAttachments - raw table attachments of a message
 * @param dataQueries - data queries parsed from the same message
 */
export function excludeDatasetDataTables(
  tableAttachments: Attachment[],
  dataQueries?: DataQuery[],
): Attachment[] {
  if (!dataQueries?.length) return tableAttachments;

  const datasetIds = new Set(
    dataQueries
      .map((query) => getTitleSuffix(query.title))
      .filter((id): id is string => !!id),
  );
  if (datasetIds.size === 0) return tableAttachments;

  return tableAttachments.filter((attachment) => {
    const datasetId = getTitleSuffix(attachment.title);
    return datasetId === undefined || !datasetIds.has(datasetId);
  });
}
