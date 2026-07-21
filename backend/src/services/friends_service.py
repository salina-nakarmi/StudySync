from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, and_, delete
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

        if sender_id == receiver_id:
            raise ValueError("You cannot send a friend request to yourself")

        # 1. Check if users exist
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

        # 2. Check if already friends
        existing_friend = await session.execute(
            select(Friends).where(
                (Friends.user_id == sender_id) & (Friends.friend_id == receiver_id)
            )
        )
        if existing_friend.scalar_one_or_none():
            raise ValueError("Users are already friends")

        # 3. Check for existing active or pending request between the two users
        existing_request = await session.execute(
            select(FriendRequest).where(
                or_(
                    and_(
                        FriendRequest.sender_id == sender_id,
                        FriendRequest.receiver_id == receiver_id,
                    ),
                    and_(
                        FriendRequest.sender_id == receiver_id,
                        FriendRequest.receiver_id == sender_id,
                    ),
                )
            )
        )
        req = existing_request.scalar_one_or_none()
        if req:
            if req.status == "pending":
                if req.sender_id == sender_id:
                    raise ValueError("Friend request already sent and pending")
                else:
                    raise ValueError(
                        "This user has already sent you a friend request. Accept their request instead."
                    )
            elif req.status == "accepted":
                raise ValueError("Users are already friends")

        # 4. Create new request (or overwrite rejected request)
        if req and req.status == "rejected":
            req.sender_id = sender_id
            req.receiver_id = receiver_id
            req.status = "pending"
            new_request = req
        else:
            new_request = FriendRequest(
                sender_id=sender_id, receiver_id=receiver_id, status="pending"
            )
            session.add(new_request)

        # 5. Build Notification
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

        # Single atomic commit for request + notification
        await session.commit()
        await session.refresh(new_request)

        return new_request

    @staticmethod
    async def accept_friend_request(
        session: AsyncSession, request_id: int, user_id: str
    ):
        """Accept a friend request and create bi-directional friendship"""
        # 1. Retrieve the friend request
        request = await session.execute(
            select(FriendRequest).where(FriendRequest.id == request_id)
        )
        friend_request = request.scalar_one_or_none()

        if not friend_request:
            raise ValueError("Friend request not found")

        if friend_request.receiver_id != user_id:
            raise ValueError("Not authorized to accept this request")

        if friend_request.status != "pending":
            raise ValueError("Request is no longer pending")

        sender_id = friend_request.sender_id
        receiver_id = friend_request.receiver_id

        # 2. Retrieve receiver details for notification text
        receiver_result = await session.execute(
            select(Users).where(Users.user_id == receiver_id)
        )
        receiver_user = receiver_result.scalar_one_or_none()
        receiver_name = (
            f"{receiver_user.first_name or ''} {receiver_user.last_name or ''}".strip()
            or (receiver_user.username if receiver_user else "Someone")
        )

        # 3. Create bi-directional connection safely (ignore if rows already exist)
        existing_connection = await session.execute(
            select(Friends).where(
                (Friends.user_id == sender_id) & (Friends.friend_id == receiver_id)
            )
        )
        if not existing_connection.scalar_one_or_none():
            friend_connection_1 = Friends(user_id=sender_id, friend_id=receiver_id)
            friend_connection_2 = Friends(user_id=receiver_id, friend_id=sender_id)
            session.add_all([friend_connection_1, friend_connection_2])

        # 4. Update status on current request
        friend_request.status = "accepted"
        session.add(friend_request)

        # 5. Create notification inside the same transaction
        await create_notification(
            CreateNotificationRequest(
                user_id=sender_id,
                title="Friend Request Accepted",
                message=f"{receiver_name} accepted your friend request",
                type="friend_request_accepted",
            ),
            session,
        )

        # 6. Single atomic commit for all operations
        await session.commit()
        await session.refresh(friend_request)

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
            )
            .join(Friends, Friends.friend_id == Users.user_id)
            .where(Friends.user_id == user_id)
        )

        return [
            FriendListItem(
                user_id=row[0],
                email=row[1],
                full_name=f"{row[2] or ''} {row[3] or ''}".strip() or row[1],
                profile_image=None,
                created_at=row[4],
            )
            for row in result.all()
        ]

    @staticmethod
    async def get_sent_requests(session: AsyncSession, user_id: str) -> list:
        """Get all pending sent friend requests"""
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
            .where(
                (FriendRequest.sender_id == user_id)
                & (FriendRequest.status == "pending")
            )
            .order_by(FriendRequest.created_at.desc())
        )

        return [
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

    @staticmethod
    async def get_received_requests(session: AsyncSession, user_id: str) -> list:
        """Get all pending received friend requests"""
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
            .where(
                (FriendRequest.receiver_id == user_id)
                & (FriendRequest.status == "pending")
            )
            .order_by(FriendRequest.created_at.desc())
        )

        return [
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

    @staticmethod
    async def remove_friend(session: AsyncSession, user_id: str, friend_id: str):
        """Remove a friend connection (both directions)"""
        # Delete both bidirectional rows directly in SQL
        await session.execute(
            delete(Friends).where(
                or_(
                    and_(
                        Friends.user_id == user_id,
                        Friends.friend_id == friend_id,
                    ),
                    and_(
                        Friends.user_id == friend_id,
                        Friends.friend_id == user_id,
                    ),
                )
            )
        )

        # Reset any friend_requests between them to rejected or clean up
        await session.execute(
            delete(FriendRequest).where(
                or_(
                    and_(
                        FriendRequest.sender_id == user_id,
                        FriendRequest.receiver_id == friend_id,
                    ),
                    and_(
                        FriendRequest.sender_id == friend_id,
                        FriendRequest.receiver_id == user_id,
                    ),
                )
            )
        )

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