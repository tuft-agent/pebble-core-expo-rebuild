export type TabId = 'faces' | 'apps' | 'devices' | 'notifications' | 'settings';

export type Face = {
  id: string;
  name: string;
  author: string;
  style: 'retro' | 'utility' | 'archive' | 'illustrated';
  companion: 'Installed' | 'Ready to sync' | 'Cloud backup';
  complications: number;
};

export type LockerApp = {
  id: string;
  name: string;
  developer: string;
  subtitle: string;
  tint: string;
  state: 'Pinned' | 'Installed' | 'Experimental';
  hasSettings?: boolean;
  timeline?: boolean;
};

export type Device = {
  id: string;
  name: string;
  state: 'Connected' | 'Nearby' | 'Charging';
  firmware: string;
  serial: string;
  battery: string;
  signal: string;
  timeline: string;
  healthSync: boolean;
  location: string;
  lastSync: string;
  watchfaces: number;
  apps: number;
};

export type NotificationApp = {
  id: string;
  name: string;
  source: string;
  enabled: boolean;
  alerts: number;
  tint: string;
};

export type SettingsGroup = 'Phone' | 'Watch' | 'Notifications';

export type SettingsItem = {
  id: string;
  title: string;
  description: string;
  group: SettingsGroup;
  badge?: string;
};

export const watchFaces: Face[] = [
  { id: 'brick-neon', name: 'Brick Neon', author: 'Comfortably Numb', style: 'retro', companion: 'Installed', complications: 2 },
  { id: '91-dub', name: '91 Dub v.4', author: 'ori wan', style: 'utility', companion: 'Installed', complications: 4 },
  { id: 'ttmmbrn', name: 'TTMMBRN', author: 'TTMM Archive', style: 'archive', companion: 'Cloud backup', complications: 1 },
  { id: 'vw-bus', name: 'vw bus white face', author: 'Henrock', style: 'illustrated', companion: 'Ready to sync', complications: 3 },
  { id: 'os9', name: 'os9', author: 'yohai', style: 'utility', companion: 'Installed', complications: 5 },
  { id: 'palm-powered', name: 'palm powered', author: 'FC Studio', style: 'utility', companion: 'Ready to sync', complications: 6 },
  { id: 'very-fuzzy', name: 'Very Fuzzy', author: 'Hamish Downer', style: 'archive', companion: 'Cloud backup', complications: 1 },
  { id: 'tintin', name: 'Tintin & Snowy', author: 'dcstyle', style: 'illustrated', companion: 'Installed', complications: 2 },
];

export const lockerApps: LockerApp[] = [
  { id: 'calendar', name: 'Calendar', developer: 'Pebble', subtitle: 'Agenda in glance mode', tint: '#FB6F52', state: 'Pinned', timeline: true },
  { id: 'timer', name: 'Timer', developer: 'Pebble', subtitle: 'Native countdown companion', tint: '#7CD0FF', state: 'Installed' },
  { id: '2048', name: '2048', developer: 'Rono', subtitle: 'Classic puzzle, rebuilt for buttons', tint: '#F6C453', state: 'Pinned' },
  { id: '7-minute', name: '7-Minute+', developer: 'Skeptic Studios', subtitle: 'Workout haptics and reps', tint: '#7BE3AA', state: 'Installed', hasSettings: true },
  { id: '8-ball', name: '8 Ball by Dalpek', developer: 'Dalpek', subtitle: 'A tiny random answer engine', tint: '#D8B4FE', state: 'Installed' },
  { id: 'alarms', name: 'Alarms++', developer: 'Christian Reimbacher', subtitle: 'Fast multi-alarm editing', tint: '#FF8A80', state: 'Pinned' },
  { id: 'alvin', name: 'Alvin', developer: 'James Fowler', subtitle: 'Power controls and shortcuts', tint: '#9AA7FF', state: 'Experimental', hasSettings: true },
  { id: 'launcher', name: 'AppLauncher', developer: 'shusiky', subtitle: 'Folder-like app launcher', tint: '#FFD166', state: 'Pinned' },
];

