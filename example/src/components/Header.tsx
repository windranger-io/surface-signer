import { FlexContainer } from './styles'
import { ConnectButton } from '@rainbow-me/rainbowkit'

interface HelloWorldProps {
  foo?: string
}

const HelloWorld = ({}: HelloWorldProps) => {
  return (
    <FlexContainer>
      <div className="text-2xl">Hey 👋 Checkout this message signing flow...</div>
      <ConnectButton />
    </FlexContainer>
  )
}

export default HelloWorld
