# BoilerNav


**Want to run the application with one command?**
(1) navigate to /BoilerNav directory
(2) npm install concurrently
(3) Add/Append this to your /BoilerNav/package.json
    --
    {
        "name": "your-project",
        "version": "1.0.0",
        "scripts": {
            "dev": "concurrently -n \"BACKEND,FRONTEND\" -c \"bgBlue.bold,bgGreen.bold\" \"npm run dev-server\" \"npm run dev-client\"",
            "dev-server": "cd backend && npm run dev",
            "dev-client": "cd frontend && npm run dev"
        },
        "devDependencies": {
            "concurrently": "^6.0.0"
        }
    }
    --
BENEFITS: Will speed up testing & iteration.
