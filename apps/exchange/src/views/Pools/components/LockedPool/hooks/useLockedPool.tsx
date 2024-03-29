import { useState, useCallback, Dispatch, SetStateAction } from 'react'
import { useWeb3React } from '@plexswap/wagmi'
import { useTranslation } from '@plexswap/localization'
import { useAppDispatch } from 'state'
import { useBUSDWayaAmount } from 'hooks/useStablecoinPrice'
import { useVaultPoolContract } from 'hooks/useContract'
import BigNumber from 'bignumber.js'
import { getDecimalAmount } from 'utils/formatBalance'
import { useToast } from '@plexswap/ui-plex'
import useCatchTxError from 'hooks/useCatchTxError'
import { fetchWayaVaultUserData } from 'state/pools'
import { Token } from '@plexswap/sdk'
import { ONE_WEEK_DEFAULT, vaultPoolConfig } from 'config/constants/pools'
import { VaultKey } from 'state/types'

import { ToastDescriptionWithTx } from 'components/Toast'
import { useCallWithGasPrice } from 'hooks/useCallWithGasPrice'
import { PrepConfirmArg } from '../types'

interface HookArgs {
  lockedAmount: BigNumber
  stakingToken: Token
  onDismiss: () => void
  prepConfirmArg: PrepConfirmArg
}

interface HookReturn {
  usdValueStaked: number
  duration: number
  setDuration: Dispatch<SetStateAction<number>>
  pendingTx: boolean
  handleConfirmClick: () => Promise<void>
}

export default function useLockedPool(hookArgs: HookArgs): HookReturn {
  const { lockedAmount, stakingToken, onDismiss, prepConfirmArg } = hookArgs

  const dispatch = useAppDispatch()

  const { account } = useWeb3React()
  const { fetchWithCatchTxError, loading: pendingTx } = useCatchTxError()
  const vaultPoolContract = useVaultPoolContract(VaultKey.WayaVault)
  const { callWithGasPrice } = useCallWithGasPrice()

  const { t } = useTranslation()
  const { toastSuccess } = useToast()
  const [duration, setDuration] = useState(ONE_WEEK_DEFAULT)
  const usdValueStaked = useBUSDWayaAmount(lockedAmount.toNumber())

  const handleDeposit = useCallback(
    async (convertedStakeAmount: BigNumber, lockDuration: number) => {
      const callOptions = {
        gasLimit: vaultPoolConfig[VaultKey.WayaVault].gasLimit,
      }

      const receipt = await fetchWithCatchTxError(() => {
        // .toString() being called to fix a BigNumber error in prod
        // as suggested here https://github.com/ChainSafe/web3.js/issues/2077
        const methodArgs = [convertedStakeAmount.toString(), lockDuration]
        return callWithGasPrice(vaultPoolContract, 'deposit', methodArgs, callOptions)
      })

      if (receipt?.status) {
        toastSuccess(
          t('Staked!'),
          <ToastDescriptionWithTx txHash={receipt.transactionHash}>
            {t('Your funds have been staked in the pool')}
          </ToastDescriptionWithTx>,
        )
        onDismiss?.()
        dispatch(fetchWayaVaultUserData({ account }))
      }
    },
    [fetchWithCatchTxError, toastSuccess, dispatch, onDismiss, account, vaultPoolContract, t, callWithGasPrice],
  )

  const handleConfirmClick = useCallback(async () => {
    const { finalLockedAmount = lockedAmount, finalDuration = duration } =
      typeof prepConfirmArg === 'function' ? prepConfirmArg({ duration }) : {}

    const convertedStakeAmount: BigNumber = getDecimalAmount(new BigNumber(finalLockedAmount), stakingToken.decimals)

    handleDeposit(convertedStakeAmount, finalDuration)
  }, [prepConfirmArg, stakingToken, handleDeposit, duration, lockedAmount])

  return { usdValueStaked, duration, setDuration, pendingTx, handleConfirmClick }
}
