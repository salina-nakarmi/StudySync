# services/github_service.py
"""
GitHub commit sync — manual trigger only (button in UI), per earlier discussion.

Auth strategy: one server-wide Personal Access Token (env var GITHUB_ACCESS_TOKEN),
used for every sync regardless of which user clicks the button. This only works
for public repos (or private repos the PAT's owner has access to) — acceptable
since GitHub integration is opt-in per project via is_github_integrated.

Commit author resolution: GitHub's API returns the commit author's GitHub
username (when their commit email is linked to a GitHub account). We match
that against TeamMembers.github_username. No match -> member_id stays None,
and it shows up in unresolved_authors so the owner knows to ask that person
to set their github_username in their profile.
"""
import os
import httpx
from datetime import datetime
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

from ...database.models import Projects, GithubCommits, TeamMembers

GITHUB_API_BASE = "https://api.github.com"
GITHUB_ACCESS_TOKEN = os.environ.get("GITHUB_ACCESS_TOKEN")


def _get_headers() -> dict:
    if not GITHUB_ACCESS_TOKEN:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="GITHUB_ACCESS_TOKEN is not configured on the server.",
        )
    return {
        "Authorization": f"Bearer {GITHUB_ACCESS_TOKEN}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }


async def _fetch_commits_from_github(repo_owner: str, repo_name: str, since: datetime | None = None) -> list[dict]:
    """
    Calls GET /repos/{owner}/{repo}/commits. Paginates up to a sane cap
    (500 commits) so a huge repo's first sync doesn't run forever.
    """
    url = f"{GITHUB_API_BASE}/repos/{repo_owner}/{repo_name}/commits"
    params = {"per_page": 100}
    if since:
        params["since"] = since.isoformat()

    all_commits = []
    page = 1
    max_pages = 5  # cap at 500 commits per sync call

    async with httpx.AsyncClient(timeout=15.0) as client:
        while page <= max_pages:
            response = await client.get(url, headers=_get_headers(), params={**params, "page": page})

            if response.status_code == 404:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"GitHub repo '{repo_owner}/{repo_name}' not found, or the token lacks access.",
                )
            if response.status_code == 403:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="GitHub API rate limit hit. Try syncing again shortly.",
                )
            response.raise_for_status()

            page_data = response.json()
            if not page_data:
                break

            all_commits.extend(page_data)
            if len(page_data) < 100:
                break  # last page
            page += 1

    return all_commits


async def sync_project_commits(db: AsyncSession, project_id: int) -> dict:
    """
    Fetches new commits since the most recent one we have stored, inserts
    any that aren't already in github_commits (sha is UNIQUE so duplicates
    are naturally prevented), and resolves authors to TeamMembers.
    """
    project_result = await db.execute(select(Projects).where(Projects.project_id == project_id))
    project = project_result.scalar_one_or_none()
    if project is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found.")

    if not project.is_github_integrated:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This project does not have GitHub integration enabled.",
        )
    if not project.github_repo_owner or not project.github_repo_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="GitHub repo owner/name not set on this project.",
        )

    # Only fetch commits newer than the latest one we've already synced
    latest_result = await db.execute(
        select(GithubCommits.committed_at)
        .where(GithubCommits.project_id == project_id)
        .order_by(GithubCommits.committed_at.desc())
        .limit(1)
    )
    latest_committed_at = latest_result.scalar_one_or_none()

    raw_commits = await _fetch_commits_from_github(
        project.github_repo_owner, project.github_repo_name, since=latest_committed_at
    )

    # Preload all known github_username -> member_id mappings once (avoid N+1)
    members_result = await db.execute(
        select(TeamMembers.github_username, TeamMembers.member_id).where(TeamMembers.github_username.isnot(None))
    )
    username_to_member = {username: member_id for username, member_id in members_result.all()}

    # Existing SHAs already stored, to skip duplicates without relying solely on the DB constraint
    existing_shas_result = await db.execute(
        select(GithubCommits.sha).where(GithubCommits.project_id == project_id)
    )
    existing_shas = {row[0] for row in existing_shas_result.all()}

    new_commits_count = 0
    unresolved_authors: set[str] = set()

    for raw in raw_commits:
        sha = raw["sha"]
        if sha in existing_shas:
            continue

        author_login = (raw.get("author") or {}).get("login")  # None if unlinked commit email
        commit_data = raw["commit"]
        author_github_username = author_login or commit_data["author"]["name"]  # fallback to git name

        member_id = username_to_member.get(author_login) if author_login else None
        if member_id is None:
            unresolved_authors.add(author_github_username)

        commit_row = GithubCommits(
            project_id=project_id,
            sha=sha,
            author_github_username=author_github_username,
            member_id=member_id,
            commit_message=commit_data["message"],
            commit_url=raw["html_url"],
            committed_at=datetime.fromisoformat(commit_data["author"]["date"].replace("Z", "+00:00")),
        )
        db.add(commit_row)
        new_commits_count += 1

    await db.flush()

    total_result = await db.execute(
        select(GithubCommits.commit_id).where(GithubCommits.project_id == project_id)
    )
    total_commits = len(total_result.all())

    return {
        "new_commits": new_commits_count,
        "total_commits": total_commits,
        "unresolved_authors": sorted(unresolved_authors),
    }


async def list_project_commits(db: AsyncSession, project_id: int, limit: int = 50) -> list[dict]:
    result = await db.execute(
        select(GithubCommits)
        .where(GithubCommits.project_id == project_id)
        .order_by(GithubCommits.committed_at.desc())
        .limit(limit)
    )
    commits = result.scalars().all()

    output = []
    for commit in commits:
        member_username = None
        if commit.member_id:
            from ...database.models import Users
            username_result = await db.execute(
                select(Users.username)
                .join(TeamMembers, TeamMembers.user_id == Users.user_id)
                .where(TeamMembers.member_id == commit.member_id)
            )
            member_username = username_result.scalar_one_or_none()

        output.append({
            "commit_id": commit.commit_id,
            "sha": commit.sha,
            "author_github_username": commit.author_github_username,
            "member_id": commit.member_id,
            "member_username": member_username,
            "commit_message": commit.commit_message,
            "commit_url": commit.commit_url,
            "committed_at": commit.committed_at,
        })
    return output