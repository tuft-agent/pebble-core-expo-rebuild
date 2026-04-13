import { Host, HStack, Switch, Text, VStack } from '@expo/ui/swift-ui';
import { foregroundStyle, padding } from '@expo/ui/swift-ui/modifiers';

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
}: {
  title: string;
  caption: string;
  metrics: Metric[];
  toggles: Toggle[];
}) {
  return (
    <GlassSurface style={{ marginHorizontal: 20, marginBottom: 20 }}>
      <Host matchContents style={{ width: '100%' }}>
        <VStack spacing={12} modifiers={[padding({ all: 16 })]}>
          <Text modifiers={[foregroundStyle(palette.text)]}>{title}</Text>
          <Text modifiers={[foregroundStyle(palette.textMuted)]}>{caption}</Text>
          {metrics.map((metric) => (
            <HStack key={metric.label} spacing={10}>
              <Text modifiers={[foregroundStyle(palette.textMuted)]}>{metric.label}</Text>
              <Text modifiers={[foregroundStyle(palette.text)]}>{metric.value}</Text>
            </HStack>
          ))}
          {toggles.map((toggle) => (
            <Switch
              key={toggle.key}
              color={palette.accent}
              label={toggle.label}
              onValueChange={toggle.onValueChange}
              value={toggle.value}
            />
          ))}
        </VStack>
      </Host>
    </GlassSurface>
  );
}
