'use client';

import { FC } from 'react';
import { ConversationListTitles } from '@statgpt/conversation-list/src/models/titles';

interface Props {
  titles?: ConversationListTitles;
}

const NoConversations: FC<Props> = ({ titles }) => {
  return (
    <div className="p-8 text-center flex flex-col">
      <p className="text-neutrals-800">
        {titles?.noConversation ?? 'No conversations yet'}
      </p>
      <p className="text-sm text-neutrals-800 mt-2">
        {titles?.clickNewChat ?? 'Click "New Chat" to start a conversation'}
      </p>
    </div>
  );
};

export default NoConversations;
