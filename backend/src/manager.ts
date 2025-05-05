import Room from "./room";


class Manager{
    private rooms : Room[]

    constructor(){
        this.rooms = [];
    }

    public createRoom(user : WebSocket, code : string){
        const room = new Room(user, code);
        this.rooms.push(room);
        console.log("Room Created With Code => " + code + " by " + user.url)
    }

    public addToRoom(user : WebSocket, code : string){
        this.rooms.map((room)=>{
            if(room.code === code){
                room.addNewUser(user);
                console.log("Room Found")
                console.log("New User Added To Room " + room.code + " by entering " + code);
            }
        })
    }

    public createOffer(user : WebSocket, sdp : any){
        this.rooms.map((room) => {
            if(room.user1 === user || room.user2 === user){
                room.createOffer(user, sdp)
                console.log("User Created Offer");
            }
        })
    }

    public createAnswer(user : WebSocket, sdp : any){
        this.rooms.map((room) => {
            if(room.user1 === user || room.user2 === user){
                room.createAnswer(user, sdp)
                console.log("User Created Answer")
            }
        })
    }

    public iceCandidate(user : WebSocket, candidate : any){
        this.rooms.map((room) => {
            if(room.user1 === user || room.user2 === user){
                room.createAnswer(user, candidate)
                console.log("Ice Candidates Are Shared !")
            }
        })
    }
}

export default Manager