import { Button, useModal, useToast } from '@plexswap/ui-plex'
import useActiveWeb3React from 'hooks/useActiveWeb3React'
import { ToastDescriptionWithTx } from 'components/Toast'
import { useTranslation } from '@plexswap/localization'
import { useERC20 } from 'hooks/useContract'
import useCatchTxError from 'hooks/useCatchTxError'
import { useAppDispatch } from 'state'

import { fetchFarmUserDataAsync } from 'state/farms'
import { useFarmFromPid, useFarmUser } from 'state/farms/hooks'
import useUnstakeFarms from '../../../hooks/useUnstakeFarms'
import { FarmMigrateModal } from '../../FarmMigrateModal'

interface MigrateActionButtonPropsType {
  pid: number
}

const MigrateActionButton: React.FunctionComponent<MigrateActionButtonPropsType> = ({ pid }) => {
  const { t } = useTranslation()
  const { toastSuccess } = useToast()
  const { fetchWithCatchTxError } = useCatchTxError()
  const { account, chainId } = useActiveWeb3React()
  const { onUnstake } = useUnstakeFarms(pid)
  const { stakedBalance } = useFarmUser(pid)
  const { lpAddress } = useFarmFromPid(pid)
  const lpContract = useERC20(lpAddress)
  const dispatch = useAppDispatch()

  const handleUnstakeWithCallback = async (amount: string, callback: () => void) => {
    const receipt = await fetchWithCatchTxError(() => {
      return onUnstake(amount)
    })
    if (receipt?.status) {
      toastSuccess(
        `${t('Unstaked')}!`,
        <ToastDescriptionWithTx txHash={receipt.transactionHash}>
          {t('Your earnings have also been harvested to your wallet')}
        </ToastDescriptionWithTx>,
      )
      callback()
      dispatch(fetchFarmUserDataAsync({ account, pids: [pid], chainId }))
    }
  }

  const [onPresentMigrate] = useModal(
    <FarmMigrateModal
      pid={pid}
      stakedBalance={stakedBalance}
      lpContract={lpContract}
      onUnStack={handleUnstakeWithCallback}
    />,
  )

  return <Button onClick={onPresentMigrate}>{t('Migrate')}</Button>
}

export default MigrateActionButton