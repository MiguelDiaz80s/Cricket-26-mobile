import type { MatchState, Batter } from "./match-model";
import type { Delivery, BattingInput } from "./game-types";
import { currentPhase, requiredRunRate } from "./match-model";

export interface DeliveryOutcome {
  runs: number;
  legal: boolean;
  wicket: boolean;
  dismissal?: "BOWLED" | "LBW" | "CAUGHT" | "STUMPED" | "RUN_OUT";
  boundary: boolean;
  message: string;
}

export function applyDelivery(
  state: MatchState,
  delivery: Delivery,
  input: BattingInput,
  outcome: DeliveryOutcome,
  totalOvers: number,
): MatchState {
  const next: MatchState = {
    ...state,
    runs: state.runs + Math.max(0, outcome.runs),
    wickets: state.wickets + (outcome.wicket ? 1 : 0),
    legalBalls: state.legalBalls + (outcome.legal ? 1 : 0),
    delivery,
    phase: currentPhase(state.format, state.currentOver, totalOvers),
    lastDismissal: outcome.wicket ? (outcome.dismissal ?? "CAUGHT") : "NOT_OUT",
    inningsComplete: false,
  };

  const batter: Batter = { ...state.batter };
  batter.balls += outcome.legal ? 1 : 0;
  batter.runs += Math.max(0, outcome.runs);
  batter.confidence = Math.max(0, Math.min(1,
    batter.confidence + (outcome.wicket ? -0.18 : outcome.runs >= 4 ? 0.04 : 0.01)
  ));
  batter.stamina = Math.max(0, batter.stamina - (outcome.legal ? 0.004 : 0));
  batter.fours += outcome.runs === 4 ? 1 : 0;
  batter.sixes += outcome.runs === 6 ? 1 : 0;
  batter.dismissed = outcome.wicket;
  next.batter = batter;

  const ballsRemaining = state.format === "TEST"
    ? Number.POSITIVE_INFINITY
    : Math.max(0, totalOvers * 6 - next.legalBalls);

  next.requiredRuns = Math.max(0, next.target - next.runs);
  next.requiredRate = Number.isFinite(ballsRemaining)
    ? requiredRunRate(next.requiredRuns, ballsRemaining)
    : 0;
  next.currentOver = Math.floor(next.legalBalls / 6);
  next.ballsInOver = next.legalBalls % 6;

  const reachedTarget = next.target > 0 && next.runs >= next.target;
  const outOfWickets = next.wickets >= 10;
  const outOfOvers = state.format !== "TEST" && next.legalBalls >= totalOvers * 6;
  next.inningsComplete = reachedTarget || outOfWickets || outOfOvers;

  if (input.footwork === "LEAVE" && outcome.runs !== 0) {
    next.inningsComplete = true;
  }

  return next;
}

export function rotateStrike(state: MatchState, runs: number): MatchState {
  if (runs % 2 === 0) return state;
  return { ...state, striker: state.nonStriker, nonStriker: state.striker };
}
