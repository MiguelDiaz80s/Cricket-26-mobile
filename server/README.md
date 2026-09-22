# WebRTC signaling server
A minimal signaling relay for 1v1 Cricket 26 Mobile. It does not carry gameplay traffic after the WebRTC data channel is established.
Run:
npm install
node server/signaling.mjs
The browser sends join/offer/answer/ICE JSON messages through the room. Production deployment should use WSS/HTTPS and a short-lived authenticated room token.