# Design Documentation 🏗️

## Table of Contents
1. [System Architecture](#system-architecture)
2. [Database Design](#database-design)
3. [API Design Patterns](#api-design-patterns)
4. [Performance Optimization Strategy](#performance-optimization-strategy)
5. [Scalability Considerations](#scalability-considerations)
6. [Security Design](#security-design)
7. [Key Technical Decisions](#key-technical-decisions)
8. [Trade-offs and Alternatives](#trade-offs-and-alternatives)

---

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                          │
│              (Web App, Mobile App, CLI)                      │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ HTTP/REST
                     │
┌────────────────────▼────────────────────────────────────────┐
│                     API Layer (Express.js)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Routes     │  │  Middleware  │  │  Validators  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│                  Business Logic Layer                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Controllers  │  │  Services    │  │   Helpers    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│                  Data Access Layer (TypeORM)                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Entities    │  │ Repositories │  │  Migrations  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│                   Database Layer (PostgreSQL)                │
│         Tables │ Indexes │ Constraints │ Relations          │
└─────────────────────────────────────────────────────────────┘
```

### Architecture Principles

**1. Separation of Concerns**
- Each layer has a single, well-defined responsibility
- Changes in one layer don't cascade to others
- Testability is improved through isolation

**2. Dependency Inversion**
- High-level modules don't depend on low-level modules
- Both depend on abstractions (TypeORM interfaces)

**3. Single Responsibility Principle**
- Each controller handles one entity
- Each validator validates one data type
- Each entity represents one database table

---

## Database Design

### Entity-Relationship Model

```
                    ┌──────────────┐
                    │     User     │
                    │──────────────│
                    │ id (PK)      │
                    │ username     │◄─────┐
                    │ email        │      │
                    │ fullName     │      │
                    │ bio          │      │
                    │ avatarUrl    │      │
                    │ createdAt    │      │
                    │ updatedAt    │      │
                    └──────┬───────┘      │
                           │              │
                           │ 1            │
                           │              │
                           │              │ N
              ┌────────────┼──────────────┼──────────────┐
              │            │              │              │
              │ N          │ N            │ N            │ 1
    ┌─────────▼───┐  ┌────▼─────┐  ┌────▼─────┐  ┌─────▼────────┐
    │    Post     │  │   Like   │  │  Follow  │  │   Activity   │
    │─────────────│  │──────────│  │──────────│  │──────────────│
    │ id (PK)     │  │ id (PK)  │  │ id (PK)  │  │ id (PK)      │
    │ content     │  │ userId   │◄─┤ follower │  │ userId       │
    │ authorId    │◄─┤ postId   │  │ following│  │ activityType │
    │ createdAt   │  │ createdAt│  │ createdAt│  │ targetId     │
    │ updatedAt   │  └──────────┘  └──────────┘  │ metadata     │
    └──────┬──────┘                               │ createdAt    │
           │                                       └──────────────┘
           │ N
           │
           │ M
    ┌──────▼──────┐
    │   Hashtag   │
    │─────────────│
    │ id (PK)     │
    │ name        │
    │ createdAt   │
    └─────────────┘
```

### Schema Design Decisions

#### 1. **UUID Primary Keys**

**Decision:** Use UUID v4 instead of serial integers

**Rationale:**
```sql
-- UUID Example
id UUID PRIMARY KEY DEFAULT uuid_generate_v4()

-- Benefits:
-- ✓ Globally unique across distributed systems
-- ✓ No sequential enumeration attacks
-- ✓ Can be generated client-side
-- ✓ Merge-friendly (no ID conflicts)
-- ✓ Better for microservices architecture

-- Trade-offs:
-- ✗ 16 bytes vs 4 bytes (larger storage)
-- ✗ Slightly slower joins (longer comparison)
-- ✓ But: Modern databases handle this efficiently
```

**Use Cases Where This Matters:**
- Multi-region deployments
- Offline-first applications
- Preventing user enumeration
- Future microservices split

---

#### 2. **Composite Indexes for Query Optimization**

**Decision:** Strategic use of composite (multi-column) indexes

**Example: Posts Table**
```sql
-- Composite index on (authorId, createdAt)
CREATE INDEX idx_posts_author_created 
ON posts(authorId, createdAt DESC);

-- Optimizes this common query:
SELECT * FROM posts 
WHERE authorId IN (1, 2, 3)  -- Filter by authors
ORDER BY createdAt DESC       -- Sort by date
LIMIT 10;

-- Query Plan:
-- Index Scan using idx_posts_author_created
-- Time: 0.5ms (vs 50ms without index on 1M rows)
```

**Why Composite vs Separate Indexes:**
```sql
-- Separate indexes (LESS EFFICIENT):
CREATE INDEX idx_posts_author ON posts(authorId);
CREATE INDEX idx_posts_created ON posts(createdAt);
-- Database picks ONE index, then filters/sorts rest

-- Composite index (MORE EFFICIENT):
CREATE INDEX idx_posts_author_created ON posts(authorId, createdAt);
-- Database uses BOTH columns in single index scan
```

**Index Strategy by Use Case:**

| Table | Index | Query Pattern | Cardinality |
|-------|-------|---------------|-------------|
| `posts` | `(authorId, createdAt)` | Feed queries | High |
| `likes` | `(userId, postId)` | Check if user liked | High (Unique) |
| `follows` | `(followerId, followingId)` | Check follow status | High (Unique) |
| `activities` | `(userId, createdAt)` | Activity history | High |
| `users` | `username` | Login, profile lookup | High (Unique) |
| `hashtags` | `name` | Hashtag search | High (Unique) |

---

#### 3. **Normalization Strategy (3NF)**

**Decision:** Normalize to Third Normal Form (3NF)

**Example: Why Hashtags Are a Separate Table**

❌ **Denormalized (Bad Design):**
```sql
-- Storing hashtags as comma-separated string
posts
  id | content | hashtags
  ---+---------+------------------
  1  | "Hello" | "coding,nodejs"
  2  | "World" | "coding,python"

-- Problems:
-- ✗ Can't query efficiently: WHERE hashtags LIKE '%coding%'
-- ✗ Duplicated data ("coding" stored multiple times)
-- ✗ No referential integrity
-- ✗ Hard to count hashtag usage
```

✅ **Normalized (Good Design):**
```sql
-- Separate tables with many-to-many relationship
hashtags
  id | name
  ---+--------
  1  | coding
  2  | nodejs
  3  | python

post_hashtags (junction table)
  postId | hashtagId
  -------+----------
  1      | 1
  1      | 2
  2      | 1
  2      | 3

-- Benefits:
-- ✓ Efficient queries: JOIN on indexed foreign keys
-- ✓ No duplicated data
-- ✓ Referential integrity via foreign keys
-- ✓ Easy to count: SELECT COUNT(*) FROM post_hashtags WHERE hashtagId = 1
-- ✓ Can add metadata to hashtags (trending score, etc.)
```

---

#### 4. **Unique Constraints for Data Integrity**

**Decision:** Use database-level unique constraints

```sql
-- Example: Prevent duplicate likes
CREATE UNIQUE INDEX idx_likes_user_post 
ON likes(userId, postId);

-- Example: Prevent duplicate follows
CREATE UNIQUE INDEX idx_follows_follower_following 
ON follows(followerId, followingId);

-- Benefits:
-- ✓ Database enforces uniqueness (not just app code)
-- ✓ Race condition safe
-- ✓ Prevents duplicate data even in concurrent requests
-- ✓ Returns clear error message: "duplicate key value violates unique constraint"
```

**Why Database-Level > Application-Level:**
```javascript
// ❌ Application-level check (NOT SAFE):
const exists = await likeRepository.findOne({ userId, postId });
if (!exists) {
  await likeRepository.save({ userId, postId }); // Race condition!
}
// Problem: Two simultaneous requests can both pass the check

// ✅ Database-level constraint (SAFE):
try {
  await likeRepository.save({ userId, postId });
} catch (error) {
  if (error.code === '23505') { // Unique violation
    return res.status(409).json({ error: 'Already liked' });
  }
}
```

---

#### 5. **JSONB for Flexible Metadata**

**Decision:** Use PostgreSQL JSONB for activity metadata

**Schema:**
```sql
activities
  id          | UUID PRIMARY KEY
  userId      | UUID NOT NULL
  activityType| VARCHAR(50) NOT NULL
  targetId    | UUID
  metadata    | JSONB  -- ← Flexible storage
  createdAt   | TIMESTAMP
```

**Why JSONB:**
```sql
-- Different activity types need different metadata:

-- POST_CREATED:
metadata = {
  "content": "First 100 chars of post...",
  "hashtagCount": 3
}

-- POST_LIKED:
metadata = {
  "likeId": "uuid",
  "postAuthor": "johndoe"
}

-- USER_FOLLOWED:
metadata = {
  "followId": "uuid",
  "followedUsername": "janedoe"
}

-- Benefits:
-- ✓ No schema migrations for new activity types
-- ✓ Queryable: WHERE metadata->>'postAuthor' = 'johndoe'
-- ✓ Indexable: CREATE INDEX ON activities USING GIN (metadata);
-- ✓ Type-safe in PostgreSQL
-- ✓ Efficient binary storage (not text JSON)
```

**JSONB vs JSON vs Separate Columns:**

| Approach | Pros | Cons |
|----------|------|------|
| JSONB | Flexible, queryable, no migrations | Larger storage than normalized |
| Separate columns | Faster queries, smaller | Requires migrations for new types |
| JSON (text) | Flexible | Not queryable, slower |

**Chosen: JSONB** - Best balance for activity tracking use case

---

### Indexing Strategy

#### Understanding Index Performance

**How Indexes Work:**
```
Without Index (Sequential Scan):
┌───┬───┬───┬───┬───┬───┬───┬───┐
│ 1 │ 2 │ 3 │ 4 │ 5 │ 6 │ 7 │ 8 │  Check every row
└───┴───┴───┴───┴───┴───┴───┴───┘
Time: O(n) - Linear with table size

With B-Tree Index:
         ┌───┐
         │ 5 │              Check ~log2(n) nodes
    ┌────┴───┴────┐
  ┌─┴─┐         ┌─┴─┐
  │ 2 │         │ 7 │
┌─┴─┬─┴─┐     ┌─┴─┬─┴─┐
│ 1 │ 3 │     │ 6 │ 8 │
└───┴───┘     └───┴───┘
Time: O(log n) - Logarithmic
```

#### Index Design Rules

**1. Index Selectivity**
```sql
-- High selectivity (GOOD for indexing):
SELECT COUNT(DISTINCT username) / COUNT(*) FROM users;
-- Result: 1.0 (every username is unique)

-- Low selectivity (BAD for indexing):
SELECT COUNT(DISTINCT gender) / COUNT(*) FROM users;
-- Result: 0.5 (only male/female - not worth indexing)

-- Rule: Only index columns with selectivity > 0.1
```

**2. Composite Index Column Order**

**Rule:** Most selective column first

```sql
-- GOOD: High selectivity first
CREATE INDEX idx_posts_author_created 
ON posts(authorId, createdAt);
-- authorId has high cardinality (many different authors)

-- BAD: Low selectivity first
CREATE INDEX idx_posts_created_author 
ON posts(createdAt, authorId);
-- createdAt alone isn't selective enough
```

**3. Index Maintenance Cost**

Every index has a cost:
- **Write operations:** Must update all indexes
- **Storage:** Each index uses disk space
- **Cache pollution:** Indexes compete for memory

**Strategy:** Only index frequently queried columns

---

### Database Constraints

#### Foreign Key Constraints

```sql
-- Posts reference users (author)
ALTER TABLE posts
  ADD CONSTRAINT fk_posts_author
  FOREIGN KEY (authorId) 
  REFERENCES users(id)
  ON DELETE CASCADE;  -- ← Delete posts when user deleted

-- Likes reference users and posts
ALTER TABLE likes
  ADD CONSTRAINT fk_likes_user
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_likes_post
  FOREIGN KEY (postId) REFERENCES posts(id) ON DELETE CASCADE;
```

**Cascade Strategy:**

| Relationship | On Delete | Rationale |
|--------------|-----------|-----------|
| Post → User | CASCADE | User owns posts |
| Like → User | CASCADE | Likes belong to user |
| Like → Post | CASCADE | No orphaned likes |
| Follow → User | CASCADE | Follows are user relationships |
| Activity → User | CASCADE | Activities belong to user |

---

## API Design Patterns

### RESTful Principles

**1. Resource-Oriented URLs**

```http
✓ GOOD:
GET    /api/users              # Collection
GET    /api/users/123          # Specific resource
POST   /api/users              # Create
PUT    /api/users/123          # Full update
DELETE /api/users/123          # Delete

✗ BAD:
GET    /api/getUsers
POST   /api/createUser
GET    /api/user?id=123
```

**2. HTTP Verb Semantics**

| Verb | Idempotent? | Safe? | Use Case |
|------|-------------|-------|----------|
| GET | Yes | Yes | Retrieve data |
| POST | No | No | Create new resource |
| PUT | Yes | No | Update (full replacement) |
| PATCH | No | No | Partial update |
| DELETE | Yes | No | Remove resource |

**3. Status Code Strategy**

```javascript
// Success codes
200 OK          // Successful GET, PUT, DELETE
201 Created     // Successful POST
204 No Content  // Successful DELETE with no response body

// Client error codes
400 Bad Request      // Validation failed
401 Unauthorized     // Not authenticated
403 Forbidden        // Authenticated but not authorized
404 Not Found        // Resource doesn't exist
409 Conflict         // Duplicate (e.g., unique constraint)

// Server error codes
500 Internal Error   // Unexpected server error
```

### Pagination Design

**Decision:** Offset-based pagination (simple, works for most cases)

```javascript
// Query parameters
GET /api/posts?limit=10&offset=20

// Response format
{
  "posts": [...],
  "total": 150,      // Total count
  "limit": 10,       // Items per page
  "offset": 20       // Current offset
}

// Pagination metadata calculation:
const currentPage = Math.floor(offset / limit) + 1;
const totalPages = Math.ceil(total / limit);
const hasNextPage = offset + limit < total;
const hasPrevPage = offset > 0;
```

**Why Not Cursor-Based?**

| Approach | Pros | Cons | Use Case |
|----------|------|------|----------|
| Offset | Simple, can jump to any page | Inconsistent with live data | Our use case |
| Cursor | Consistent, efficient for large data | Can't jump to page N | Real-time feeds |

**Trade-off:** Chose simplicity for assignment scope

---

## Performance Optimization Strategy

### Query Optimization

#### 1. **N+1 Query Problem - Solved**

**Problem:**
```javascript
// ❌ N+1 queries (BAD):
const posts = await postRepository.find(); // 1 query
for (const post of posts) {
  post.author = await userRepository.findOne(post.authorId); // N queries
}
// Total: 1 + N queries for N posts
```

**Solution:**
```javascript
// ✓ Single query with JOIN (GOOD):
const posts = await postRepository.find({
  relations: ['author', 'hashtags'] // Eager load
});
// Total: 1 query using JOIN

// Generated SQL:
SELECT posts.*, users.*, hashtags.*
FROM posts
LEFT JOIN users ON posts.authorId = users.id
LEFT JOIN post_hashtags ON posts.id = post_hashtags.postId
LEFT JOIN hashtags ON post_hashtags.hashtagId = hashtags.id;
```

#### 2. **Query Result Projection**

```javascript
// ❌ Fetch all columns (wasteful):
const users = await userRepository.find();

// ✓ Select only needed columns:
const users = await userRepository.find({
  select: ['id', 'username', 'avatarUrl']
});

// Reduces:
// - Network transfer
// - Memory usage
// - JSON serialization time
```

#### 3. **Connection Pooling**

```typescript
// TypeORM configuration
export const AppDataSource = new DataSource({
  type: 'postgres',
  poolSize: 10,              // Max connections
  extra: {
    max: 10,                 // Connection pool max
    min: 2,                  // Connection pool min
    idleTimeoutMillis: 30000 // Close idle connections
  }
});

// Benefits:
// - Reuse database connections
// - Reduce connection overhead
// - Handle concurrent requests efficiently
```

### Caching Strategy (Future Enhancement)

**Recommended Cache Layers:**

```
┌──────────────────────────────────────┐
│   Client (Browser Cache)             │  TTL: 5 minutes
└───────────────┬──────────────────────┘
                │
┌───────────────▼──────────────────────┐
│   CDN (for static assets)            │  TTL: 1 hour
└───────────────┬──────────────────────┘
                │
┌───────────────▼──────────────────────┐
│   Application Cache (Redis)          │  TTL: varies
│   - User profiles: 10 min            │
│   - Feed: 1 min                      │
│   - Hashtag counts: 5 min            │
└───────────────┬──────────────────────┘
                │
┌───────────────▼──────────────────────┐
│   Database (PostgreSQL)               │
└──────────────────────────────────────┘
```

**Cache Invalidation Strategy:**
```javascript
// Write-through cache pattern
async function createPost(postData) {
  const post = await postRepository.save(postData);
  
  // Invalidate cached feed for followers
  const followers = await getFollowers(postData.authorId);
  for (const follower of followers) {
    await redis.del(`feed:${follower.id}`);
  }
  
  return post;
}
```

---

## Scalability Considerations

### Current Architecture Limitations

**Single Server Constraints:**
- **CPU:** 4-8 cores
- **Memory:** 16-32 GB
- **Database:** Single PostgreSQL instance
- **Throughput:** ~1,000 req/sec
- **Users:** Up to 10,000 concurrent

### Scaling Path

#### Phase 1: Vertical Scaling (0-10K users)
```
Current state ✓
- Single server
- Single database
- Cost: $50-100/month
```

#### Phase 2: Database Optimization (10K-100K users)
```
┌──────────┐
│  App     │
│  Server  │
└────┬─────┘
     │
┌────▼────────────┐
│  PostgreSQL     │
│  ┌───────────┐  │
│  │ Master    │  │  ← Writes
│  └─────┬─────┘  │
│        │        │
│  ┌─────▼─────┐  │
│  │ Replica 1 │  │  ← Reads (feed, search)
│  └───────────┘  │
│  ┌───────────┐  │
│  │ Replica 2 │  │  ← Reads (profiles)
│  └───────────┘  │
└─────────────────┘

Read/Write Split:
- Writes → Master
- Reads → Replicas (round-robin)
- Reduces load on master
```

#### Phase 3: Horizontal Scaling (100K-1M users)
```
                ┌──────────────┐
                │ Load Balancer│
                └───────┬──────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
   ┌────▼────┐    ┌────▼────┐    ┌────▼────┐
   │  App 1  │    │  App 2  │    │  App 3  │
   └────┬────┘    └────┬────┘    └────┬────┘
        │              │              │
        └──────────────┼──────────────┘
                       │
            ┌──────────▼──────────┐
            │  Database Cluster   │
            └─────────────────────┘
```

#### Phase 4: Microservices (1M+ users)
```
┌─────────────────────────────────────┐
│         API Gateway                  │
└────────┬──────┬──────┬───────┬──────┘
         │      │      │       │
    ┌────▼──┐ ┌─▼───┐ ┌▼────┐ ┌▼─────┐
    │ User  │ │Post │ │Feed │ │Search│
    │Service│ │Svc  │ │Svc  │ │Svc   │
    └───┬───┘ └──┬──┘ └─┬───┘ └──┬───┘
        │        │      │        │
    ┌───▼───┐ ┌──▼──┐ ┌─▼──┐ ┌──▼───┐
    │User DB│ │Post │ │Redis│ │Elastic│
    └───────┘ │ DB  │ └────┘ └──────┘
              └─────┘
```

### Bottleneck Analysis

**Feed Generation Complexity:**
```
Time complexity: O(F * P * log(P))
where:
  F = number of people user follows
  P = posts per person

Example:
  User follows 1000 people
  Each has 100 posts
  = 100,000 posts to sort
  = ~0.5 seconds on single server

Solutions:
1. Pre-compute feed (fan-out on write)
2. Cache feed in Redis
3. Limit feed depth (e.g., last 30 days)
```

---

## Security Design

### Input Validation

**Defense in Depth Strategy:**

```
1. Client-side validation (UX)
        ↓
2. API validation (Joi) ← Current implementation
        ↓
3. Database constraints (NOT NULL, CHECK)
        ↓
4. Parameterized queries (SQL injection prevention)
```

**Joi Validation Example:**
```javascript
const userSchema = Joi.object({
  username: Joi.string()
    .alphanum()           // Only alphanumeric
    .min(3).max(30)       // Length constraints
    .required(),
  email: Joi.string()
    .email()              // Valid email format
    .required(),
  bio: Joi.string()
    .max(500)             // Prevent DoS via long strings
    .optional()
});

// Prevents:
// ✓ SQL injection (via sanitization)
// ✓ XSS (via type validation)
// ✓ DoS (via length limits)
```

### SQL Injection Prevention

**TypeORM Automatic Protection:**
```javascript
// ✓ SAFE (parameterized):
const user = await userRepository.findOne({ 
  where: { username: userInput } 
});
// Generated SQL: SELECT * FROM users WHERE username = $1
// Parameter: userInput (escaped automatically)

// ✗ UNSAFE (raw query without parameters):
const users = await userRepository.query(
  `SELECT * FROM users WHERE username = '${userInput}'`
);
// Don't do this!
```

### Future Security Enhancements

**1. Authentication (JWT)**
```javascript
// Planned implementation:
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "hashed_password"
}

// Response:
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "expiresIn": 3600
}

// Usage:
GET /api/posts
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**2. Rate Limiting**
```javascript
// Prevent abuse:
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // Max 100 requests per window
});

app.use('/api/', limiter);
```

---

## Key Technical Decisions

### 1. TypeORM Over Raw SQL

**Decision:** Use TypeORM as ORM layer

**Pros:**
- Type safety (TypeScript integration)
- Automatic migrations
- Protection against SQL injection
- Cleaner code (less boilerplate)
- Easy relationship management

**Cons:**
- Learning curve
- Performance overhead (minor)
- Less control over complex queries

**Mitigation:**
- Can drop to raw SQL when needed
- Use query builder for complex queries

---

### 2. Migration-Based Schema Over Synchronize

**Decision:** Manual migrations, not `synchronize: true`

**Why synchronize is dangerous:**
```javascript
// ❌ synchronize: true (Development only!)
{
  synchronize: true // Auto-creates/updates schema
}

// Problems in production:
// - Can DROP columns with data
// - No rollback mechanism
// - No review process
// - Race conditions in multi-instance deployment
```

**Migration benefits:**
```javascript
// ✓ Explicit migrations
{
  migrations: ['src/migrations/*.ts'],
  synchronize: false
}

// Benefits:
// - Version controlled
// - Reviewable (code review)
// - Rollback support
// - Safe for production
// - Explicit data migrations
```

---

### 3. Monorepo Over Microservices

**Decision:** Single application for this assignment

**Justification:**

For < 100K users:
- Monolith is simpler
- Easier to develop/test
- Lower operational overhead
- No network latency between services

**When to split into microservices:**
- Different scaling needs (e.g., feed service needs more resources)
- Team boundaries (different teams own services)
- Technology diversity (different languages/databases)
- Independent deployment needs

---

### 4. REST Over GraphQL

**Decision:** RESTful API

**Why REST for this project:**
- Simpler to implement
- Better for assignment scope
- Easier to test (curl)
- Standard HTTP caching
- Well-understood patterns

**When GraphQL makes sense:**
- Complex nested data requirements
- Multiple clients with different needs
- Reduce over-fetching/under-fetching
- Real-time subscriptions

---

## Trade-offs and Alternatives

### 1. UUID vs Auto-increment IDs

| Aspect | UUID | Auto-increment |
|--------|------|----------------|
| Size | 16 bytes | 4-8 bytes |
| Randomness | Yes | No |
| Distributed | Yes | No |
| Performance | Slightly slower | Faster |
| Security | Better | Enumeration risk |

**Chosen:** UUID for better security and future scalability

---

### 2. PostgreSQL vs MySQL vs MongoDB

| Database | Pros | Cons | Use Case |
|----------|------|------|----------|
| PostgreSQL | JSONB, full ACID, advanced features | Complex setup | ✓ Our choice |
| MySQL | Fast, simple, widely used | Less features | Good alternative |
| MongoDB | Flexible schema, fast writes | No ACID, harder joins | Document-heavy apps |

**Chosen:** PostgreSQL for JSONB, ACID compliance, and advanced indexing

---

### 3. Offset vs Cursor Pagination

| Approach | Query | Consistent? | Jump to page? |
|----------|-------|-------------|---------------|
| Offset | `LIMIT 10 OFFSET 20` | No | Yes |
| Cursor | `WHERE id > cursor` | Yes | No |

**Chosen:** Offset for simplicity and jump-to-page support

**Future:** Cursor pagination for infinite scroll feeds

---

### 4. Fan-out on Write vs Fan-out on Read (Feed)

**Current: Fan-out on Read**
```
User requests feed
  → Query follows table
  → Query posts IN (following)
  → Sort and return

Pros: Simple, no storage overhead
Cons: Slow for users following many people
```

**Alternative: Fan-out on Write**
```
User creates post
  → Get followers
  → Write to each follower's feed cache

Pros: Fast reads
Cons: Slow writes, storage overhead
```

**Chosen:** Fan-out on read for assignment
**Production:** Hybrid approach (fan-out on write for active users)

---

## Conclusion

This social media backend demonstrates **production-ready design** principles:

✅ **Scalable database design** with strategic indexing
✅ **RESTful API** following industry standards  
✅ **Type-safe implementation** with TypeScript
✅ **Migration-based schema** for safe deployments
✅ **Comprehensive validation** preventing common attacks
✅ **Clear separation of concerns** for maintainability
✅ **Performance optimizations** for real-world usage
✅ **Documented trade-offs** showing engineering judgment

The architecture supports growth from 0 to 100K+ users with clear scaling paths to millions.

---

**Author:** Gowtham Nalamati  
**Last Updated:** February 2026  
**Version:** 1.0
