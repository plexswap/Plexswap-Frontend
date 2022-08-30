import { ChainId } from '@plexswap/sdk'
import { SerializedFarmConfig } from '../types'

let logged = false

export const getFarmConfig = async (chainId: ChainId) => {
  try {
    return (await import(`/${chainId}.ts`)).default as SerializedFarmConfig[]
  } catch (error) {
    if (!logged) {
      console.error('Cannot get farm config', error, chainId)
      logged = true
    }
    return []
  }
}
