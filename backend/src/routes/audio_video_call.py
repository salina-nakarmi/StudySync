from fastapi import APIRouter, HTTPException
from .schemas.audio_video_call import TokenRequest 
from livekit.api import AccessToken, VideoGrants
import os 
import dotenv

dotenv.load_dotenv()

key = os.getenv("LIVEKIT_API_KEY')")
secret_key = os.getenv("LIVEKIT_API_SECRET)")


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