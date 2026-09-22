#include "CareerSimulation.hpp"
#include <algorithm>
namespace cricket {
CareerTick advanceCareer(CareerPlayer& p,int trainingChoice,int minutes,bool won){
 float load=std::max(0,minutes)/900.0f;
 p.fatigue=std::clamp(p.fatigue+load-.06f,0.0f,1.0f);
 p.fitness=std::clamp(p.fitness-.02f*load+(1.0f-p.fatigue)*.015f,0.45f,1.0f);
 p.form=std::clamp(p.form+(won?.025f:-.015f)-p.fatigue*.01f,0.0f,1.0f);
 if(trainingChoice==1)p.batting=std::min(99.0f,p.batting+1.5f);
 if(trainingChoice==2)p.bowling=std::min(99.0f,p.bowling+1.5f);
 if(trainingChoice==3)p.fitness=std::min(1.0f,p.fitness+.025f);
 p.cash+=won?125.0:35.0;
 float overall=(p.batting+p.bowling)/2.0f*p.fitness*(.75f+.25f*p.form);
 return {p.fatigue,p.form,p.fitness,overall,p.cash};
}
}