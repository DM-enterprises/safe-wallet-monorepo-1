import { type SafeInfo } from '@safe-global/safe-gateway-typescript-sdk'
import { makeLoadableSlice } from './common'
import type { listenerMiddlewareInstance } from '.'
import { swapperRoleApi } from './api/swapper-role'

export type ExtendedSafeInfo = SafeInfo & { deployed: boolean }

export const defaultSafeInfo: ExtendedSafeInfo = {
  address: { value: '' },
  chainId: '',
  nonce: -1,
  threshold: 0,
  owners: [],
  implementation: { value: '' },
  implementationVersionState: '' as SafeInfo['implementationVersionState'],
  modules: null,
  guard: null,
  fallbackHandler: { value: '' },
  version: '',
  collectiblesTag: '',
  txQueuedTag: '',
  txHistoryTag: '',
  messagesTag: '',
  deployed: true,
}

const { slice, selector } = makeLoadableSlice('safeInfo', undefined as ExtendedSafeInfo | undefined)

export const safeInfoSlice = slice
export const selectSafeInfo = selector

export const safeInfoListener = (listenerMiddleware: typeof listenerMiddlewareInstance) => {
  listenerMiddleware.startListening({
    predicate: (action, state, prevState) => {
      if (action.type !== safeInfoSlice.actions.set.type) {
        return false
      }

      const safeInfo = selectSafeInfo(state).data
      const prevSafeInfo = selectSafeInfo(prevState).data

      if (!safeInfo || !prevSafeInfo) {
        return false
      }

      return safeInfo.txHistoryTag !== prevSafeInfo.txHistoryTag
    },
    effect: () => {
      swapperRoleApi.util.invalidateTags(['SwapperRole'])
    },
  })
}
