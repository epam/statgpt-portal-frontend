import { prepareSystemMessage } from '../system-message';
import { DataQuery } from '@epam/statgpt-shared-toolkit';

jest.mock('@epam/ai-dial-shared', () => ({
  Role: { System: 'system' },
}));
jest.mock('@epam/statgpt-dial-toolkit', () => ({
  AttachmentType: { JSON: 'application/json' },
}));
jest.mock('../messages', () => ({
  getLastAssistantMessage: jest.fn().mockReturnValue(undefined),
}));

const BASE_METADATA = {
  countryDimension: 'REF_AREA',
  indicatorDimensions: ['INDICATOR'],
};

describe('prepareSystemMessage', () => {
  describe('disabled serialization', () => {
    it('includes disabled:true in attachment JSON when DataQuery.disabled is true', () => {
      const dataQueries: DataQuery[] = [
        { urn: 'TEST:DS(1.0)', disabled: true, metadata: BASE_METADATA },
      ];

      const message = prepareSystemMessage(undefined, undefined, dataQueries);
      const data = JSON.parse(
        (message.custom_content!.attachments![0] as any).data,
      );

      expect(data.disabled).toBe(true);
    });

    it('omits disabled field from attachment JSON when DataQuery.disabled is undefined', () => {
      const dataQueries: DataQuery[] = [
        { urn: 'TEST:DS(1.0)', metadata: BASE_METADATA },
      ];

      const message = prepareSystemMessage(undefined, undefined, dataQueries);
      const data = JSON.parse(
        (message.custom_content!.attachments![0] as any).data,
      );

      expect('disabled' in data).toBe(false);
    });
  });
});
