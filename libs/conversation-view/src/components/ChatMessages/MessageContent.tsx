'use client';

import { FC } from 'react';
import classNames from 'classnames';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAdvancedView } from '../../context/AdvancedViewContext';

interface Props {
  content: string;
  textColorClass?: string;
}

const MessageContent: FC<Props> = ({ content, textColorClass }) => {
  const { isOpenedAdvancedView } = useAdvancedView();

  return (
    <div
      className={classNames(
        'prose max-w-none break-words',
        isOpenedAdvancedView ? 'body-2' : 'body-1',
        textColorClass,
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          strong: (props) => <strong className={textColorClass} {...props} />,
          a: ({ href, children, ...props }) => (
            <a href={href} target="_blank" {...props}>
              {children}
            </a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MessageContent;
