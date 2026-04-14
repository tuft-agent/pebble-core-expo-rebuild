import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Host, HStack, Switch as SwiftSwitch, Text as SwiftText, VStack } from '@expo/ui/swift-ui';
import { foregroundStyle, padding } from '@expo/ui/swift-ui/modifiers';
import {
  GlassContainer,
  GlassView,
  isGlassEffectAPIAvailable,
  isLiquidGlassAvailable,
} from 'expo-glass-effect';
import { LinearGradient } from 'expo-linear-gradient';
import { type ReactNode, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { PebbleConnectionEventPayload, PebbleWatch } from '../modules/pebble-core-native';
import {
  lockerApps,
  notificationAppsSeed,
  settingsGroups,
  settingsItems,
  type NotificationApp,
  type SettingsItem,
  type TabId,
  watchFaces,
} from './data';
import { usePebbleCore } from './usePebbleCore';

const dockTabs: Array<{
  id: TabId;
  label: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
}> = [
  { id: 'devices', label: 'Companion', icon: 'watch-vibrate' },
  { id: 'faces', label: 'Faces', icon: 'watch-variant' },
  { id: 'apps', label: 'Apps', icon: 'apps-box' },
  { id: 'notifications', label: 'Alerts', icon: 'bell-badge-outline' },
  { id: 'settings', label: 'Controls', icon: 'tune-variant' },
];

const glassAvailable = isLiquidGlassAvailable() && isGlassEffectAPIAvailable();
const pebbleLogo = require('../assets/branding/pebble-logo.png');

const ui = {
  ink: '#132135',
  inkMuted: '#5D6C81',
  inkSoft: '#8090A8',
  line: 'rgba(255,255,255,0.58)',
  lineStrong: 'rgba(255,255,255,0.82)',
  shadow: 'rgba(51, 79, 112, 0.16)',
  accent: '#256BFF',
  accentSoft: '#84B8FF',
  warm: '#FF8C68',
  mint: '#5BC9B4',
  gold: '#F6C35D',
  berry: '#C678F2',
  rose: '#FFB6AF',
  switchTrack: '#B8D1FF',
  switchTrackMuted: '#D8E0EC',
};

export default function AppShell() {
  const insets = useSafeAreaInsets();
  const pebble = usePebbleCore();

  const [activeTab, setActiveTab] = useState<TabId>('devices');
  const [notificationApps, setNotificationApps] = useState<NotificationApp[]>(notificationAppsSeed);
  const [settingsGroup, setSettingsGroup] = useState<(typeof settingsGroups)[number]>('Phone');
  const [weatherMirroring, setWeatherMirroring] = useState(true);
  const [calendarMirroring, setCalendarMirroring] = useState(true);
  const [callMirroring, setCallMirroring] = useState(true);
  const [messageMirroring, setMessageMirroring] = useState(true);

  const primaryWatch = selectPrimaryWatch(pebble.state.watches);
  const secondaryWatches = primaryWatch
    ? pebble.state.watches.filter((watch) => watch.identifier !== primaryWatch.identifier)
    : pebble.state.watches;

  const sceneTitle =
    activeTab === 'devices'
      ? 'Live companion'
      : activeTab === 'faces'
        ? 'Face gallery'
        : activeTab === 'apps'
          ? 'Locker stack'
          : activeTab === 'notifications'
            ? 'Alert routing'
            : 'Phone controls';

  const sceneBody =
    activeTab === 'devices'
      ? 'A bright iPhone-first dashboard with the watch state front and center.'
      : activeTab === 'faces'
        ? 'A browsing layer for collections and mood, not a copy of the current locker.'
        : activeTab === 'apps'
          ? 'Pinned utilities and experiments presented like a native iOS toolkit shelf.'
          : activeTab === 'notifications'
            ? 'Per-app routing with quiet confidence instead of the old dense switchboard.'
            : 'Grouped controls that feel at home on iPhone and keep the Pebble logic behind them.';

  const primaryWatchName = primaryWatch?.displayName ?? fallbackWatchLabel(pebble.supported, pebble.initializing);
  const connectionSummary = watchStatusLabel(primaryWatch, pebble);
  const notificationAccessActionLabel = pebble.notificationAccess ? 'Refresh state' : 'Open settings';

  function toggleNotification(id: string, enabled: boolean) {
    setNotificationApps((current) =>
      current.map((item) => (item.id === id ? { ...item, enabled } : item))
    );
  }

  async function handleNotificationAction() {
    if (pebble.notificationAccess) {
      await pebble.refreshState();
      return;
    }
    await pebble.openNotificationAccessSettings();
  }

  return (
    <View style={styles.root}>
      <LinearGradient colors={['#EAF3FF', '#F7F1EA', '#EDF8F3']} style={StyleSheet.absoluteFill} />
      <LinearGradient colors={['rgba(37,107,255,0.22)', 'rgba(37,107,255,0)']} style={styles.topBloom} />
      <LinearGradient colors={['rgba(255,140,104,0.18)', 'rgba(255,140,104,0)']} style={styles.bottomBloom} />
      <View style={styles.floatOrbLeft} />
      <View style={styles.floatOrbRight} />

      <ScrollView
        bounces={false}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 132 },
        ]}
        showsVerticalScrollIndicator={false}>
        <View style={styles.topRow}>
          <LiquidCard style={styles.brandCard} tintColor="rgba(255,255,255,0.76)">
            <View style={styles.brandRow}>
              <Image resizeMode="contain" source={pebbleLogo} style={styles.brandLogo} />
              <View style={{ gap: 2 }}>
                <Text style={styles.brandLabel}>Pebble Companion</Text>
                <Text style={styles.brandMeta}>{todayLabel()}</Text>
              </View>
            </View>
          </LiquidCard>
          <LiquidCard style={styles.statusBubble} tintColor="rgba(255,255,255,0.72)">
            <Text style={styles.statusBubbleLabel}>Bluetooth</Text>
            <Text style={styles.statusBubbleValue}>
              {formatBluetoothState(pebble.state.bluetooth)}
            </Text>
          </LiquidCard>
        </View>

        {pebble.lastError ? (
          <Banner
            icon="alert-circle"
            title="Bridge feedback"
            body={pebble.lastError.message}
            tone="warm"
          />
        ) : null}
        {pebble.lastConnectionEvent ? (
          <Banner
            icon="sparkles"
            title="Connection event"
            body={formatConnectionEvent(pebble.lastConnectionEvent)}
            tone="cool"
          />
        ) : null}

        <LiquidCard style={styles.heroCard} tintColor="rgba(255,255,255,0.82)">
          <View style={styles.heroLayout}>
            <View style={styles.heroCopy}>
              <Text style={styles.heroEyebrow}>iPhone-first redesign</Text>
              <Text style={styles.heroTitle}>{primaryWatchName}</Text>
              <Text style={styles.heroBody}>{connectionSummary}</Text>
              <View style={styles.heroChipRow}>
                <StatusChip
                  label={primaryWatch ? watchKindLabel(primaryWatch) : pebble.state.scanning ? 'Scanning' : 'Waiting'}
                  tone={primaryWatch && isConnectedWatch(primaryWatch) ? 'mint' : pebble.state.scanning ? 'accent' : 'default'}
                />
                <StatusChip
                  label={primaryWatch ? watchBatteryLabel(primaryWatch, pebble) : permissionBadge(pebble.permissionStatus)}
                  tone="default"
                />
                <StatusChip
                  label={pebble.notificationAccess ? 'Alerts ready' : 'Alerts gated'}
                  tone={pebble.notificationAccess ? 'mint' : 'warm'}
                />
              </View>
              <GlassGroup style={styles.heroActionRow}>
                <ActionButton
                  icon={pebble.state.scanning ? 'pause' : 'search'}
                  label={pebble.state.scanning ? 'Stop scan' : 'Scan'}
                  onPress={() => {
                    void pebble.toggleScan();
                  }}
                />
                <ActionButton
                  icon="refresh"
                  label="Refresh"
                  onPress={() => {
                    void pebble.refreshState();
                  }}
                />
                <ActionButton
                  icon="notifications"
                  label={notificationAccessActionLabel}
                  onPress={() => {
                    void handleNotificationAction();
                  }}
                />
              </GlassGroup>
            </View>

            <View style={styles.watchStage}>
              <LinearGradient
                colors={['rgba(37,107,255,0.18)', 'rgba(91,201,180,0.14)', 'rgba(255,255,255,0)']}
                style={styles.watchHalo}
              />
              <View style={styles.watchBody}>
                <View style={styles.watchFrame}>
                  <WatchCanvas variant={watchFaces[0]?.style ?? 'retro'} />
                </View>
              </View>
              <View style={styles.watchMetricsRow}>
                <WatchMetric
                  label="Firmware"
                  value={primaryWatch ? watchFirmwareValue(primaryWatch) : formatBluetoothState(pebble.state.bluetooth)}
                />
                <WatchMetric
                  label="Platform"
                  value={primaryWatch ? formatWatchPlatform(primaryWatch) : pebble.supported ? 'Pebble ready' : 'Bridge idle'}
                />
              </View>
            </View>
          </View>
        </LiquidCard>

        <View style={styles.sceneHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.sectionEyebrow}>Scenes</Text>
            <Text style={styles.sectionTitle}>{sceneTitle}</Text>
          </View>
          <Text style={styles.sceneCaption}>{sceneBody}</Text>
        </View>

        {activeTab === 'devices' ? (
          <>
            <View style={styles.twoUp}>
              <LiquidCard style={styles.infoCard} tintColor="rgba(255,255,255,0.78)">
                <Text style={styles.infoLabel}>Session</Text>
                <Text style={styles.infoValue}>{watchFirmwareLine(primaryWatch, pebble)}</Text>
              </LiquidCard>
              <LiquidCard style={styles.infoCard} tintColor="rgba(255,255,255,0.72)">
                <Text style={styles.infoLabel}>Nearby</Text>
                <Text style={styles.infoValue}>
                  {secondaryWatches.length > 0
                    ? `${secondaryWatches.length} additional watch${secondaryWatches.length === 1 ? '' : 'es'}`
                    : pebble.state.scanning
                      ? 'Looking for hardware'
                      : 'No secondary devices'}
                </Text>
              </LiquidCard>
            </View>

            <NativeQuickControls
              metrics={[
                { label: 'Bluetooth', value: formatBluetoothState(pebble.state.bluetooth) },
                {
                  label: 'Primary battery',
                  value: primaryWatch ? watchBatteryLabel(primaryWatch, pebble) : 'Pending',
                },
                {
                  label: 'Watch state',
                  value: primaryWatch ? watchKindLabel(primaryWatch) : 'Idle',
                },
              ]}
              toggles={[
                {
                  key: 'weather',
                  label: 'Mirror weather',
                  value: weatherMirroring,
                  onValueChange: setWeatherMirroring,
                },
                {
                  key: 'calendar',
                  label: 'Mirror calendar',
                  value: calendarMirroring,
                  onValueChange: setCalendarMirroring,
                },
              ]}
            />

            <Text style={styles.sectionEyebrow}>Other watches</Text>
            <View style={styles.stackList}>
              {secondaryWatches.length > 0 ? (
                secondaryWatches.map((watch) => (
                  <LiquidCard
                    key={watch.identifier}
                    style={styles.stackCard}
                    tintColor="rgba(255,255,255,0.72)">
                    <View style={styles.stackRow}>
                      <View style={styles.stackIcon}>
                        <MaterialCommunityIcons color={ui.ink} name="watch-variant" size={18} />
                      </View>
                      <View style={{ flex: 1, gap: 2 }}>
                        <Text style={styles.stackTitle}>{watch.displayName}</Text>
                        <Text style={styles.stackSubtitle}>{watchKindLabel(watch)}</Text>
                      </View>
                      <Text style={styles.stackMeta}>{formatWatchPlatform(watch)}</Text>
                    </View>
                  </LiquidCard>
                ))
              ) : (
                <LiquidCard style={styles.emptyCard} tintColor="rgba(255,255,255,0.68)">
                  <Text style={styles.emptyText}>
                    {pebble.state.scanning
                      ? 'The bridge is scanning now. Nearby Pebbles will surface here as soon as iOS reports them.'
                      : 'Start a scan to discover additional watches or reconnect a previously bonded device.'}
                  </Text>
                </LiquidCard>
              )}
            </View>
          </>
        ) : null}

        {activeTab === 'faces' ? (
          <>
            <ScrollView
              contentContainerStyle={styles.horizontalRail}
              horizontal
              showsHorizontalScrollIndicator={false}>
              {watchFaces.map((face, index) => (
                <LiquidCard
                  key={face.id}
                  style={[styles.faceCard, index === 0 && styles.faceCardLead]}
                  tintColor={index === 0 ? 'rgba(255,255,255,0.86)' : 'rgba(255,255,255,0.7)'}>
                  <View style={styles.faceTopRow}>
                    <StatusChip label={face.companion} tone={index === 0 ? 'accent' : 'default'} />
                    <Text style={styles.faceCount}>{face.complications} slots</Text>
                  </View>
                  <View style={styles.facePreviewWrap}>
                    <WatchCanvas variant={face.style} compact={index !== 0} />
                  </View>
                  <Text style={styles.faceName}>{face.name}</Text>
                  <Text style={styles.faceAuthor}>{face.author}</Text>
                </LiquidCard>
              ))}
            </ScrollView>

            <LiquidCard style={styles.spotlightCard} tintColor="rgba(255,255,255,0.76)">
              <Text style={styles.sectionEyebrow}>Spotlight</Text>
              <Text style={styles.spotlightTitle}>Glass-friendly rotations</Text>
              <Text style={styles.spotlightBody}>
                Instead of copying the current locker grid, this view treats faces like collectible scenes:
                big preview first, metadata second, sync intent always visible.
              </Text>
            </LiquidCard>
          </>
        ) : null}

        {activeTab === 'apps' ? (
          <View style={styles.stackList}>
            {lockerApps.map((app, index) => (
              <LiquidCard
                key={app.id}
                style={styles.appCard}
                tintColor={index < 2 ? 'rgba(255,255,255,0.82)' : 'rgba(255,255,255,0.72)'}>
                <View style={styles.appRow}>
                  <LinearGradient
                    colors={[app.tint, 'rgba(255,255,255,0.4)']}
                    style={styles.appIconShell}>
                    <Text style={styles.appIconLetter}>{app.name.slice(0, 1)}</Text>
                  </LinearGradient>
                  <View style={{ flex: 1, gap: 3 }}>
                    <Text style={styles.appTitle}>{app.name}</Text>
                    <Text style={styles.appSubtitle}>{app.subtitle}</Text>
                    <View style={styles.inlineChips}>
                      <StatusChip label={app.state} tone={app.state === 'Pinned' ? 'accent' : app.state === 'Experimental' ? 'warm' : 'default'} />
                      {app.timeline ? <StatusChip label="Timeline" tone="mint" /> : null}
                      {app.hasSettings ? <StatusChip label="Configurable" /> : null}
                    </View>
                  </View>
                  <Text style={styles.appDeveloper}>{app.developer}</Text>
                </View>
              </LiquidCard>
            ))}
          </View>
        ) : null}

        {activeTab === 'notifications' ? (
          <>
            <LiquidCard style={styles.spotlightCard} tintColor="rgba(255,255,255,0.78)">
              <Text style={styles.sectionEyebrow}>Alert state</Text>
              <Text style={styles.spotlightTitle}>
                {pebble.notificationAccess ? 'Notifications are live on this iPhone.' : 'Notifications still need permission.'}
              </Text>
              <Text style={styles.spotlightBody}>
                The goal here is restraint: important routes stay obvious, the watch stays informed,
                and the visual hierarchy feels native instead of utility-panel heavy.
              </Text>
            </LiquidCard>

            <NativeQuickControls
              metrics={[
                { label: 'Alert access', value: pebble.notificationAccess ? 'Granted' : 'Pending' },
                { label: 'Mirrored apps', value: `${notificationApps.filter((app) => app.enabled).length}` },
                { label: 'Unread sample', value: `${notificationApps.reduce((sum, app) => sum + app.alerts, 0)}` },
              ]}
              toggles={[
                {
                  key: 'calls',
                  label: 'Mirror calls',
                  value: callMirroring,
                  onValueChange: setCallMirroring,
                },
                {
                  key: 'messages',
                  label: 'Mirror messages',
                  value: messageMirroring,
                  onValueChange: setMessageMirroring,
                },
              ]}
            />

            <View style={styles.stackList}>
              {notificationApps.map((item) => (
                <LiquidCard key={item.id} style={styles.alertCard} tintColor="rgba(255,255,255,0.72)">
                  <View style={styles.alertRow}>
                    <View style={[styles.alertDot, { backgroundColor: item.tint }]} />
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text style={styles.alertName}>{item.name}</Text>
                      <Text style={styles.alertSource}>{item.source}</Text>
                    </View>
                    <Text style={styles.alertCount}>{item.alerts}</Text>
                    <Switch
                      thumbColor="#FFFFFF"
                      trackColor={{
                        false: ui.switchTrackMuted,
                        true: ui.switchTrack,
                      }}
                      value={item.enabled}
                      onValueChange={(value) => toggleNotification(item.id, value)}
                    />
                  </View>
                </LiquidCard>
              ))}
            </View>
          </>
        ) : null}

        {activeTab === 'settings' ? (
          <>
            <ScrollView
              contentContainerStyle={styles.horizontalRail}
              horizontal
              showsHorizontalScrollIndicator={false}>
              {settingsGroups.map((group) => {
                const selected = group === settingsGroup;
                return (
                  <Pressable key={group} onPress={() => setSettingsGroup(group)}>
                    <LiquidCard
                      style={[styles.groupChip, selected && styles.groupChipActive]}
                      tintColor={selected ? 'rgba(255,255,255,0.84)' : 'rgba(255,255,255,0.7)'}>
                      <Text style={[styles.groupChipText, selected && styles.groupChipTextActive]}>
                        {group}
                      </Text>
                    </LiquidCard>
                  </Pressable>
                );
              })}
            </ScrollView>

            <NativeQuickControls
              metrics={[
                { label: 'Current group', value: settingsGroup },
                { label: 'Sections', value: `${settingsItems.filter((item) => item.group === settingsGroup).length}` },
                { label: 'Bridge', value: pebble.supported ? 'Ready' : 'Unavailable' },
              ]}
              toggles={[
                {
                  key: 'weather-sync',
                  label: 'Weather mirroring',
                  value: weatherMirroring,
                  onValueChange: setWeatherMirroring,
                },
                {
                  key: 'calendar-sync',
                  label: 'Calendar mirroring',
                  value: calendarMirroring,
                  onValueChange: setCalendarMirroring,
                },
              ]}
            />

            <View style={styles.stackList}>
              {settingsItems
                .filter((item) => item.group === settingsGroup)
                .map((item) => (
                  <LiquidCard
                    key={item.id}
                    style={styles.settingCard}
                    tintColor="rgba(255,255,255,0.72)">
                    <View style={styles.settingRow}>
                      <View style={styles.settingIcon}>
                        <Ionicons color={ui.ink} name={settingIcon(item)} size={18} />
                      </View>
                      <View style={{ flex: 1, gap: 2 }}>
                        <Text style={styles.settingTitle}>{item.title}</Text>
                        <Text style={styles.settingBody}>{item.description}</Text>
                      </View>
                      {item.badge ? <StatusChip label={item.badge} tone="warm" /> : null}
                    </View>
                  </LiquidCard>
                ))}
            </View>
          </>
        ) : null}
      </ScrollView>

      <View style={[styles.dockWrap, { bottom: insets.bottom + 14 }]}>
        <LiquidCard style={styles.dockCard} tintColor="rgba(255,255,255,0.84)">
          <GlassGroup style={styles.dockRow}>
            {dockTabs.map((tab) => (
              <Pressable key={tab.id} onPress={() => setActiveTab(tab.id)} style={styles.dockItem}>
                <View style={[styles.dockPill, activeTab === tab.id && styles.dockPillActive]}>
                  {glassAvailable ? (
                    <GlassView
                      pointerEvents="none"
                      style={StyleSheet.absoluteFill}
                      glassEffectStyle={activeTab === tab.id ? 'regular' : 'clear'}
                      tintColor={activeTab === tab.id ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.2)'}
                    />
                  ) : null}
                  <MaterialCommunityIcons
                    color={activeTab === tab.id ? ui.ink : ui.inkSoft}
                    name={tab.icon}
                    size={18}
                  />
                  <Text style={[styles.dockLabel, activeTab === tab.id && styles.dockLabelActive]}>
                    {tab.label}
                  </Text>
                </View>
              </Pressable>
            ))}
          </GlassGroup>
        </LiquidCard>
      </View>
    </View>
  );
}

