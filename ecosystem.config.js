module.exports = {
    apps: [{
        name: 'eloquence-backend',
        script: 'dist/index.js',
        env_production: {
            "NODE_ENV": "production",
        }
    }],
    deploy: {
        production: {
            user: 'mansadev',
            host: '82.165.121.223',
            ref: 'origin/main',
            ssh_options: "StrictHostKeyChecking=no",
            repo: 'git@eloquence-backend:ysissoko/eloquence-backend.git',
            'path': '/home/mansadev/node/apps/eloquence-backend',
            'pre-deploy-local': '',
            'post-deploy': 'yarn install --ignore-engines && npm run build && pm2 reload ecosystem.config.js --env development',
            'pre-setup': ''
        }
    }
};
