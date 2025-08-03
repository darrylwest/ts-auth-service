# PM2 Deployment Guide

This guide covers deploying the authentication service (mock or Firebase) using PM2 on your demo droplet.

## Configuration

Both the mock and Firebase services run on port **3901**.

## Quick Deployment

### Deploy Mock Service

```bash
# Set your droplet details
export DROPLET_HOST=your-demo-droplet.com
export DROPLET_USER=deploy

# Run deployment script
./scripts/deploy-mock.sh
```

## PM2 Commands

### Service Management

```bash
# Start the service
pm2 start ecosystem.config.js

# Check status
pm2 status auth-service-mock

# View logs
pm2 logs auth-service-mock
pm2 logs auth-service-mock --lines 100

# Restart service
pm2 restart auth-service-mock

# Stop service
pm2 stop auth-service-mock

# Delete from PM2
pm2 delete auth-service-mock
```

### Monitoring

```bash
# Real-time monitoring
pm2 monit

# Show detailed information
pm2 describe auth-service-mock

# Display process list
pm2 list
```

### Log Management

```bash
# Flush logs
pm2 flush auth-service-mock

# Reload logs
pm2 reloadLogs
```

### Persistence

```bash
# Save current PM2 process list
pm2 save

# Set PM2 to start on boot
pm2 startup

# Unstartup (remove from boot)
pm2 unstartup
```

## Manual Deployment Steps

If you prefer to deploy manually:

1. **Build the project locally**
   ```bash
   npm run build
   ```

2. **Copy files to droplet**
   ```bash
   scp -r dist package.json package-lock.json ecosystem.config.js deploy@droplet:/home/deploy/auth-service-mock/
   ```

3. **SSH into droplet**
   ```bash
   ssh deploy@droplet
   ```

4. **Install dependencies**
   ```bash
   cd /home/deploy/auth-service-mock
   npm ci --production
   ```

5. **Create .env file**
   ```bash
   cat > .env << EOF
   NODE_ENV=production
   PORT=3901
   USE_MOCK_AUTH=true
   JWT_SECRET=your-secret-key-here
   EOF
   ```

6. **Start with PM2**
   ```bash
   pm2 start ecosystem.config.js
   pm2 save
   ```

## Switching Between Mock and Firebase

To switch from mock to Firebase service:

1. Update the `.env` file:
   ```bash
   USE_MOCK_AUTH=false
   ```

2. Ensure Firebase credentials are in place:
   ```bash
   # Copy your service account key
   cp service-account.json /home/deploy/auth-service-mock/keys/
   ```

3. Restart PM2:
   ```bash
   pm2 restart auth-service-mock
   ```

## Troubleshooting

### Check if service is running

```bash
pm2 status
curl http://localhost:3901/api/ping
```

### View error logs

```bash
pm2 logs auth-service-mock --err
tail -f /home/deploy/auth-service-mock/logs/error.log
```

### Restart after code changes

```bash
pm2 reload auth-service-mock
```

### Check port usage

```bash
sudo netstat -tlnp | grep 3901
```

## Environment Variables

The service uses these environment variables:

- `PORT`: Service port (default: 3901)
- `USE_MOCK_AUTH`: Enable mock service (true/false)
- `JWT_SECRET`: Secret for JWT signing (mock service only)
- `NODE_ENV`: Environment (development/production)

## Security Notes

1. Always change the `JWT_SECRET` in production
2. Ensure port 3901 is properly firewalled
3. Use HTTPS in production (configure reverse proxy)
4. Regularly update dependencies
5. Monitor logs for suspicious activity