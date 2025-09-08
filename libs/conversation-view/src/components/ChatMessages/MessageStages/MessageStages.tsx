import { FC, ReactNode, useEffect, useRef, useState } from 'react';
import classNames from 'classnames';
import { Stage } from '@epam/ai-dial-shared';
import { StageStatus } from '@statgpt/conversation-view/src/constants/message-stages';
import MessageStage from '@statgpt/conversation-view/src/components/ChatMessages/MessageStages/MessageStage';

interface Props {
  stages?: Stage[];
  expandIcon?: ReactNode;
  processingTitle?: string;
}

const MessageStages: FC<Props> = ({ stages, expandIcon, processingTitle }) => {
  const [isExpanded, setIsExpanded] = useState<boolean>();
  const [currentStage, setCurrentStage] = useState<Stage>();
  const stagesContainerRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setCurrentStage(
      stages
        ?.filter((stage) => stage?.status !== StageStatus.COMPLETED)
        ?.at(-1),
    );
  }, [stages]);

  useEffect(() => {
    if (isExpanded) {
      stageRef?.current?.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth',
      });
    }
  }, [isExpanded]);

  useEffect(() => {
    const container = stagesContainerRef.current;
    let previousTopPosition: number;

    if (!container) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const currentTopPosition = entry?.boundingClientRect?.top;

        if (previousTopPosition) {
          if (
            !entry?.isIntersecting &&
            currentTopPosition < previousTopPosition
          ) {
            setIsExpanded(false);
          }
        }

        previousTopPosition = currentTopPosition;
      },
      { threshold: 0 },
    );

    observer.observe(container);

    return () => observer.disconnect();
  }, []);

  const toggleStagesExpand = () => {
    setIsExpanded((prev) => !prev);
  };

  return (
    <div className="message-stages" ref={stagesContainerRef}>
      <div
        className={classNames(
          'message-stages-header inline-flex max-w-full items-center cursor-pointer',
          !currentStage?.name && 'default-header',
        )}
        onClick={toggleStagesExpand}
      >
        <p className="message-stages-title truncate">
          {currentStage?.name || processingTitle || 'Processing...'}
        </p>
        <i
          className={classNames(
            'message-stages-expand-icon',
            isExpanded && 'rotated',
          )}
        >
          {expandIcon}
        </i>
      </div>
      {isExpanded && stages && (
        <div className="flex flex-col">
          {stages?.map((stage) => (
            <MessageStage
              key={stage.index}
              stage={stage}
              stageRef={currentStage ? stageRef : null}
              isCurrentStage={stage?.index === currentStage?.index}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default MessageStages;
