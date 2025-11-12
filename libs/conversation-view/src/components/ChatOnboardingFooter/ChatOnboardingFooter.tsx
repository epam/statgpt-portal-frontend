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
    <div className="text-center bg-accent-300 body-3 p-2">
      <span className="mr-2 text-neutrals-900">{titles?.onboardingFooter}</span>
      <span
        onClick={openNewConversation}
        className="cursor-pointer inline-flex align-top"
      >
        <IconPlus width={15} height={15} />
        <p className="ml-1">{titles?.onboardingFooterLink}</p>
      </span>
    </div>
  );
};
