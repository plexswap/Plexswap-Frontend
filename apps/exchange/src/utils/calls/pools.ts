/* eslint-disable import/prefer-default-export */
import BigNumber from 'bignumber.js'
import poolsConfig from 'config/constants/pools'
import cropChiefABI from 'config/abi/CropChief.json'
import { bscRpcProvider } from 'config/constants/providers'
import multicall from '../multicall'
import { getAddress } from '../addressHelpers'

/**
 * Returns the total number of pools that were active at a given block
 */
export const getActivePools = async (block?: number) => {
  const eligiblePools = poolsConfig
    .filter((pool) => pool.poolId !== 0)
    .filter((pool) => pool.isFinished === false || pool.isFinished === undefined)
  const blockNumber = block || (await bscRpcProvider.getBlockNumber())
  const startBlockCalls = eligiblePools.map(({ contractAddress }) => ({
    address: getAddress(contractAddress, 56),
    name: 'startBlock',
  }))
  const endBlockCalls = eligiblePools.map(({ contractAddress }) => ({
    address: getAddress(contractAddress, 56),
    name: 'bonusEndBlock',
  }))
  const [startBlocks, endBlocks] = await Promise.all([
    multicall(cropChiefABI, startBlockCalls),
    multicall(cropChiefABI, endBlockCalls),
  ])

  return eligiblePools.reduce((accum, poolCheck, index) => {
    const startBlock = startBlocks[index] ? new BigNumber(startBlocks[index]) : null
    const endBlock = endBlocks[index] ? new BigNumber(endBlocks[index]) : null

    if (!startBlock || !endBlock) {
      return accum
    }

    if (startBlock.gte(blockNumber) || endBlock.lte(blockNumber)) {
      return accum
    }

    return [...accum, poolCheck]
  }, [])
}
