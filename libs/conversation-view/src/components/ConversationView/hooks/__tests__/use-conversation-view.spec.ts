import { renderHook } from '@testing-library/react';

import { useConversationView } from '../use-conversation-view';

jest.mock('@epam/ai-dial-shared', () => ({}));

jest.mock('@epam/statgpt-dial-toolkit', () => ({
  CUSTOM_VIEW_STATE_KEY: 'statgpt',
}));

const mockUseAgentAvailability = jest.fn();
jest.mock('@epam/statgpt-ui-components', () => ({
  useAgentAvailability: () => mockUseAgentAvailability(),
}));

const mockUseAdvancedView = jest.fn();
jest.mock('../../../../context/AdvancedViewContext', () => ({
  useAdvancedView: () => mockUseAdvancedView(),
}));

const mockUseChatMessages = jest.fn();
jest.mock('../../../../context/ChatMessagesContext', () => ({
  useChatMessages: () => mockUseChatMessages(),
}));

const mockUseConversationViewFeatureToggles = jest.fn();
jest.mock('../../../../context/ConversationViewFeatureTogglesContext', () => ({
  useConversationViewFeatureToggles: () =>
    mockUseConversationViewFeatureToggles(),
}));

const mockUseConversationViewMessages = jest.fn();
jest.mock('../../../../context/ConversationViewMessagesContext', () => ({
  useConversationViewMessages: () => mockUseConversationViewMessages(),
}));

const mockUseCrossDatasetAttachments = jest.fn();
jest.mock('../../../../context/CrossDatasetAttachmentsContext', () => ({
  useCrossDatasetAttachments: () => mockUseCrossDatasetAttachments(),
}));

const mockUseOnboarding = jest.fn();
jest.mock('../../../../context/OnboardingContext', () => ({
  useOnboarding: () => mockUseOnboarding(),
}));

const mockSaveConversation = jest.fn();
const mockUseConversationSaver = jest.fn(
  (_args: unknown) => mockSaveConversation,
);
jest.mock('../use-conversation-saver', () => ({
  useConversationSaver: (args: unknown) => mockUseConversationSaver(args),
}));

const mockMessageMutations = {
  addUserMessageToConversation: jest.fn(),
  initializeAssistantMessage: jest.fn(),
  updateAssistantMessage: jest.fn(),
};
const mockUseMessageMutations = jest.fn(
  (_args: unknown) => mockMessageMutations,
);
jest.mock('../use-message-mutations', () => ({
  useMessageMutations: (args: unknown) => mockUseMessageMutations(args),
}));

const mockStreamingViewModel = {
  sendMessageToConversation: jest.fn(),
  regenerateMessage: jest.fn(),
  editMessage: jest.fn(),
  onStopStreaming: jest.fn(),
  isLastMessageFailed: true,
  regenerateLastMessage: jest.fn(),
};
const mockUseConversationStreaming = jest.fn(
  (_args: unknown) => mockStreamingViewModel,
);
jest.mock('../use-conversation-streaming', () => ({
  useConversationStreaming: (args: unknown) =>
    mockUseConversationStreaming(args),
}));

const mockFeedbackViewModel = {
  rateResponse: jest.fn(),
  handleCodeAttachmentUpdated: jest.fn(),
};
const mockUseMessageFeedback = jest.fn(
  (_args: unknown) => mockFeedbackViewModel,
);
jest.mock('../use-message-feedback', () => ({
  useMessageFeedback: (args: unknown) => mockUseMessageFeedback(args),
}));

const mockLifecycleViewModel = {
  duplicateConversation: jest.fn(),
  handleOpeningOfNewConversation: jest.fn(),
};
const mockUseConversationLifecycle = jest.fn(
  (_args: unknown) => mockLifecycleViewModel,
);
jest.mock('../use-conversation-lifecycle', () => ({
  useConversationLifecycle: (args: unknown) =>
    mockUseConversationLifecycle(args),
}));

const mockLoaderViewModel = {
  isLoading: false,
  isReadonlyConversation: true,
};
const mockUseConversationLoader = jest.fn(
  (_args: unknown) => mockLoaderViewModel,
);
jest.mock('../use-conversation-loader', () => ({
  useConversationLoader: (args: unknown) => mockUseConversationLoader(args),
}));

const mockUseOnboardingSync = jest.fn((_args: unknown) => undefined);
jest.mock('../use-onboarding-sync', () => ({
  useOnboardingSync: (args: unknown) => mockUseOnboardingSync(args),
}));

