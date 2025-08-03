#!/bin/bash

# Deploy mock authentication service to demo droplet
# Usage: ./scripts/deploy-mock.sh

set -e

echo "🚀 Deploying mock authentication service..."

# Build the project
echo "📦 Building TypeScript project..."
npm run build

# Create deployment directory structure
echo "📁 Creating deployment package..."
mkdir -p deploy-temp
cp -r dist deploy-temp/
cp package.json deploy-temp/
cp package-lock.json deploy-temp/
cp ecosystem.config.js deploy-temp/

# Create production .env file for mock service
cat > deploy-temp/.env << EOF
NODE_ENV=production
PORT=3901
USE_MOCK_AUTH=true
JWT_SECRET=\${JWT_SECRET:-mock-service-secret-key-change-in-production}
EOF

# Create deployment script that will run on the server
cat > deploy-temp/setup.sh << 'EOF'
#!/bin/bash
set -e

APP_DIR="/home/deploy/auth-service-mock"

# Create app directory
mkdir -p $APP_DIR
mkdir -p $APP_DIR/logs

# Copy files
cp -r dist $APP_DIR/
cp package.json $APP_DIR/
cp package-lock.json $APP_DIR/
cp ecosystem.config.js $APP_DIR/
cp .env $APP_DIR/

# Change to app directory
cd $APP_DIR

# Install production dependencies
echo "📦 Installing production dependencies..."
npm ci --production

# Stop existing PM2 process if running
pm2 stop auth-service-mock || true
pm2 delete auth-service-mock || true

# Start with PM2
echo "🚀 Starting service with PM2..."
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

echo "✅ Mock authentication service deployed successfully!"
echo "📍 Running on port 3901"
echo ""
echo "Useful PM2 commands:"
echo "  pm2 status auth-service-mock"
echo "  pm2 logs auth-service-mock"
echo "  pm2 restart auth-service-mock"
echo "  pm2 stop auth-service-mock"
EOF

chmod +x deploy-temp/setup.sh

# Get droplet host from user or use environment variable
DROPLET_HOST=${DROPLET_HOST:-"your-demo-droplet.com"}
DROPLET_USER=${DROPLET_USER:-"deploy"}

echo "📤 Uploading to droplet..."
echo "   Host: $DROPLET_HOST"
echo "   User: $DROPLET_USER"
echo ""
echo "If these are incorrect, set DROPLET_HOST and DROPLET_USER environment variables"
echo ""

# Create tarball for easy transfer
tar -czf deploy-temp.tar.gz deploy-temp/

# Upload and extract on droplet
scp deploy-temp.tar.gz $DROPLET_USER@$DROPLET_HOST:/tmp/
ssh $DROPLET_USER@$DROPLET_HOST "cd /tmp && tar -xzf deploy-temp.tar.gz && cd deploy-temp && ./setup.sh"

# Cleanup
rm -rf deploy-temp deploy-temp.tar.gz

echo "✅ Deployment complete!"
echo "🔗 Mock service available at: http://$DROPLET_HOST:3901"