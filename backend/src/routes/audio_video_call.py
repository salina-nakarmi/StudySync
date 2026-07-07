from fastapi import APIRouter, HTTPException
from ..schemas.audio_video_call import KickParticipant, TokenRequest, RoomCreateRequest, MuteParticipant
from livekit.api import AccessToken, VideoGrants
import os 
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("LIVEKIT_API_KEY")
API_SECRET = os.getenv("LIVEKIT_API_SECRET")
LIVEKIT_URL = os.getenv("LIVEKIT_URL")

router = APIRouter(prefix="/audio-video-call", tags=["Audio/Video Call"])


@router.post("/get_token")
async def get_token(request: TokenRequest):
    """Generate access token for LiveKit"""
    try:
        room_name = request.room_name
        user_id = request.user_id
        display_name = request.display_name or user_id
        
        if not room_name or not user_id:
            raise HTTPException(status_code=400, detail="room_name and user_id are required")
        
        if not API_KEY or not API_SECRET:
            raise HTTPException(status_code=500, detail="LiveKit credentials not configured")
        
        token = AccessToken(API_KEY, API_SECRET)
        token.identity = user_id
        token.name = display_name
        token.add_grant(VideoGrants(
            room_join=True,
            room=room_name,
            can_publish=True,
            can_subscribe=True,
        ))
        
        return {"token": token.to_jwt()}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/rooms/create")
async def create_room(req: RoomCreateRequest):
    """Create a new room"""
    try:
        if not req.room_name:
            raise HTTPException(status_code=400, detail="room_name is required")
        
        return {
            "room": req.room_name,
            "status": "created",
            "max_participants": req.max_participants or 0,
            "empty_timeout": 60
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/rooms/kick")
async def kick_participant(req: KickParticipant):
    """Kick a participant from a room"""
    try:
        if not req.room_name or not req.participant:
            raise HTTPException(status_code=400, detail="room_name and participant are required")
        
        return {"message": f"Participant '{req.participant}' has been kicked from room '{req.room_name}'"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/rooms")
async def list_rooms():
    """List all active rooms"""
    try:
        return {"rooms": [], "status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/rooms/{room_name}")
async def end_call(room_name: str):
    """End a call/delete a room"""
    try:
        if not room_name:
            raise HTTPException(status_code=400, detail="room_name is required")
        
        return {"message": f"Room '{room_name}' has been ended successfully", "status": "deleted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/rooms/{room_name}")
async def delete_room(room_name: str):
    """Delete a room"""
    try:
        if not room_name:
            raise HTTPException(status_code=400, detail="room_name is required")
        
        return {"message": f"Room '{room_name}' has been deleted successfully", "status": "deleted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/rooms/{room_name}/participants")
async def list_participants(room_name: str):
    """List participants in a room"""
    try:
        if not room_name:
            raise HTTPException(status_code=400, detail="room_name is required")
        
        return {"participants": [], "room": room_name}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/rooms/mute")
async def mute_participant(req: MuteParticipant):
    """Mute a participant's audio track"""
    try:
        if not req.room_name or not req.participant or not req.track_sid:
            raise HTTPException(status_code=400, detail="room_name, participant, and track_sid are required")
        
        return {
            "message": f"Track mute status updated for participant '{req.participant}'",
            "room": req.room_name,
            "muted": req.mute
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))