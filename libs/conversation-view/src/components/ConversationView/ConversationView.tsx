/**
 * ConversationView - Interactive chat conversation component
 *
 * A comprehensive React component for displaying and managing chat conversations.
 * Features include real-time message streaming, conversation persistence,
 * customizable UI rendering through render props, and full conversation
 * lifecycle management (loading, sending, error handling).
 */

'use client';

import { Loader } from '@epam/statgpt-ui-components';
import { FC } from 'react';

import { ConversationViewLayout } from './ConversationViewLayout';
import { useConversationView } from './hooks/use-conversation-view';
import { ConversationViewProps } from './types';

export const ConversationView: FC<ConversationViewProps> = (props) => {
  const viewModel = useConversationView(props);

  if (viewModel.isLoading) {
    return <Loader />;
  }

  return <ConversationViewLayout {...props} {...viewModel} />;
};
