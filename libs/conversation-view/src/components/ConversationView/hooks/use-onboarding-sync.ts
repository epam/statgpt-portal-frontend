'use client';

import { useEffect } from 'react';

import { OnboardingElements } from '../../../constants/onboarding-elements';
import { useAdvancedView } from '../../../context/AdvancedViewContext';
import { useOnboarding } from '../../../context/OnboardingContext';
import { ConversationViewActions } from '../../../models/actions';
import { getOnboardingInfoForAdvancedView } from '../../../utils/get-tooltip-data.by-element';

export interface UseOnboardingSyncArgs {
  actions: ConversationViewActions;
}

/**
 * Onboarding side-effects: uploading the onboarding file once its schema is
 * available, and advancing past the "open advanced view" tooltip step when the
 * advanced view is already open (so the user isn't prompted to open something
 * they've already opened).
 */
export const useOnboardingSync = ({ actions }: UseOnboardingSyncArgs) => {
  const { isOpenedAdvancedView } = useAdvancedView();
  const {
    onboardingFileSchema,
    onboardingFilePath,
    onboardingFileName,
    setOnboardingFileSchema,
  } = useOnboarding();

  useEffect(() => {
    if (onboardingFileSchema) {
      actions.putOnboardingFile?.(
        onboardingFileName,
        onboardingFilePath,
        onboardingFileSchema,
      );
    }
  }, [actions, onboardingFileSchema, onboardingFileName, onboardingFilePath]);

  useEffect(() => {
    // if user open advanced view (while attachment is loading) -> skip tooltip for opening
    if (
      isOpenedAdvancedView &&
      onboardingFileSchema?.lastDisplayedElement ===
        OnboardingElements.OPEN_ADVANCED_VIEW
    ) {
      setOnboardingFileSchema?.(
        getOnboardingInfoForAdvancedView(onboardingFileSchema),
      );
    }
  }, [
    actions,
    isOpenedAdvancedView,
    setOnboardingFileSchema,
    onboardingFileSchema,
  ]);
};
