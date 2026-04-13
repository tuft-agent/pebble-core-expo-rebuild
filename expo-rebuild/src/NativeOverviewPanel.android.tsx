import { Button, Switch } from '@expo/ui/jetpack-compose';
import { StyleSheet, Text, View } from 'react-native';

import { GlassSurface } from './components';
import { palette } from './theme';

type Metric = {
  label: string;
  value: string;
};

type Toggle = {
  key: string;
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
};

export function NativeOverviewPanel({
  title,
  caption,
  metrics,
  toggles,
  actionLabel,
  onActionPress,
}: {
  title: string;
  caption: string;
  metrics: Metric[];
  toggles: Toggle[];
  actionLabel?: string;
  onActionPress?: () => void;
}) {
  return (
    <GlassSurface style={{ marginHorizontal: 20, marginBottom: 20 }}>
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.caption}>{caption}</Text>
        {metrics.map((metric) => (
          <View key={metric.label} style={styles.metricRow}>
            <Text style={styles.metricLabel}>{metric.label}</Text>
            <Text style={styles.metricValue}>{metric.value}</Text>
          </View>
        ))}
        {toggles.map((toggle) => (
          <View key={toggle.key} style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>{toggle.label}</Text>
            <Switch color={palette.accent} onValueChange={toggle.onValueChange} value={toggle.value} />
          </View>
        ))}
        {actionLabel ? (
          <Button color={palette.accent} onPress={onActionPress} variant="elevated">
            {actionLabel}
          </Button>
        ) : null}
      </View>
    </GlassSurface>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 12,
    padding: 16,
  },
  title: {
    color: palette.text,
    fontSize: 22,
    fontWeight: '700',
  },
  caption: {
    color: palette.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  metricRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metricLabel: {
    color: palette.textMuted,
    fontSize: 12,
  },
  metricValue: {
    color: palette.text,
    fontSize: 13,
    fontWeight: '600',
  },
  toggleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  toggleLabel: {
    color: palette.text,
    flex: 1,
    fontSize: 14,
    paddingRight: 12,
  },
});
