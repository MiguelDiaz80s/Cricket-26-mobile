from pathlib import Path
import re
p=Path('game.js')
s=p.read_text()
old='const finishDot=()=>{if(resolved||phase12Finalized)return;resolved=true;setHasBall(phase12Fielder,true);beginRecovery("DOT BALL",0,"None",quality,pendingBatAction?.foot||"NONE");};'
new='const finishDot=()=>{if(resolved||phase12Finalized)return;resolved=true;const runs=runState.runs||0;phase12RunsCommitted=runs;setHasBall(phase12Fielder,true);beginRecovery(runs?runs+" RUN"+(runs===1?"":"S")+" · SAFE":"DOT BALL",runs,"None",quality,pendingBatAction?.foot||"NONE");};'
if old not in s:
    raise SystemExit('finishDot target not found')
p.write_text(s.replace(old,new,1))
