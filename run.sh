#!/usr/bin/env bash
# ==============================================================================
# SatQuery AI — End-to-End Master Automation Script (run.sh)
#
# Usage:
#   ./run.sh            # Complete stack bring-up, model pull, health checks & live logs
#   ./run.sh --no-logs  # Bring-up stack, pull model, verify health, and exit (no log tail)
#   ./run.sh --help     # Show help information
#
# Requirements:
#   - Docker Engine & Docker Compose (v2 plugin or standalone v1)
#   - curl or nc (netcat) for health probe checks
# ==============================================================================

set -euo pipefail

# Resolve project repository root
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

# ANSI Terminal Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Logging Helpers
log_info()    { echo -e "${GREEN}[INFO]${NC} $(date +'%H:%M:%S') $*"; }
log_warn()    { echo -e "${YELLOW}[WARN]${NC} $(date +'%H:%M:%S') $*"; }
log_error()   { echo -e "${RED}[ERROR]${NC} $(date +'%H:%M:%S') $*" >&2; }
log_step()    { echo -e "\n${CYAN}${BOLD}==>${NC} ${BOLD}$*${NC}"; }
log_success() { echo -e "${GREEN}${BOLD}[SUCCESS]${NC} $*"; }

# ------------------------------------------------------------------------------
# 1. Argument Parsing
# ------------------------------------------------------------------------------
TAIL_LOGS=true
if [[ "${1:-}" == "--help" || "${1:-}" == "-h" ]]; then
  cat <<'EOF'
SatQuery AI: Master Bring-Up Script

Usage:
  ./run.sh            Complete startup: teardown, build, model pull, health check, log tail
  ./run.sh --no-logs  Startup without tailing logs (ideal for scripts and CI)
  ./run.sh -h, --help Show this help documentation

Services Launched:
  - Database:         PostgreSQL 16 + PostGIS 3.4 (localhost:5432)
  - Vision LLM:       Ollama serving llava:latest (localhost:11434)
  - Backend Gateway:  FastAPI + PyTorch + GDAL (localhost:8000)
  - Frontend UI:      React + Vite + Nginx (localhost:3000)
EOF
  exit 0
elif [[ "${1:-}" == "--no-logs" ]]; then
  TAIL_LOGS=false
fi

# ------------------------------------------------------------------------------
# 2. Docker & Compose Engine Detection
# ------------------------------------------------------------------------------
detect_compose() {
  if ! command -v docker >/dev/null 2>&1; then
    log_error "Docker is not installed or not available on PATH."
    log_error "Please install Docker Desktop or Docker Engine and try again."
    exit 1
  fi

  if ! docker info >/dev/null 2>&1; then
    log_error "Docker daemon is not running or current user lacks Docker permissions."
    log_error "Please start Docker Desktop or dockerd, then re-run ./run.sh."
    exit 1
  fi

  if docker compose version >/dev/null 2>&1; then
    COMPOSE_CMD="docker compose"
    log_info "Using Docker Compose V2 plugin: $(docker compose version --short 2>/dev/null || docker compose version | head -n1)"
  elif command -v docker-compose >/dev/null 2>&1; then
    COMPOSE_CMD="docker-compose"
    log_info "Using Docker Compose V1: $(docker-compose --version | head -n1)"
  else
    log_error "Neither 'docker compose' nor 'docker-compose' was found."
    log_error "Please install Docker Compose and try again."
    exit 1
  fi
}

detect_compose

# ------------------------------------------------------------------------------
# 3. Cleanup Trap (SIGINT / SIGTERM)
# ------------------------------------------------------------------------------
cleanup() {
  echo ""
  log_warn "Interruption signal received (SIGINT/SIGTERM)."
  log_info "Shutting down SatQuery AI stack gracefully..."
  $COMPOSE_CMD down --remove-orphans
  log_success "All SatQuery AI containers and networks have been stopped."
  exit 0
}
trap cleanup SIGINT SIGTERM

# ------------------------------------------------------------------------------
# 4. Initial Cleanup of Lingering Containers & Ports
# ------------------------------------------------------------------------------
log_step "Step 1/5: Cleaning up lingering containers, orphaned networks, and locked ports..."
$COMPOSE_CMD down --remove-orphans 2>/dev/null || true
log_info "Clean state established."

# ------------------------------------------------------------------------------
# 5. Build and Launch Stack in Detached Mode
# ------------------------------------------------------------------------------
log_step "Step 2/5: Building and orchestrating SatQuery AI stack (db, ollama, backend, frontend)..."
log_info "Executing: $COMPOSE_CMD up -d --build"
$COMPOSE_CMD up -d --build

# ------------------------------------------------------------------------------
# 6. Ollama Readiness Loop & Automatic Model Pull
# ------------------------------------------------------------------------------
log_step "Step 3/5: Checking Ollama health & pulling vision-language model (llava:latest)..."

