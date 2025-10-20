import { FC, RefObject, useCallback, useEffect, useRef, useState } from 'react';
import classNames from 'classnames';
import {
  autoUpdate,
  arrow,
  flip,
  FloatingPortal,
  offset,
  shift,
  useClick,
  useFloating,
  useInteractions,
} from '@floating-ui/react';
import { CloseButton } from '@statgpt/ui-components/src/components/CloseButton/CloseButton';
import { useOnboarding } from '../../context/OnboardingContext';
import { OnboardingFileSchema } from '@statgpt/shared-toolkit/src/models/onboarding-schema';
import { getNextTooltipElement } from '../../utils/get-tooltip-data.by-element';
import { OnboardingElements } from '../../constants/onboarding-elements';

interface Props {
  reference?: RefObject<HTMLElement | HTMLDivElement | null>;
  title?: string;
  description?: string;
}

export const Tooltip: FC<Props> = ({ reference, title, description }) => {
  const [open, setOpen] = useState<boolean>(true);
  const arrowRef = useRef(null);
  const { isShowOnboarding, onboardingFileSchema, setOnboardingFileSchema } =
    useOnboarding();

  const { refs, floatingStyles, context, placement } = useFloating({
    open,
    onOpenChange: setOpen,
    placement: 'right-start',
    elements: {
      reference: reference?.current,
    },
    middleware: [
      offset({ mainAxis: 10, crossAxis: -5 }),
      flip(),
      shift(),
      arrow({ element: arrowRef }),
    ],
    whileElementsMounted: autoUpdate,
  });

  const click = useClick(context);
  const { getFloatingProps } = useInteractions([click]);

  const close = useCallback(() => {
    if (isShowOnboarding) {
      const nextElement = getNextTooltipElement(
        onboardingFileSchema,
        onboardingFileSchema?.lastDisplayedElement as OnboardingElements,
      );
      setOnboardingFileSchema?.({
        ...onboardingFileSchema,
        infoElements: {
          ...onboardingFileSchema?.infoElements,
          ...(nextElement ? { [nextElement]: true } : {}),
        },
        lastDisplayedElement: nextElement,
      } as OnboardingFileSchema);
    }
    setOpen?.(false);
  }, [isShowOnboarding, onboardingFileSchema, setOnboardingFileSchema]);

  useEffect(() => {
    refs.setReference(reference?.current ?? null);
  }, [reference, refs]);

  return (
    <>
      {open && (
        <FloatingPortal>
          <div className="fixed inset-0 z-40" />
          <div
            ref={refs.setFloating}
            style={floatingStyles}
            {...getFloatingProps()}
            className="tooltip z-50 max-w-[350px]"
          >
            <div className="tooltip-header">
              <h3>{title}</h3>
              <CloseButton btnClassNames="w-4 h-4" onClick={() => close()} />
            </div>
            <div className="tooltip-description">
              <p>{description}</p>
            </div>
            <div
              ref={arrowRef}
              className={classNames(
                'tooltip-arrow absolute w-3 h-3 rotate-45 top-3',
                placement?.includes('right') ? 'left-[-8px]' : 'right-[-8px]',
              )}
            ></div>
          </div>
        </FloatingPortal>
      )}
    </>
  );
};
