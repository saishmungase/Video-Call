// import Room from "./room";


// class Manager{
//     private rooms : Room[]

//     constructor(){
//         this.rooms = [];
//     }

//     public createRoom(user : WebSocket, code : string){
//         const room = new Room(user, code);
//         this.rooms.push(room);
//         console.log("Room Created With Code => " + code + " by " + user.url)
//     }

//     public addToRoom(user : WebSocket, code : string){
//         this.rooms.map((room)=>{
//             if(room.code === code){
//                 room.addNewUser(user);
//                 console.log("Room Found")
//                 console.log("New User Added To Room " + room.code + " by entering " + code);
//             }
//         })
//     }

//     public createOffer(user : WebSocket, sdp : any){
//         this.rooms.map((room) => {
//             if(room.user1 === user || room.user2 === user){
//                 room.createOffer(user, sdp)
//                 console.log("User Created Offer");
//             }
//         })
//     }

//     public createAnswer(user : WebSocket, sdp : any){
//         this.rooms.map((room) => {
//             if(room.user1 === user || room.user2 === user){
//                 room.createAnswer(user, sdp)
//                 console.log("User Created Answer")
//             }
//         })
//     }

//     public iceCandidate(user : WebSocket, candidate : any){
//         this.rooms.map((room) => {
//             if(room.user1 === user || room.user2 === user){
//                 room.createAnswer(user, candidate)
//                 console.log("Ice Candidates Are Shared !")
//             }
//         })
//     }
// }

// export default Manager


import { WebSocket } from 'ws';
import Room from "./room";

class Manager {
    private rooms: Room[];

    constructor() {
        this.rooms = [];
    }

    public createRoom(user: WebSocket, code: string) {
        const existingRoom = this.findRoomByCode(code);
        
        if (existingRoom) {
            user.send(JSON.stringify({ 
                type: 'error', 
                message: 'Room with this code already exists' 
            }));
            return;
        }
        
        const room = new Room(user, code);
        this.rooms.push(room);
        console.log("Room Created With Code => " + code);
    }

    public addToRoom(user: WebSocket, code: string) {
        const room = this.findRoomByCode(code);
        
        if (!room) {
            user.send(JSON.stringify({ 
                type: 'error', 
                message: 'Room not found' 
            }));
            return;
        }
        
        if (room.user1 && room.user2) {
            user.send(JSON.stringify({ 
                type: 'error', 
                message: 'Room is full' 
            }));
            return;
        }
        
        room.addNewUser(user);
        console.log("New User Added To Room " + room.code);
    }

    public createOffer(user: WebSocket, sdp: any) {
        const room = this.findRoomByUser(user);
        
        if (room) {
            room.createOffer(user, sdp);
            console.log("User Created Offer");
        }
    }

    public createAnswer(user: WebSocket, sdp: any) {
        const room = this.findRoomByUser(user);
        
        if (room) {
            room.createAnswer(user, sdp);
            console.log("User Created Answer");
        }
    }

    public iceCandidate(user: WebSocket, candidate: any) {
        const room = this.findRoomByUser(user);
        
        if (room) {
            room.iceCandidates(user, candidate);
            console.log("Ice Candidates Are Shared!");
        }
    }

    public removeUser(user: WebSocket) {
        const room = this.findRoomByUser(user);
        
        if (room) {
            room.removeUser(user);
            
            // Clean up empty rooms
            if (!room.user1 && !room.user2) {
                this.rooms = this.rooms.filter(r => r !== room);
                console.log("Room removed: " + room.code);
            }
        }
    }

    private findRoomByCode(code: string): Room | undefined {
        return this.rooms.find(room => room.code === code);
    }

    private findRoomByUser(user: WebSocket): Room | undefined {
        return this.rooms.find(room => room.user1 === user || room.user2 === user);
    }
}

export default Manager;