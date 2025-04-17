# Deployment Guide for Ubuntu 22.04

This guide will help you deploy the HC Stock application on Ubuntu 22.04 using Docker and Docker Compose.

## Prerequisites

- Ubuntu 22.04 server
- Docker and Docker Compose installed
- Git installed

## Step 1: Install Docker and Docker Compose

```bash
# Update package lists
sudo apt update

# Install required packages
sudo apt install -y apt-transport-https ca-certificates curl software-properties-common

# Add Docker's official GPG key
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Add Docker repository
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Update package lists again
sudo apt update

# Install Docker
sudo apt install -y docker-ce docker-ce-cli containerd.io

# Add your user to the docker group
sudo usermod -aG docker ${USER}

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.18.1/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installations
docker --version
docker-compose --version
```

## Step 2: Clone the Repository

```bash
# Navigate to where you want to store your project
cd /opt

# Clone your repository
git clone https://github.com/codevnes/hc.git
cd hc

# Set proper permissions
sudo chown -R $USER:$USER /opt/hc
```

## Step 3: Configure Environment Variables

Create a `.env` file in the project root:

```bash
# Create .env file
cat > .env << EOL
# API URL - Use your server's IP or domain
API_URL=http://157.10.198.58:5000/api

# CORS Origins
CORS_ORIGINS=http://157.10.198.58:3000,http://localhost:3000

# TinyMCE API Key
NEXT_PUBLIC_TINYMCE_API_KEY=ae5fb9f4606ef984e49ec4ef9917fa7ead33eb2f06d2daaa0acd71500c5f1e68
EOL
```

Replace `157.10.198.58` with your actual server IP or domain name.

## Step 4: Build and Run the Application

```bash
# Build and start the containers in detached mode
docker-compose up -d --build

# Check if containers are running
docker-compose ps

# View logs (optional)
docker-compose logs -f
```

## Step 5: Access the Application

- Frontend: http://your-server-ip:3000
- Backend API: http://your-server-ip:5000/api

## Troubleshooting

### If the frontend build fails:

1. Check Docker build logs:
   ```bash
   docker-compose logs frontend
   ```

2. Make sure the environment variables are correctly set:
   ```bash
   cat .env
   ```

3. Check if the standalone directory is created:
   ```bash
   docker exec -it hc_frontend_1 ls -la /app/.next/
   ```

4. Check disk space:
   ```bash
   df -h
   ```

### If the backend fails to connect to the database:

1. Check Docker logs:
   ```bash
   docker-compose logs backend
   docker-compose logs db
   ```

2. Make sure the database is initialized:
   ```bash
   docker exec -it hc_db_1 mysql -u root -phcstock123 -e "SHOW DATABASES;"
   ```

## Updating the Application

To update the application after making changes:

```bash
# Pull the latest changes
git pull

# Rebuild and restart the containers
docker-compose down
docker-compose up -d --build
```

## Setting up Nginx as a Reverse Proxy (Optional)

If you want to serve your application on standard HTTP/HTTPS ports (80/443):

```bash
# Install Nginx
sudo apt install -y nginx

# Create Nginx configuration
sudo nano /etc/nginx/sites-available/hc-stock
```

Add the following configuration:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Replace `your-domain.com` with your actual domain name or server IP.

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/hc-stock /etc/nginx/sites-enabled/

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

## Setting up SSL with Let's Encrypt (Optional)

If you want to secure your site with HTTPS:

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d your-domain.com

# Test automatic renewal
sudo certbot renew --dry-run
```

Replace `your-domain.com` with your actual domain name.
