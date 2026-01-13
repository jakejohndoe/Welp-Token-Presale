export const contracts = {
  welpToken: {
    address: '0xb79DA8e01c761D08B2dAAe5c2A9c51e0ace012ed',
    abi: [
      {
        "type": "function",
        "name": "totalSupply",
        "inputs": [],
        "outputs": [{"name": "", "type": "uint256"}],
        "stateMutability": "view"
      },
      {
        "type": "function",
        "name": "balanceOf",
        "inputs": [{"name": "account", "type": "address"}],
        "outputs": [{"name": "", "type": "uint256"}],
        "stateMutability": "view"
      },
      {
        "type": "function",
        "name": "decimals",
        "inputs": [],
        "outputs": [{"name": "", "type": "uint8"}],
        "stateMutability": "view"
      },
      {
        "type": "function",
        "name": "approve",
        "inputs": [
          {"name": "spender", "type": "address"},
          {"name": "amount", "type": "uint256"}
        ],
        "outputs": [{"name": "", "type": "bool"}],
        "stateMutability": "nonpayable"
      }
    ]
  },
  welpTokenSale: {
    address: '0x19B961BE6CAC93e13988E67FCEAC43FB75F2AD58',
    abi: [
      {
        "type": "function",
        "name": "buyTokens",
        "inputs": [{"name": "numTokens", "type": "uint256"}],
        "outputs": [],
        "stateMutability": "payable"
      },
      {
        "type": "function",
        "name": "sellTokens",
        "inputs": [{"name": "numTokens", "type": "uint256"}],
        "outputs": [],
        "stateMutability": "nonpayable"
      },
      {
        "type": "function",
        "name": "buyPrice",
        "inputs": [],
        "outputs": [{"name": "", "type": "uint256"}],
        "stateMutability": "view"
      },
      {
        "type": "function",
        "name": "sellPrice",
        "inputs": [],
        "outputs": [{"name": "", "type": "uint256"}],
        "stateMutability": "view"
      }
    ]
  }
};