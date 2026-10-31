import type { ReactNode } from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import { tabBarClearance } from '../../theme/tokens';
import { Screen } from './Screen';

type ScrollScreenProps = {
  children: ReactNode;
  header?: ReactNode;
  topInset?: boolean;
  safeBottom?: boolean;
};

export function ScrollScreen({
  children,
  header,
  topInset = false,
  safeBottom = true,
}: ScrollScreenProps) {
  return (
    <Screen topInset={topInset} safeBottom={safeBottom}>
      {header}
      <ScrollView
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, safeBottom ? null : styles.underTabs]}>
        {children}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    paddingBottom: 28,
  },
  underTabs: {
    paddingBottom: tabBarClearance,
  },
});
