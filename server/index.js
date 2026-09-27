import "dotenv/config";
import express from "express";
import cors from "cors";
import mysql from "mysql2/promise";

const app=express();
const port=Number(process.env.PORT||3000);
const pool=mysql.createPool({
  host:process.env.MYSQL_HOST,
  port:Number(process.env.MYSQL_PORT||3306),
  database:process.env.MYSQL_DATABASE,
  user:process.env.MYSQL_USER,
  password:process.env.MYSQL_PASSWORD,
  waitForConnections:true,
  connectionLimit:10
});

app.use(cors());
app.use(express.json({limit:"64kb"}));

function requireApiKey(req,res,next){
  if(!process.env.API_KEY || req.get("x-api-key")!==process.env.API_KEY){
    return res.status(401).json({error:"unauthorized"});
  }
  next();
}

app.get("/health",async(_req,res)=>{
  try{await pool.query("SELECT 1");res.json({ok:true});}
  catch(err){res.status(503).json({ok:false});}
});

app.get("/api/leaderboard",async(req,res)=>{
  const limit=Math.min(100,Math.max(1,Number(req.query.limit)||100));
  const [rows]=await pool.query(
    "SELECT u.username,s.total_runs,s.highest_score,s.wickets_taken FROM user_profiles u LEFT JOIN batting_statistics s ON s.user_id=u.user_id LEFT JOIN bowling_statistics b ON b.user_id=u.user_id ORDER BY COALESCE(s.total_runs,0) DESC, COALESCE(s.highest_score,0) DESC, COALESCE(b.wickets_taken,0) DESC LIMIT ?",
    [limit]
  );
  res.json({players:rows});
});

app.get("/api/profile/:userId",async(req,res)=>{
  const userId=Number(req.params.userId);
  if(!Number.isInteger(userId)||userId<1)return res.status(400).json({error:"invalid user id"});
  const [[profile]]=await pool.query("SELECT user_id,username,current_xp,soft_currency,premium_currency,account_created FROM user_profiles WHERE user_id=?",[userId]);
  if(!profile)return res.status(404).json({error:"profile not found"});
  const [[batting]]=await pool.query("SELECT * FROM batting_statistics WHERE user_id=?",[userId]);
  const [[bowling]]=await pool.query("SELECT * FROM bowling_statistics WHERE user_id=?",[userId]);
  const [[campaign]]=await pool.query("SELECT * FROM player_campaign_progress WHERE user_id=?",[userId]);
  res.json({profile,batting,bowling,campaign});
});

app.post("/api/matches/complete",requireApiKey,async(req,res)=>{
  const body=req.body||{};
  const userId=Number(body.userId);
  if(!Number.isInteger(userId)||userId<1)return res.status(400).json({error:"invalid userId"});
  const conn=await pool.getConnection();
  try{
    await conn.beginTransaction();
    const [matchResult]=await conn.execute(
      "INSERT INTO matches(user_id,format_name,home_team,away_team,result,user_runs,user_wickets) VALUES(?,?,?,?,?,?,?)",
      [userId,body.format,body.homeTeam,body.awayTeam,body.result,Math.max(0,Number(body.userRuns)||0),Math.max(0,Number(body.userWickets)||0)]
    );
    await conn.execute(
      "INSERT INTO batting_statistics(user_id,matches_played,innings_batted,total_runs,highest_score,balls_faced,fifties,hundreds,fours_hit,sixes_hit) VALUES(?,?,?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE matches_played=matches_played+1,innings_batted=innings_batted+?,total_runs=total_runs+?,highest_score=GREATEST(highest_score,?),balls_faced=balls_faced+?,fifties=fifties+?,hundreds=hundreds+?,fours_hit=fours_hit+?,sixes_hit=sixes_hit+?",
      [userId,1,1,Math.max(0,Number(body.userRuns)||0),Math.max(0,Number(body.userRuns)||0),Math.max(0,Number(body.ballsFaced)||0),Number(body.fifties)||0,Number(body.hundreds)||0,Number(body.fours)||0,Number(body.sixes)||0,
       1,Math.max(0,Number(body.userRuns)||0),Math.max(0,Number(body.userRuns)||0),Math.max(0,Number(body.ballsFaced)||0),Number(body.fifties)||0,Number(body.hundreds)||0,Number(body.fours)||0,Number(body.sixes)||0]
    );
    await conn.commit();
    res.json({ok:true,matchId:matchResult.insertId});
  }catch(err){
    await conn.rollback();
    res.status(500).json({error:"match save failed"});
  }finally{conn.release();}
});

app.post("/api/inventory/purchase",requireApiKey,async(req,res)=>{
  const userId=Number(req.body?.userId),itemId=String(req.body?.itemId||"");
  const cost=Math.max(0,Number(req.body?.cost)||0);
  if(!Number.isInteger(userId)||userId<1||!itemId||itemId.length>80)return res.status(400).json({error:"invalid purchase"});
  const conn=await pool.getConnection();
  try{
    await conn.beginTransaction();
    const [rows]=await conn.execute("SELECT soft_currency FROM user_profiles WHERE user_id=? FOR UPDATE",[userId]);
    if(!rows.length)return res.status(404).json({error:"profile not found"});
    if(rows[0].soft_currency<cost){await conn.rollback();return res.status(409).json({error:"insufficient currency"});}
    await conn.execute("UPDATE user_profiles SET soft_currency=soft_currency-? WHERE user_id=?",[cost,userId]);
    await conn.execute("INSERT IGNORE INTO inventory(user_id,item_id) VALUES(?,?)",[userId,itemId]);
    await conn.commit();
    res.json({ok:true});
  }catch(err){
    await conn.rollback();
    res.status(500).json({error:"purchase failed"});
  }finally{conn.release();}
});

app.listen(port,()=>console.log(`Cricket 26 API listening on :${port}`));
