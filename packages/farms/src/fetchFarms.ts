import { BigNumber, FixedNumber } from '@ethersproject/bignumber'
import { formatUnits } from '@ethersproject/units'
import { MultiCallV2 } from '@plexswap/multicall'
import { ChainId } from '@plexswap/chains'
import { BIG_TEN, FIXED_TWO, FIXED_ZERO } from './constants'
import { getFarmsPrices } from './farmPrices'
import { fetchPublicFarmsData } from './fetchPublicFarmData'
import { fetchStableFarmData } from './fetchStableFarmData'
import { isStableFarm, SerializedFarmConfig } from './types'

export const getTokenAmount = (balance: FixedNumber, decimals: number) => {
  const tokenDividerFixed = FixedNumber.from(BIG_TEN.pow(decimals))
  return balance.divUnsafe(tokenDividerFixed)
}

export type FetchFarmsParams = {
  farms: SerializedFarmConfig[]
  multicallv2: MultiCallV2
  chiefFarmerAddress: string
  chainId: number
  totalRegularAllocPoint: BigNumber
  totalSpecialAllocPoint: BigNumber
}

export async function farmV2FetchFarms({
  farms,
  multicallv2,
  chiefFarmerAddress,
  chainId,
  totalRegularAllocPoint,
  totalSpecialAllocPoint,
}: FetchFarmsParams) {
  const stableFarms = farms.filter(isStableFarm)

  const [stableFarmsResults, poolInfos, lpDataResults] = await Promise.all([
    fetchStableFarmData(stableFarms, chainId, multicallv2),
    fetchChiefFarmerData(farms, chainId, multicallv2, chiefFarmerAddress),
    fetchPublicFarmsData(farms, chainId, multicallv2, chiefFarmerAddress),
  ])

  const stableFarmsData = (stableFarmsResults as StableLpData[]).map(formatStableFarm)
  const stableFarmsDataMap = stableFarms.reduce<Record<number, FormatStableFarmResponse>>((map, farm, index) => {
    return {
      ...map,
      [farm.pid]: stableFarmsData[index],
    }
  }, {})

  const lpData = lpDataResults.map(formatClassicFarmResponse)

  const farmsData = farms.map((farm, index) => {
    try {
      return {
        pid: farm.pid,
        ...farm,
        ...getClassicFarmsDynamicData({
          ...lpData[index],
          ...stableFarmsDataMap[farm.pid],
          token0Decimals: farm.token.decimals,
          token1Decimals: farm.quoteToken.decimals,
        }),
        ...(stableFarmsDataMap[farm.pid] &&
          getStableFarmDynamicData({
            price0: stableFarmsDataMap[farm.pid].price0,
            token1Decimals: farm.quoteToken.decimals,
          })),
        ...getFarmAllocation({
          allocPoint: poolInfos[index]?.allocPoint,
          isRegular: poolInfos[index]?.isRegular,
          totalRegularAllocPoint,
          totalSpecialAllocPoint,
        }),
      }
    } catch (error) {
      console.error(error, farm, index, {
        allocPoint: poolInfos[index]?.allocPoint,
        isRegular: poolInfos[index]?.isRegular,
        token0Decimals: farm.token.decimals,
        token1Decimals: farm.quoteToken.decimals,
        totalRegularAllocPoint,
        totalSpecialAllocPoint,
      })
      throw error
    }
  })

  const farmsDataWithPrices = getFarmsPrices(farmsData, chainId)

  return farmsDataWithPrices
}

