import { FC, Ref } from 'react';
import classNames from 'classnames';
import remarkGfm from 'remark-gfm';
import ReactMarkdown from 'react-markdown';
import { Stage } from '@epam/ai-dial-shared';
import { IconPointFilled } from '@tabler/icons-react';
import { Loader } from '@statgpt/ui-components/src/components/Loader/Loader';

interface Props {
  stage: Stage;
  stageRef: Ref<HTMLDivElement>;
  isCurrentStage?: boolean;
}

const MessageStage: FC<Props> = ({ stage, stageRef, isCurrentStage }) => {
  return (
    <div
      ref={stageRef}
      className="message-stage flex relative pb-8 last:pb-0 last:mb-8"
    >
      <span className="message-stage-line absolute border-l h-full"></span>
      <IconPointFilled className="message-stage-indicator flex shrink-0 z-10" />
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
                <a href={href} target="_blank" {...props}>
                  {children}
                </a>
              ),
              h1: (props) => (
                <h1 className="h1 text-neutrals-1000" {...props} />
              ),
              h2: (props) => (
                <h2 className="h2 text-neutrals-1000" {...props} />
              ),
              h3: (props) => (
                <h3 className="h3 text-neutrals-1000" {...props} />
              ),
              h4: (props) => (
                <h4 className="h4 text-neutrals-1000" {...props} />
              ),
              h5: (props) => (
                <h5 className="h5 text-neutrals-1000" {...props} />
              ),
              code: (props) => (
                <code className="text-neutrals-900" {...props} />
              ),
              pre: (props) => (
                <pre
                  className="bg-neutrals-100 border border-neutrals-600"
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
