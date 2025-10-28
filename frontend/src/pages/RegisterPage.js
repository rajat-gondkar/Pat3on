import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    role: 'user',
  });
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [walletData, setWalletData] = useState(null);
  const [privateKeySaved, setPrivateKeySaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const { register, login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const response = await register({
        email: formData.email,
        password: formData.password,
        role: formData.role,
      });

      // Show private key screen
      setWalletData(response.data.wallet);
      setShowPrivateKey(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyPrivateKey = () => {
    navigator.clipboard.writeText(walletData.privateKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPrivateKey = () => {
    const element = document.createElement('a');
    const file = new Blob(
      [
        `Pat3on Wallet Private Key\n\n` +
          `Address: ${walletData.address}\n\n` +
          `Private Key: ${walletData.privateKey}\n\n` +
          `Mnemonic: ${walletData.mnemonic}\n\n` +
          `⚠️ KEEP THIS FILE SECURE AND NEVER SHARE IT!\n` +
          `This key gives full access to your wallet.`,
      ],
      { type: 'text/plain' }
    );
    element.href = URL.createObjectURL(file);
    element.download = 'pat3on-wallet-key.txt';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleContinue = async () => {
    if (!privateKeySaved) {
      alert('Please confirm that you have saved your private key!');
      return;
    }

    // Auto-login after registration
    try {
      await login({
        email: formData.email,
        password: formData.password,
      });
      navigate('/dashboard');
    } catch (err) {
      navigate('/login');
    }
  };

  if (showPrivateKey && walletData) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 py-12">
        <div className="max-w-2xl w-full bg-dark-secondary rounded-sm shadow-2xl p-10 border border-dark-border">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="text-5xl mb-4">🔐</div>
            <h2 className="text-3xl font-bold text-white mb-2">
              Your Wallet Has Been Created!
            </h2>
            <p className="text-gray-400">
              Registration successful. Now let's secure your wallet.
            </p>
          </div>

          {/* Warning Box */}
          <div className="bg-red-500/10 border-2 border-red-500/40 rounded-sm p-6 mb-8">
            <h3 className="text-xl font-bold text-red-400 mb-3 flex items-center">
              <span className="text-2xl mr-2">⚠️</span>
              IMPORTANT - READ CAREFULLY
            </h3>
            <p className="text-red-300 mb-2">
              This is the <strong>ONLY TIME</strong> we will show your private key.
            </p>
            <p className="text-red-300">
              If you lose it, we <strong>CANNOT</strong> recover your wallet or funds.
            </p>
          </div>

          {/* Wallet Address */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Your Wallet Address
            </label>
            <div className="bg-dark-primary p-4 rounded-sm border border-dark-border">
              <code className="text-navy-400 text-sm break-all">
                {walletData.address}
              </code>
            </div>
          </div>

          {/* Private Key */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Your Private Key
            </label>
            <div className="bg-dark-primary p-4 rounded-sm border border-dark-border mb-3">
              <code className="text-green-400 text-xs break-all">
                {walletData.privateKey}
              </code>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleCopyPrivateKey}
                className="flex-1 bg-white hover:bg-gray-200 text-white px-4 py-3 rounded-sm transition-all flex items-center justify-center font-semibold shadow-lg"
              >
                {copied ? '✓ Copied!' : '📋 Copy Private Key'}
              </button>
              <button
                onClick={handleDownloadPrivateKey}
                className="flex-1 bg-dark-accent hover:bg-dark-border text-white px-4 py-3 rounded-sm transition-all flex items-center justify-center font-semibold"
              >
                💾 Download as File
              </button>
            </div>
          </div>

          {/* Mnemonic */}
          {walletData.mnemonic && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Recovery Phrase (Mnemonic)
              </label>
              <div className="bg-dark-primary p-4 rounded-sm border border-dark-border">
                <code className="text-yellow-400 text-sm break-all">
                  {walletData.mnemonic}
                </code>
              </div>
            </div>
          )}

          {/* Security Instructions */}
          <div className="bg-dark-primary rounded-sm p-6 mb-8 border border-dark-border">
            <h4 className="text-lg font-semibold text-white mb-4">
              🛡️ Security Instructions
            </h4>
            <ul className="space-y-3 text-gray-300 text-sm">
              <li className="flex items-start">
                <span className="text-green-500 mr-3">✓</span>
                <span>Write it down on paper and store it safely</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-3">✓</span>
                <span>Store it in a password manager (encrypted)</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-3">✓</span>
                <span>Never share it with anyone</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-3">✓</span>
                <span>Keep multiple secure backups</span>
              </li>
              <li className="flex items-start">
                <span className="text-red-500 mr-3">✗</span>
                <span>Don't store it in email or cloud storage</span>
              </li>
            </ul>
          </div>

          {/* Confirmation Checkbox */}
          <div className="mb-8">
            <label className="flex items-start space-x-3 cursor-pointer bg-dark-accent p-4 rounded-sm border border-dark-border hover:border-white transition-colors">
              <input
                type="checkbox"
                checked={privateKeySaved}
                onChange={(e) => setPrivateKeySaved(e.target.checked)}
                className="mt-1 w-5 h-5 text-navy-600 rounded focus:ring-2 focus:ring-navy-500"
              />
              <span className="text-white">
                <strong>I have written down my private key</strong> and understand that I
                will not be able to see it again. I take full responsibility for keeping
                it secure.
              </span>
            </label>
          </div>

          {/* Continue Button */}
          <button
            onClick={handleContinue}
            disabled={!privateKeySaved}
            className={`w-full py-4 rounded-sm font-semibold text-white transition-all shadow-lg ${
              privateKeySaved
                ? 'bg-white hover:bg-gray-200 hover:shadow-navy-600/30'
                : 'bg-gray-600 cursor-not-allowed opacity-50'
            }`}
          >
            {privateKeySaved ? 'Continue to Dashboard →' : 'Please Confirm Above First'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="max-w-md w-full bg-dark-secondary rounded-sm shadow-2xl p-10 border border-dark-border">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">Create Account</h2>
          <p className="text-gray-400">Join Pat3on and start your Web3 journey</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-sm mb-6 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Email Address
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 bg-dark-primary border border-dark-border rounded-sm text-white placeholder-gray-500 focus:outline-none focus:border-white focus:ring-2 focus:ring-navy-500/20 transition-all"
              placeholder="you@example.com"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 bg-dark-primary border border-dark-border rounded-sm text-white placeholder-gray-500 focus:outline-none focus:border-white focus:ring-2 focus:ring-navy-500/20 transition-all"
              placeholder="Minimum 6 characters"
            />
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Confirm Password
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 bg-dark-primary border border-dark-border rounded-sm text-white placeholder-gray-500 focus:outline-none focus:border-white focus:ring-2 focus:ring-navy-500/20 transition-all"
              placeholder="Re-enter your password"
            />
          </div>

          {/* Role Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              I want to be a
            </label>
            <div className="grid grid-cols-2 gap-4">
              <label className="cursor-pointer">
                <input
                  type="radio"
                  name="role"
                  value="user"
                  checked={formData.role === 'user'}
                  onChange={handleChange}
                  className="hidden"
                />
                <div
                  className={`p-4 rounded-sm border-2 text-center transition-all ${
                    formData.role === 'user'
                      ? 'border-white bg-navy-500/20'
                      : 'border-dark-border bg-dark-primary hover:border-dark-accent'
                  }`}
                >
                  <div className="text-2xl mb-2">🎉</div>
                  <div className="text-white font-semibold">Subscriber</div>
                  <div className="text-gray-400 text-xs mt-1">
                    Support creators
                  </div>
                </div>
              </label>

              <label className="cursor-pointer">
                <input
                  type="radio"
                  name="role"
                  value="author"
                  checked={formData.role === 'author'}
                  onChange={handleChange}
                  className="hidden"
                />
                <div
                  className={`p-4 rounded-sm border-2 text-center transition-all ${
                    formData.role === 'author'
                      ? 'border-white bg-navy-500/20'
                      : 'border-dark-border bg-dark-primary hover:border-dark-accent'
                  }`}
                >
                  <div className="text-2xl mb-2">🎨</div>
                  <div className="text-white font-semibold">Creator</div>
                  <div className="text-gray-400 text-xs mt-1">
                    Monetize content
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white hover:bg-gray-200 text-white py-3 rounded-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-navy-600/30"
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-gray-400 mt-6 text-sm">
          Already have an account?{' '}
          <Link to="/login" className="text-white hover:text-gray-300 font-semibold transition-colors">
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
