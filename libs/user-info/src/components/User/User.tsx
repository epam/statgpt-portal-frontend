import { SignOutTitles, UserInfo } from '../../models/user-info';
import { FC, ReactNode, useCallback, useMemo, useState } from 'react';
import { Dropdown } from '@epam/statgpt-ui-components';
import classNames from 'classnames';
import SignOutModal from './SignOutModal/SignOutModal';

interface UserStyles {
  containerStyles?: string;
  initialStyles?: string;
  dropDownStyles?: string;
  userNameStyles?: string;
  signOutIcon?: ReactNode;
  settingsIcon?: ReactNode;
  showShortName?: boolean;
  showSeparator?: boolean;
  disableModalDividers?: boolean;
  dropdownButtonStyles?: string;
  dropdownContainerContainerClassName?: string;
}

interface Props {
  userInfo: UserInfo | null;
  signOutAction?: () => void;
  styles?: UserStyles;
  locale: string;
  titles: SignOutTitles;
}

export const User: FC<Props> = ({
  userInfo,
  signOutAction,
  styles,
  locale,
  titles,
}) => {
  const getInitials = (name?: string) =>
    name
      ?.split(' ')
      ?.map((n, i) => (i < 2 ? n[0].toUpperCase() : ''))
      ?.join('') ?? '';

  const initials = useMemo(
    () =>
      userInfo?.name
        ? getInitials(userInfo?.name)
        : (userInfo?.email?.[0].toUpperCase() ?? ''),
    [userInfo],
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const splittedUserName = userInfo?.name?.split(' ');
  const userShortName = splittedUserName
    ? `${splittedUserName?.[0] ?? ''} ${splittedUserName?.[1]?.[0] ? splittedUserName?.[1]?.[0] + '.' : ''}`
    : (userInfo?.email ?? '');

  const openModal = useCallback(() => {
    setIsModalOpen(true);
  }, []);

  const onModalClose = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const initialsBlock = useMemo(() => {
    return (
      <div className="flex items-center gap-2">
        <div
          className={classNames(
            'cursor-pointer flex items-center justify-center h-[44px] w-[44px] rounded-[100px] p-[10px] sm:h-[32px] sm:w-[32px] flex-shrink-0',
            styles?.initialStyles,
          )}
        >
          {initials}
        </div>
        <p
          className={classNames(
            'h3 cursor-pointer overflow-x-hidden text-ellipsis',
            styles?.userNameStyles,
          )}
        >
          {(styles?.showShortName ? userShortName : userInfo?.name) ??
            userInfo?.email ??
            ''}
        </p>
      </div>
    );
  }, [initials, userShortName, styles, userInfo]);

  const content = useMemo(() => {
    return (
      <div className={classNames('py-1', styles?.dropDownStyles)}>
        {styles?.settingsIcon && (
          <button
            className={classNames(
              'p-2 items-center flex gap-1 text-primary fill-primary body-1',
              styles?.dropdownButtonStyles,
            )}
            title={titles?.settings}
          >
            {styles?.settingsIcon}
            {titles?.settings || 'Settings'}
          </button>
        )}

        <div
          className={classNames(
            'h-0 border-t border-neutrals-600 my-2',
            styles?.showSeparator ? 'block' : 'hidden',
          )}
        ></div>

        <button
          className={classNames(
            'p-2 items-center flex gap-1 text-primary fill-primary body-1',
            styles?.dropdownButtonStyles,
          )}
          title={titles?.signOut}
          onClick={openModal}
        >
          {styles?.signOutIcon}
          {titles?.signOut || 'Sign out'}
          {isModalOpen && (
            <SignOutModal
              onCloseModal={onModalClose}
              signOut={() => signOutAction?.()}
              locale={locale}
              disableModalDividers={styles?.disableModalDividers}
              titles={titles}
            />
          )}
        </button>
      </div>
    );
  }, [
    styles,
    titles,
    openModal,
    isModalOpen,
    onModalClose,
    locale,
    signOutAction,
  ]);

  if (!userInfo) {
    return;
  }

  return (
    <Dropdown
      containerClassName={classNames(
        'transition-opacity group-hover:opacity-100 shrink w-full',
        styles?.dropdownContainerContainerClassName,
      )}
      triggerButton={initialsBlock}
      content={content}
      openedClassName="action-menu-opened"
    />
  );
};
