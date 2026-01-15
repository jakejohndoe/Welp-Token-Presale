import { useState, useEffect, useCallback } from 'react'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount, useBalance, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { writeContract, waitForTransactionReceipt } from '@wagmi/core'
import { formatEther, parseEther } from 'viem'
import { motion } from 'framer-motion'
import confetti from 'canvas-confetti'
import CountUp from 'react-countup'
import { FaTwitter, FaInstagram, FaLinkedin, FaTimes, FaExternalLinkAlt, FaSpinner } from 'react-icons/fa'
import { contracts } from './config/contracts'
import { config } from './config/wagmi'
import AnimatedBackground from './components/AnimatedBackground'

function App() {
  const { address, isConnected } = useAccount()
  const [buyAmount, setBuyAmount] = useState('')
  const [sellAmount, setSellAmount] = useState('')
  const [toast, setToast] = useState(null)
  const [successModal, setSuccessModal] = useState(null)
  const [isTransactionPending, setIsTransactionPending] = useState(false)
  const [pendingBuyAmount, setPendingBuyAmount] = useState('')
  const [pendingSellAmount, setPendingSellAmount] = useState('')
  const [transactionTimeoutId, setTransactionTimeoutId] = useState(null)
  const [manualSoldCount, setManualSoldCount] = useState(240) // Start with current known value

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
    watch: true,
    pollingInterval: 5000 // Poll every 5 seconds for updates
  })

  // Removed presale balance reading - using manual tracking instead

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

  const { isLoading: isBuyPending, isSuccess: isBuySuccess, isError: isBuyError, error: buyError } = useWaitForTransactionReceipt({
    hash: buyHash
  })

  const { isLoading: isSellPending, isSuccess: isSellSuccess, isError: isSellError, error: sellError } = useWaitForTransactionReceipt({
    hash: sellHash
  })

  const { isLoading: isApprovePending, isSuccess: isApproveSuccess, isError: isApproveError, error: approveError } = useWaitForTransactionReceipt({
    hash: approveHash
  })

  const showToast = (message, type) => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 5000)
  }


  useEffect(() => {
    if (isBuySuccess && buyHash) {
      console.log('BUY SUCCESS DETECTED:', new Date().toLocaleTimeString(), 'Hash:', buyHash)

      // Clear timeout
      if (transactionTimeoutId) {
        clearTimeout(transactionTimeoutId)
        setTransactionTimeoutId(null)
      }

      setIsTransactionPending(false)
      showToast('Purchase successful!', 'success')

      // Update manual sold count
      const boughtAmount = parseFloat(pendingBuyAmount)
      setManualSoldCount(prev => prev + boughtAmount)
      console.log(`Manual sold count updated: +${boughtAmount} tokens`)

      setBuyAmount('')
      refetchWelpBalance()

      // Refetch supply immediately and again after a delay (manual tracking handles sold count)
      refetchSupply()
      setTimeout(() => {
        refetchSupply()
        console.log('Supply refetched after buy transaction')
      }, 2000)

      // Trigger confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      })

      // Show success modal
      setSuccessModal({
        type: 'buy',
        amount: pendingBuyAmount,
        hash: buyHash
      })
    }
  }, [isBuySuccess, buyHash, pendingBuyAmount, refetchWelpBalance, refetchSupply, transactionTimeoutId])

  useEffect(() => {
    if (isSellSuccess && sellHash) {
      console.log('SELL SUCCESS DETECTED:', new Date().toLocaleTimeString(), 'Hash:', sellHash)

      // Clear timeout
      if (transactionTimeoutId) {
        clearTimeout(transactionTimeoutId)
        setTransactionTimeoutId(null)
      }

      setIsTransactionPending(false)
      showToast('Sale successful!', 'success')

      // Update manual sold count (subtract for sell)
      const soldAmount = parseFloat(pendingSellAmount)
      setManualSoldCount(prev => prev - soldAmount)
      console.log(`Manual sold count updated: -${soldAmount} tokens`)

      // RESET BUTTON STATE - Clear all pending amounts and inputs
      setSellAmount('')
      setPendingSellAmount('')
      refetchWelpBalance()

      // Refetch supply immediately and again after a delay (manual tracking handles sold count)
      refetchSupply()
      setTimeout(() => {
        refetchSupply()
        console.log('Supply refetched after sell transaction')
      }, 2000)

      // Trigger confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      })

      // Show success modal
      setSuccessModal({
        type: 'sell',
        amount: pendingSellAmount,
        hash: sellHash
      })
    }
  }, [isSellSuccess, sellHash, pendingSellAmount, refetchWelpBalance, refetchSupply, transactionTimeoutId])


  // Handle buy transaction errors
  useEffect(() => {
    if (isBuyError && buyError) {
      // Clear timeout
      if (transactionTimeoutId) {
        clearTimeout(transactionTimeoutId)
        setTransactionTimeoutId(null)
      }

      setIsTransactionPending(false)
      console.error('Buy transaction error:', buyError)
      showToast(`Buy transaction failed: ${buyError.message || 'Unknown error'}`, 'error')
    }
  }, [isBuyError, buyError, transactionTimeoutId])

  // Handle sell transaction errors
  useEffect(() => {
    if (isSellError && sellError) {
      // Clear timeout
      if (transactionTimeoutId) {
        clearTimeout(transactionTimeoutId)
        setTransactionTimeoutId(null)
      }

      setIsTransactionPending(false)
      console.error('Sell transaction error:', sellError)
      showToast(`Sell transaction failed: ${sellError.message || 'Unknown error'}`, 'error')
    }
  }, [isSellError, sellError, transactionTimeoutId])

  // Handle approve transaction errors
  useEffect(() => {
    if (isApproveError && approveError) {
      // Clear timeout
      if (transactionTimeoutId) {
        clearTimeout(transactionTimeoutId)
        setTransactionTimeoutId(null)
      }

      setIsTransactionPending(false)
      console.error('Approve transaction error:', approveError)
      showToast(`Approval failed: ${approveError.message || 'Unknown error'}`, 'error')
    }
  }, [isApproveError, approveError, transactionTimeoutId])

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
    // FORCE CLOSE AND CLEAR
    setSuccessModal(null)

    // Wait for React to process state updates
    await new Promise(resolve => setTimeout(resolve, 200))

    if (!buyAmount || parseFloat(buyAmount) <= 0) {
      showToast('Please enter a valid amount', 'error')
      return
    }

    // ALWAYS start with clean pending state immediately
    setPendingBuyAmount(buyAmount)
    setIsTransactionPending(true)
    showToast('Waiting for wallet confirmation...', 'pending')

    // Clear any existing timeout
    if (transactionTimeoutId) {
      clearTimeout(transactionTimeoutId)
      setTransactionTimeoutId(null)
    }

    // Safety timeout - force close after 60 seconds
    const timeoutId = setTimeout(() => {
      if (isTransactionPending) {
        console.log('Transaction timeout triggered')
        setIsTransactionPending(false)
        showToast('Transaction timed out', 'error')
      }
    }, 60000)
    setTransactionTimeoutId(timeoutId)

    try {
      const tokens = parseEther(buyAmount)
      const cost = (tokens * buyPrice) / BigInt(10 ** 18)

      console.log('START BUY:', new Date().toLocaleTimeString())
      console.log('Calling writeContract...')

      // Use direct writeContract function that returns hash immediately
      const hash = await writeContract(config, {
        address: contracts.welpTokenSale.address,
        abi: contracts.welpTokenSale.abi,
        functionName: 'buyTokens',
        args: [tokens],
        value: cost
      })

      console.log('Buy transaction sent:', new Date().toLocaleTimeString(), 'Hash:', hash)
      showToast('Transaction sent! Waiting for confirmation...', 'pending')

      console.log('Waiting for receipt...')

      // Wait for confirmation directly
      const receipt = await waitForTransactionReceipt(config, {
        hash: hash,
        confirmations: 1
      })

      console.log('BUY RECEIPT RECEIVED:', new Date().toLocaleTimeString(), receipt)

      // Clear timeout
      clearTimeout(timeoutId)
      setTransactionTimeoutId(null)

      // Immediately show success
      setIsTransactionPending(false)
      showToast('Purchase successful!', 'success')

      // Update manual sold count
      const boughtAmount = parseFloat(buyAmount)
      setManualSoldCount(prev => prev + boughtAmount)
      console.log(`Manual sold count updated: +${boughtAmount} tokens`)

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
        amount: buyAmount,
        hash: hash
      })

    } catch (error) {
      console.error('Transaction error:', error)
      clearTimeout(timeoutId)
      setTransactionTimeoutId(null)
      setIsTransactionPending(false)

      // Check error message for cancellation
      const errorMsg = error?.message?.toLowerCase() || ''

      if (errorMsg.includes('user rejected') ||
          errorMsg.includes('user denied') ||
          errorMsg.includes('user cancelled') ||
          errorMsg.includes('rejected') ||
          error?.code === 'ACTION_REJECTED' ||
          error?.name === 'UserRejectedRequestError') {
        showToast('Transaction cancelled by user', 'error')
      } else {
        showToast(`Transaction failed: ${error?.shortMessage || error?.message || 'Unknown error'}`, 'error')
      }
    }
  }

  const handleSell = async () => {
    // FORCE CLOSE AND CLEAR
    setSuccessModal(null)

    // Wait for React to process state updates
    await new Promise(resolve => setTimeout(resolve, 200))

    if (!sellAmount || parseFloat(sellAmount) <= 0) {
      showToast('Please enter a valid amount', 'error')
      return
    }

    // ALWAYS start with clean pending state immediately - SAME AS BUY
    setPendingSellAmount(sellAmount)
    setIsTransactionPending(true)
    showToast('Waiting for wallet approval...', 'pending')

    // Clear any existing timeout
    if (transactionTimeoutId) {
      clearTimeout(transactionTimeoutId)
      setTransactionTimeoutId(null)
    }

    // Safety timeout - force close after 60 seconds - SAME AS BUY
    const timeoutId = setTimeout(() => {
      if (isTransactionPending) {
        console.log('Transaction timeout triggered')
        setIsTransactionPending(false)
        showToast('Transaction timed out', 'error')
      }
    }, 60000)
    setTransactionTimeoutId(timeoutId)

    try {
      const tokens = parseEther(sellAmount)

      console.log('START SELL:', new Date().toLocaleTimeString())
      console.log('Calling approval writeContract...')

      // APPROVAL TRANSACTION - Use direct writeContract function
      const approveHash = await writeContract(config, {
        address: contracts.welpToken.address,
        abi: contracts.welpToken.abi,
        functionName: 'approve',
        args: [contracts.welpTokenSale.address, tokens]
      })

      console.log('Approval transaction sent:', new Date().toLocaleTimeString(), 'Hash:', approveHash)
      showToast('Approval sent! Waiting for confirmation...', 'pending')

      // Wait for approval confirmation
      await waitForTransactionReceipt(config, {
        hash: approveHash,
        confirmations: 1
      })

      console.log('Approval confirmed:', new Date().toLocaleTimeString())
      showToast('Approval successful! Sending sell transaction...', 'pending')

      console.log('Calling sell writeContract...')

      // SELL TRANSACTION - Use direct writeContract function
      const sellHash = await writeContract(config, {
        address: contracts.welpTokenSale.address,
        abi: contracts.welpTokenSale.abi,
        functionName: 'sellTokens',
        args: [tokens]
      })

      console.log('Sell transaction sent:', new Date().toLocaleTimeString(), 'Hash:', sellHash)
      showToast('Transaction sent! Waiting for confirmation...', 'pending')

      console.log('Waiting for sell receipt...')

      // Wait for sell confirmation
      const receipt = await waitForTransactionReceipt(config, {
        hash: sellHash,
        confirmations: 1
      })

      console.log('SELL RECEIPT RECEIVED:', new Date().toLocaleTimeString(), receipt)

      // Clear timeout
      clearTimeout(timeoutId)
      setTransactionTimeoutId(null)

      // Immediately show success
      setIsTransactionPending(false)
      showToast('Sale successful!', 'success')

      // Update manual sold count (subtract for sell)
      const soldAmount = parseFloat(sellAmount)
      setManualSoldCount(prev => prev - soldAmount)
      console.log(`Manual sold count updated: -${soldAmount} tokens`)

      setSellAmount('')
      setPendingSellAmount('')
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
        amount: sellAmount,
        hash: sellHash
      })

    } catch (error) {
      console.error('Transaction error:', error)
      clearTimeout(timeoutId)
      setTransactionTimeoutId(null)
      setIsTransactionPending(false)

      // Check error message for cancellation - SAME AS BUY
      const errorMsg = error?.message?.toLowerCase() || ''

      if (errorMsg.includes('user rejected') ||
          errorMsg.includes('user denied') ||
          errorMsg.includes('user cancelled') ||
          errorMsg.includes('rejected') ||
          error?.code === 'ACTION_REJECTED' ||
          error?.name === 'UserRejectedRequestError') {
        showToast('Transaction cancelled by user', 'error')
      } else {
        showToast(`Transaction failed: ${error?.shortMessage || error?.message || 'Unknown error'}`, 'error')
      }
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

  // Manual tracking of sold tokens (more reliable than contract calculations)
  const TOTAL_PRESALE_SUPPLY = 1000000 // 1 million WELP tokens for presale
  const supplyPercentage = manualSoldCount ? (manualSoldCount / TOTAL_PRESALE_SUPPLY * 100).toFixed(2) : '0'

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-[#4F7FFF] to-[#A855F7]">
      <AnimatedBackground />

      {/* Navbar */}
      <motion.nav
        className="flex items-center justify-between pl-2 pr-8 py-1"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <a href="https://welp.network" target="_blank" rel="noopener noreferrer">
          <img
            src="/icons/light-footer-logo.png"
            alt="Welp"
            className="h-52 hover:opacity-80 transition-opacity"
          />
        </a>
        <div className="ml-auto">
          {/* Wallet button will be positioned absolutely outside navbar */}
        </div>
      </motion.nav>

      {/* Absolutely positioned top-right elements */}
      <div className="absolute top-4 right-6 z-50">
        <ConnectButton />
      </div>

      {isConnected && (
        <motion.div
          className="absolute top-16 right-6 bg-white/15 backdrop-blur-md rounded-2xl p-3 border border-white/30 shadow-lg z-40 w-auto min-w-[265px]"
          initial={{ opacity: 0, x: 100, y: -20 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <h3 className="text-sm font-nunito font-semibold text-white/70 mb-2 text-center">Your Balances</h3>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div className="bg-white/5 rounded-lg p-2 text-center">
              <p className="text-white/60 text-xs mb-1 font-nunito">ETH</p>
              <p className="text-sm font-bold text-white font-nunito">
                <CountUp
                  end={ethBalance ? parseFloat(formatBalance(ethBalance.value)) : 0}
                  decimals={3}
                  duration={1}
                  preserveValue={true}
                />
              </p>
            </div>
            <div className="bg-white/5 rounded-lg p-2 text-center">
              <p className="text-white/60 text-xs mb-1 font-nunito">WELP</p>
              <p className="text-sm font-bold text-white font-nunito">
                <CountUp
                  end={parseFloat(formatBalance(welpBalance))}
                  decimals={0}
                  duration={1}
                  preserveValue={true}
                />
              </p>
            </div>
          </div>
          <motion.button
            onClick={addTokenToWallet}
            className="w-full text-xs py-1.5 bg-welp-yellow text-welp-text font-nunito font-semibold rounded-full shadow-lg shadow-yellow-400/50"
            animate={{
              boxShadow: [
                "0 10px 30px -5px rgba(255, 215, 0, 0.5)",
                "0 10px 40px -5px rgba(255, 215, 0, 0.8)",
                "0 10px 30px -5px rgba(255, 215, 0, 0.5)"
              ]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            whileHover={{
              scale: 1.02,
              boxShadow: "0 10px 40px -10px rgba(255, 215, 0, 0.4)",
              transition: { duration: 0.2 }
            }}
            whileTap={{ scale: 0.98 }}
            title="Add WELP token to MetaMask"
          >
            + Add WELP to Wallet
          </motion.button>
        </motion.div>
      )}

      <div className="container mx-auto px-4 pb-8">
        {/* Hero Section */}
        <motion.div
          className="text-center mb-3 -mt-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <h1 className="text-5xl md:text-7xl font-fredoka font-bold text-white mb-1 tracking-tight leading-tight">
            WELP Token Presale
          </h1>
          <p className="text-xl md:text-2xl font-nunito text-white/90 mb-1 font-medium">
            Get free Sepolia ETH from the faucet and try the WELP token presale
          </p>
        </motion.div>

        {/* Sepolia Faucet Link */}
        <motion.div
          className="text-center mb-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <motion.a
            href="https://faucet.metana.io/#"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-3 px-8 py-4 bg-welp-yellow text-welp-text font-nunito font-semibold rounded-full shadow-lg"
            whileHover={{
              scale: 1.02,
              boxShadow: "0 10px 40px -10px rgba(255, 215, 0, 0.4)"
            }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.2 }}
          >
            <span>Need Sepolia ETH? → Get Free Testnet Tokens</span>
            <FaExternalLinkAlt />
          </motion.a>
        </motion.div>

        {/* Supply Tracker */}
        <motion.div
          className="bg-white/15 backdrop-blur-md rounded-3xl p-3 mb-3 border border-white/30 shadow-lg max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h2 className="text-lg font-fredoka font-bold text-white mb-2">Supply Tracker</h2>
          <div className="mb-2">
            <div className="flex justify-between text-white/90 mb-1 text-sm">
              <span>{manualSoldCount.toLocaleString()} WELP</span>
              <span>{TOTAL_PRESALE_SUPPLY.toLocaleString()} WELP</span>
            </div>
            <div className="relative overflow-hidden">
              <div className="h-2 bg-white/30 rounded-full">
                <div
                  className="h-full bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full relative overflow-hidden transition-all duration-700 ease-out"
                  style={{ width: `${supplyPercentage}%` }}
                >
                  {/* Shimmer effect */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                    animate={{
                      x: ['-100%', '200%']
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "linear"
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
          <p className="text-white/70 text-xs">
            {supplyPercentage}% of total supply sold
          </p>
        </motion.div>

        {isConnected && (
          <>
            {/* Buy/Sell Cards */}
            <motion.div
              className="grid md:grid-cols-2 gap-6 mb-3 max-w-4xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <motion.div
                className="bg-white/15 backdrop-blur-md rounded-3xl p-6 border border-white/30 shadow-lg"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <h3 className="text-2xl font-fredoka font-bold text-white mb-4">Buy WELP Tokens</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-white/70 mb-3 font-nunito font-semibold">Amount (WELP)</label>
                    <input
                      type="number"
                      value={buyAmount}
                      onChange={(e) => setBuyAmount(e.target.value)}
                      placeholder="0"
                      className="w-full px-4 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-welp-yellow focus:bg-white/15 transition-all text-lg font-nunito"
                      disabled={isBuyPending || isTransactionPending}
                    />
                  </div>
                  <div className="bg-white/5 rounded-xl p-4">
                    <p className="text-white/70 text-sm mb-1 font-nunito font-semibold">Cost</p>
                    <p className="text-3xl font-bold text-white font-nunito">
                      {calculateBuyCost(buyAmount)} ETH
                    </p>
                    <p className="text-white/50 text-xs mt-1 font-nunito">
                      Rate: 0.001 ETH per WELP
                    </p>
                  </div>
                  <motion.button
                    onClick={handleBuy}
                    disabled={!buyAmount || parseFloat(buyAmount) <= 0 || isBuyPending || isTransactionPending}
                    whileHover={{ scale: 1.05, boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)" }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ duration: 0.3 }}
                    className="w-full py-4 bg-welp-yellow text-welp-text font-nunito font-semibold rounded-full disabled:opacity-50 disabled:cursor-not-allowed text-lg shadow-lg "
                  >
                    {isBuyPending || isTransactionPending ? 'Processing...' : 'Buy WELP'}
                  </motion.button>
                </div>
              </motion.div>

              <motion.div
                className="bg-white/15 backdrop-blur-md rounded-3xl p-6 border border-white/30 shadow-lg"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <h3 className="text-2xl font-fredoka font-bold text-white mb-4">Sell WELP Tokens</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-white/70 mb-3 font-nunito font-semibold">Amount (WELP)</label>
                    <input
                      type="number"
                      value={sellAmount}
                      onChange={(e) => setSellAmount(e.target.value)}
                      placeholder="0"
                      className="w-full px-4 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-welp-yellow focus:bg-white/15 transition-all text-lg font-nunito"
                      disabled={isSellPending || isApprovePending || isTransactionPending}
                    />
                  </div>
                  <div className="bg-white/5 rounded-xl p-4">
                    <p className="text-white/70 text-sm mb-1 font-nunito font-semibold">You'll receive</p>
                    <p className="text-3xl font-bold text-white font-nunito">
                      {calculateSellPayout(sellAmount)} ETH
                    </p>
                    <p className="text-white/50 text-xs mt-1 font-nunito">
                      Rate: 0.0005 ETH per WELP
                    </p>
                  </div>
                  <motion.button
                    onClick={handleSell}
                    disabled={!sellAmount || parseFloat(sellAmount) <= 0 || isSellPending || isApprovePending || isTransactionPending}
                    whileHover={{ scale: 1.05, boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)" }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ duration: 0.3 }}
                    className="w-full py-4 bg-welp-yellow text-welp-text font-nunito font-semibold rounded-full disabled:opacity-50 disabled:cursor-not-allowed text-lg shadow-lg "
                  >
                    {isApprovePending ? 'Approving...' : isSellPending || isTransactionPending ? 'Processing...' : 'Sell WELP'}
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>

          </>
        )}

        {!isConnected && (
          <motion.div
            className="bg-white/10 backdrop-blur-sm rounded-3xl p-12 text-center border border-white/30 shadow-lg max-w-2xl mx-auto transition-all duration-300 hover:shadow-2xl hover:shadow-yellow-400/20 hover:-translate-y-1"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            whileHover={{
              scale: 1.02,
              boxShadow: "0 20px 60px -10px rgba(255, 215, 0, 0.3)"
            }}
          >
            <h2 className="text-3xl font-fredoka font-bold text-white mb-4">
              Connect Your Wallet
            </h2>
            <p className="text-white/70 mb-8 text-lg font-nunito">
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
          <div className="flex items-center justify-between">
            <img
              src="/icons/light-footer-logo.png"
              alt="Welp"
              className="h-16 opacity-80"
              onError={(e) => { e.target.style.display = 'none' }}
            />
            <p className="text-white/60 text-sm font-nunito">
              © 2026 Welp Network, LLC
            </p>
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
          className={`fixed bottom-8 right-8 px-6 py-4 rounded-xl backdrop-blur-lg border border-white/20 flex items-center space-x-3 shadow-2xl ${toast.type === 'success' ? 'bg-green-500/20 text-green-100' :
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

      {/* Transaction Loading Modal */}
      {isTransactionPending && (
        <motion.div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
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
            <div className="text-6xl mb-4">
              <FaSpinner className="animate-spin mx-auto text-welp-yellow" />
            </div>
            <h3 className="text-2xl font-fredoka font-bold text-white mb-2">Transaction Processing</h3>
            <p className="text-white/80 mb-4 font-nunito">
              Please wait while your transaction is being processed...
            </p>
            <p className="text-white/60 text-sm mb-6 font-nunito">
              You can cancel this transaction at any time
            </p>

            {/* Always visible cancel button */}
            <motion.button
              onClick={() => {
                // Clear timeout
                if (transactionTimeoutId) {
                  clearTimeout(transactionTimeoutId)
                  setTransactionTimeoutId(null)
                }
                // Clear transaction state
                setIsTransactionPending(false)
                setPendingBuyAmount('')
                setPendingSellAmount('')
                showToast('Transaction cancelled by user', 'error')
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-full font-nunito font-medium border border-white/20 hover:border-white/30 transition-all duration-200"
            >
              Cancel Transaction
            </motion.button>
          </motion.div>
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
            <h3 className="text-2xl font-fredoka font-bold text-white mb-2">Success!</h3>
            <p className="text-white/80 mb-6 font-nunito">
              You {successModal.type === 'buy' ? 'bought' : 'sold'} {successModal.amount} WELP
            </p>
            <div className="flex space-x-3">
              <a
                href={`https://sepolia.etherscan.io/tx/${successModal.hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-3 bg-welp-yellow text-welp-text font-nunito font-semibold rounded-full hover:bg-[#FFD54F] transition-all duration-300 ease-out flex items-center justify-center space-x-2"
              >
                <span>View on Etherscan</span>
                <FaExternalLinkAlt />
              </a>
              <motion.button
                onClick={() => setSuccessModal(null)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="px-4 py-3 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-all"
              >
                <FaTimes />
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}

export default App