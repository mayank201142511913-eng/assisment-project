# Full-Stack Team Task Manager

A full-stack web application built for team task management. It allows users to create projects, assign tasks to team members, and track task progress with role-based access control.

## Features
- **Authentication**: Secure Signup and Login functionality.
- **Project & Team Management**: Admins can create projects and add members to their team.
- **Task Tracking**: Create tasks, assign them to team members, and track status (`To Do`, `In Progress`, `Done`).
- **Role-Based Access Control**: `ADMIN` users can manage projects and tasks, while `MEMBER` users can view and update the status of tasks assigned to them.
- **Dashboard**: View your tasks categorized by status, including overdue tasks.

## Tech Stack
- **Frontend**: React (Vite)
- **Backend**: Node.js, Express
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JSON Web Tokens (JWT) & bcrypt

## Local Development
1. Clone the repository.
2. Run `docker-compose up --build` to start the Postgres database and Node server.
3. Access the app at `http://localhost:5000`.

## Deployment
This app is configured to be seamlessly deployed on Railway. The `package.json` includes startup scripts that automatically run database migrations on boot.
