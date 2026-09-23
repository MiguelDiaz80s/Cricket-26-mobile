#pragma once
#include <cstdint>
namespace cricket {
struct Vec3{
 float x{0},y{0},z{0};
 Vec3 operator+(const Vec3&r)const{return{x+r.x,y+r.y,z+r.z};}
 Vec3 operator-(const Vec3&r)const{return{x-r.x,y-r.y,z-r.z};}
 Vec3 operator*(float s)const{return{x*s,y*s,z*s};}
};
struct BallState{Vec3 position,velocity,spin;float age{0};bool active{true},bounced{false},struck{false};};
enum class ShotType:uint8_t{Defense,Drive,Cut,Pull,Hook,Sweep,LoftedDrive,Flick,Straight};
enum class DeliveryResult:uint8_t{Live,Bowled,Edged,Caught,LBW,Boundary,Runs,Dot};
struct BatterInput{float timing{.5f},directionX{0},directionZ{1},power{.5f};ShotType shot{ShotType::Defense};};
struct Delivery{float speedKph{135},line{-.15f},length{.55f},swing{0},seam{0},bounce{1};};
struct ContactResult{bool connected{false},edge{false};float quality{0},launchAngle{0},exitSpeed{0};Vec3 direction;};
struct MatchState{int runs{0};int wickets{0};int legalBalls{0};};
struct Aerodynamics{
 float airDensity{1.225f};
 float dragCoefficient{.47f};
 float magnusCoefficient{.18f};
 float ballMass{.156f};
 float ballRadius{.0365f};
 float swingCoefficient{.00042f};
 float seamCoefficient{.00020f};
};
class CricketPhysics{
public:
 CricketPhysics();
 void reset();
 void startDelivery(const Delivery&);
 void update(float);
 ContactResult strike(const BatterInput&);
 const BallState& ball()const{return ball_;}
 DeliveryResult result()const{return result_;}
 MatchState match()const{return{runs_,wickets_,legalBalls_};}
 float score()const{return static_cast<float>(runs_);}
 int wickets()const{return wickets_;}
 int legalBalls()const{return legalBalls_;}
 void setAerodynamics(const Aerodynamics&a){aero_=a;}
 const Aerodynamics& aerodynamics()const{return aero_;}
private:
 BallState ball_{};
 Delivery delivery_{};
 DeliveryResult result_{DeliveryResult::Live};
 Aerodynamics aero_{};
 int runs_{0},wickets_{0},legalBalls_{0};
 float gravity_{-9.81f},pitchBounce_{.62f};
 void applyAerodynamics(float);
 void resolvePitchBounce();
 void resolveWicket();
 void resolveBoundary();
 float clamp01(float)const;
};
}