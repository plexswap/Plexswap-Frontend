import { useCallback } from 'react'
import { Modal, Box } from '@plexswap/ui-plex'
import _noop from 'lodash/noop'
import useTheme from 'hooks/useTheme'
import { useBUSDWayaAmount } from 'hooks/useStablecoinPrice'
import { MAX_LOCK_DURATION } from 'config/constants/pools'
import { useTranslation } from '@plexswap/localization'
import BigNumber from 'bignumber.js'

import { getBalanceAmount } from 'utils/formatBalance'
import StaticAmount from '../Common/StaticAmount'
import LockedBodyModal from '../Common/LockedModalBody'
import Overview from '../Common/Overview'
import { ExtendDurationModal } from '../types'
import RoiCalculatorModalProvider from './RoiCalculatorModalProvider'
import { ENABLE_EXTEND_LOCK_AMOUNT } from '../../../helpers'

const ExtendDurationModal: React.FC<ExtendDurationModal> = ({
  modalTitle,
  stakingToken,
  onDismiss,
  currentLockedAmount,
  currentDuration,
  currentDurationLeft,
  currentBalance,
  lockStartTime,
}) => {
  const { theme } = useTheme()
  const { t } = useTranslation()

  const usdValueStaked = useBUSDWayaAmount(currentLockedAmount)

  const validator = useCallback(
    ({ duration }) => {
      const isValidAmount = currentLockedAmount && currentLockedAmount > 0
      const totalDuration = currentDurationLeft + duration

      const isValidDuration = duration > 0 && totalDuration > 0 && totalDuration <= MAX_LOCK_DURATION

      return {
        isValidAmount,
        isValidDuration,
        isOverMax: totalDuration > MAX_LOCK_DURATION,
      }
    },
    [currentLockedAmount, currentDurationLeft],
  )

  const prepConfirmArg = useCallback(
    ({ duration }) => ({
      finalDuration: duration,
      finalLockedAmount:
        currentDuration && currentDuration + duration > MAX_LOCK_DURATION
          ? getBalanceAmount(ENABLE_EXTEND_LOCK_AMOUNT, stakingToken.decimals).toNumber()
          : 0,
    }),
    [stakingToken.decimals, currentDuration],
  )

  const customOverview = useCallback(
    ({ isValidDuration, duration }) => (
      <Overview
        lockStartTime={
          currentDuration + duration > MAX_LOCK_DURATION ? Math.floor(Date.now() / 1000).toString() : lockStartTime
        }
        isValidDuration={isValidDuration}
        openCalculator={_noop}
        duration={currentDuration || duration}
        newDuration={
          currentDuration + duration > MAX_LOCK_DURATION ? currentDurationLeft + duration : currentDuration + duration
        }
        lockedAmount={currentLockedAmount}
        usdValueStaked={usdValueStaked}
        showLockWarning={!+lockStartTime}
      />
    ),
    [lockStartTime, currentDuration, currentLockedAmount, currentDurationLeft, usdValueStaked],
  )

  return (
    <RoiCalculatorModalProvider lockedAmount={currentLockedAmount}>
      <Modal
        title={modalTitle || t('Extend Lock')}
        onDismiss={onDismiss}
        headerBackground={theme.colors.gradientCardHeader}
      >
        <Box mb="16px">
          <StaticAmount
            stakingAddress={stakingToken.address}
            stakingSymbol={stakingToken.symbol}
            lockedAmount={currentLockedAmount}
            usdValueStaked={usdValueStaked}
          />
        </Box>
        <LockedBodyModal
          stakingToken={stakingToken}
          currentBalance={currentBalance}
          currentDuration={currentDuration}
          currentDurationLeft={currentDurationLeft}
          onDismiss={onDismiss}
          lockedAmount={new BigNumber(currentLockedAmount)}
          validator={validator}
          prepConfirmArg={prepConfirmArg}
          customOverview={customOverview}
        />
      </Modal>
    </RoiCalculatorModalProvider>
  )
}

export default ExtendDurationModal
