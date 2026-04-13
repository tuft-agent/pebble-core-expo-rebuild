import { NativeModule, requireNativeModule } from 'expo';

import { PebbleCoreNativeModuleEvents, PebbleCoreState, PebbleWatch } from './PebbleCoreNative.types';

declare class PebbleCoreNativeModule extends NativeModule<PebbleCoreNativeModuleEvents> {
  isSupportedAsync(): Promise<boolean>;
  initializeAsync(): Promise<PebbleCoreState>;
  onPermissionsHandledAsync(): Promise<PebbleCoreState>;
  getStateAsync(): Promise<PebbleCoreState>;
  getWatchesAsync(): Promise<PebbleWatch[]>;
  startBleScanAsync(): Promise<PebbleCoreState>;
  stopBleScanAsync(): Promise<PebbleCoreState>;
  connectAsync(identifier: string): Promise<PebbleCoreState>;
  disconnectAsync(identifier: string): Promise<PebbleCoreState>;
  forgetAsync(identifier: string): Promise<PebbleCoreState>;
  debugStateAsync(): Promise<string>;
  hasNotificationAccessAsync(): Promise<boolean>;
  openNotificationAccessSettingsAsync(): Promise<void>;
}

export default requireNativeModule<PebbleCoreNativeModule>('PebbleCoreNative');
