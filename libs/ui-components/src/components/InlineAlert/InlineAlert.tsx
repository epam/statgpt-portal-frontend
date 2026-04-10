'use client';

import React, { ReactNode } from 'react';
import { useInlineAlertConfig } from './InlineAlertContext';
import { InlineAlertType } from './types';
import { mergeClasses } from '../../utils/mergeClasses';

export interface InlineAlertProps {
  type: InlineAlertType;
  icon?: ReactNode;
  children?: ReactNode;
  className?: string;
  contentClassName?: string;
}

const DEFAULT_TYPES: Record<InlineAlertType, string> = {
  [InlineAlertType.Info]:
    'border-neutrals-800 bg-neutrals-300 text-neutrals-1000',
  [InlineAlertType.Error]:
    'border-semantic-error bg-semantic-error-light text-neutrals-1000',
  [InlineAlertType.Warning]:
    'border-semantic-warning bg-semantic-warning-light text-neutrals-1000',
  [InlineAlertType.Note]: 'border-hues-900 bg-neutrals-200 text-neutrals-1000',
};

const DEFAULT_ICON_CLASS = 'shrink-0';
const DEFAULT_CONTENT_CLASS = 'min-w-0 body-2';
const DEFAULT_CONTAINER_CLASS =
  'flex items-start gap-2 min-w-0 border-l-2 rounded py-2 px-4 items-center';

/**
 * InlineAlert displays inline status feedback such as informational messages,
 * warnings, or errors. It supports theme-based customization via
 * `InlineAlertProvider` and allows per-instance overrides.
 *
 * By default, the component applies base layout styles and type-specific
 * colors. Icons and classes can be customized globally through context
 * or locally via props.
 *
 * @example
 * Basic usage without provider
 * ```tsx
 * <InlineAlert type={InlineAlertType.Error}>
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
 *       [InlineAlertType.Error]: <ErrorIcon />,
 *     },
 *     classes: {
 *       container: 'border rounded-lg p-4',
 *       types: {
 *         [InlineAlertType.Error]: 'bg-red-50 border-red-400',
 *       },
 *     },
 *   }}
 * >
 *   <InlineAlert type={InlineAlertType.Error}>
 *     Something went wrong.
 *   </InlineAlert>
 * </InlineAlertProvider>
 * ```
 *
 * @param type - Visual intent of the alert (info, error, warning).
 * @param icon - Optional icon element. Overrides provider-configured icon if supplied.
 * @param children - Alert content rendered inside the message container.
 * @param className - Additional classes applied to the root container.
 * @param contentClassName - Additional classes applied to the content wrapper.
 */
export function InlineAlert({
  type,
  icon,
  children,
  className,
  contentClassName,
}: InlineAlertProps) {
  const config = useInlineAlertConfig();

  const resolvedIcon = icon ?? config?.icons?.[type];
  const containerBase = config?.classes?.container ?? DEFAULT_CONTAINER_CLASS;
  const typeClass = config?.classes?.types?.[type] ?? DEFAULT_TYPES[type];

  const containerClass = mergeClasses(containerBase, typeClass, className);
  const iconClass = mergeClasses(DEFAULT_ICON_CLASS, config?.classes?.icon);
  const contentClass = mergeClasses(
    DEFAULT_CONTENT_CLASS,
    config?.classes?.content,
    contentClassName,
  );

  return (
    <div data-type={type} className={containerClass}>
      {resolvedIcon ? <span className={iconClass}>{resolvedIcon}</span> : null}
      {children ? <div className={contentClass}>{children}</div> : null}
    </div>
  );
}
