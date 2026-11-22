module.exports = {
  apps: [
    {
      name: 'yugoccult-api',
      script: './dist/index.js',
      cwd: '/var/www/yugoccult/server',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env_production: {
        NODE_ENV: 'production',
        HOST: '127.0.0.1',
        PORT: 5000,
        TRUST_PROXY_HOPS: '1',
      },
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: '/var/www/yugoccult/server/logs/pm2-err.log',
      out_file: '/var/www/yugoccult/server/logs/pm2-out.log',
      merge_logs: true,
      time: true,
    },
  ],
}
