import { renderHook, waitFor } from '@testing-library/react';

import { OnboardingElements } from '../../../../constants/onboarding-elements';
import { ConversationViewActions } from '../../../../models/actions';
import { useOnboardingSync } from '../use-onboarding-sync';

const mockAdvancedViewState = {
  isOpenedAdvancedView: false,
};
const mockOnboardingState: {
  onboardingFileName: string;
  onboardingFilePath: string;
  onboardingFileSchema?: any;
  setOnboardingFileSchema?: jest.Mock;
} = {
  onboardingFileName: '',
  onboardingFilePath: '',
  onboardingFileSchema: undefined,
  setOnboardingFileSchema: jest.fn(),
};

jest.mock('../../../../context/AdvancedViewContext', () => ({
  useAdvancedView: () => mockAdvancedViewState,
}));

jest.mock('../../../../context/OnboardingContext', () => ({
  useOnboarding: () => mockOnboardingState,
}));

jest.mock('../../../../utils/get-tooltip-data.by-element', () => ({
  getOnboardingInfoForAdvancedView: jest.fn((schema) => ({
    ...schema,
    lastDisplayedElement: 'advancedViewNextStep',
  })),
}));

describe('useOnboardingSync', () => {
  const putOnboardingFile = jest.fn();
  const actions = {
    putOnboardingFile,
  } as unknown as ConversationViewActions;

  beforeEach(() => {
    jest.clearAllMocks();
    mockAdvancedViewState.isOpenedAdvancedView = false;
    mockOnboardingState.onboardingFileName = 'onboarding.json';
    mockOnboardingState.onboardingFilePath = 'files/onboarding.json';
    mockOnboardingState.onboardingFileSchema = undefined;
    mockOnboardingState.setOnboardingFileSchema = jest.fn();
  });

  it('uploads onboarding file data when a schema is available', async () => {
    mockOnboardingState.onboardingFileSchema = { steps: [] };

    renderHook(() => useOnboardingSync({ actions }));

    await waitFor(() =>
      expect(putOnboardingFile).toHaveBeenCalledWith(
        'onboarding.json',
        'files/onboarding.json',
        { steps: [] },
      ),
    );
  });

  it('skips the open-advanced-view onboarding step when advanced view is already open', async () => {
    mockAdvancedViewState.isOpenedAdvancedView = true;
    mockOnboardingState.onboardingFileSchema = {
      lastDisplayedElement: OnboardingElements.OPEN_ADVANCED_VIEW,
    };

    renderHook(() => useOnboardingSync({ actions }));

    await waitFor(() =>
      expect(mockOnboardingState.setOnboardingFileSchema).toHaveBeenCalledWith({
        lastDisplayedElement: 'advancedViewNextStep',
      }),
    );
  });

  it('does not upload anything until onboarding schema exists', () => {
    renderHook(() => useOnboardingSync({ actions }));

    expect(putOnboardingFile).not.toHaveBeenCalled();
  });
});
