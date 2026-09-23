let modulePromise=null;

export async function loadCricketWasm(){
  if(modulePromise)return modulePromise;
  modulePromise=(async()=>{
    try{
      const mod=await import("./cricket_engine.js");
      const factory=mod.default||mod;
      const instance=await factory();
      const wrap=(name,ret,args)=>instance.cwrap(name,ret,args);
      const f={
        reset:wrap("cricket_reset",null,[]),
        startDelivery:wrap("cricket_start_delivery",null,["number","number","number","number","number","number"]),
        update:wrap("cricket_update",null,["number"]),
        active:wrap("cricket_ball_active","number",[]),
        px:wrap("cricket_ball_x","number",[]),
        py:wrap("cricket_ball_y","number",[]),
        pz:wrap("cricket_ball_z","number",[]),
        vx:wrap("cricket_ball_vx","number",[]),
        vy:wrap("cricket_ball_vy","number",[]),
        vz:wrap("cricket_ball_vz","number",[]),
        sx:wrap("cricket_ball_spin_x","number",[]),
        sy:wrap("cricket_ball_spin_y","number",[]),
        sz:wrap("cricket_ball_spin_z","number",[]),
        speed:wrap("cricket_ball_speed","number",[]),
        strike:wrap("cricket_strike","number",["number","number","number","number","number"]),
        quality:wrap("cricket_last_quality","number",[]),
        exitSpeed:wrap("cricket_last_exit_speed","number",[]),
        launchAngle:wrap("cricket_last_launch_angle","number",[]),
        result:wrap("cricket_result","number",[]),
      };
      return {
        ...f,
        position:()=>({x:f.px(),y:f.py(),z:f.pz()}),
        velocity:()=>({x:f.vx(),y:f.vy(),z:f.vz()}),
        spin:()=>({x:f.sx(),y:f.sy(),z:f.sz()}),
      };
    }catch(err){
      console.warn("Cricket C++ WASM unavailable; using browser physics fallback.",err);
      return null;
    }
  })();
  return modulePromise;
}
