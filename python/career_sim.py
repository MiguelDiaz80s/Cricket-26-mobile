from dataclasses import dataclass
import random
@dataclass
class NPC:
    batting: float=50
    bowling: float=50
    fitness: float=1.0
    form: float=.5
def simulate_season(players=200,matches=14,seed=26):
    rng=random.Random(seed); roster=[NPC(rng.uniform(35,75),rng.uniform(35,75)) for _ in range(players)]
    for _ in range(matches):
        for p in roster:
            fatigue=rng.uniform(0,.08)
            p.fitness=max(.45,p.fitness-fatigue+rng.uniform(0,.025))
            p.form=max(0,min(1,p.form+rng.uniform(-.035,.035)))
    return [{"batting":round(p.batting,2),"bowling":round(p.bowling,2),"fitness":round(p.fitness,3),"form":round(p.form,3)} for p in roster]
if __name__=="__main__": print(simulate_season(12,14))
