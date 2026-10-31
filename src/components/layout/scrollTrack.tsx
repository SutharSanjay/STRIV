import { FlatList, StyleSheet, type FlatListProps } from 'react-native';

import { tabBarClearance } from '../../theme/tokens';

export function TrackedList<ItemT>(props: FlatListProps<ItemT>) {
  return (
    <FlatList
      {...props}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[props.contentContainerStyle, styles.underTabs]}
    />
  );
}

const styles = StyleSheet.create({
  underTabs: {
    paddingBottom: tabBarClearance,
  },
});
