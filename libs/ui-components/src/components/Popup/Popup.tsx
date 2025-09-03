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
import { PopUpSize, PopUpState } from '@statgpt/ui-components/src/types/pop-up';
import CloseButton from '@statgpt/ui-components/src/components/CloseButton/CloseButton';

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
            'z-[52] flex items-center justify-center bg-blackout p-4',
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
              {...getFloatingProps()}
            >
              {
                <div className="flex flex-row justify-between py-3 px-6 items-center mb-2 modal-heading sm:p-0 sm:pb-2">
                  {heading &&
                    (typeof heading === 'string' ? (
                      <h2 className="flex-1 min-w-0 mr-3 modal-heading-title sm:h3">
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

const Popup: FC<Props> = (props: Props) => {
  if (props.state === PopUpState.Closed) {
    return null;
  }

  return <PopupView {...props} />;
};

export default Popup;
