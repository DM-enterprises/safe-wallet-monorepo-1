import { useContext } from 'react'
import type { FlowFeature } from './features'
import { TxFlowContext } from './common/TxFlow/TxFlowProvider'

export const useHasFlowFeature = (feature: FlowFeature): boolean => {
  const { features = [] } = useContext(TxFlowContext)
  return features.includes(feature)
}
