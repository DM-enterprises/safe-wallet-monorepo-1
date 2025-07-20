import ReviewChangeThreshold from '@/components/tx-flow/flows/ChangeThreshold/ReviewChangeThreshold'
import SaveAddressIcon from '@/public/images/common/save-address.svg'
import useSafeInfo from '@/hooks/useSafeInfo'
import { ChooseThreshold } from '@/components/tx-flow/flows/ChangeThreshold/ChooseThreshold'
import { TxFlow } from '../../common/TxFlow'
import { FlowFeature } from '../../features'
import { TxFlowType } from '@/services/analytics'

export enum ChangeThresholdFlowFieldNames {
  threshold = 'threshold',
}

export type ChangeThresholdFlowProps = {
  [ChangeThresholdFlowFieldNames.threshold]: number
}

const ChangeThresholdFlow = () => {
  const {
    safe: { threshold },
  } = useSafeInfo()

  return (
    <TxFlow
      features={[FlowFeature.Batching]}
      initialData={{ threshold }}
      subtitle="Change threshold"
      icon={SaveAddressIcon}
      eventCategory={TxFlowType.CHANGE_THRESHOLD}
      showMethodCall
    >
      {[
        { Component: ChooseThreshold, title: 'New transaction' },
        { Component: ReviewChangeThreshold, title: 'Confirm transaction' },
      ]}
    </TxFlow>
  )
}

export default ChangeThresholdFlow
