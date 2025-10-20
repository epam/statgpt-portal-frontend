import { FC, ReactNode, useState } from 'react';
import {
  useFloating,
  offset,
  flip,
  shift,
  useClick,
  useDismiss,
  autoUpdate,
  useInteractions,
} from '@floating-ui/react';
import classNames from 'classnames';
import { DropdownItem } from '../../models/dropdown-item';

interface Props {
  triggerButton: ReactNode;
  options?: DropdownItem[];
  content?: ReactNode;
  selectedOption?: string;
  disabled?: boolean;
  containerClassName?: string;
  openedClassName?: string;
  onOptionSelect?: (key: string) => void;
}

export const Dropdown: FC<Props> = ({
  triggerButton,
  options,
  content,
  selectedOption,
  disabled,
  containerClassName,
  openedClassName,
  onOptionSelect,
}) => {
  const [open, setOpen] = useState(false);
  const { refs, floatingStyles, context } = useFloating({
    open,
    onOpenChange: !disabled ? setOpen : void 0,
    placement: 'bottom-end',
    middleware: [offset(8), flip(), shift()],
    whileElementsMounted: autoUpdate,
  });

  const click = useClick(context);
  const dismiss = useDismiss(context, { outsidePress: true });
  const { getReferenceProps, getFloatingProps } = useInteractions([
    click,
    dismiss,
  ]);

  return (
    <>
      <div
        ref={refs.setReference}
        {...getReferenceProps({
          onClick(event) {
            event.stopPropagation();
          },
        })}
        className={classNames(containerClassName, open && openedClassName)}
      >
        {triggerButton}
      </div>
      {open && (
        <div
          ref={refs.setFloating}
          style={floatingStyles}
          className="flex flex-col z-10 dropdown-menu-shadow bg-white dropdown-container rounded"
          {...getFloatingProps()}
        >
          {content && content}
          {options &&
            options.map((option) => (
              <div
                key={option.key}
                onClick={(e) => {
                  e.stopPropagation();
                  onOptionSelect?.(option.key);
                  setOpen(false);
                }}
                className={classNames(
                  'text-neutrals-900 body-3 cursor-pointer dropdown-item min-w-[200px]',
                  selectedOption === option.key && 'bg-hues-100',
                )}
              >
                <div
                  className="p-2 hover:bg-hues-100 h-full dropdown-item-text flex items-center gap-x-2"
                  title={option.title}
                >
                  {option.icon ? option.icon : null}
                  <p>{option?.title}</p>
                </div>
              </div>
            ))}
        </div>
      )}
    </>
  );
};
