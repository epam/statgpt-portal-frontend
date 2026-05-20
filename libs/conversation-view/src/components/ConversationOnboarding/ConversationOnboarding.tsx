import { FC } from 'react';
import { Conversation, FormSchemaButtonOption } from '@epam/ai-dial-shared';
import ConversationViewHeader from '../ConversationViewHeader/ConversationViewHeader';
import MessageContent from '../ChatMessages/MessageContent';
import { ChoiceButtons } from './ChoiceButtons/ChoiceButtons';
import { Button } from '@epam/statgpt-ui-components';
import { useConversationViewStyles } from '../../context/ConversationViewStylesContext';

interface Props {
  messageContent: string;
  choiceButtons: FormSchemaButtonOption[];
  disabled?: boolean;
  onClick: (message?: string, choiceId?: string) => void;
  handleOnboardingSkip?: (isSkippedOnboarding?: boolean) => void;
}

export const ConversationOnboarding: FC<Props> = ({
  messageContent,
  choiceButtons,
  disabled,
  onClick,
  handleOnboardingSkip,
}) => {
  const { titles } = useConversationViewStyles();
  return (
    <div className="onboarding flex size-full flex-1 flex-col overflow-auto">
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
          <ChoiceButtons
            choiceButtons={choiceButtons}
            disabled={disabled}
            onClick={onClick}
          />
        </div>
        <div className="mt-8 flex">
          <Button
            title={titles?.skipOnboardingNow}
            buttonClassName="text-button-secondary mr-4"
            disabled={disabled}
            onClick={() => handleOnboardingSkip?.()}
            isSmallButton={true}
          />
          <Button
            title={titles?.refuseOnboarding}
            buttonClassName="text-button-tertiary"
            disabled={disabled}
            onClick={() => handleOnboardingSkip?.(true)}
            isSmallButton={true}
          />
        </div>
      </div>
    </div>
  );
};
