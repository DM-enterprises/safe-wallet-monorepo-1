import { HeaderBackButton } from '@react-navigation/elements'
import { type NativeStackHeaderLeftProps } from '@react-navigation/native-stack'
import { useTheme } from 'tamagui'

export const getDefaultScreenOptions = (goBack: () => void) => {
  return {
    headerBackButtonDisplayMode: 'minimal' as const,
    headerShadowVisible: false,
    headerLeft: (props: NativeStackHeaderLeftProps) => {
      const theme = useTheme()
      return (
        <HeaderBackButton
          {...props}
          tintColor={theme.primary.get()}
          testID={'go-back'}
          onPress={goBack}
          displayMode={'minimal'}
        />
      )
    },
  }
}
