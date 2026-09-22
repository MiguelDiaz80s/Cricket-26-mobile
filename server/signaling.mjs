import { WebSocketServer } from "ws";
const port=Number(process.env.PORT||8787);
const rooms=new Map();
const wss=new WebSocketServer({port});
function send(ws,msg){if(ws.readyState===1)ws.send(JSON.stringify(msg))}
wss.on("connection",ws=>{
  let roomId=null;
  ws.on("message",raw=>{
    let msg;try{msg=JSON.parse(raw.toString())}catch{return}
    if(msg.type==="join"&&typeof msg.room==="string"){
      roomId=msg.room.slice(0,64);
      const room=rooms.get(roomId)||new Set();
      if(room.size>=2){send(ws,{type:"full"});return}
      room.add(ws);rooms.set(roomId,room);
      send(ws,{type:"joined",room:roomId,peers:room.size});
      for(const peer of room)if(peer!==ws)send(peer,{type:"peer-joined"});
      return;
    }
    if(!roomId)return;
    const room=rooms.get(roomId);if(!room)return;
    for(const peer of room)if(peer!==ws)send(peer,msg);
  });
  ws.on("close",()=>{if(!roomId)return;const room=rooms.get(roomId);if(!room)return;room.delete(ws);for(const peer of room)send(peer,{type:"peer-left"});if(!room.size)rooms.delete(roomId)});
});
console.log(`Cricket signaling server listening on ${port}`);