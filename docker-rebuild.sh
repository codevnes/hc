#!/bin/bash

# Script to completely clean Docker and rebuild the application
# Run this script on your Ubuntu server with sudo privileges

# Stop all running containers
echo "Stopping all running containers..."
docker compose down || docker-compose down

# Remove all containers
echo "Removing all containers..."
docker rm -f $(docker ps -a -q) 2>/dev/null || echo "No containers to remove"

# Remove all images
echo "Removing all Docker images..."
docker rmi -f $(docker images -a -q) 2>/dev/null || echo "No images to remove"

# Remove all volumes
echo "Removing all Docker volumes..."
docker volume rm $(docker volume ls -q) 2>/dev/null || echo "No volumes to remove"

# Remove all networks
echo "Removing all Docker networks..."
docker network rm $(docker network ls -q) 2>/dev/null || echo "No networks to remove"

# Clean up system
echo "Cleaning up Docker system..."
docker system prune -a -f --volumes

# Pull the latest changes from GitHub
echo "Pulling the latest changes from GitHub..."
git pull origin main

# Rebuild and start the application
echo "Rebuilding and starting the application..."
docker compose up -d --build || docker-compose up -d --build

# Show running containers
echo "Running containers:"
docker ps

echo "Docker rebuild completed successfully!"
