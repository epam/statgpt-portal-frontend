'use client';

import React, { ReactNode } from 'react';
import { useInlineAlertConfig } from './InlineAlertContext';
import { InlineAlertVariant } from './types';
import { mergeClasses } from '../../utils/mergeClasses';

export interface InlineAlertProps {
  variant: InlineAlertVariant;
  icon?: ReactNode;
  children?: ReactNode;
  className?: string;
  contentClassName?: string;
}

const DEFAULT_CONTAINER =
  'flex items-start gap-2 min-w-0 border-l-2 rounded py-2 px-4 items-center';

const DEFAULT_VARIANTS: Record<InlineAlertVariant, string> = {
  [InlineAlertVariant.Info]:
    'border-neutrals-800 bg-neutrals-300 text-neutrals-1000',
  [InlineAlertVariant.Error]:
    'border-semantic-error bg-semantic-error-light text-neutrals-1000',
  [InlineAlertVariant.Warning]:
    'border-semantic-warning bg-semantic-warning-light text-neutrals-1000',
};

const DEFAULT_ICON_CLASS = 'shrink-0';
const DEFAULT_CONTENT_CLASS = 'min-w-0 body-2';

/**
 * InlineAlert displays inline status feedback such as informational messages,
 * warnings, or errors. It supports theme-based customization via
 * `InlineAlertProvider` and allows per-instance overrides.
 *
 * By default, the component applies base layout styles and variant-specific
 * colors. Icons and classes can be customized globally through context
 * or locally via props.
 *
 * @example
 * Basic usage without provider
 * ```tsx
 * <InlineAlert variant={InlineAlertVariant.Error}>
 *   The AI Assistant is unavailable.
 * </InlineAlert>
 * ```
 *
 * @example
 * Usage with InlineAlertProvider customization
 * ```tsx
 * <InlineAlertProvider
 *   value={{
 *     icons: {
 *       [InlineAlertVariant.Error]: <ErrorIcon />,
 *     },
 *     classes: {
 *       container: 'border rounded-lg p-4',
 *       variants: {
 *         [InlineAlertVariant.Error]: 'bg-red-50 border-red-400',
 *       },
 *     },
 *   }}
 * >
 *   <InlineAlert variant={InlineAlertVariant.Error}>
 *     Something went wrong.
 *   </InlineAlert>
 * </InlineAlertProvider>
 * ```
 *
 * @param variant - Visual intent of the alert (info, error, warning).
 * @param icon - Optional icon element. Overrides provider-configured icon if supplied.
 * @param children - Alert content rendered inside the message container.
 * @param className - Additional classes applied to the root container.
 * @param contentClassName - Additional classes applied to the content wrapper.
 */
export function InlineAlert({
  variant,
  icon,
  children,
  className,
  contentClassName,
}: InlineAlertProps) {
  const cfg = useInlineAlertConfig();

  const resolvedIcon = icon ?? cfg?.icons?.[variant];
  const containerBase = cfg?.classes?.container ?? DEFAULT_CONTAINER;
  const variantClass =
    cfg?.classes?.variants?.[variant] ?? DEFAULT_VARIANTS[variant];

  const containerClass = mergeClasses(containerBase, variantClass, className);
  const iconClass = mergeClasses(DEFAULT_ICON_CLASS, cfg?.classes?.icon);
  const contentClass = mergeClasses(
    DEFAULT_CONTENT_CLASS,
    cfg?.classes?.content,
    contentClassName,
  );

  return (
    <div data-variant={variant} className={containerClass}>
      {resolvedIcon ? <span className={iconClass}>{resolvedIcon}</span> : null}
      {children ? <div className={contentClass}>{children}</div> : null}
    </div>
  );
}
