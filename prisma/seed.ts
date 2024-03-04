import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  await prisma.transactions.deleteMany()
  await prisma.lastBlocks.deleteMany()
  await prisma.contracts.deleteMany()

  await prisma.$queryRawUnsafe(
    'ALTER SEQUENCE "Transactions_id_seq" RESTART WITH 1;'
  )
  await prisma.$queryRawUnsafe(
    'ALTER SEQUENCE "LastBlocks_id_seq" RESTART WITH 1;'
  )
  await prisma.$queryRawUnsafe(
    'ALTER SEQUENCE "Contracts_id_seq" RESTART WITH 1;'
  )

  const contracts = [
    {
      id: 1,
      name: '0XLSD_StakingContract',
      tokenAddress: '0xeb40ba5d15ecf3e25868df1219b191a974475d58',
      ownerAddress: '0x1B01fC937FF429cbA26E8aF9934Aa75514677708',
    },
    {
      id: 2,
      name: '0XLSD_PoolContract',
      tokenAddress: '0x2bb76ce97bc26b022401570573253863ea644d92',
      ownerAddress: '0x1B01fC937FF429cbA26E8aF9934Aa75514677708',
    },
  ]

  let id = 1
  for (const contract of contracts) {
    await prisma.contracts.upsert({
      where: { id: contract.id },
      update: {
        name: contract.name,
        tokenAddress: contract.tokenAddress,
        ownerAddress: contract.ownerAddress,
      },
      create: contract,
    })

    await prisma.lastBlocks.upsert({
      where: { id: id },
      update: {
        contractId: contract.id,
        firstBlockNumber: 33235940,
        lastBlockNumber: 33235940,
      },
      create: {
        contractId: contract.id,
        firstBlockNumber: 33235940,
        lastBlockNumber: 33235940,
      },
    })

    id++
  }
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
