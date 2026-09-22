# Cricket 26 Mobile\n\nA browser cricket game built from scratch for mobile play.\n\n## Goal\nCreate a deep, responsive cricket experience inspired by modern cricket-game mechanics: timing-based batting, shot placement, pace/spin variation, stamina, confidence, field tactics, AI variation and proper scoring.\n\nThis project does not copy Cricket 26 source code, assets, or proprietary game files.\n\n## Current build

### Visual / presentation build
- Cinematic game cover and original cover artwork (`assets/cricket26-cover.svg`)
- Next-gen main menu and functional navigation
- Quick Match setup: T20 / ODI / Test
- Home and away team selection
- Career / My Cricketer presentation hub
- Country colour themes and visual style controls
- 3D stadium showcase with broadcast, batter, bowler, wide and cinematic cameras
- Separate player-only realistic 3D silhouette work

### Multi-language gameplay architecture
- **TypeScript**: strict typed contracts for UI, match state, deliveries and batting input; this is the safer layer for future gameplay migration.
- **Python**: high-level cricket AI decisions, tactical recommendations and bowling plans.
- **Rust**: small hot-loop module for fast deterministic ball calculations; can later compile to WebAssembly.
- **C++**: existing native physics/match foundation remains responsible for heavier native simulation and its WebAssembly bridge.

The languages are deliberately separated rather than mixing everything into one runtime: TypeScript owns contracts/UI, Python owns high-level AI, Rust handles selected performance-critical loops, and C++ remains the native simulation core.

### Native engine
- C++17 cricket physics foundation
- Delivery aerodynamics, swing/seam, bounce and contact quality
- Shot types, launch angle, exit speed and edge outcomes
- C++ innings / score / batter-stat simulation
- Native CMake smoke tests
- Emscripten WebAssembly build pipeline

\n- T20 / ODI / Test format selection\n- Pace and spin deliveries\n- Line, length, swing and speed variation\n- Timing-based batting\n- Multiple shot types\n- Wickets and scoring\n- Stamina and confidence\n- Bowling changes\n- Field aggression toggle\n- Innings break and chase\n- Mobile-first UI\n- GitHub Pages compatible\n\n## Roadmap\n1. Full bowling control and release meter\n2. Manual field placement\n3. Running between wickets\n4. Edges, catches, LBW, bowled and stumpings with separate outcomes\n5. AI batting and bowling\n6. Realistic fielding movement\n7. Match presentation and replay system\n8. Career / tournament systems\n9. Team and player database\n10. Advanced physics and difficulty sliders\n\n## Run\nOpen index.html or enable GitHub Pages for the repository.