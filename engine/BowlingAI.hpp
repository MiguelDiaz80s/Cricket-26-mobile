#pragma once
#include "CricketPhysics.hpp"
#include <cstdint>

namespace cricket {

enum class BowlerStyle : uint8_t { Fast, Swing, Seam, Spinner, YorkerSpecialist };

struct BowlerProfile {
    BowlerStyle style{BowlerStyle::Fast};
    float pace{135.0f};
    float accuracy{0.72f};
    float swing{0.08f};
    float seam{0.06f};
    float variation{0.25f};
};

class BowlingAI {
public:
    explicit BowlingAI(uint32_t seed = 26);
    Delivery chooseDelivery(const BowlerProfile&, float batterThreat, int ballInOver);
    void setSeed(uint32_t seed);

private:
    uint32_t state_;
    float random01();
};

} // namespace cricket
