'use client';

import { Attachment } from '@epam/ai-dial-shared';
import {
  createContext,
  FC,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';

interface CrossDatasetAttachmentsState {
  attachments?: Attachment[];
  dataQueriesKey?: string;
  activeDatasetUrns?: string[];
  isLoading?: boolean;
  signature?: string;
}

interface CrossDatasetAttachmentsContextType extends CrossDatasetAttachmentsState {
  setCrossDatasetAttachmentsState: (
    state?: Omit<CrossDatasetAttachmentsState, 'signature'>,
  ) => void;
}

const CrossDatasetAttachmentsContext = createContext<
  CrossDatasetAttachmentsContextType | undefined
>(undefined);
const DEFAULT_CONTEXT: CrossDatasetAttachmentsContextType = {
  setCrossDatasetAttachmentsState: () => undefined,
};

const getStateSignature = (
  state?: Omit<CrossDatasetAttachmentsState, 'signature'>,
) => {
  if (!state) {
    return '';
  }

  try {
    return JSON.stringify({
      dataQueriesKey: state.dataQueriesKey,
      activeDatasetUrns: state.activeDatasetUrns,
      isLoading: !!state.isLoading,
      attachments: state.attachments,
    });
  } catch {
    return JSON.stringify({
      dataQueriesKey: state.dataQueriesKey,
      activeDatasetUrns: state.activeDatasetUrns,
      isLoading: !!state.isLoading,
      attachmentsLength: state.attachments?.length ?? 0,
    });
  }
};

export const CrossDatasetAttachmentsProvider: FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [state, setState] = useState<CrossDatasetAttachmentsState>({});
  const setCrossDatasetAttachmentsState = useCallback(
    (nextState?: Omit<CrossDatasetAttachmentsState, 'signature'>) => {
      const signature = getStateSignature(nextState);

      setState((prevState) => {
        if (prevState.signature === signature) {
          return prevState;
        }

        return {
          ...nextState,
          isLoading: !!nextState?.isLoading,
          signature,
        };
      });
    },
    [],
  );
  const value = useMemo(
    () => ({
      ...state,
      setCrossDatasetAttachmentsState,
    }),
    [setCrossDatasetAttachmentsState, state],
  );

  return (
    <CrossDatasetAttachmentsContext.Provider value={value}>
      {children}
    </CrossDatasetAttachmentsContext.Provider>
  );
};

export const useCrossDatasetAttachments = () => {
  const context = useContext(CrossDatasetAttachmentsContext);

  if (context === undefined) {
    return DEFAULT_CONTEXT;
  }

  return context;
};
