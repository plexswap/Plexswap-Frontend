import map from 'lodash/map'
import omitBy from 'lodash/omitBy'
import erc20ABI from 'config/abi/erc20.json'
import { bscTokens, plexchainTokens } from '@plexswap/tokens'
import { Token } from '@plexswap/sdk'
import multicall from 'utils/multicall'

// remove BNB because it's not a Bep20 token
// remove ONE because there are two tokens with the symbol ONE (Harmony ONE and BigONE)
// remove HERO because there are two tokens with the symbol HERO (StepHero and Hero)
const tokensToTest = omitBy(
  bscTokens, 
  (token) =>
    token.symbol.toLowerCase() === 'bnb' ||
    token.symbol.toLowerCase() === 'one' ||
    token.symbol.toLowerCase() === 'bttold' ||
    token.symbol.toLowerCase() === 'hero',
)

describe('Config tokens', () => {
  it.each(map(plexchainTokens, (token, key) => [key, token]))(
    'Token %s has the correct key, symbol, and decimal',
    async (key, token: Token) => {
      const [[symbol], [decimals]] = await multicall(erc20ABI, [
        {
          address: token.address,
          name: 'symbol',
        },
        {
          address: token.address,
          name: 'decimals',
        },
      ])

      expect(key.toLowerCase()).toBe(token.symbol.toLowerCase())
      expect(token.symbol.toLowerCase()).toBe(symbol.toLowerCase())
      expect(token.decimals).toBe(parseInt(decimals, 10))
    },
  )

  it.each(map(bscTokens, (token, key) => [key, token]))(
    'Token %s has the correct key, symbol, and decimal',
    async (key, token: Token) => {
      const [[symbol], [decimals]] = await multicall(erc20ABI, [
        {
          address: token.address,
          name: 'symbol',
        },
        {
          address: token.address,
          name: 'decimals',
        },
      ])

      expect(key.toLowerCase()).toBe(token.symbol.toLowerCase())
      expect(token.symbol.toLowerCase()).toBe(symbol.toLowerCase())
      expect(token.decimals).toBe(parseInt(decimals, 10))
    },
  )
})
