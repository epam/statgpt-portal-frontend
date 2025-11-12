import { ArtifactChildUrnParsed, SplittedUrn } from '../models/splitted-urn';

export const getKeyFromUrn = (urn?: string | null): string | undefined => {
  if (urn != null) {
    const separatedValue = urn.split('=');

    return separatedValue.length === 1 ? urn : separatedValue[1];
  }

  return;
};

export const splitUrn = (urn?: string): SplittedUrn => {
  if (urn == null) {
    return {};
  }

  const keyFromUrn = getKeyFromUrn(urn);
  const split: SplittedUrn = {
    agency: '',
    id: '',
    version: '',
  };

  const isSafeComponent = (value: string | undefined): boolean =>
    typeof value === 'string' && /^[a-zA-Z0-9_.-]+$/.test(value);

  if (keyFromUrn) {
    if (keyFromUrn.includes(':')) {
      const agencyRaw = keyFromUrn.split(':')[0];
      const idRaw = keyFromUrn.split(':')[1].split('(')[0];
      split.agency = isSafeComponent(agencyRaw) ? agencyRaw : '';
      split.id = isSafeComponent(idRaw) ? idRaw : '';
    }
    if (keyFromUrn.includes('(') && keyFromUrn.includes(')')) {
      const versionRaw = keyFromUrn.split('(')[1]?.split(')')[0];
      split.version = isSafeComponent(versionRaw) ? versionRaw : '';
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
