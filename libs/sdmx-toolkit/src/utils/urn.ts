import { ArtifactChildUrnParsed, SplittedUrn } from '../models/splitted-urn';

export const getKeyFromUrn = (urn?: string | null): string | undefined => {
  if (urn != null) {
    const separatedValue = urn.split('=');

    return separatedValue.length === 1 ? urn : separatedValue[1];
  }

  return;
};

export const splitUrn = (urn?: string | null): SplittedUrn => {
  const split = {
    agency: '',
    id: '',
    version: '',
  } as SplittedUrn;
  if (urn == null) {
    return split;
  }
  const item = getKeyFromUrn(urn);
  if (item) {
    if (item.includes(':')) {
      split.agency = item.split(':')[0];
      split.id = item.split(':')[1].split('(')[0];
    }
    if (item.includes('(')) {
      const splittedKey = item.split('(');
      split.version = splittedKey[1]?.split(')')[0];
      // handle excel dataset urn without agency
      if (!split.id) {
        split.id = splittedKey[0];
      }
    }
  }
  return split;
};

export const getChildParsedUrn = (childUrn: string): ArtifactChildUrnParsed => {
  const [urn, childId] = childUrn.split(').');
  const { agency, id, version } = splitUrn(urn + ')');

  return { childId, agency, id, version };
};

export const generateShortUrn = (
  id?: string,
  version?: string,
  agency?: string,
): string => {
  const versionStr = version === '' ? '' : `(${version})`;
  return `${agency}:${id}${versionStr}`;
};
