import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const PaymentHistoryPage = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // all, incoming, outgoing

  useEffect(() => {
    fetchPaymentHistory();
  }, []);

  const fetchPaymentHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/subscriptions/payment-history');
      
      setTransactions(response.data.transactions || []);
      setSummary(response.data.summary || {});
    } catch (err) {
      console.error('Error fetching payment history:', err);
      setError(err.response?.data?.message || 'Failed to load payment history');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getFilteredTransactions = () => {
    if (filter === 'all') return transactions;
    return transactions.filter(t => t.direction === filter);
  };

  const filteredTransactions = getFilteredTransactions();

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-gray-400">Loading payment history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link to="/dashboard" className="text-gray-400 hover:text-white mb-4 inline-block">
            ← Back to Dashboard
          </Link>
          <h1 className="text-4xl font-bold mb-2">Payment History</h1>
          <p className="text-gray-400">Track all your subscription transactions</p>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className={`grid grid-cols-1 gap-6 mb-8 ${user.role === 'author' ? 'md:grid-cols-4' : 'md:grid-cols-2'}`}>
            {user.role === 'author' ? (
              <>
                <div className="bg-dark-secondary rounded-sm border border-dark-border p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm mb-1">Total Spent</p>
                      <p className="text-2xl font-bold text-red-400">
                        ${summary.totalSpent?.toFixed(2) || '0.00'}
                      </p>
                    </div>
                    <div className="text-3xl">💸</div>
                  </div>
                </div>

                <div className="bg-dark-secondary rounded-sm border border-dark-border p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm mb-1">Total Earned</p>
                      <p className="text-2xl font-bold text-green-400">
                        ${summary.totalEarned?.toFixed(2) || '0.00'}
                      </p>
                    </div>
                    <div className="text-3xl">💰</div>
                  </div>
                </div>

                <div className="bg-dark-secondary rounded-sm border border-dark-border p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm mb-1">Net Balance</p>
                      <p className={`text-2xl font-bold ${summary.netBalance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        ${summary.netBalance?.toFixed(2) || '0.00'}
                      </p>
                    </div>
                    <div className="text-3xl">📊</div>
                  </div>
                </div>

                <div className="bg-dark-secondary rounded-sm border border-dark-border p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm mb-1">Transactions</p>
                      <p className="text-2xl font-bold text-white">
                        {summary.transactionCount || 0}
                      </p>
                    </div>
                    <div className="text-3xl">🔢</div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="bg-dark-secondary rounded-sm border border-dark-border p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm mb-1">Total Spent</p>
                      <p className="text-2xl font-bold text-red-400">
                        ${summary.totalSpent?.toFixed(2) || '0.00'}
                      </p>
                    </div>
                    <div className="text-3xl">💸</div>
                  </div>
                </div>

                <div className="bg-dark-secondary rounded-sm border border-dark-border p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm mb-1">Transactions</p>
                      <p className="text-2xl font-bold text-white">
                        {summary.transactionCount || 0}
                      </p>
                    </div>
                    <div className="text-3xl">🔢</div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Filters - Only show for authors */}
        {user.role === 'author' && (
          <div className="mb-6 flex gap-3">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-sm font-semibold transition-all ${
                filter === 'all'
                  ? 'bg-white text-black'
                  : 'bg-dark-secondary border border-dark-border text-white hover:border-white'
              }`}
            >
              All Transactions ({transactions.length})
            </button>
            <button
              onClick={() => setFilter('incoming')}
              className={`px-4 py-2 rounded-sm font-semibold transition-all ${
                filter === 'incoming'
                  ? 'bg-white text-black'
                  : 'bg-dark-secondary border border-dark-border text-white hover:border-white'
              }`}
            >
              Income ({transactions.filter(t => t.direction === 'incoming').length})
            </button>
            <button
              onClick={() => setFilter('outgoing')}
              className={`px-4 py-2 rounded-sm font-semibold transition-all ${
                filter === 'outgoing'
                  ? 'bg-white text-black'
                  : 'bg-dark-secondary border border-dark-border text-white hover:border-white'
              }`}
            >
              Expenses ({transactions.filter(t => t.direction === 'outgoing').length})
            </button>
          </div>
        )}

        {error && (
          <div className="bg-red-900/20 border border-red-500 text-red-200 px-4 py-3 rounded-sm mb-6">
            {error}
          </div>
        )}

        {/* Transactions List */}
        {filteredTransactions.length === 0 ? (
          <div className="bg-dark-secondary rounded-sm border border-dark-border p-12 text-center">
            <div className="text-6xl mb-4">📭</div>
            <h3 className="text-xl font-semibold mb-2">No Transactions Yet</h3>
            <p className="text-gray-400 mb-6">
              {filter === 'all' 
                ? "Your payment transactions will appear here once you subscribe to a creator or receive payments."
                : filter === 'incoming'
                ? "You haven't received any payments yet."
                : "You haven't made any payments yet."}
            </p>
            <Link
              to="/browse"
              className="inline-block bg-white text-black px-6 py-2 rounded-sm font-semibold hover:bg-gray-200 transition-colors"
            >
              Browse Creators
            </Link>
          </div>
        ) : (
          <div className="bg-dark-secondary rounded-sm border border-dark-border overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-dark-primary border-b border-dark-border font-semibold text-sm">
              <div className="col-span-1">Type</div>
              <div className="col-span-3">Description</div>
              <div className="col-span-2">Date</div>
              <div className="col-span-2">Amount</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-2">Transaction</div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-dark-border">
              {filteredTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-dark-primary transition-colors"
                >
                  {/* Type Icon */}
                  <div className="col-span-1 flex items-center">
                    <span className="text-2xl" title={transaction.direction}>
                      {transaction.direction === 'incoming' ? '📥' : '📤'}
                    </span>
                  </div>

                  {/* Description */}
                  <div className="col-span-3 flex items-center">
                    <div>
                      <p className="font-semibold text-white">
                        {transaction.description}
                      </p>
                      {transaction.plan && (
                        <p className="text-sm text-gray-400">
                          Plan: {transaction.plan}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Date */}
                  <div className="col-span-2 flex items-center">
                    <p className="text-white">{formatDate(transaction.date)}</p>
                  </div>

                  {/* Amount */}
                  <div className="col-span-2 flex items-center">
                    <div>
                      <p className={`font-bold text-lg ${
                        transaction.direction === 'incoming' ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {transaction.direction === 'incoming' ? '+' : '-'}${transaction.amount.toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-400">{transaction.currency}</p>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="col-span-2 flex items-center">
                    <span className={`px-3 py-1 rounded-sm text-xs font-semibold ${
                      transaction.status === 'active'
                        ? 'bg-green-900/30 border border-green-500 text-green-200'
                        : transaction.status === 'cancelled'
                        ? 'bg-red-900/30 border border-red-500 text-red-200'
                        : 'bg-gray-700/30 border border-gray-500 text-gray-300'
                    }`}>
                      {transaction.status}
                    </span>
                  </div>

                  {/* Transaction Hash */}
                  <div className="col-span-2 flex items-center">
                    {transaction.transactionHash ? (
                      <a
                        href={`https://sepolia.etherscan.io/tx/${transaction.transactionHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1"
                      >
                        <span className="truncate max-w-[100px]">
                          {transaction.transactionHash.substring(0, 6)}...
                          {transaction.transactionHash.substring(transaction.transactionHash.length - 4)}
                        </span>
                        <span>↗</span>
                      </a>
                    ) : (
                      <span className="text-gray-500 text-sm">N/A</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer Info */}
        {filteredTransactions.length > 0 && (
          <div className="mt-6 text-center text-sm text-gray-400">
            Showing {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentHistoryPage;
