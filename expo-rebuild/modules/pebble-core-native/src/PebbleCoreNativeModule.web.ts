import { registerWebModule, NativeModule } from 'expo';

import { PebbleConnectionEventPayload, PebbleCoreNativeModuleEvents, PebbleCoreState, PebbleUserFacingErrorPayload, PebbleWatch } from './PebbleCoreNative.types';

class PebbleCoreNativeModule extends NativeModule<PebbleCoreNativeModuleEvents> {
  async isSupportedAsync(): Promise<boolean> {
    return false;
  }

  async initializeAsync(): Promise<PebbleCoreState> {
    return unsupportedState();
  }

  async onPermissionsHandledAsync(): Promise<PebbleCoreState> {
    return unsupportedState();
  }

  async getStateAsync(): Promise<PebbleCoreState> {
    return unsupportedState();
  }

  async getWatchesAsync(): Promise<PebbleWatch[]> {
    return [];
  }

  async startBleScanAsync(): Promise<PebbleCoreState> {
    return unsupportedState();
  }

  async stopBleScanAsync(): Promise<PebbleCoreState> {
    return unsupportedState();
  }

  async connectAsync(_identifier: string): Promise<PebbleCoreState> {
    return unsupportedState();
  }

  async disconnectAsync(_identifier: string): Promise<PebbleCoreState> {
    return unsupportedState();
  }

  async forgetAsync(_identifier: string): Promise<PebbleCoreState> {
    return unsupportedState();
  }

  async debugStateAsync(): Promise<string> {
    return 'PebbleCoreNative is not supported on web.';
  }

  async hasNotificationAccessAsync(): Promise<boolean> {
    return false;
  }

  async openNotificationAccessSettingsAsync(): Promise<void> {
  }

  emitUnsupportedConnection(event: PebbleConnectionEventPayload) {
    this.emit('onConnectionEvent', event);
  }

  emitUnsupportedError(event: PebbleUserFacingErrorPayload) {
    this.emit('onUserFacingError', event);
  }
}

function unsupportedState(): PebbleCoreState {
  return {
    initialized: false,
    bluetooth: 'Unavailable',
    bluetoothEnabled: false,
    scanning: false,
    watches: [],
  };
}

export default registerWebModule(PebbleCoreNativeModule, 'PebbleCoreNativeModule');