function LiquidCard({
  children,
  style,
  tintColor = 'rgba(255,255,255,0.78)',
}: {
  children: ReactNode;
  style?: object;
  tintColor?: string;
}) {
  return (
    <View style={[styles.cardShell, style]}>
      {glassAvailable ? (
        <GlassView
          pointerEvents="none"
          style={StyleSheet.absoluteFill}
          glassEffectStyle="regular"
          tintColor={tintColor}
        />
      ) : null}
      <LinearGradient
        colors={
          glassAvailable
            ? ['rgba(255,255,255,0.34)', 'rgba(255,255,255,0.08)']
            : ['rgba(255,255,255,0.92)', 'rgba(245,247,252,0.9)']
        }
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.cardStroke} pointerEvents="none" />
      {children}
    </View>
  );
}

function GlassGroup({
  children,
  style,
}: {
  children: ReactNode;
  style?: object;
}) {
  if (glassAvailable) {
    return <GlassContainer spacing={12} style={style}>{children}</GlassContainer>;
  }
  return <View style={style}>{children}</View>;
}

function ActionButton({
  icon,
  label,
  onPress,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  onPress?: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.actionButton}>
      {glassAvailable ? (
        <GlassView
          pointerEvents="none"
          style={StyleSheet.absoluteFill}
          glassEffectStyle="clear"
          tintColor="rgba(255,255,255,0.26)"
        />
      ) : null}
      <Ionicons color={ui.ink} name={icon} size={16} />
      <Text style={styles.actionLabel}>{label}</Text>
    </Pressable>
  );
}

