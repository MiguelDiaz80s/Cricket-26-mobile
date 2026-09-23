#include "CricketPhysics.hpp"
#include <cmath>
using namespace cricket;
namespace { CricketPhysics g; ContactResult last{}; }

extern "C" {
void cricket_reset(){ g.reset(); last={}; }

void cricket_start_delivery(float speed,float line,float length,float swing,float seam,float bounce){
    Delivery d; d.speedKph=speed; d.line=line; d.length=length; d.swing=swing; d.seam=seam; d.bounce=bounce;
    g.startDelivery(d); last={};
}

void cricket_update(float dt){ g.update(dt); }

int cricket_ball_active(){ return g.ball().active ? 1 : 0; }
float cricket_ball_x(){ return g.ball().position.x; }
float cricket_ball_y(){ return g.ball().position.y; }
float cricket_ball_z(){ return g.ball().position.z; }

float cricket_ball_vx(){ return g.ball().velocity.x; }
float cricket_ball_vy(){ return g.ball().velocity.y; }
float cricket_ball_vz(){ return g.ball().velocity.z; }

float cricket_ball_spin_x(){ return g.ball().spin.x; }
float cricket_ball_spin_y(){ return g.ball().spin.y; }
float cricket_ball_spin_z(){ return g.ball().spin.z; }
float cricket_ball_speed(){ 
    const auto& v=g.ball().velocity;
    return std::sqrt(v.x*v.x+v.y*v.y+v.z*v.z);
}

int cricket_strike(int shot,float timing,float dx,float dz,float power){
    BatterInput i; i.shot=static_cast<ShotType>(shot); i.timing=timing; i.directionX=dx; i.directionZ=dz; i.power=power;
    last=g.strike(i); return last.connected ? 1 : 0;
}

float cricket_last_quality(){ return last.quality; }
float cricket_last_exit_speed(){ return last.exitSpeed; }
float cricket_last_launch_angle(){ return last.launchAngle; }
float cricket_last_direction_x(){ return last.direction.x; }
float cricket_last_direction_y(){ return last.direction.y; }
float cricket_last_direction_z(){ return last.direction.z; }
int cricket_last_edge(){ return last.edge ? 1 : 0; }
int cricket_result(){ return static_cast<int>(g.result()); }
float cricket_score(){ return g.score(); }
int cricket_wickets(){ return g.wickets(); }
int cricket_legal_balls(){ return g.legalBalls(); }
}
