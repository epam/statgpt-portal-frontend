'use client';

import { FC } from 'react';
import { ConversationListTitles } from '../../models/titles';

interface Props {
  titles?: ConversationListTitles;
}

const NoConversations: FC<Props> = ({ titles }) => {
  return (
    <div className="flex flex-col p-8 text-center">
      <p className="text-neutrals-800">
        {titles?.noConversation ?? 'No conversations yet'}
      </p>
      <p className="mt-2 text-sm text-neutrals-800">
        {titles?.clickNewChat ?? 'Click "New Chat" to start a conversation'}
      </p>
    </div>
  );
};

export default NoConversations;
