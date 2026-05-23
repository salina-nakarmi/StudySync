from fastapi import APIRouter, HTTPException
from backend.src.schemas.audio_video_call import KickParticipant, TokenRequest, RoomCreateRequest
from livekit.api import AccessToken, VideoGrants, CreateRoomRequest, RoomParticipantIdentity, ListRoommsRequest, DeleteRoomRequest, ListParticipantsRequest
import os 
import dotenv

dotenv.load_dotenv()

key = os.getenv("LIVEKIT_API_KEY')")
secret_key = os.getenv("LIVEKIT_API_SECRET)")
url = os.getenv("LIVEKIT_URL")

router = APIRouter(prefix="/audio-video-call", tags=["Audio/Video Call"])


@router.post("/get_token")
async def get_token(request: TokenRequest):
    room_name = request.get("room_name")
    participant = request.get("user_id")
    participant_name = request.get("display_name", )
    if not room_name or not participant:
        raise HTTPException(status_code=400, detail= "room_name and user_id are required")
    
    token = AccessToken(key, secret_key).with_identity(participant).with_name(participant_name) \
    .with_grants(
        VideoGrants(
            room_join = True,
            room = request.get("room_name"),
            can_publish = True,
            can_subscribe = True,
        )
    )
    return {"token" : token.to_jwwt()}



@router.post("/rooms/create") 
async def create_room(req: RoomCreateRequest):
    room_name = req.room_name
    if not room_name:
        raise HTTPException(status_code= 400, detail= "room_name is required")
    async with LiveKitAPI(url, key, secret_key) as api:
        room = await api.room.create_room(CreateRoomRequest(
            name= req.room_name,
            max_participants = req.max_participants,
            empty_timeout = 60
        ))

        return {"room" : room.name, "sid": room.sid}
    


@router.post("/rooms/{room_name}/kick/{participant}")
async def kick_participant(req : KickParticipant):
    room_name = req.room_name
    participant = req.participant
    if not room_name or not participant:
        raise HTTPException(status_code= 400, detail = " room_name and participant are required")
    async with LiveKitAPI(url, key, secret_key) as api:
        await api.room.remove_participant(RoomParticipantIdentity(
            room = req.room_name,
            identity = req.participant
        ))
        return {"message" : f"'{req.participatant}' has been kicked from room '{req.room_name}'"}
    
@app.get("/rooms")
async def list_rooms():
    async with LiveKitAPI(url, key, secret_Key) as api:
        rooms = await api.room.list_rooms(ListRoomsRequest())
        return {
            "rooms": [
                {
                    "name": r.name,
                    'num_participants': r.num_participants,
                    "created_at": r.created_at,
                }
                for r in rooms
            ]
        }


@router.post("/rooms/{room_name}")
async def end_call(room_name: str):
    if not room_name:
        raise HTTPException(status_code = 400, details= "room_name is required")
    async with LiveKitAPI(url, key, secret_key) as api:
        await api.room.delete_room(DeleteRoomRequest(room= room_name))
        return{"message": f"Room '{room_name } has been ended successfully"}
    

@router.post("/rooms/{room_name}/parrticipants")
async def list_participants(room_name: str):
    if not room_name:
        raise HTTPException(status_code = 400, details = " roomm_name is required")
    async with LiveKitAPI(url,key, secret_key) as api:
        participants = await api.room.list_participants(ListParticipantsRequest(room = room_name))
        return {
            "participants":[
                {
                    "identity": p.identity,
                    "name": p.name
                }
                for p in participants
            ]
        }
         

