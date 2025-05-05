
class Room{
    public user1 : WebSocket | null;
    public user2 : WebSocket | null;
    public code : string;

    constructor(user1 : WebSocket, code : string){
        this.user1 = user1;
        this.code = code;
        this.user2 = null
    }

    public addNewUser(user2 : WebSocket){
        this.user2 = user2;
    }

    public removeUser(user : WebSocket){
        (user === this.user1) ? this.user1 = null : this.user2 = null;
    }

    public createOffer(user : WebSocket, sdp : any){
        if(user === this.user1){
            this.user2?.send(JSON.stringify({ type: 'createOffer', sdp : sdp }));
        }
        else if(user === this.user2){
            this.user1?.send(JSON.stringify({ type: 'createOffer', sdp : sdp}));
        }
    }

    public createAnswer(user : WebSocket, sdp : any){
        if(user === this.user1){
            this.user2?.send(JSON.stringify({ type: 'createAnswer', sdp : sdp }));
        }
        else if(user === this.user2){
            this.user1?.send(JSON.stringify({ type: 'createAnswer', sdp : sdp}));
        }
    }

    public iceCandidates(user : WebSocket, candidate : any){
        if(user === this.user1){
            this.user2?.send(JSON.stringify({ type: 'iceCandidate', candidate : candidate }));
        }
        else if(user === this.user2){
            this.user1?.send(JSON.stringify({ type: 'iceCandidate', candidate : candidate}));
        }
    }
    
}

export default Room