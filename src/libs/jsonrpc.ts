import axios from 'axios'
import { JSON_RPC } from '../config/constants'

interface JsonrpcRequest {
  uri: string
  chainId: number
  method: string
  params: any[]
}

class Jsonrpc {
  async send(req: JsonrpcRequest) {
    try {
      const response = await axios.post(req.uri, {
        jsonrpc: JSON_RPC.VERSION,
        id: req.chainId,
        method: req.method,
        params: req.params,
      })
      return response.data
    } catch (error: unknown) {
      console.error('エラーが発生しました:', error)
      throw error
    }
  }
}

export default Jsonrpc
