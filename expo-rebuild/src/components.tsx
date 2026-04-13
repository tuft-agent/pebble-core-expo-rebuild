import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { GlassContainer, GlassView, isGlassEffectAPIAvailable, isLiquidGlassAvailable } from 'expo-glass-effect';
import { LinearGradient } from 'expo-linear-gradient';
import { ReactNode } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TabId } from './data';
import { fonts, gradients, palette, radius, spacing } from './theme';

export type HeaderAction = {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  onPress?: () => void;
};

export type TabDescriptor = {
  id: TabId;
  label: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
};

const liquidGlassEnabled =
  Platform.OS === 'ios' && isLiquidGlassAvailable() && isGlassEffectAPIAvailable();

export function GlassSurface({
  children,
  style,
  tintColor = 'rgba(255,255,255,0.14)',
}: {
  children: ReactNode;
  style?: object;
  tintColor?: string;
}) {
  return (
    <View style={[styles.surfaceBase, style]}>
      {liquidGlassEnabled ? (
        <GlassView
          pointerEvents="none"
          style={StyleSheet.absoluteFill}
          glassEffectStyle="regular"
          tintColor={tintColor}
        />
      ) : null}
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: liquidGlassEnabled ? 'rgba(255,255,255,0.05)' : palette.panel,
            borderRadius: radius.lg,
          },
        ]}
      />
      {children}
    </View>
  );
}

export function AppFrame({ children }: { children: ReactNode }) {
  return (
    <LinearGradient colors={gradients.screen} style={styles.frame}>
      <LinearGradient colors={gradients.hero} style={styles.glow} />
      <SafeAreaView style={styles.safeArea}>{children}</SafeAreaView>
    </LinearGradient>
  );
}

export function ScreenHeader({
  title,
  subtitle,
  actions,
  onBrandPress,
}: {
  title: string;
  subtitle?: string;
  actions: HeaderAction[];
  onBrandPress?: () => void;
}) {
  return (
    <View style={styles.header}>
      <BrandPill onPress={onBrandPress} />
      <View style={styles.headerCopy}>
        <Text style={styles.headerTitle}>{title}</Text>
        {subtitle ? <Text style={styles.headerSubtitle}>{subtitle}</Text> : null}
      </View>
      <GlassContainer spacing={12} style={styles.headerActions}>
        {actions.map((action) => (
          <Pressable key={action.icon} onPress={action.onPress} style={styles.iconButton}>
            {liquidGlassEnabled ? (
              <GlassView
                pointerEvents="none"
                style={StyleSheet.absoluteFill}
                glassEffectStyle="clear"
                tintColor="rgba(255,255,255,0.18)"
              />
            ) : null}
            <Ionicons color={palette.text} name={action.icon} size={18} />
          </Pressable>
        ))}
      </GlassContainer>
    </View>
  );
}

