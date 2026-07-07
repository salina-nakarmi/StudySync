# routes/project/projects.py
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from ...database.database import get_db
from ...dependencies import get_current_user
from ...database.models import Users
from ...services.project import team_member_service, project_service, github_service, time_log_service
from ...schemas.projects import (
    ProjectCreate, ProjectUpdate, ProjectResponse, ProjectListResponse,
    UpdateMemberRoleRequest, ProjectMemberSummary,
    GithubSyncResponse, GithubCommitResponse, ProjectTrackingResponse,
)

router = APIRouter(prefix="/projects", tags=["projects"])


# ============================================================
# PROJECTS
# ============================================================

@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(
    data: ProjectCreate,
    current_user: Users = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Creates a project and makes the current user its owner."""
    member = await team_member_service.get_team_member_or_404(db, current_user.user_id)

    project = await project_service.create_project(db, member.member_id, data.model_dump())
    await db.commit()

    return await project_service.get_project_detail(db, project.project_id)


@router.get("", response_model=list[ProjectListResponse])
async def list_my_projects(
    current_user: Users = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    member = await team_member_service.get_team_member_or_404(db, current_user.user_id)
    return await project_service.list_projects_for_member(db, member.member_id)


@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: int,
    current_user: Users = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    member = await team_member_service.get_team_member_or_404(db, current_user.user_id)
    await project_service.require_membership(db, project_id, member.member_id)
    return await project_service.get_project_detail(db, project_id)


@router.patch("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: int,
    data: ProjectUpdate,
    current_user: Users = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    member = await team_member_service.get_team_member_or_404(db, current_user.user_id)
    await project_service.require_owner(db, project_id, member.member_id)

    await project_service.update_project(db, project_id, data.model_dump(exclude_unset=True))
    await db.commit()

    return await project_service.get_project_detail(db, project_id)


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(
    project_id: int,
    current_user: Users = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Cascade deletes Tasks, ProjectMembers, TimeLogs, GithubCommits, ProjectInvitations."""
    member = await team_member_service.get_team_member_or_404(db, current_user.user_id)
    await project_service.require_owner(db, project_id, member.member_id)

    await project_service.delete_project(db, project_id)
    await db.commit()


@router.post("/{project_id}/transfer-ownership/{new_owner_member_id}", response_model=ProjectResponse)
async def transfer_ownership(
    project_id: int,
    new_owner_member_id: int,
    current_user: Users = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    member = await team_member_service.get_team_member_or_404(db, current_user.user_id)
    await project_service.require_owner(db, project_id, member.member_id)

    await project_service.transfer_ownership(db, project_id, new_owner_member_id)
    await db.commit()

    return await project_service.get_project_detail(db, project_id)


# ============================================================
# PROJECT MEMBERS
# ============================================================

@router.get("/{project_id}/members", response_model=list[ProjectMemberSummary])
async def list_project_members(
    project_id: int,
    current_user: Users = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    member = await team_member_service.get_team_member_or_404(db, current_user.user_id)
    await project_service.require_membership(db, project_id, member.member_id)
    return await project_service.list_project_members(db, project_id)


@router.patch("/{project_id}/members/{target_member_id}", response_model=ProjectMemberSummary)
async def update_member_role(
    project_id: int,
    target_member_id: int,
    data: UpdateMemberRoleRequest,
    current_user: Users = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    member = await team_member_service.get_team_member_or_404(db, current_user.user_id)
    await project_service.require_owner(db, project_id, member.member_id)

    membership = await project_service.update_member_role(db, project_id, target_member_id, data.role)
    await db.commit()

    members = await project_service.list_project_members(db, project_id)
    return next(m for m in members if m["member_id"] == membership.member_id)


@router.delete("/{project_id}/members/{target_member_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_member(
    project_id: int,
    target_member_id: int,
    current_user: Users = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    member = await team_member_service.get_team_member_or_404(db, current_user.user_id)
    await project_service.require_owner(db, project_id, member.member_id)

    await project_service.remove_member(db, project_id, target_member_id)
    await db.commit()


# ============================================================
# GITHUB SYNC
# ============================================================

@router.post("/{project_id}/github/sync", response_model=GithubSyncResponse)
async def sync_github_commits(
    project_id: int,
    current_user: Users = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Manual trigger only — per design, no scheduled/automatic sync."""
    member = await team_member_service.get_team_member_or_404(db, current_user.user_id)
    await project_service.require_membership(db, project_id, member.member_id)

    result = await github_service.sync_project_commits(db, project_id)
    await db.commit()
    return result


@router.get("/{project_id}/github/commits")
async def list_github_commits(
    project_id: int,
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
    current_user: Users = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    member = await team_member_service.get_team_member_or_404(db, current_user.user_id)
    await project_service.require_membership(db, project_id, member.member_id)
    return await github_service.list_project_commits(db, project_id, skip=skip, limit=limit)


# ============================================================
# TRACKING TAB
# ============================================================

@router.get("/{project_id}/tracking", response_model=ProjectTrackingResponse)
async def get_project_tracking(
    project_id: int,
    current_user: Users = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    member = await team_member_service.get_team_member_or_404(db, current_user.user_id)
    await project_service.require_membership(db, project_id, member.member_id)
    return await time_log_service.get_project_tracking(db, project_id)