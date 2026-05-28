import {
  FloatingFocusManager,
  FloatingOverlay,
  FloatingPortal,
  useDismiss,
  useFloating,
  useInteractions,
  useRole,
} from '@floating-ui/react';
import classNames from 'classnames';
import {
  FC,
  FormHTMLAttributes,
  MouseEvent,
  ReactNode,
  useCallback,
} from 'react';
import { PopUpSize, PopUpState } from '../../types/pop-up';
import { CloseButton } from '../CloseButton/CloseButton';

interface Props extends FormHTMLAttributes<HTMLFormElement> {
  heading?: string | ReactNode;
  portalId: string;
  overlayClassName?: string;
  containerClassName?: string;
  state?: PopUpState | boolean;
  size?: PopUpSize;
  children: ReactNode[];
  dividers?: boolean;
  onClose: () => void;
  dataTestId?: string;
  closeButtonTitle?: string;
}

const PopupView: FC<Props> = ({
  portalId,
  state = PopUpState.Opened,
  heading,
  size,
  onClose,
  children,
  overlayClassName,
  containerClassName,
  dividers = true,
  closeButtonTitle,
}) => {
  const { refs, context } = useFloating({
    open: state !== PopUpState.Closed && !!state,
    onOpenChange: onClose,
  });

  const role = useRole(context, { role: 'dialog' });
  const dismiss = useDismiss(context, { outsidePress: true });
  const { getFloatingProps } = useInteractions([role, dismiss]);

  const handleClose = useCallback(
    (e?: MouseEvent<HTMLButtonElement>) => {
      e?.preventDefault();
      e?.stopPropagation();

      onClose();
    },
    [onClose],
  );

  return (
    <FloatingPortal id={portalId}>
      {state !== PopUpState.Closed && (
        <FloatingOverlay
          className={classNames(
            'z-modal flex items-center justify-center bg-blackout p-4',
            overlayClassName,
          )}
        >
          <FloatingFocusManager context={context}>
            <div
              className={classNames(
                'relative max-h-full modal rounded bg-white flex flex-col shadow w-full',
                size === PopUpSize.LG && 'max-w-[65%]',
                size === PopUpSize.SM && 'max-w-[30%]',
                dividers && 'divide-neutrals-400 divide-y',
                containerClassName,
                'sm:w-full sm:max-w-full sm:px-4 sm:py-6',
              )}
              ref={refs.setFloating}
              {...getFloatingProps({
                onClick(event) {
                  event.stopPropagation();
                },
              })}
            >
              {
                <div className="modal-heading flex flex-row items-center justify-between px-6 py-5 sm:p-0 sm:pb-2">
                  {heading &&
                    (typeof heading === 'string' ? (
                      <h2 className="modal-heading-title sm:h3 mr-3 min-w-0 flex-1">
                        {heading}
                      </h2>
                    ) : (
                      heading
                    ))}
                  <CloseButton
                    title={closeButtonTitle}
                    onClick={handleClose}
                    btnClassNames={'sm:h-[24px] sm:w-[24px] sm:top-4'}
                  />
                </div>
              }
              {children.map((child) => child)}
            </div>
          </FloatingFocusManager>
        </FloatingOverlay>
      )}
    </FloatingPortal>
  );
};

export const Popup: FC<Props> = (props: Props) => {
  if (props.state === PopUpState.Closed) {
    return null;
  }

  return <PopupView {...props} />;
};
