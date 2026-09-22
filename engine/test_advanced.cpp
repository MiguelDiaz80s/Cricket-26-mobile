#include "AdvancedCricketPhysics.hpp"
#include <cassert>
#include <cmath>
using namespace cricket;
int main(){
 AdvancedPitch p; auto before=p.sample(0,0); p.wear(0,0,100); auto after=p.sample(0,0);
 assert(after.hardness<before.hardness && after.roughness>before.roughness && after.crack>before.crack);
 AdvancedDelivery d; BatCollision b; b.swingSpeed=32;b.timing=1;
 auto r=resolveAdvancedBall(p,d,b,0,0); assert(std::isfinite(r.exitSpeed)&&r.exitSpeed>0);
 return 0;
}