from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from ..database.models import FriendRequest, Friends, Users
from ..schemas.friends import (
    FriendRequestCreate,
    FriendListItem,
    SentFriendRequests,
    ReceivedFriendRequests,
)
from ..schemas.notifications import CreateNotificationRequest
from .notification_service import create_notification

class FriendsService:
    """Service for managing friend requests and friendships"""

    @staticmethod
    async def send_friend_request(
        session: AsyncSession, sender_id: str, request_data: FriendRequestCreate
    ):
        """Send a friend request"""
        receiver_id = request_data.receiver_id

        # Check if users exist
        sender_result = await session.execute(
            select(Users).where(Users.user_id == sender_id)
        )
        receiver_result = await session.execute(
            select(Users).where(Users.user_id == receiver_id)
        )
        sender_user = sender_result.scalar_one_or_none()
        receiver_user = receiver_result.scalar_one_or_none()

        if not sender_user or not receiver_user:
            raise ValueError("One or both users do not exist")

        # Check if already friends
        existing_friend = await session.execute(
            select(Friends).where(
                ((Friends.user_id == sender_id) & (Friends.friend_id == receiver_id))
                | ((Friends.user_id == receiver_id) & (Friends.friend_id == sender_id))
            )
        )

        if existing_friend.scalar_one_or_none():
            raise ValueError("Users are already friends")

        # Check for existing request (avoid duplicates)
        existing_request = await session.execute(
            select(FriendRequest).where(
                (FriendRequest.sender_id == sender_id)
                & (FriendRequest.receiver_id == receiver_id)
            )
        )

        if existing_request.scalar_one_or_none():
            raise ValueError("Friend request already exists")

        # Create new request
        new_request = FriendRequest(
            sender_id=sender_id, receiver_id=receiver_id, status="pending"
        )
        session.add(new_request)
        await session.commit()
        await session.refresh(new_request)

        # Notify the receiver — flush()es here get picked up by the final
        # commit() the get_db() dependency runs after this request completes.
        sender_name = (
            f"{sender_user.first_name or ''} {sender_user.last_name or ''}".strip()
            or sender_user.username
        )
        await create_notification(
            CreateNotificationRequest(
                user_id=receiver_id,
                title="New Friend Request",
                message=f"{sender_name} sent you a friend request",
                type="friend_request",
            ),
            session,
        )

        return new_request

    @staticmethod
    async def accept_friend_request(
        session: AsyncSession, request_id: int, user_id: str
    ):
        """Accept a friend request"""
        request = await session.execute(
            select(FriendRequest).where(FriendRequest.id == request_id)
        )
        friend_request = request.scalar_one_or_none()

        if not friend_request:
            raise ValueError("Friend request not found")

        if friend_request.receiver_id != user_id:
            raise ValueError("Not authorized to accept this request")

        if friend_request.status != "pending":
            raise ValueError("Request is not pending")

        # Create bidirectional friendship
        friend_connection_1 = Friends(
            user_id=friend_request.sender_id, friend_id=friend_request.receiver_id
        )
        friend_connection_2 = Friends(
            user_id=friend_request.receiver_id, friend_id=friend_request.sender_id
        )

        # Update request status
        friend_request.status = "accepted"

        session.add(friend_connection_1)
        session.add(friend_connection_2)
        session.add(friend_request)
        await session.commit()
        await session.refresh(friend_request)

        # Notify whoever originally sent the request that it was accepted
        receiver_result = await session.execute(
            select(Users).where(Users.user_id == friend_request.receiver_id)
        )
        receiver_user = receiver_result.scalar_one_or_none()
        receiver_name = (
            f"{receiver_user.first_name or ''} {receiver_user.last_name or ''}".strip()
            or (receiver_user.username if receiver_user else "Someone")
        )
        await create_notification(
            CreateNotificationRequest(
                user_id=friend_request.sender_id,
                title="Friend Request Accepted",
                message=f"{receiver_name} accepted your friend request",
                type="friend_request_accepted",
            ),
            session,
        )

        return friend_request

    @staticmethod
    async def reject_friend_request(
        session: AsyncSession, request_id: int, user_id: str
    ):
        """Reject a friend request"""
        request = await session.execute(
            select(FriendRequest).where(FriendRequest.id == request_id)
        )
        friend_request = request.scalar_one_or_none()

        if not friend_request:
            raise ValueError("Friend request not found")

        if friend_request.receiver_id != user_id:
            raise ValueError("Not authorized to reject this request")

        friend_request.status = "rejected"
        session.add(friend_request)
        await session.commit()
        await session.refresh(friend_request)

        return friend_request

    @staticmethod
    async def get_friends_list(session: AsyncSession, user_id: str) -> list:
        """Get list of all friends for a user"""
        result = await session.execute(
            select(
                Users.user_id,
                Users.email,
                Users.first_name,
                Users.last_name,
                Users.created_at,
            ).join(Friends, Friends.friend_id == Users.user_id).where(
                Friends.user_id == user_id
            )
        )

        friends = [
            FriendListItem(
                user_id=row[0],
                email=row[1],
                full_name=f"{row[2] or ''} {row[3] or ''}".strip() or row[1],
                profile_image=None,
                created_at=row[4],
            )
            for row in result.all()
        ]

        return friends

    @staticmethod
    async def get_sent_requests(session: AsyncSession, user_id: str) -> list:
        """Get all sent friend requests"""
        result = await session.execute(
            select(
                FriendRequest.id,
                FriendRequest.receiver_id,
                Users.email,
                Users.first_name,
                Users.last_name,
                FriendRequest.status,
                FriendRequest.created_at,
            )
            .join(Users, FriendRequest.receiver_id == Users.user_id)
            .where(FriendRequest.sender_id == user_id)
        )

        requests = [
            SentFriendRequests(
                id=row[0],
                receiver_id=row[1],
                receiver_email=row[2],
                receiver_name=f"{row[3] or ''} {row[4] or ''}".strip() or row[2],
                status=row[5],
                created_at=row[6],
            )
            for row in result.all()
        ]

        return requests

    @staticmethod
    async def get_received_requests(session: AsyncSession, user_id: str) -> list:
        """Get all received friend requests"""
        result = await session.execute(
            select(
                FriendRequest.id,
                FriendRequest.sender_id,
                Users.email,
                Users.first_name,
                Users.last_name,
                FriendRequest.status,
                FriendRequest.created_at,
            )
            .join(Users, FriendRequest.sender_id == Users.user_id)
            .where(FriendRequest.receiver_id == user_id)
            .order_by(FriendRequest.created_at.desc())
        )

        requests = [
            ReceivedFriendRequests(
                id=row[0],
                sender_id=row[1],
                sender_email=row[2],
                sender_name=f"{row[3] or ''} {row[4] or ''}".strip() or row[2],
                status=row[5],
                created_at=row[6],
            )
            for row in result.all()
        ]

        return requests

    @staticmethod
    async def remove_friend(session: AsyncSession, user_id: str, friend_id: str):
        """Remove a friend connection (both directions)"""
        result = await session.execute(
            select(Friends).where(
                (
                    (Friends.user_id == user_id) & (Friends.friend_id == friend_id)
                )
                | ((Friends.user_id == friend_id) & (Friends.friend_id == user_id))
            )
        )

        friendships = result.scalars().all()

        if not friendships:
            raise ValueError("No friendship exists between these users")

        for friendship in friendships:
            await session.delete(friendship)

        await session.commit()
        return True

    @staticmethod
    async def check_friendship(
        session: AsyncSession, user_id: str, other_user_id: str
    ) -> bool:
        """Check if two users are friends"""
        result = await session.execute(
            select(Friends).where(
                (Friends.user_id == user_id) & (Friends.friend_id == other_user_id)
            )
        )

        return result.scalar_one_or_none() is not None