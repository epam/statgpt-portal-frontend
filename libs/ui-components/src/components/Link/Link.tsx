import classNames from 'classnames';
import { FC, ReactNode } from 'react';

interface Props {
  url: string;
  title?: string;
  linkClassName?: string;
  iconBefore?: ReactNode;
  iconAfter?: ReactNode;
}

export const Link: FC<Props> = ({
  url,
  title,
  linkClassName = '',
  iconBefore,
  iconAfter,
}) => {
  const textClassNames = classNames(
    iconAfter ? 'mr-2' : '',
    iconBefore ? 'ml-2' : '',
  );

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={classNames('base-link', linkClassName)}
      title={title}
    >
      {iconBefore}
      <span className={textClassNames}>{title}</span>
      {iconAfter}
    </a>
  );
};
