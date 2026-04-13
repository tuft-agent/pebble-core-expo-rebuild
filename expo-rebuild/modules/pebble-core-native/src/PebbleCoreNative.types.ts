export type PebbleWatch = {
  identifier: string;
  name: string;
  displayName: string;
  nickname: string | null;
  kind: string;
  connectionFailures: number;
  connectionFailureReason: string | null;
  rssi?: number;
  firmware?: string;
  serial?: string;
  watchType?: string;
  lastConnectedEpochMs?: number;
  capabilities?: string[];
  batteryLevel?: number | null;
  usingBtClassic?: boolean;
  watchInfoName?: string;
  watchInfoPlatform?: string;
  watchInfoRevision?: string;
  watchInfoBoard?: string;
  negotiating?: boolean;
  rebootingAfterFirmwareUpdate?: boolean;
  runningApp?: string | null;
  devConnectionActive?: boolean;
  firmwareUpdateState?: string | null;
  firmwareUpdateAvailable?: string | null;
};

export type PebbleCoreState = {
  initialized: boolean;
  bluetooth: string;
  bluetoothEnabled: boolean;
  scanning: boolean;
  watches: PebbleWatch[];
};

export type PebbleConnectionEventPayload = {
  identifier: string;
  type: 'connected' | 'disconnected';
  device?: PebbleWatch;
};

export type PebbleUserFacingErrorPayload = {
  message: string;
  kind?: string | null;
};

export type PebbleCoreNativeModuleEvents = {
  onStateChange: (params: PebbleCoreState) => void;
  onConnectionEvent: (params: PebbleConnectionEventPayload) => void;
  onUserFacingError: (params: PebbleUserFacingErrorPayload) => void;
};
