// import { useEffect, useState } from "react"

// export const Sender = () => {
//     const [socket, setSocket] = useState<WebSocket | null>(null);
//     const [pc, setPC] = useState<RTCPeerConnection | null>(null);

//     useEffect(() => {
//         const socket = new WebSocket('ws://localhost:8080');
//         setSocket(socket);
//         socket.onopen = () => {
//             socket.send(JSON.stringify({
//                 type: 'sender'
//             }));
//         }
//     }, []);

//     const initiateConn = async () => {

//         if (!socket) {
//             alert("Socket not found");
//             return;
//         }

//         const pc = new RTCPeerConnection();
//         setPC(pc);
//         pc.onnegotiationneeded = async () => {
//             console.error("onnegotiateion needed");
//             const offer = await pc.createOffer();
//             await pc.setLocalDescription(offer);
//             socket?.send(JSON.stringify({
//                 type: 'createOffer',
//                 sdp: pc.localDescription
//             }));
//         }

//         socket.onmessage = async (event) => {
//             const message = JSON.parse(event.data);
//             if (message.type === 'createAnswer') {
//                 await pc.setRemoteDescription(message.sdp);
//             } else if (message.type === 'iceCandidate') {
//                 pc.addIceCandidate(message.candidate);
//             }
//         }

//         pc.onicecandidate = (event) => {
//             if (event.candidate) {
//                 socket?.send(JSON.stringify({
//                     type: 'iceCandidate',
//                     candidate: event.candidate
//                 }));
//             }
//         }
            
//         getCameraStreamAndSend(pc);
//     }

//     const getCameraStreamAndSend = (pc: RTCPeerConnection) => {
//         navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
//             const video = document.createElement('video');
//             video.srcObject = stream;
//             video.play();
//             // this is wrong, should propogate via a component
//             document.body.appendChild(video);
//             stream.getTracks().forEach((track) => {
//                 console.error("track added");
//                 console.log(track);
//                 console.log(pc);
//                 pc?.addTrack(track);
//             });
//         });
//     }

//     return <div>
//         Sender
//         <button onClick={initiateConn}> Send data </button>
//     </div>
// }


import { useEffect, useState } from "react";

export const Sender = () => {
    const [socket, setSocket] = useState<WebSocket | null>(null);

    useEffect(() => {
        const socket = new WebSocket("ws://localhost:8080");
        setSocket(socket);

        socket.onopen = () => {
            socket.send(JSON.stringify({ type: "sender" }));
        };
    }, []);

    async function startSendingVideo() {
        if (!socket) return;

        const pc = new RTCPeerConnection();

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                socket.send(JSON.stringify({
                    type: "iceCandidate",
                    candidate: event.candidate
                }));
            }
        };

        pc.onnegotiationneeded = async () => {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            socket.send(JSON.stringify({
                type: "createOffer",
                sdp: pc.localDescription
            }));
        };

        socket.onmessage = (data) => {
            const message = JSON.parse(data.data);
            if (message.type === "createAnswer") {
                pc.setRemoteDescription(new RTCSessionDescription(message.sdp));
            } else if (message.type === "iceCandidate") {
                pc.addIceCandidate(new RTCIceCandidate(message.candidate));
            }
        };

        const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true
        });

        stream.getTracks().forEach(track => {
            pc.addTrack(track, stream);
        });

        // Show your own video
        const video = document.createElement("video");
        video.autoplay = true;
        video.muted = true;
        video.srcObject = stream;
        document.body.appendChild(video);
    }

    return (
        <div>
            <h2>Sender</h2>
            <button onClick={startSendingVideo}>Send Video</button>
        </div>
    );
};