export function SectionTitle({
  eyebrow,
  title,
  actionLabel,
  onActionPress,
}: {
  eyebrow?: string;
  title: string;
  actionLabel?: string;
  onActionPress?: () => void;
}) {
  return (
    <View style={styles.sectionTitle}>
      <View>
        {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
        <Text style={styles.sectionHeading}>{title}</Text>
      </View>
      {actionLabel ? (
        <Pressable onPress={onActionPress}>
          <Text style={styles.sectionAction}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function InfoPill({
  label,
  tone = 'default',
}: {
  label: string;
  tone?: 'default' | 'accent' | 'success' | 'warning';
}) {
  const backgroundColor =
    tone === 'accent'
      ? 'rgba(255, 98, 63, 0.18)'
      : tone === 'success'
        ? 'rgba(131, 225, 170, 0.16)'
        : tone === 'warning'
          ? 'rgba(255, 209, 102, 0.16)'
          : 'rgba(255,255,255,0.06)';

  const color =
    tone === 'accent'
      ? palette.accentBright
      : tone === 'success'
        ? palette.success
        : tone === 'warning'
          ? palette.warning
          : palette.textMuted;

  return (
    <View style={[styles.infoPill, { backgroundColor }]}>
      <Text style={[styles.infoPillText, { color }]}>{label}</Text>
    </View>
  );
}

export function MiniStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

export function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (next: T) => void;
  options: readonly T[];
}) {
  return (
    <GlassSurface style={styles.segmentedWrap}>
      <View style={styles.segmentedRow}>
        {options.map((option) => {
          const selected = option === value;
          return (
            <Pressable
              key={option}
              onPress={() => onChange(option)}
              style={[styles.segmentButton, selected && styles.segmentButtonActive]}>
              <Text style={[styles.segmentLabel, selected && styles.segmentLabelActive]}>
                {option}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </GlassSurface>
  );
}

export function ActionFab({
  onPress,
  icon = 'add',
}: {
  onPress?: () => void;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
}) {
  return (
    <Pressable onPress={onPress} style={styles.fab}>
      {liquidGlassEnabled ? (
        <GlassView
          pointerEvents="none"
          style={StyleSheet.absoluteFill}
          glassEffectStyle="regular"
          tintColor="rgba(255, 120, 87, 0.24)"
        />
      ) : null}
      <Ionicons color={palette.text} name={icon} size={26} />
    </Pressable>
  );
}

export function DetailSheet({
  visible,
  title,
  children,
  onClose,
}: {
  visible: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.sheetBackdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <GlassSurface style={styles.sheet}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>{title}</Text>
            <Pressable onPress={onClose} style={styles.sheetClose}>
              <Ionicons color={palette.textMuted} name="close" size={22} />
            </Pressable>
          </View>
          <ScrollView
            bounces={false}
            contentContainerStyle={styles.sheetContent}
            showsVerticalScrollIndicator={false}>
            {children}
          </ScrollView>
        </GlassSurface>
      </View>
    </Modal>
  );
}

export function BottomTabs({
  tabs,
  activeTab,
  onSelect,
}: {
  tabs: TabDescriptor[];
  activeTab: TabId;
  onSelect: (tab: TabId) => void;
}) {
  return (
    <View style={styles.tabShell}>
      <GlassSurface style={styles.tabBar}>
        <View style={styles.tabRow}>
          {tabs.map((tab) => {
            const selected = tab.id === activeTab;
            return (
              <Pressable
                key={tab.id}
                onPress={() => onSelect(tab.id)}
                style={[styles.tabItem, selected && styles.tabItemActive]}>
                <MaterialCommunityIcons
                  color={selected ? palette.text : palette.textSoft}
                  name={tab.icon}
                  size={20}
                />
                <Text style={[styles.tabLabel, selected && styles.tabLabelActive]}>{tab.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </GlassSurface>
    </View>
  );
}

function BrandPill({ onPress }: { onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.brandWrap}>
      <GlassSurface style={styles.brandPill}>
        <View style={styles.brandDot} />
        <Text style={styles.brandText}>Pebble</Text>
      </GlassSurface>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  frame: {
    flex: 1,
    backgroundColor: palette.background,
  },
  glow: {
    position: 'absolute',
    top: -120,
    right: -80,
    width: 340,
    height: 340,
    borderRadius: 999,
  },
  safeArea: {
    flex: 1,
  },
  surfaceBase: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: palette.border,
    shadowColor: '#000',
    shadowOpacity: 0.22,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 16 },
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    gap: spacing.md,
  },
  headerCopy: {
    flex: 1,
  },
  headerTitle: {
    color: palette.text,
    fontFamily: fonts.display,
    fontSize: 30,
    letterSpacing: -0.7,
  },
  headerSubtitle: {
    color: palette.textMuted,
    fontFamily: fonts.medium,
    fontSize: 13,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: palette.border,
  },
  sectionTitle: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  eyebrow: {
    color: palette.accentBright,
    fontFamily: fonts.mono,
    fontSize: 11,
    letterSpacing: 1.3,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  sectionHeading: {
    color: palette.text,
    fontFamily: fonts.display,
    fontSize: 22,
    letterSpacing: -0.4,
  },
  sectionAction: {
    color: palette.textMuted,
    fontFamily: fonts.medium,
    fontSize: 13,
  },
  infoPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  infoPillText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    letterSpacing: 0.2,
  },
  statCard: {
    flex: 1,
    minWidth: 0,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: palette.border,
  },
  statLabel: {
    color: palette.textSoft,
    fontFamily: fonts.mono,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  statValue: {
    color: palette.text,
    fontFamily: fonts.display,
    fontSize: 20,
    marginTop: 10,
  },
  segmentedWrap: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    padding: 6,
  },
  segmentedRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: radius.pill,
    alignItems: 'center',
  },
  segmentButtonActive: {
    backgroundColor: 'rgba(255, 98, 63, 0.16)',
  },
  segmentLabel: {
    color: palette.textSoft,
    fontFamily: fonts.medium,
    fontSize: 13,
  },
  segmentLabelActive: {
    color: palette.text,
  },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.lg,
    width: 62,
    height: 62,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 98, 63, 0.82)',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  sheetBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  sheet: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    maxHeight: '78%',
    backgroundColor: palette.panelStrong,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  sheetTitle: {
    color: palette.text,
    fontFamily: fonts.display,
    fontSize: 24,
  },
  sheetClose: {
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  sheetContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  tabShell: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    paddingTop: spacing.sm,
  },
  tabBar: {
    padding: 8,
    borderRadius: 28,
  },
  tabRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tabItem: {
    flex: 1,
    minWidth: 0,
    borderRadius: radius.pill,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  tabItemActive: {
    backgroundColor: 'rgba(255, 98, 63, 0.16)',
  },
  tabLabel: {
    color: palette.textSoft,
    fontFamily: fonts.medium,
    fontSize: 11,
  },
  tabLabelActive: {
    color: palette.text,
  },
  brandWrap: {
    borderRadius: radius.pill,
  },
  brandPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: radius.pill,
    gap: 8,
  },
  brandDot: {
    width: 10,
    height: 10,
    borderRadius: radius.pill,
    backgroundColor: palette.accent,
  },
  brandText: {
    color: palette.text,
    fontFamily: fonts.medium,
    fontSize: 14,
  },
});
