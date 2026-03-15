import { FC } from 'react';
import { Conversation, FormSchemaButtonOption } from '@epam/ai-dial-shared';
import ConversationViewHeader from '../ConversationViewHeader/ConversationViewHeader';
import MessageContent from '../ChatMessages/MessageContent';
import { ChoiceButtons } from './ChoiceButtons/ChoiceButtons';
import { Button } from '@epam/statgpt-ui-components';
import { useConversationViewTitles } from '../../context/ConversationViewTitlesContext';

interface Props {
  messageContent: string;
  choiceButtons: FormSchemaButtonOption[];
  onClick: (message?: string, choiceId?: string) => void;
  handleOnboardingSkip?: (isSkippedOnboarding?: boolean) => void;
}

export const ConversationOnboarding: FC<Props> = ({
  messageContent,
  choiceButtons,
  onClick,
  handleOnboardingSkip,
}) => {
  const titles = useConversationViewTitles();
  return (
    <div className="onboarding w-full h-full flex flex-col flex-1 overflow-auto">
      <ConversationViewHeader
        conversation={
          {
            name: titles?.onboardingTitle ?? 'Introducing the AI assistant',
          } as Conversation
        }
      />
      <div className="onboarding-content flex flex-col">
        <MessageContent content={messageContent} />
        <div className="mt-4">
          <ChoiceButtons choiceButtons={choiceButtons} onClick={onClick} />
        </div>
        <div className="flex mt-8">
          <Button
            title={titles?.skipOnboardingNow}
            buttonClassName="text-button-secondary mr-4"
            onClick={() => handleOnboardingSkip?.()}
            isSmallButton={true}
          />
          <Button
            title={titles?.refuseOnboarding}
            buttonClassName="text-button-tertiary"
            onClick={() => handleOnboardingSkip?.(true)}
            isSmallButton={true}
          />
        </div>
      </div>
    </div>
  );
};
