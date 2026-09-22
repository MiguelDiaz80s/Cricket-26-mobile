#include "TacticalCaptainAI.hpp"
#include <algorithm>
namespace cricket {
CaptainPlan chooseCaptainPlan(const BattingPattern& p,float r,int over,int wickets){
 CaptainPlan out{};
 if(p.legSide>p.offSide){out.targetLine=-.65f;out.fieldAggression=.72f;}
 else if(p.offSide>p.legSide){out.targetLine=.65f;out.fieldAggression=.72f;}
 else {out.targetLine=0;out.fieldAggression=.45f;}
 out.targetLength=(r>9.0f?.48f:.72f);
 out.bowlerRotation=(over%5==0?1.0f:.35f)+(wickets>=7?.25f:0);
 for(int i=0;i<11;i++)out.fieldPreset[i]=(i<4&&out.fieldAggression>.6f)?1:0;
 return out;
}
}