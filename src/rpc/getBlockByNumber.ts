import Jsonrpc from "../libs/jsonrpc"
import { CHAINS } from "../config/constants"

export const getBlockByNumber = async (blockNumber: string) => {
  try {
    const jsonrpc = new Jsonrpc()

    const data = await jsonrpc.send({
      uri: CHAINS.BSC_MAINNET.RPC,
      chainId: CHAINS.BSC_MAINNET.ID,
      method: 'eth_getBlockByNumber',
      params: [blockNumber, true],
    })

    return data.result
  } catch (error) {
    if (error instanceof Error) {
      console.error('エラーが発生しました:', error.message)
    } else {
      console.error('未知のエラーが発生しました', error)
    }
  }
}
