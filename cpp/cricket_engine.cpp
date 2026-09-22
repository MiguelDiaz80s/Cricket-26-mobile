#include "cricket_engine.h"
#include <algorithm>
#include <cmath>
#include <new>
namespace cricket26 {
namespace {
constexpr float kGravity=-9.81f, kAirDrag=0.018f, kBallRadius=0.036f, kPitchY=0.12f, kPitchLength=20.12f, kMaxStep=1.0f/120.0f;
}
CricketEngine::CricketEngine(){reset_ball();}
float CricketEngine::length(const Vec3&v){return std::sqrt(v.x*v.x+v.y*v.y+v.z*v.z);}
Vec3 CricketEngine::normalize(const Vec3&v){float l=length(v);if(l<=0.00001f)return{0,0,-1};return{v.x/l,v.y/l,v.z/l};}
Vec3 CricketEngine::add(const Vec3&a,const Vec3&b){return{a.x+b.x,a.y+b.y,a.z+b.z};}
Vec3 CricketEngine::mul(const Vec3&v,float s){return{v.x*s,v.y*s,v.z*s};}
void CricketEngine::set_bowler_speed(float kmh){kmh=std::clamp(kmh,35.0f,170.0f);release_speed_mps_=kmh/3.6f;reset_ball();}
void CricketEngine::set_release(const Vec3&p,const Vec3&d){release_position_=p;release_direction_=normalize(d);reset_ball();}
void CricketEngine::reset_ball(){ball_.position=release_position_;ball_.velocity=mul(release_direction_,release_speed_mps_);ball_.speed_mps=release_speed_mps_;ball_.time=0;ball_.in_play=true;}
void CricketEngine::step(float dt){
 if(!ball_.in_play||dt<=0)return;dt=std::clamp(dt,0.0f,0.1f);
 while(dt>0){float h=std::min(dt,kMaxStep);dt-=h;float speed=length(ball_.velocity);float drag=std::max(0.0f,1.0f-kAirDrag*h*speed);
  ball_.velocity.x*=drag;ball_.velocity.y*=drag;ball_.velocity.z*=drag;ball_.velocity.y+=kGravity*h;ball_.position=add(ball_.position,mul(ball_.velocity,h));ball_.time+=h;
  if(ball_.position.y<=kPitchY+kBallRadius&&ball_.velocity.y<0&&std::abs(ball_.position.z)<kPitchLength*0.5f){ball_.position.y=kPitchY+kBallRadius;ball_.velocity.y=-ball_.velocity.y*0.56f;ball_.velocity.x*=0.94f;ball_.velocity.z*=0.93f;}
  if(ball_.position.z<-14.0f||ball_.position.z>16.0f||ball_.position.y<-2.0f)ball_.in_play=false;ball_.speed_mps=length(ball_.velocity);
 }
}
BatContact CricketEngine::evaluate_bat_contact(float swing_time,const Vec3&bat_velocity){
 BatContact r{};float errorMs=(swing_time-ball_.time)*1000.0f;r.timing_error_ms=errorMs;r.bat_speed=length(bat_velocity);float absError=std::abs(errorMs);
 if(absError>145.0f)return r;r.quality=std::clamp(1.0f-absError/145.0f,0.0f,1.0f);float batPower=std::clamp(r.bat_speed/18.0f,0.25f,1.35f);float rebound=0.78f+r.quality*0.92f;float forward=release_speed_mps_*rebound*batPower;
 r.outgoing_velocity={bat_velocity.x*0.55f,std::max(1.2f,std::abs(bat_velocity.y)*0.32f+r.quality*3.5f),-forward};r.hit=r.quality>0.08f;return r;
}
void CricketEngine::add_runs(int runs){if(runs>=0){match_.runs+=runs;++match_.balls;}}
void CricketEngine::add_wicket(){++match_.wickets;++match_.balls;}
}
extern "C" {
cricket26::CricketEngine* cricket_create(){return new(std::nothrow)cricket26::CricketEngine();}
void cricket_destroy(cricket26::CricketEngine*e){delete e;}
void cricket_reset_ball(cricket26::CricketEngine*e){if(e)e->reset_ball();}
void cricket_set_bowler_speed(cricket26::CricketEngine*e,float kmh){if(e)e->set_bowler_speed(kmh);}
void cricket_step(cricket26::CricketEngine*e,float dt){if(e)e->step(dt);}
float cricket_ball_x(const cricket26::CricketEngine*e){return e?e->ball().position.x:0.0f;}
float cricket_ball_y(const cricket26::CricketEngine*e){return e?e->ball().position.y:0.0f;}
float cricket_ball_z(const cricket26::CricketEngine*e){return e?e->ball().position.z:0.0f;}
float cricket_ball_speed_kmh(const cricket26::CricketEngine*e){return e?e->ball().speed_mps*3.6f:0.0f;}
}
