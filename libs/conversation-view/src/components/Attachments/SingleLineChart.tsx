'use client';

import { FC, useCallback, useEffect, useState } from 'react';
import { Popup, PopUpSize, PopUpState } from '@epam/statgpt-ui-components';
import { ChartUnit } from '../../models/charting';
import ReactECharts from 'echarts-for-react';
import ChartSidebar from './CustomAttachments/ChartSidebar';
import { ConversationViewTitles } from '../../models/titles';
import DatasetIcon from '../../assets/icons/dataset.svg';

interface Props {
  chart: ChartUnit;
  isOpen?: boolean;
  titles?: ConversationViewTitles;
  datasetTitle?: string;
  onClose?: () => void;
}

const SingleLineChart: FC<Props> = ({
  titles,
  chart,
  isOpen,
  onClose,
  datasetTitle,
}) => {
  const [modalState, setModalState] = useState(PopUpState.Closed);

  useEffect(() => {
    if (isOpen) {
      setModalState(PopUpState.Opened);
    } else {
      setModalState(PopUpState.Closed);
    }
  }, [isOpen]);

  const onClosePopup = useCallback((): void => {
    setModalState(PopUpState.Closed);
    onClose?.();
  }, [onClose]);

  return (
    <>
      {modalState === PopUpState.Opened && (
        <Popup
          heading={
            <h1 className="single-chart-popup-heading">
              {titles?.chart ?? 'Chart'}
            </h1>
          }
          containerClassName="single-chart-popup h-[80%]"
          portalId="single-chart"
          size={PopUpSize.LG}
          dividers={false}
          onClose={onClosePopup}
          closeButtonTitle={titles?.close ?? 'Close'}
        >
          <div className="single-chart-popup-content flex flex-row flex-1 gap-4 min-h-0 h-full">
            <div className="flex flex-col flex-1 min-h-0">
              {datasetTitle && (
                <div className="flex items-center gap-1 mb-2">
                  <DatasetIcon className="w-4 h-4 text-neutrals-1000 flex-shrink-0" />
                  <span className="text-[12px] leading-4 font-semibold text-neutrals-1000">
                    {datasetTitle}
                  </span>
                </div>
              )}
              <ReactECharts
                option={chart.config}
                className="w-full h-full"
                style={{ width: '100%', height: '100%' }}
              />
            </div>
            <ChartSidebar dimensionsInfo={chart.dimensions}></ChartSidebar>
          </div>
          <div></div>
        </Popup>
      )}
    </>
  );
};

export default SingleLineChart;
