'use client';

import { FC, useCallback, useEffect, useState } from 'react';
import { Popup, PopUpSize, PopUpState } from '@epam/statgpt-ui-components';
import { ChartUnit } from '../../models/charting';
import ReactECharts from 'echarts-for-react';
import ChartSidebar from './CustomAttachments/ChartSidebar';
import { useConversationViewStyles } from '../../context/ConversationViewStylesContext';
import DatasetIcon from '../../assets/icons/dataset.svg';

interface Props {
  chart: ChartUnit;
  isOpen?: boolean;
  datasetTitle?: string;
  onClose?: () => void;
}

const SingleLineChart: FC<Props> = ({
  chart,
  isOpen,
  onClose,
  datasetTitle,
}) => {
  const { titles } = useConversationViewStyles();
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
          <div className="single-chart-popup-content flex h-full min-h-0 flex-1 flex-row gap-4">
            <div className="flex min-h-0 flex-1 flex-col">
              {datasetTitle && (
                <div className="mb-2 flex items-center gap-1">
                  <DatasetIcon className="size-4 shrink-0 text-neutrals-1000" />
                  <h4 className="text-neutrals-1000">{datasetTitle}</h4>
                </div>
              )}
              <ReactECharts
                option={chart.config}
                className="size-full"
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
