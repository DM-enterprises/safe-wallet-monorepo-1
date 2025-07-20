import Safe, { buildSignatureBytes, EthSafeSignature, SigningMethod } from '@safe-global/protocol-kit'
import SafeTransaction from '@safe-global/protocol-kit/dist/src/utils/transactions/SafeTransaction'
import { ethers } from 'ethers'
import SafeApiKit from '@safe-global/api-kit'
import { ChainInfo } from '@safe-global/safe-gateway-typescript-sdk'
import { createConnectedWallet } from '@/src/services/web3'
import { createExistingTx } from '@/src/services/tx/tx-sender'
import { SafeInfo } from '@/src/types/address'
import { SafeMultisigTransactionResponse } from '@safe-global/types-kit/dist/src/types'

type sendSignedTxParameters = {
  safeTx: SafeTransaction
  signatures: Record<string, string>
  protocolKit: Safe
  wallet: ethers.Wallet
  apiKit: SafeApiKit
  activeSafe: SafeInfo
}

export type signTxParams = {
  chain: ChainInfo
  activeSafe: SafeInfo
  txId: string
  privateKey?: string
}

export const signTx = async ({
  chain,
  activeSafe,
  txId,
  privateKey,
}: signTxParams): Promise<SafeMultisigTransactionResponse> => {
  if (!chain) {
    throw new Error('Active chain not found')
  }
  if (!privateKey) {
    throw new Error('Private key not found')
  }

  const { protocolKit, wallet } = await createConnectedWallet(privateKey, activeSafe, chain)
  const { safeTx, signatures } = await createExistingTx({
    activeSafe,
    txId,
    chain,
    privateKey,
  })

  const apiKit = new SafeApiKit({
    chainId: BigInt(activeSafe.chainId),
  })

  if (!safeTx) {
    throw new Error('Safe transaction not found')
  }
  try {
    const safeTransactionHash = await sendSignedTx({
      safeTx,
      signatures,
      protocolKit,
      wallet,
      apiKit,
      activeSafe,
    })

    const signedTransaction = await apiKit.getTransaction(safeTransactionHash)

    return signedTransaction
  } catch (err) {
    console.log(err)
    throw err
  }
}

export const sendSignedTx = async ({
  safeTx,
  signatures,
  protocolKit,
  wallet,
  apiKit,
  activeSafe,
}: sendSignedTxParameters): Promise<string> => {
  console.log('singing')
  const signedSafeTx = await protocolKit.signTransaction(safeTx, SigningMethod.ETH_SIGN)
  console.log('signed Safe Tx', signedSafeTx)
  Object.entries(signatures).forEach(([signer, data]) => {
    signedSafeTx.addSignature({
      signer,
      data,
      staticPart: () => data,
      dynamicPart: () => '',
      isContractSignature: false,
    })
  })
  const safeTransactionHash = await protocolKit.getTransactionHash(safeTx)
  console.log('safeTransactionHash', safeTransactionHash)
  const signature = signedSafeTx.getSignature(wallet.address) as EthSafeSignature
  console.log('signature', signature)
  await apiKit.proposeTransaction({
    safeAddress: activeSafe.address,
    safeTransactionData: safeTx.data,
    safeTxHash: safeTransactionHash,
    senderAddress: wallet.address,
    senderSignature: buildSignatureBytes([signature]),
  })
  console.log('proposeTransaction done')
  await apiKit.confirmTransaction(safeTransactionHash, buildSignatureBytes([signature]))
  console.log('confirmation done')

  return safeTransactionHash
}
