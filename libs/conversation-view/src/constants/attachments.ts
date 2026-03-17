import {
  CrossDatasetGridAttachment,
  CustomChartAttachmentType,
  CustomGridAttachment,
} from '../models/attachments';
import { AttachmentType } from '@epam/statgpt-dial-toolkit';

export const DEFAULT_GRID_ATTACHMENT_TITLE = 'Data Grid';
export const DEFAULT_CROSS_DATASET_GRID_ATTACHMENT_TITLE = 'Data';
export const DEFAULT_CHART_ATTACHMENT_TITLE = 'Chart';

export const createInitialGridAttachment = (
  title?: string,
): CustomGridAttachment => {
  return {
    title: title || DEFAULT_GRID_ATTACHMENT_TITLE,
    type: AttachmentType.CUSTOM_DATA_GRID,
  };
};

export const createInitialChartAttachment = (
  title?: string,
): CustomChartAttachmentType => {
  return {
    title: title || DEFAULT_CHART_ATTACHMENT_TITLE,
    type: AttachmentType.CUSTOM_CHART,
  };
};

export const createInitialCrossDatasetGridAttachment = (
  title?: string,
): CrossDatasetGridAttachment => {
  return {
    title: title || DEFAULT_CROSS_DATASET_GRID_ATTACHMENT_TITLE,
    type: AttachmentType.CROSS_DATASET_GRID,
  };
};
