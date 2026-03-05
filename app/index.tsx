import { View, Text } from 'react-native';
import { colors } from '@/theme/colors';
import { textStyles } from '@/theme/typography';

export default function HomeScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg.primary }}>
      <Text style={[textStyles.screenTitle, { color: colors.gold.primary }]}>
        QuestForge
      </Text>
      <Text style={[textStyles.narrative, { color: colors.text.secondary, marginTop: 16 }]}>
        Your adventure awaits...
      </Text>
    </View>
  );
}
