import { OnboardingFileSchema } from '@epam/statgpt-shared-toolkit';
import { CloseButton } from '@epam/statgpt-ui-components';
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
import { useOnboarding } from '../../context/OnboardingContext';
import { getNextTooltipElement } from '../../utils/get-tooltip-data.by-element';
import { OnboardingElements } from '../../constants/onboarding-elements';
import { TooltipOverlay } from './TooltipOverlay';

interface Props {
  reference?: RefObject<HTMLElement | HTMLDivElement | null>;
  title?: string;
  description?: string;
  onReferenceClick?: () => void;
  shouldCloseTooltip?: boolean;
  shouldMoveToNextStep?: boolean;
  supressReferenceClick?: boolean;
}

export const Tooltip: FC<Props> = ({
  reference,
  title,
  description,
  onReferenceClick,
  shouldCloseTooltip,
  shouldMoveToNextStep,
  supressReferenceClick,
}) => {
  const [open, setOpen] = useState<boolean>(true);
  const [isClosed, setIsClosed] = useState(false);
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
      offset({ mainAxis: 12, crossAxis: -4 }),
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

  const onClose = () => close();

  const targetPosition = reference?.current?.getBoundingClientRect();

  useEffect(() => {
    if (shouldCloseTooltip && !isClosed) {
      close();
      setIsClosed(true);
    }
  }, [shouldCloseTooltip, close, isClosed]);

  const onOverlayItemClick = () => {
    if (onReferenceClick) {
      onReferenceClick?.();

      if (shouldMoveToNextStep) {
        close();
      } else {
        setOpen(false);
      }
    } else if (!supressReferenceClick) {
      close();
      reference?.current?.click();
    }
  };

  return (
    <>
      {open && (
        <FloatingPortal>
          {targetPosition && (
            <TooltipOverlay
              overlayClasses={
                supressReferenceClick ? 'cursor-default' : 'cursor-pointer'
              }
              targetPosition={targetPosition}
              onClose={onOverlayItemClick}
            />
          )}
          <div
            ref={refs.setFloating}
            style={floatingStyles}
            {...getFloatingProps()}
            className="tooltip z-tooltip max-w-[350px]"
          >
            <div className="tooltip-header">
              <h3>{title}</h3>
              <CloseButton btnClassNames="w-4 h-4" onClick={onClose} />
            </div>
            <div className="tooltip-description">
              <p>{description}</p>
            </div>
            <div
              ref={arrowRef}
              className={classNames(
                'tooltip-arrow absolute w-3 h-3 rotate-45',
                placement?.includes('right') ? 'left-[-4px]' : 'right-[-6px]',
                placement?.includes('end')
                  ? 'bottom-2 tooltip-arrow-white'
                  : 'top-3',
              )}
            ></div>
          </div>
        </FloatingPortal>
      )}
    </>
  );
};
