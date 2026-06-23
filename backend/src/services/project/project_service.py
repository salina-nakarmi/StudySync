# services/project_service.py
"""
Business logic for Projects and ProjectMembers.

Ownership model (matches Jira/Linear pattern, per earlier discussion):
  - Projects.project_owner_id  = "who owns this" (transferable, quick lookup)
  - ProjectMembers.role='owner' = used for every permission check
  - The two are kept in sync: creator becomes owner in both places atomically.
"""
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from fastapi import HTTPException, status

from ...database.models import Projects, ProjectMembers, Tasks, TeamMembers, Users, TaskStatus


# ============================================================
# PERMISSION HELPERS
# ============================================================

async def get_membership(db: AsyncSession, project_id: int, member_id: int) -> ProjectMembers | None:
    """Returns the ProjectMembers row if this member belongs to this project, else None."""
    result = await db.execute(
        select(ProjectMembers).where(
            ProjectMembers.project_id == project_id,
            ProjectMembers.member_id == member_id,
        )
    )
    return result.scalar_one_or_none()


async def require_membership(db: AsyncSession, project_id: int, member_id: int) -> ProjectMembers:
    """Use for any endpoint that just requires being on the project (viewing tasks, etc.)."""
    membership = await get_membership(db, project_id, member_id)
    if membership is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this project.",
        )
    return membership


async def require_owner(db: AsyncSession, project_id: int, member_id: int) -> ProjectMembers:
    """Use for owner-only actions: invite, delete project, change roles, update settings."""
    membership = await require_membership(db, project_id, member_id)
    if membership.role != "owner":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only project owners can perform this action.",
        )
    return membership


# ============================================================
# PROJECT CRUD
# ============================================================

async def get_project_or_404(db: AsyncSession, project_id: int) -> Projects:
    result = await db.execute(select(Projects).where(Projects.project_id == project_id))
    project = result.scalar_one_or_none()
    if project is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found.")
    return project


async def create_project(db: AsyncSession, creator_member_id: int, data: dict) -> Projects:
    """
    Creates a project and atomically makes the creator the owner —
    both project_owner_id AND a ProjectMembers row with role='owner'.
    """
    project = Projects(
        project_name=data["project_name"],
        description=data.get("description"),
        budget=data.get("budget", 0.0),
        status=data.get("status"),
        health_indicator=data.get("health_indicator"),
        is_github_integrated=data.get("is_github_integrated", False),
        github_repo_owner=data.get("github_repo_owner"),
        github_repo_name=data.get("github_repo_name"),
        project_owner_id=creator_member_id,
    )
    db.add(project)
    await db.flush()  # get project.project_id

    membership = ProjectMembers(
        project_id=project.project_id,
        member_id=creator_member_id,
        role="owner",
    )
    db.add(membership)
    await db.flush()

    return project


async def list_projects_for_member(db: AsyncSession, member_id: int) -> list[dict]:
    """
    Projects this member belongs to (owner or member), with lightweight
    counts for the list view — avoids N+1 by aggregating per project.
    """
    result = await db.execute(
        select(Projects)
        .join(ProjectMembers, ProjectMembers.project_id == Projects.project_id)
        .where(ProjectMembers.member_id == member_id)
        .order_by(Projects.created_at.desc())
    )
    projects = result.scalars().all()

    output = []
    for project in projects:
        output.append(await _attach_list_counts(db, project))
    return output


async def _attach_list_counts(db: AsyncSession, project: Projects) -> dict:
    member_count_result = await db.execute(
        select(func.count()).select_from(ProjectMembers).where(ProjectMembers.project_id == project.project_id)
    )
    member_count = member_count_result.scalar_one()

    task_count_result = await db.execute(
        select(func.count()).select_from(Tasks).where(Tasks.project_id == project.project_id)
    )
    task_count = task_count_result.scalar_one()

    completed_result = await db.execute(
        select(func.count()).select_from(Tasks).where(
            Tasks.project_id == project.project_id,
            Tasks.status == TaskStatus.DONE,
        )
    )
    completed_task_count = completed_result.scalar_one()

    return {
        "project_id": project.project_id,
        "project_name": project.project_name,
        "description": project.description,
        "status": project.status,
        "health_indicator": project.health_indicator,
        "budget": float(project.budget),
        "is_github_integrated": project.is_github_integrated,
        "created_at": project.created_at,
        "member_count": member_count,
        "task_count": task_count,
        "completed_task_count": completed_task_count,
    }


