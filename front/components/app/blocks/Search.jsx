import Block from "./Block";
import { Menu } from "@headlessui/react";
import { classNames, shallowBlockClone } from "@app/lib/utils";
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import { useProviders } from "@app/lib/swr";
import { filterServiceProviders } from "@app/lib/providers";
import Link from "next/link";

export default function Search({
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
  let { providers, isProvidersLoading, isProvidersError } = readOnly
    ? {
        providers: [],
        isProvidersLoading: false,
        isProvidersError: false,
      }
    : useProviders();
  const serviceProviders = filterServiceProviders(providers);
  const searchProviders = serviceProviders?.filter?.(
    (p) => p.providerId === "serpapi" || p.providerId === "serper"
  );

  const currentProvider = searchProviders?.find?.(
    (p) => p.providerId === block.config.provider_id
  );

  // Update the config to impact run state based on the serpAPI provider presence.
  if (!readOnly && !isProvidersLoading && !isProvidersError) {
    if (!!block.config.provider_id && !currentProvider) {
      setTimeout(() => {
        let b = shallowBlockClone(block);
        b.config.provider_id = "";
        onBlockUpdate(b);
      });
    }
  }

  const handleQueryChange = (query) => {
    let b = shallowBlockClone(block);
    b.spec.query = query;
    onBlockUpdate(b);
  };

  const handleNumChange = (num) => {
    let b = shallowBlockClone(block);
    b.spec.num = num;
    onBlockUpdate(b);
  };

  const handleSelectProvider = (providerId) => {
    const b = shallowBlockClone(block);
    b.config.provider_id = providerId;
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
      canUseCache={true}
      onBlockUpdate={onBlockUpdate}
      onBlockDelete={onBlockDelete}
      onBlockUp={onBlockUp}
      onBlockDown={onBlockDown}
      onBlockNew={onBlockNew}
    >
      <div className="mx-4 flex w-full flex-col">
        <div className="flex flex-initial flex-row items-center space-x-1 text-sm font-medium leading-8 text-gray-700">
          <div className="flex flex-initial">provider:</div>
          {/* Owner has zero search providers */}
          {!isProvidersLoading &&
            !readOnly &&
            searchProviders?.length === 0 && (
              <div className="px-2">
                {searchProviders?.length === 0 && (
                  <Link
                    href={`/${owner.username}/providers`}
                    className={classNames(
                      "inline-flex items-center rounded-md py-1 text-sm font-normal",
                      "border px-3",
                      readOnly
                        ? "border-white text-gray-300"
                        : "border-orange-400 text-gray-700",
                      "focus:outline-none focus:ring-0"
                    )}
                  >
                    Setup provider
                  </Link>
                )}
              </div>
            )}

          {!isProvidersLoading && !readOnly && searchProviders?.length > 0 && (
            <Menu as="div" className="relative inline-block text-left">
              <Menu.Button
                className={classNames(
                  "inline-flex items-center rounded-md py-1 text-sm font-bold",
                  !!currentProvider?.providerId ? "px-0" : "border px-3",
                  readOnly
                    ? "border-white text-gray-300"
                    : "border-orange-400 text-gray-700",
                  "focus:outline-none focus:ring-0"
                )}
                readOnly={readOnly}
              >
                {!!currentProvider?.providerId ? (
                  <>
                    {currentProvider.providerId}&nbsp;
                    <ChevronDownIcon className="mt-0.5 h-4 w-4 hover:text-gray-700" />
                  </>
                ) : (
                  "Select provider"
                )}
              </Menu.Button>

              <Menu.Items
                className={classNames(
                  "absolute z-10 mt-1 w-max origin-top-left rounded-md bg-white shadow ring-1 ring-black ring-opacity-5 focus:outline-none",
                  !!currentProvider?.providerId > 0 ? "-left-4" : "left-1"
                )}
              >
                <div className="py-1">
                  {(searchProviders || []).map((p) => {
                    return (
                      <Menu.Item
                        key={p.id}
                        onClick={() => handleSelectProvider(p.providerId)}
                      >
                        {({ active }) => (
                          <span
                            className={classNames(
                              active
                                ? "bg-gray-50 text-gray-900"
                                : "text-gray-700",
                              "block cursor-pointer px-4 py-2 text-sm"
                            )}
                          >
                            {p.providerId}
                          </span>
                        )}
                      </Menu.Item>
                    );
                  })}
                </div>
              </Menu.Items>
            </Menu>
          )}
        </div>
        <div className="flex flex-col xl:flex-row xl:space-x-2">
          <div className="flex flex-initial flex-row items-center space-x-1 text-sm font-medium leading-8 text-gray-700">
            <div className="flex flex-initial">num:</div>
            <div className="flex flex-initial font-normal">
              <input
                type="text"
                className={classNames(
                  "block w-8 flex-1 rounded-md px-1 py-1 text-sm font-normal",
                  readOnly
                    ? "border-white ring-0 focus:border-white focus:ring-0"
                    : "border-white focus:border-gray-300 focus:ring-0"
                )}
                readOnly={readOnly}
                value={block.spec.num}
                onChange={(e) => handleNumChange(e.target.value)}
              />
            </div>
          </div>
        </div>
        <div className="flex flex-col space-y-1 text-sm font-medium leading-8 text-gray-700">
          <div className="flex flex-initial flex-row items-center space-x-1">
            <div className="flex flex-initial items-center">query:</div>
          </div>

          <div className="flex w-full font-normal">
            <input
              type="text"
              placeholder=""
              className={classNames(
                "block w-full resize-none bg-slate-100 px-1 py-1 font-mono text-[13px] font-normal",
                readOnly
                  ? "border-white ring-0 focus:border-white focus:ring-0"
                  : "border-white focus:border-white focus:ring-0"
              )}
              readOnly={readOnly}
              value={block.spec.query}
              onChange={(e) => handleQueryChange(e.target.value)}
            />
          </div>
        </div>
      </div>
    </Block>
  );
}
