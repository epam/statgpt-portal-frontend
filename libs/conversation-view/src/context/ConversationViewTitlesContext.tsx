'use client';
import React, { createContext, ReactNode, useContext } from 'react';
import { ConversationViewTitles } from '../models/titles';

const ConversationViewTitlesContext = createContext<
  ConversationViewTitles | undefined
>(undefined);

export function ConversationViewTitlesProvider({
  children,
  titles,
}: {
  children: ReactNode;
  titles?: ConversationViewTitles;
}) {
  return (
    <ConversationViewTitlesContext.Provider value={titles}>
      {children}
    </ConversationViewTitlesContext.Provider>
  );
}

export function useConversationViewTitles():
  | ConversationViewTitles
  | undefined {
  return useContext(ConversationViewTitlesContext);
}
