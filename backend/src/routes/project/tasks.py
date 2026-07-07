# routes/tasks.py
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from ...database.database import get_db
from ...dependencies import get_current_user
from ...database.models import Users
from ...services.project import team_member_service, project_service, task_service
from ...schemas.projects import TaskCreate, TaskUpdate, TaskResponse

router = APIRouter(tags=["tasks"])


@router.post("/projects/{project_id}/tasks", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
async def create_task(
    project_id: int,
    data: TaskCreate,
    current_user: Users = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    member = await team_member_service.get_team_member_or_404(db, current_user.user_id)
    await project_service.require_membership(db, project_id, member.member_id)

    task = await task_service.create_task(db, project_id, data.model_dump())
    await db.commit()

    return await task_service.get_task_detail(db, task.task_id)


@router.get("/projects/{project_id}/tasks", response_model=list[TaskResponse])
async def list_tasks(
    project_id: int,
    only_mine: bool = Query(False, description="If true, filters to tasks assigned to the current user (My Tasks tab)"),
    current_user: Users = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Tasks tab: only_mine=false (default) -> full kanban.
    My Tasks tab: only_mine=true -> filtered to current member's assigned tasks.
    Same endpoint, per earlier discussion.
    """
    member = await team_member_service.get_team_member_or_404(db, current_user.user_id)
    await project_service.require_membership(db, project_id, member.member_id)

    assigned_to = member.member_id if only_mine else None
    return await task_service.list_tasks(db, project_id, assigned_to=assigned_to)


@router.get("/tasks/{task_id}", response_model=TaskResponse)
async def get_task(
    task_id: int,
    current_user: Users = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    member = await team_member_service.get_team_member_or_404(db, current_user.user_id)
    task = await task_service.get_task_or_404(db, task_id)
    await project_service.require_membership(db, task.project_id, member.member_id)

    return await task_service.get_task_detail(db, task_id)


@router.patch("/tasks/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: int,
    data: TaskUpdate,
    current_user: Users = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    member = await team_member_service.get_team_member_or_404(db, current_user.user_id)
    task = await task_service.get_task_or_404(db, task_id)
    await project_service.require_membership(db, task.project_id, member.member_id)

    await task_service.update_task(db, task_id, data.model_dump(exclude_unset=True))
    await db.commit()

    return await task_service.get_task_detail(db, task_id)


@router.delete("/tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(
    task_id: int,
    current_user: Users = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    member = await team_member_service.get_team_member_or_404(db, current_user.user_id)
    task = await task_service.get_task_or_404(db, task_id)
    await project_service.require_membership(db, task.project_id, member.member_id)

    await task_service.delete_task(db, task_id)
    await db.commit()