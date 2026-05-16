import { StyleSheet } from 'react-native';
import { Text, View } from '@/components/Themed';

export default function LogScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Log</Text>
      <Text style={styles.subtitle}>Blood pressure, glucose, and A1C entry coming soon</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    marginTop: 8,
    fontSize: 14,
    opacity: 0.6,
  },
});
