import dynamic from 'next/dynamic'

const ConfirmPolicyFlow = dynamic(() => import('./ConfirmPolicy'), { ssr: false })

export default ConfirmPolicyFlow
