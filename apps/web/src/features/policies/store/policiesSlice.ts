import { makeLoadableSlice } from '@/store/common'
import { createSelector } from '@reduxjs/toolkit'

export type PoliciesState = {
  policyType: string
  targetAddress: string
  selector: string
  operation: string
  policyAddress: string
  data: string
}

const initialState: PoliciesState[] = []

const { slice, selector } = makeLoadableSlice('policies', initialState)

export const policiesSlice = slice

export const selectPolicies = createSelector(selector, (policies) => policies.data)
export const selectPoliciesLoading = createSelector(selector, (policies) => policies.loading)
