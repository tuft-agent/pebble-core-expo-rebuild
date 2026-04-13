import { startTransition, useEffect, useRef, useState } from 'react';
import { AppState, PermissionsAndroid, Platform } from 'react-native';
import type { Permission } from 'react-native/Libraries/PermissionsAndroid/PermissionsAndroid';

import PebbleCoreNative, {
  PebbleConnectionEventPayload,
  PebbleCoreState,
  PebbleUserFacingErrorPayload,
} from '../modules/pebble-core-native';

type PermissionStatus = 'unknown' | 'granted' | 'denied';

const unsupportedState: PebbleCoreState = {
  initialized: false,
  bluetooth: 'Unavailable',
  bluetoothEnabled: false,
  scanning: false,
  watches: [],
};

function androidSdkVersion(): number {
  return typeof Platform.Version === 'number' ? Platform.Version : Number(Platform.Version);
}

function applyState(nextState: PebbleCoreState, setter: (value: PebbleCoreState) => void) {
  startTransition(() => setter(nextState));
}

async function requestTransportPermissions(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return true;
  }

  const sdkVersion = androidSdkVersion();
  const permissions: Permission[] = [
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    ...(sdkVersion >= 31
      ? [
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        ]
      : []),
    ...(sdkVersion >= 33 ? [PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS] : []),
  ];

  const missingPermissions: Permission[] = [];
  for (const permission of permissions) {
    const granted = await PermissionsAndroid.check(permission);
    if (!granted) {
      missingPermissions.push(permission);
    }
  }

  if (missingPermissions.length === 0) {
    return true;
  }

  const results = await PermissionsAndroid.requestMultiple(missingPermissions);
  return missingPermissions.every(
    (permission) => results[permission] === PermissionsAndroid.RESULTS.GRANTED
  );
}

