'use client';

import { FC, useCallback, useEffect, useState } from 'react';

import { PopUpSize, PopUpState } from '@statgpt/ui-components/src/types/pop-up';
import { Popup } from '@statgpt/ui-components/src/components/Popup/Popup';
import { StructureComponentValue } from '../../../models/structure-component';
import MetadataDescriptionItem from './MetadataDescriptionItem';
import MetadataItem from './MetadataItem';
import { ConversationViewTitles } from '../../../models/titles';

interface Props {
  metadata?: StructureComponentValue[];
  metadataDescription?: StructureComponentValue[];
  isOpenMetadata?: boolean;
  onCloseMetadata?: () => void;
  titles?: ConversationViewTitles;
}

const Metadata: FC<Props> = ({
  metadata,
  metadataDescription = [],
  isOpenMetadata,
  onCloseMetadata,
  titles,
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
          <div className="metadata-content overflow-hidden h-full">
            {metadataDescription?.length > 0 && (
              <div className="metadata-description">
                {metadataDescription?.map((descriptionItem) => (
                  <MetadataDescriptionItem
                    key={descriptionItem?.title}
                    title={descriptionItem?.title}
                    value={descriptionItem?.value}
                  />
                ))}
              </div>
            )}
            <div className="h-full overflow-y-auto metadata-list">
              {metadata && metadata?.length > 0 ? (
                metadata?.map((metadataItem) => (
                  <MetadataItem
                    key={metadataItem?.id || metadataItem?.title}
                    title={metadataItem?.title}
                    value={metadataItem?.value}
                    attachedKeysTitles={metadataItem?.attachedKeysTitles}
                  />
                ))
              ) : (
                <div className="metadata-empty text-neutrals-700 flex h-full justify-center items-center">
                  {titles?.noMetadata || 'No metadata'}
                </div>
              )}
            </div>
          </div>
          <div></div>
        </Popup>
      )}
    </>
  );
};

export default Metadata;
