import React, { useCallback, useMemo, type ComponentType } from 'react'
import { Checkbox, FormControlLabel } from '@mui/material'

export const withCheckboxGuard = <P extends { disableSubmit?: boolean; tooltip?: string }>(
  WrappedComponent: ComponentType<P>,
) => {
  return function WithCheckboxGuard({
    disableSubmit,
    tooltip,
    isChecked = false,
    onCheckboxChange,
    ...props
  }: P & { onCheckboxChange?: (checked: boolean) => void; isChecked?: boolean }) {
    const handleCheckboxChange = useCallback(
      ({ target: { checked } }: React.ChangeEvent<HTMLInputElement>) => {
        onCheckboxChange?.(checked)
      },
      [onCheckboxChange],
    )

    const checkboxTooltip = useMemo(
      () => (tooltip || !isChecked ? 'Review details and check the box to enable signing' : undefined),
      [tooltip, isChecked],
    )

    return (
      <>
        <FormControlLabel
          sx={{ mt: 2, mb: -1.3 }}
          control={<Checkbox checked={isChecked} onChange={handleCheckboxChange} />}
          label="I understand what I'm signing and that this is an irreversible action."
        />

        <WrappedComponent {...(props as P)} disableSubmit={!isChecked || disableSubmit} tooltip={checkboxTooltip} />
      </>
    )
  }
}
