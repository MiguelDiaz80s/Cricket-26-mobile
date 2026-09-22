#include "MatchSimulation.hpp"
#include <algorithm>

namespace cricket {

MatchSimulation::MatchSimulation(MatchConfig config) : config_(config) {
    reset();
}

void MatchSimulation::reset() {
    innings_ = {};
    innings_.batters.resize(11);
    for (int i = 0; i < 11; ++i) innings_.batters[i].name = "Player " + std::to_string(i + 1);
}

void MatchSimulation::startInnings(int target) {
    innings_.runs = 0;
    innings_.wickets = 0;
    innings_.legalBalls = 0;
    innings_.target = target;
    for (auto& b : innings_.batters) {
        b.runs = 0;
        b.balls = 0;
        b.fours = 0;
        b.sixes = 0;
        b.out = false;
    }
}

void MatchSimulation::setBatter(int slot, const std::string& name) {
    if (slot < 0 || slot >= static_cast<int>(innings_.batters.size())) return;
    innings_.batters[slot].name = name;
}

void MatchSimulation::recordDelivery(const ContactResult& contact, DeliveryResult result, int runs) {
    if (inningsOver()) return;

    runs = std::max(0, runs);
    innings_.runs += runs;

    // A legal delivery is counted unless the caller explicitly sends a live state.
    if (result != DeliveryResult::Live) ++innings_.legalBalls;

    if (!innings_.batters.empty()) {
        auto& b = innings_.batters[0];
        ++b.balls;
        b.runs += runs;
        if (runs == 4) ++b.fours;
        if (runs == 6) ++b.sixes;
    }

    if (result == DeliveryResult::Caught ||
        result == DeliveryResult::Bowled ||
        result == DeliveryResult::LBW) {
        wicket(innings_.batters.empty() ? "Unknown" : innings_.batters[0].name);
    }

    (void)contact;
}

void MatchSimulation::wicket(const std::string& batter) {
    if (innings_.wickets >= config_.wicketsLimit) return;
    ++innings_.wickets;
    for (auto& b : innings_.batters) {
        if (b.name == batter && !b.out) {
            b.out = true;
            break;
        }
    }
}

bool MatchSimulation::inningsOver() const {
    if (innings_.wickets >= config_.wicketsLimit) return true;
    if (innings_.target > 0 && innings_.runs >= innings_.target) return true;
    if (!config_.testMatch && innings_.legalBalls >= config_.oversLimit * 6) return true;
    return false;
}

int MatchSimulation::requiredRuns() const {
    if (innings_.target <= 0) return 0;
    return std::max(0, innings_.target - innings_.runs);
}

float MatchSimulation::chaseProgress() const {
    if (innings_.target <= 0) return 0.0f;
    return std::clamp(static_cast<float>(innings_.runs) / static_cast<float>(innings_.target), 0.0f, 1.0f);
}

} // namespace cricket
