import {
  buildDimensionSubItemId,
  isDimensionSubItemId,
  parseDimensionSubItemId,
} from '../dimensionSubItemId';

describe('buildDimensionSubItemId', () => {
  it('encodes urn and dimensionKey with :: separator', () => {
    expect(buildDimensionSubItemId('urn:123', 'FREQ')).toBe('urn:123::FREQ');
  });

  it('works with a complex URN containing colons', () => {
    expect(buildDimensionSubItemId('urn:sdmx:org.sdmx.infomodel', 'OBS_VALUE')).toBe(
      'urn:sdmx:org.sdmx.infomodel::OBS_VALUE',
    );
  });
});

describe('isDimensionSubItemId', () => {
  it('returns true for an id containing ::', () => {
    expect(isDimensionSubItemId('urn:123::FREQ')).toBe(true);
  });

  it('returns false for a plain id with no ::', () => {
    expect(isDimensionSubItemId('plain-column-id')).toBe(false);
  });

  it('returns false for an empty string', () => {
    expect(isDimensionSubItemId('')).toBe(false);
  });

  it('returns false for an id with only a single colon', () => {
    expect(isDimensionSubItemId('urn:123')).toBe(false);
  });
});

describe('parseDimensionSubItemId', () => {
  it('splits on the :: separator and returns urn and dimensionKey', () => {
    expect(parseDimensionSubItemId('urn:123::FREQ')).toEqual({
      urn: 'urn:123',
      dimensionKey: 'FREQ',
    });
  });

  it('splits only on the first :: when the dimensionKey itself contains ::', () => {
    expect(parseDimensionSubItemId('a::b::c')).toEqual({
      urn: 'a',
      dimensionKey: 'b::c',
    });
  });

  it('handles a URN with multiple colons before the separator', () => {
    expect(parseDimensionSubItemId('urn:sdmx:org::OBS_VALUE')).toEqual({
      urn: 'urn:sdmx:org',
      dimensionKey: 'OBS_VALUE',
    });
  });

  it('roundtrips with buildDimensionSubItemId', () => {
    const urn = 'urn:example:dataflow';
    const dimensionKey = 'COUNTRY';
    const id = buildDimensionSubItemId(urn, dimensionKey);
    expect(parseDimensionSubItemId(id)).toEqual({ urn, dimensionKey });
  });
});
