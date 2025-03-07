export type BlockType =
  | "input"
  | "data"
  | "data_source"
  | "code"
  | "llm"
  | "chat"
  | "map"
  | "reduce"
  | "while"
  | "end"
  | "search"
  | "curl"
  | "browser";

export type RunRunType = "deploy" | "local" | "execute";
type Status = "running" | "succeeded" | "errored";

export type RunConfig = {
  blocks: { [key: string]: any };
};

export type RunStatus = {
  run: Status;
  blocks: BlockStatus[];
};

export type BlockStatus = {
  block_type: BlockType;
  name: string;
  status: Status;
  success_count: number;
  error_count: number;
};

export type RunType = {
  run_id: string;
  created: number;
  run_type: RunRunType;
  app_hash?: string | null;
  specification_hash?: string | null;
  config: RunConfig;
  status: RunStatus;
  traces: Array<
    [[BlockType, string], Array<Array<{ value?: any; error?: string }>>]
  >;
  results?:
    | {
        value?: any | null;
        error?: string | null;
      }[][]
    | null;
};
