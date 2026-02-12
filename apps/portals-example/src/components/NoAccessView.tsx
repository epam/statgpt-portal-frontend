'use client';

import { Button } from '@epam/statgpt-ui-components';
import { signOut } from 'next-auth/react';
import { useI18n } from '../locales/client';
import { I18nKeys } from '../constants/i18n-keys';
import LogoIcon from '../../public/images/logo.svg';

export const NoAccessView = () => {
  const t = useI18n();

  return (
    <div className="size-full flex">
      <div className="h-full w-[362px] relative overflow-hidden shrink-0">
        <div
          className="absolute inset-0 pointer-events-none bg-[url('/images/left-panel-bg.svg')] bg-no-repeat bg-cover bg-center"
          aria-hidden="true"
        />
        <div className="flex flex-row items-center px-6 py-5 ">
          <LogoIcon width={34} height={34} />
          <span className="text-hues-900 text-start logo ml-3">
            <p className="font-semibold mr-1 inline mb-1">
              {t(I18nKeys.App.TITLE_GLOBAL)}
            </p>
            <p className="inline">{t(I18nKeys.App.TITLE)}</p>
          </span>
        </div>
      </div>
      <div className="flex items-center justify-center size-full">
        <div className="flex flex-col gap-5">
          <h1 className="h1">No access to AI assistant</h1>
          <p className="body-1">To get an access contact support.</p>
          <Button
            buttonClassName="text-button-secondary w-fit !py-[14px] !px-[45px]"
            title="Log out"
            onClick={() => signOut()}
          />
        </div>
      </div>
    </div>
  );
};
