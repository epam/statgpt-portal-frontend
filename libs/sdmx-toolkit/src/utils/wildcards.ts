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

export const getWildCardPrefix = (wildcard: string): string => {
  const trimmed = wildcard.trim();
  const plusIdx = trimmed.indexOf('+');

  if (plusIdx <= 0) return '';

  let digitStart = plusIdx;
  while (
    digitStart > 0 &&
    trimmed[digitStart - 1] >= '0' &&
    trimmed[digitStart - 1] <= '9'
  ) {
    digitStart--;
  }

  return digitStart > 0 ? trimmed.slice(0, digitStart) : '';
};

export const isWildCardVersionCorrect = (
  wildcard: string,
  version: string,
): boolean => {
  const ver = wildcard.trim().replace(/\+/, '');
  const prefix = getWildCardPrefix(wildcard);

  return version.startsWith(prefix) && compare(version, ver, '>=');
};
