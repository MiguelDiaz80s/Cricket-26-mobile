//! Fast deterministic helpers for hot gameplay loops.
//! Rust is intentionally small here: the browser/UI remains TypeScript,
//! while expensive repeated calculations can move into this module.

#[derive(Clone, Copy, Debug)]
pub struct Ball {
    pub x: f32,
    pub y: f32,
    pub z: f32,
    pub vx: f32,
    pub vy: f32,
    pub vz: f32,
}

#[inline]
pub fn advance_ball(ball: &mut Ball, dt: f32, gravity: f32, drag: f32) {
    ball.vy -= gravity * dt;
    let factor = (1.0 - drag * dt).max(0.0);
    ball.vx *= factor;
    ball.vy *= factor;
    ball.vz *= factor;
    ball.x += ball.vx * dt;
    ball.y += ball.vy * dt;
    ball.z += ball.vz * dt;
}

#[no_mangle]
pub extern "C" fn rust_ball_step(
    x: *mut f32,
    y: *mut f32,
    z: *mut f32,
    vx: *mut f32,
    vy: *mut f32,
    vz: *mut f32,
    dt: f32,
) {
    if x.is_null() || y.is_null() || z.is_null() ||
       vx.is_null() || vy.is_null() || vz.is_null() {
        return;
    }
    // SAFETY: callers provide six valid mutable f32 pointers.
    let mut b = Ball {
        x: unsafe { *x }, y: unsafe { *y }, z: unsafe { *z },
        vx: unsafe { *vx }, vy: unsafe { *vy }, vz: unsafe { *vz },
    };
    advance_ball(&mut b, dt, 9.81, 0.012);
    unsafe {
        *x = b.x; *y = b.y; *z = b.z;
        *vx = b.vx; *vy = b.vy; *vz = b.vz;
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn ball_moves_forward_and_down() {
        let mut b = Ball { x: 0.0, y: 2.0, z: 0.0, vx: 0.0, vy: 2.0, vz: 20.0 };
        let start_z = b.z;
        advance_ball(&mut b, 0.05, 9.81, 0.012);
        assert!(b.z > start_z);
        assert!(b.y > 2.0);
    }
}


mod advanced;
