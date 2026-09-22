#pragma once
#include <array>
#include <cmath>
#include <cstdint>
namespace cricket {
struct PitchSample { float hardness=1.0f; float moisture=0.35f; float roughness=0.0f; float crack=0.0f; };
struct AdvancedDelivery { float speedKph=135; float releaseX=0,releaseY=2.1f,releaseZ=-16; float wristSnap=0; float swing=0; float seam=0; float spin=0; };
struct BatCollision { float swingSpeed=0; float batFace=0; float approachAngle=0; float timing=0; float contactQuality=0; };
struct AdvancedBallResult { float bounceY=0; float skid=0; float seamDeviation=0; float swingDeviation=0; float spinDeviation=0; float exitSpeed=0; float launchAngle=0; };
class AdvancedPitch {
public:
 static constexpr int W=64,H=192;
 AdvancedPitch();
 void reset(float moisture=0.35f);
 void wear(float landingX,float landingZ,float impactEnergy);
 PitchSample sample(float x,float z) const;
 float bounceModifier(float x,float z,float spin,float speed) const;
private:
 std::array<PitchSample,W*H> cells_;
 int idx(float x,float z) const;
};
AdvancedBallResult resolveAdvancedBall(const AdvancedPitch&,const AdvancedDelivery&,const BatCollision&,float x,float z);
}