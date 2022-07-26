import BigNumber from 'bignumber.js'
import { BLOCKS_PER_YEAR } from 'config'
import lpAprs56 from 'config/constants/lpAprs/56.json'

const getLpApr = (chainId: number) => {
  switch (chainId) {
    case 56:
      return lpAprs56
    default:
      return {}
  }
}

/**
 * Get the APR value in %
 * @param stakingTokenPrice Token price in the same quote currency
 * @param rewardTokenPrice Token price in the same quote currency
 * @param totalStaked Total amount of stakingToken in the pool
 * @param tokenPerBlock Amount of new waya allocated to the pool for each new block
 * @returns Null if the APR is NaN or infinite.
 */
export const getPoolApr = (
  stakingTokenPrice: number,
  rewardTokenPrice: number,
  totalStaked: number,
  tokenPerBlock: number,
): number => {
  const totalRewardPricePerYear = new BigNumber(rewardTokenPrice).times(tokenPerBlock).times(BLOCKS_PER_YEAR)
  const totalStakingTokenInPool = new BigNumber(stakingTokenPrice).times(totalStaked)
  const apr = totalRewardPricePerYear.div(totalStakingTokenInPool).times(100)
  return apr.isNaN() || !apr.isFinite() ? null : apr.toNumber()
}

/**
 * Get farm APR value in %
 * @param poolWeight allocationPoint / totalAllocationPoint
 * @param wayaPriceUsd Waya price in USD
 * @param poolLiquidityUsd Total pool liquidity in USD
 * @param farmAddress Farm Address
 * @returns Farm Apr
 */
export const getFarmApr = (
  chainId: number,
  poolWeight: BigNumber,
  wayaPriceUsd: BigNumber,
  poolLiquidityUsd: BigNumber,
  farmAddress: string,
  regularWayaPerBlock: number,
): { wayaRewardsApr: number; lpRewardsApr: number } => {
  const yearlyWayaRewardAllocation = poolWeight
    ? poolWeight.times(BLOCKS_PER_YEAR * regularWayaPerBlock)
    : new BigNumber(NaN)
  const wayaRewardsApr = yearlyWayaRewardAllocation.times(wayaPriceUsd).div(poolLiquidityUsd).times(100)
  let wayaRewardsAprAsNumber = null
  if (!wayaRewardsApr.isNaN() && wayaRewardsApr.isFinite()) {
    wayaRewardsAprAsNumber = wayaRewardsApr.toNumber()
  }
  const lpRewardsApr = getLpApr(chainId)[farmAddress?.toLowerCase()] ?? 0
  return { wayaRewardsApr: wayaRewardsAprAsNumber, lpRewardsApr }
}

export default null
