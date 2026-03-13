'use client';

import { ReactNode, useEffect, useRef, useState } from 'react';
import { Button } from '../Button/Button';
import { mergeClasses } from '../../utils/mergeClasses';

interface CopyButtonProps {
  onClick: () => void;
  title?: string;
  copiedTitle?: string;
  tooltip?: string;
  icon?: ReactNode;
  copiedIcon?: ReactNode;
  className?: string;
  buttonTextClassName?: string;
}

/**
 * CopyButton is a small utility button for copy-to-clipboard actions.
 * When clicked, it enters a temporary "copied" state for 1 second,
 * during which the button becomes disabled and can display alternate
 * title, icon, and optional tooltip feedback.
 *
 * The actual copy logic must be provided via the `onClick` handler
 * (e.g. `navigator.clipboard.writeText`).
 *
 * @example
 * ```tsx
 * <CopyButton
 *   title="Copy"
 *   copiedTitle="Copied"
 *   tooltip="Copied to clipboard"
 *   icon={<CopyIcon />}
 *   copiedIcon={<CheckIcon />}
 *   onClick={() => navigator.clipboard.writeText(text)}
 * />
 * ```
 *
 * @param onClick - Handler executed when the button is clicked.
 * @param title - Title shown in the default state.
 * @param copiedTitle - Title shown while in the copied state.
 * @param tooltip - Optional tooltip displayed during the copied state.
 * @param icon - Icon shown in the default state.
 * @param copiedIcon - Icon shown in the copied state.
 * @param className - Additional classes applied to the button.
 * @param buttonTextClassName - Additional classes for the button text.
 */
export const CopyButton = ({
  title,
  copiedTitle,
  tooltip,
  icon,
  copiedIcon,
  className,
  buttonTextClassName,
  onClick,
}: CopyButtonProps) => {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleClick = () => {
    onClick();

    setCopied(true);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setCopied(false);
    }, 1000);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="relative w-fit">
      <Button
        title={copied ? copiedTitle : title}
        isSmallButton
        disabled={copied}
        buttonClassName={mergeClasses([
          'text-button-tertiary small-icon-button !h-6 !p-0',
          className,
        ])}
        textClassName={mergeClasses(['ml-1', buttonTextClassName])}
        onClick={handleClick}
        iconBefore={copied ? copiedIcon : icon}
      />

      {tooltip && copied && (
        <div className="absolute left-1/2 top-full z-50 mt-1 -translate-x-1/2 whitespace-nowrap rounded border border-neutrals-400 bg-white px-3 py-4 text-neutrals-900 h4 shadow">
          {tooltip}
        </div>
      )}
    </div>
  );
};
