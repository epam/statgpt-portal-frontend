'use client';

import { FC, useCallback, useEffect, useState } from 'react';

import { Popup, PopUpSize, PopUpState } from '@epam/statgpt-ui-components';
import { StructureComponentValue } from '../../../models/structure-component';
import { ConversationViewTitles } from '../../../models/titles';
import MetadataContent from './MetadataContent';

interface Props {
  metadata?: StructureComponentValue[];
  metadataDescription?: StructureComponentValue[];
  isOpenMetadata?: boolean;
  onCloseMetadata?: () => void;
  titles?: ConversationViewTitles;
  locale: string;
}

const Metadata: FC<Props> = ({
  metadata,
  metadataDescription = [],
  isOpenMetadata,
  onCloseMetadata,
  titles,
  locale,
}) => {
  const [modalState, setModalState] = useState(PopUpState.Closed);

  useEffect(() => {
    if (isOpenMetadata) {
      setModalState(PopUpState.Opened);
    } else {
      setModalState(PopUpState.Closed);
    }
  }, [isOpenMetadata]);

  const onClose = useCallback((): void => {
    setModalState(PopUpState.Closed);
    onCloseMetadata?.();
  }, [onCloseMetadata]);

  return (
    <>
      {modalState === PopUpState.Opened && (
        <Popup
          heading={
            <h1 className="metadata-heading">
              {titles?.metadata || 'Metadata'}
            </h1>
          }
          containerClassName="metadata h-[80%]"
          portalId="metadata"
          size={PopUpSize.LG}
          dividers={false}
          onClose={onClose}
          closeButtonTitle={titles?.close || 'Close'}
        >
          <MetadataContent
            titles={titles}
            locale={locale}
            metadata={metadata}
            metadataDescription={metadataDescription}
          />
          <div></div>
        </Popup>
      )}
    </>
  );
};

export default Metadata;
