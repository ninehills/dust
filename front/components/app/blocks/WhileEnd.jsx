import Block from "./Block";
import { classNames, shallowBlockClone } from "@app/lib/utils";
import dynamic from "next/dynamic";
import "@uiw/react-textarea-code-editor/dist.css";

const CodeEditor = dynamic(
  () => import("@uiw/react-textarea-code-editor").then((mod) => mod.default),
  { ssr: false }
);

export function While({
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
  const handleConditionCodeChange = (conditionCode) => {
    let b = shallowBlockClone(block);
    b.spec.condition_code = conditionCode;
    onBlockUpdate(b);
  };

  const handleMaxIterationsChange = (maxIterations) => {
    let b = shallowBlockClone(block);
    b.spec.max_iterations = maxIterations;
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
      <div className="mx-4 flex w-full flex-col">
        <div className="flex flex-col lg:flex-row lg:space-x-4">
          <div className="flex flex-initial flex-row items-center space-x-1 text-sm font-medium leading-8 text-gray-700">
            <div className="flex flex-initial">max_iterations:</div>
            <div className="flex flex-initial font-normal">
              <input
                type="text"
                className={classNames(
                  "block w-8 flex-1 rounded-md px-1 py-1 text-sm font-normal",
                  readOnly
                    ? "border-white ring-0 focus:border-white focus:ring-0"
                    : "border-white focus:border-gray-300 focus:ring-0"
                )}
                spellCheck={false}
                readOnly={readOnly}
                value={block.spec.max_iterations}
                onChange={(e) => handleMaxIterationsChange(e.target.value)}
              />
            </div>
          </div>
        </div>
        <div className="flex flex-col space-y-1 text-sm font-medium leading-8 text-gray-700">
          <div className="flex flex-initial items-center">condition :</div>
          <div className="flex w-full font-normal">
            <div className="w-full leading-4">
              <div
                className={classNames(
                  "border bg-slate-100",
                  false ? "border-red-500" : "border-slate-100"
                )}
              >
                <CodeEditor
                  readOnly={readOnly}
                  value={block.spec.condition_code}
                  language="js"
                  placeholder=""
                  onChange={(e) => handleConditionCodeChange(e.target.value)}
                  padding={15}
                  style={{
                    fontSize: 12,
                    fontFamily:
                      "ui-monospace, SFMono-Regular, SF Mono, Consolas, Liberation Mono, Menlo, monospace",
                    backgroundColor: "rgb(241 245 249)",
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Block>
  );
}

export function End({
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
    ></Block>
  );
}
