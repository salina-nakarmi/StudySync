# routes/project/team_members.py
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from ...database.database import get_db
from ...dependencies import get_current_user
from ...database.models import Users
from ...services.project import team_member_service
from ...schemas.projects import TeamMemberOnboard, TeamMemberUpdate, TeamMemberResponse

router = APIRouter(prefix="/team-members", tags=["team-members"])


@router.post("/onboard", response_model=TeamMemberResponse, status_code=status.HTTP_201_CREATED)
async def onboard_team_member(
    data: TeamMemberOnboard,
    current_user: Users = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """User opts into the project tracker by optionally setting github_username."""
    member = await team_member_service.onboard_team_member(
        db, current_user.user_id, data.github_username
    )
    await db.commit()
    return await team_member_service.build_team_member_response_data(db, member)


@router.get("/me", response_model=TeamMemberResponse)
async def get_my_team_member_profile(
    current_user: Users = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """404 if not onboarded yet — frontend uses this to decide whether to show the onboarding form."""
    member = await team_member_service.get_team_member_or_404(db, current_user.user_id)
    return await team_member_service.build_team_member_response_data(db, member)


@router.patch("/me", response_model=TeamMemberResponse)
async def update_my_team_member_profile(
    data: TeamMemberUpdate,
    current_user: Users = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    member = await team_member_service.update_team_member(
        db, current_user.user_id, data.github_username
    )
    await db.commit()
    return await team_member_service.build_team_member_response_data(db, member)