'use client';

import { FC, ReactNode } from 'react';
import classNames from 'classnames';

interface Props {
  icon: ReactNode;
  title?: string;
}

const AttachmentCollapsed: FC<Props> = ({ icon, title }) => {
  return (
    <div
      className={classNames(
        'px-3 py-4 rounded border mt-3',
        'attachment-collapsed',
      )}
    >
      <p className={classNames('flex body-3 items-center')}>
        {icon}
        <span className="ml-2"> {title}</span>
      </p>
    </div>
  );
};

export default AttachmentCollapsed;
