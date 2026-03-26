import { FC, Ref } from 'react';
import classNames from 'classnames';
import remarkGfm from 'remark-gfm';
import ReactMarkdown from 'react-markdown';
import { Stage } from '@epam/ai-dial-shared';
import { IconPointFilled } from '@tabler/icons-react';
import { Loader } from '@epam/statgpt-ui-components';

interface Props {
  stage: Stage;
  stageRef: Ref<HTMLDivElement>;
  isCurrentStage?: boolean;
}

const MessageStage: FC<Props> = ({ stage, stageRef, isCurrentStage }) => {
  return (
    <div
      ref={stageRef}
      className="message-stage relative flex pb-8 last:mb-8 last:pb-0"
    >
      <span className="message-stage-line absolute h-full border-l"></span>
      <IconPointFilled className="message-stage-indicator z-10 flex shrink-0" />
      <div className="ml-2 w-full">
        <div
          className={classNames(
            'flex gap-2 items-center',
            stage?.content && 'mb-4',
          )}
        >
          {isCurrentStage && <Loader />}
          <h3 className="message-stage-name">{stage?.name}</h3>
        </div>
        <div className="prose max-w-full break-words">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              strong: (props) => (
                <strong className="text-neutrals-1000" {...props} />
              ),
              a: ({ href, children, ...props }) => (
                <a href={href} target="_blank" rel="noreferrer" {...props}>
                  {children}
                </a>
              ),
              h1: ({ children, ...props }) => (
                <h1 className="h1 text-neutrals-1000" {...props}>
                  {children}
                </h1>
              ),
              h2: ({ children, ...props }) => (
                <h2 className="h2 text-neutrals-1000" {...props}>
                  {children}
                </h2>
              ),
              h3: ({ children, ...props }) => (
                <h3 className="h3 text-neutrals-1000" {...props}>
                  {children}
                </h3>
              ),
              h4: ({ children, ...props }) => (
                <h4 className="h4 text-neutrals-1000" {...props}>
                  {children}
                </h4>
              ),
              h5: ({ children, ...props }) => (
                <h5 className="h5 text-neutrals-1000" {...props}>
                  {children}
                </h5>
              ),
              code: (props) => (
                <code className="text-neutrals-900" {...props} />
              ),
              pre: (props) => (
                <pre
                  className="border-neutrals-600 bg-neutrals-100 border"
                  {...props}
                />
              ),
            }}
          >
            {stage?.content}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
};

export default MessageStage;
