# Social Media Platform Backend 🚀

A full-featured RESTful API backend for a social media platform built with TypeScript, Express, TypeORM, and PostgreSQL. This project demonstrates professional backend development practices including proper database design, migrations, validation, and comprehensive testing.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.2-blue)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-16+-green)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-12+-blue)](https://www.postgresql.org/)
[![Express](https://img.shields.io/badge/Express-4.18-lightgrey)](https://expressjs.com/)
[![TypeORM](https://img.shields.io/badge/TypeORM-0.3-orange)](https://typeorm.io/)

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [API Documentation](#-api-documentation)
- [Database Design](#-database-design)
- [Testing](#-testing)
- [Key Technical Decisions](#-key-technical-decisions)
- [Performance Optimizations](#-performance-optimizations)

## ✨ Features

### Core Functionality
- 👥 **User Management** - Complete CRUD operations for user accounts
- 📝 **Posts** - Create, read, update, and delete posts with text content
- #️⃣ **Hashtag System** - Automatic hashtag extraction and tagging
- ❤️ **Likes** - Like and unlike posts with duplicate prevention
- 🔗 **Follow System** - Follow/unfollow users with relationship tracking
- 📊 **Activity Tracking** - Automatic logging of user actions

### Special Endpoints
- 🌊 **Personalized Feed** - View posts from followed users
- 🔍 **Hashtag Search** - Find posts by hashtag (case-insensitive)
- 👥 **Followers List** - Get user's followers with pagination
- 📜 **Activity History** - View user activity with filtering

## 🛠️ Tech Stack

- **Runtime:** Node.js (v16+)
- **Language:** TypeScript
- **Framework:** Express.js
- **ORM:** TypeORM
- **Database:** PostgreSQL
- **Validation:** Joi
- **Testing:** Custom shell script with curl

## 📁 Project Structure

```
social-media-backend/
├── src/
│   ├── entities/              # TypeORM entity definitions
│   │   ├── User.ts           # User entity with relationships
│   │   ├── Post.ts           # Post entity with hashtags
│   │   ├── Like.ts           # Like entity (unique constraint)
│   │   ├── Follow.ts         # Follow relationship entity
│   │   ├── Hashtag.ts        # Hashtag entity
│   │   └── Activity.ts       # Activity tracking entity
│   ├── migrations/           # Database migrations
│   │   ├── 1713427200000-CreateUserTable.ts
│   │   ├── 1713427300000-CreatePostTable.ts
│   │   ├── 1713427400000-CreateLikeTable.ts
│   │   ├── 1713427500000-CreateFollowTable.ts
│   │   ├── 1713427600000-CreateHashtagTable.ts
│   │   └── 1713427700000-CreateActivityTable.ts
│   ├── controllers/          # Request handlers & business logic
│   │   ├── UserController.ts
│   │   ├── PostController.ts
│   │   ├── LikeController.ts
│   │   ├── FollowController.ts
│   │   ├── HashtagController.ts
│   │   └── ActivityController.ts
│   ├── routes/              # API route definitions
│   │   └── index.ts
│   ├── validators/          # Joi validation schemas
│   │   └── index.ts
│   ├── data-source.ts       # TypeORM configuration
│   └── index.ts             # Application entry point
├── test.sh                   # Interactive test suite
├── package.json
├── tsconfig.json
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd social-media-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```

   Edit `.env` with your database credentials:
   ```env
   PORT=3000
   DB_HOST=localhost
   DB_PORT=5432
   DB_USERNAME=postgres
   DB_PASSWORD=postgres
   DB_DATABASE=social_media_db
   NODE_ENV=development
   ```

4. **Create the database**
   ```bash
   # Using PostgreSQL CLI
   psql -U postgres
   CREATE DATABASE social_media_db;
   \c social_media_db
   CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
   \q
   ```

5. **Run migrations**
   ```bash
   npm run migration:run
   ```

6. **Start the server**
   ```bash
   # Development mode (with hot reload)
   npm run dev

   # Production mode
   npm run build
   npm start
   ```

The server will start on `http://localhost:3000`

## 📚 API Documentation

### Base URL
```
http://localhost:3000/api
```

### Endpoints Overview

#### Users
```http
GET    /api/users                    # Get all users (paginated)
GET    /api/users/:id                # Get user by ID
POST   /api/users                    # Create new user
PUT    /api/users/:id                # Update user
DELETE /api/users/:id                # Delete user
GET    /api/users/:id/followers      # Get user's followers
GET    /api/users/:id/activity       # Get user's activity history
```

#### Posts
```http
GET    /api/posts                    # Get all posts (paginated)
GET    /api/posts/:id                # Get post by ID
POST   /api/posts                    # Create post with hashtags
PUT    /api/posts/:id                # Update post
DELETE /api/posts/:id                # Delete post
```

#### Likes
```http
GET    /api/likes                    # Get all likes (paginated)
GET    /api/likes/:id                # Get like by ID
POST   /api/likes                    # Like a post
DELETE /api/likes/:id                # Unlike a post
```

#### Follows
```http
GET    /api/follows                  # Get all follows (paginated)
GET    /api/follows/:id              # Get follow by ID
POST   /api/follows                  # Follow a user
DELETE /api/follows/:id              # Unfollow a user
```

#### Hashtags
```http
GET    /api/hashtags                 # Get all hashtags (paginated)
GET    /api/hashtags/:id             # Get hashtag by ID
POST   /api/hashtags                 # Create hashtag
PUT    /api/hashtags/:id             # Update hashtag
DELETE /api/hashtags/:id             # Delete hashtag
```

#### Special Endpoints

##### 📊 Personalized Feed
```http
GET /api/feed?userId={userId}&limit={limit}&offset={offset}
```
Returns posts from users the current user follows, sorted by creation date (newest first).

**Query Parameters:**
- `userId` (required) - ID of the user requesting the feed
- `limit` (optional, default: 10) - Number of posts per page
- `offset` (optional, default: 0) - Number of posts to skip

**Response:**
```json
{
  "posts": [
    {
      "id": "uuid",
      "content": "Post content",
      "author": {
        "id": "uuid",
        "username": "johndoe",
        "fullName": "John Doe"
      },
      "hashtags": [
        { "id": "uuid", "name": "coding" }
      ],
      "likeCount": 5
    }
  ],
  "total": 50,
  "limit": 10,
  "offset": 0
}
```

##### 🔍 Posts by Hashtag
```http
GET /api/posts/hashtag/:tag?limit={limit}&offset={offset}
```
Returns all posts containing the specified hashtag (case-insensitive).

**Example:**
```bash
curl "http://localhost:3000/api/posts/hashtag/coding?limit=10"
```

##### 👥 User Followers
```http
GET /api/users/:id/followers?limit={limit}&offset={offset}
```
Returns list of users who follow the specified user.

##### 📜 User Activity
```http
GET /api/users/:id/activity?limit={limit}&offset={offset}&activityType={type}
```
Returns chronological list of user activities.

**Activity Types:**
- `POST_CREATED`
- `POST_LIKED`
- `USER_FOLLOWED`
- `USER_UNFOLLOWED`

### Sample API Calls

#### Create User
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "username": "johndoe",
    "email": "john@example.com",
    "fullName": "John Doe",
    "bio": "Software developer"
  }'
```

#### Create Post with Hashtags
```bash
curl -X POST http://localhost:3000/api/posts \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Hello world! #coding #nodejs",
    "authorId": "USER_ID_HERE",
    "hashtags": ["coding", "nodejs"]
  }'
```

#### Follow User
```bash
curl -X POST http://localhost:3000/api/follows \
  -H "Content-Type: application/json" \
  -d '{
    "followerId": "USER1_ID",
    "followingId": "USER2_ID"
  }'
```

#### Get Personalized Feed
```bash
curl "http://localhost:3000/api/feed?userId=USER_ID&limit=10&offset=0"
```

## 🗄️ Database Design

### Entity Relationship Diagram

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│    User     │────┬────│    Post     │────┬────│   Hashtag   │
│             │    │    │             │    │    │             │
│ - id        │    │    │ - id        │    │    │ - id        │
│ - username  │    │    │ - content   │    │    │ - name      │
│ - email     │    │    │ - authorId  │    │    └─────────────┘
│ - fullName  │    │    └─────────────┘    │
│ - bio       │    │                       │
└─────────────┘    │    ┌─────────────┐    │
       │           └────│    Like     │────┘
       │                │             │
       │                │ - id        │
       │                │ - userId    │
       │                │ - postId    │
       │                └─────────────┘
       │
       │           ┌─────────────┐
       └───────────│   Follow    │
                   │             │
                   │ - id        │
                   │ - followerId│
                   │ - followingId│
                   └─────────────┘
```

### Indexing Strategy

The database uses strategic indexing for optimal query performance:

#### Composite Indexes
- `posts(authorId, createdAt)` - Optimizes feed queries
- `likes(userId, postId)` - Unique constraint + fast lookup
- `follows(followerId, followingId)` - Unique constraint + relationship queries
- `activities(userId, createdAt)` - Activity history queries

#### Single Column Indexes
- `users(username)` - Unique, fast user lookup
- `users(email)` - Unique, authentication
- `posts(createdAt)` - Sorting posts
- `hashtags(name)` - Unique, fast hashtag lookup

### Relationships

```
User 1:N Post        (one user has many posts)
User 1:N Like        (one user has many likes)
User 1:N Follow      (as follower)
User 1:N Follow      (as following)
User 1:N Activity    (one user has many activities)

Post 1:N Like        (one post has many likes)
Post N:M Hashtag     (many-to-many relationship)

Like N:1 User
Like N:1 Post

Follow N:1 User (follower)
Follow N:1 User (following)

Hashtag N:M Post

Activity N:1 User
```

## 🧪 Testing

### Running Tests

The project includes a comprehensive interactive test suite:

```bash
./test.sh
```

The test script provides:
- ✅ CRUD tests for all entities
- ✅ Special endpoint tests (feed, hashtag search, followers, activity)
- ✅ Full automated test suite
- ✅ Color-coded output for easy reading
- ✅ Interactive menu system

### Test Coverage

All endpoints are tested:
- Users: Create, Read, Update, Delete, Get Followers, Get Activity
- Posts: Create, Read, Update, Delete, Get Feed, Search by Hashtag
- Likes: Create, Read, Delete
- Follows: Create, Read, Delete
- Hashtags: Create, Read, Update, Delete
- Activities: Read

## 🎯 Key Technical Decisions

### 1. Migration-Based Schema Management
**Decision:** Use TypeORM migrations instead of `synchronize: true`

**Rationale:**
- Version control for schema changes
- Reproducible database setup across environments
- Safe for production deployments
- Team collaboration support
- Rollback capability

**Commands:**
```bash
npm run migration:generate    # Generate new migration
npm run migration:run         # Apply migrations
npm run migration:revert      # Rollback last migration
```

### 2. UUID Primary Keys
**Decision:** Use UUIDs instead of auto-incrementing integers

**Rationale:**
- Better for distributed systems
- Prevents enumeration attacks
- No collision risk when merging databases
- Can be generated client-side

### 3. Composite Indexes for Feed Queries
**Decision:** Index on `(authorId, createdAt)` for posts table

**Rationale:**
- Feed query filters by authorId IN (following list)
- Then sorts by createdAt DESC
- Composite index optimizes both operations
- Reduces query time from O(n log n) to O(log n)

**Query Pattern:**
```sql
SELECT * FROM posts 
WHERE authorId IN (followingIds) 
ORDER BY createdAt DESC;
```

### 4. Automatic Hashtag Extraction
**Decision:** Extract and normalize hashtags automatically on post creation

**Rationale:**
- Better user experience (users don't manually tag)
- Consistent hashtag formatting (lowercase, no #)
- Automatic relationship creation
- Prevents duplicate hashtags

**Implementation:**
```typescript
// Hashtags are extracted from post content
// "Hello #Coding #NodeJS" → ["coding", "nodejs"]
// Auto-created if they don't exist
```

### 5. Activity Tracking with JSONB
**Decision:** Use JSONB column for flexible metadata storage

**Rationale:**
- Different activity types need different metadata
- Flexible schema without migrations
- Queryable with PostgreSQL JSONB operators
- Future-proof for new activity types

**Example:**
```json
{
  "activityType": "POST_LIKED",
  "metadata": {
    "likeId": "uuid",
    "postContent": "First 100 chars..."
  }
}
```

### 6. Pagination on All List Endpoints
**Decision:** Implement limit/offset pagination universally

**Rationale:**
- Prevents loading large datasets
- Consistent API interface
- Performance optimization
- Standard REST practice

**Default:** `limit=10, offset=0`

## ⚡ Performance Optimizations

### 1. Database Level
- ✅ Strategic indexing on frequently queried columns
- ✅ Composite indexes for multi-column queries
- ✅ Unique constraints prevent duplicate data
- ✅ CASCADE deletes for automatic cleanup
- ✅ Connection pooling via TypeORM

### 2. Query Level
- ✅ Eager loading only when necessary
- ✅ Select specific columns to reduce payload
- ✅ Use of `findAndCount` for efficient pagination
- ✅ Batch operations where possible

### 3. API Level
- ✅ Pagination prevents large response payloads
- ✅ Validation at entry point (Joi)
- ✅ Proper HTTP status codes
- ✅ Efficient error handling

### 4. Code Level
- ✅ TypeScript for compile-time error detection
- ✅ Async/await for non-blocking operations
- ✅ Single Responsibility Principle
- ✅ DRY (Don't Repeat Yourself)

## 🏗️ Architecture Patterns

### Layered Architecture
```
Routes (HTTP Layer)
    ↓
Controllers (Business Logic)
    ↓
Repositories (Data Access via TypeORM)
    ↓
Database (PostgreSQL)
```

### Separation of Concerns
- **Entities:** Database models and relationships
- **Controllers:** Business logic and request handling
- **Routes:** Endpoint definitions and routing
- **Validators:** Input validation with Joi
- **Migrations:** Database schema versioning

## 📈 Scalability Considerations

### Current Architecture
- Single server, single database
- Synchronous request handling
- Suitable for: Small to medium applications (< 10k users)

### Future Scaling Paths

#### Horizontal Scaling
- Load balancer + multiple app servers
- Redis for session storage
- Read replicas for database

#### Caching Layer
- Redis for feed caching
- Hashtag trending cache
- User profile cache

#### Database Optimization
- Partitioning large tables (posts, activities)
- Materialized views for complex queries
- Separate read/write databases

#### Microservices
- Split into: User Service, Post Service, Feed Service
- Message queue for async operations (e.g., RabbitMQ)
- Event sourcing for activities

## 🔒 Security Features

### Implemented
- ✅ Input validation with Joi
- ✅ SQL injection prevention (TypeORM parameterized queries)
- ✅ Foreign key constraints
- ✅ Unique constraints
- ✅ Proper error handling

### Future Enhancements
- 🔜 Authentication (JWT)
- 🔜 Authorization (Role-based access control)
- 🔜 Rate limiting
- 🔜 HTTPS/TLS
- 🔜 Password hashing (bcrypt)
- 🔜 CORS configuration

## 📝 Environment Variables

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=social_media_db
```

## 🤝 Contributing

This is a take-home assignment project. For educational purposes, feel free to:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - feel free to use this project for learning and reference.

## 👨‍💻 Author

**Nalamati Gowtham**
- GitHub: [@nalamatigowtham](https://github.com/nalamatigowtham)
- Email: nalamatigowtham@gmail.com

## 🙏 Acknowledgments

- Built as part of the Backend Engineering Intern assignment
- Demonstrates proficiency in:
  - RESTful API design
  - Database modeling and optimization
  - TypeScript and TypeORM
  - Migration-based schema management
  - Testing and documentation

---

**Last Updated:** February 2026

**Status:** ✅ Production Ready - All tests passing (10/10 endpoints)
