package expo.modules.pebblecorenative

import android.content.Context
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class PebbleCoreNativeModule : Module() {
  private fun requireContext(): Context {
    return requireNotNull(appContext.reactContext) {
      "React context is not available"
    }
  }

  override fun definition() = ModuleDefinition {
    Name("PebbleCoreNative")

    Events("onStateChange", "onConnectionEvent", "onUserFacingError")

    OnCreate {
      PebbleCoreRuntime.setEventSink { name, payload ->
        sendEvent(name, payload)
      }
    }

    OnDestroy {
      PebbleCoreRuntime.setEventSink(null)
    }

    AsyncFunction("isSupportedAsync") {
      true
    }

    AsyncFunction("initializeAsync") {
      PebbleCoreRuntime.state(requireContext())
    }

    AsyncFunction("onPermissionsHandledAsync") {
      PebbleCoreRuntime.onPermissionsHandled(requireContext())
    }

    AsyncFunction("getStateAsync") {
      PebbleCoreRuntime.state(requireContext())
    }

    AsyncFunction("getWatchesAsync") {
      PebbleCoreRuntime.getWatches(requireContext())
    }

    AsyncFunction("startBleScanAsync") {
      PebbleCoreRuntime.startBleScan(requireContext())
    }

    AsyncFunction("stopBleScanAsync") {
      PebbleCoreRuntime.stopBleScan(requireContext())
    }

    AsyncFunction("connectAsync") { identifier: String ->
      PebbleCoreRuntime.connect(requireContext(), identifier)
    }

    AsyncFunction("disconnectAsync") { identifier: String ->
      PebbleCoreRuntime.disconnect(requireContext(), identifier)
    }

    AsyncFunction("forgetAsync") { identifier: String ->
      PebbleCoreRuntime.forget(requireContext(), identifier)
    }

    AsyncFunction("debugStateAsync") {
      PebbleCoreRuntime.debugState(requireContext())
    }

    AsyncFunction("hasNotificationAccessAsync") {
      PebbleCoreRuntime.hasNotificationAccess(requireContext())
    }

    AsyncFunction("openNotificationAccessSettingsAsync") {
      PebbleCoreRuntime.openNotificationAccessSettings(requireContext())
    }
  }
}
