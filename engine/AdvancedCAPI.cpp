#include "AdvancedCricketPhysics.hpp"
using namespace cricket;
namespace { AdvancedPitch pitch; PitchSample lastSample{}; AdvancedBallResult lastResult{}; }
extern "C" {
void cricket_advanced_reset(float moisture){ pitch.reset(moisture); lastSample=pitch.sample(0,0); lastResult={}; }
void cricket_advanced_wear(float x,float z,float energy){ pitch.wear(x,z,energy); lastSample=pitch.sample(x,z); }
float cricket_pitch_hardness(float x,float z){ lastSample=pitch.sample(x,z); return lastSample.hardness; }
float cricket_pitch_moisture(float x,float z){ lastSample=pitch.sample(x,z); return lastSample.moisture; }
float cricket_pitch_roughness(float x,float z){ lastSample=pitch.sample(x,z); return lastSample.roughness; }
float cricket_pitch_crack(float x,float z){ lastSample=pitch.sample(x,z); return lastSample.crack; }
void cricket_advanced_resolve(float x,float z,float speed,float swing,float seam,float spin,float swingSpeed,float faceAngle,float approachAngle,float timing){
 AdvancedDelivery d; d.speedKph=speed; d.swing=swing; d.seam=seam; d.spin=spin;
 BatCollision b; b.swingSpeed=swingSpeed; b.batFace=faceAngle; b.approachAngle=approachAngle; b.timing=timing;
 lastResult=resolveAdvancedBall(pitch,d,b,x,z);
}
float cricket_advanced_bounce(){ return lastResult.bounceY; }
float cricket_advanced_skid(){ return lastResult.skid; }
float cricket_advanced_seam(){ return lastResult.seamDeviation; }
float cricket_advanced_swing(){ return lastResult.swingDeviation; }
float cricket_advanced_spin(){ return lastResult.spinDeviation; }
float cricket_advanced_exit_speed(){ return lastResult.exitSpeed; }
float cricket_advanced_launch_angle(){ return lastResult.launchAngle; }
}