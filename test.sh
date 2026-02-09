#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

BASE_URL="http://localhost:3000/api"

# Global variables to store created IDs
USER1_ID=""
USER2_ID=""
USER3_ID=""
POST1_ID=""
POST2_ID=""
POST3_ID=""
LIKE_ID=""
FOLLOW_ID=""
HASHTAG_ID=""
ACTIVITY_ID=""

echo -e "${BLUE}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     Social Media Platform - API Test Suite              ║${NC}"
echo -e "${BLUE}╔══════════════════════════════════════════════════════════╗${NC}"
echo ""

# Function to print test headers
print_test() {
    echo -e "\n${YELLOW}▶ $1${NC}"
}

# Function to print success
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

# Function to print error
print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Function to make API call and check response
api_call() {
    local method=$1
    local endpoint=$2
    local data=$3
    local expected_status=$4
    
    if [ -z "$data" ]; then
        response=$(curl -s -w "\n%{http_code}" -X $method "$BASE_URL$endpoint" \
            -H "Content-Type: application/json")
    else
        response=$(curl -s -w "\n%{http_code}" -X $method "$BASE_URL$endpoint" \
            -H "Content-Type: application/json" \
            -d "$data")
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" == "$expected_status" ]; then
        print_success "Status: $http_code"
        echo "$body" | jq '.' 2>/dev/null || echo "$body"
        echo "$body"
        return 0
    else
        print_error "Expected status $expected_status, got $http_code"
        echo "$body" | jq '.' 2>/dev/null || echo "$body"
        return 1
    fi
}

