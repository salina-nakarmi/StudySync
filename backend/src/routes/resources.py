from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from ..database.database import get_db
from ..database.models import Resources, Groups
from ..schemas.resources import ResourceCreate, ResourceResponse
from ..dependencies import get_current_user
from ..database.models import Users

router = APIRouter(prefix="/resources", tags=["Resources"])

@router.post(
    "",
    response_model=ResourceResponse,
    status_code=status.HTTP_201_CREATED
)
async def add_resource(
    payload: ResourceCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Users = Depends(get_current_user)
):
    # 1️⃣ Check group exists
    result = await db.execute(
        select(Groups).where(Groups.id == payload.group_id)
    )
    group = result.scalar_one_or_none()

    if not group:
        raise HTTPException(status_code=404, detail="Group not found")

    # 2️⃣ Create resource
    resource = Resources(
        title=payload.title,
        url=payload.url,
        resource_type=payload.resource_type,
        description=payload.description,
        parent_folder_id=payload.parent_folder_id,
        group_id=payload.group_id,
        uploaded_by=current_user.user_id
    )

    db.add(resource)
    await db.commit()
    await db.refresh(resource)

    return resource

@router.get(
    "/group/{group_id}",
    response_model=list[ResourceResponse]
)
async def get_group_resources(
    group_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: Users = Depends(get_current_user)
):
    result = await db.execute(
        select(Resources)
        .where(
            Resources.group_id == group_id,
            Resources.is_deleted == False
        )
        .order_by(Resources.created_at.desc())
    )

    return result.scalars().all()

