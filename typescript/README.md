# TypeScript gameplay layer

The TypeScript layer defines strict contracts between the mobile UI, AI decisions,
Rust/C++ gameplay modules and the match state. It is intentionally separate from
the existing JavaScript renderer so we can migrate gameplay safely without
rewriting the 3D presentation in one shot.

Build with: npm run typecheck
