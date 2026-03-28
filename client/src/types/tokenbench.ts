export type TokenBenchProject = {
  name: string;
  repoPath: string | null;
  recordPath: string | null;
};

export type TokenBenchDiffStats = {
  startSha: string;
  endSha: string;
  filesChanged: number;
  added: number;
  deleted: number;
  changedLoc: number;
};

export type TokenBenchSessionUsage = {
  input: number;
  output: number;
  cacheRead: number;
  cacheWrite: number;
  totalTokens: number;
};

export type TokenBenchTaskCard = {
  id?: string;
  createdAt?: string;

  projectName: string | null;
  repo: string;
  repoPath: string;
  taskType: string;
  startSha: string;
  endSha: string;
  sessionId: string;
  agentId: string;
  tests: string | null;

  model: string | null;
  diff: TokenBenchDiffStats;
  session: TokenBenchSessionUsage;

  tokensTotal: number;
  tokensPerLoc: number | null;
};

export type TokenBenchReportRow = {
  repo: string;
  taskType: string;
  model: string;
  count: number;
  tokensTotal: { median: number | null; p90: number | null };
  tokensPerLoc: { median: number | null; p90: number | null };
};

export type TokenBenchOutlier = {
  repo: string;
  taskType: string;
  model: string;
  id?: string;
  createdAt?: string;
  tokensTotal: number;
  tokensPerLoc: number;
  sessionId?: string;
};
