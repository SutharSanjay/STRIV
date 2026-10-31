import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { DatabaseGate } from './bootstrap/DatabaseGate';
import { RootNavigator } from '../navigation/RootNavigator';
import { ThemeProvider } from '../theme/ThemeProvider';

function App() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <ThemeProvider>
          <DatabaseGate>
            <RootNavigator />
          </DatabaseGate>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});

export default App;
