/**
 * Message merging utilities for streaming chat responses
 *
 * Provides functions to merge partial message updates from streaming APIs
 * into complete message objects, supporting incremental content updates,
 * role assignments, and error message handling during real-time chat.
 */
import { Role, Stage } from '@epam/ai-dial-shared';
import { Message } from '../models/message';

const mergeStages = (sourceStages: Stage[], newStages: Stage[]) => {
  const sourceStagesReducer = sourceStages?.reduce(
    (stagesMap, currentStage) => {
      stagesMap[currentStage.index] = currentStage;

      return stagesMap;
    },
    {} as Record<number, Stage>,
  );

  newStages.forEach((stage) => {
    if (sourceStagesReducer[stage.index]) {
      if (stage.attachments) {
        sourceStagesReducer[stage.index].attachments = (
          sourceStagesReducer[stage.index].attachments || []
        ).concat(stage.attachments);
      }

      if (stage.content) {
        sourceStagesReducer[stage.index].content =
          (sourceStagesReducer[stage.index].content || '') + stage.content;
      }

      if (stage.name) {
        sourceStagesReducer[stage.index].name =
          (sourceStagesReducer[stage.index].name || '') + stage.name;
      }

      if (stage.status) {
        sourceStagesReducer[stage.index].status = stage.status;
      }
    } else {
      sourceStagesReducer[stage.index] = stage;
    }
  });

  return Object.values(sourceStagesReducer);
};

export const mergeMessages = (
  source: Message,
  newMessages: Partial<Message>[],
): Message => {
  const newSource = structuredClone(source);

  newMessages.forEach((newData) => {
    if (newData.errorMessage) {
      newSource.errorMessage = newData.errorMessage;
    }

    if (newData.role) {
      newSource.role = newData.role as Role;
    }

    if (newData.responseId) {
      newSource.responseId = newData.responseId;
    }

    if (newData.content) {
      updateContent(newSource, newData);
    }

    if (newData.custom_content) {
      if (!newSource.custom_content) {
        newSource.custom_content = {};
      }

      if (newData.custom_content.attachments) {
        if (!newSource.custom_content.attachments) {
          newSource.custom_content.attachments = [];
        }

        newSource.custom_content.attachments =
          newSource.custom_content.attachments.concat(
            newData.custom_content.attachments,
          );
      }

      if (newData.custom_content.stages) {
        if (!newSource.custom_content.stages) {
          newSource.custom_content.stages = [];
        }
        newSource.custom_content.stages = mergeStages(
          newSource.custom_content.stages,
          newData.custom_content.stages,
        );
      }

      if (newData.custom_content.state) {
        newSource.custom_content.state = newData.custom_content.state;
      }

      if (newData.custom_content.form_schema) {
        newSource.custom_content.form_schema =
          newData.custom_content.form_schema;
      }

      if (newData.custom_content.form_value) {
        newSource.custom_content.form_value = newData.custom_content.form_value;
      }
    }
  });

  return newSource;
};

function updateContent(resultSource: Message, newData: Partial<Message>): void {
  if (newData.content) {
    const number = needDeleteCharsCount(newData.content);
    if (number != null) {
      resultSource.content = resultSource.content.slice(0, -number);
    } else {
      resultSource.content = `${resultSource.content || ''}${newData.content}`;
    }
  }
}

function needDeleteCharsCount(str: string): number | null {
  const match = str.match(/delete_chars\((\d+)\)/);
  if (match != null) {
    return parseInt(match[1], 10);
  } else {
    return null;
  }
}
