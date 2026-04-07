import type { CommonArtefactProperty } from '../../models/structural-metadata/common-artefact-properties';
import {
  getArtifactByUrnWithWildCard,
  getResolvedVersionBySingleWildcard,
  getWildCardPrefix,
  isWildCardVersionCorrect,
} from '../wildcards';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const artifact = (
  agencyID: string,
  id: string,
  version: string,
): CommonArtefactProperty => ({ agencyID, id, version, name: id });

// ---------------------------------------------------------------------------
// getWildCardPrefix
// ---------------------------------------------------------------------------

describe('getWildCardPrefix', () => {
  it('extracts the prefix before the wildcard segment', () => {
    expect(getWildCardPrefix('1.2+')).toBe('1.');
  });

  it('returns an empty string when the wildcard starts with digits', () => {
    expect(getWildCardPrefix('2+')).toBe('');
  });

  it('handles a wildcard with leading/trailing whitespace', () => {
    expect(getWildCardPrefix('  1.2+  ')).toBe('1.');
  });

  it('extracts a multi-segment prefix', () => {
    expect(getWildCardPrefix('1.2.3+')).toBe('1.2.');
  });
});

// ---------------------------------------------------------------------------
// isWildCardVersionCorrect
// ---------------------------------------------------------------------------

describe('isWildCardVersionCorrect', () => {
  it('returns true for a version that matches prefix and is >=', () => {
    expect(isWildCardVersionCorrect('1.2+', '1.3')).toBe(true);
  });

  it('returns true for the exact base version', () => {
    expect(isWildCardVersionCorrect('1.2+', '1.2')).toBe(true);
  });

  it('returns false for a version below the wildcard base', () => {
    expect(isWildCardVersionCorrect('1.2+', '1.1')).toBe(false);
  });

  it('returns false for a version with a different prefix', () => {
    expect(isWildCardVersionCorrect('1.2+', '2.0')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// getResolvedVersionBySingleWildcard
// ---------------------------------------------------------------------------

describe('getResolvedVersionBySingleWildcard', () => {
  it('returns the first matching version', () => {
    const result = getResolvedVersionBySingleWildcard('1.0+', [
      '1.0',
      '1.1',
      '1.2',
    ]);
    expect(result).toEqual(['1.0']);
  });

  it('returns an empty array when no versions match', () => {
    const result = getResolvedVersionBySingleWildcard('2.0+', ['1.0', '1.1']);
    expect(result).toEqual([]);
  });

  it('ignores versions below the wildcard base', () => {
    const result = getResolvedVersionBySingleWildcard('1.5+', [
      '1.3',
      '1.4',
      '1.6',
    ]);
    expect(result).toEqual(['1.6']);
  });
});

// ---------------------------------------------------------------------------
// getArtifactByUrnWithWildCard
// ---------------------------------------------------------------------------

describe('getArtifactByUrnWithWildCard', () => {
  const artifacts: CommonArtefactProperty[] = [
    artifact('SDMX', 'CL_FREQ', '1.0'),
    artifact('SDMX', 'CL_FREQ', '2.0'),
    artifact('SDMX', 'CL_UNIT', '1.0'),
  ];

  it('returns the artifact matching exact version when no wildcard', () => {
    const result = getArtifactByUrnWithWildCard(
      'urn:sdmx:org.sdmx.infomodel.codelist.Codelist=SDMX:CL_FREQ(2.0)',
      artifacts,
    );
    expect(result).toEqual(artifact('SDMX', 'CL_FREQ', '2.0'));
  });

  it('returns the single match when only one artifact has the same agency and id', () => {
    const result = getArtifactByUrnWithWildCard(
      'urn:sdmx:org.sdmx.infomodel.codelist.Codelist=SDMX:CL_UNIT(1.0)',
      artifacts,
    );
    expect(result).toEqual(artifact('SDMX', 'CL_UNIT', '1.0'));
  });

  it('resolves a wildcard version to the first matching artifact', () => {
    const result = getArtifactByUrnWithWildCard(
      'urn:sdmx:org.sdmx.infomodel.codelist.Codelist=SDMX:CL_FREQ(1.0+)',
      artifacts,
    );
    expect(result).toEqual(artifact('SDMX', 'CL_FREQ', '1.0'));
  });

  it('returns undefined when no artifacts match the agency and id', () => {
    const result = getArtifactByUrnWithWildCard(
      'urn:sdmx:org.sdmx.infomodel.codelist.Codelist=OTHER:CL_FREQ(1.0)',
      artifacts,
    );
    expect(result).toBeUndefined();
  });

  it('excludes artifacts whose version contains a wildcard symbol', () => {
    const withWildcard: CommonArtefactProperty[] = [
      artifact('SDMX', 'CL_FREQ', '1.0+'),
      artifact('SDMX', 'CL_FREQ', '1.0'),
    ];
    const result = getArtifactByUrnWithWildCard(
      'urn:sdmx:org.sdmx.infomodel.codelist.Codelist=SDMX:CL_FREQ(1.0)',
      withWildcard,
    );
    expect(result).toEqual(artifact('SDMX', 'CL_FREQ', '1.0'));
  });
});
