#pragma once
#include <string>
namespace cricket {
struct CareerPlayer { float fatigue=0,form=0.5f,fitness=1,batting=50,bowling=50; int trainingPoints=0; double cash=0; int season=1; };
struct CareerTick { float fatigue,form,fitness,overall; double cash; };
CareerTick advanceCareer(CareerPlayer&,int trainingChoice,int matchMinutes,bool won);
}