# USER TESTS
test_create_user() {
    print_test "Creating User 1"
    response=$(api_call POST "/users" '{
        "username": "johndoe",
        "email": "john@example.com",
        "fullName": "John Doe",
        "bio": "Software developer and tech enthusiast"
    }' 201)
    USER1_ID=$(echo "$response" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
    echo "Captured USER1_ID: $USER1_ID"
    
    print_test "Creating User 2"
    response=$(api_call POST "/users" '{
        "username": "janedoe",
        "email": "jane@example.com",
        "fullName": "Jane Doe",
        "bio": "Product manager"
    }' 201)
    USER2_ID=$(echo "$response" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
    echo "Captured USER2_ID: $USER2_ID"
    
    print_test "Creating User 3"
    response=$(api_call POST "/users" '{
        "username": "bobsmith",
        "email": "bob@example.com",
        "fullName": "Bob Smith",
        "bio": "Designer"
    }' 201)
    USER3_ID=$(echo "$response" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
    echo "Captured USER3_ID: $USER3_ID"
}

test_get_all_users() {
    print_test "Getting all users"
    api_call GET "/users?limit=10&offset=0" "" 200
}

# POST TESTS
test_create_post() {
    if [ -z "$USER1_ID" ] || [ -z "$USER2_ID" ] || [ -z "$USER3_ID" ]; then
        print_error "User IDs not available. USER1_ID=$USER1_ID, USER2_ID=$USER2_ID, USER3_ID=$USER3_ID"
        return 1
    fi
    
    print_test "Creating Post 1 with hashtags"
    response=$(api_call POST "/posts" "{
        \"content\": \"Just deployed my new app! #coding #webdev\",
        \"authorId\": \"$USER1_ID\",
        \"hashtags\": [\"coding\", \"webdev\"]
    }" 201)
    POST1_ID=$(echo "$response" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
    echo "Captured POST1_ID: $POST1_ID"
    
    print_test "Creating Post 2"
    response=$(api_call POST "/posts" "{
        \"content\": \"Beautiful sunset today #nature #photography\",
        \"authorId\": \"$USER2_ID\",
        \"hashtags\": [\"nature\", \"photography\"]
    }" 201)
    POST2_ID=$(echo "$response" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
    echo "Captured POST2_ID: $POST2_ID"
    
    print_test "Creating Post 3"
    response=$(api_call POST "/posts" "{
        \"content\": \"Working on a new design project #design #ui\",
        \"authorId\": \"$USER3_ID\",
        \"hashtags\": [\"design\", \"ui\"]
    }" 201)
    POST3_ID=$(echo "$response" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
    echo "Captured POST3_ID: $POST3_ID"
}

test_get_all_posts() {
    print_test "Getting all posts"
    api_call GET "/posts?limit=10&offset=0" "" 200
}

# FOLLOW TESTS
test_create_follow() {
    if [ -z "$USER1_ID" ] || [ -z "$USER2_ID" ] || [ -z "$USER3_ID" ]; then
        print_error "User IDs not available"
        return 1
    fi
    
    print_test "User 1 follows User 2"
    response=$(api_call POST "/follows" "{
        \"followerId\": \"$USER1_ID\",
        \"followingId\": \"$USER2_ID\"
    }" 201)
    FOLLOW_ID=$(echo "$response" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
    echo "Captured FOLLOW_ID: $FOLLOW_ID"
    
    print_test "User 1 follows User 3"
    api_call POST "/follows" "{
        \"followerId\": \"$USER1_ID\",
        \"followingId\": \"$USER3_ID\"
    }" 201
}

test_get_all_follows() {
    print_test "Getting all follows"
    api_call GET "/follows?limit=10&offset=0" "" 200
}

# LIKE TESTS
test_create_like() {
    if [ -z "$USER1_ID" ] || [ -z "$POST2_ID" ]; then
        print_error "User or Post IDs not available"
        return 1
    fi
    
    print_test "User 1 likes Post 2"
    response=$(api_call POST "/likes" "{
        \"userId\": \"$USER1_ID\",
        \"postId\": \"$POST2_ID\"
    }" 201)
    LIKE_ID=$(echo "$response" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
    echo "Captured LIKE_ID: $LIKE_ID"
}

test_get_all_likes() {
    print_test "Getting all likes"
    api_call GET "/likes?limit=10&offset=0" "" 200
}

# HASHTAG TESTS
test_get_all_hashtags() {
    print_test "Getting all hashtags"
    api_call GET "/hashtags?limit=10&offset=0" "" 200
}

# ACTIVITY TESTS
test_get_all_activities() {
    print_test "Getting all activities"
    api_call GET "/activities?limit=10&offset=0" "" 200
}

# SPECIAL ENDPOINT TESTS
test_get_feed() {
    if [ -z "$USER1_ID" ]; then
        print_error "USER1_ID not available"
        return 1
    fi
    
    print_test "Getting feed for User 1"
    api_call GET "/feed?userId=$USER1_ID&limit=10&offset=0" "" 200
}

test_get_posts_by_hashtag() {
    print_test "Getting posts by hashtag: coding"
    api_call GET "/posts/hashtag/coding?limit=10&offset=0" "" 200
}

test_get_user_followers() {
    if [ -z "$USER2_ID" ]; then
        print_error "USER2_ID not available"
        return 1
    fi
    
    print_test "Getting followers for user: $USER2_ID"
    api_call GET "/users/$USER2_ID/followers?limit=10&offset=0" "" 200
}

test_get_user_activity() {
    if [ -z "$USER1_ID" ]; then
        print_error "USER1_ID not available"
        return 1
    fi
    
    print_test "Getting activity for user: $USER1_ID"
    api_call GET "/users/$USER1_ID/activity?limit=10&offset=0" "" 200
}

# FULL TEST SUITE
run_full_test_suite() {
    echo -e "\n${BLUE}╔══════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║           Running Full Test Suite                       ║${NC}"
    echo -e "${BLUE}╚══════════════════════════════════════════════════════════╝${NC}"
    
    echo -e "\n${YELLOW}═══════════════ USERS ═══════════════${NC}"
    test_create_user
    sleep 1
    test_get_all_users
    sleep 1
    
    echo -e "\n${YELLOW}═══════════════ POSTS ═══════════════${NC}"
    test_create_post
    sleep 1
    test_get_all_posts
    sleep 1
    
    echo -e "\n${YELLOW}═══════════════ FOLLOWS ═══════════════${NC}"
    test_create_follow
    sleep 1
    test_get_all_follows
    sleep 1
    
    echo -e "\n${YELLOW}═══════════════ LIKES ═══════════════${NC}"
    test_create_like
    sleep 1
    test_get_all_likes
    sleep 1
    
    echo -e "\n${YELLOW}═══════════════ HASHTAGS ═══════════════${NC}"
    test_get_all_hashtags
    sleep 1
    
    echo -e "\n${YELLOW}═══════════════ ACTIVITIES ═══════════════${NC}"
    test_get_all_activities
    sleep 1
    
    echo -e "\n${YELLOW}═══════════════ SPECIAL ENDPOINTS ═══════════════${NC}"
    test_get_feed
    sleep 1
    test_get_posts_by_hashtag
    sleep 1
    test_get_user_followers
    sleep 1
    test_get_user_activity
    
    echo -e "\n${GREEN}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}           Full Test Suite Completed!                      ${NC}"
    echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
}

# Check if server is running
echo -e "${YELLOW}Checking if server is running...${NC}"
if curl -s "$BASE_URL/../health" > /dev/null 2>&1; then
    print_success "Server is running"
else
    print_error "Server is not running. Please start the server first with: npm run dev"
    exit 1
fi

# Run the full test suite automatically
run_full_test_suite
