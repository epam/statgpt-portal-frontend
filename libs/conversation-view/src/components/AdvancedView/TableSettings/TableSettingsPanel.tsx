import { InputWithIcon } from '@epam/statgpt-ui-components';
import { DraggableListExample } from './DraggableListExample';
import { IconRotate, IconSearch, IconX } from '@tabler/icons-react';
import { useCallback, useMemo, useState } from 'react';

export const TableSettingsPanel = ({
  onReset,
  onClose,
}: {
  onReset?: () => void;
  onClose?: () => void;
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const changeSearchHandler = useCallback(
    (search: string) => {
      setSearchQuery(search);
    },
    [setSearchQuery],
  );

  const clearSearchHandler = useCallback(
    () => setSearchQuery(''),
    [setSearchQuery],
  );

  const clearSearchButton = useMemo(
    () => (
      <button onClick={clearSearchHandler}>
        <IconX className="text-neutrals-1000 size-4" />
      </button>
    ),
    [clearSearchHandler],
  );

  const resetHandler = useCallback(() => {
    onReset?.();
    console.log('reset');
  }, [onReset]);

  const closeHandler = useCallback(() => {
    onClose?.();
    console.log('close');
  }, [onClose]);

  return (
    <div className="h-full w-[362px] bg-white border-l border-neutrals-500 flex flex-col overflow-hidden">
      <div className="flex justify-between border-b border-neutrals-500 px-5 py-6">
        <div className="h2 text-neutrals-1000">Columns</div>
        <div className="flex gap-2 items-center">
          <button
            className="text-neutrals-800 flex gap-1 items-center"
            onClick={resetHandler}
          >
            <IconRotate className="rotate-180 size-4" /> Reset
          </button>
          <div className="h-3 w-[1px] bg-neutrals-600" />
          <button onClick={closeHandler}>
            <IconX className="size-5 text-neutrals-1000" />
          </button>
        </div>
      </div>
      <div className="px-5 py-7 flex flex-col gap-2 h-full">
        <InputWithIcon
          inputId="filters-search-input"
          containerClasses={'items-center filters-search-input gap-1 !p-2'}
          cssClass="filters-search-input-text"
          placeholder="Search"
          iconBeforeInput={<IconSearch className="text-neutrals-1000 size-4" />}
          iconAfterInput={searchQuery ? clearSearchButton : undefined}
          value={searchQuery}
          onChange={changeSearchHandler}
        />
        <div className="overflow-y-scroll h-[calc(100%-104px)]">
          <DraggableListExample searchQuery={searchQuery} />
        </div>
      </div>
    </div>
  );
};
