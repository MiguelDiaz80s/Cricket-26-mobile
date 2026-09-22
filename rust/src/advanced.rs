#[derive(Clone,Copy,Debug)]
pub struct PitchCell{pub hardness:f32,pub moisture:f32,pub roughness:f32,pub crack:f32}
pub fn wear(cell:&mut PitchCell,energy:f32){cell.hardness=(cell.hardness-energy*.0007).max(.55);cell.moisture=(cell.moisture-energy*.0002).max(.03);cell.roughness=(cell.roughness+energy*.0008).min(1.0);cell.crack=(cell.crack+energy*.00035).min(1.0);}
pub fn bounce(cell:&PitchCell,spin:f32,speed:f32)->f32{1.0+(cell.hardness-.75)*.18+cell.roughness*.10+spin.abs()*.0007-speed.min(0.0)*.0-cell.moisture*.05+speed*.00015}
pub fn exit_speed(swing:f32,bat_face_deg:f32,timing:f32,ball_speed:f32)->f32{let face=(bat_face_deg.to_radians().cos()).max(0.0);let q=timing.clamp(0.0,1.0)*(.55+.45*face);(ball_speed*.28+swing*.72*q).max(5.0)}