function StatusChip({
  label,
  tone = 'default',
}: {
  label: string;
  tone?: 'default' | 'accent' | 'mint' | 'warm';
}) {
  const backgroundColor =
    tone === 'accent'
      ? 'rgba(37,107,255,0.12)'
      : tone === 'mint'
        ? 'rgba(91,201,180,0.14)'
        : tone === 'warm'
          ? 'rgba(255,140,104,0.14)'
          : 'rgba(19,33,53,0.06)';
  const color =
    tone === 'accent' ? ui.accent : tone === 'mint' ? ui.mint : tone === 'warm' ? ui.warm : ui.inkMuted;

  return (
    <View style={[styles.chip, { backgroundColor }]}>
      <Text style={[styles.chipText, { color }]}>{label}</Text>
    </View>
  );
}

function Banner({
  icon,
  title,
  body,
  tone,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  body: string;
  tone: 'warm' | 'cool';
}) {
  return (
    <LiquidCard
      style={styles.bannerCard}
      tintColor={tone === 'warm' ? 'rgba(255,240,234,0.84)' : 'rgba(240,247,255,0.84)'}>
      <View style={styles.bannerRow}>
        <View style={[styles.bannerIcon, { backgroundColor: tone === 'warm' ? 'rgba(255,140,104,0.14)' : 'rgba(37,107,255,0.12)' }]}>
          <Ionicons color={tone === 'warm' ? ui.warm : ui.accent} name={icon} size={16} />
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={styles.bannerTitle}>{title}</Text>
          <Text style={styles.bannerBody}>{body}</Text>
        </View>
      </View>
    </LiquidCard>
  );
}

