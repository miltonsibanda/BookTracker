#!/bin/bash

echo "🔍 Detailed API Container Diagnosis"
echo ""

# Check detailed container status
echo "1. Container status details:"
docker ps -a --filter "name=booktracker-api" --format "table {{.Names}}\t{{.Status}}\t{{.Command}}\t{{.Ports}}"

echo ""
echo "2. Full API container logs:"
docker logs booktracker-api 2>&1

echo ""
echo "3. Container inspection:"
docker inspect booktracker-api | grep -A 10 -B 10 "ExitCode\|Error\|Health"

echo ""
echo "4. Check if the container can start manually:"
echo "Trying to run a simple command in the container..."
docker exec booktracker-api ls -la /app 2>/dev/null || echo "Cannot execute commands in container"

echo ""
echo "5. Check Docker image build:"
echo "Looking for recent booktracker-api image..."
docker images | grep booktracker-api
