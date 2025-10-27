# Pat3on Backend API

Backend API for the Pat3on decentralized subscription platform.

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Setup MongoDB

**Option A: Local MongoDB**
```bash
# Install MongoDB (macOS)
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community

# Or use Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

**Option B: MongoDB Atlas (Cloud)**
1. Go to https://www.mongodb.com/cloud/atlas
2. Create free account and cluster
3. Get connection string
4. Update `MONGODB_URI` in `.env`

### 3. Configure Environment

The `.env` file is already created with Sepolia configuration.
Verify it has:
- `MONGODB_URI`
- `JWT_SECRET`
- `MOCK_USDC_ADDRESS=0xf9F41eFdb8AF8084b7BcFb70fBcbece6FBf28542`
- `SEPOLIA_RPC_URL`

### 4. Start Server

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

Server will run on: http://localhost:5000

## 📡 API Endpoints

### Authentication

#### Register
```bash
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "role": "user"  // or "author"
}
```

#### Login
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}

# Returns: { token, user }
```

#### Get Current User
```bash
GET /api/auth/me
Authorization: Bearer YOUR_JWT_TOKEN
```

### Wallet Management

#### Link Wallet
```bash
POST /api/wallet/link
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
}
```

#### Get Wallet Info
```bash
GET /api/wallet/info
Authorization: Bearer YOUR_JWT_TOKEN
```

#### Unlink Wallet
```bash
DELETE /api/wallet/unlink
Authorization: Bearer YOUR_JWT_TOKEN
```

## 🧪 Testing with cURL

### Register a User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "password123",
    "role": "user"
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "password123"
  }'
```

### Link Wallet (use token from login)
```bash
curl -X POST http://localhost:5000/api/wallet/link \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -d '{
    "walletAddress": "0x99a35A41147A49515cBC4794779C0F6beBE2c95D"
  }'
```

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/
│   │   └── database.js          # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js    # Authentication logic
│   │   └── walletController.js  # Wallet linking logic
│   ├── middleware/
│   │   ├── auth.js              # JWT verification
│   │   └── roleCheck.js         # Role-based access
│   ├── models/
│   │   ├── User.js              # User schema
│   │   ├── AuthorProfile.js     # Author profile schema
│   │   ├── Plan.js              # Subscription plan schema
│   │   └── Subscription.js      # Subscription schema
│   ├── routes/
│   │   ├── auth.js              # Auth routes
│   │   └── wallet.js            # Wallet routes
│   └── server.js                # Express app entry point
├── .env                         # Environment variables
├── .env.example                 # Environment template
├── package.json
└── README.md
```

## 🔐 Environment Variables

```env
# Server
PORT=5000
NODE_ENV=development

```env
# Backend .env Configuration

# Database
MONGODB_URI=mongodb://localhost:27017/pat3on

# JWT
JWT_SECRET=your_secret_key
JWT_EXPIRE=7d

# Blockchain (Sepolia)
MOCK_USDC_ADDRESS=0xf9F41eFdb8AF8084b7BcFb70fBcbece6FBf28542
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/...
CHAIN_ID=11155111

# CORS
FRONTEND_URL=http://localhost:3000
```

## 🛠️ Development Commands

```bash
# Install dependencies
npm install

# Start development server (with nodemon)
npm run dev

# Start production server
npm start

# Run tests (when available)
npm test
```

## ✅ What's Implemented

- [x] User registration (user/author roles)
- [x] User login with JWT
- [x] Get current user info
- [x] Link wallet address
- [x] Get wallet info
- [x] Unlink wallet
- [x] JWT authentication middleware
- [x] Role-based access control
- [x] MongoDB models (User, AuthorProfile, Plan, Subscription)
- [x] Input validation
- [x] Error handling

## 🔜 Coming Next

- [ ] Creator profile management
- [ ] Subscription plan CRUD
- [ ] Subscription endpoints
- [ ] Smart contract integration
- [ ] Transaction tracking
- [ ] Author dashboard stats

## 🆘 Troubleshooting

**"Cannot connect to MongoDB"**
→ Make sure MongoDB is running: `brew services start mongodb-community`

**"JWT verification failed"**
→ Check if you're sending the token in Authorization header

**"Wallet already linked"**
→ Each wallet can only be linked to one account

**"Port 5000 already in use"**
→ Change PORT in .env or kill the process using port 5000

## 📞 API Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message",
  "errors": [ ... ]  // validation errors if any
}
```

---

**Ready to test?** Start the server and try the API endpoints! 🚀
