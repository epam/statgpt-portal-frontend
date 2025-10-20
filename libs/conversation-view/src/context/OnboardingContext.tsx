'use client';

import {
  createContext,
  Dispatch,
  FC,
  ReactNode,
  SetStateAction,
  useContext,
  useState,
} from 'react';
import { OnboardingFileSchema } from '@statgpt/shared-toolkit/src/models/onboarding-schema';

interface OnboardingContextType {
  onboardingFileName: string;
  onboardingFilePath: string;
  isShowOnboarding?: boolean;
  onboardingFileSchema?: OnboardingFileSchema;
  setOnboardingFileName: (onboardingFileName: string) => void;
  setOnboardingFilePath: (onboardingFilePath: string) => void;
  setOnboardingFileSchema?: Dispatch<
    SetStateAction<OnboardingFileSchema | undefined>
  >;
  setIsShowOnboarding: (isShowOnboarding: boolean) => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(
  undefined,
);

export const OnboardingProvider: FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [onboardingFileName, setOnboardingFileName] = useState<string>('');
  const [onboardingFilePath, setOnboardingFilePath] = useState<string>('');
  const [isShowOnboarding, setIsShowOnboarding] = useState<boolean>();
  const [onboardingFileSchema, setOnboardingFileSchema] =
    useState<OnboardingFileSchema>();

  return (
    <OnboardingContext.Provider
      value={{
        onboardingFileName,
        onboardingFilePath,
        isShowOnboarding,
        onboardingFileSchema,
        setOnboardingFileName,
        setOnboardingFilePath,
        setIsShowOnboarding,
        setOnboardingFileSchema,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
};

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within a OnboardingProvider');
  }
  return context;
};
