// import { WebSocket, WebSocketServer } from 'ws';
// import Manager from './manager';

// const wss = new WebSocketServer({ port: 8080 });

// const m = new Manager();

// wss.on("connection", (ws : WebSocket) => {
//   ws.on("error", () => console.log("Error !"));
//   console.log("User Is Connected !")
//   ws.on("message", function message(data : any){
//     console.log("User Have Message")
//     const message = JSON.parse(data);
//     console.log(message);
//     if(message.type === 'init'){
//       const code = message.code;
//       //@ts-ignore
//       m.createRoom(ws, code);
//       console.log("init => " + code)
//       const response = "message created with code " + code;
//       ws.send(response);
//     }
//     else if(message.type === 'join'){
//       const code = message.code;
//       //@ts-ignore
//       m.addToRoom(ws, code)
//       console.log("join => " + code)
//     }
//     else if(message.type === 'createOffer'){
//       //@ts-ignore
//       m.createOffer(ws, message.sdp)
//       console.log("createOffer => " + message.sdp)
//     }
//     else if(message.type === 'createAnswer'){
//       //@ts-ignore
//       m.createAnswer(ws, message.sdp)
//       console.log("createAnswer => " + message.sdp)
//     }
//     else if(message.type === 'iceCandidates'){
//       //@ts-ignore
//       m.iceCandidate(ws, message.candidate);
//       console.log("iceCandidates => " + message.candidate)
//     }
//   })
// })













import { WebSocket, WebSocketServer } from 'ws';
import Manager from './manager';

const wss = new WebSocketServer({ port: 8080 });
const m = new Manager();

wss.on("connection", (ws: WebSocket) => {
  console.log("User Connected!");
  
  ws.on("error", (error) => {
    console.log("WebSocket Error:", error);
  });
  
  ws.on("close", () => {
    console.log("User Disconnected!");
    m.removeUser(ws);
  });
  
  ws.on("message", function message(data: any) {
    try {
      const message = JSON.parse(data);
      console.log("Received message:", message);
      
      switch (message.type) {
        case 'init':
          const initCode = message.code;
          m.createRoom(ws, initCode);
          ws.send("message created with code " + initCode);
          break;
        
        case 'join':
          const joinCode = message.code;
          m.addToRoom(ws, joinCode);
          break;
        
        case 'createOffer':
          m.createOffer(ws, message.sdp);
          break;
        
        case 'createAnswer':
          m.createAnswer(ws, message.sdp);
          break;
        
        case 'iceCandidates':
          m.iceCandidate(ws, message.candidate);
          break;
        
        default:
          console.log("Unknown message type:", message.type);
          ws.send(JSON.stringify({ 
            type: 'error', 
            message: 'Unknown message type' 
          }));
      }
    } catch (error) {
      console.error("Error processing message:", error);
      ws.send(JSON.stringify({ 
        type: 'error', 
        message: 'Invalid message format' 
      }));
    }
  });
});





















































// let senderSocket: null | WebSocket = null;
// let receiverSocket: null | WebSocket = null;

// wss.on('connection', function connection(ws) {
//   ws.on('error', console.error);

//   ws.on('message', function message(data: any) {
//     const message = JSON.parse(data);
//     if (message.type === 'sender') {
//       console.log("sender added");
//       senderSocket = ws;
//     } else if (message.type === 'receiver') {
//       console.log("receiver added");
//       receiverSocket = ws;
//     } else if (message.type === 'createOffer') {
//       if (ws !== senderSocket) {
//         return;
//       }
//       console.log("sending offer");
//       receiverSocket?.send(JSON.stringify({ type: 'createOffer', sdp: message.sdp }));
//     } else if (message.type === 'createAnswer') {
//         if (ws !== receiverSocket) {
//           return;
//         }
//         console.log("sending answer");
//         senderSocket?.send(JSON.stringify({ type: 'createAnswer', sdp: message.sdp }));
//     } else if (message.type === 'iceCandidate') {
//       console.log("sending ice candidate")
//       if (ws === senderSocket) {
//         receiverSocket?.send(JSON.stringify({ type: 'iceCandidate', candidate: message.candidate }));
//       } else if (ws === receiverSocket) {
//         senderSocket?.send(JSON.stringify({ type: 'iceCandidate', candidate: message.candidate }));
//       }
//     }
//   });

// });