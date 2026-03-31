import { mergeClasses } from '../../../utils/mergeClasses';
import { CustomCodeAttachment } from '../../../models/attachments';
import Editor from '@monaco-editor/react';

export const CodeAttachment = ({
  attachment,
  className,
}: {
  attachment: CustomCodeAttachment;
  className?: string;
}) => {
  const { data, language } = attachment;

  return (
    <div
      className={mergeClasses([
        'h-full w-full [&_.cursors-layer]:hidden',
        className,
      ])}
    >
      <Editor
        value={data}
        language={language}
        theme="vs-light"
        options={{
          readOnly: true,
          contextmenu: false,
          scrollBeyondLastLine: false,
          minimap: { enabled: false },
          wordWrap: 'on',
          automaticLayout: true,
          tabSize: 2,
        }}
      />
    </div>
  );
};