export const devices: Device[] = [
  {
    id: 'core-4b3f',
    name: 'Core 4B3F',
    state: 'Connected',
    firmware: 'S104220B004J - FW: v4.9.9-core11',
    serial: '4B3F-8A91-CORE',
    battery: '96%',
    signal: 'Strong',
    timeline: 'Synced 12s ago',
    healthSync: true,
    location: 'San Francisco',
    lastSync: '16:57',
    watchfaces: 28,
    apps: 52,
  },
  {
    id: 'time-2',
    name: 'Pebble Time 2',
    state: 'Nearby',
    firmware: 'v4.9.6-recovery3',
    serial: 'TIME2-D8F1',
    battery: '41%',
    signal: 'Searching',
    timeline: 'Queued',
    healthSync: false,
    location: 'Studio shelf',
    lastSync: 'Yesterday',
    watchfaces: 14,
    apps: 31,
  },
];

export const notificationAppsSeed: NotificationApp[] = [
  { id: 'shortwave', name: 'Shortwave', source: 'Mail digest', enabled: true, alerts: 8, tint: '#4D8EFF' },
  { id: 'prusa', name: 'Prusa', source: 'Print progress', enabled: true, alerts: 3, tint: '#FF7A45' },
  { id: 'beeper', name: 'Beeper', source: 'Unified inbox', enabled: true, alerts: 14, tint: '#6A78FF' },
  { id: 'calendar', name: 'Calendar', source: 'Upcoming events', enabled: true, alerts: 5, tint: '#6BD0FF' },
  { id: 'slack', name: 'Slack', source: 'Mentions only', enabled: true, alerts: 11, tint: '#61D0B5' },
  { id: 'opubbles', name: 'OpenBubbles', source: 'Messaging', enabled: false, alerts: 2, tint: '#95A8FF' },
  { id: 'united', name: 'United Airlines', source: 'Trip updates', enabled: true, alerts: 1, tint: '#7FC6FF' },
  { id: 'tasks', name: 'Tasks', source: 'Reminders', enabled: true, alerts: 4, tint: '#4D9EFF' },
  { id: 'eufy', name: 'eufy Clean', source: 'Robot status', enabled: false, alerts: 0, tint: '#73E5E2' },
  { id: 'strava', name: 'Strava', source: 'Activity summaries', enabled: false, alerts: 2, tint: '#FF7849' },
  { id: 'chatgpt', name: 'ChatGPT', source: 'Reply suggestions', enabled: true, alerts: 6, tint: '#F5F2FF' },
  { id: 'pebble-core', name: 'Pebble Core', source: 'System alerts', enabled: true, alerts: 2, tint: '#FF623F' },
];

export const settingsItems: SettingsItem[] = [
  { id: 'about', title: 'About', description: 'Release notes, firmware cohorts, licensing, and OS changelog.', group: 'Phone' },
  { id: 'support', title: 'Get Help', description: 'Troubleshooting, bug reports, alpha testing, and recovery steps.', group: 'Phone', badge: '2' },
  { id: 'calendar', title: 'Calendar', description: 'Choose mirrored calendars and control reminder windows.', group: 'Phone' },
  { id: 'weather', title: 'Weather', description: 'Fixed or live location, metric/imperial units, and refresh cadence.', group: 'Phone' },
  { id: 'speech', title: 'Speech Recognition', description: 'Remote dictation, local model downloads, and whisper mode.', group: 'Phone' },
  { id: 'apps', title: 'Apps', description: 'Locker order, sideloading defaults, and appstore sources.', group: 'Watch' },
  { id: 'display', title: 'Display', description: 'Backlight timing, quiet dimming, and vibration previews.', group: 'Watch' },
  { id: 'timeline', title: 'Timeline', description: 'Sync cadence, pin retention, and app-specific timeline access.', group: 'Watch' },
  { id: 'music', title: 'Music', description: 'Phone player control mapping and quick launch behavior.', group: 'Watch' },
  { id: 'diagnostics', title: 'Diagnostics', description: 'Health sync stats, memfault uploads, and recovery logs.', group: 'Watch', badge: '1' },
  { id: 'filters', title: 'Notification Filters', description: 'App-level mute rules, VIP handling, and contact routing.', group: 'Notifications' },
  { id: 'quiet-time', title: 'Quiet Time', description: 'Schedules, exception windows, and mirrored DND behavior.', group: 'Notifications' },
  { id: 'history', title: 'Notification History', description: 'Recent alerts, badge counts, and replay shortcuts.', group: 'Notifications' },
];

export const settingsGroups: SettingsGroup[] = ['Phone', 'Watch', 'Notifications'];
