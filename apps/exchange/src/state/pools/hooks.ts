import { useEffect, useMemo } from 'react'
import { useWeb3React } from '@plexswap/wagmi'
import useActiveWeb3React from 'hooks/useActiveWeb3React'
import { batch, useSelector } from 'react-redux'
import { useAppDispatch } from 'state'
import { useFastRefreshEffect, useSlowRefreshEffect } from 'hooks/useRefreshEffect'
import { featureFarmApiAtom, useFeatureFlag } from 'hooks/useFeatureFlag'
import { getFarmConfig } from '@plexswap/farms/config'
import { livePools } from 'config/constants/pools'

import {
  fetchPoolsPublicDataAsync,
  fetchPoolsUserDataAsync,
  fetchWayaVaultPublicData,
  fetchWayaVaultUserData,
  fetchWayaVaultFees,
  fetchPoolsStakingLimitsAsync,

  fetchWayaFlexibleVaultPublicData,
  fetchWayaFlexibleVaultUserData,
  fetchWayaFlexibleVaultFees,
} from '.'
import { DeserializedPool, VaultKey } from '../types'
import { fetchFarmsPublicDataAsync } from '../farms'
import {
  makePoolWithUserDataLoadingSelector,
  makeVaultPoolByKey,
  poolsWithVaultSelector,

  makeVaultPoolWithKeySelector,
} from './selectors'

const lPoolAddresses = livePools.filter(({ poolId }) => poolId !== 0).map(({ earningToken }) => earningToken.address)

// Only fetch farms for live pools
const getActiveFarms = async (chainId: number) => {
  const farmsConfig = await getFarmConfig(chainId)
  return farmsConfig
    .filter(
      ({ token, pid, quoteToken }) =>
        pid !== 0 &&
        ((token.symbol === 'BUSD' && quoteToken.symbol === 'WBNB') ||
          lPoolAddresses.find((poolAddress) => poolAddress === token.address)),
    )
    .map((farm) => farm.pid)
}

export const useFetchPublicPoolsData = () => {
  const dispatch = useAppDispatch()
  const { chainId } = useActiveWeb3React()
  const farmFlag = useFeatureFlag(featureFarmApiAtom)

  useSlowRefreshEffect(
    (currentBlock) => {
      const fetchPoolsDataWithFarms = async () => {
        const activeFarms = await getActiveFarms(chainId)
        await dispatch(fetchFarmsPublicDataAsync({ pids: activeFarms, chainId, flag: farmFlag }))

        batch(() => {
          dispatch(fetchPoolsPublicDataAsync(currentBlock, chainId))
          dispatch(fetchPoolsStakingLimitsAsync())
        })
      }

      fetchPoolsDataWithFarms()
    },
    [dispatch, chainId, farmFlag],
  )
}

export const usePool = (poolId: number): { pool: DeserializedPool; userDataLoaded: boolean } => {
  const poolWithUserDataLoadingSelector = useMemo(() => makePoolWithUserDataLoadingSelector(poolId), [poolId])
  return useSelector(poolWithUserDataLoadingSelector)
}

export const usePoolsWithVault = () => {
  return useSelector(poolsWithVaultSelector)
}

export const useDeserializedPoolByVaultKey = (vaultKey) => {
  const vaultPoolWithKeySelector = useMemo(() => makeVaultPoolWithKeySelector(vaultKey), [vaultKey])

  return useSelector(vaultPoolWithKeySelector)
}

export const usePoolsPageFetch = () => {
  const { account } = useWeb3React()
  const dispatch = useAppDispatch()
  useFetchPublicPoolsData()

  useFastRefreshEffect(() => {
    batch(() => {
      dispatch(fetchWayaVaultPublicData())
      dispatch(fetchWayaFlexibleVaultPublicData())

      if (account) {
        dispatch(fetchPoolsUserDataAsync(account))
        dispatch(fetchWayaVaultUserData({ account }))
        dispatch(fetchWayaFlexibleVaultUserData({ account }))
      }
    })
  }, [account, dispatch])

  useEffect(() => {
    batch(() => {
      dispatch(fetchWayaVaultFees())
      dispatch(fetchWayaFlexibleVaultFees())
    })
  }, [dispatch])
}

export const useWayaVaultUserData = () => {
  const { account } = useWeb3React()
  const dispatch = useAppDispatch()

  useFastRefreshEffect(() => {
    if (account) {
      dispatch(fetchWayaVaultUserData({ account }))
    }
  }, [account, dispatch])
}

export const useFetchIfo = () => {
  const { account } = useWeb3React()
  const dispatch = useAppDispatch()

  useFastRefreshEffect(() => {
    batch(() => {
      dispatch(fetchWayaVaultPublicData())

      if (account) {
        dispatch(fetchPoolsUserDataAsync(account))
        dispatch(fetchWayaVaultUserData({ account }))

      }
    })
  }, [dispatch, account])

  useEffect(() => {
    dispatch(fetchWayaVaultFees())
  }, [dispatch])
}

export const useWayaVault = () => {
  return useVaultPoolByKey(VaultKey.WayaVault)
}

export const useVaultPoolByKey = (key: VaultKey) => {
  const vaultPoolByKey = useMemo(() => makeVaultPoolByKey(key), [key])

  return useSelector(vaultPoolByKey)

}