function NativeQuickControls({
  metrics,
  toggles,
}: {
  metrics: Array<{ label: string; value: string }>;
  toggles: Array<{
    key: string;
    label: string;
    value: boolean;
    onValueChange: (value: boolean) => void;
  }>;
}) {
  return (
    <LiquidCard style={styles.nativeCard} tintColor="rgba(255,255,255,0.8)">
      <Host matchContents style={{ width: '100%' }}>
        <VStack spacing={12} modifiers={[padding({ all: 18 })]}>
          <SwiftText modifiers={[foregroundStyle(ui.ink)]}>Native quick controls</SwiftText>
          {metrics.map((metric) => (
            <HStack key={metric.label} spacing={12}>
              <SwiftText modifiers={[foregroundStyle(ui.inkMuted)]}>{metric.label}</SwiftText>
              <SwiftText modifiers={[foregroundStyle(ui.ink)]}>{metric.value}</SwiftText>
            </HStack>
          ))}
          {toggles.map((toggle) => (
            <SwiftSwitch
              key={toggle.key}
              color={ui.accent}
              label={toggle.label}
              onValueChange={toggle.onValueChange}
              value={toggle.value}
            />
          ))}
        </VStack>
      </Host>
    </LiquidCard>
  );
}

function WatchCanvas({
  variant,
  compact = false,
}: {
  variant: 'retro' | 'utility' | 'archive' | 'illustrated';
  compact?: boolean;
}) {
  return (
    <LinearGradient
      colors={
        variant === 'retro'
          ? ['#17243A', '#36558C']
          : variant === 'utility'
            ? ['#13362F', '#1F6B5F']
            : variant === 'archive'
              ? ['#2D2440', '#5A3C83']
              : ['#43312C', '#B87467']
      }
      style={[styles.canvasFrame, compact && styles.canvasFrameCompact]}>
      {variant === 'retro' ? (
        <View style={styles.canvasRetro}>
          <Text style={styles.canvasTime}>11:38</Text>
          <View style={styles.canvasBars}>
            <View style={[styles.canvasBar, { width: 18 }]} />
            <View style={[styles.canvasBar, { width: 28 }]} />
            <View style={[styles.canvasBar, { width: 12 }]} />
          </View>
        </View>
      ) : null}
      {variant === 'utility' ? (
        <View style={styles.canvasUtility}>
          <View style={styles.utilityRing} />
          <Text style={styles.canvasMono}>CORE</Text>
        </View>
      ) : null}
      {variant === 'archive' ? (
        <View style={styles.canvasArchive}>
          <Text style={styles.archiveBig}>07</Text>
          <Text style={styles.archiveSmall}>archive mode</Text>
        </View>
      ) : null}
      {variant === 'illustrated' ? (
        <View style={styles.canvasIllustrated}>
          <View style={styles.illustratedSun} />
          <View style={styles.illustratedHill} />
        </View>
      ) : null}
    </LinearGradient>
  );
}

function WatchMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View style={styles.watchMetric}>
      <Text style={styles.watchMetricLabel}>{label}</Text>
      <Text numberOfLines={1} style={styles.watchMetricValue}>
        {value}
      </Text>
    </View>
  );
}

function selectPrimaryWatch(watches: PebbleWatch[]): PebbleWatch | null {
  return (
    watches.find((watch) => watch.kind === 'connected') ??
    watches.find((watch) => watch.kind === 'connecting') ??
    watches[0] ??
    null
  );
}

function fallbackWatchLabel(supported: boolean, initializing: boolean): string {
  if (initializing) {
    return 'Warming up the bridge';
  }
  if (!supported) {
    return 'Native bridge unavailable';
  }
  return 'No watch detected';
}

function isConnectedWatch(watch: PebbleWatch | null): boolean {
  return watch?.kind === 'connected' || watch?.kind === 'connecting';
}

function watchStatusLabel(
  watch: PebbleWatch | null,
  pebble: ReturnType<typeof usePebbleCore>
): string {
  if (!pebble.supported) {
    return 'The iPhone build is running, but the native Pebble bridge is not ready on this device.';
  }
  if (watch == null) {
    return pebble.state.scanning
      ? 'Scanning for Pebbles and Core watches right now.'
      : 'Ready for discovery once permissions and Bluetooth are in place.';
  }
  return watchKindLabel(watch);
}

