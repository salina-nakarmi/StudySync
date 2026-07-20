from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from ..database.database import get_db
from ..services.friends_service import FriendsService
from ..schemas.friends import (
    FriendRequestCreate,
    FriendListItem,
    SentFriendRequests,
    ReceivedFriendRequests,
    FriendRequestResponse
)
# Same Clerk-based auth every other route in this app uses (see utils.py).
# Adjust this import path if your utils.py lives somewhere other than src/utils.py.
from ..utils import authenticate_and_get_user_details

# NOTE: bare prefix here — app.py adds the "/api" prefix when it includes
# this router, same as every other route module (Dashboard, users, groups, etc).
# Previously this was prefix="/api/friends" AND app.py also passed prefix="/api"
# when including it, which would have produced "/api/api/friends/..." (404).
router = APIRouter(prefix="/friends", tags=["Friends"])

# Extracts the authenticated user_id from the verified Clerk token, same as
# every other route in the app. Previously this expected a literal "user_id"
# header, which the frontend never sends (it only sends Authorization: Bearer
# <token>) — that mismatch caused a 422 Unprocessable Entity on every request.
def get_current_user_id(request: Request) -> str:
    user_details = authenticate_and_get_user_details(request)
    return user_details["user_id"]

@router.post("/request", response_model=FriendRequestResponse)
async def send_friend_request(
    request_data: FriendRequestCreate,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Send a new friend request"""
    try:
        return await FriendsService.send_friend_request(db, sender_id=user_id, request_data=request_data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/request/{request_id}/accept")
async def accept_friend_request(
    request_id: int,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Accept an incoming pending friend request"""
    try:
        await FriendsService.accept_friend_request(db, request_id=request_id, user_id=user_id)
        return {"status": "success", "message": "Friend request accepted"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/request/{request_id}/reject")
async def reject_friend_request(
    request_id: int,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Reject an incoming pending friend request"""
    try:
        await FriendsService.reject_friend_request(db, request_id=request_id, user_id=user_id)
        return {"status": "success", "message": "Friend request rejected"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/my-friends", response_model=List[FriendListItem])
async def get_my_friends(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """List all accepted friendships"""
    return await FriendsService.get_friends_list(db, user_id=user_id)

@router.get("/requests/received", response_model=List[ReceivedFriendRequests])
async def get_received_requests(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """List friend requests sent to you"""
    return await FriendsService.get_received_requests(db, user_id=user_id)

@router.get("/requests/sent", response_model=List[SentFriendRequests])
async def get_sent_requests(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """List pending requests you have initiated"""
    return await FriendsService.get_sent_requests(db, user_id=user_id)

@router.delete("/{friend_id}")
async def remove_friendship(
    friend_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Unfriend or delete a connection"""
    try:
        await FriendsService.remove_friend(db, user_id=user_id, friend_id=friend_id)
        return {"status": "success", "message": "Friend removed successfully"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))