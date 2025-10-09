# Multi-stage build pentru optimizare
FROM python:3.11.5-slim as builder

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONHASHSEED=random \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    libffi-dev \
    libssl-dev \
    && rm -rf /var/lib/apt/lists/*

# Create virtual environment
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Copy requirements and install Python dependencies
COPY requirements-render.txt .
RUN pip install --upgrade pip && \
    pip install -r requirements-render.txt

# Production stage
FROM python:3.11.5-slim as production

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PATH="/opt/venv/bin:$PATH"

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Copy virtual environment from builder stage
COPY --from=builder /opt/venv /opt/venv

# Create non-root user for security
RUN groupadd -r viralsafe && useradd -r -g viralsafe viralsafe

# Create and set working directory
WORKDIR /app
RUN chown -R viralsafe:viralsafe /app

# Copy application code
COPY --chown=viralsafe:viralsafe . .

# Switch to non-root user
USER viralsafe

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:${PORT:-8000}/health || exit 1

# Default command - can be overridden
CMD ["gunicorn", "main:app", "-w", "1", "-k", "uvicorn.workers.UvicornWorker", "--bind", "0.0.0.0:8000", "--timeout", "120"]

# Render-specific command (uses PORT env var)
# CMD ["sh", "-c", "gunicorn main:app -w 1 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:${PORT} --timeout 120"]

# Development command alternative
# CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]

# Labels for metadata
LABEL maintainer="George Pricop <pricopgeorge@gmail.com>" \
      version="0.3.0" \
      description="ViralSafe API - Web3 Social Platform" \
      org.opencontainers.image.source="https://github.com/Gzeu/viralsafe-platform" \
      org.opencontainers.image.documentation="https://github.com/Gzeu/viralsafe-platform/blob/main/docs/RENDER_DEPLOYMENT.md"