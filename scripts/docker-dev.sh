#!/bin/bash
# filepath: /Users/jomarjunior/Developments/UFRJ/solidity/smart-crid/scripts/docker-dev.sh

# 🐳 CRID Docker Development Environment Manager
# Usage: ./scripts/docker-dev.sh [command]

set -e

COMPOSE_FILE="docker-compose.yml"
PROJECT_NAME="crid"

# 🎨 Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 📋 Available commands
show_help() {
    echo -e "${BLUE}🏗️  CRID Docker Development Environment${NC}"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo -e "  ${GREEN}up${NC}              Start all development services"
    echo -e "  ${GREEN}down${NC}            Stop all services"
    echo -e "  ${GREEN}restart${NC}         Restart all services"
    echo -e "  ${GREEN}logs${NC}            Show logs from all services"
    echo -e "  ${GREEN}test${NC}            Run comprehensive test suite"
    echo -e "  ${GREEN}security${NC}        Run security analysis"
    echo -e "  ${GREEN}clean${NC}           Clean up containers and volumes"
    echo -e "  ${GREEN}status${NC}          Show service status"
    echo -e "  ${GREEN}deploy${NC}          Deploy contracts to local network"
    echo -e "  ${GREEN}dashboard${NC}       Start with development dashboard"
    echo ""
    echo "Examples:"
    echo "  $0 up              # Start development environment"
    echo "  $0 test            # Run all tests"
    echo "  $0 logs frontend   # Show frontend logs"
}

# 🚀 Start development environment
start_dev() {
    echo -e "${GREEN}🚀 Starting CRID development environment...${NC}"
    docker-compose -p $PROJECT_NAME up -d hardhat-node
    echo -e "${YELLOW}⏳ Waiting for Hardhat node to be ready...${NC}"
    sleep 10
    docker-compose -p $PROJECT_NAME up -d
    echo -e "${GREEN}✅ Development environment is ready!${NC}"
    echo -e "${BLUE}📋 Available services:${NC}"
    echo "  • Hardhat Node: http://localhost:8545"
    echo "  • Frontend: http://localhost:3000"
    echo "  • The Graph: http://localhost:8000"
    echo "  • IPFS: http://localhost:5001"
}

# 🛑 Stop services
stop_dev() {
    echo -e "${YELLOW}🛑 Stopping CRID development environment...${NC}"
    docker-compose -p $PROJECT_NAME down
    echo -e "${GREEN}✅ All services stopped${NC}"
}

# 🔄 Restart services
restart_dev() {
    echo -e "${YELLOW}🔄 Restarting CRID development environment...${NC}"
    stop_dev
    start_dev
}

# 📊 Show logs
show_logs() {
    if [ -z "$2" ]; then
        docker-compose -p $PROJECT_NAME logs -f
    else
        docker-compose -p $PROJECT_NAME logs -f "$2"
    fi
}

# 🧪 Run tests
run_tests() {
    echo -e "${GREEN}🧪 Running comprehensive test suite...${NC}"
    docker-compose -p $PROJECT_NAME --profile testing up --build test-runner
}

# 🔍 Run security analysis
run_security() {
    echo -e "${GREEN}🔍 Running security analysis...${NC}"
    docker-compose -p $PROJECT_NAME --profile security up --build security-scanner
}

# 🧹 Clean up
cleanup() {
    echo -e "${YELLOW}🧹 Cleaning up Docker environment...${NC}"
    docker-compose -p $PROJECT_NAME down -v --remove-orphans
    docker system prune -f
    echo -e "${GREEN}✅ Cleanup complete${NC}"
}

# 📊 Show status
show_status() {
    echo -e "${BLUE}📊 CRID Development Environment Status${NC}"
    docker-compose -p $PROJECT_NAME ps
}

# 🚀 Deploy contracts
deploy_contracts() {
    echo -e "${GREEN}🚀 Deploying contracts to local network...${NC}"
    docker-compose -p $PROJECT_NAME exec smart-contracts npm run deploy:local
    echo -e "${GREEN}✅ Contracts deployed successfully${NC}"
}

# 📊 Start with dashboard
start_with_dashboard() {
    echo -e "${GREEN}📊 Starting CRID with development dashboard...${NC}"
    docker-compose -p $PROJECT_NAME --profile dashboard up -d
    echo -e "${GREEN}✅ Dashboard available at http://localhost:8888${NC}"
}

# 🎯 Main command handler
case "${1:-help}" in
    up|start)
        start_dev
        ;;
    down|stop)
        stop_dev
        ;;
    restart)
        restart_dev
        ;;
    logs)
        show_logs "$@"
        ;;
    test)
        run_tests
        ;;
    security)
        run_security
        ;;
    clean)
        cleanup
        ;;
    status)
        show_status
        ;;
    deploy)
        deploy_contracts
        ;;
    dashboard)
        start_with_dashboard
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        echo -e "${RED}❌ Unknown command: $1${NC}"
        show_help
        exit 1
        ;;
esac