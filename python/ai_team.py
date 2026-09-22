"""Cricket AI team prototype.

Python owns high-level tactical decisions: batting intent, bowling plans,
field presets and recommendation generation. The browser/native engines can
consume the JSON decisions produced here.
"""
from dataclasses import dataclass, asdict
from enum import Enum
import json
import random


class Intent(str, Enum):
    DEFEND = "DEFEND"
    ROTATE = "ROTATE"
    ATTACK = "ATTACK"
    LOFT = "LOFT"


@dataclass
class DeliveryContext:
    speed_kph: float
    line: str
    length: str
    score: int
    wickets: int
    legal_balls: int


@dataclass
class AIRecommendation:
    intent: str
    shot: str
    foot: str
    hit_zones: list[str]
    confidence: float


def recommend(ctx: DeliveryContext, rng: random.Random | None = None) -> AIRecommendation:
    rng = rng or random.Random()
    if ctx.length == "FULL" and ctx.line == "OUTSIDE_OFF":
        return AIRecommendation("ATTACK", "STROKE", "FRONT", ["FRONT-STRAIGHT", "OFF"], 0.82)
    if ctx.length == "SHORT":
        return AIRecommendation("ATTACK", "STROKE", "BACK", ["SQUARE-BACK", "LEG"], 0.79)
    if ctx.line == "LEG":
        return AIRecommendation("ROTATE", "PUSH", "FRONT", ["LEG", "FRONT-STRAIGHT"], 0.76)
    if ctx.speed_kph > 140:
        return AIRecommendation("DEFEND", "PUSH", "BACK", ["STRAIGHT"], 0.71)
    return AIRecommendation("ROTATE", "PUSH", "FRONT", ["STRAIGHT", "OFF"], 0.68)


def choose_bowler_plan(batter_score: int, wickets: int, over: int) -> dict:
    pressure = min(1.0, (wickets * 0.16) + (over % 6) * 0.04)
    if batter_score >= 40:
        return {"plan": "CHANGE_LINE", "length": "GOOD", "variation": "SEAM", "aggression": round(0.62 + pressure, 2)}
    return {"plan": "BUILD_PRESSURE", "length": "FULL", "variation": "SWING", "aggression": round(0.48 + pressure, 2)}


def main() -> None:
    ctx = DeliveryContext(142, "OUTSIDE_OFF", "FULL", 12, 1, 27)
    print(json.dumps({"recommendation": asdict(recommend(ctx)), "bowling": choose_bowler_plan(ctx.score, ctx.wickets, ctx.legal_balls // 6)}, indent=2))


if __name__ == "__main__":
    main()
