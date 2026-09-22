export type Shot = "LOFT" | "STROKE" | "PUSH";
export type Footwork = "FRONT" | "BACK" | "LEAVE" | "SPECIAL";
export type DeliveryLine = "ON_STUMPS" | "OUTSIDE_OFF" | "LEG";
export type DeliveryLength = "FULL" | "GOOD" | "SHORT";

export interface Delivery {
  speedKph: number;
  line: DeliveryLine;
  length: DeliveryLength;
  swing: number;
  seam: number;
}

export interface BattingInput {
  shot: Shot;
  footwork: Footwork;
  hitX: number;
  hitY: number;
  timing: number;
}

export interface AIRecommendation {
  shot: Shot;
  footwork: Footwork;
  hitZones: string[];
  confidence: number;
}

export interface MatchSnapshot {
  runs: number;
  wickets: number;
  legalBalls: number;
  delivery?: Delivery;
  recommendation?: AIRecommendation;
}
