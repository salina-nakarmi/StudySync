# services/time_log_service.py
"""
Manual time logging — no timer, just "I worked N hours on this task."
Per earlier discussion: this is deliberately NOT like StudySessions.
StudySessions = habit tracking (seconds, via timer).
TimeLogs = effort tracking (hours, via manual entry).
"""
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

from ...database.models import TimeLogs, Tasks, TeamMembers, Users, Projects, GithubCommits


async def get_log_or_404(db: AsyncSession, log_id: int) -> TimeLogs:
    result = await db.execute(select(TimeLogs).where(TimeLogs.log_id == log_id))
    log = result.scalar_one_or_none()
    if log is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Time log not found.")
    return log


async def create_time_log(db: AsyncSession, task_id: int, member_id: int, data: dict) -> TimeLogs:
    log = TimeLogs(
        task_id=task_id,
        member_id=member_id,
        hours_spent=data["hours_spent"],
        logged_at=data.get("logged_at"),
        notes=data.get("notes"),
    )
    db.add(log)
    await db.flush()
    return log


async def _build_log_response(db: AsyncSession, log: TimeLogs) -> dict:
    task_result = await db.execute(select(Tasks.task_name).where(Tasks.task_id == log.task_id))
    task_name = task_result.scalar_one()

    member_result = await db.execute(
        select(Users.username)
        .join(TeamMembers, TeamMembers.user_id == Users.user_id)
        .where(TeamMembers.member_id == log.member_id)
    )
    username = member_result.scalar_one()

    return {
        "log_id": log.log_id,
        "task_id": log.task_id,
        "task_name": task_name,
        "member_id": log.member_id,
        "member_username": username,
        "hours_spent": float(log.hours_spent),
        "logged_at": log.logged_at,
        "notes": log.notes,
        "created_at": log.created_at,
    }


async def list_logs_for_task(db: AsyncSession, task_id: int) -> list[dict]:
    result = await db.execute(
        select(TimeLogs).where(TimeLogs.task_id == task_id).order_by(TimeLogs.logged_at.desc())
    )
    return [await _build_log_response(db, log) for log in result.scalars().all()]


async def list_logs_for_project(db: AsyncSession, project_id: int) -> list[dict]:
    """All time logs across all tasks in a project — used by the Tracking tab."""
    result = await db.execute(
        select(TimeLogs)
        .join(Tasks, Tasks.task_id == TimeLogs.task_id)
        .where(Tasks.project_id == project_id)
        .order_by(TimeLogs.logged_at.desc())
    )
    return [await _build_log_response(db, log) for log in result.scalars().all()]


async def delete_time_log(db: AsyncSession, log_id: int) -> None:
    log = await get_log_or_404(db, log_id)
    await db.delete(log)
    await db.flush()


# ============================================================
# TRACKING TAB ANALYTICS
# ============================================================

async def get_project_tracking(db: AsyncSession, project_id: int) -> dict:
    """
    Returns project-level time + commit activity in one response.
    """
    project_result = await db.execute(select(Projects).where(Projects.project_id == project_id))
    project = project_result.scalar_one_or_none()
    if project is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found.")

    # Per-member hours grouped by member
    breakdown_result = await db.execute(
        select(
            TeamMembers.member_id,
            Users.username,
            func.coalesce(func.sum(TimeLogs.hours_spent), 0).label("total_hours"),
        )
        .select_from(TimeLogs)
        .join(Tasks, Tasks.task_id == TimeLogs.task_id)
        .join(TeamMembers, TeamMembers.member_id == TimeLogs.member_id)
        .join(Users, Users.user_id == TeamMembers.user_id)
        .where(Tasks.project_id == project_id)
        .group_by(TeamMembers.member_id, Users.username)
    )

    member_breakdown = []
    total_hours = 0.0
    for member_id, username, member_total_hours in breakdown_result.all():
        member_total_hours = float(member_total_hours)
        total_hours += member_total_hours
        member_breakdown.append({
            "member_id": member_id,
            "username": username,
            "total_hours": member_total_hours,
        })

    recent_commits = []
    total_commit_count = 0
    if project.is_github_integrated:
        commits_result = await db.execute(
            select(GithubCommits)
            .where(GithubCommits.project_id == project_id)
            .order_by(GithubCommits.committed_at.desc())
            .limit(10)
        )
        commits = commits_result.scalars().all()

        for commit in commits:
            member_username = None
            if commit.member_id:
                username_result = await db.execute(
                    select(Users.username)
                    .join(TeamMembers, TeamMembers.user_id == Users.user_id)
                    .where(TeamMembers.member_id == commit.member_id)
                )
                member_username = username_result.scalar_one_or_none()

            recent_commits.append({
                "commit_id": commit.commit_id,
                "sha": commit.sha,
                "author_github_username": commit.author_github_username,
                "member_id": commit.member_id,
                "member_username": member_username,
                "commit_message": commit.commit_message,
                "commit_url": commit.commit_url,
                "committed_at": commit.committed_at,
            })

        count_result = await db.execute(
            select(func.count()).select_from(GithubCommits).where(GithubCommits.project_id == project_id)
        )
        total_commit_count = count_result.scalar_one()

    return {
        "project_id": project.project_id,
        "project_name": project.project_name,
        "total_hours": round(total_hours, 2),
        "member_breakdown": member_breakdown,
        "recent_commits": recent_commits,
        "total_commit_count": total_commit_count,
    }