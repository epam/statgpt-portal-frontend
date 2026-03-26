import { FC } from 'react';
import { IconPlus } from '@tabler/icons-react';
import { ConversationViewTitles } from '../../models/titles';

interface Props {
  titles?: ConversationViewTitles;
  openNewConversation?: () => void;
}

export const ChatOnboardingFooter: FC<Props> = ({
  titles,
  openNewConversation,
}) => {
  return (
    <div className="body-3 bg-accent-300 p-2 text-center">
      <span className="mr-2 text-neutrals-900">{titles?.onboardingFooter}</span>
      <span
        onClick={openNewConversation}
        className="inline-flex cursor-pointer align-top"
      >
        <IconPlus width={15} height={15} />
        <p className="ml-1">{titles?.onboardingFooterLink}</p>
      </span>
    </div>
  );
};
