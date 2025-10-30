# 🎯 Pat3on - Decentralized Subscription Platform

**Empowering Creators. Supporting Fans. Built on Blockchain.**

Pat3on is a Web3 subscription platform similar to Patreon, where creators can monetize their content through recurring subscriptions paid in cryptocurrency. Unlike traditional platforms, Pat3on gives both creators and subscribers more control, transparency, and ownership.

---

## 🌟 What is Pat3on?

Pat3on connects content creators with their supporters through blockchain technology. Creators can offer subscription tiers, and fans can subscribe using cryptocurrency to access exclusive content and perks.

### Why Pat3on?

**For Creators:**
- 💰 **Lower Fees** - Keep more of what you earn compared to traditional platforms
- 🌍 **Global Reach** - Accept payments from anyone, anywhere, without banking restrictions
- 🔒 **True Ownership** - Your creator profile and subscription data live on the blockchain
- 📊 **Transparent Payments** - See exactly when and how much you earn in real-time

**For Subscribers:**
- 🎁 **Direct Support** - Your money goes directly to creators you love
- 🔐 **Privacy** - No need to share credit card details
- 🌐 **Borderless** - Support creators worldwide without currency conversion hassles
- ⚡ **Instant Access** - Start streaming payments immediately after subscribing

---

## 💡 How It Works

### For New Users (Simple Mode)
1. **Sign Up** - Create an account with email and password
2. **Get Your Wallet** - We automatically create a secure crypto wallet for you
3. **Save Your Key** - Write down your private key (shown once for security)
4. **Add Funds** - Deposit some test USDC to your wallet
5. **Subscribe** - Choose a creator and start your subscription!


---

## 🎨 Key Features

### ✨ Automatic Recurring Payments
Once you subscribe, payments flow automatically every 5 minutes - no need to manually approve transactions each time. The system automatically renews subscriptions when they expire, ensuring uninterrupted access to creator content.

### 🔐 Custodial Wallets
Don't have a crypto wallet? No problem! Pat3on creates one for you automatically when you sign up. Your wallet is:
- Encrypted and stored securely using AES-256-GCM
- Automatically funded with gas fees
- Easy to export if you want to use it elsewhere

### � Creator Dashboard
Creators can:
- Create multiple subscription tiers (Basic, Premium, VIP, etc.)
- Set custom pricing per 5 minutes for quick demo cycles
- View clickable plans that link to their posts
- Write exclusive posts for specific subscription tiers
- Activate/deactivate plans as needed
- Edit profile with bio, social links, and profile image

### 🎯 Subscription Tiers & Plan-Specific Content
Like Patreon's membership levels, creators can offer different tiers with exclusive content:
- Create subscription plans with custom names and pricing
- Write posts exclusive to specific plans
- Subscribers access posts by clicking plan names
- Automatic access control - only active subscribers can view posts
- Creators can always view their own content

### 📊 Payment History
Complete transaction tracking for both users and creators:
- View all subscription payments (initial + renewals)
- Separate tracking for money spent and earned
- Filter by transaction type (incoming/outgoing)
- Direct links to Etherscan for verification
- Shows renewal transactions automatically tracked

### 🔔 Real-Time Notifications
Stay updated with:
- Subscription renewal confirmations
- Failed payment alerts
- Subscription deletion notices
- Live countdown timers showing time until renewal
- Notification bell in header with unread count

### 👤 User Features
**For Subscribers:**
- Browse all creators and their plans
- Subscribe with one click
- View only active subscriptions (expired ones hidden)
- See time remaining until next renewal (minutes & seconds)
- Toggle auto-renewal on/off
- Cancel subscriptions anytime
- Access exclusive posts for subscribed plans

**For Creators:**
- Profile settings with custom bio and social links
- Create unlimited subscription plans
- Write posts for specific plan tiers
- View posts by clicking plan names
- Track subscriber counts per plan
- Payment history with detailed analytics

---

## 🛠️ Technology Stack

Pat3on is built with modern web technologies and blockchain infrastructure:

**Frontend:**
- Next.js with React
- Clean, dark-themed interface
- Mobile-friendly design

**Backend:**
- Node.js + Express
- MongoDB for user data
- JWT authentication

**Blockchain:**
- Ethereum Sepolia testnet (for now)
- Smart contracts for subscriptions
- Superfluid Protocol for payment streaming
- MockUSDC token (test currency)

**Security:**
- AES-256-GCM encryption for wallet keys
- Secure password hashing
- Environment-based secrets management
