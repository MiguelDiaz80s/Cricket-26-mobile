#include "CricketPhysics.hpp"
#include <algorithm>
#include <cmath>
namespace cricket{
namespace{
constexpr float PI=3.14159265359f;
constexpr float KPH=1.f/3.6f;
constexpr float PW=1.525f,PL=17.f,BOUNDARY=43.5f;
float len(const Vec3&v){return std::sqrt(v.x*v.x+v.y*v.y+v.z*v.z);}
Vec3 norm(const Vec3&v){float l=len(v);return l>.0001f?v*(1.f/l):Vec3{0,0,1};}
Vec3 cross(const Vec3&a,const Vec3&b){return{a.y*b.z-a.z*b.y,a.z*b.x-a.x*b.z,a.x*b.y-a.y*b.x};}
float dot(const Vec3&a,const Vec3&b){return a.x*b.x+a.y*b.y+a.z*b.z;}
}
CricketPhysics::CricketPhysics(){reset();}
void CricketPhysics::reset(){
 ball_={}; ball_.position={0,.63f,8}; result_=DeliveryResult::Live;
 runs_=0; wickets_=0; legalBalls_=0;
}
float CricketPhysics::clamp01(float v)const{return std::max(0.f,std::min(1.f,v));}
void CricketPhysics::startDelivery(const Delivery&d){
 delivery_=d; result_=DeliveryResult::Live;
 float speed=std::max(20.f,d.speedKph)*KPH;
 ball_.position={d.line*1.2f,2.15f,18};
 ball_.velocity={d.line*-.12f,-std::max(2.f,speed*.18f),-speed};
 // Delivery swing/seam are normalized inputs (-1..1). Spin is stored in rad/s.
 ball_.spin={0,d.seam*115.f,d.swing*70.f};
 ball_.age=0; ball_.active=true; ball_.bounced=false; ball_.struck=false;
}
void CricketPhysics::applyAerodynamics(float dt){
 const float speed=len(ball_.velocity);
 if(speed<.01f)return;

 // Cricket ball constants: projected area and mass give acceleration directly.
 const float area=PI*aero_.ballRadius*aero_.ballRadius;
 const float dynamic=.5f*aero_.airDensity*speed*speed;
 const float dragAccel=dynamic*aero_.dragCoefficient*area/aero_.ballMass;
 const Vec3 drag=norm(ball_.velocity)*(-dragAccel);

 // Magnus force: omega x v. Clamp the lift coefficient so extreme spin
 // cannot produce an unstable simulation.
 const float spinRate=len(ball_.spin);
 const float spinRatio=spinRate*aero_.ballRadius/speed;
 const float lift=std::min(.35f,aero_.magnusCoefficient*spinRatio);
 const Vec3 magnusDir=norm(cross(ball_.spin,ball_.velocity));
 const Vec3 magnus=magnusDir*(dynamic*lift*area/aero_.ballMass);

 // Swing is a lateral force that acts mainly before the first bounce.
 const float swingForce=dynamic*aero_.swingCoefficient*delivery_.swing;
 const Vec3 swing={swingForce/aero_.ballMass,0,0};

 // Seam is deliberately weaker in flight and becomes more important at bounce.
 const float seamForce=dynamic*aero_.seamCoefficient*delivery_.seam;
 const Vec3 seam={0,0,seamForce/aero_.ballMass};

 ball_.velocity=ball_.velocity+(drag+magnus+swing+seam)*dt;
 ball_.velocity.y+=gravity_*dt;
}
void CricketPhysics::resolvePitchBounce(){
 if(ball_.bounced||ball_.struck)return;
 if(ball_.position.y<=.18f&&ball_.velocity.y<0&&std::abs(ball_.position.x)<=PW&&std::abs(ball_.position.z)<=PL){
  ball_.position.y=.19f;
  ball_.velocity.y=std::abs(ball_.velocity.y)*pitchBounce_*std::max(.5f,std::min(1.2f,delivery_.bounce));
  ball_.velocity.x+=delivery_.seam*.75f;
  ball_.velocity.z*=.93f;
  ball_.bounced=true;
 }
}
void CricketPhysics::resolveBoundary(){
 if(ball_.struck&&len(ball_.position)>=BOUNDARY){
  result_=DeliveryResult::Boundary; runs_+=4; ball_.active=false;
 }
}
void CricketPhysics::update(float dt){
 if(!ball_.active)return;
 dt=std::max(0.f,std::min(dt,.033f));
 ball_.age+=dt;
 applyAerodynamics(dt);
 ball_.position=ball_.position+ball_.velocity*dt;
 resolvePitchBounce();
 resolveBoundary();
 if(!ball_.struck&&ball_.position.z<-18.5f){
  ball_.active=false;++legalBalls_;result_=DeliveryResult::Runs;
 }
 if(ball_.struck&&len(ball_.velocity)<2){
  ball_.active=false;++legalBalls_;
  if(result_==DeliveryResult::Live){result_=DeliveryResult::Runs;runs_+=1;}
 }
}
ContactResult CricketPhysics::strike(const BatterInput&in){
 ContactResult o{};
 if(!ball_.active||ball_.struck)return o;
 float timing=clamp01(in.timing),error=std::abs(timing-.5f)*2,tq=1-error;
 float bias=in.shot==ShotType::Defense?.10f:
  in.shot==ShotType::Drive?.92f:
  in.shot==ShotType::Straight?.88f:
  in.shot==ShotType::LoftedDrive?.82f:
  in.shot==ShotType::Sweep?.72f:
  in.shot==ShotType::Pull?.70f:
  in.shot==ShotType::Hook?.62f:
  in.shot==ShotType::Cut?.68f:.45f;
 float lm=clamp01(1-std::abs(delivery_.length-bias)*1.55f);
 o.quality=clamp01(tq*.72f+lm*.28f);
 o.connected=o.quality>.30f;
 if(!o.connected){
  o.edge=tq<.22f;
  if(o.edge){ball_.struck=true;result_=DeliveryResult::Edged;ball_.velocity={-7,4.5f,-9};}
  else{ball_.active=false;++legalBalls_;result_=DeliveryResult::Runs;}
  return o;
 }
 ball_.struck=true;
 float power=clamp01(in.power);
 o.exitSpeed=18+34*o.quality+28*power;
 float angle=in.shot==ShotType::Defense?7:
  in.shot==ShotType::Drive?24:
  in.shot==ShotType::LoftedDrive?42:
  in.shot==ShotType::Sweep?18:
  in.shot==ShotType::Pull?25:
  in.shot==ShotType::Hook?31:
  in.shot==ShotType::Cut?14:16;
 o.launchAngle=angle*(.72f+.28f*o.quality);
 Vec3 d{in.directionX,std::sin(o.launchAngle*PI/180),in.directionZ};
 d=norm(d);
 d.x+=(timing<.5f?-1:1)*error*.65f;
 d=norm(d);
 o.direction=d;
 ball_.velocity=d*(o.exitSpeed/3.6f);
 ball_.position.y=std::max(ball_.position.y,.24f);
 if(o.quality<.43f){o.edge=true;result_=DeliveryResult::Edged;}
 else result_=DeliveryResult::Runs;
 return o;
}
void CricketPhysics::resolveWicket(){}
}