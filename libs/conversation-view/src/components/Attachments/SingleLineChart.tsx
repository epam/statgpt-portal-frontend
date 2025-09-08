'use client';

import { FC, useCallback, useEffect, useState } from 'react';
import { PopUpSize, PopUpState } from '@statgpt/ui-components/src/types/pop-up';
import { Popup } from '@statgpt/ui-components/src/components/Popup/Popup';
import { ChartUnit } from '@statgpt/conversation-view/src/models/charting';
import ReactECharts from 'echarts-for-react';
import ChartSidebar from '@statgpt/conversation-view/src/components/Attachments/CustomAttachments/ChartSidebar';
import { ConversationViewTitles } from '@statgpt/conversation-view/src/models/titles';

interface Props {
  chart: ChartUnit;
  isOpen?: boolean;
  titles?: ConversationViewTitles;
  onClose?: () => void;
}

const SingleLineChart: FC<Props> = ({ titles, chart, isOpen, onClose }) => {
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
