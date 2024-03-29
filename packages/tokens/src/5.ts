import { WETH9 } from '@plexswap/sdk'
import { ChainId  } from '@plexswap/chains'
import { USDC_GOERLI, BUSD_GOERLI, WAYA_GOERLI, PLEXF_GOERLI } from './common'

export const goerliTestnetTokens = {
  weth: WETH9[ChainId.GOERLI],
  usdc: USDC_GOERLI,
  waya: WAYA_GOERLI,
  busd: BUSD_GOERLI,
  plexf: PLEXF_GOERLI,
}
