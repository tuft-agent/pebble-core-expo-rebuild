import { Pressable, Text, View } from 'react-native';

import { GlassSurface } from './components';
import { fonts, palette } from './theme';

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
    <GlassSurface style={{ marginHorizontal: 20, marginBottom: 20, padding: 16 }}>
      <View>
        <Text style={{ color: palette.text, fontFamily: fonts.display, fontSize: 18 }}>{title}</Text>
        <Text style={{ color: palette.textMuted, fontFamily: fonts.medium, fontSize: 13 }}>{caption}</Text>
        {metrics.map((metric) => (
          <View
            key={metric.label}
            style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
            <Text style={{ color: palette.textMuted, fontFamily: fonts.medium, fontSize: 12 }}>
              {metric.label}
            </Text>
            <Text style={{ color: palette.text, fontFamily: fonts.medium, fontSize: 13 }}>
              {metric.value}
            </Text>
          </View>
        ))}
        {actionLabel ? (
          <Pressable
            onPress={onActionPress}
            style={{
              marginTop: 14,
              borderRadius: 14,
              backgroundColor: 'rgba(255,255,255,0.08)',
              paddingHorizontal: 14,
              paddingVertical: 12,
            }}>
            <Text style={{ color: palette.text, fontFamily: fonts.medium, fontSize: 13 }}>
              {actionLabel}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </GlassSurface>
  );
}
