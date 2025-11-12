'use client';

import { I18nKeys } from '../../constants/i18n-keys';
import { useI18n } from '../../locales/client';

const Footer = () => {
  const t = useI18n();
  return (
    <h4 className="flex justify-center text-neutrals-700 my-3">
      <span>©</span>
      <span className="mx-1">{new Date().getFullYear()}</span>
      <span>{t(I18nKeys.App.FOOTER)}</span>
    </h4>
  );
};

export default Footer;
