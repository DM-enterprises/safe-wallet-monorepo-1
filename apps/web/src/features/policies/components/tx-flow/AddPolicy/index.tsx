import dynamic from 'next/dynamic'

const AddPolicyFlow = dynamic(() => import('./AddPolicy'), { ssr: false })

export default AddPolicyFlow