describe('useConversationView', () => {
  const setIsStreaming = jest.fn();
  const setConversation = jest.fn();
  const setConversations = jest.fn();
  const openUrl = jest.fn();
  const setCrossDatasetAttachmentsState = jest.fn();
  const handleInvalidStreaming = jest.fn();
  const onConversationNotFound = jest.fn();
  const statusMessages = {
    serverError: 'Server error',
  };

  const actions = {
    getFile: jest.fn(),
    putOnboardingFile: jest.fn(),
    getDataSet: jest.fn(),
    getDataSetData: jest.fn(),
    getConstraints: jest.fn(),
    updateCurrentDataQuery: jest.fn(),
    updateDataQueries: jest.fn(),
    updateDatasets: jest.fn(),
    downloadDataSet: jest.fn(),
  };

  const props = {
    conversationKey: 'conversation-key',
    conversation: {
      id: 'conversation-id',
      customViewState: {
        statgpt: {
          activeTab: 'chart',
        },
      },
    },
    actions,
    locale: 'en',
    conversationsRoute: '/conversations',
    token: 'token',
    handleInvalidStreaming,
    onConversationNotFound,
    setConversation,
    setConversations,
    openUrl,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseChatMessages.mockReturnValue({
      isStreaming: false,
      setIsStreaming,
    });
    mockUseAdvancedView.mockReturnValue({
      isOpenedAdvancedView: true,
    });
    mockUseCrossDatasetAttachments.mockReturnValue({
      setCrossDatasetAttachmentsState,
    });
    mockUseConversationViewFeatureToggles.mockReturnValue({
      isCrossDatasetModeOn: true,
    });
    mockUseAgentAvailability.mockReturnValue({
      isAgentAvailable: false,
    });
    mockUseConversationViewMessages.mockReturnValue({
      statusMessages,
    });
    mockUseOnboarding.mockReturnValue({
      isShowOnboarding: true,
    });
  });

  it('returns the composed conversation view model', () => {
    const { result } = renderHook(() => useConversationView(props as any));

    expect(result.current).toMatchObject({
      isLoading: false,
      isReadonlyConversation: true,
      isStreaming: false,
      isOpenedAdvancedView: true,
      isShowOnboarding: true,
      isAgentAvailable: false,
      statusMessages,
      conversationViewState: {
        activeTab: 'chart',
      },
      sendMessageToConversation:
        mockStreamingViewModel.sendMessageToConversation,
      regenerateMessage: mockStreamingViewModel.regenerateMessage,
      editMessage: mockStreamingViewModel.editMessage,
      onStopStreaming: mockStreamingViewModel.onStopStreaming,
      isLastMessageFailed: true,
      regenerateLastMessage: mockStreamingViewModel.regenerateLastMessage,
      rateResponse: mockFeedbackViewModel.rateResponse,
      handleCodeAttachmentUpdated:
        mockFeedbackViewModel.handleCodeAttachmentUpdated,
      duplicateConversation: mockLifecycleViewModel.duplicateConversation,
      handleOpeningOfNewConversation:
        mockLifecycleViewModel.handleOpeningOfNewConversation,
    });
    expect(result.current.messageServerActions).toEqual({
      getFile: actions.getFile,
      putOnboardingFile: actions.putOnboardingFile,
      getDataSet: actions.getDataSet,
      getDataSetData: actions.getDataSetData,
      getConstraints: actions.getConstraints,
      updateCurrentDataQuery: actions.updateCurrentDataQuery,
      updateDataQueries: actions.updateDataQueries,
      updateDatasets: actions.updateDatasets,
      downloadDataSet: actions.downloadDataSet,
    });
  });

  it('wires the focused hooks with the dependencies they need', () => {
    renderHook(() => useConversationView(props as any));

    expect(mockUseOnboardingSync).toHaveBeenCalledWith({ actions });
    expect(mockUseConversationSaver).toHaveBeenCalledWith({
      actions,
      conversationKey: 'conversation-key',
    });
    expect(mockUseMessageMutations).toHaveBeenCalledWith({
      setConversation,
    });
    expect(mockUseConversationStreaming).toHaveBeenCalledWith(
      expect.objectContaining({
        conversation: props.conversation,
        setConversation,
        saveConversation: mockSaveConversation,
        updateAssistantMessage: mockMessageMutations.updateAssistantMessage,
        addUserMessageToConversation:
          mockMessageMutations.addUserMessageToConversation,
        initializeAssistantMessage:
          mockMessageMutations.initializeAssistantMessage,
        isStreaming: false,
        setIsStreaming,
        statusMessages,
        isCrossDatasetModeOn: true,
        token: 'token',
        handleInvalidStreaming,
      }),
    );
    expect(mockUseMessageFeedback).toHaveBeenCalledWith({
      actions,
      conversation: props.conversation,
      setConversation,
      saveConversation: mockSaveConversation,
    });
    expect(mockUseConversationLifecycle).toHaveBeenCalledWith({
      actions,
      conversation: props.conversation,
      locale: 'en',
      conversationsRoute: '/conversations',
      openUrl,
      setConversations,
    });
    expect(mockUseConversationLoader).toHaveBeenCalledWith({
      conversationKey: 'conversation-key',
      actions,
      setConversation,
      setCrossDatasetAttachmentsState,
      sendMessageToConversation:
        mockStreamingViewModel.sendMessageToConversation,
      onConversationNotFound,
    });
  });
});
