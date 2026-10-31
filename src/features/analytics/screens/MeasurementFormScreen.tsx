import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Text } from 'react-native';

import { ScrollScreen } from '../../../components/layout/ScrollScreen';
import { Button } from '../../../components/ui/Button';
import { TextField } from '../../../components/ui/TextField';
import { getExecutor } from '../../../database/client/database';
import type { RootStackParamList } from '../../../navigation/types';
import { useTheme } from '../../../theme/ThemeProvider';
import { nowIso } from '../../../utils/time';
import { visibleError } from '../../training/errors';
import { addBodyWeight } from '../data/progress';

type Props = NativeStackScreenProps<RootStackParamList, 'MeasurementForm'>;

export function MeasurementFormScreen({ navigation }: Props) {
  const theme = useTheme();
  const [value, setValue] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <ScrollScreen>
      <Text style={[theme.typography.body, { color: theme.colors.secondaryLabel }]}>
        Body weight stays on this device.
      </Text>
      <TextField
        label="Kilograms"
        value={value}
        onChangeText={setValue}
        keyboardType="decimal-pad"
        placeholder="72.5"
      />
      {message ? (
        <Text style={[theme.typography.callout, { color: theme.colors.danger, marginTop: theme.spacing.md }]}>
          {message}
        </Text>
      ) : null}
      <Button
        label={busy ? 'Saving…' : 'Save'}
        disabled={busy}
        onPress={() => {
          setBusy(true);
          setMessage(null);
          addBodyWeight(getExecutor(), value, nowIso())
            .then(() => navigation.goBack())
            .catch(err => {
              setMessage(visibleError(err, 'The measurement could not be saved.'));
              setBusy(false);
            });
        }}
      />
    </ScrollScreen>
  );
}
