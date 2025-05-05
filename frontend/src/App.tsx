import React, { useState, useEffect, useRef } from 'react';
import './App.css';

interface Message {
  type: string;
  code?: string;
  sdp?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidate;
}

function App() {
  // State variables
  const [mode, setMode] = useState<'create' | 'join' | 'connected' | 'idle'>('idle');
  const [roomCode, setRoomCode] = useState<string>('');
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isCallStarted, setIsCallStarted] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Refs
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const websocketRef = useRef<WebSocket | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  // Initialize WebSocket connection
  useEffect(() => {
    websocketRef.current = new WebSocket('ws://localhost:8080');
    
    websocketRef.current.onopen = () => {
      console.log('Connected to WebSocket server');
    };
    
    websocketRef.current.onclose = () => {
      console.log('Disconnected from WebSocket server');
      setIsConnected(false);
    };
    
    websocketRef.current.onerror = (error) => {
      console.error('WebSocket error:', error);
      setErrorMessage('Failed to connect to server');
    };
    
    websocketRef.current.onmessage = handleWebSocketMessage;
    
    return () => {
      if (websocketRef.current) {
        websocketRef.current.close();
      }
      
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
      
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
    };
  }, []);

  // Handle WebSocket messages
  const handleWebSocketMessage = (event: MessageEvent) => {
    const message = JSON.parse(event.data);
    console.log('Received message:', message);
    
    switch (message.type) {
      case 'roomCreated':
        setMode('create');
        setIsConnected(true);
        setRoomCode(message.code || roomCode);
        break;
      
      case 'roomJoined':
        setMode('join');
        setIsConnected(true);
        initializeCall();
        break;
      
      case 'offer':
        handleOffer(message.sdp);
        break;
      
      case 'answer':
        handleAnswer(message.sdp);
        break;
      
      case 'iceCandidate':
        handleIceCandidate(message.candidate);
        break;
      
      case 'error':
        setErrorMessage(message.message || 'An error occurred');
        break;
        
      default:
        console.log('Unhandled message type:', message.type);
    }
  };

  // Create a room
  const createRoom = async () => {
    try {
      await setupLocalStream();
      
      // Generate a room code locally first
      const generatedCode = generateRoomCode();
      setRoomCode(generatedCode);
      
      if (websocketRef.current) {
        const message: Message = {
          type: 'init',
          code: generatedCode
        };
        
        websocketRef.current.send(JSON.stringify(message));
      }
    } catch (error) {
      console.error('Error creating room:', error);
      setErrorMessage('Could not access camera or microphone');
    }
  };

  // Join a room
  const joinRoom = async () => {
    if (!roomCode.trim()) {
      setErrorMessage('Please enter a room code');
      return;
    }
    
    try {
      await setupLocalStream();
      
      if (websocketRef.current) {
        const message: Message = {
          type: 'join',
          code: roomCode
        };
        
        websocketRef.current.send(JSON.stringify(message));
      }
    } catch (error) {
      console.error('Error joining room:', error);
      setErrorMessage('Could not access camera or microphone');
    }
  };

  // Setup local media stream
  const setupLocalStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      
      localStreamRef.current = stream;
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      
      return stream;
    } catch (error) {
      console.error('Error accessing media devices:', error);
      throw error;
    }
  };

  // Initialize WebRTC call
  const initializeCall = async () => {
    try {
      // Ensure we have a local stream
      if (!localStreamRef.current) {
        await setupLocalStream();
      }
      
      // Create RTCPeerConnection
      const configuration = {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      };
      
      const peerConnection = new RTCPeerConnection(configuration);
      peerConnectionRef.current = peerConnection;
      
      // Add local tracks to peer connection
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => {
          if (localStreamRef.current) {
            peerConnection.addTrack(track, localStreamRef.current);
          }
        });
      }
      
      // Set up ICE candidate handling
      peerConnection.onicecandidate = (event) => {
        if (event.candidate && websocketRef.current) {
          const message: Message = {
            type: 'iceCandidates',
            candidate: event.candidate
          };
          
          websocketRef.current.send(JSON.stringify(message));
        }
      };
      
      // Handle incoming tracks
      peerConnection.ontrack = (event) => {
        if (remoteVideoRef.current && event.streams[0]) {
          remoteVideoRef.current.srcObject = event.streams[0];
          setIsCallStarted(true);
        }
      };
      
      // Create offer if in join mode
      if (mode === 'join') {
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        
        if (websocketRef.current) {
          const message: Message = {
            type: 'createOffer',
            sdp: offer
          };
          
          websocketRef.current.send(JSON.stringify(message));
        }
      }
    } catch (error) {
      console.error('Error initializing call:', error);
      setErrorMessage('Failed to initialize call');
    }
  };

  // Handle received offer
  const handleOffer = async (sdp: RTCSessionDescriptionInit) => {
    try {
      if (!peerConnectionRef.current) {
        await initializeCall();
      }
      
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(sdp));
        
        const answer = await peerConnectionRef.current.createAnswer();
        await peerConnectionRef.current.setLocalDescription(answer);
        
        if (websocketRef.current) {
          const message: Message = {
            type: 'createAnswer',
            sdp: answer
          };
          
          websocketRef.current.send(JSON.stringify(message));
        }
      }
    } catch (error) {
      console.error('Error handling offer:', error);
      setErrorMessage('Failed to process connection offer');
    }
  };

  // Handle received answer
  const handleAnswer = async (sdp: RTCSessionDescriptionInit) => {
    try {
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(sdp));
      }
    } catch (error) {
      console.error('Error handling answer:', error);
      setErrorMessage('Failed to process connection answer');
    }
  };

  // Handle received ICE candidate
  const handleIceCandidate = async (candidate: RTCIceCandidate) => {
    try {
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      }
    } catch (error) {
      console.error('Error handling ICE candidate:', error);
    }
  };

  // End the call
  const endCall = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
    
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    
    setIsCallStarted(false);
    setMode('idle');
    setRoomCode('');
  };

  // Generate a random room code
  const generateRoomCode = () => {
    // Generate a more readable room code: 3 letters followed by 3 numbers
    const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // Removed similar looking characters
    const numbers = '23456789'; // Removed 0 and 1 to avoid confusion
    
    let code = '';
    
    // Add 3 random letters
    for (let i = 0; i < 3; i++) {
      code += letters.charAt(Math.floor(Math.random() * letters.length));
    }
    
    // Add 3 random numbers
    for (let i = 0; i < 3; i++) {
      code += numbers.charAt(Math.floor(Math.random() * numbers.length));
    }
    
    return code;
  };

  return (
    <div className="app-container">
      <h1>Simple Video Chat</h1>
      
      {errorMessage && (
        <div className="error-message">
          {errorMessage}
          <button onClick={() => setErrorMessage('')}>Dismiss</button>
        </div>
      )}
      
      <div className="video-container">
        <div className="video-wrapper">
          <video 
            ref={localVideoRef} 
            autoPlay 
            muted 
            playsInline 
            className="local-video"
          />
          <div className="video-label">You</div>
        </div>
        
        <div className="video-wrapper">
          <video 
            ref={remoteVideoRef} 
            autoPlay 
            playsInline 
            className="remote-video"
          />
          <div className="video-label">Remote</div>
        </div>
      </div>
      
      <div className="controls">
        {!isConnected ? (
          <>
            <div className="control-group">
              <button onClick={createRoom} className="primary-button">Create Room</button>
            </div>
            
            <div className="control-group">
              <input 
                type="text" 
                placeholder="Enter Room Code" 
                value={roomCode} 
                onChange={(e) => setRoomCode(e.target.value)} 
              />
              <button onClick={joinRoom}>Join Room</button>
            </div>
          </>
        ) : (
          <>
            <div className="control-group">
              {mode === 'create' && (
                <div className="room-code-container">
                  <div className="room-code">
                    Room Code: <span>{roomCode}</span>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(roomCode);
                        alert('Room code copied to clipboard!');
                      }}
                      className="copy-button"
                    >
                      Copy
                    </button>
                  </div>
                  <div className="room-code-instructions">
                    Share this code with the person you want to call
                  </div>
                </div>
              )}
            </div>
            <div className="control-group">
              <button onClick={endCall} className="end-call-button">End Call</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default App;