const chiefFarmerV2Abi = [
  {
    inputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    name: 'poolInfo',
    outputs: [
      { internalType: 'uint256', name: 'accWayaPerShare', type: 'uint256' },
      { internalType: 'uint256', name: 'lastRewardBlock', type: 'uint256' },
      { internalType: 'uint256', name: 'allocPoint', type: 'uint256' },
      { internalType: 'uint256', name: 'totalBoostedShare', type: 'uint256' },
      { internalType: 'bool', name: 'isRegular', type: 'bool' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'poolLength',
    outputs: [{ internalType: 'uint256', name: 'pools', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'totalRegularAllocPoint',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'totalSpecialAllocPoint',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'bool', name: '_isRegular', type: 'bool' }],
    name: 'wayaPerBlock',
    outputs: [{ internalType: 'uint256', name: 'amount', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
]

const chiefFarmerFarmCalls = (farm: SerializedFarmConfig, chiefFarmerAddress: string) => {
  const { pid } = farm

  return pid || pid === 0
    ? {
        address: chiefFarmerAddress,
        name: 'poolInfo',
        params: [pid],
      }
    : null
}

export const fetchChiefFarmerData = async (
  farms: SerializedFarmConfig[],
  chainId: number,
  multicallv2: MultiCallV2,
  chiefFarmerAddress: string,
): Promise<any[]> => {
  try {
    const chiefFarmerCalls = farms.map((farm) => chiefFarmerFarmCalls(farm, chiefFarmerAddress))
    const chiefFarmerAggregatedCalls = chiefFarmerCalls.filter((chiefFarmerCall) => chiefFarmerCall !== null)

    const chiefFarmerMultiCallResult = await multicallv2({
      abi: chiefFarmerV2Abi,
      calls: chiefFarmerAggregatedCalls,
      chainId,
    })

    let chiefFarmerChunkedResultCounter = 0
    return chiefFarmerCalls.map((chiefFarmerCall) => {
      if (chiefFarmerCall === null) {
        return null
      }
      const data = chiefFarmerMultiCallResult[chiefFarmerChunkedResultCounter]
      chiefFarmerChunkedResultCounter++
      return data
    })
  } catch (error) {
    console.error('ChiefFarmer Pool info data error', error)
    throw error
  }
}

export const fetchChiefFarmerV2Data = async ({
  chainId,
  multicallv2,
  chiefFarmerAddress,
}: {
  chainId: number
  multicallv2: MultiCallV2
  chiefFarmerAddress: string
}) => {
  try {
    const [[poolLength], [totalRegularAllocPoint], [totalSpecialAllocPoint], [wayaPerBlock]] = await multicallv2<
      [[BigNumber], [BigNumber], [BigNumber], [BigNumber]]
    >({
      abi: chiefFarmerV2Abi,
      calls: [
        {
          address: chiefFarmerAddress,
          name: 'poolLength',
        },
        {
          address: chiefFarmerAddress,
          name: 'totalRegularAllocPoint',
        },
        {
          address: chiefFarmerAddress,
          name: 'totalSpecialAllocPoint',
        },
        {
          address: chiefFarmerAddress,
          name: 'wayaPerBlock',
          params: [true],
        },
      ],
      chainId,
    })

    return {
      poolLength,
      totalRegularAllocPoint,
      totalSpecialAllocPoint,
      wayaPerBlock,
    }
  } catch (error) {
    console.error('Get ChiefFarmer data error', error)
    throw error
  }
}

type StableLpData = [balanceResponse, balanceResponse, balanceResponse, balanceResponse]

type FormatStableFarmResponse = {
  tokenBalanceLP: FixedNumber
  quoteTokenBalanceLP: FixedNumber
  price0: BigNumber
}

const formatStableFarm = (stableFarmData: StableLpData): FormatStableFarmResponse => {
  const [balance1, balance2, price0, _price1] = stableFarmData
  return {
    tokenBalanceLP: FixedNumber.from(balance1[0]),
    quoteTokenBalanceLP: FixedNumber.from(balance2[0]),
    price0: price0[0],
  }
}

const getStableFarmDynamicData = ({ price0, token1Decimals }: { token1Decimals: number; price0: BigNumber }) => {
  return {
    tokenPriceVsQuote: formatUnits(price0, token1Decimals),
  }
}

type balanceResponse = [BigNumber]
type decimalsResponse = [number]

export type ClassicLPData = [
  balanceResponse,
  balanceResponse,
  balanceResponse,
  balanceResponse,
  decimalsResponse,
  decimalsResponse,
]

type FormatClassicFarmResponse = {
  tokenBalanceLP: FixedNumber
  quoteTokenBalanceLP: FixedNumber
  lpTokenBalanceMC: FixedNumber
  lpTotalSupply: FixedNumber
}

const formatClassicFarmResponse = (farmData: ClassicLPData): FormatClassicFarmResponse => {
  const [tokenBalanceLP, quoteTokenBalanceLP, lpTokenBalanceMC, lpTotalSupply] = farmData
  return {
    tokenBalanceLP: FixedNumber.from(tokenBalanceLP[0]),
    quoteTokenBalanceLP: FixedNumber.from(quoteTokenBalanceLP[0]),
    lpTokenBalanceMC: FixedNumber.from(lpTokenBalanceMC[0]),
    lpTotalSupply: FixedNumber.from(lpTotalSupply[0]),
  }
}

interface FarmAllocationParams {
  allocPoint?: BigNumber
  isRegular?: boolean
  totalRegularAllocPoint: BigNumber
  totalSpecialAllocPoint: BigNumber
}

const getFarmAllocation = ({
  allocPoint,
  isRegular,
  totalRegularAllocPoint,
  totalSpecialAllocPoint,
}: FarmAllocationParams) => {
  const _allocPoint = allocPoint ? FixedNumber.from(allocPoint) : FIXED_ZERO
  const totalAlloc = isRegular ? totalRegularAllocPoint : totalSpecialAllocPoint
  const poolWeight =
    !totalAlloc.isZero() && !_allocPoint.isZero() ? _allocPoint.divUnsafe(FixedNumber.from(totalAlloc)) : FIXED_ZERO

  return {
    poolWeight: poolWeight.toString(),
    multiplier: !_allocPoint.isZero() ? `${+_allocPoint.divUnsafe(FixedNumber.from(100)).toString()}X` : `0X`,
  }
}

const getClassicFarmsDynamicData = ({
  lpTokenBalanceMC,
  lpTotalSupply,
  quoteTokenBalanceLP,
  tokenBalanceLP,
  token0Decimals,
  token1Decimals,
}: FormatClassicFarmResponse & {
  token0Decimals: number
  token1Decimals: number
}) => {
  // Raw amount of token in the LP, including those not staked
  const tokenAmountTotal = getTokenAmount(tokenBalanceLP, token0Decimals)
  const quoteTokenAmountTotal = getTokenAmount(quoteTokenBalanceLP, token1Decimals)

  // Ratio in % of LP tokens that are staked in the MC, vs the total number in circulation
  const lpTokenRatio =
    !lpTotalSupply.isZero() && !lpTokenBalanceMC.isZero() ? lpTokenBalanceMC.divUnsafe(lpTotalSupply) : FIXED_ZERO

  // // Amount of quoteToken in the LP that are staked in the MC
  const quoteTokenAmountMcFixed = quoteTokenAmountTotal.mulUnsafe(lpTokenRatio)

  // // Total staked in LP, in quote token value
  const lpTotalInQuoteToken = quoteTokenAmountMcFixed.mulUnsafe(FIXED_TWO)

  return {
    tokenAmountTotal: tokenAmountTotal.toString(),
    quoteTokenAmountTotal: quoteTokenAmountTotal.toString(),
    lpTotalSupply: lpTotalSupply.toString(),
    lpTotalInQuoteToken: lpTotalInQuoteToken.toString(),
    tokenPriceVsQuote: !quoteTokenAmountTotal.isZero() && quoteTokenAmountTotal.divUnsafe(tokenAmountTotal).toString(),
  }
}
