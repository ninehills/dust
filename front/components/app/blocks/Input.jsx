import Block from "./Block";
import { shallowBlockClone } from "@app/lib/utils";
import DatasetPicker from "@app/components/app/DatasetPicker";

export default function Input({
  owner,
  app,
  spec,
  run,
  block,
  status,
  running,
  readOnly,
  onBlockUpdate,
  onBlockDelete,
  onBlockUp,
  onBlockDown,
  onBlockNew,
}) {
  const handleSetDataset = (dataset) => {
    let b = shallowBlockClone(block);
    b.config.dataset = dataset;
    onBlockUpdate(b);
  };

  return (
    <Block
      owner={owner}
      app={app}
      spec={spec}
      run={run}
      block={block}
      status={status}
      running={running}
      readOnly={readOnly}
      onBlockUpdate={onBlockUpdate}
      onBlockDelete={onBlockDelete}
      onBlockUp={onBlockUp}
      onBlockDown={onBlockDown}
      onBlockNew={onBlockNew}
    >
      <div className="mx-4 flex flex-col sm:flex-row sm:space-x-2">
        <div className="flex flex-row items-center space-x-2 text-sm font-medium leading-8 text-gray-700">
          {!((!block.config || !block.config.dataset) && readOnly) ? (
            <>
              <div className="flex flex-initial">dataset:</div>
              <DatasetPicker
                owner={owner}
                app={app}
                dataset={block.config ? block.config.dataset : ""}
                onDatasetUpdate={handleSetDataset}
                readOnly={readOnly}
              />
            </>
          ) : null}
        </div>
      </div>
    </Block>
  );
}
