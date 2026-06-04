/* eslint-disable @nx/enforce-module-boundaries */
'use client';

import { useAdvancedView } from '../../context/AdvancedViewContext';
import { FC, useEffect, useRef, useState } from 'react';
import classNames from 'classnames';
import ShareConversation from '@statgpt/share-conversation/src/components/ShareConversation/ShareConversation';
import { CloseButton } from '@epam/statgpt-ui-components';
import { ShareConversationProps } from '@statgpt/share-conversation/src/models/share-conversation';
import { useConversationViewStyles } from '../../context/ConversationViewStylesContext';
import { ConversationInfo } from '@epam/ai-dial-shared';
import { getTooltipDataByElement } from '../../utils/get-tooltip-data.by-element';
import { Tooltip } from '../Tooltip/Tooltip';
import { OnboardingElements } from '../../constants/onboarding-elements';
import { useOnboarding } from '../../context/OnboardingContext';

interface Props {
  isShowShare?: boolean;
  locale?: string;
  shareConversationProps?: ShareConversationProps;
  conversation?: ConversationInfo | null;
}

const Header: FC<Props> = ({
  locale,
  isShowShare,
  shareConversationProps,
  conversation,
}) => {
  const { titles } = useConversationViewStyles();
  const { setIsOpenedAdvancedView } = useAdvancedView();

  const iconRef = useRef<HTMLDivElement | null>(null);
  const [tooltipTitle, setTooltipTitle] = useState<string>('');
  const [tooltipDescription, setTooltipDescription] = useState<string>('');
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);
  const { onboardingFileSchema, isShowOnboarding } = useOnboarding();

  useEffect(() => {
    if (isShowOnboarding) {
      const { title, description } = getTooltipDataByElement(
        OnboardingElements.EXIT_ADVANCED_VIEW,
        titles,
      );
      setTooltipTitle(title);
      setTooltipDescription(description);
    }
  }, [titles, isShowOnboarding]);

  useEffect(() => {
    if (isShowOnboarding) {
      setIsTooltipVisible(
        onboardingFileSchema?.lastDisplayedElement ===
          OnboardingElements.EXIT_ADVANCED_VIEW,
      );
    }
  }, [onboardingFileSchema?.lastDisplayedElement, isShowOnboarding]);

  return (
    <header
      className={classNames(
        'bg-white px-6 py-4 flex justify-between items-center sm:px-0',
        'advanced-view-header',
      )}
    >
      <div
        className={classNames(
          'flex gap-3 items-center',
          !isShowShare && 'justify-between w-full',
          'advanced-view-header-title',
        )}
      >
        <div
          ref={iconRef}
          className={classNames(!isShowShare && 'order-2', 'flex')}
        >
          <CloseButton
            btnClassNames="button-close"
            onClick={() => setIsOpenedAdvancedView(false)}
            title={titles?.close || 'Close'}
          />
        </div>
        {isTooltipVisible && (
          <Tooltip
            reference={iconRef}
            title={tooltipTitle}
            description={tooltipDescription}
            onReferenceClick={() => setIsOpenedAdvancedView(false)}
            shouldMoveToNextStep
          />
        )}
        <h2>{titles?.advanceViewTitle ?? 'Advanced view'}</h2>
      </div>
      {isShowShare && (
        <ShareConversation
          locale={locale}
          conversation={conversation}
          {...shareConversationProps}
        />
      )}
    </header>
  );
};

export default Header;
