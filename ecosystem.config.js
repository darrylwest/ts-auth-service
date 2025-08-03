module.exports = {
  apps: [
    {
      name: 'auth-service-mock',
      script: './dist/index.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3901,
        USE_MOCK_AUTH: 'true',
        JWT_SECRET: 'mock-service-secret-key-change-in-production'
      },
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_file: './logs/pm2-combined.log',
      time: true,
      merge_logs: true
    }
  ]
};