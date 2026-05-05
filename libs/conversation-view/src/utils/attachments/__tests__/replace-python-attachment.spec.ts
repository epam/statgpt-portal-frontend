import { Role } from '@epam/ai-dial-shared';
import { AttachmentType } from '@epam/statgpt-dial-toolkit';
import { replacePythonAttachment } from '../replace-python-attachment';

jest.mock('@epam/ai-dial-shared', () => ({
  Role: {
    System: 'system',
    User: 'user',
  },
}));

jest.mock('@epam/statgpt-dial-toolkit', () => ({
  AttachmentType: {
    MARKDOWN: 'text/markdown',
  },
}));

describe('replacePythonAttachment', () => {
  const newAttachment = {
    type: AttachmentType.MARKDOWN,
    title: 'Python Code',
    data: '```python\nprint("new")\n```',
  };

  it('targets the message id when provided', () => {
    const result = replacePythonAttachment(
      [
        {
          id: 'system-1',
          role: Role.System,
          content: '',
          custom_content: {
            attachments: [
              {
                type: AttachmentType.MARKDOWN,
                data: '```python\nprint("old")\n```',
              },
            ],
          },
        },
        { id: 'system-2', role: Role.System, content: '' },
      ] as any,
      newAttachment,
      'system-1',
    );

    expect(result?.[0].custom_content?.attachments).toEqual([newAttachment]);
    expect(result?.[1].custom_content?.attachments).toBeUndefined();
  });

  it('targets the latest system message when message id is not provided', () => {
    const result = replacePythonAttachment(
      [
        { id: 'system-1', role: Role.System, content: '' },
        { id: 'user-1', role: Role.User, content: '' },
        {
          id: 'system-2',
          role: Role.System,
          content: '',
          custom_content: {
            attachments: [
              {
                type: AttachmentType.MARKDOWN,
                data: '```python\nprint("old")\n```',
              },
            ],
          },
        },
        { id: 'user-2', role: Role.User, content: '' },
      ] as any,
      newAttachment,
    );

    expect(
      result?.find((m) => m.id === 'system-1')?.custom_content,
    ).toBeUndefined();
    expect(
      result?.find((m) => m.id === 'system-2')?.custom_content?.attachments,
    ).toEqual([newAttachment]);
  });
});
