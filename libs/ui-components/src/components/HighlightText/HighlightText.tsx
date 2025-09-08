import { FC, useMemo } from 'react';
import classNames from 'classnames';

interface Props {
  text?: string;
  highlightText?: string;
}

interface HighlightText {
  id?: number;
  text?: string;
  highlight?: boolean;
}

export const HighlightText: FC<Props> = ({ text, highlightText }) => {
  const convertedText: HighlightText[] = useMemo(() => {
    const resultText: HighlightText[] = [];

    if (!highlightText) {
      return [{ id: 0, text, highlight: false }];
    }

    const lowerHighlightText = highlightText?.toLowerCase() || '';
    const splittedText = text?.toLowerCase()?.split(lowerHighlightText) || '';

    for (let i = 0, currentTextLength = 0; i < splittedText?.length; i++) {
      const item = splittedText?.[i];
      const itemLength = item.length;

      if (item !== '') {
        resultText.push({
          id: resultText.length,
          highlight: false,
          text: text?.substring(
            currentTextLength,
            currentTextLength + itemLength,
          ),
        });
      }

      currentTextLength += itemLength;

      if (i !== splittedText?.length - 1) {
        resultText.push({
          id: resultText.length,
          highlight: true,
          text: text?.substring(
            currentTextLength,
            currentTextLength + highlightText.length,
          ),
        });
        currentTextLength += highlightText.length;
      }
    }

    return resultText;
  }, [highlightText, text]);

  return (
    <>
      {convertedText.map((textItem) => (
        <span
          key={textItem?.id}
          className={classNames(textItem?.highlight && 'bg-highlight')}
        >
          {textItem?.text}
        </span>
      ))}
    </>
  );
};
