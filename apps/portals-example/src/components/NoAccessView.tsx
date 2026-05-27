'use client';

import { Button } from '@epam/statgpt-ui-components';
import { signOut } from 'next-auth/react';
import { TranslateI18nFn, useI18n } from '../locales/client';
import {
  AppI18nKeys,
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
    <div className="flex size-full">
      <div className="relative h-full w-[362px] shrink-0 overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 bg-[url('/images/left-panel-bg.svg')] bg-cover bg-center bg-no-repeat"
          aria-hidden="true"
        />
        <div className="flex flex-row items-center px-6 py-5 ">
          <LogoIcon width={34} height={34} />
          <span className="logo ml-3 text-start text-hues-900">
            <p className="mb-1 mr-1 inline font-semibold">
              {t(I18nKeys.App.TITLE_GLOBAL)}
            </p>
            <p className="inline">{t(I18nKeys.App.TITLE)}</p>
            {t(I18nKeys.App.SUBTITLE) &&
              t(I18nKeys.App.SUBTITLE) !== AppI18nKeys.SUBTITLE && (
                <p className="logo-subtitle text-hues-800">
                  {t(I18nKeys.App.SUBTITLE)}
                </p>
              )}
          </span>
        </div>
      </div>
      <div className="flex size-full items-center justify-center">
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
