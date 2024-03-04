import { PrismaClient } from "@prisma/client"
import { getBlockByNumber } from "../../rpc/getBlockByNumber"
import { getTransactionReceipt } from "../../rpc/getTransactionReceipt"

const logic = async (prisma: PrismaClient, contract: any) => {
  const lastBlock = await prisma.lastBlocks.findFirst({
    where: {
      contractId: contract.id,
    },
  })

  if (!lastBlock) {
    throw new Error("No last block found for contract")
  }

  const blockNumber = `0x${lastBlock.lastBlockNumber.toString(16)}`

  const block = await getBlockByNumber(blockNumber)
  const datetime = new Date(Number(block.timestamp) * 1000).toISOString()

  for (const transaction of block.transactions) {
    if (transaction.to == contract.tokenAddress.toLocaleLowerCase()) {
      const tx = await prisma.transactions.upsert({
        where: { hash: transaction.hash },
        update: {
          contractId: contract.id,
          hash: transaction.hash,
          blockNumber: lastBlock.lastBlockNumber,
          from: transaction.from,
          to: transaction.to,
          value: transaction.value,
          input: transaction.input,
          datetime,
        },
        create: {
          contractId: contract.id,
          hash: transaction.hash,
          blockNumber: lastBlock.lastBlockNumber,
          from: transaction.from,
          to: transaction.to,
          value: transaction.value,
          input: transaction.input,
          datetime,
        }
      })

      const receipt = await getTransactionReceipt(transaction.hash)
      if (!receipt) {
        continue
      }

      let topicIndex = 1
      for (const log of receipt.logs) {
        const dbLog = await prisma.logs.upsert({
          where: { id: tx.id, index: Number(log.logIndex) },
          update: {
            index: Number(log.logIndex),
            address: log.address,
            data: log.data,
          },
          create: {
            transactionId: tx.id,
            index: Number(log.logIndex),
            address: log.address,
            data: log.data,
          },
        })

        for (const topic of log.topics) {
          await prisma.topics.upsert({
            where: { id: dbLog.id, index: topicIndex },
            update: {
              topic: topic,
            },
            create: {
              logId: dbLog.id,
              index: topicIndex,
              topic: topic,
            },
          })
          topicIndex++
        }
      }
    }
  }

  const nextBlockNumber = lastBlock.lastBlockNumber + 1

  await prisma.lastBlocks.update({
    where: {
      id: lastBlock.id,
    },
    data: {
      lastBlockNumber: nextBlockNumber,
    },
  })

  return nextBlockNumber
}

const main = async () => {
  try {
    const prisma = new PrismaClient()

    const contracts = await prisma.contracts.findMany()

    for (let i = 0; i < 1000000; i++) {
      let blockNumber = 0
      for (const contract of contracts) {
        blockNumber = await logic(prisma, contract)
        console.log(`Block number: ${blockNumber}`)
      }

      if (!blockNumber) {
        break
      }
    }
  } catch (error) {
    console.error(error)
  }
}

export default main
