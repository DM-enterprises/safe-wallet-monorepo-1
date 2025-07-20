import dynamic from 'next/dynamic'

const PoliciesSettings = dynamic(() => import('./PoliciesSettings'), { ssr: false })

export default PoliciesSettings
