export interface AdvancedWasmModule {
  _cricket_advanced_reset(moisture:number):void;
  _cricket_advanced_wear(x:number,z:number,energy:number):void;
  _cricket_pitch_hardness(x:number,z:number):number;
  _cricket_pitch_moisture(x:number,z:number):number;
  _cricket_pitch_roughness(x:number,z:number):number;
  _cricket_pitch_crack(x:number,z:number):number;
  _cricket_advanced_resolve(x:number,z:number,speed:number,swing:number,seam:number,spin:number,swingSpeed:number,faceAngle:number,approachAngle:number,timing:number):void;
  _cricket_advanced_bounce():number;
  _cricket_advanced_skid():number;
  _cricket_advanced_seam():number;
  _cricket_advanced_swing():number;
  _cricket_advanced_spin():number;
  _cricket_advanced_exit_speed():number;
  _cricket_advanced_launch_angle():number;
}
export type PitchState={hardness:number;moisture:number;roughness:number;crack:number};
export type ContactState={bounce:number;skid:number;seam:number;swing:number;spin:number;exitSpeed:number;launchAngle:number};
export function readPitch(m:AdvancedWasmModule,x:number,z:number):PitchState{return{hardness:m._cricket_pitch_hardness(x,z),moisture:m._cricket_pitch_moisture(x,z),roughness:m._cricket_pitch_roughness(x,z),crack:m._cricket_pitch_crack(x,z)}}
export function readContact(m:AdvancedWasmModule):ContactState{return{bounce:m._cricket_advanced_bounce(),skid:m._cricket_advanced_skid(),seam:m._cricket_advanced_seam(),swing:m._cricket_advanced_swing(),spin:m._cricket_advanced_spin(),exitSpeed:m._cricket_advanced_exit_speed(),launchAngle:m._cricket_advanced_launch_angle()}}