from dataclasses import dataclass,asdict
from typing import List
import random
@dataclass
class Club:
    id:str
    name:str
    strength:float
@dataclass
class PlayerSeason:
    player_id:str
    club_id:str
    batting:float
    bowling:float
    fitness:float=1.0
    form:float=.5
    runs:int=0
    wickets:int=0
@dataclass
class MatchResult:
    home:str
    away:str
    winner:str
    home_runs:int
    away_runs:int
def simulate_match(home:Club,away:Club,rng:random.Random)->MatchResult:
    hr=max(35,int(rng.gauss(125+home.strength*.7,22)))
    ar=max(35,int(rng.gauss(125+away.strength*.7,22)))
    winner=home.id if hr>=ar else away.id
    return MatchResult(home.id,away.id,winner,hr,ar)
def simulate_league(clubs:List[Club],rounds:int=2,seed:int=26):
    rng=random.Random(seed);results=[]
    for _ in range(rounds):
        for i,h in enumerate(clubs):
            for j,a in enumerate(clubs):
                if i<j: results.append(simulate_match(h,a,rng))
    return [asdict(x) for x in results]
if __name__=="__main__":
    clubs=[Club(f"c{i}",f"Club {i+1}",50+i*3) for i in range(8)]
    print(simulate_league(clubs))