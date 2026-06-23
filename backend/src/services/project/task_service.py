# services/task_service.py
"""
Business logic for Tasks. Both the full kanban (Tasks tab) and the
filtered view (My Tasks tab) hit the same list function with an
optional assigned_to filter — per earlier discussion, no separate endpoint needed.
"""
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

from ...database.models import Tasks, TimeLogs, TeamMembers, Users


async def get_task_or_404(db: AsyncSession, task_id: int) -> Tasks:
    result = await db.execute(select(Tasks).where(Tasks.task_id == task_id))
    task = result.scalar_one_or_none()
    if task is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found.")
    return task


async def create_task(db: AsyncSession, project_id: int, data: dict) -> Tasks:
    task = Tasks(
        project_id=project_id,
        task_name=data["task_name"],
        description=data.get("description"),
        status=data.get("status"),
        progress_percentage=data.get("progress_percentage", 0),
        assigned_to=data.get("assigned_to"),
        due_date=data.get("due_date"),
    )
    db.add(task)
    await db.flush()
    return task


async def list_tasks(db: AsyncSession, project_id: int, assigned_to: int | None = None) -> list[dict]:
    """
    assigned_to=None  -> full kanban (Tasks tab)
    assigned_to=<id>  -> filtered to one member (My Tasks tab, pass current member's id)
    """
    query = select(Tasks).where(Tasks.project_id == project_id)
    if assigned_to is not None:
        query = query.where(Tasks.assigned_to == assigned_to)
    query = query.order_by(Tasks.created_at.desc())

    result = await db.execute(query)
    tasks = result.scalars().all()

    return [await _build_task_response(db, task) for task in tasks]


async def get_task_detail(db: AsyncSession, task_id: int) -> dict:
    task = await get_task_or_404(db, task_id)
    return await _build_task_response(db, task)


async def _build_task_response(db: AsyncSession, task: Tasks) -> dict:
    """Attaches total_hours_logged and assignee_username — computed, not stored."""
    hours_result = await db.execute(
        select(func.coalesce(func.sum(TimeLogs.hours_spent), 0)).where(TimeLogs.task_id == task.task_id)
    )
    total_hours = float(hours_result.scalar_one())

    assignee_username = None
    if task.assigned_to is not None:
        result = await db.execute(
            select(Users.username)
            .join(TeamMembers, TeamMembers.user_id == Users.user_id)
            .where(TeamMembers.member_id == task.assigned_to)
        )
        assignee_username = result.scalar_one_or_none()

    return {
        "task_id": task.task_id,
        "project_id": task.project_id,
        "task_name": task.task_name,
        "description": task.description,
        "status": task.status,
        "progress_percentage": task.progress_percentage,
        "assigned_to": task.assigned_to,
        "due_date": task.due_date,
        "created_at": task.created_at,
        "updated_at": task.updated_at,
        "total_hours_logged": total_hours,
        "assignee_username": assignee_username,
    }


async def update_task(db: AsyncSession, task_id: int, data: dict) -> Tasks:
    task = await get_task_or_404(db, task_id)

    for field in ("task_name", "description", "status", "progress_percentage", "assigned_to", "due_date"):
        if field in data and data[field] is not None:
            setattr(task, field, data[field])

    await db.flush()
    return task


async def delete_task(db: AsyncSession, task_id: int) -> None:
    """TimeLogs cascade-delete via ON DELETE CASCADE on task_id."""
    task = await get_task_or_404(db, task_id)
    await db.delete(task)
    await db.flush()