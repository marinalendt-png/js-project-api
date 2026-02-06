# Project API

Render: https://js-project-api-e8xy.onrender.com
Netlify: https://project-happy-thoughts-ml.netlify.app/

Welcome to my first backend project! A RESTful API for sharing and liking thoughts with user authentication.

## Features

- User Authentication** - Sign up and log in with email/password
- Create Thoughts** - Share your thoughts (5-140 characters)
- Like Thoughts** - Increase heart count on any thought
- Update Thoughts** - Edit your own thoughts
- Delete Thoughts** - Remove your own thoughts
- Password Encryption** - Bcrypt for secure password storage

## Tech Stack

Backend:
- Node.js
- Express.js
Database:
- MongoDB with Mongoose
Authentication:
- access tokens
Security:
- Bcrypt password hashing
- CORS

## API Endpoints
Authentication endpoints:
- POST /signup- Create new account
- POST /login - Log in to existing account

Thoughts endpoints:
- GET /thoughts - Get all thoughts
- GET /thoughts/:id - Get single thought
- POST /thoughts - Create thought (authenticated)
- PATCH /thoughts/:id - Update thought (authenticated)
- DELETE /thoughts/:id - Delete thought (authenticated)
- POST /thoughts/:id/like - Like a thought

# ENJOY #