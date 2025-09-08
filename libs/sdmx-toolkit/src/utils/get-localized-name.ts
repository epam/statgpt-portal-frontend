import { CommonArtefactProperty } from '@statgpt/sdmx-toolkit/src/models/structural-metadata/common-artefact-properties';

export const getLocalizedName = <T extends CommonArtefactProperty>(
  item: T | undefined | null,
  locale: string,
): string | undefined => (item?.names && item?.names[locale]) || item?.name;
