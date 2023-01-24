import { ChainId } from "./constants"

export const FACTORY_ADDRESS_BSC = '0x580B12Fcc6247E7bA7a02324Ea6Aa6604d0BEC7A'
export const INIT_CODE_HASH_BSC = '0xf38c13cd4dac7b7a54178d2832fe7f9ff6e71d8063d032326d6bb4c85fcbd0d5'

export const FACTORY_ADDRESS_MAP: Record<number, string> = {
  [ChainId.ETHEREUM]: '',
  [ChainId.GOERLI]: '0x3866371E3915B736C44B8699DDc10366200607be',
  [ChainId.BSC]: FACTORY_ADDRESS_BSC,
  [ChainId.BSC_TESTNET]:  '0x551291a1A69CbE46EAfE4F45703360AF992987A6',
}

export const INIT_CODE_HASH_MAP: Record<number, string> = {
  [ChainId.ETHEREUM]: '',
  [ChainId.GOERLI]: '0x8d917a5d5b3ef7ad15203e8e9f95b7b55664fe349c0460c26b903c5db82d6fac',
  [ChainId.BSC]: INIT_CODE_HASH_BSC,
  [ChainId.BSC_TESTNET]:'0x0ac3000920e9b3c229fdd8305aa7b28c16e5d16c66e4983a4e2ff27aff8e4b53',
}
