import { type ComponentType, type ReactNode, useMemo } from 'react'
import TxLayout from '../TxLayout'
import useTxStepper from '../../useTxStepper'
import { ConfirmTxDetails } from '@/components/tx/ConfirmTxDetails'
import TxFlowProvider from './TxFlowProvider'
import SafeTxProvider from '../../SafeTxProvider'
import { TxInfoProvider } from '../../TxInfoProvider'
import { TxSecurityProvider } from '@/components/tx/security/shared/TxSecurityContext'
import type { FlowFeature } from '../../features'

type TxStepProps = {
  title: ReactNode
  subtitle?: ReactNode
  icon?: ComponentType
}

export type TxFlowProps<
  T extends unknown,
  P extends { params: T; onSubmit: () => void } = { params: T; onSubmit: (formData?: T) => void },
> = {
  initialData: T
  children: ({
    Component: ComponentType<P>
  } & TxStepProps)[]
  onSubmit?: () => void
  showMethodCall?: boolean
  onlyExecute?: boolean
  features?: FlowFeature[]
  eventCategory?: string
} & Partial<TxStepProps>

export const TxFlow = <T extends unknown>({
  initialData,
  children,
  onSubmit,
  showMethodCall,
  onlyExecute,
  features,
  eventCategory,
  ...stepProps
}: TxFlowProps<T>) => {
  const { data, step, nextStep, prevStep } = useTxStepper<T>(initialData, eventCategory)

  const steps = useMemo(
    () => [
      ...children.map(({ Component, ...txLayoutProps }, index) => ({
        txLayoutProps,
        content: <Component key={index} params={data} onSubmit={(formData) => nextStep(formData || data)} />,
      })),
      {
        txLayoutProps: { title: 'Confirm transaction details', fixedNonce: true },
        content: (
          <ConfirmTxDetails key={children.length} onSubmit={() => onSubmit?.()} showMethodCall={showMethodCall} />
        ),
      },
    ],
    [nextStep, onSubmit, showMethodCall, data, children],
  )

  const currentStepProps = useMemo(() => steps?.[step]?.txLayoutProps || {}, [steps, step])

  return (
    <SafeTxProvider>
      <TxInfoProvider>
        <TxFlowProvider features={features} onlyExecute={onlyExecute}>
          <TxSecurityProvider>
            <TxLayout step={step} onBack={prevStep} {...stepProps} {...currentStepProps}>
              {steps.map(({ content }) => content)}
            </TxLayout>
          </TxSecurityProvider>
        </TxFlowProvider>
      </TxInfoProvider>
    </SafeTxProvider>
  )
}
