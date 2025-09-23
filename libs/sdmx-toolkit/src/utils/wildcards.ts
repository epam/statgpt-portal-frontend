import { compare } from 'compare-versions';
import { CommonArtefactProperty } from '../models/structural-metadata/common-artefact-properties';
import { splitUrn } from './urn';

export const SINGLE_WILDCARD_SYMBOL = '+';

export const getArtifactByUrnWithWildCard = (
  urn: string | undefined,
  artifacts: CommonArtefactProperty[],
): CommonArtefactProperty | undefined => {
  const { agency, id, version } = splitUrn(urn);

  const filteredArtifacts = artifacts.filter(
    (artifact) =>
      artifact.agencyID === agency &&
      artifact.id === id &&
      !artifact?.version?.includes(SINGLE_WILDCARD_SYMBOL),
  );

  if (filteredArtifacts.length === 1) {
    return filteredArtifacts[0];
  }

  if (!version?.includes(SINGLE_WILDCARD_SYMBOL)) {
    return filteredArtifacts.find((artifact) => artifact.version === version);
  }

  const versions = filteredArtifacts.map(
    (artifact) => artifact.version as string,
  );
  const resolvedVersion = getResolvedVersionBySingleWildcard(version, versions);

  return filteredArtifacts.find(
    (artifact) => artifact.version === resolvedVersion[0],
  );
};

export const getResolvedVersionBySingleWildcard = (
  wildcard: string,
  versions: string[],
): string[] => {
  const resolvedVersion = getResolvedVersionByWildcards(wildcard, versions);

  return resolvedVersion.length > 0 ? [resolvedVersion[0]] : [];
};

const getResolvedVersionByWildcards = (
  wildcard: string,
  versions: string[],
): string[] => {
  const resolved: string[] = [];

  versions.forEach((version) => {
    if (isWildCardVersionCorrect(wildcard, version)) {
      resolved.push(version);
    }
  });

  return resolved;
};

export const getWildCardRegexp = (wildcard: string): RegExp => {
  const regStr = wildcard.trim().replace(/\d+\+/, '*');
  const [start] = regStr.split('*');

  return new RegExp(`^${start}`);
};

export const isWildCardVersionCorrect = (
  wildcard: string,
  version: string,
): boolean => {
  const ver = wildcard.trim().replace(/\+/, '');
  const reg = getWildCardRegexp(wildcard);

  return reg.test(version) && compare(version, ver, '>=');
};
