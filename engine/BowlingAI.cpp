#include "BowlingAI.hpp"
#include <algorithm>
#include <cmath>

namespace cricket {

BowlingAI::BowlingAI(uint32_t seed) : state_(seed ? seed : 26u) {}

void BowlingAI::setSeed(uint32_t seed) { state_ = seed ? seed : 26u; }

float BowlingAI::random01() {
    state_ ^= state_ << 13;
    state_ ^= state_ >> 17;
    state_ ^= state_ << 5;
    return static_cast<float>(state_ & 0x00ffffffu) / static_cast<float>(0x01000000u);
}

Delivery BowlingAI::chooseDelivery(const BowlerProfile& p, float batterThreat, int ballInOver) {
    Delivery d;
    const float r = random01();
    const float threat = std::clamp(batterThreat, 0.0f, 1.0f);
    const float accuracy = std::clamp(p.accuracy, 0.0f, 1.0f);
    const float chaos = (1.0f - accuracy) * p.variation;

    d.speedKph = p.pace + (random01() - .5f) * 8.0f;
    d.line = (random01() - .5f) * (.22f + chaos);
    d.length = .52f + (random01() - .5f) * .22f;
    d.swing = p.swing * (random01() > .5f ? 1.0f : -1.0f);
    d.seam = p.seam * (random01() > .5f ? 1.0f : -1.0f);
    d.bounce = .58f;

    if (p.style == BowlerStyle::Fast) {
        if (threat > .72f && r < .30f) d.length = .78f;
        if (ballInOver == 5 && r < .35f) d.length = .30f;
    } else if (p.style == BowlerStyle::Swing) {
        d.length = .48f + (random01() - .5f) * .16f;
        d.swing *= 1.45f;
    } else if (p.style == BowlerStyle::Seam) {
        d.length = .55f + (random01() - .5f) * .12f;
        d.seam *= 1.5f;
    } else if (p.style == BowlerStyle::Spinner) {
        d.speedKph = std::min(d.speedKph, 105.0f);
        d.length = .58f + (random01() - .5f) * .12f;
        d.bounce = .72f;
        d.seam *= 2.0f;
    } else if (p.style == BowlerStyle::YorkerSpecialist) {
        d.length = .18f + (random01() - .5f) * .07f;
        d.line *= .65f;
    }

    return d;
}

} // namespace cricket
