#pragma once
#include <cstdint>
namespace cricket26 {
struct Vec3 { float x{0}, y{0}, z{0}; };
struct BallState { Vec3 position{}; Vec3 velocity{}; float speed_mps{0}; float time{0}; bool in_play{false}; };
struct BatContact { bool hit{false}; float quality{0}; float timing_error_ms{0}; float bat_speed{0}; Vec3 outgoing_velocity{}; };
struct MatchState { int runs{0}; int wickets{0}; int balls{0}; int target{0}; bool innings_over{false}; };
class CricketEngine {
public:
    CricketEngine();
    void reset_ball();
    void set_bowler_speed(float kmh);
    void set_release(const Vec3& position, const Vec3& direction);
    void step(float dt);
    BatContact evaluate_bat_contact(float swing_time, const Vec3& bat_velocity);
    const BallState& ball() const { return ball_; }
    const MatchState& match() const { return match_; }
    void add_runs(int runs);
    void add_wicket();
private:
    BallState ball_{};
    MatchState match_{};
    float release_speed_mps_{30.0f};
    Vec3 release_position_{0, 2.1f, 12.0f};
    Vec3 release_direction_{0, 0, -1};
    static float length(const Vec3& v);
    static Vec3 normalize(const Vec3& v);
    static Vec3 add(const Vec3& a, const Vec3& b);
    static Vec3 mul(const Vec3& v, float s);
};
}
extern "C" {
cricket26::CricketEngine* cricket_create();
void cricket_destroy(cricket26::CricketEngine* engine);
void cricket_reset_ball(cricket26::CricketEngine* engine);
void cricket_set_bowler_speed(cricket26::CricketEngine* engine, float kmh);
void cricket_step(cricket26::CricketEngine* engine, float dt);
float cricket_ball_x(const cricket26::CricketEngine* engine);
float cricket_ball_y(const cricket26::CricketEngine* engine);
float cricket_ball_z(const cricket26::CricketEngine* engine);
float cricket_ball_speed_kmh(const cricket26::CricketEngine* engine);
}
