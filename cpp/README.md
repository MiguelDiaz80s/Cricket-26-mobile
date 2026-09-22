# Cricket 26 Mobile — C++ simulation core

Original C++17 gameplay/physics layer for the browser cricket project. It is separate from the Three.js presentation layer.

Current systems: 3D ball position/velocity, gravity, aerodynamic drag, fast-ball sub-stepping, pitch bounce, configurable bowling speed, millisecond bat timing, bat-speed contact power, and basic runs/wickets/balls state.

Build locally with CMake:
cmake -S cpp -B build
cmake --build build
./build/cricket26_engine_demo

The same source can later be compiled with Emscripten into WebAssembly and called from game.js. No proprietary Cricket 26 code or assets are used.

Next layers: seam/swing, pitch conditions, bat-face angles, shots, edges, catches, keeper/stumps, LBW, fielding, running, AI, and deterministic replays.