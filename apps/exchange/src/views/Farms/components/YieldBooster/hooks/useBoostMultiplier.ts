import useActiveWeb3React from 'hooks/useActiveWeb3React'
import { useFarmBoosterContract, useChieffarmer } from 'hooks/useContract'
import farmBoosterAbi from 'config/abi/FarmBooster.json'
import chiefFarmerAbi from 'config/abi/ChiefFarmer.json'
import { FixedNumber } from '@ethersproject/bignumber'
import { multicallv2 } from 'utils/multicall'
import { useCallback } from 'react'
import useSWR from 'swr'
import _toNumber from 'lodash/toNumber'
import { YieldBoosterState } from './useYieldBoosterState'

const PRECISION_FACTOR = FixedNumber.from('1000000000000') // 1e12

async function getPublicMultiplier({ farmBoosterContract }): Promise<number> {
  const calls = [
    {
      address: farmBoosterContract.address,
      name: 'lMaxBoost',
    },
    {
      address: farmBoosterContract.address,
      name: 'LMB_PRECISION',
    },
    {
      address: farmBoosterContract.address,
      name: 'BOOST_PRECISION',
    },
  ]

  const data = await multicallv2({ abi: farmBoosterAbi, calls })

  if (!data) return 0

  const [[lMaxBoost], [LMB_PRECISION], [BOOST_PRECISION]] = data

  const MAX_BOOST_PRECISION = FixedNumber.from(LMB_PRECISION)
    .divUnsafe(FixedNumber.from(lMaxBoost))
    .mulUnsafe(PRECISION_FACTOR)
    .subUnsafe(FixedNumber.from(BOOST_PRECISION))

  const boostPercent = PRECISION_FACTOR.addUnsafe(MAX_BOOST_PRECISION).divUnsafe(PRECISION_FACTOR)

  return _toNumber(boostPercent.round(3).toString())
}

async function getUserMultiplier({ farmBoosterContract, account, pid }): Promise<number> {
  const calls = [
    {
      address: farmBoosterContract.address,
      name: 'getUserMultiplier',
      params: [account, pid],
    },
    {
      address: farmBoosterContract.address,
      name: 'BOOST_PRECISION',
    },
  ]

  const data = await multicallv2({ abi: farmBoosterAbi, calls })

  if (!data) return 0

  const [[multiplier], [BOOST_PRECISION]] = data

  return _toNumber(
    PRECISION_FACTOR.addUnsafe(FixedNumber.from(multiplier))
      .subUnsafe(FixedNumber.from(BOOST_PRECISION))
      .divUnsafe(PRECISION_FACTOR)
      .round(3)
      .toString(),
  )
}

async function getMultiplierFromMC({ pid, proxyAddress, chiefFarmerContract }): Promise<number> {
  const calls = [
    {
      address: chiefFarmerContract.address,
      name: 'getBoostMultiplier',
      params: [proxyAddress, pid],
    },
  ]

  const data = await multicallv2({ abi: chiefFarmerAbi, calls })

  if (!data?.length) return 0

  const [[boostMultiplier]] = data

  return _toNumber(FixedNumber.from(boostMultiplier).divUnsafe(PRECISION_FACTOR).round(3).toString())
}

export default function useBoostMultiplier({ pid, boosterState, proxyAddress }): number {
  const farmBoosterContract = useFarmBoosterContract()
  const chiefFarmerContract = useChieffarmer()

  const { account } = useActiveWeb3React()

  const shouldGetFromSC = [YieldBoosterState.DEACTIVE, YieldBoosterState.ACTIVE, YieldBoosterState.MAX].includes(
    boosterState,
  )
  const should1X = [YieldBoosterState.LOCKED_END].includes(boosterState)

  const getMultiplier = useCallback(async () => {
    if (shouldGetFromSC) {
      return getMultiplierFromMC({ pid, chiefFarmerContract, proxyAddress })
    }

    return should1X
      ? getUserMultiplier({ farmBoosterContract, pid, account })
      : getPublicMultiplier({
          farmBoosterContract,
        })
  }, [farmBoosterContract, chiefFarmerContract, should1X, shouldGetFromSC, pid, account, proxyAddress])

  const cacheName = shouldGetFromSC ? `proxy${pid}` : should1X ? `user${pid}` : `public${pid}`

  const { data } = useSWR(['boostMultiplier', cacheName], getMultiplier)

  return data || 0
}
