import { UserInfo } from '../../models/user-info';
import { FC, useMemo } from 'react';
import { Dropdown } from '@epam/statgpt-ui-components';
import SignOutIcon from '../../assets/icons/sign-out.svg';

interface Props {
  userInfo: UserInfo | null;
  signOutAction?: () => void;
  title?: string;
}

const User: FC<Props> = ({ userInfo, signOutAction, title }) => {
  const initials = useMemo(
    () =>
      userInfo?.name
        .split(' ')
        .map((n) => n[0].toUpperCase())
        .join('') || '',
    [userInfo],
  );

  const initialsBlock = useMemo(() => {
    return (
      <div
        className="cursor-pointer flex items-center justify-center bg-hues-900 h-[44px] w-[44px] rounded-[100px]
    p-[10px] text-white h2 border-accent-700 border-[1px]"
      >
        {initials}
      </div>
    );
  }, [initials]);

  const content = useMemo(() => {
    return (
      <div className="py-1">
        <div className="py-2 px-3">
          <h4 className="text-neutrals-1000">{userInfo?.name}</h4>
          <p className="text-neutrals-800 body-3">{userInfo?.email}</p>
        </div>

        <button
          className="p-3 items-center flex gap-1 text-primary fill-primary h3"
          onClick={signOutAction}
        >
          <SignOutIcon width={20} height={20} />
          {title || 'Sign out'}
        </button>
      </div>
    );
  }, [userInfo, signOutAction, title]);

  if (!userInfo) {
    return;
  }

  return (
    <Dropdown
      containerClassName="transition-opacity ml-3 group-hover:opacity-100"
      triggerButton={initialsBlock}
      content={content}
      openedClassName="action-menu-opened"
    />
  );
};

export default User;
