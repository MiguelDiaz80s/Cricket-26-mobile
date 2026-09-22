export * from "./game-types";
export * from "./match-model";
export * from "./ai-contract";
export * from "./physics-contract";

import type { MatchState } from "./match-model";

export function overLabel(state: MatchState): string {
  return `${state.currentOver}.${state.ballsInOver}`;
}

export function scoreboardLine(state: MatchState): string {
  return `${state.runs}/${state.wickets} · ${overLabel(state)} ov`;
}
