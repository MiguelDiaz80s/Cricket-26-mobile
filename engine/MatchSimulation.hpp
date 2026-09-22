#pragma once
#include "CricketPhysics.hpp"
#include <string>
#include <vector>

namespace cricket {

struct MatchConfig {
    int oversLimit{20};
    int wicketsLimit{10};
    bool testMatch{false};
};

struct BatterStats {
    std::string name;
    int runs{0};
    int balls{0};
    int fours{0};
    int sixes{0};
    bool out{false};
};

struct InningsState {
    int runs{0};
    int wickets{0};
    int legalBalls{0};
    int target{0};
    std::vector<BatterStats> batters;
};

class MatchSimulation {
public:
    explicit MatchSimulation(MatchConfig config = {});
    void reset();
    void startInnings(int target = 0);
    void recordDelivery(const ContactResult& contact, DeliveryResult result, int runs);
    void wicket(const std::string& batter);
    void setBatter(int slot, const std::string& name);
    const InningsState& innings() const { return innings_; }
    bool inningsOver() const;
    int currentOver() const { return innings_.legalBalls / 6; }
    int ballsInOver() const { return innings_.legalBalls % 6; }
    int requiredRuns() const;
    float chaseProgress() const;

private:
    MatchConfig config_;
    InningsState innings_;
};

} // namespace cricket
