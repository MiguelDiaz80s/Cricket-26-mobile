#include "AdvancedCricketPhysics.hpp"
#include <algorithm>
namespace cricket {
AdvancedPitch::AdvancedPitch(){reset();}
int AdvancedPitch::idx(float x,float z) const {
 int ix=std::clamp(int((x+2.75f)/5.5f*W),0,W-1);
 int iz=std::clamp(int((z+17.0f)/34.0f*H),0,H-1);
 return iz*W+ix;
}
void AdvancedPitch::reset(float moisture){
 for(auto& c:cells_) c={1.0f,moisture,0.0f,0.0f};
}
void AdvancedPitch::wear(float x,float z,float energy){
 auto& c=cells_[idx(x,z)];
 c.hardness=std::max(.55f,c.hardness-energy*.0007f);
 c.moisture=std::max(0.03f,c.moisture-energy*.0002f);
 c.roughness=std::min(1.0f,c.roughness+energy*.0008f);
 c.crack=std::min(1.0f,c.crack+energy*.00035f);
}
PitchSample AdvancedPitch::sample(float x,float z) const{return cells_[idx(x,z)];}
float AdvancedPitch::bounceModifier(float x,float z,float spin,float speed) const{
 auto c=sample(x,z);
 return 1.0f + (c.hardness-.75f)*.18f + c.roughness*.10f + std::abs(spin)*.0007f - c.moisture*.05f + speed*.00015f;
}
AdvancedBallResult resolveAdvancedBall(const AdvancedPitch& pitch,const AdvancedDelivery& d,const BatCollision& b,float x,float z){
 auto s=pitch.sample(x,z);
 float seam=(d.seam*0.018f + s.roughness*.045f)*(1.0f-s.moisture*.35f);
 float swing=d.swing*(1.0f+std::max(0.0f,d.speedKph-125.0f)*.012f);
 float spin=d.spin*(.7f+s.roughness*.8f);
 float timing=std::clamp(b.timing,0.0f,1.0f);
 float face=std::cos(b.batFace*3.14159265f/180.0f);
 float quality=timing*(.55f+.45f*std::max(0.0f,face));
 float exit=d.speedKph*.28f + b.swingSpeed*.72f*quality;
 float launch=10.0f + std::abs(b.approachAngle)*.45f + (1.0f-face)*22.0f;
 return {s.hardness*.72f+s.roughness*.22f,1.0f-s.moisture*.18f,seam,swing,spin,std::max(5.0f,exit),launch};
}
}