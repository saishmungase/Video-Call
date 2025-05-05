// import { useEffect, useState, useRef } from "react"

// export const Receiver = () => {
//     const [isPlaying, setIsPlaying] = useState<boolean>(false);
//     const videoRef = useRef<HTMLVideoElement | null>(null);
//     const socketRef = useRef<WebSocket | null>(null);
//     const peerConnectionRef = useRef<RTCPeerConnection | null>(null);

//     useEffect(() => {
//         // Create WebSocket connection
//         const socket = new WebSocket('ws://localhost:8080');
//         socketRef.current = socket;
        
//         socket.onopen = () => {
//             socket.send(JSON.stringify({
//                 type: 'receiver'
//             }));
//         }

//         // Setup RTCPeerConnection
//         const pc = new RTCPeerConnection();
//         peerConnectionRef.current = pc;

//         // Handle incoming tracks
//         pc.ontrack = (event) => {
//             console.log(event);
//             if (videoRef.current) {
//                 videoRef.current.srcObject = new MediaStream([event.track]);
//                 // Video will be played when user clicks the button
//             }
//         }

//         // Handle WebSocket messages
//         socket.onmessage = (event) => {
//             const message = JSON.parse(event.data);
//             if (message.type === 'createOffer') {
//                 pc.setRemoteDescription(message.sdp).then(() => {
//                     pc.createAnswer().then((answer) => {
//                         pc.setLocalDescription(answer);
//                         socket.send(JSON.stringify({
//                             type: 'createAnswer',
//                             sdp: answer
//                         }));
//                     });
//                 });
//             } else if (message.type === 'iceCandidate') {
//                 pc.addIceCandidate(message.candidate);
//             }
//         }

//         // Cleanup on unmount
//         return () => {
//             socket.close();
//             pc.close();
//         }
//     }, []);

//     const handlePlayVideo = () => {
//         if (videoRef.current) {
//             videoRef.current.play()
//                 .then(() => {
//                     setIsPlaying(true);
//                 })
//                 .catch(error => {
//                     console.error("Error playing video:", error);
//                 });
//         }
//     }

//     return (
//         <div id="video-player">
//             <video 
//                 ref={videoRef} 
//                 style={{ display: 'block', maxWidth: '100%' }}
//             />
//             {!isPlaying && (
//                 <button onClick={handlePlayVideo}>
//                     Play Video
//                 </button>
//             )}
//         </div>
//     )
// }



import { useEffect, useRef } from "react";

export const Receiver = () => {
    const pcRef = useRef<RTCPeerConnection | null>(null);
    const videoRef = useRef<HTMLVideoElement | null>(null);

    useEffect(() => {
        const socket = new WebSocket("ws://localhost:8080");
        
        const pc = new RTCPeerConnection({
            iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
        });
        pcRef.current = pc;

        socket.onopen = () => {
            socket.send(JSON.stringify({ type: "receiver" }));
        };

        pc.ontrack = (event) => {
            const stream = event.streams[0];
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        };

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                socket.send(JSON.stringify({
                    type: "iceCandidate",
                    candidate: event.candidate
                }));
            }
        };

        socket.onmessage = async (event) => {
            const message = JSON.parse(event.data);

            if (message.type === "createOffer") {
                await pc.setRemoteDescription(new RTCSessionDescription(message.sdp));
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);

                socket.send(JSON.stringify({
                    type: "createAnswer",
                    sdp: pc.localDescription
                }));
            }

            else if (message.type === "iceCandidate" && message.candidate) {
                try {
                    await pc.addIceCandidate(new RTCIceCandidate(message.candidate));
                } catch (err) {
                    console.error("Error adding ICE candidate:", err);
                }
            }
        };

        return () => {
            socket.close();
            pc.close();
        };
    }, []);

    return (
        <div>
            <h2>Receiver</h2>
            <video ref={videoRef} autoPlay playsInline controls />
        </div>
    );
};
