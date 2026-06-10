import { RefObject } from 'react';
import { Attachment } from '@epam/ai-dial-shared';
import { AttachmentType } from '@epam/statgpt-dial-toolkit';
import { DataQuery } from '@epam/statgpt-shared-toolkit';
import { CustomCodeAttachment } from '../../models/attachments';
import { GetPythonAttachment } from '../../types/actions';

/**
 * Calls the python attachment API with stale-request protection and applies
 * the result to local state and the persisted conversation.
 *
 * @param options.getPythonAttachment - Action that fetches refreshed python code for the given queries.
 * @param options.dataQueries - Dataset queries (with merged UI filters) to pass to the API.
 * @param options.requestIdRef - Ref counter used to discard responses from superseded requests.
 * @param options.codeTitle - Title for the `CUSTOM_CODE_SAMPLE` attachment shown in the UI.
 * @param options.markdownTitle - Title for the raw markdown attachment written back to the conversation.
 * @param options.setCodeAttachments - State setter that replaces the current code attachment list.
 * @param options.onCodeAttachmentUpdated - Optional callback to persist the updated markdown attachment.
 * @param options.datasetUrn - Optional dataset URN forwarded to onCodeAttachmentUpdated to scope persistence to one dataset.
 */
export function invokePythonAttachment(options: {
  getPythonAttachment: GetPythonAttachment;
  dataQueries: DataQuery[];
  requestIdRef: RefObject<number>;
  codeTitle: string;
  markdownTitle: string;
  datasetUrn?: string;
  setCodeAttachments: (attachments: CustomCodeAttachment[]) => void;
  onCodeAttachmentUpdated?: (attachment: Attachment, datasetUrn?: string) => void;
}): void {
  const {
    getPythonAttachment,
    dataQueries,
    requestIdRef,
    codeTitle,
    markdownTitle,
    datasetUrn,
    setCodeAttachments,
    onCodeAttachmentUpdated,
  } = options;
  const requestId = ++requestIdRef.current;
  getPythonAttachment(dataQueries)
    .then((result) => {
      if (requestId !== requestIdRef.current) return;
      if (!result?.python_code) return;
      setCodeAttachments([
        {
          type: AttachmentType.CUSTOM_CODE_SAMPLE,
          data: result.python_code,
          language: 'python',
          title: codeTitle,
        },
      ]);
      onCodeAttachmentUpdated?.(
        {
          type: AttachmentType.MARKDOWN,
          title: markdownTitle,
          data: `\`\`\`python\n${result.python_code}\n\`\`\``,
        },
        datasetUrn,
      );
    })
    .catch((err) => console.error('Error refreshing python attachment:', err));
}
