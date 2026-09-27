const API_BASE=(globalThis.CRICKET26_API_BASE||"").replace(/\/$/,"");

export async function fetchLeaderboard(limit=100){
  const r=await fetch(API_BASE+"/api/leaderboard?limit="+encodeURIComponent(limit));
  if(!r.ok)throw new Error("Leaderboard request failed");
  return r.json();
}

export async function fetchProfile(userId){
  const r=await fetch(API_BASE+"/api/profile/"+encodeURIComponent(userId));
  if(!r.ok)throw new Error("Profile request failed");
  return r.json();
}

export async function saveCompletedMatch(payload,apiKey){
  const r=await fetch(API_BASE+"/api/matches/complete",{
    method:"POST",
    headers:{"Content-Type":"application/json","x-api-key":apiKey},
    body:JSON.stringify(payload)
  });
  if(!r.ok)throw new Error("Match save failed");
  return r.json();
}
