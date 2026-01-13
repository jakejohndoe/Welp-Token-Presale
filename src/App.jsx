import { useState, useEffect } from 'react'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount, useBalance, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { formatEther, parseEther } from 'viem'
import { motion } from 'framer-motion'
import confetti from 'canvas-confetti'
import { FaTwitter, FaInstagram, FaLinkedin, FaTimes, FaExternalLinkAlt, FaSpinner } from 'react-icons/fa'
import { contracts } from './config/contracts'

function App() {
  const { address, isConnected } = useAccount()
  const [buyAmount, setBuyAmount] = useState('')
  const [sellAmount, setSellAmount] = useState('')
  const [toast, setToast] = useState(null)
  const [successModal, setSuccessModal] = useState(null)
  const [isTransactionPending, setIsTransactionPending] = useState(false)

  const { data: ethBalance } = useBalance({
    address,
    watch: true
  })

  const { data: welpBalance, refetch: refetchWelpBalance } = useReadContract({
    address: contracts.welpToken.address,
    abi: contracts.welpToken.abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    watch: true
  })

  const { data: totalSupply, refetch: refetchSupply } = useReadContract({
    address: contracts.welpToken.address,
    abi: contracts.welpToken.abi,
    functionName: 'totalSupply',
    watch: true
  })

  const { data: buyPrice } = useReadContract({
    address: contracts.welpTokenSale.address,
    abi: contracts.welpTokenSale.abi,
    functionName: 'buyPrice'
  })

  const { data: sellPrice } = useReadContract({
    address: contracts.welpTokenSale.address,
    abi: contracts.welpTokenSale.abi,
    functionName: 'sellPrice'
  })

  const { writeContract: buyTokens, data: buyHash } = useWriteContract()
  const { writeContract: sellTokens, data: sellHash } = useWriteContract()
  const { writeContract: approveTokens, data: approveHash } = useWriteContract()

  const { isLoading: isBuyPending, isSuccess: isBuySuccess } = useWaitForTransactionReceipt({
    hash: buyHash
  })

  const { isLoading: isSellPending, isSuccess: isSellSuccess } = useWaitForTransactionReceipt({
    hash: sellHash
  })

  const { isLoading: isApprovePending, isSuccess: isApproveSuccess } = useWaitForTransactionReceipt({
    hash: approveHash
  })

  useEffect(() => {
    if (isBuySuccess) {
      setIsTransactionPending(false)
      const amount = buyAmount
      showToast('Purchase successful!', 'success')
      setBuyAmount('')
      refetchWelpBalance()
      refetchSupply()

      // Trigger confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      })

      // Show success modal
      setSuccessModal({
        type: 'buy',
        amount: amount,
        hash: buyHash
      })
    }
  }, [isBuySuccess, buyAmount, buyHash])

  useEffect(() => {
    if (isSellSuccess) {
      setIsTransactionPending(false)
      const amount = sellAmount
      showToast('Sale successful!', 'success')
      setSellAmount('')
      refetchWelpBalance()
      refetchSupply()

      // Trigger confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      })

      // Show success modal
      setSuccessModal({
        type: 'sell',
        amount: amount,
        hash: sellHash
      })
    }
  }, [isSellSuccess, sellAmount, sellHash])

  useEffect(() => {
    if (isApproveSuccess && sellAmount) {
      handleSellAfterApproval()
    }
  }, [isApproveSuccess])

  const showToast = (message, type) => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 5000)
  }

  const calculateBuyCost = (amount) => {
    if (!amount || !buyPrice) return '0'
    try {
      const tokens = parseEther(amount)
      const cost = (tokens * buyPrice) / BigInt(10 ** 18)
      return formatEther(cost)
    } catch {
      return '0'
    }
  }

  const calculateSellPayout = (amount) => {
    if (!amount || !sellPrice) return '0'
    try {
      const tokens = parseEther(amount)
      const payout = (tokens * sellPrice) / BigInt(10 ** 18)
      return formatEther(payout)
    } catch {
      return '0'
    }
  }

  const handleBuy = async () => {
    if (!buyAmount || parseFloat(buyAmount) <= 0) {
      showToast('Please enter a valid amount', 'error')
      return
    }

    try {
      const tokens = parseEther(buyAmount)
      const cost = (tokens * buyPrice) / BigInt(10 ** 18)

      setIsTransactionPending(true)
      buyTokens({
        address: contracts.welpTokenSale.address,
        abi: contracts.welpTokenSale.abi,
        functionName: 'buyTokens',
        args: [tokens],
        value: cost
      })

      showToast('Confirming transaction...', 'pending')
    } catch (error) {
      setIsTransactionPending(false)
      showToast('Transaction failed', 'error')
      console.error(error)
    }
  }

  const handleSell = async () => {
    if (!sellAmount || parseFloat(sellAmount) <= 0) {
      showToast('Please enter a valid amount', 'error')
      return
    }

    try {
      const tokens = parseEther(sellAmount)

      setIsTransactionPending(true)
      approveTokens({
        address: contracts.welpToken.address,
        abi: contracts.welpToken.abi,
        functionName: 'approve',
        args: [contracts.welpTokenSale.address, tokens]
      })

      showToast('Approving tokens...', 'pending')
    } catch (error) {
      setIsTransactionPending(false)
      showToast('Transaction failed', 'error')
      console.error(error)
    }
  }

  const handleSellAfterApproval = async () => {
    try {
      const tokens = parseEther(sellAmount)

      sellTokens({
        address: contracts.welpTokenSale.address,
        abi: contracts.welpTokenSale.abi,
        functionName: 'sellTokens',
        args: [tokens]
      })

      showToast('Selling tokens...', 'pending')
    } catch (error) {
      setIsTransactionPending(false)
      showToast('Sale failed', 'error')
      console.error(error)
    }
  }

  const formatBalance = (balance) => {
    if (!balance) return '0'
    const formatted = formatEther(balance)
    return parseFloat(formatted).toLocaleString(undefined, { maximumFractionDigits: 4 })
  }

  const addTokenToWallet = async () => {
    try {
      const wasAdded = await window.ethereum.request({
        method: 'wallet_watchAsset',
        params: {
          type: 'ERC20',
          options: {
            address: contracts.welpToken.address,
            symbol: 'WELP',
            decimals: 18,
            image: `${window.location.origin}/icons/welp-token.png`,
          },
        },
      })

      if (wasAdded) {
        showToast('WELP token added to MetaMask!', 'success')
      }
    } catch (error) {
      showToast('Failed to add token to MetaMask', 'error')
      console.error(error)
    }
  }

  const supplyPercentage = totalSupply ? (Number(formatEther(totalSupply)) / 1000000 * 100).toFixed(2) : '0'

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#4F7FFF] to-[#A855F7]">
      {/* Navbar */}
      <motion.nav
        className="flex items-center justify-between p-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <a href="https://welp.network" target="_blank" rel="noopener noreferrer">
          <img
            src="/icons/welp-logo-adblue.png"
            alt="Welp"
            className="h-8 hover:opacity-80 transition-opacity"
          />
        </a>
        <ConnectButton />
      </motion.nav>

      <div className="container mx-auto px-4 pb-16">
        {/* Hero Section */}
        <motion.div
          className="text-center mb-16 pt-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight">
            Welp Token Presale
          </h1>
          <p className="text-xl md:text-2xl text-white/90 mb-4 font-medium">
            Get WELP tokens at the best price before mainnet launch
          </p>
          <p className="text-lg text-white/80 font-medium">
            Trustworthy, Rewarded Reviews
          </p>
        </motion.div>

        {/* Supply Tracker */}
        <motion.div
          className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 mb-12 border border-white/20 max-w-4xl mx-auto"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <h2 className="text-xl font-semibold text-white mb-3">Supply Tracker</h2>
          <div className="mb-3">
            <div className="flex justify-between text-white/90 mb-2 text-sm">
              <span>{formatBalance(totalSupply)} WELP</span>
              <span>1,000,000 WELP</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-2">
              <div
                className="bg-[#FFC107] h-2 rounded-full transition-all duration-700 ease-out"
                style={{ width: `${supplyPercentage}%` }}
              />
            </div>
          </div>
          <p className="text-white/70 text-sm">
            {supplyPercentage}% of total supply sold
          </p>
        </motion.div>

        {isConnected && (
          <>
            {/* Buy/Sell Cards */}
            <motion.div
              className="grid md:grid-cols-2 gap-8 mb-12 max-w-4xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20 hover:bg-white/15 transition-all duration-300">
                <h3 className="text-2xl font-semibold text-white mb-6">Buy WELP Tokens</h3>
                <div className="space-y-6">
                  <div>
                    <label className="block text-white/70 mb-3 font-medium">Amount (WELP)</label>
                    <input
                      type="number"
                      value={buyAmount}
                      onChange={(e) => setBuyAmount(e.target.value)}
                      placeholder="0"
                      className="w-full px-4 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-[#FFC107] focus:bg-white/15 transition-all text-lg"
                      disabled={isBuyPending || isTransactionPending}
                    />
                  </div>
                  <div className="bg-white/5 rounded-xl p-4">
                    <p className="text-white/70 text-sm mb-1">Cost</p>
                    <p className="text-3xl font-bold text-white">
                      {calculateBuyCost(buyAmount)} ETH
                    </p>
                    <p className="text-white/50 text-xs mt-1">
                      Rate: 0.001 ETH per WELP
                    </p>
                  </div>
                  <button
                    onClick={handleBuy}
                    disabled={!buyAmount || parseFloat(buyAmount) <= 0 || isBuyPending || isTransactionPending}
                    className="w-full py-5 bg-[#FFC107] text-black font-bold rounded-xl hover:bg-[#FFD54F] hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-200 text-lg shadow-lg hover:shadow-xl"
                  >
                    {isBuyPending || isTransactionPending ? 'Processing...' : 'Buy WELP'}
                  </button>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20 hover:bg-white/15 transition-all duration-300">
                <h3 className="text-2xl font-semibold text-white mb-6">Sell WELP Tokens</h3>
                <div className="space-y-6">
                  <div>
                    <label className="block text-white/70 mb-3 font-medium">Amount (WELP)</label>
                    <input
                      type="number"
                      value={sellAmount}
                      onChange={(e) => setSellAmount(e.target.value)}
                      placeholder="0"
                      className="w-full px-4 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-[#FFC107] focus:bg-white/15 transition-all text-lg"
                      disabled={isSellPending || isApprovePending || isTransactionPending}
                    />
                  </div>
                  <div className="bg-white/5 rounded-xl p-4">
                    <p className="text-white/70 text-sm mb-1">You'll receive</p>
                    <p className="text-3xl font-bold text-white">
                      {calculateSellPayout(sellAmount)} ETH
                    </p>
                    <p className="text-white/50 text-xs mt-1">
                      Rate: 0.0005 ETH per WELP
                    </p>
                  </div>
                  <button
                    onClick={handleSell}
                    disabled={!sellAmount || parseFloat(sellAmount) <= 0 || isSellPending || isApprovePending || isTransactionPending}
                    className="w-full py-5 bg-[#FFC107] text-black font-bold rounded-xl hover:bg-[#FFD54F] hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-200 text-lg shadow-lg hover:shadow-xl"
                  >
                    {isApprovePending ? 'Approving...' : isSellPending || isTransactionPending ? 'Processing...' : 'Sell WELP'}
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Your Balances */}
            <motion.div
              className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 mb-12 border border-white/20 max-w-4xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.8 }}
            >
              <h2 className="text-2xl font-semibold text-white mb-6">Your Balances</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white/5 rounded-xl p-6 hover:bg-white/10 transition-all">
                  <p className="text-white/70 mb-2 font-medium">ETH Balance</p>
                  <p className="text-4xl font-bold text-white">
                    {ethBalance ? formatBalance(ethBalance.value) : '0'} ETH
                  </p>
                </div>
                <div className="bg-white/5 rounded-xl p-6 hover:bg-white/10 transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-white/70 font-medium">WELP Balance</p>
                    <button
                      onClick={addTokenToWallet}
                      className="text-xs px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-full text-white/80 hover:text-white transition-all border border-white/20 hover:border-white/40 hover:scale-105"
                      title="Add WELP token to MetaMask"
                    >
                      + Add to Wallet
                    </button>
                  </div>
                  <p className="text-4xl font-bold text-white">
                    {formatBalance(welpBalance)} WELP
                  </p>
                </div>
              </div>
            </motion.div>
          </>
        )}

        {!isConnected && (
          <motion.div
            className="bg-white/10 backdrop-blur-lg rounded-3xl p-12 text-center border border-white/20 max-w-2xl mx-auto"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <h2 className="text-3xl font-semibold text-white mb-4">
              Connect Your Wallet
            </h2>
            <p className="text-white/70 mb-8 text-lg">
              Please connect your wallet to participate in the presale
            </p>
            <div className="flex justify-center">
              <ConnectButton />
            </div>
          </motion.div>
        )}
      </div>

      {/* Footer */}
      <motion.footer
        className="bg-white/5 backdrop-blur-lg border-t border-white/20 py-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 1 }}
      >
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center space-x-6 mb-4 md:mb-0">
              <img
                src="/icons/light-footer-logo.png"
                alt="Welp"
                className="h-6 opacity-80"
                onError={(e) => { e.target.style.display = 'none' }}
              />
              <p className="text-white/60 text-sm">
                © 2026 Welp Network, LLC
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <a
                href="https://twitter.com/welpnetwork"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/60 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full"
              >
                <FaTwitter size={18} />
              </a>
              <a
                href="https://instagram.com/welpnetwork"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/60 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full"
              >
                <FaInstagram size={18} />
              </a>
              <a
                href="https://linkedin.com/company/welpnetwork"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/60 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full"
              >
                <FaLinkedin size={18} />
              </a>
            </div>
          </div>
        </div>
      </motion.footer>

      {/* Toast Notifications */}
      {toast && (
        <motion.div
          className={`fixed bottom-8 right-8 px-6 py-4 rounded-xl backdrop-blur-lg border border-white/20 flex items-center space-x-3 shadow-2xl ${
            toast.type === 'success' ? 'bg-green-500/20 text-green-100' :
            toast.type === 'error' ? 'bg-red-500/20 text-red-100' :
            toast.type === 'pending' ? 'bg-blue-500/20 text-blue-100' :
            'bg-blue-500/20 text-blue-100'
          }`}
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 100 }}
        >
          {toast.type === 'pending' && <FaSpinner className="animate-spin" />}
          <span>{toast.message}</span>
        </motion.div>
      )}

      {/* Success Modal */}
      {successModal && (
        <motion.div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20 text-center max-w-md w-full"
            initial={{ scale: 0.8, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.8, y: 20 }}
          >
            <div className="text-6xl mb-4">✅</div>
            <h3 className="text-2xl font-bold text-white mb-2">Success!</h3>
            <p className="text-white/80 mb-6">
              You {successModal.type === 'buy' ? 'bought' : 'sold'} {successModal.amount} WELP
            </p>
            <div className="flex space-x-3">
              <a
                href={`https://sepolia.etherscan.io/tx/${successModal.hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-3 bg-[#FFC107] text-black font-bold rounded-xl hover:bg-[#FFD54F] transition-all flex items-center justify-center space-x-2"
              >
                <span>View on Etherscan</span>
                <FaExternalLinkAlt />
              </a>
              <button
                onClick={() => setSuccessModal(null)}
                className="px-4 py-3 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-all"
              >
                <FaTimes />
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}

export default App