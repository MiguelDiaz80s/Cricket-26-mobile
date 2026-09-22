#pragma once
#include <array>
namespace cricket {
struct BattingPattern { float offSide=.33f, straight=.34f, legSide=.33f; int dotBalls=0; };
struct CaptainPlan { float targetLine=0,targetLength=0,fieldAggression=0,bowlerRotation=0; std::array<int,11> fieldPreset{}; };
CaptainPlan chooseCaptainPlan(const BattingPattern&,float requiredRate,int over,int wickets);
}