export function usePebbleCore() {
  const [supported, setSupported] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus>('unknown');
  const [notificationAccess, setNotificationAccess] = useState(false);
  const [state, setState] = useState<PebbleCoreState>(unsupportedState);
  const [lastConnectionEvent, setLastConnectionEvent] =
    useState<PebbleConnectionEventPayload | null>(null);
  const [lastError, setLastError] = useState<PebbleUserFacingErrorPayload | null>(null);
  const [debugState, setDebugState] = useState<string | null>(null);
  const supportedRef = useRef(false);

  useEffect(() => {
    supportedRef.current = supported;
  }, [supported]);

  async function refreshNotificationAccess() {
    const nextValue = supportedRef.current
      ? await PebbleCoreNative.hasNotificationAccessAsync().catch(() => false)
      : false;
    startTransition(() => setNotificationAccess(nextValue));
  }

  async function refreshState() {
    if (!supportedRef.current) {
      applyState(unsupportedState, setState);
      return unsupportedState;
    }

    const nextState = await PebbleCoreNative.getStateAsync().catch(() => unsupportedState);
    applyState(nextState, setState);
    return nextState;
  }

  async function requestAccess() {
    if (!supportedRef.current) {
      return false;
    }

    if (Platform.OS === 'ios') {
      startTransition(() => setPermissionStatus('granted'));
      const nextState = await PebbleCoreNative.onPermissionsHandledAsync().catch(() => state);
      applyState(nextState, setState);
      return true;
    }

    const granted = await requestTransportPermissions().catch(() => false);
    startTransition(() => setPermissionStatus(granted ? 'granted' : 'denied'));

    if (granted) {
      const nextState = await PebbleCoreNative.onPermissionsHandledAsync().catch(() => state);
      applyState(nextState, setState);
    }

    return granted;
  }

  async function ensureAccess() {
    if (!supportedRef.current) {
      return false;
    }
    if (permissionStatus === 'granted') {
      return true;
    }
    return requestAccess();
  }

  async function toggleScan(forceValue?: boolean) {
    const granted = await ensureAccess();
    if (!granted) {
      return false;
    }

    const shouldScan = forceValue ?? !state.scanning;
    const nextState = shouldScan
      ? await PebbleCoreNative.startBleScanAsync()
      : await PebbleCoreNative.stopBleScanAsync();
    applyState(nextState, setState);
    return true;
  }

  async function connect(identifier: string) {
    const granted = await ensureAccess();
    if (!granted) {
      return false;
    }
    const nextState = await PebbleCoreNative.connectAsync(identifier);
    applyState(nextState, setState);
    return true;
  }

  async function disconnect(identifier: string) {
    const nextState = await PebbleCoreNative.disconnectAsync(identifier);
    applyState(nextState, setState);
  }

  async function forget(identifier: string) {
    const nextState = await PebbleCoreNative.forgetAsync(identifier);
    applyState(nextState, setState);
  }

  async function loadDebugState() {
    const nextDebugState = await PebbleCoreNative.debugStateAsync();
    startTransition(() => setDebugState(nextDebugState));
    return nextDebugState;
  }

  async function openNotificationAccessSettings() {
    if (!supported) {
      return;
    }
    await PebbleCoreNative.openNotificationAccessSettingsAsync();
  }

  useEffect(() => {
    let disposed = false;

    const stateSubscription = PebbleCoreNative.addListener('onStateChange', (nextState) => {
      if (!disposed) {
        applyState(nextState, setState);
      }
    });
    const connectionSubscription = PebbleCoreNative.addListener(
      'onConnectionEvent',
      (event) => {
        if (!disposed) {
          startTransition(() => setLastConnectionEvent(event));
        }
      }
    );
    const errorSubscription = PebbleCoreNative.addListener('onUserFacingError', (event) => {
      if (!disposed) {
        startTransition(() => setLastError(event));
      }
    });
    const appStateSubscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        void refreshState();
        void refreshNotificationAccess();
      }
    });

    async function bootstrap() {
      const isSupported = await PebbleCoreNative.isSupportedAsync().catch(() => false);
      if (disposed) {
        return;
      }

      supportedRef.current = isSupported;
      startTransition(() => setSupported(isSupported));

      if (!isSupported) {
        applyState(unsupportedState, setState);
        startTransition(() => {
          setPermissionStatus('denied');
          setNotificationAccess(false);
          setInitializing(false);
        });
        return;
      }

      const initialState = await PebbleCoreNative.initializeAsync().catch(() => unsupportedState);
      if (disposed) {
        return;
      }

      applyState(initialState, setState);
      await refreshNotificationAccess();

      if (Platform.OS === 'ios') {
        startTransition(() => setPermissionStatus('granted'));
        const readyState = await PebbleCoreNative.onPermissionsHandledAsync().catch(
          () => initialState
        );
        if (disposed) {
          return;
        }
        applyState(readyState, setState);
        startTransition(() => setInitializing(false));
        return;
      }

      const granted = await requestTransportPermissions().catch(() => false);
      if (disposed) {
        return;
      }

      startTransition(() => setPermissionStatus(granted ? 'granted' : 'denied'));

      if (granted) {
        const readyState = await PebbleCoreNative.onPermissionsHandledAsync().catch(
          () => initialState
        );
        if (disposed) {
          return;
        }
        applyState(readyState, setState);
      }

      startTransition(() => setInitializing(false));
    }

    void bootstrap();

    return () => {
      disposed = true;
      stateSubscription.remove();
      connectionSubscription.remove();
      errorSubscription.remove();
      appStateSubscription.remove();
    };
  }, []);

  useEffect(() => {
    if (!supported || Platform.OS !== 'ios') {
      return;
    }

    const interval = setInterval(() => {
      void refreshState();
      void refreshNotificationAccess();
    }, state.scanning ? 1000 : 2500);

    return () => clearInterval(interval);
  }, [supported, state.scanning]);

  return {
    supported,
    initializing,
    permissionStatus,
    notificationAccess,
    state,
    lastConnectionEvent,
    lastError,
    debugState,
    requestAccess,
    refreshState,
    toggleScan,
    connect,
    disconnect,
    forget,
    loadDebugState,
    openNotificationAccessSettings,
  };
}
