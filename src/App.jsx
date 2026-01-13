import { useState, useEffect } from 'react'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount, useBalance, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { formatEther, parseEther } from 'viem'
import { contracts } from './config/contracts'

function App() {
  const { address, isConnected } = useAccount()
  const [buyAmount, setBuyAmount] = useState('')
  const [sellAmount, setSellAmount] = useState('')
  const [toast, setToast] = useState(null)

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
      showToast('Purchase successful!', 'success')
      setBuyAmount('')
      refetchWelpBalance()
      refetchSupply()
    }
  }, [isBuySuccess])

  useEffect(() => {
    if (isSellSuccess) {
      showToast('Sale successful!', 'success')
      setSellAmount('')
      refetchWelpBalance()
      refetchSupply()
    }
  }, [isSellSuccess])

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

      buyTokens({
        address: contracts.welpTokenSale.address,
        abi: contracts.welpTokenSale.abi,
        functionName: 'buyTokens',
        args: [tokens],
        value: cost
      })

      showToast('Transaction submitted...', 'info')
    } catch (error) {
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

      approveTokens({
        address: contracts.welpToken.address,
        abi: contracts.welpToken.abi,
        functionName: 'approve',
        args: [contracts.welpTokenSale.address, tokens]
      })

      showToast('Approving tokens...', 'info')
    } catch (error) {
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

      showToast('Selling tokens...', 'info')
    } catch (error) {
      showToast('Sale failed', 'error')
      console.error(error)
    }
  }

  const formatBalance = (balance) => {
    if (!balance) return '0'
    const formatted = formatEther(balance)
    return parseFloat(formatted).toLocaleString(undefined, { maximumFractionDigits: 4 })
  }

  const supplyPercentage = totalSupply ? (Number(formatEther(totalSupply)) / 1000000 * 100).toFixed(2) : '0'

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#4F7FFF] to-[#A855F7] flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="flex justify-end mb-8">
          <ConnectButton />
        </div>

        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
            Welp Token Presale
          </h1>
          <p className="text-xl text-white/90">
            Get WELP tokens at the best price before mainnet launch
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 mb-8 border border-white/20">
          <h2 className="text-2xl font-semibold text-white mb-4">Supply Tracker</h2>
          <div className="mb-4">
            <div className="flex justify-between text-white/90 mb-2">
              <span>{formatBalance(totalSupply)} WELP</span>
              <span>1,000,000 WELP</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-3">
              <div
                className="bg-[#FFC107] h-3 rounded-full transition-all duration-500"
                style={{ width: `${supplyPercentage}%` }}
              />
            </div>
          </div>
          <p className="text-white/70 text-sm">
            {supplyPercentage}% of total supply sold
          </p>
        </div>

        {isConnected && (
          <>
            <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 mb-8 border border-white/20">
              <h2 className="text-2xl font-semibold text-white mb-6">Your Balances</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white/5 rounded-xl p-6">
                  <p className="text-white/70 mb-2">ETH Balance</p>
                  <p className="text-3xl font-bold text-white">
                    {ethBalance ? formatBalance(ethBalance.value) : '0'} ETH
                  </p>
                </div>
                <div className="bg-white/5 rounded-xl p-6">
                  <p className="text-white/70 mb-2">WELP Balance</p>
                  <p className="text-3xl font-bold text-white">
                    {formatBalance(welpBalance)} WELP
                  </p>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20">
                <h3 className="text-xl font-semibold text-white mb-6">Buy WELP Tokens</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-white/70 mb-2">Amount (WELP)</label>
                    <input
                      type="number"
                      value={buyAmount}
                      onChange={(e) => setBuyAmount(e.target.value)}
                      placeholder="0"
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-[#FFC107]"
                      disabled={isBuyPending}
                    />
                  </div>
                  <div className="bg-white/5 rounded-xl p-4">
                    <p className="text-white/70 text-sm mb-1">Cost</p>
                    <p className="text-2xl font-bold text-white">
                      {calculateBuyCost(buyAmount)} ETH
                    </p>
                    <p className="text-white/50 text-xs mt-1">
                      Rate: 0.001 ETH per WELP
                    </p>
                  </div>
                  <button
                    onClick={handleBuy}
                    disabled={!buyAmount || parseFloat(buyAmount) <= 0 || isBuyPending}
                    className="w-full py-4 bg-[#FFC107] text-black font-bold rounded-xl hover:bg-[#FFD54F] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {isBuyPending ? 'Buying...' : 'Buy WELP'}
                  </button>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20">
                <h3 className="text-xl font-semibold text-white mb-6">Sell WELP Tokens</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-white/70 mb-2">Amount (WELP)</label>
                    <input
                      type="number"
                      value={sellAmount}
                      onChange={(e) => setSellAmount(e.target.value)}
                      placeholder="0"
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-[#FFC107]"
                      disabled={isSellPending || isApprovePending}
                    />
                  </div>
                  <div className="bg-white/5 rounded-xl p-4">
                    <p className="text-white/70 text-sm mb-1">You'll receive</p>
                    <p className="text-2xl font-bold text-white">
                      {calculateSellPayout(sellAmount)} ETH
                    </p>
                    <p className="text-white/50 text-xs mt-1">
                      Rate: 0.0005 ETH per WELP
                    </p>
                  </div>
                  <button
                    onClick={handleSell}
                    disabled={!sellAmount || parseFloat(sellAmount) <= 0 || isSellPending || isApprovePending}
                    className="w-full py-4 bg-[#FFC107] text-black font-bold rounded-xl hover:bg-[#FFD54F] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {isApprovePending ? 'Approving...' : isSellPending ? 'Selling...' : 'Sell WELP'}
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {!isConnected && (
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-12 text-center border border-white/20">
            <h2 className="text-2xl font-semibold text-white mb-4">
              Connect Your Wallet
            </h2>
            <p className="text-white/70 mb-8">
              Please connect your wallet to participate in the presale
            </p>
            <div className="flex justify-center">
              <ConnectButton />
            </div>
          </div>
        )}
      </div>

      {toast && (
        <div className={`fixed bottom-8 right-8 px-6 py-4 rounded-xl backdrop-blur-lg border border-white/20 ${
          toast.type === 'success' ? 'bg-green-500/20 text-green-100' :
          toast.type === 'error' ? 'bg-red-500/20 text-red-100' :
          'bg-blue-500/20 text-blue-100'
        }`}>
          {toast.message}
        </div>
      )}
    </div>
  )
}

export default App