function watchBatteryLabel(
  watch: PebbleWatch | null,
  pebble: ReturnType<typeof usePebbleCore>
): string {
  if (watch?.batteryLevel != null) {
    return `${watch.batteryLevel}%`;
  }
  return pebble.permissionStatus === 'granted' ? 'Ready' : 'Setup';
}

function watchFirmwareLine(
  watch: PebbleWatch | null,
  pebble: ReturnType<typeof usePebbleCore>
): string {
  if (watch == null) {
    return pebble.supported
      ? 'The live iPhone companion is ready to discover and connect to real hardware.'
      : 'The native Pebble runtime has not started yet.';
  }
  const firmware = watch.firmware ?? 'Firmware pending';
  const serial = watch.serial ? ` • ${watch.serial}` : '';
  return `${firmware}${serial}`;
}

function watchKindLabel(watch: PebbleWatch): string {
  if (watch.kind === 'connected') return 'Connected and active';
  if (watch.kind === 'connecting') return watch.negotiating ? 'Negotiating session' : 'Connecting';
  if (watch.kind === 'disconnecting') return 'Disconnecting';
  if (watch.kind === 'discovered') return watch.rssi != null ? `Nearby • RSSI ${watch.rssi}` : 'Nearby';
  if (watch.kind === 'known') return 'Known device';
  return 'Unknown state';
}

function formatBluetoothState(bluetoothState: string): string {
  const normalized = bluetoothState.toLowerCase();
  if (normalized === 'enabled' || normalized === 'available') return 'Enabled';
  if (normalized === 'disabled' || normalized === 'unavailable') return 'Disabled';
  return bluetoothState;
}

function watchFirmwareValue(watch: PebbleWatch): string {
  return watch.firmware ?? watch.watchInfoName ?? 'Pending';
}

function formatWatchPlatform(watch: PebbleWatch): string {
  return watch.watchInfoName ?? watch.watchType ?? watch.watchInfoPlatform ?? 'Unknown';
}

function permissionBadge(permissionStatus: 'unknown' | 'granted' | 'denied'): string {
  if (permissionStatus === 'granted') return 'Granted';
  if (permissionStatus === 'denied') return 'Needs setup';
  return 'Pending';
}

function formatConnectionEvent(event: PebbleConnectionEventPayload): string {
  return event.type === 'connected'
    ? `${event.device?.displayName ?? event.identifier} connected.`
    : `${event.identifier} disconnected.`;
}

function settingIcon(item: SettingsItem): React.ComponentProps<typeof Ionicons>['name'] {
  if (item.id === 'about') return 'information-circle-outline';
  if (item.id === 'support') return 'help-buoy-outline';
  if (item.id === 'calendar') return 'calendar-outline';
  if (item.id === 'weather') return 'cloud-outline';
  if (item.id === 'speech') return 'mic-outline';
  if (item.id === 'apps') return 'grid-outline';
  if (item.id === 'display') return 'contrast-outline';
  if (item.id === 'timeline') return 'time-outline';
  if (item.id === 'music') return 'musical-notes-outline';
  if (item.id === 'diagnostics') return 'bug-outline';
  if (item.id === 'filters') return 'filter-outline';
  if (item.id === 'quiet-time') return 'moon-outline';
  return 'notifications-outline';
}

