module.exports = {
  apps: [
    {
      name: 'api',
      script: 'dist/main.js',
      instances: 1,
      env: {
        NODE_ENV: 'development',
      },
      env_production: {
        NODE_ENV: 'production',
      },
    },
  ],
};
