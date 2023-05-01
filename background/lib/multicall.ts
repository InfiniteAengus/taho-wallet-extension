import { BigNumber } from "ethers"

// Forked from https://github.com/joshstevens19/ethereum-multicall

export interface AggregateContractResponse {
  blockNumber: BigNumber
  returnData: Array<{
    success: true
    returnData: string
  }>
}

const NETWORKS_SUPPORTING_MULTICALL_BY_CHAIN_ID = [
  "1",
  "3",
  "4",
  "5",
  "10",
  "42",
  "137",
  "69",
  "100",
  "420",
  "42161",
  "421611",
  "421613",
  "80001",
  "11155111",
  "43114",
  "43113",
  "4002",
  "250",
  "56",
  "97",
  "1284",
  "1285",
  "1287",
  "1666600000",
  "25",
  "122",
  "19",
  "16",
  "288",
  "1313161554",
  "592",
  "66",
  "128",
  "1088",
  "30",
  "31",
  "9001",
  "9000",
  "108",
  "18",
  "26863",
  "42220",
  "71402",
  "71401",
  "8217",
  "2001",
  "321",
  "111",
  "59140",
]

export const MULTICALL_CONTRACT_ADDRESS =
  "0xca11bde05977b3631167028862be2a173976ca11"

export const CHAIN_SPECIFIC_MULTICALL_CONTRACT_ADDRESSES = {
  "324": "0x47898B2C52C957663aE9AB46922dCec150a2272c", // zksync era
} as { [chainId: string]: string }

export const networkSupportsMultiCall = (chainID: string): boolean =>
  NETWORKS_SUPPORTING_MULTICALL_BY_CHAIN_ID.includes(chainID) ||
  chainID in CHAIN_SPECIFIC_MULTICALL_CONTRACT_ADDRESSES

export const MULTICALL_ABI = [
  // https://github.com/mds1/multicall
  "function aggregate(tuple(address target, bytes callData)[] calls) payable returns (uint256 blockNumber, bytes[] returnData)",
  "function aggregate3(tuple(address target, bool allowFailure, bytes callData)[] calls) payable returns (tuple(bool success, bytes returnData)[] returnData)",
  "function aggregate3Value(tuple(address target, bool allowFailure, uint256 value, bytes callData)[] calls) payable returns (tuple(bool success, bytes returnData)[] returnData)",
  "function blockAndAggregate(tuple(address target, bytes callData)[] calls) payable returns (uint256 blockNumber, bytes32 blockHash, tuple(bool success, bytes returnData)[] returnData)",
  "function getBasefee() view returns (uint256 basefee)",
  "function getBlockHash(uint256 blockNumber) view returns (bytes32 blockHash)",
  "function getBlockNumber() view returns (uint256 blockNumber)",
  "function getChainId() view returns (uint256 chainid)",
  "function getCurrentBlockCoinbase() view returns (address coinbase)",
  "function getCurrentBlockDifficulty() view returns (uint256 difficulty)",
  "function getCurrentBlockGasLimit() view returns (uint256 gaslimit)",
  "function getCurrentBlockTimestamp() view returns (uint256 timestamp)",
  "function getEthBalance(address addr) view returns (uint256 balance)",
  "function getLastBlockHash() view returns (bytes32 blockHash)",
  "function tryAggregate(bool requireSuccess, tuple(address target, bytes callData)[] calls) payable returns (tuple(bool success, bytes returnData)[] returnData)",
  "function tryBlockAndAggregate(bool requireSuccess, tuple(address target, bytes callData)[] calls) payable returns (uint256 blockNumber, bytes32 blockHash, tuple(bool success, bytes returnData)[] returnData)",
]