function todayLabel() {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(new Date());
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#EEF4FC',
  },
  content: {
    gap: 16,
    paddingHorizontal: 18,
  },
  topBloom: {
    position: 'absolute',
    top: -120,
    right: -80,
    width: 320,
    height: 320,
    borderRadius: 160,
  },
  bottomBloom: {
    position: 'absolute',
    bottom: -160,
    left: -120,
    width: 320,
    height: 320,
    borderRadius: 160,
  },
  floatOrbLeft: {
    position: 'absolute',
    top: 170,
    left: -42,
    width: 144,
    height: 144,
    borderRadius: 72,
    backgroundColor: 'rgba(255,255,255,0.28)',
  },
  floatOrbRight: {
    position: 'absolute',
    top: 380,
    right: -36,
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: 'rgba(132,184,255,0.18)',
  },
  topRow: {
    flexDirection: 'row',
    gap: 12,
  },
  brandCard: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  brandRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  brandLogo: {
    height: 26,
    tintColor: ui.ink,
    width: 26,
  },
  brandLabel: {
    color: ui.ink,
    fontSize: 15,
    fontWeight: '700',
  },
  brandMeta: {
    color: ui.inkMuted,
    fontSize: 12,
    fontWeight: '500',
  },
  statusBubble: {
    justifyContent: 'center',
    minWidth: 110,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  statusBubbleLabel: {
    color: ui.inkSoft,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  statusBubbleValue: {
    color: ui.ink,
    fontSize: 15,
    fontWeight: '700',
  },
  cardShell: {
    borderColor: ui.line,
    borderRadius: 28,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: ui.shadow,
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 1,
    shadowRadius: 30,
  },
  cardStroke: {
    ...StyleSheet.absoluteFillObject,
    borderColor: ui.lineStrong,
    borderRadius: 28,
    borderWidth: StyleSheet.hairlineWidth,
  },
  bannerCard: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  bannerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  bannerIcon: {
    alignItems: 'center',
    borderRadius: 16,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  bannerTitle: {
    color: ui.ink,
    fontSize: 13,
    fontWeight: '700',
  },
  bannerBody: {
    color: ui.inkMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  heroCard: {
    padding: 18,
  },
  heroLayout: {
    flexDirection: 'row',
    gap: 16,
  },
  heroCopy: {
    flex: 1,
    gap: 12,
    justifyContent: 'space-between',
  },
  heroEyebrow: {
    color: ui.inkSoft,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  heroTitle: {
    color: ui.ink,
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -1.2,
  },
  heroBody: {
    color: ui.inkMuted,
    fontSize: 15,
    lineHeight: 21,
  },
  heroChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  heroActionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    alignItems: 'center',
    borderColor: 'rgba(255,255,255,0.6)',
    borderRadius: 22,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    minHeight: 42,
    paddingHorizontal: 14,
  },
  actionLabel: {
    color: ui.ink,
    fontSize: 13,
    fontWeight: '700',
  },
  watchStage: {
    alignItems: 'center',
    flexBasis: 156,
    gap: 12,
    justifyContent: 'center',
  },
  watchHalo: {
    height: 176,
    left: 2,
    position: 'absolute',
    top: 8,
    width: 176,
    borderRadius: 88,
  },
  watchBody: {
    alignItems: 'center',
    height: 210,
    justifyContent: 'center',
    width: 156,
  },
  watchFrame: {
    backgroundColor: 'rgba(14, 25, 42, 0.96)',
    borderColor: 'rgba(255,255,255,0.82)',
    borderRadius: 34,
    borderWidth: 4,
    height: 170,
    justifyContent: 'center',
    padding: 10,
    shadowColor: 'rgba(14, 25, 42, 0.28)',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 1,
    shadowRadius: 18,
    width: 124,
  },
  watchMetricsRow: {
    gap: 8,
    width: '100%',
  },
  watchMetric: {
    backgroundColor: 'rgba(255,255,255,0.34)',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  watchMetricLabel: {
    color: ui.inkSoft,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  watchMetricValue: {
    color: ui.ink,
    fontSize: 13,
    fontWeight: '600',
  },
  sceneHeader: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: 18,
  },
  sceneCaption: {
    color: ui.inkMuted,
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'right',
  },
  sectionEyebrow: {
    color: ui.inkSoft,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  sectionTitle: {
    color: ui.ink,
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.8,
  },
  twoUp: {
    flexDirection: 'row',
    gap: 12,
  },
  infoCard: {
    flex: 1,
    minHeight: 104,
    padding: 16,
  },
  infoLabel: {
    color: ui.inkSoft,
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  infoValue: {
    color: ui.ink,
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
  },
  nativeCard: {
    paddingVertical: 2,
  },
  stackList: {
    gap: 12,
  },
  stackCard: {
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  stackRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  stackIcon: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.42)',
    borderRadius: 18,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  stackTitle: {
    color: ui.ink,
    fontSize: 15,
    fontWeight: '700',
  },
  stackSubtitle: {
    color: ui.inkMuted,
    fontSize: 13,
  },
  stackMeta: {
    color: ui.inkSoft,
    fontSize: 12,
    fontWeight: '600',
  },
  emptyCard: {
    paddingHorizontal: 16,
    paddingVertical: 18,
  },
  emptyText: {
    color: ui.inkMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  horizontalRail: {
    gap: 12,
    paddingRight: 8,
  },
  faceCard: {
    padding: 16,
    width: 218,
  },
  faceCardLead: {
    width: 246,
  },
  faceTopRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  faceCount: {
    color: ui.inkSoft,
    fontSize: 12,
    fontWeight: '600',
  },
  facePreviewWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    minHeight: 150,
  },
  faceName: {
    color: ui.ink,
    fontSize: 18,
    fontWeight: '700',
  },
  faceAuthor: {
    color: ui.inkMuted,
    fontSize: 13,
    marginTop: 4,
  },
  spotlightCard: {
    padding: 18,
  },
  spotlightTitle: {
    color: ui.ink,
    fontSize: 22,
    fontWeight: '700',
    marginTop: 6,
  },
  spotlightBody: {
    color: ui.inkMuted,
    fontSize: 15,
    lineHeight: 21,
    marginTop: 8,
  },
  appCard: {
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  appRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  appIconShell: {
    alignItems: 'center',
    borderRadius: 22,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  appIconLetter: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  appTitle: {
    color: ui.ink,
    fontSize: 15,
    fontWeight: '700',
  },
  appSubtitle: {
    color: ui.inkMuted,
    fontSize: 13,
  },
  inlineChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  appDeveloper: {
    color: ui.inkSoft,
    fontSize: 12,
    fontWeight: '600',
    maxWidth: 72,
    textAlign: 'right',
  },
  alertCard: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  alertRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  alertDot: {
    borderRadius: 9,
    height: 18,
    width: 18,
  },
  alertName: {
    color: ui.ink,
    fontSize: 15,
    fontWeight: '700',
  },
  alertSource: {
    color: ui.inkMuted,
    fontSize: 13,
  },
  alertCount: {
    color: ui.inkSoft,
    fontSize: 14,
    fontWeight: '700',
    width: 24,
    textAlign: 'center',
  },
  groupChip: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  groupChipActive: {
    transform: [{ translateY: -1 }],
  },
  groupChipText: {
    color: ui.inkMuted,
    fontSize: 14,
    fontWeight: '700',
  },
  groupChipTextActive: {
    color: ui.ink,
  },
  settingCard: {
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  settingRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  settingIcon: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.42)',
    borderRadius: 18,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  settingTitle: {
    color: ui.ink,
    fontSize: 15,
    fontWeight: '700',
  },
  settingBody: {
    color: ui.inkMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  dockWrap: {
    left: 18,
    position: 'absolute',
    right: 18,
  },
  dockCard: {
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  dockRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
  },
  dockItem: {
    flex: 1,
  },
  dockPill: {
    alignItems: 'center',
    borderColor: 'rgba(255,255,255,0.52)',
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
    minHeight: 58,
    justifyContent: 'center',
    overflow: 'hidden',
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  dockPillActive: {
    backgroundColor: 'rgba(255,255,255,0.28)',
    transform: [{ translateY: -2 }],
  },
  dockLabel: {
    color: ui.inkSoft,
    fontSize: 11,
    fontWeight: '700',
  },
  dockLabelActive: {
    color: ui.ink,
  },
  canvasFrame: {
    alignItems: 'center',
    borderRadius: 24,
    height: 134,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 96,
  },
  canvasFrameCompact: {
    height: 118,
    width: 84,
  },
  canvasRetro: {
    alignItems: 'center',
    gap: 12,
  },
  canvasTime: {
    color: '#EAF4FF',
    fontFamily: 'IBMPlexMono_500Medium',
    fontSize: 20,
  },
  canvasBars: {
    gap: 5,
  },
  canvasBar: {
    backgroundColor: '#EAF4FF',
    borderRadius: 999,
    height: 5,
  },
  canvasUtility: {
    alignItems: 'center',
    gap: 12,
  },
  utilityRing: {
    borderColor: '#CBFFF0',
    borderRadius: 26,
    borderWidth: 4,
    height: 52,
    width: 52,
  },
  canvasMono: {
    color: '#CBFFF0',
    fontFamily: 'IBMPlexMono_500Medium',
    fontSize: 13,
  },
  canvasArchive: {
    alignItems: 'center',
  },
  archiveBig: {
    color: '#FAEBFF',
    fontFamily: 'IBMPlexMono_500Medium',
    fontSize: 28,
  },
  archiveSmall: {
    color: '#E3C8FF',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.9,
    textTransform: 'uppercase',
  },
  canvasIllustrated: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    width: '100%',
    flex: 1,
  },
  illustratedSun: {
    backgroundColor: '#FFD6A6',
    borderRadius: 12,
    height: 24,
    marginBottom: 10,
    width: 24,
  },
  illustratedHill: {
    backgroundColor: '#FFE9E2',
    borderTopLeftRadius: 34,
    borderTopRightRadius: 34,
    height: 38,
    width: '82%',
  },
});
