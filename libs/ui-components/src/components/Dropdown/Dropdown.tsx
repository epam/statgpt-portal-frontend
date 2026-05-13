import { FC, ReactNode, useEffect, useId, useState } from 'react';
import {
  useFloating,
  offset,
  flip,
  shift,
  size,
  useClick,
  useDismiss,
  autoUpdate,
  useInteractions,
  FloatingPortal,
} from '@floating-ui/react';
import type { Middleware } from '@floating-ui/react';
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

const dropdownOpenEventName = 'statgpt-dropdown-open';
const dropdownViewportPadding = 8;

const keepDropdownWithinViewport: Middleware = {
  name: 'keepDropdownWithinViewport',
  fn({ y, rects }) {
    if (typeof window === 'undefined') {
      return {};
    }

    const viewportHeight =
      document.documentElement.clientHeight || window.innerHeight;
    const visibleDropdownHeight = Math.min(
      rects.floating.height,
      Math.max(0, viewportHeight - dropdownViewportPadding * 2),
    );
    const minY = dropdownViewportPadding;
    const maxY =
      viewportHeight - visibleDropdownHeight - dropdownViewportPadding;

    return {
      y: Math.min(Math.max(y, minY), Math.max(minY, maxY)),
    };
  },
};

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
  const dropdownId = useId();
  const [open, setOpen] = useState(false);
  const { refs, floatingStyles, context } = useFloating({
    open,
    onOpenChange: !disabled ? setOpen : void 0,
    placement: 'bottom-end',
    strategy: 'fixed',
    middleware: [
      offset(dropdownViewportPadding),
      flip({ padding: dropdownViewportPadding }),
      size({
        padding: dropdownViewportPadding,
        apply({ availableHeight, elements }) {
          elements.floating.style.maxHeight = `${Math.max(
            0,
            availableHeight,
          )}px`;
        },
      }),
      shift({ padding: dropdownViewportPadding }),
      keepDropdownWithinViewport,
    ],
    whileElementsMounted: autoUpdate,
  });

  const click = useClick(context);
  const dismiss = useDismiss(context, { outsidePress: true });
  const { getReferenceProps, getFloatingProps } = useInteractions([
    click,
    dismiss,
  ]);

  useEffect(() => {
    if (!open) {
      return;
    }

    window.dispatchEvent(
      new CustomEvent(dropdownOpenEventName, { detail: dropdownId }),
    );
  }, [dropdownId, open]);

  useEffect(() => {
    const closeDropdown = (event: Event) => {
      if (event instanceof CustomEvent && event.detail !== dropdownId) {
        setOpen(false);
      }
    };

    window.addEventListener(dropdownOpenEventName, closeDropdown);

    return () => {
      window.removeEventListener(dropdownOpenEventName, closeDropdown);
    };
  }, [dropdownId]);

  useEffect(() => {
    if (disabled) {
      setOpen(false);
    }
  }, [disabled]);

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
        <FloatingPortal>
          <div
            ref={refs.setFloating}
            style={{ ...floatingStyles, overflowY: 'auto' }}
            className="dropdown-menu-shadow dropdown-container z-dropdown flex flex-col rounded bg-white"
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
                    className="dropdown-item-text flex h-full items-center gap-x-2 p-2 hover:bg-hues-100"
                    title={option.title}
                  >
                    {option.icon ? option.icon : null}
                    <p>{option?.title}</p>
                  </div>
                </div>
              ))}
          </div>
        </FloatingPortal>
      )}
    </>
  );
};
