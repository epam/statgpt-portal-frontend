'use client';

import { Button } from '@epam/statgpt-ui-components';
import { signOut } from 'next-auth/react';
import { TranslateI18nFn, useI18n } from '../locales/client';
import {
  AuthI18nKeys,
  I18nKeys,
  StatusMessagesI18nKeys,
} from '../constants/i18n-keys';
import LogoIcon from '../../public/images/logo.svg';

export const NoAccessView = ({
  clientContactSupportUrl,
}: {
  clientContactSupportUrl?: string;
}) => {
  const t = useI18n() as TranslateI18nFn;

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
          <h1 className="h1">
            {t(StatusMessagesI18nKeys.AGENT_UNAVAILABLE_TITLE)}
          </h1>
          <p className="body-1">
            {t(StatusMessagesI18nKeys.AGENT_UNAVAILABLE_TEXT, {
              link: (
                <a
                  className="text-primary"
                  href={clientContactSupportUrl || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t(StatusMessagesI18nKeys.CONTACT_SUPPORT)}
                </a>
              ),
            })}
          </p>
          <Button
            buttonClassName="text-button-secondary w-fit !py-[14px] !px-[45px]"
            title={t(AuthI18nKeys.SIGN_OUT)}
            onClick={() => signOut()}
          />
        </div>
      </div>
    </div>
  );
};
