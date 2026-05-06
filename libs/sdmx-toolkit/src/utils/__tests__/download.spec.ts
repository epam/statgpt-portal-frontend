import { FileColumnsAttribute, SdmxDataFormat } from '../../types';
import { openDownloadWindow, sanitizeDownloadFilename } from '../download';

describe('sanitizeDownloadFilename', () => {
  it('replaces dangerous filename characters', () => {
    expect(sanitizeDownloadFilename('../report:<2026>?.csv')).toBe(
      'report_2026_.csv',
    );
  });

  it('uses a fallback for empty filenames', () => {
    expect(sanitizeDownloadFilename('   ...   ')).toBe('download');
  });
});

describe('openDownloadWindow', () => {
  const objectUrl = 'blob:http://localhost/download';
  const originalFetch = global.fetch;
  const originalCreateObjectURL = URL.createObjectURL;
  const originalRevokeObjectURL = URL.revokeObjectURL;

  beforeEach(() => {
    jest.useFakeTimers();

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      blob: jest.fn().mockResolvedValue(new Blob(['id,value'])),
    }) as unknown as typeof fetch;

    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: jest.fn().mockReturnValue(objectUrl),
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      value: jest.fn(),
    });
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();

    global.fetch = originalFetch;
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: originalCreateObjectURL,
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      value: originalRevokeObjectURL,
    });
  });

  it('downloads response blob without appending a link to the DOM', async () => {
    const appendChildSpy = jest.spyOn(document.body, 'appendChild');
    const clickSpy = jest
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation();

    await openDownloadWindow(
      'urn:test',
      SdmxDataFormat.CSV,
      'en',
      FileColumnsAttribute.ID_NAME,
      { filterKey: null, timeFilter: null },
      '../unsafe:name.csv',
    );

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('http://localhost/api/download?'),
      expect.objectContaining({
        method: 'GET',
        credentials: 'same-origin',
      }),
    );
    expect(appendChildSpy).not.toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalledTimes(1);

    const link = clickSpy.mock.contexts[0] as HTMLAnchorElement;
    expect(link.href).toBe(objectUrl);
    expect(link.download).toBe('unsafe_name.csv');

    jest.advanceTimersByTime(60_000);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith(objectUrl);
  });
});
