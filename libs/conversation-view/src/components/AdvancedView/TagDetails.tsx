'use client';

import DatasetIcon from '../../assets/icons/dataset.svg';
import Explore from '../../assets/icons/explore.svg';
import { Button } from '@epam/statgpt-ui-components';
import { Dataflow } from '@epam/statgpt-sdmx-toolkit';
import { IconArrowLeft, IconArrowRight } from '@tabler/icons-react';
import classNames from 'classnames';
import { FC, useState } from 'react';
import { useConversationViewTitles } from '../../context/ConversationViewTitlesContext';

interface Props {
  datasets?: Dataflow[];
  locale: string;
}
// TODO: review styles after implementation
const TagDetails: FC<Props> = ({ datasets = [], locale }) => {
  const titles = useConversationViewTitles();
  const [showTagDetails, setShowTagDetails] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<number>(0);

  const onPreviousArrowClick = () => {
    if (activeTab > 0) {
      setActiveTab((prev) => prev - 1);
    }
  };

  const onNextArrowClick = () => {
    if (activeTab < datasets?.length - 1) {
      setActiveTab((prev) => prev + 1);
    }
  };

  const onMouseEnter = () => {
    setShowTagDetails(true);
  };

  const onMouseLeave = () => {
    setShowTagDetails(false);
  };

  return (
    <div
      className="relative"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <p
        className={classNames(
          'flex gap-1 items-center body-3 w-[fit-content] mb-1 cursor-pointer',
          'dataset-tag py-1 px-2 rounded border border-neutrals-600 bg-neutrals-100',
          showTagDetails
            ? 'border-neutrals-800 bg-neutrals-700 text-white dataset-tag-active'
            : '',
        )}
      >
        <DatasetIcon className="w-4 h-3" />
        {titles?.dataset ?? 'Dataset'}
      </p>
      {showTagDetails && (
        <div className="absolute w-[363px] min-h-[100px] left-0 top-[26px] z-[4] text-black">
          <div className="bg-white shadow mt-1 flex flex-col gap-1">
            {datasets.length > 1 ? (
              <div
                className={classNames(
                  'flex align-center justify-between bg-neutrals-100 py-1 px-4',
                  'dataset-tag-header',
                )}
              >
                <div className="flex gap-2">
                  <IconArrowLeft
                    className={classNames(
                      'w-3 h-3 cursor-pointer',
                      activeTab === 0 ? 'text-neutrals-700' : '',
                    )}
                    onClick={onPreviousArrowClick}
                  />
                  <IconArrowRight
                    className={classNames(
                      'w-3 h-3 cursor-pointer',
                      activeTab === datasets?.length - 1
                        ? 'text-neutrals-700'
                        : '',
                    )}
                    onClick={onNextArrowClick}
                  />
                </div>
                <p className="text-neutrals-700">
                  {activeTab + 1}/{datasets.length}
                </p>
              </div>
            ) : null}
            <div className="px-[16px] pt-[8px] flex flex-col gap-1">
              <p
                className={classNames(
                  'gap-1 items-center relative inline-block w-[fit-content]',
                  'dataset-tag-details',
                  'py-1 px-2 rounded-[20px] bg-accent-500 body-3',
                )}
              >
                <DatasetIcon className="w-4 h-4" />
                {titles?.dataset ?? 'Dataset'}
              </p>
              <h3 className="two-lines max-h-[48px]">
                {datasets?.[activeTab]?.names?.[locale] ||
                  datasets?.[activeTab]?.name}
              </h3>
              <p
                className={
                  'text-neutrals-700 two-lines max-h-[32px] body-3  dataset-tag-details-description'
                }
              >
                {datasets?.[activeTab]?.descriptions?.[locale] ||
                  datasets?.[activeTab]?.description}
              </p>
              <div className="mx-[-8px]">
                <Button
                  iconBefore={<Explore width={16} height={16} />}
                  title={titles?.explore ?? 'Explore data'}
                  isSmallButton={true}
                  buttonClassName="text-button-tertiary py-0"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TagDetails;
