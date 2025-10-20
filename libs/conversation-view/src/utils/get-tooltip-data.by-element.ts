import { ConversationViewTitles } from '../models/titles';
import { OnboardingFileSchema } from '@statgpt/shared-toolkit/src/models/onboarding-schema';
import {
  OnboardingAdvancedViewElements,
  OnboardingBasicViewElements,
  OnboardingChartsElements,
  OnboardingElements,
} from '../constants/onboarding-elements';

export const getTooltipDataByElement = (
  element: string,
  titles?: ConversationViewTitles,
): { title: string; description: string } => {
  return {
    title: titles?.[`${element}Title` as keyof ConversationViewTitles] || '',
    description:
      titles?.[`${element}Description` as keyof ConversationViewTitles] || '',
  };
};

const findElementInSchema = (
  elements: OnboardingElements[],
  schema: OnboardingFileSchema,
): string => {
  return elements.find((item) => !schema.infoElements?.[item]) || '';
};

export const getNextTooltipElement = (
  schema?: OnboardingFileSchema,
  current?: OnboardingElements,
): string => {
  if (!schema || !current) {
    return '';
  }
  if (OnboardingBasicViewElements.includes(current)) {
    const next = findElementInSchema(OnboardingBasicViewElements, schema);
    if (next) {
      return next;
    }
  }
  const next = findElementInSchema(OnboardingAdvancedViewElements, schema);
  if (next) {
    return next;
  }
  return '';
};

const getUpdatedOnboardingSchema = (
  elements: OnboardingElements[],
  onboardingFileSchema: OnboardingFileSchema,
) => {
  const nextElement = findElementInSchema(elements, onboardingFileSchema);
  return {
    ...onboardingFileSchema,
    infoElements: {
      ...onboardingFileSchema?.infoElements,
      [onboardingFileSchema.lastDisplayedElement]: false,
      ...(nextElement ? { [nextElement]: true } : {}),
    },
    lastDisplayedElement: nextElement,
  } as OnboardingFileSchema;
};

export const getOnboardingInfoForAdvancedView = (
  onboardingFileSchema: OnboardingFileSchema,
): OnboardingFileSchema => {
  return getUpdatedOnboardingSchema(
    OnboardingAdvancedViewElements,
    onboardingFileSchema,
  );
};

export const getOnboardingInfoForChartsView = (
  onboardingFileSchema: OnboardingFileSchema,
): OnboardingFileSchema => {
  return getUpdatedOnboardingSchema(
    OnboardingChartsElements,
    onboardingFileSchema,
  );
};

export const isShowChartsOnboarding = (
  onboardingFileSchema: OnboardingFileSchema,
): boolean => {
  return (
    (!onboardingFileSchema?.infoElements?.charts ||
      !onboardingFileSchema?.infoElements?.chartsNavigation) &&
    !OnboardingChartsElements.includes(
      onboardingFileSchema.lastDisplayedElement as OnboardingElements,
    )
  );
};
