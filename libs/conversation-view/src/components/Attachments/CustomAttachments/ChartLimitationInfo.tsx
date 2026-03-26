'use client';

import { FC, useState } from 'react';
import {
  safePolygon,
  useFloating,
  useHover,
  useInteractions,
} from '@floating-ui/react';
import { ConversationViewTitles } from '../../../models/titles';

interface Props {
  limitAmount: number;
  openAdvancedView?: () => void;
  titles?: ConversationViewTitles;
}

const ChartLimitationInfo: FC<Props> = ({
  limitAmount,
  titles,
  openAdvancedView,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    placement: 'top-start',
  });
  const hover = useHover(context, {
    handleClose: safePolygon({
      blockPointerEvents: true,
    }),
  });
  const { getReferenceProps, getFloatingProps } = useInteractions([hover]);

  return (
    <>
      <div
        className="flex w-fit"
        ref={refs.setReference}
        {...getReferenceProps()}
      >
        <div className="mt-1 flex w-fit gap-1 bg-hues-100 px-4 py-2">
          <h5 className="font-bold">{titles?.limits || 'Limited to'}</h5>
          <h5>
            {limitAmount} {titles?.timeseriesLimit || 'Timeseries'}
          </h5>
        </div>
      </div>
      {isOpen && (
        <div
          className="floating"
          ref={refs.setFloating}
          style={floatingStyles}
          {...getFloatingProps()}
        >
          <div className="z-10 mb-2 flex w-[300px] flex-col gap-2 rounded bg-white p-4 shadow">
            <div>
              <h5 className="text-neutrals-900">
                <span className="pr-0.5">
                  {titles?.limitLinkInfoP1_1 ||
                    'The number of timeseries displayed in a single chart i'}
                </span>
                <span className="pr-0.5 font-bold">
                  {titles?.limitLinkInfoP1_2 || 'limited to'} {limitAmount}
                </span>
                {titles?.limitLinkInfoP1_3 ||
                  'for better clarity and performance.'}
              </h5>
              <h5 className="text-neutrals-900">
                <span className="pr-0.5">
                  {titles?.limitLinkInfoP2_1 ||
                    'To visualize specific timeseries'}
                </span>
                <span className="pr-0.5 font-bold">
                  {titles?.limitLinkInfoP2_2 || 'filter'}
                </span>
                <span className="pr-0.5">
                  {titles?.limitLinkInfoP2_3 || 'your request, or'}
                </span>
                <span className="pr-0.5 font-bold">
                  {titles?.limitLinkInfoP2_4 || 'refine'}
                </span>
                {titles?.limitLinkInfoP2_5 || 'it in the chat.'}
              </h5>
            </div>

            {openAdvancedView && (
              <h4
                className="cursor-pointer text-primary"
                onClick={openAdvancedView}
              >
                {titles?.limitLinkInfoLink || 'Open Advanced View'}
              </h4>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default ChartLimitationInfo;