OLLAMA_PORT="11434"
OLLAMA_URL="http://localhost:${OLLAMA_PORT}"
OLLAMA_TIMEOUT=120
elapsed=0

log_info "Waiting for Ollama container to accept HTTP requests on ${OLLAMA_URL}..."
until curl -fsS "${OLLAMA_URL}" >/dev/null 2>&1 || (command -v nc >/dev/null 2>&1 && nc -z localhost "${OLLAMA_PORT}" 2>/dev/null); do
  sleep 2
  elapsed=$((elapsed + 2))
  if [ "$elapsed" -ge "$OLLAMA_TIMEOUT" ]; then
    log_error "Timed out after ${OLLAMA_TIMEOUT}s waiting for Ollama service on ${OLLAMA_URL}."
    $COMPOSE_CMD logs ollama
    exit 1
  fi
  echo -n "."
done
echo ""
log_success "Ollama service is responsive."

log_info "Automatically pulling multimodal model 'llava:latest' inside Ollama container..."
log_info "(This downloads weights on the first run; subsequent runs complete instantly)"
$COMPOSE_CMD exec -T ollama ollama pull llava:latest

log_info "Verifying loaded models in Ollama:"
$COMPOSE_CMD exec -T ollama ollama list
log_success "Model 'llava:latest' is ready for vision-language inference."

# ------------------------------------------------------------------------------
# 7. Backend Health Verification
# ------------------------------------------------------------------------------
log_step "Step 4/5: Validating Backend & Frontend readiness..."

BACKEND_URL="http://localhost:8000"
HEALTH_URL="${BACKEND_URL}/health"
BACKEND_TIMEOUT=180
elapsed=0

log_info "Polling ${HEALTH_URL} until HTTP 200 OK..."
until [ "$(curl -s -o /dev/null -w "%{http_code}" "${HEALTH_URL}" 2>/dev/null || true)" = "200" ]; do
  sleep 2
  elapsed=$((elapsed + 2))
  if [ "$elapsed" -ge "$BACKEND_TIMEOUT" ]; then
    log_error "Timed out after ${BACKEND_TIMEOUT}s waiting for Backend API to become healthy on ${HEALTH_URL}."
    log_info "Recent backend container logs:"
    $COMPOSE_CMD logs --tail=50 backend
    exit 1
  fi
  echo -n "."
done
echo ""
log_success "Backend API is fully operational and healthy (HTTP 200 OK)."

# ------------------------------------------------------------------------------
# 8. Prominent Application Dashboard Banner
# ------------------------------------------------------------------------------
FRONTEND_URL="http://localhost:3000"
DOCS_URL="${BACKEND_URL}/docs"

echo ""
echo -e "${CYAN}${BOLD}╔══════════════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}${BOLD}║                         SATQUERY AI SYSTEM ONLINE                            ║${NC}"
echo -e "${CYAN}${BOLD}╠══════════════════════════════════════════════════════════════════════════════╣${NC}"
printf "${CYAN}${BOLD}║${NC}  ${GREEN}${BOLD}%-22s${NC} : %-47s ${CYAN}${BOLD}║${NC}\n" "Frontend Web UI" "${FRONTEND_URL}"
printf "${CYAN}${BOLD}║${NC}  %-22s : %-47s ${CYAN}${BOLD}║${NC}\n" "Backend API Gateway" "${BACKEND_URL}"
printf "${CYAN}${BOLD}║${NC}  %-22s : %-47s ${CYAN}${BOLD}║${NC}\n" "Swagger API Docs" "${DOCS_URL}"
printf "${CYAN}${BOLD}║${NC}  %-22s : %-47s ${CYAN}${BOLD}║${NC}\n" "Health Check" "${HEALTH_URL}"
printf "${CYAN}${BOLD}║${NC}  %-22s : %-47s ${CYAN}${BOLD}║${NC}\n" "Ollama VLM Service" "${OLLAMA_URL}"
printf "${CYAN}${BOLD}║${NC}  %-22s : %-47s ${CYAN}${BOLD}║${NC}\n" "Active VLM Model" "llava:latest"
echo -e "${CYAN}${BOLD}╚══════════════════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# ------------------------------------------------------------------------------
# 9. Real-Time Log Tailing
# ------------------------------------------------------------------------------
if [ "$TAIL_LOGS" = true ]; then
  log_step "Step 5/5: Streaming live container logs (Backend & Frontend)..."
  echo -e "${YELLOW}Stack is running in background. Press Ctrl+C at any time to stop the entire stack.${NC}\n"
  $COMPOSE_CMD logs -f backend frontend
else
  log_info "--no-logs specified. Stack is running in the background."
  log_info "To view live logs later, run: $COMPOSE_CMD logs -f backend frontend"
  log_info "To stop all services, run:   $COMPOSE_CMD down"
fi
