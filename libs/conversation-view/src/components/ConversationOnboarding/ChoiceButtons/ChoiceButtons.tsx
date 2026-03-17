'use client';

import classNames from 'classnames';
import { FC } from 'react';
import {
  DialSchemaProperties,
  FormSchemaButtonOption,
} from '@epam/ai-dial-shared';
import { CUSTOM_CHOICE_ID } from '../../../constants/custom-content-properties';

interface Props {
  choiceButtons: FormSchemaButtonOption[];
  disabled?: boolean;
  onClick: (message?: string, choiceId?: string) => void;
}

export const ChoiceButtons: FC<Props> = ({
  choiceButtons,
  disabled,
  onClick,
}) => {
  const choiceButtonClassName = classNames(
    'flex w-full min-h-[72px] flex-col items-start justify-center rounded border px-4 py-2 text-left',
    'border-hues-200 hover:bg-hues-100',
    'disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent',
  );

  return choiceButtons.map((item) => (
    <div className="mt-4" key={item.title}>
      <button
        type="button"
        className={choiceButtonClassName}
        disabled={disabled}
        onClick={() =>
          onClick(
            item[DialSchemaProperties.DialWidgetOptions]?.populateText,
            item?.const as string,
          )
        }
        aria-label="button"
      >
        <h3 className="mb-1">{item.title}</h3>
        {item.const !== CUSTOM_CHOICE_ID.COMPLETE && (
          <p className="body-1 text-neutrals-800">
            {item[DialSchemaProperties.DialWidgetOptions]?.populateText}
          </p>
        )}
      </button>
    </div>
  ));
};
