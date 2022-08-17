const options = {
	apps: [
		{
			name: "reviews-api",
			script: "index.js",
			instances: 2,
			exec_mode: "cluster",
      autorestart: true,
			watch: false,
			env: {
				NODE_ENV: "production"
			},
		}
	]
}


module.exports = options;