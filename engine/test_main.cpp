#include "CricketPhysics.hpp"
#include "MatchSimulation.hpp"
#include <cassert>
#include <iostream>
int main(){cricket::CricketPhysics e;cricket::Delivery d;d.speedKph=135;d.length=.55f;e.startDelivery(d);for(int i=0;i<120&&e.ball().active;i++)e.update(1.f/120);e.reset();e.startDelivery(d);cricket::BatterInput in;in.timing=.5f;in.power=.9f;in.shot=cricket::ShotType::Drive;auto c=e.strike(in);assert(c.connected&&c.quality>.5f&&c.exitSpeed>30);std::cout<<"Cricket engine smoke test passed. Quality="<<c.quality<<"\n";}