import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import {
  Image,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';

import { BottomTabs, DetailSheet, InfoPill, MiniStat, ScreenHeader, SectionTitle, SegmentedControl, ActionFab, AppFrame, GlassSurface, TabDescriptor } from './components';
import { NativeOverviewPanel } from './NativeOverviewPanel';
import {
  lockerApps,
  notificationAppsSeed,
  NotificationApp,
  settingsGroups,
  settingsItems,
  SettingsItem,
  TabId,
  watchFaces,
} from './data';
import { fonts, gradients, palette, radius, spacing } from './theme';
import { usePebbleCore } from './usePebbleCore';
import type { PebbleConnectionEventPayload, PebbleWatch } from '../modules/pebble-core-native';

const tabs: TabDescriptor[] = [
  { id: 'faces', label: 'Faces', icon: 'watch-variant' },
  { id: 'apps', label: 'Apps', icon: 'apps-box' },
  { id: 'devices', label: 'Devices', icon: 'watch' },
  { id: 'notifications', label: 'Alerts', icon: 'bell-outline' },
  { id: 'settings', label: 'Settings', icon: 'tune-variant' },
];

const pebbleLogo = require('../assets/branding/pebble-logo.png');

export default function AppShell() {
  const pebble = usePebbleCore();
  const [activeTab, setActiveTab] = useState<TabId>('faces');
  const [notificationApps, setNotificationApps] = useState<NotificationApp[]>(notificationAppsSeed);
  const [settingsGroup, setSettingsGroup] = useState<(typeof settingsGroups)[number]>('Phone');
  const [quietTimeEnabled, setQuietTimeEnabled] = useState(true);
  const [weatherSyncEnabled, setWeatherSyncEnabled] = useState(true);
  const [nightlySnapshots, setNightlySnapshots] = useState(false);
  const [callsEnabled, setCallsEnabled] = useState(true);
  const [messagesEnabled, setMessagesEnabled] = useState(true);
  const [calendarEnabled, setCalendarEnabled] = useState(true);
  const [selectedFaceId, setSelectedFaceId] = useState<string | null>(null);
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const [selectedNotificationId, setSelectedNotificationId] = useState<string | null>(null);
  const [selectedSettingId, setSelectedSettingId] = useState<string | null>(null);
  const [debugSheetVisible, setDebugSheetVisible] = useState(false);

  const activeFace = watchFaces.find((face) => face.id === selectedFaceId) ?? null;
  const activeApp = lockerApps.find((app) => app.id === selectedAppId) ?? null;
  const activeNotification = notificationApps.find((item) => item.id === selectedNotificationId) ?? null;
  const activeSetting = settingsItems.find((item) => item.id === selectedSettingId) ?? null;
  const primaryWatch = selectPrimaryWatch(pebble.state.watches);
  const secondaryWatches = primaryWatch
    ? pebble.state.watches.filter((watch) => watch.identifier !== primaryWatch.identifier)
    : pebble.state.watches;
  const primaryWatchName = primaryWatch?.displayName ?? fallbackWatchLabel(pebble.supported, pebble.initializing);
  const notificationAccessActionLabel =
    pebble.notificationAccess
      ? 'Refresh native state'
      : Platform.OS === 'ios'
        ? 'Open notification settings'
        : 'Open listener settings';
  const notificationAccessTitle =
    Platform.OS === 'ios'
      ? 'Notification permissions still need to be enabled.'
      : 'Notification listener still needs to be enabled.';
  const notificationAccessBody =
    Platform.OS === 'ios'
      ? 'iPhone builds use Apple notification permissions instead of Android notification listeners. Without alert access, watch connectivity works but notification delivery stays partial.'
      : 'Pebble notification forwarding on Android depends on the native listener service from `libpebble3`. Without it, watch connectivity works but alert delivery will stay partial.';
  const notificationAccessCaption =
    Platform.OS === 'ios'
      ? 'Notification permission status is live from iOS while the detailed routing rows stay in the Expo shell.'
      : 'Notification listener status is live from Android while the detailed routing rows stay in the Expo shell.';

  const headerTitle =
    activeTab === 'faces'
      ? 'Faces'
      : activeTab === 'apps'
        ? 'Apps'
        : activeTab === 'devices'
          ? 'Core Devices'
          : activeTab === 'notifications'
            ? 'Notifications'
            : 'Settings';

  const headerSubtitle =
    activeTab === 'faces'
      ? 'Locker-first watchface browsing with a softer native shell.'
      : activeTab === 'apps'
        ? 'Pinned utilities, locker order, and native settings hooks.'
        : activeTab === 'devices'
          ? 'Live Kotlin watch state bridged into Expo native modules.'
          : activeTab === 'notifications'
            ? 'App-level routing with glanceable alert health.'
            : 'Phone, watch, and notification controls in one grid.';

  const headerActions: React.ComponentProps<typeof ScreenHeader>['actions'] =
    activeTab === 'faces'
      ? [{ icon: 'cloud-upload-outline' }, { icon: 'search-outline' }]
      : activeTab === 'apps'
        ? [{ icon: 'download-outline' }, { icon: 'search-outline' }]
        : activeTab === 'devices'
          ? [
              {
                icon: pebble.state.scanning ? 'stop-circle-outline' : 'scan-outline',
                onPress: () => {
                  void pebble.toggleScan();
                },
              },
              {
                icon: 'refresh-outline',
                onPress: () => {
                  void pebble.refreshState();
                },
              },
            ]
          : activeTab === 'notifications'
            ? [{ icon: 'filter-outline' }, { icon: 'search-outline' }]
            : [{ icon: 'help-circle-outline' }, { icon: 'sparkles-outline' }];

  function toggleNotification(id: string, enabled: boolean) {
    setNotificationApps((current) =>
      current.map((item) => (item.id === id ? { ...item, enabled } : item))
    );
  }

  async function openDebugSheet() {
    await pebble.loadDebugState();
    setDebugSheetVisible(true);
  }

  return (
    <AppFrame>
      <View style={styles.root}>
        <ScreenHeader
          title={headerTitle}
          subtitle={headerSubtitle}
          actions={headerActions}
          onBrandPress={() => setActiveTab('settings')}
        />
        <View style={styles.body}>{renderScreen()}</View>
        <BottomTabs tabs={tabs} activeTab={activeTab} onSelect={setActiveTab} />
      </View>
      <DetailSheet visible={!!activeFace} title={activeFace?.name ?? ''} onClose={() => setSelectedFaceId(null)}>
        {activeFace ? (
          <>
            <View style={[styles.previewPanel, { minHeight: 220 }]}>
              <WatchFacePreview faceId={activeFace.id} variant={activeFace.style} large />
            </View>
            <View style={styles.sheetPills}>
              <InfoPill label={activeFace.companion} tone="accent" />
              <InfoPill label={`${activeFace.complications} complications`} />
            </View>
            <Text style={styles.sheetBodyText}>
              Built to echo the current Core Devices locker flow: large preview first, immediate install state, and secondary controls kept off the main grid until needed.
            </Text>
            <View style={styles.sheetActionsRow}>
              <SheetButton label="Set on Core 4B3F" primary />
              <SheetButton label="Open complications" />
            </View>
          </>
        ) : null}
      </DetailSheet>
      <DetailSheet visible={!!activeApp} title={activeApp?.name ?? ''} onClose={() => setSelectedAppId(null)}>
        {activeApp ? (
          <>
            <View style={styles.sheetIconRow}>
              <View style={[styles.appIcon, { backgroundColor: activeApp.tint }]}>
                <Text style={styles.appIconText}>{activeApp.name.slice(0, 1)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.sheetEyebrow}>{activeApp.developer}</Text>
                <Text style={styles.sheetBodyText}>{activeApp.subtitle}</Text>
              </View>
            </View>
            <View style={styles.sheetPills}>
              <InfoPill label={activeApp.state} tone="accent" />
              {activeApp.timeline ? <InfoPill label="Timeline" tone="success" /> : null}
              {activeApp.hasSettings ? <InfoPill label="Has settings" /> : null}
            </View>
            <View style={styles.sheetStats}>
              <MiniStat label="Queue" value="Synced" />
              <MiniStat label="Order" value="Top 8" />
            </View>
            <View style={styles.sheetActionsRow}>
              <SheetButton label="Open settings" primary={!!activeApp.hasSettings} />
              <SheetButton label="Move to top" />
            </View>
          </>
        ) : null}
      </DetailSheet>
      <DetailSheet
        visible={!!activeNotification}
        title={activeNotification?.name ?? ''}
        onClose={() => setSelectedNotificationId(null)}>
        {activeNotification ? (
          <>
            <Text style={styles.sheetEyebrow}>{activeNotification.source}</Text>
            <Text style={styles.sheetBodyText}>
              This rebuild keeps the original app’s app-by-app notification routing but moves the verbose controls into a glass detail sheet.
            </Text>
            <View style={styles.sheetStats}>
              <MiniStat label="Unread" value={`${activeNotification.alerts}`} />
              <MiniStat label="Status" value={activeNotification.enabled ? 'Enabled' : 'Muted'} />
            </View>
            <View style={styles.toggleSheetRow}>
              <Text style={styles.toggleSheetLabel}>Send to watch</Text>
              <Switch
                thumbColor={activeNotification.enabled ? palette.text : '#E5E0E9'}
                trackColor={{ false: 'rgba(255,255,255,0.18)', true: palette.accent }}
                value={activeNotification.enabled}
                onValueChange={(value) => toggleNotification(activeNotification.id, value)}
              />
            </View>
          </>
        ) : null}
      </DetailSheet>
      <DetailSheet visible={!!activeSetting} title={activeSetting?.title ?? ''} onClose={() => setSelectedSettingId(null)}>
        {activeSetting ? (
          <>
            <Text style={styles.sheetEyebrow}>{activeSetting.group}</Text>
            <Text style={styles.sheetBodyText}>{activeSetting.description}</Text>
            <View style={styles.sheetPills}>
              {activeSetting.badge ? <InfoPill label={`${activeSetting.badge} pending`} tone="warning" /> : null}
              <InfoPill label="Expo rebuild" />
              <InfoPill label="Core parity target" tone="accent" />
            </View>
            <View style={styles.sheetActionsRow}>
              <SheetButton label="Open section" primary />
              <SheetButton label="Mark reviewed" />
            </View>
          </>
        ) : null}
      </DetailSheet>
      <DetailSheet visible={debugSheetVisible} title="Native Debug State" onClose={() => setDebugSheetVisible(false)}>
        <Text style={styles.sheetEyebrow}>libpebble3</Text>
        <Text style={styles.debugText}>{pebble.debugState ?? 'Debug state not loaded yet.'}</Text>
      </DetailSheet>
    </AppFrame>
  );

  function renderScreen() {
    if (activeTab === 'faces') {
      return (
        <View style={styles.screen}>
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <GlassSurface style={styles.heroCard}>
              <View style={styles.heroTop}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.heroLabel}>Locker Sync</Text>
                  <Text style={styles.heroTitle}>Watchfaces stay visual first.</Text>
                  <Text style={styles.heroBody}>
                    The original grid is preserved, but each card now floats inside a softer layered shell with room for companion status and install intent.
                  </Text>
                </View>
                <View style={styles.heroPills}>
                  <InfoPill label={primaryWatchName} tone="accent" />
                  <InfoPill label={`${watchFaces.length} faces`} />
                </View>
              </View>
              <View style={styles.heroStats}>
                <MiniStat label="Active face" value="Brick Neon" />
                <MiniStat label="Recently used" value="91 Dub" />
              </View>
            </GlassSurface>
            <SectionTitle eyebrow="Locker" title="Installed Faces" actionLabel="Last used" />
            <View style={styles.faceGrid}>
              {watchFaces.map((face) => (
                <Pressable key={face.id} onPress={() => setSelectedFaceId(face.id)} style={styles.faceCardWrap}>
                  <GlassSurface style={styles.faceCard}>
                    <View style={styles.facePreviewShell}>
                      <WatchFacePreview faceId={face.id} variant={face.style} />
                    </View>
                    <View style={styles.faceMeta}>
                      <Text style={styles.faceName}>{face.name}</Text>
                      <Text style={styles.faceAuthor}>{face.author}</Text>
                      <View style={styles.facePills}>
                        <InfoPill label={face.companion} tone={face.companion === 'Installed' ? 'success' : 'default'} />
                      </View>
                    </View>
                  </GlassSurface>
                </Pressable>
              ))}
            </View>
          </ScrollView>
          <ActionFab />
        </View>
      );
    }

    if (activeTab === 'apps') {
      return (
        <View style={styles.screen}>
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <SectionTitle eyebrow="Locker" title="Pinned Apps" actionLabel="Sync order" />
            <GlassSurface style={styles.heroCard}>
              <View style={styles.heroTop}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.heroLabel}>Companion Apps</Text>
                  <Text style={styles.heroTitle}>The locker becomes a living dock.</Text>
                  <Text style={styles.heroBody}>
                    Rows remain recognizably Pebble, but the controls are spaced for thumb travel and settings affordances stay visible without crowding the list.
                  </Text>
                </View>
                <View style={styles.heroPills}>
                  <InfoPill label="Timeline-ready" tone="success" />
                  <InfoPill label="52 apps" />
                </View>
              </View>
            </GlassSurface>
            <View style={styles.stack}>
              {lockerApps.map((app) => (
                <Pressable key={app.id} onPress={() => setSelectedAppId(app.id)}>
                  <GlassSurface style={styles.listCard}>
                    <View style={styles.listRow}>
                      <View style={[styles.appIcon, { backgroundColor: app.tint }]}>
                        <Text style={styles.appIconText}>{app.name.slice(0, 1)}</Text>
                      </View>
                      <View style={styles.listTextBlock}>
                        <Text style={styles.listTitle}>{app.name}</Text>
                        <Text style={styles.listSubtitle}>{app.developer}</Text>
                        <Text style={styles.listBody}>{app.subtitle}</Text>
                      </View>
                      <View style={styles.listActions}>
                        <InfoPill label={app.state} tone={app.state === 'Pinned' ? 'accent' : 'default'} />
                        {app.hasSettings ? (
                          <Ionicons color={palette.textMuted} name="settings-outline" size={18} />
                        ) : (
                          <Ionicons color={palette.textSoft} name="chevron-forward" size={18} />
                        )}
                      </View>
                    </View>
                  </GlassSurface>
                </Pressable>
              ))}
            </View>
          </ScrollView>
          <ActionFab />
        </View>
      );
    }

    if (activeTab === 'devices') {
      return (
        <View style={styles.screen}>
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <SectionTitle
              eyebrow="Connection"
              title={primaryWatch ? 'Primary Watch' : 'Watch Bridge'}
              actionLabel={pebble.state.scanning ? 'Stop scan' : 'Start scan'}
              onActionPress={() => {
                void pebble.toggleScan();
              }}
            />
            <GlassSurface style={styles.deviceHero}>
              <View style={styles.deviceHeader}>
                <View>
                  <Text style={styles.deviceName}>{primaryWatchName}</Text>
                  <Text style={styles.deviceState}>{watchStatusLabel(primaryWatch, pebble)}</Text>
                </View>
                <InfoPill
                  label={watchBatteryLabel(primaryWatch, pebble)}
                  tone={primaryWatch ? 'accent' : pebble.permissionStatus === 'granted' ? 'success' : 'warning'}
                />
              </View>
              <Text style={styles.deviceFirmware}>{watchFirmwareLine(primaryWatch, pebble)}</Text>
              <View style={styles.heroStats}>
                <MiniStat label="Bluetooth" value={formatBluetoothState(pebble.state.bluetooth)} />
                <MiniStat label="Scan" value={pebble.state.scanning ? 'Searching' : 'Idle'} />
                <MiniStat label="Listener" value={pebble.notificationAccess ? 'Ready' : 'Needs access'} />
              </View>
              <View style={styles.ctaRow}>
                {primaryWatch ? (
                  <>
                    <SheetButton
                      label={isConnectedWatch(primaryWatch) ? 'Disconnect' : 'Connect'}
                      onPress={() => {
                        if (isConnectedWatch(primaryWatch)) {
                          void pebble.disconnect(primaryWatch.identifier);
                        } else {
                          void pebble.connect(primaryWatch.identifier);
                        }
                      }}
                      primary
                    />
                    <SheetButton
                      label="Forget"
                      onPress={() => {
                        void pebble.forget(primaryWatch.identifier);
                      }}
                    />
                    <SheetButton
                      label="Debug"
                      onPress={() => {
                        void openDebugSheet();
                      }}
                    />
                  </>
                ) : (
                  <>
                    <SheetButton
                      label={pebble.permissionStatus === 'granted' ? 'Scan nearby' : 'Grant access'}
                      onPress={() => {
                        if (pebble.permissionStatus === 'granted') {
                          void pebble.toggleScan(true);
                        } else {
                          void pebble.requestAccess();
                        }
                      }}
                      primary
                    />
                    <SheetButton
                      label="App settings"
                      onPress={() => {
                        void Linking.openSettings();
                      }}
                    />
                    <SheetButton
                      label="Debug"
                      onPress={() => {
                        void openDebugSheet();
                      }}
                    />
                  </>
                )}
              </View>
            </GlassSurface>
            {!pebble.notificationAccess ? (
              <GlassSurface style={styles.statusCard}>
                <Text style={styles.statusTitle}>{notificationAccessTitle}</Text>
                <Text style={styles.statusBody}>{notificationAccessBody}</Text>
                <View style={styles.ctaRow}>
                  <SheetButton
                    label={notificationAccessActionLabel}
                    primary
                    onPress={() => {
                      void pebble.openNotificationAccessSettings();
                    }}
                  />
                  <SheetButton
                    label="App settings"
                    onPress={() => {
                      void Linking.openSettings();
                    }}
                  />
                </View>
              </GlassSurface>
            ) : null}
            {pebble.lastError ? (
              <GlassSurface style={styles.statusCard}>
                <Text style={styles.statusTitle}>Native error</Text>
                <Text style={styles.statusBody}>{pebble.lastError.message}</Text>
              </GlassSurface>
            ) : null}
            {pebble.lastConnectionEvent ? (
              <GlassSurface style={styles.statusCard}>
                <Text style={styles.statusTitle}>Latest watch event</Text>
                <Text style={styles.statusBody}>
                  {formatConnectionEvent(pebble.lastConnectionEvent)}
                </Text>
              </GlassSurface>
            ) : null}
            <NativeOverviewPanel
              title="Native status strip"
              caption="Rendered with Expo UI primitives while the backing state comes from the Kotlin watch stack."
              metrics={primaryWatch
                ? [
                    { label: 'Serial', value: primaryWatch.serial ?? 'Unknown' },
                    { label: 'Platform', value: formatWatchPlatform(primaryWatch) },
                    { label: 'Transport', value: primaryWatch.usingBtClassic ? 'BT classic' : 'BLE' },
                  ]
                : [
                    { label: 'Bluetooth', value: formatBluetoothState(pebble.state.bluetooth) },
                    { label: 'Permissions', value: permissionBadge(pebble.permissionStatus) },
                    { label: 'Discovered', value: `${pebble.state.watches.length}` },
                  ]}
              toggles={[
                {
                  key: 'scan',
                  label: 'Scan for watches',
                  value: pebble.state.scanning,
                  onValueChange: (value) => {
                    void pebble.toggleScan(value);
                  },
                },
                {
                  key: 'nightly',
                  label: 'Nightly snapshots',
                  value: nightlySnapshots,
                  onValueChange: setNightlySnapshots,
                },
              ]}
              actionLabel={notificationAccessActionLabel}
              onActionPress={() => {
                if (pebble.notificationAccess) {
                  void pebble.refreshState();
                } else {
                  void pebble.openNotificationAccessSettings();
                }
              }}
            />
            <SectionTitle eyebrow="Nearby" title="Other Watches" />
            <View style={styles.stack}>
              {secondaryWatches.length > 0 ? (
                secondaryWatches.map((watch) => (
                  <Pressable
                    key={watch.identifier}
                    onPress={() => {
                      if (isConnectedWatch(watch)) {
                        void pebble.disconnect(watch.identifier);
                      } else {
                        void pebble.connect(watch.identifier);
                      }
                    }}>
                    <GlassSurface style={styles.secondaryDevice}>
                      <View style={styles.listRow}>
                        <View style={styles.watchAvatar}>
                          <MaterialCommunityIcons color={palette.text} name="watch-variant" size={20} />
                        </View>
                        <View style={styles.listTextBlock}>
                          <Text style={styles.listTitle}>{watch.displayName}</Text>
                          <Text style={styles.listSubtitle}>{watchKindLabel(watch)}</Text>
                          <Text style={styles.listBody}>{watchFirmwareValue(watch)}</Text>
                        </View>
                        <InfoPill label={isConnectedWatch(watch) ? 'Connected' : 'Tap to connect'} />
                      </View>
                    </GlassSurface>
                  </Pressable>
                ))
              ) : (
                <GlassSurface style={styles.secondaryDevice}>
                  <Text style={styles.listTitle}>No secondary watches are visible yet.</Text>
                  <Text style={styles.listBody}>
                    Start a BLE scan and bonded Pebble or Core devices will appear here with their real
                    Kotlin-backed identifiers.
                  </Text>
                </GlassSurface>
              )}
            </View>
          </ScrollView>
          <ActionFab
            icon={pebble.state.scanning ? 'stop-circle-outline' : 'scan-outline'}
            onPress={() => {
              void pebble.toggleScan();
            }}
          />
        </View>
      );
    }

    if (activeTab === 'notifications') {
      const enabledCount = notificationApps.filter((item) => item.enabled).length;
      return (
        <View style={styles.screen}>
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <GlassSurface style={styles.heroCard}>
              <View style={styles.heroTop}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.heroLabel}>Routing</Text>
                  <Text style={styles.heroTitle}>App-by-app alert control, kept glanceable.</Text>
                  <Text style={styles.heroBody}>
                    The open-source flow is still app centric, but this version surfaces signal quality and mute health before you start digging through rows.
                  </Text>
                </View>
                <View style={styles.heroPills}>
                  <InfoPill label={`${enabledCount} enabled`} tone="success" />
                  <InfoPill label="Focus aware" />
                </View>
              </View>
            </GlassSurface>
            <NativeOverviewPanel
              title="Delivery focus"
              caption={notificationAccessCaption}
              metrics={[
                { label: 'Listener', value: pebble.notificationAccess ? 'Enabled' : 'Needs access' },
                { label: 'Watch link', value: primaryWatchName },
              ]}
              toggles={[
                { key: 'calls', label: 'Calls', value: callsEnabled, onValueChange: setCallsEnabled },
                { key: 'messages', label: 'Messages', value: messagesEnabled, onValueChange: setMessagesEnabled },
                { key: 'calendar', label: 'Calendar', value: calendarEnabled, onValueChange: setCalendarEnabled },
              ]}
              actionLabel={notificationAccessActionLabel}
              onActionPress={() => {
                if (pebble.notificationAccess) {
                  void pebble.refreshState();
                } else {
                  void pebble.openNotificationAccessSettings();
                }
              }}
            />
            <SectionTitle eyebrow="Apps" title="Notification Sources" />
            <View style={styles.stack}>
              {notificationApps.map((item) => (
                <Pressable key={item.id} onPress={() => setSelectedNotificationId(item.id)}>
                  <GlassSurface style={styles.listCard}>
                    <View style={styles.listRow}>
                      <View style={[styles.appIcon, { backgroundColor: item.tint }]}>
                        <Text style={styles.appIconText}>{item.name.slice(0, 1)}</Text>
                      </View>
                      <View style={styles.listTextBlock}>
                        <Text style={styles.listTitle}>{item.name}</Text>
                        <Text style={styles.listSubtitle}>{item.source}</Text>
                      </View>
                      <View style={styles.notificationTrail}>
                        {item.alerts > 0 ? (
                          <View style={styles.alertBadge}>
                            <Text style={styles.alertBadgeText}>{item.alerts}</Text>
                          </View>
                        ) : null}
                        <Switch
                          thumbColor={item.enabled ? palette.text : '#E5E0E9'}
                          trackColor={{ false: 'rgba(255,255,255,0.18)', true: palette.accent }}
                          value={item.enabled}
                          onValueChange={(value) => toggleNotification(item.id, value)}
                        />
                      </View>
                    </View>
                  </GlassSurface>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </View>
      );
    }

    const filteredSettings = settingsItems.filter((item) => item.group === settingsGroup);
    return (
      <View style={styles.screen}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <GlassSurface style={styles.settingsHero}>
            <View style={styles.settingsHeroText}>
              <Text style={styles.heroLabel}>Core Devices</Text>
              <Text style={styles.heroTitle}>Expo rebuild tuned for native polish.</Text>
              <Text style={styles.heroBody}>
                Watch controls, phone defaults, and notification routing are reorganized into large target cards while staying faithful to the original app map.
              </Text>
            </View>
            <Image source={pebbleLogo} style={styles.logo} resizeMode="contain" />
          </GlassSurface>
          <SegmentedControl options={settingsGroups} value={settingsGroup} onChange={setSettingsGroup} />
          <NativeOverviewPanel
            title="System state"
            caption="These controls sit inside native Expo UI hosts while the transport state is fed by the native Pebble module."
            metrics={[
              { label: 'Permissions', value: permissionBadge(pebble.permissionStatus) },
              { label: 'Bluetooth', value: formatBluetoothState(pebble.state.bluetooth) },
              { label: 'Watches', value: `${pebble.state.watches.length}` },
            ]}
            toggles={[
              { key: 'quiet-time', label: 'Quiet time', value: quietTimeEnabled, onValueChange: setQuietTimeEnabled },
              { key: 'weather-sync', label: 'Weather sync', value: weatherSyncEnabled, onValueChange: setWeatherSyncEnabled },
            ]}
            actionLabel={notificationAccessActionLabel}
            onActionPress={() => {
              if (pebble.notificationAccess) {
                void pebble.refreshState();
              } else {
                void pebble.openNotificationAccessSettings();
              }
            }}
          />
          <SectionTitle eyebrow={settingsGroup} title="Sections" />
          <View style={styles.stack}>
            {filteredSettings.map((item) => (
              <Pressable key={item.id} onPress={() => setSelectedSettingId(item.id)}>
                <GlassSurface style={styles.settingCard}>
                  <View style={styles.settingRow}>
                    <View style={styles.settingIcon}>
                      <Ionicons color={palette.accentBright} name={settingIcon(item)} size={18} />
                    </View>
                    <View style={styles.listTextBlock}>
                      <Text style={styles.listTitle}>{item.title}</Text>
                      <Text style={styles.listBody}>{item.description}</Text>
                    </View>
                    <View style={styles.settingTrail}>
                      {item.badge ? <InfoPill label={item.badge} tone="warning" /> : null}
                      <Ionicons color={palette.textSoft} name="chevron-forward" size={18} />
                    </View>
                  </View>
                </GlassSurface>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </View>
    );
  }
}

function WatchFacePreview({
  faceId,
  variant,
  large = false,
}: {
  faceId: string;
  variant: 'retro' | 'utility' | 'archive' | 'illustrated';
  large?: boolean;
}) {
  const height = large ? 220 : 150;
  return (
    <LinearGradient colors={gradients.face} style={[styles.facePreview, { height }]}>
      {variant === 'retro' ? (
        <View style={styles.previewRetro}>
          <Text style={styles.previewBrand}>pebble</Text>
          <Text style={styles.previewClock}>17:07</Text>
          <Text style={styles.previewDate}>FRIDAY</Text>
          <Text style={styles.previewFooter}>OCT 23 2015</Text>
        </View>
      ) : null}
      {variant === 'utility' ? (
        <View style={styles.previewUtility}>
          <Text style={styles.previewTicker}>{faceId.toUpperCase().slice(0, 6)}</Text>
          <View style={styles.utilityGrid}>
            {['24H', 'BT', 'WR', 'BAT', 'STEP', 'ALT'].map((label) => (
              <View key={label} style={styles.utilityCell}>
                <Text style={styles.utilityLabel}>{label}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}
      {variant === 'archive' ? (
        <View style={styles.previewArchive}>
          <Text style={styles.archiveLine}>well</Text>
          <Text style={styles.archiveLine}>past</Text>
          <Text style={styles.archiveLine}>seven</Text>
        </View>
      ) : null}
      {variant === 'illustrated' ? (
        <View style={styles.previewIllustrated}>
          <View style={styles.sketchCircle} />
          <View style={styles.sketchBody} />
          <Text style={styles.previewCaption}>illustrated face</Text>
        </View>
      ) : null}
    </LinearGradient>
  );
}

function SheetButton({
  label,
  primary = false,
  onPress,
}: {
  label: string;
  primary?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.sheetButton, primary && styles.sheetButtonPrimary]}>
      <Text style={[styles.sheetButtonLabel, primary && styles.sheetButtonLabelPrimary]}>{label}</Text>
    </Pressable>
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
    return 'Preparing native bridge';
  }
  if (!supported) {
    return Platform.OS === 'ios' ? 'iPhone bridge unavailable' : 'Android bridge required';
  }
  return 'No watch detected';
}

function isConnectedWatch(watch: PebbleWatch): boolean {
  return watch.kind === 'connected' || watch.kind === 'connecting';
}

function watchStatusLabel(
  watch: PebbleWatch | null,
  pebble: ReturnType<typeof usePebbleCore>
): string {
  if (!pebble.supported) {
    return Platform.OS === 'ios'
      ? 'The native Pebble bridge is still booting on iPhone.'
      : 'This native Pebble bridge is currently unavailable.';
  }
  if (watch == null) {
    return pebble.permissionStatus === 'granted'
      ? pebble.state.scanning
        ? 'Scanning for Pebble and Core watches'
        : 'Grant complete. Start a scan or connect a bonded watch.'
      : Platform.OS === 'ios'
        ? 'Bluetooth and notification permissions still need setup on this iPhone.'
        : 'Bluetooth, location, and notification access still need setup.';
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
  if (watch == null) {
    return pebble.permissionStatus === 'granted' ? 'Ready' : 'Setup';
  }
  return 'Unknown battery';
}

function watchFirmwareLine(
  watch: PebbleWatch | null,
  pebble: ReturnType<typeof usePebbleCore>
): string {
  if (watch == null) {
    return pebble.supported
      ? Platform.OS === 'ios'
        ? 'The Expo app is now driven by the `libpebble3` iPhone runtime; once permissions are granted it can discover and connect to real Pebble hardware.'
        : 'The Expo app is now driven by `libpebble3`; once permissions are granted it can discover and connect to real Pebble hardware.'
      : 'The Kotlin watch bridge is not wired on this platform yet.';
  }

  const firmware = watch.firmware ?? 'Firmware not reported yet';
  const serial = watch.serial ? `  •  ${watch.serial}` : '';
  return `${firmware}${serial}`;
}

function formatBluetoothState(bluetoothState: string): string {
  const normalized = bluetoothState.toLowerCase();
  if (normalized === 'enabled' || normalized === 'available') {
    return 'Enabled';
  }
  if (normalized === 'disabled' || normalized === 'unavailable') {
    return 'Disabled';
  }
  return bluetoothState;
}

function watchKindLabel(watch: PebbleWatch): string {
  if (watch.kind === 'connected') {
    return 'Connected';
  }
  if (watch.kind === 'connecting') {
    return watch.negotiating ? 'Negotiating session' : 'Connecting';
  }
  if (watch.kind === 'disconnecting') {
    return 'Disconnecting';
  }
  if (watch.kind === 'discovered') {
    return watch.rssi != null ? `Nearby • RSSI ${watch.rssi}` : 'Nearby';
  }
  if (watch.kind === 'known') {
    return 'Known watch';
  }
  return 'Unknown state';
}

function watchFirmwareValue(watch: PebbleWatch): string {
  return watch.firmware ?? watch.watchInfoName ?? 'Firmware pending';
}

function formatWatchPlatform(watch: PebbleWatch): string {
  return watch.watchInfoName ?? watch.watchType ?? watch.watchInfoPlatform ?? 'Unknown';
}

function permissionBadge(permissionStatus: 'unknown' | 'granted' | 'denied'): string {
  if (permissionStatus === 'granted') {
    return 'Granted';
  }
  if (permissionStatus === 'denied') {
    return 'Needs setup';
  }
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

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  body: {
    flex: 1,
  },
  screen: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
    gap: spacing.lg,
  },
  heroCard: {
    marginHorizontal: spacing.lg,
    padding: spacing.lg,
    gap: spacing.lg,
  },
  heroTop: {
    gap: spacing.md,
  },
  heroLabel: {
    color: palette.accentBright,
    fontFamily: fonts.mono,
    fontSize: 11,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  heroTitle: {
    color: palette.text,
    fontFamily: fonts.display,
    fontSize: 28,
    lineHeight: 30,
  },
  heroBody: {
    color: palette.textMuted,
    fontFamily: fonts.medium,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
  },
  heroPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  heroStats: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  stack: {
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  faceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  faceCardWrap: {
    width: '47.5%',
  },
  faceCard: {
    padding: spacing.sm,
    gap: spacing.sm,
  },
  facePreviewShell: {
    borderRadius: radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: palette.borderStrong,
  },
  facePreview: {
    justifyContent: 'center',
    padding: spacing.md,
  },
  faceMeta: {
    gap: 4,
  },
  faceName: {
    color: palette.text,
    fontFamily: fonts.medium,
    fontSize: 16,
  },
  faceAuthor: {
    color: palette.textMuted,
    fontFamily: fonts.medium,
    fontSize: 12,
  },
  facePills: {
    marginTop: 8,
  },
  previewPanel: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: palette.border,
  },
  previewRetro: {
    alignItems: 'flex-start',
  },
  previewBrand: {
    color: '#F7F3FA',
    fontFamily: fonts.medium,
    fontSize: 18,
    textTransform: 'lowercase',
  },
  previewClock: {
    color: '#FFFFFF',
    fontFamily: fonts.mono,
    fontSize: 38,
    marginTop: 6,
  },
  previewDate: {
    color: '#F5BCA8',
    fontFamily: fonts.medium,
    fontSize: 15,
    marginTop: 10,
  },
  previewFooter: {
    color: palette.textMuted,
    fontFamily: fonts.mono,
    fontSize: 11,
    marginTop: 8,
  },
  previewUtility: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  previewTicker: {
    color: '#FFFFFF',
    fontFamily: fonts.mono,
    fontSize: 20,
    letterSpacing: 2,
  },
  utilityGrid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    justifyContent: 'space-between',
  },
  utilityCell: {
    width: '31%',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  utilityLabel: {
    color: palette.text,
    fontFamily: fonts.mono,
    fontSize: 10,
  },
  previewArchive: {
    justifyContent: 'center',
  },
  archiveLine: {
    color: '#F5F1F7',
    fontFamily: fonts.display,
    fontSize: 30,
    lineHeight: 32,
  },
  previewIllustrated: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sketchCircle: {
    width: 72,
    height: 72,
    borderRadius: 72,
    borderWidth: 2,
    borderColor: '#F6F2FA',
  },
  sketchBody: {
    width: 30,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#F6F2FA',
    marginTop: 12,
  },
  previewCaption: {
    color: palette.textMuted,
    fontFamily: fonts.mono,
    fontSize: 10,
    marginTop: 12,
  },
  listCard: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  appIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appIconText: {
    color: '#1B1222',
    fontFamily: fonts.display,
    fontSize: 24,
  },
  listTextBlock: {
    flex: 1,
    gap: 2,
  },
  listTitle: {
    color: palette.text,
    fontFamily: fonts.medium,
    fontSize: 17,
  },
  listSubtitle: {
    color: palette.textMuted,
    fontFamily: fonts.medium,
    fontSize: 12,
  },
  listBody: {
    color: palette.textSoft,
    fontFamily: fonts.medium,
    fontSize: 13,
    lineHeight: 18,
  },
  listActions: {
    alignItems: 'flex-end',
    gap: 10,
  },
  deviceHero: {
    marginHorizontal: spacing.lg,
    padding: spacing.lg,
    gap: spacing.md,
  },
  statusCard: {
    marginHorizontal: spacing.lg,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  statusTitle: {
    color: palette.text,
    fontFamily: fonts.medium,
    fontSize: 17,
  },
  statusBody: {
    color: palette.textMuted,
    fontFamily: fonts.medium,
    fontSize: 13,
    lineHeight: 20,
  },
  deviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deviceName: {
    color: palette.text,
    fontFamily: fonts.display,
    fontSize: 30,
  },
  deviceState: {
    color: palette.success,
    fontFamily: fonts.medium,
    fontSize: 13,
    marginTop: 4,
  },
  deviceFirmware: {
    color: palette.textMuted,
    fontFamily: fonts.mono,
    fontSize: 12,
  },
  ctaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  secondaryDevice: {
    marginHorizontal: spacing.lg,
    padding: spacing.md,
  },
  watchAvatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationTrail: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  alertBadge: {
    minWidth: 28,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255, 98, 63, 0.18)',
    alignItems: 'center',
  },
  alertBadgeText: {
    color: palette.accentBright,
    fontFamily: fonts.medium,
    fontSize: 12,
  },
  settingsHero: {
    marginHorizontal: spacing.lg,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  settingsHeroText: {
    flex: 1,
  },
  logo: {
    width: 72,
    height: 72,
    opacity: 0.9,
  },
  settingCard: {
    padding: spacing.md,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  settingIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 98, 63, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingTrail: {
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  sheetPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  sheetEyebrow: {
    color: palette.accentBright,
    fontFamily: fonts.mono,
    fontSize: 11,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  sheetBodyText: {
    color: palette.textMuted,
    fontFamily: fonts.medium,
    fontSize: 14,
    lineHeight: 21,
  },
  debugText: {
    color: palette.textSoft,
    fontFamily: fonts.mono,
    fontSize: 12,
    lineHeight: 18,
  },
  sheetActionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  sheetButton: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: palette.borderStrong,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  sheetButtonPrimary: {
    backgroundColor: palette.accent,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  sheetButtonLabel: {
    color: palette.text,
    fontFamily: fonts.medium,
    fontSize: 13,
  },
  sheetButtonLabelPrimary: {
    color: '#FFF7F4',
  },
  sheetIconRow: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
  },
  sheetStats: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  toggleSheetRow: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: 'rgba(255,255,255,0.05)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleSheetLabel: {
    color: palette.text,
    fontFamily: fonts.medium,
    fontSize: 15,
  },
});
