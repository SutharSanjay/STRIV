import { createBottomTabNavigator, type BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'react-native';

import { ExerciseProgressScreen } from '../features/analytics/screens/ExerciseProgressScreen';
import { MeasurementFormScreen } from '../features/analytics/screens/MeasurementFormScreen';
import { ProgressScreen } from '../features/analytics/screens/ProgressScreen';
import { ExerciseFormScreen } from '../features/catalog/screens/ExerciseFormScreen';
import { ExerciseListScreen } from '../features/catalog/screens/ExerciseListScreen';
import { HistoryScreen } from '../features/history/screens/HistoryScreen';
import { HomeScreen } from '../features/home/screens/HomeScreen';
import { ProgramsScreen } from '../features/splits/screens/ProgramsScreen';
import { SplitEditorScreen } from '../features/splits/screens/SplitEditorScreen';
import { SplitListScreen } from '../features/splits/screens/SplitListScreen';
import { SessionScreen } from '../features/workouts/screens/SessionScreen';
import { useTheme } from '../theme/ThemeProvider';
import { AppTabBar } from './AppTabBar';
import type { RootStackParamList, TabParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

function renderTabBar(props: BottomTabBarProps) {
  return <AppTabBar {...props} />;
}

function MainTabs() {
  const theme = useTheme();

  return (
    <Tab.Navigator
      tabBar={renderTabBar}
      screenOptions={{
        headerShown: false,
        animation: 'shift',
        transitionSpec: {
          animation: 'timing',
          config: { duration: theme.motion.normal },
        },
        tabBarHideOnKeyboard: true,
        sceneStyle: { backgroundColor: theme.colors.background },
      }}>
      <Tab.Screen name="Today" component={HomeScreen} options={{ title: 'Today' }} />
      <Tab.Screen name="Exercises" component={ExerciseListScreen} options={{ title: 'Exercises' }} />
      <Tab.Screen name="History" component={HistoryScreen} options={{ title: 'History' }} />
      <Tab.Screen name="Progress" component={ProgressScreen} options={{ title: 'Progress' }} />
    </Tab.Navigator>
  );
}

export function RootNavigator() {
  const theme = useTheme();

  const navigationTheme = {
    ...DefaultTheme,
    dark: theme.scheme === 'dark',
    colors: {
      ...DefaultTheme.colors,
      primary: theme.colors.accent,
      background: theme.colors.background,
      card: theme.colors.background,
      text: theme.colors.label,
      border: theme.colors.separator,
      notification: theme.colors.danger,
    },
  };

  return (
    <NavigationContainer theme={navigationTheme}>
      <StatusBar barStyle={theme.scheme === 'dark' ? 'light-content' : 'dark-content'} />
      <Stack.Navigator
        screenOptions={{
          headerShadowVisible: false,
          headerLargeTitleShadowVisible: false,
          headerBlurEffect: theme.scheme === 'dark' ? 'systemChromeMaterialDark' : 'systemChromeMaterialLight',
          headerStyle: { backgroundColor: theme.colors.background },
          headerTintColor: theme.colors.accent,
          headerTitleStyle: { fontSize: 17, fontWeight: '600' },
          headerBackButtonDisplayMode: 'minimal',
          animation: 'slide_from_right',
          contentStyle: { backgroundColor: theme.colors.background },
        }}>
        <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
        <Stack.Screen name="Session" component={SessionScreen} options={{ title: 'Workout' }} />
        <Stack.Screen
          name="SessionDetail"
          component={SessionScreen}
          options={{ title: 'Workout' }}
        />
        <Stack.Screen name="Splits" component={SplitListScreen} options={{ title: 'Splits' }} />
        <Stack.Screen name="SplitEditor" component={SplitEditorScreen} options={{ title: 'Split' }} />
        <Stack.Screen name="Programs" component={ProgramsScreen} options={{ title: 'Programs' }} />
        <Stack.Screen name="ExerciseForm" component={ExerciseFormScreen} options={{ title: 'Exercise' }} />
        <Stack.Screen
          name="ExerciseProgress"
          component={ExerciseProgressScreen}
          options={{ title: 'Progress' }}
        />
        <Stack.Screen
          name="MeasurementForm"
          component={MeasurementFormScreen}
          options={{ title: 'Body weight' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
