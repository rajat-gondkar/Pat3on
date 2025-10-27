const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false // Don't return password by default
  },
  role: {
    type: String,
    enum: ['user', 'author'],
    required: [true, 'Role is required'],
    default: 'user'
  },
  
  // External wallet (optional - user's own wallet)
  walletAddress: {
    type: String,
    default: null,
    lowercase: true,
    sparse: true,
    unique: true,
    match: [/^0x[a-fA-F0-9]{40}$/, 'Please provide a valid Ethereum address']
  },
  isWalletLinked: {
    type: Boolean,
    default: false
  },
  
  // Custodial wallet (platform-managed)
  custodialWallet: {
    address: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
    },
    encryptedPrivateKey: {
      encrypted: String,
      iv: String,
      authTag: String,
    },
    createdAt: Date,
    fundedAt: Date,
    initialFundingTxHash: String,
  },
  hasCustodialWallet: {
    type: Boolean,
    default: false,
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error(error);
  }
};

// Method to get public profile (exclude password)
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  return user;
};

module.exports = mongoose.model('User', userSchema);
