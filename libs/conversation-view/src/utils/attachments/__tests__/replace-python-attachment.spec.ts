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

  it('only updates the last system message when multiple system messages have no id', () => {
    const earlierSystemMsg = {
      role: Role.System,
      content: '',
      custom_content: {
        attachments: [
          {
            type: AttachmentType.MARKDOWN,
            data: '```python\nprint("earlier")\n```',
          },
        ],
      },
    };
    const laterSystemMsg = {
      role: Role.System,
      content: '',
      custom_content: {
        attachments: [
          {
            type: AttachmentType.MARKDOWN,
            data: '```python\nprint("later")\n```',
          },
        ],
      },
    };

    const result = replacePythonAttachment(
      [
        earlierSystemMsg,
        { id: 'user-1', role: Role.User, content: '' },
        laterSystemMsg,
      ] as any,
      newAttachment,
    );

    expect(result?.[0].custom_content?.attachments).toEqual(
      earlierSystemMsg.custom_content.attachments,
    );
    expect(result?.[2].custom_content?.attachments).toEqual([newAttachment]);
  });

  it('with datasetUrn, replaces only the matching python attachment and preserves siblings', () => {
    const messages = [
      {
        role: Role.System,
        content: '',
        custom_content: {
          attachments: [
            {
              type: AttachmentType.MARKDOWN,
              title: 'Python code for URN:A',
              data: '```python\nprint("A")\n```',
            },
            {
              type: AttachmentType.MARKDOWN,
              title: 'Python code for URN:B',
              data: '```python\nprint("B-old")\n```',
            },
          ],
        },
      },
    ] as any;

    const newB = {
      type: AttachmentType.MARKDOWN,
      title: 'Python code for URN:B',
      data: '```python\nprint("B-new")\n```',
    };

    const result = replacePythonAttachment(messages, newB, undefined, 'URN:B');
    const attachments = result?.[0].custom_content?.attachments ?? [];

    expect(attachments).toHaveLength(2);
    expect(attachments.find((a: any) => a.title === 'Python code for URN:A')?.data).toBe(
      '```python\nprint("A")\n```',
    );
    expect(attachments.find((a: any) => a.title === 'Python code for URN:B')?.data).toBe(
      '```python\nprint("B-new")\n```',
    );
  });

  it('with datasetUrn that matches nothing, appends without removing siblings', () => {
    const messages = [
      {
        role: Role.System,
        content: '',
        custom_content: {
          attachments: [
            {
              type: AttachmentType.MARKDOWN,
              title: 'Python code for URN:A',
              data: '```python\nprint("A")\n```',
            },
          ],
        },
      },
    ] as any;

    const newC = {
      type: AttachmentType.MARKDOWN,
      title: 'Python code for URN:C',
      data: '```python\nprint("C")\n```',
    };

    const result = replacePythonAttachment(messages, newC, undefined, 'URN:C');
    const attachments = result?.[0].custom_content?.attachments ?? [];

    expect(attachments).toHaveLength(2);
    expect(attachments.find((a: any) => a.title === 'Python code for URN:A')).toBeDefined();
    expect(attachments.find((a: any) => a.title === 'Python code for URN:C')).toBeDefined();
  });
});
