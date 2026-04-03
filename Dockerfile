FROM python:3.12-slim

# 1. Set environment variables for performance
ENV UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    PATH="/app/.venv/bin:$PATH"

WORKDIR /app

# 2. Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

# 3. Install dependencies (Cached Layer)
# use a cache mount to speed up subsequent builds
RUN --mount=type=cache,target=/root/.cache/uv \
    --mount=type=bind,source=uv.lock,target=uv.lock \
    --mount=type=bind,source=pyproject.toml,target=pyproject.toml \
    uv sync --frozen --no-install-project

# 4. Security: Create user and copy app code with correct permissions
RUN adduser --disabled-password --gecos '' sonicuser
COPY --chown=sonicuser:sonicuser . .

# 5. Sync the project (installs the local package itself)
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen

USER sonicuser

# 6. Run using the venv path directly (faster than 'uv run')
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
