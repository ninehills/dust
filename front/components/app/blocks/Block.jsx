import { classNames } from "@app/lib/utils";
import {
  TrashIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  ArrowPathIcon,
  PlusIcon,
  PlusCircleIcon,
} from "@heroicons/react/20/solid";
import { CircleStackIcon } from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import Output from "./Output";
import NewBlock from "@app/components/app/NewBlock";
import { Spinner } from "@app/components/Spinner";

export default function Block({
  owner,
  app,
  spec,
  run,
  block,
  status,
  running,
  readOnly,
  children,
  canUseCache,
  onBlockUpdate,
  onBlockDelete,
  onBlockUp,
  onBlockDown,
  onBlockNew,
}) {
  const handleNameChange = (name) => {
    let b = Object.assign({}, block);
    b.name = name;
    onBlockUpdate(b);
  };

  const handleUseCacheChange = (useCache) => {
    let b = Object.assign({}, block);
    b.config.use_cache = useCache;
    onBlockUpdate(b);
  };

  const [nameError, setNameError] = useState(null);

  const nameValidation = (name) => {
    let valid = true;
    if (!name.match(/^[A-Z0-9_]+$/)) {
      setNameError(
        "Block name must only contain uppercase letters, numbers, and the character `_`."
      );
      valid = false;
    } else {
      setNameError(null);
    }
    return valid;
  };

  useEffect(() => {
    nameValidation(block.name);
    if (canUseCache && block.config.use_cache === undefined) {
      handleUseCacheChange(true);
    }
  });

  return (
    <div className="">
      <div
        className={classNames(
          block.indent == 1 ? "ml-8" : "ml-0",
          "group flex flex-auto flex-col rounded border border-gray-300 px-4 pt-1 pb-3"
        )}
      >
        <div className="flex flex-row items-center">
          <div className="mr-2 flex-initial">
            <div className="">
              <span className="rounded-md bg-gray-200 px-1 py-0.5 text-sm font-medium">
                {block.type}
              </span>
            </div>
          </div>

          <div className="flex flex-auto pr-2 font-bold text-gray-700">
            <input
              type="text"
              placeholder="BLOCK_NAME"
              className={classNames(
                "block w-full rounded-md py-1 px-1 uppercase placeholder-gray-200",
                readOnly
                  ? "border-white ring-0 focus:border-white focus:ring-0"
                  : nameError != null
                  ? "border-orange-400 focus:border-orange-400 focus:ring-0"
                  : "border-white focus:border-gray-300 focus:ring-0"
              )}
              readOnly={readOnly}
              value={block.name}
              onChange={(e) => handleNameChange(e.target.value.toUpperCase())}
            />
          </div>

          <div
            className={classNames(
              readOnly || !canUseCache
                ? "hidden"
                : "ml-1 mr-2 flex flex-initial flex-row space-x-1"
            )}
          >
            {block.config && block.config.use_cache ? (
              <div
                className="flex flex-initial cursor-pointer text-gray-400"
                onClick={() => {
                  handleUseCacheChange(false);
                }}
              >
                <CircleStackIcon className="h-4 w-4" />
              </div>
            ) : (
              <div
                className="flex flex-initial cursor-pointer text-gray-400"
                onClick={() => {
                  handleUseCacheChange(true);
                }}
              >
                <ArrowPathIcon className="h-4 w-4" />
              </div>
            )}
          </div>

          <div
            className={classNames(
              readOnly
                ? "hidden"
                : "flex flex-initial flex-row items-center space-x-1"
            )}
          >
            <div className="mr-1 mt-1 flex-initial text-gray-400">
              <NewBlock
                disabled={readOnly}
                onClick={onBlockNew}
                spec={spec}
                direction="down"
                small={true}
              />
            </div>
            <div
              className="flex-initial cursor-pointer text-gray-400"
              onClick={onBlockUp}
            >
              <ChevronUpIcon className="h-4 w-4 hover:text-gray-700" />
            </div>
            <div
              className="flex-initial cursor-pointer text-gray-400"
              onClick={onBlockDown}
            >
              <ChevronDownIcon className="h-4 w-4 hover:text-gray-700" />
            </div>
            <div
              className="flex-initial cursor-pointer text-gray-400"
              onClick={onBlockDelete}
            >
              <TrashIcon className="ml-2 h-4 w-4 hover:text-red-700" />
            </div>
          </div>
        </div>
        <div className="flex">{children}</div>
      </div>

      <div className={classNames(block.indent == 1 ? "ml-8" : "ml-0", "py-1")}>
        {status &&
        status.status == "running" &&
        !["map", "reduce", "end"].includes(block.type) ? (
          <div className="flex flex-row items-center text-sm text-gray-400">
            <div className="mr-2 ml-2">
              <Spinner />
            </div>
            {` ${status.success_count} successes ${status.error_count} errors`}
          </div>
        ) : running && !(status && status.status != "running") ? (
          <div className="flex flex-row items-center text-sm text-gray-400">
            <div role="status">
              <div className="mr-2 ml-2">
                <Spinner />
              </div>
            </div>
            {` 0 successes 0 errors`}
          </div>
        ) : null}
        {status && status.status != "running" ? (
          <Output
            owner={owner}
            runId={run.run_id}
            block={block}
            status={status}
            app={app}
          />
        ) : null}
      </div>
    </div>
  );
}
