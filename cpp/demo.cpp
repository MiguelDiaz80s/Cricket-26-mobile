#include "cricket_engine.h"
#include <iostream>
int main(){
 cricket26::CricketEngine engine;engine.set_bowler_speed(145.0f);float elapsed=0.0f;
 while(engine.ball().in_play&&elapsed<2.0f){engine.step(1.0f/120.0f);elapsed+=1.0f/120.0f;}
 const auto&b=engine.ball();
 std::cout<<"Final ball position: "<<b.position.x<<", "<<b.position.y<<", "<<b.position.z<<"\n";
 std::cout<<"Final speed: "<<b.speed_mps*3.6f<<" km/h\n";return 0;
}