# Pat3on Deployment Guide

## 📋 Prerequisites
- GitHub account (your code should be pushed to GitHub)
- Render account (sign up at https://render.com)
- Vercel account (sign up at https://vercel.com)
- MongoDB Atlas account (for production database)

---

## Part 1: Deploy Backend to Render

### Step 1: Prepare Backend for Deployment

1. **Create a start script** - Your backend should already have this in `package.json`:
   ```json
   "scripts": {
     "start": "node src/server.js"
   }
   ```

2. **Ensure your backend port is dynamic**:
   - Open `backend/src/server.js`
   - Verify it uses: `const PORT = process.env.PORT || 5001;`

### Step 2: Set Up MongoDB Atlas (Production Database)

1. Go to https://cloud.mongodb.com
2. Create a free cluster (M0)
3. Click "Connect" → "Connect your application"
4. Copy the connection string (looks like):
   ```
   mongodb+srv://username:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
5. Replace `<password>` with your actual password
6. Add `/pat3on` before the `?` to specify database name:
   ```
   mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/pat3on?retryWrites=true&w=majority
   ```

### Step 3: Deploy Backend on Render

1. **Go to Render Dashboard**: https://dashboard.render.com

2. **Click "New +" → "Web Service"**

3. **Connect Your Repository**:
   - Connect your GitHub account
   - Select your `Pat3on` repository

4. **Configure the Service**:
   - **Name**: `pat3on-backend` (or any name)
   - **Region**: Choose closest to you
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free`

5. **Add Environment Variables**:
   Click "Advanced" → "Add Environment Variable" and add these:

   ```
   NODE_ENV=production
   MONGODB_URI=<your_mongodb_atlas_connection_string>
   JWT_SECRET=<generate_random_32_character_string>
   WALLET_ENCRYPTION_KEY=<generate_random_64_character_hex_string>
   SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/<your_infura_key>
   MOCK_USDC_ADDRESS=0xB9FCc8eE949A9F5F65031828Bf375BB2E116A7be
   ```

   **How to generate secrets**:
   - JWT_SECRET: Run in terminal: `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`
   - WALLET_ENCRYPTION_KEY: Run: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
   - SEPOLIA_RPC_URL: Get free key from https://infura.io

6. **Click "Create Web Service"**

7. **Wait for Deployment** (5-10 minutes)
   - Watch the logs for any errors
   - Once deployed, you'll see "Live" status
   - Copy your backend URL: `https://pat3on-backend.onrender.com`

### Step 4: Test Backend

1. Visit: `https://your-backend-url.onrender.com/api/health`
2. Should return: `{"status":"ok"}`

---

## Part 2: Deploy Frontend to Vercel

### Step 1: Prepare Frontend

1. **Create `vercel.json` in frontend directory**:

Create file: `frontend/vercel.json`

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

2. **Update API URL**:

Edit `frontend/src/services/api.js`:

```javascript
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
```

### Step 2: Deploy to Vercel

1. **Go to Vercel Dashboard**: https://vercel.com/dashboard

2. **Click "Add New..." → "Project"**

3. **Import Your Repository**:
   - Click "Import Git Repository"
   - Select your `Pat3on` repository
   - Click "Import"

4. **Configure Project**:
   - **Framework Preset**: `Create React App`
   - **Root Directory**: Click "Edit" → Select `frontend`
   - **Build Command**: `npm run build` (should be auto-detected)
   - **Output Directory**: `build` (should be auto-detected)

5. **Add Environment Variable**:
   - Click "Environment Variables"
   - Add:
     ```
     REACT_APP_API_URL=https://your-backend-url.onrender.com/api
     ```
   - Replace with your actual Render backend URL

6. **Click "Deploy"**

7. **Wait for Deployment** (2-3 minutes)
   - Once done, you'll get a URL like: `https://pat3on.vercel.app`

### Step 3: Update Backend CORS

1. **Go back to Render Dashboard**
2. **Click on your backend service**
3. **Environment → Add Environment Variable**:
   ```
   FRONTEND_URL=https://your-vercel-url.vercel.app
   ```

4. **Update backend CORS** (if not already dynamic):

Edit `backend/src/server.js` to include:

```javascript
const cors = require('cors');

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
```

5. **Save and Redeploy** - Render will auto-redeploy

---

## Part 3: Final Testing

### Test the Full Flow:

1. **Visit Your Frontend**: `https://your-app.vercel.app`

2. **Test Registration**:
   - Create a new account
   - Check if wallet is created

3. **Test Authentication**:
   - Login works
   - Dashboard loads

4. **Test Blockchain Features**:
   - Get test tokens from Sepolia faucet
   - Create a plan (as creator)
   - Subscribe to a plan (as user)
   - Wait for auto-renewal

5. **Check Logs**:
   - Render: Check backend logs for any errors
   - Vercel: Check deployment logs
   - Browser Console: Check for API errors

---

## 🔧 Troubleshooting

### Backend Issues:

**Problem**: Backend won't start
- Check Render logs for errors
- Verify all environment variables are set
- Check MongoDB connection string is correct

**Problem**: CORS errors
- Make sure FRONTEND_URL is set correctly
- Verify CORS is configured in backend

### Frontend Issues:

**Problem**: Can't connect to backend
- Check REACT_APP_API_URL is correct
- Verify backend is running (visit /api/health)
- Check browser console for errors

**Problem**: Blank page
- Check Vercel deployment logs
- Verify build completed successfully
- Check browser console for errors

### Database Issues:

**Problem**: Can't connect to MongoDB
- Verify MongoDB Atlas IP whitelist (set to 0.0.0.0/0 for all IPs)
- Check connection string format
- Ensure database user has correct permissions

---

## 📝 Important Notes

1. **Render Free Tier**: 
   - Backend will sleep after 15 minutes of inactivity
   - First request after sleep takes ~30 seconds
   - Consider upgrading for production

2. **Environment Variables**:
   - Never commit secrets to Git
   - Keep .env files in .gitignore
   - Use Render/Vercel dashboards for secrets

3. **Database**:
   - MongoDB Atlas free tier is 512MB
   - Backup your data regularly
   - Monitor usage in Atlas dashboard

4. **Sepolia Testnet**:
   - This is still on testnet
   - For mainnet, update RPC URL and contract addresses
   - Get real ETH and USDC contracts

---

## 🚀 Post-Deployment Checklist

- [ ] Backend is live and responding
- [ ] Frontend loads without errors
- [ ] User registration works
- [ ] User login works
- [ ] Wallets are created properly
- [ ] Blockchain transactions work
- [ ] Auto-renewal scheduler is running
- [ ] Payment history shows correctly
- [ ] All pages are accessible
- [ ] Mobile responsive (test on phone)

---

## 🎉 You're Live!

Share your deployed URLs:
- **Frontend**: https://your-app.vercel.app
- **Backend**: https://your-backend.onrender.com

Good luck with your demo! 🚀

---

## Quick Commands Reference

```bash
# Generate JWT Secret
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Generate Wallet Encryption Key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Test Backend Health
curl https://your-backend.onrender.com/api/health

# View Render Logs
# Go to: https://dashboard.render.com → Your Service → Logs

# View Vercel Logs  
# Go to: https://vercel.com/dashboard → Your Project → Deployments → Latest
```
