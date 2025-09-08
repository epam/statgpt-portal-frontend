'use client';

import classNames from 'classnames';
import { FC, ReactNode } from 'react';

import { Input, InputProps } from './Input';

interface Props extends InputProps {
  iconAfterInput?: ReactNode;
  containerClasses?: string;
  iconBeforeInput?: ReactNode;
}

export const InputWithIcon: FC<Props> = ({
  iconBeforeInput,
  iconAfterInput,
  containerClasses,
  cssClass,
  ...props
}) => {
  return (
    <div className={classNames('input w-full flex flex-row', containerClasses)}>
      {iconBeforeInput}
      <Input
        cssClass={classNames(
          'border-0 bg-transparent p-0 h-full shadow-none flex-1 min-w-0 rounded-none',
          cssClass,
        )}
        {...props}
      />
      {iconAfterInput}
    </div>
  );
};
