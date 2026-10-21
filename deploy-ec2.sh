#!/bin/bash
# ==============================================================================
# VoltGrid EV Infrastructure DBMS - AWS EC2 Automated Deployment Script
# Compatible with: Ubuntu 22.04 LTS / Ubuntu 24.04 LTS (AWS EC2 Free Tier t2/t3)
# ==============================================================================

set -e

echo "=========================================================="
echo "  VoltGrid DBMS: Starting Automated AWS Deployment Setup  "
echo "=========================================================="

# 1. Update system packages
echo "[1/4] Updating system packages..."
sudo apt-get update -y && sudo apt-get upgrade -y
sudo apt-get install -y ca-certificates curl gnupg lsb-release git

# 2. Install official Docker Engine & Docker Compose Plugin
if ! command -v docker &> /dev/null; then
    echo "[2/4] Installing Docker and Docker Compose..."
    sudo install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor --yes -o /etc/apt/keyrings/docker.gpg
    sudo chmod a+r /etc/apt/keyrings/docker.gpg

    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
      $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
      sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

    sudo apt-get update -y
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    sudo usermod -aG docker $USER
else
    echo "[2/4] Docker is already installed."
fi

# 3. Build & Start the Multi-Container Stack (PostgreSQL 16 + Server + Client)
echo "[3/4] Building and starting VoltGrid Docker containers..."
sudo docker compose down 2>/dev/null || true
sudo docker compose up --build -d

# 4. Verification & Health Check
echo "[4/4] Verifying running containers..."
sleep 5
sudo docker ps

PUBLIC_IP=$(curl -s http://checkip.amazonaws.com || curl -s ifconfig.me || echo "YOUR-EC2-PUBLIC-IP")

echo "=========================================================="
echo "  🎉 VoltGrid Successfully Deployed on AWS EC2!           "
echo "=========================================================="
echo "  Web Application:  http://${PUBLIC_IP}:5173"
echo "  Direct Port 80:   http://${PUBLIC_IP}"
echo "  Backend API:      http://${PUBLIC_IP}:5000/api"
echo "  Database Port:    5432 (Internal PostgreSQL 16)"
echo "=========================================================="
