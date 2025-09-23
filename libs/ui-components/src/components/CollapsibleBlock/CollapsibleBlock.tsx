import { FC, ReactNode, useState } from 'react';
import { IconChevronDown } from '@tabler/icons-react';

interface Props {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  value?: string;
}

export const CollapsibleBlock: FC<Props> = ({
  title,
  icon,
  children,
  value,
}) => {
  const [open, setOpen] = useState(false);

  return (
    <div
      className={`collapsible-block flex flex-col border-t-2 border-neutrals-600 ${open ? 'collapsible-block-open' : ''}`}
    >
      <div
        className="collapsible-block-title flex cursor-pointer items-center py-4"
        onClick={() => setOpen(!open)}
      >
        <div className={`${open ? 'rotate-180' : ''} transition-transform`}>
          {icon || <IconChevronDown className="w-5 h-5 mr-3" />}
        </div>
        <div className="flex flex-1 items-center justify-between">
          <span>{title}</span>
          {value && <p className="body-1 text-neutrals-800">{value}</p>}
        </div>
      </div>
      {open && <div className="collapsible-block-content pb-4">{children}</div>}
    </div>
  );
};
