# routes/time_logs.py
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from ...database.database import get_db
from ...dependencies import get_current_user
from ...database.models import Users
from ...services.project import team_member_service, project_service, task_service, time_log_service
from ...schemas.projects import TimeLogCreate, TimeLogResponse

router = APIRouter(tags=["time-logs"])


@router.post("/tasks/{task_id}/time-logs", response_model=TimeLogResponse, status_code=status.HTTP_201_CREATED)
async def log_time(
    task_id: int,
    data: TimeLogCreate,
    current_user: Users = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Manual entry — 'I worked N hours on this task.' No timer involved."""
    member = await team_member_service.get_team_member_or_404(db, current_user.user_id)
    task = await task_service.get_task_or_404(db, task_id)
    await project_service.require_membership(db, task.project_id, member.member_id)

    log = await time_log_service.create_time_log(db, task_id, member.member_id, data.model_dump())
    await db.commit()

    logs = await time_log_service.list_logs_for_task(db, task_id)
    return next(l for l in logs if l["log_id"] == log.log_id)


@router.get("/tasks/{task_id}/time-logs", response_model=list[TimeLogResponse])
async def list_task_time_logs(
    task_id: int,
    current_user: Users = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    member = await team_member_service.get_team_member_or_404(db, current_user.user_id)
    task = await task_service.get_task_or_404(db, task_id)
    await project_service.require_membership(db, task.project_id, member.member_id)

    return await time_log_service.list_logs_for_task(db, task_id)


@router.get("/projects/{project_id}/time-logs", response_model=list[TimeLogResponse])
async def list_project_time_logs(
    project_id: int,
    current_user: Users = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """All time logs across the whole project — feeds the Tracking tab."""
    member = await team_member_service.get_team_member_or_404(db, current_user.user_id)
    await project_service.require_membership(db, project_id, member.member_id)

    return await time_log_service.list_logs_for_project(db, project_id)


@router.delete("/time-logs/{log_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_time_log(
    log_id: int,
    current_user: Users = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    member = await team_member_service.get_team_member_or_404(db, current_user.user_id)
    log = await time_log_service.get_log_or_404(db, log_id)

    task = await task_service.get_task_or_404(db, log.task_id)
    await project_service.require_membership(db, task.project_id, member.member_id)

    await time_log_service.delete_time_log(db, log_id)
    await db.commit()