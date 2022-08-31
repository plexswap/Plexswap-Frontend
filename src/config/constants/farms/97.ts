import { bscTestnetTokens, serializeToken } from '@plexswap/tokens'
import { SerializedFarmConfig } from '../types'

const farms: SerializedFarmConfig[] = [
   /**
   * These 3 farms (PID 0, 1, 2) should always be at the top of the file.
   */
  {
    pid: 0,
    lpSymbol: 'WAYA',
    lpAddress: '0xFf7144153586ccE57Af03111d6f7c0a168d9Bf21', // dummyWayaPool (dWP) or Waya Address
    token: bscTestnetTokens.waya,
    quoteToken: bscTestnetTokens.wbnb,
  },
  {
    pid: 1,
    lpSymbol: 'WAYA/BNB LP',
    lpAddress:  '0xb2f17C22DB21b82449e73AD605A74dff66C16aeF', // WAYA-LP Pair
    token: bscTestnetTokens.waya,
    quoteToken: bscTestnetTokens.wbnb,
  },
  {
    pid: 2,
    lpSymbol: 'BUSD/BNB LP',
    lpAddress:  '0xC29d9C4Cc6ee9f25A486bdd74D6f6aC60068cffE',
    token: bscTestnetTokens.busd,
    quoteToken: bscTestnetTokens.wbnb,
  },
  {
    pid: 3,
    lpSymbol: 'WAYA/BUSD LP',
    lpAddress:  '0x07D9Da509bD9349378441311E5b1F560C30Df055',
    token: bscTestnetTokens.waya,
    quoteToken: bscTestnetTokens.busd,
  },
  {
    pid: 4,
    lpSymbol: 'PLEX-F/BNB LP',
    lpAddress:  '0x22aE89104C0A2a0792568b8CDf5A7806249d6e90', // PLEX-LP Pair
    token: bscTestnetTokens.plex,
    quoteToken: bscTestnetTokens.wbnb,
  },
].map((p) => ({ ...p, token: serializeToken(p.token), quoteToken: serializeToken(p.quoteToken) }))

export default farms