async def get_project_detail(db: AsyncSession, project_id: int) -> dict:
    """Full detail view — includes member list with names, task counts."""
    project = await get_project_or_404(db, project_id)

    members_result = await db.execute(
        select(ProjectMembers, Users)
        .join(TeamMembers, TeamMembers.member_id == ProjectMembers.member_id)
        .join(Users, Users.user_id == TeamMembers.user_id)
        .where(ProjectMembers.project_id == project_id)
    )
    members = []
    for pm, user in members_result.all():
        members.append({
            "member_id": pm.member_id,
            "username": user.username,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "role": pm.role,
            "joined_at": pm.joined_at,
        })

    task_count_result = await db.execute(
        select(func.count()).select_from(Tasks).where(Tasks.project_id == project_id)
    )
    task_count = task_count_result.scalar_one()

    completed_result = await db.execute(
        select(func.count()).select_from(Tasks).where(
            Tasks.project_id == project_id,
            Tasks.status == TaskStatus.DONE,
        )
    )
    completed_task_count = completed_result.scalar_one()

    return {
        "project_id": project.project_id,
        "project_name": project.project_name,
        "description": project.description,
        "status": project.status,
        "health_indicator": project.health_indicator,
        "budget": float(project.budget),
        "project_owner_id": project.project_owner_id,
        "is_github_integrated": project.is_github_integrated,
        "github_repo_owner": project.github_repo_owner,
        "github_repo_name": project.github_repo_name,
        "created_at": project.created_at,
        "updated_at": project.updated_at,
        "members": members,
        "task_count": task_count,
        "completed_task_count": completed_task_count,
    }


async def update_project(db: AsyncSession, project_id: int, data: dict) -> Projects:
    """Owner-only — permission check happens in the route via require_owner()."""
    project = await get_project_or_404(db, project_id)

    for field in (
        "project_name", "description", "budget", "status",
        "health_indicator", "is_github_integrated",
        "github_repo_owner", "github_repo_name",
    ):
        if field in data and data[field] is not None:
            setattr(project, field, data[field])

    await db.flush()
    return project


async def delete_project(db: AsyncSession, project_id: int) -> None:
    """
    Cascade delete — Tasks, ProjectMembers, TimeLogs (via Tasks), and
    GithubCommits all have ON DELETE CASCADE on project_id/task_id,
    so deleting the Projects row is sufficient.
    """
    project = await get_project_or_404(db, project_id)
    await db.delete(project)
    await db.flush()


async def transfer_ownership(db: AsyncSession, project_id: int, new_owner_member_id: int) -> Projects:
    """
    Keeps project_owner_id and ProjectMembers.role in sync, as discussed —
    old owner becomes a regular member, new owner's role is set to 'owner'.
    """
    project = await get_project_or_404(db, project_id)

    new_owner_membership = await get_membership(db, project_id, new_owner_member_id)
    if new_owner_membership is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New owner must already be a project member.",
        )

    if project.project_owner_id is not None:
        old_owner_membership = await get_membership(db, project_id, project.project_owner_id)
        if old_owner_membership:
            old_owner_membership.role = "member"

    new_owner_membership.role = "owner"
    project.project_owner_id = new_owner_member_id

    await db.flush()
    return project


# ============================================================
# PROJECT MEMBERS
# ============================================================

async def list_project_members(db: AsyncSession, project_id: int) -> list[dict]:
    result = await db.execute(
        select(ProjectMembers, Users)
        .join(TeamMembers, TeamMembers.member_id == ProjectMembers.member_id)
        .join(Users, Users.user_id == TeamMembers.user_id)
        .where(ProjectMembers.project_id == project_id)
    )
    return [
        {
            "member_id": pm.member_id,
            "username": user.username,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "role": pm.role,
            "joined_at": pm.joined_at,
        }
        for pm, user in result.all()
    ]


async def update_member_role(db: AsyncSession, project_id: int, target_member_id: int, new_role: str) -> ProjectMembers:
    membership = await get_membership(db, project_id, target_member_id)
    if membership is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="This person is not a project member.")

    membership.role = new_role
    await db.flush()
    return membership


async def remove_member(db: AsyncSession, project_id: int, target_member_id: int) -> None:
    membership = await get_membership(db, project_id, target_member_id)
    if membership is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="This person is not a project member.")

    project = await get_project_or_404(db, project_id)
    if project.project_owner_id == target_member_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot remove the project owner. Transfer ownership first.",
        )

    await db.delete(membership)
    await db.flush()


async def add_member_to_project(db: AsyncSession, project_id: int, member_id: int, role: str = "member") -> ProjectMembers:
    """Used by the invitation-accept flow to actually attach the member to the project."""
    existing = await get_membership(db, project_id, member_id)
    if existing:
        return existing  # already a member — idempotent accept

    membership = ProjectMembers(project_id=project_id, member_id=member_id, role=role)
    db.add(membership)
    await db.flush()
    return membership