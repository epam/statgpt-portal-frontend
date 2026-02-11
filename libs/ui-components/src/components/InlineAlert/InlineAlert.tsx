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

const DEFAULT_BASE =
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

export function InlineAlert({
  variant,
  icon,
  children,
  className,
  contentClassName,
}: InlineAlertProps) {
  const cfg = useInlineAlertConfig();

  const resolvedIcon = icon ?? cfg?.icons?.[variant];
  const base = cfg?.classes?.base ?? DEFAULT_BASE;
  const variantClass =
    cfg?.classes?.variants?.[variant] ?? DEFAULT_VARIANTS[variant];

  const container = mergeClasses(base, variantClass, className);
  const iconClass = mergeClasses(DEFAULT_ICON_CLASS, cfg?.classes?.icon);
  const contentClass = mergeClasses(
    DEFAULT_CONTENT_CLASS,
    cfg?.classes?.content,
    contentClassName,
  );

  return (
    <div data-variant={variant} className={container}>
      {resolvedIcon ? <span className={iconClass}>{resolvedIcon}</span> : null}
      {children ? <div className={contentClass}>{children}</div> : null}
    </div>
  );
}
