import tw from 'twin.macro'
import Header from 'components/Header'
import Instructions from 'components/Instructions'

const FlexContainer = tw.div`flex  flex-col`

const Home = () => {
  return (
    <FlexContainer>
      <Header />
      <Instructions />
    </FlexContainer>
  )
}

export default Home
