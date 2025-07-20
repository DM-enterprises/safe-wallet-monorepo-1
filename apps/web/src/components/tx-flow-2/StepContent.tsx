import React, { type ReactNode, useContext } from 'react'
import TxLayout from './common/TxLayout'
import { TxFlowContext } from './TxFlowProvider'

export const StepContent = ({ children }: { children: ReactNode }) => {
  const {
    txLayoutProps: { title = '', ...txLayoutProps },
    step,
    progress,
    onPrev,
  } = useContext(TxFlowContext)

  return (
    <TxLayout title={title} {...txLayoutProps} step={step} onBack={onPrev} progress={progress}>
      {children}
    </TxLayout>
  )
}
