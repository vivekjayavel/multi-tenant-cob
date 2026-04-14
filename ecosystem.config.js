module.exports = {
  apps: [{
    name:        'bakery-platform',
    script:      'server.js',
    cwd:         '/home/u123456789/public_html',
    instances:   1,
    exec_mode:   'fork',
    env_production: { NODE_ENV: 'production', PORT: 3000 },
    out_file:        '/home/u123456789/app-logs/pm2-out.log',
    error_file:      '/home/u123456789/app-logs/pm2-error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    watch: false, max_restarts: 10, restart_delay: 5000, min_uptime: '10s',
  }],
};
