'use client';

import { Button, Popup, PopUpSize } from '@epam/statgpt-ui-components';
import { SignOutTitles } from '../../../models/user-info';
import { FC } from 'react';

interface Props {
  disableModalDividers?: boolean;
  isSmallButton?: boolean;
  locale: string;
  onCloseModal: () => void;
  signOut: () => void;
  titles: SignOutTitles;
}

const SignOutModal: FC<Props> = ({
  onCloseModal,
  disableModalDividers,
  signOut,
  isSmallButton,
  locale,
  titles,
}) => {
  return (
    <Popup
      heading={titles?.popupTitle || 'Log out?'}
      portalId="sign-out"
      containerClassName="sign-out-popup"
      size={PopUpSize.SM}
      dividers={!disableModalDividers}
      onClose={onCloseModal}
      closeButtonTitle={'Cancel'}
    >
      <div className="px-6 py-4 sm:px-0" lang={locale}>
        {titles?.popupText}
      </div>
      <div className="delete-conversation-popup-footer flex justify-end gap-x-2 px-6 py-3">
        <Button
          buttonClassName="cancel-button"
          title={titles?.popupCancel || 'Cancel'}
          isSmallButton={isSmallButton}
          onClick={(e) => {
            e.stopPropagation();
            onCloseModal();
          }}
        />
        <Button
          buttonClassName="text-button-primary"
          title={titles?.popupApply || 'Sign Out'}
          isSmallButton={isSmallButton}
          onClick={(e) => {
            e.stopPropagation();
            signOut?.();
          }}
        />
      </div>
    </Popup>
  );
};

export default SignOutModal;
