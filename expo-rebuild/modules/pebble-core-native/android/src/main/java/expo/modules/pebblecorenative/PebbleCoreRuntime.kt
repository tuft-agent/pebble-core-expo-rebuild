@file:OptIn(
  kotlin.ExperimentalUnsignedTypes::class,
  kotlin.uuid.ExperimentalUuidApi::class,
)

package expo.modules.pebblecorenative

import android.content.Context
import android.content.Intent
import android.provider.Settings
import androidx.core.app.NotificationManagerCompat
import io.rebble.libpebblecommon.LibPebbleConfig
import io.rebble.libpebblecommon.connection.BleDiscoveredPebbleDevice
import io.rebble.libpebblecommon.connection.CommonConnectedDevice
import io.rebble.libpebblecommon.connection.ConnectedPebbleDevice
import io.rebble.libpebblecommon.connection.ConnectingPebbleDevice
import io.rebble.libpebblecommon.connection.DisconnectingPebbleDevice
import io.rebble.libpebblecommon.connection.FirmwareUpdateCheckResult
import io.rebble.libpebblecommon.connection.KnownPebbleDevice
import io.rebble.libpebblecommon.connection.LibPebble
import io.rebble.libpebblecommon.connection.LibPebble3
import io.rebble.libpebblecommon.connection.PebbleConnectionEvent
import io.rebble.libpebblecommon.connection.PebbleDevice
import io.rebble.libpebblecommon.connection.TokenProvider
import io.rebble.libpebblecommon.connection.WebServices
import io.rebble.libpebblecommon.connection.asPebbleBleIdentifier
import io.rebble.libpebblecommon.connection.bt.BluetoothState
import io.rebble.libpebblecommon.locker.LockerWrapper
import io.rebble.libpebblecommon.services.WatchInfo
import io.rebble.libpebblecommon.voice.TranscriptionProvider
import io.rebble.libpebblecommon.voice.TranscriptionResult
import io.rebble.libpebblecommon.voice.VoiceEncoderInfo
import io.rebble.libpebblecommon.web.LockerModelWrapper
import io.rebble.libpebblecommon.connection.AppContext as LibPebbleAppContext
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.launch
import kotlin.time.ExperimentalTime
import kotlin.uuid.Uuid

internal object PebbleCoreRuntime {
  private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Default)

  @Volatile
  private var libPebble: LibPebble? = null

  @Volatile
  private var eventSink: ((String, Map<String, Any?>) -> Unit)? = null

  private var collectorsStarted = false

  fun setEventSink(sink: ((String, Map<String, Any?>) -> Unit)?) {
    eventSink = sink
    currentState()?.let { emit("onStateChange", it) }
  }

  @Synchronized
  fun ensureInitialized(context: Context): LibPebble {
    val existing = libPebble
    if (existing != null) {
      return existing
    }

    val created = LibPebble3.create(
      defaultConfig = LibPebbleConfig(),
      webServices = NoOpWebServices,
      appContext = LibPebbleAppContext(context.applicationContext),
      tokenProvider = NoOpTokenProvider,
      proxyTokenProvider = MutableStateFlow(null),
      transcriptionProvider = DisabledTranscriptionProvider,
    )
    created.init()
    libPebble = created
    startCollectors(created)
    emit("onStateChange", snapshot(created))
    return created
  }

  fun onPermissionsHandled(context: Context): Map<String, Any?> {
    val pebble = ensureInitialized(context)
    pebble.doStuffAfterPermissionsGranted()
    return snapshot(pebble)
  }

  fun state(context: Context): Map<String, Any?> = snapshot(ensureInitialized(context))

  fun getWatches(context: Context): List<Map<String, Any?>> =
    ensureInitialized(context).watches.value.map(::deviceMap)

  fun startBleScan(context: Context): Map<String, Any?> {
    val pebble = ensureInitialized(context)
    pebble.startBleScan()
    return snapshot(pebble)
  }

  fun stopBleScan(context: Context): Map<String, Any?> {
    val pebble = ensureInitialized(context)
    pebble.stopBleScan()
    return snapshot(pebble)
  }

  fun connect(context: Context, identifier: String): Map<String, Any?> {
    val pebble = ensureInitialized(context)
    pebble.watches.value.firstOrNull { it.identifier.asString == identifier }?.connect()
    return snapshot(pebble)
  }

  fun disconnect(context: Context, identifier: String): Map<String, Any?> {
    val pebble = ensureInitialized(context)
    pebble.watches.value.firstOrNull { it.identifier.asString == identifier }
      ?.let { device ->
        when (device) {
          is CommonConnectedDevice -> device.disconnect()
          is ConnectingPebbleDevice -> device.disconnect()
          else -> Unit
        }
      }
    return snapshot(pebble)
  }

  fun forget(context: Context, identifier: String): Map<String, Any?> {
    val pebble = ensureInitialized(context)
    pebble.watches.value.firstOrNull { it.identifier.asString == identifier }
      ?.let { device ->
        if (device is KnownPebbleDevice) {
          device.forget()
        }
      }
    return snapshot(pebble)
  }

  fun debugState(context: Context): String = ensureInitialized(context).watchesDebugState()

  fun hasNotificationAccess(context: Context): Boolean {
    return NotificationManagerCompat.getEnabledListenerPackages(context)
      .contains(context.packageName)
  }

  fun openNotificationAccessSettings(context: Context) {
    context.startActivity(
      Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS)
        .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK),
    )
  }

  private fun startCollectors(pebble: LibPebble) {
    if (collectorsStarted) {
      return
    }
    collectorsStarted = true

    scope.launch {
      combine(pebble.watches, pebble.bluetoothEnabled, pebble.isScanningBle) { watches, bluetooth, scanning ->
        snapshot(pebble, watches.map(::deviceMap), bluetooth, scanning)
      }.collectLatest { state ->
        emit("onStateChange", state)
      }
    }

    scope.launch {
      pebble.connectionEvents.collectLatest { event ->
        emit(
          "onConnectionEvent",
          when (event) {
            is PebbleConnectionEvent.PebbleConnectedEvent -> mapOf(
              "identifier" to event.device.identifier.asString,
              "type" to "connected",
              "device" to deviceMap(event.device),
            )

            is PebbleConnectionEvent.PebbleDisconnectedEvent -> mapOf(
              "identifier" to event.identifier.asString,
              "type" to "disconnected",
            )
          },
        )
      }
    }

    scope.launch {
      pebble.userFacingErrors.collectLatest { error ->
        emit(
          "onUserFacingError",
          mapOf(
            "message" to error.message,
            "kind" to error::class.simpleName,
          ),
        )
      }
    }
  }

  private fun currentState(): Map<String, Any?>? {
    val pebble = libPebble ?: return null
    return snapshot(pebble)
  }

  private fun emit(name: String, payload: Map<String, Any?>) {
    eventSink?.invoke(name, payload)
  }

  private fun snapshot(
    pebble: LibPebble,
    watches: List<Map<String, Any?>> = pebble.watches.value.map(::deviceMap),
    bluetooth: BluetoothState = pebble.bluetoothEnabled.value,
    scanning: Boolean = pebble.isScanningBle.value,
  ): Map<String, Any?> {
    return mapOf(
      "initialized" to true,
      "bluetooth" to bluetooth.name,
      "bluetoothEnabled" to bluetooth.enabled(),
      "scanning" to scanning,
      "watches" to watches,
    )
  }

  @OptIn(ExperimentalTime::class)
  private fun deviceMap(device: PebbleDevice): Map<String, Any?> {
    val kind = when (device) {
      is ConnectedPebbleDevice -> "connected"
      is CommonConnectedDevice -> "connected"
      is ConnectingPebbleDevice -> "connecting"
      is DisconnectingPebbleDevice -> "disconnecting"
      is BleDiscoveredPebbleDevice -> "discovered"
      is KnownPebbleDevice -> "known"
      else -> "unknown"
    }

    return buildMap {
      put("identifier", device.identifier.asString)
      put("name", device.name)
      put("displayName", device.displayName())
      put("nickname", device.nickname)
      put("kind", kind)
      put("connectionFailures", device.connectionFailureInfo?.times ?: 0)
      put("connectionFailureReason", device.connectionFailureInfo?.reason?.name)

      if (device is BleDiscoveredPebbleDevice) {
        put("rssi", device.rssi)
      }

      if (device is KnownPebbleDevice) {
        put("firmware", device.runningFwVersion)
        put("serial", device.serial)
        put("watchType", device.watchType.name)
        put("lastConnectedEpochMs", device.lastConnected.toEpochMilliseconds())
        put("capabilities", device.capabilities.map { it.name })
      }

      if (device is CommonConnectedDevice) {
        put("batteryLevel", device.batteryLevel)
        put("usingBtClassic", device.usingBtClassic)
        put("watchInfoName", device.watchInfo.platform.watchType.codename)
        put("watchInfoPlatform", device.watchInfo.platform.name)
        put("watchInfoRevision", device.watchInfo.platform.revision)
        put("watchInfoBoard", device.watchInfo.board)
      }

      if (device is ConnectingPebbleDevice) {
        put("negotiating", device.negotiating)
        put("rebootingAfterFirmwareUpdate", device.rebootingAfterFirmwareUpdate)
      }

      if (device is ConnectedPebbleDevice) {
        put("runningApp", device.runningApp.value?.toString())
        put("devConnectionActive", device.devConnectionActive.value)
        put("firmwareUpdateState", device.firmwareUpdateState::class.simpleName)
        put("firmwareUpdateAvailable", firmwareState(device.firmwareUpdateAvailable.result))
      }
    }
  }

  private fun firmwareState(result: FirmwareUpdateCheckResult?): String? {
    return when (result) {
      null -> null
      is FirmwareUpdateCheckResult.FoundUpdate -> "update-available"
      FirmwareUpdateCheckResult.FoundNoUpdate -> "no-update"
      is FirmwareUpdateCheckResult.UpdateCheckFailed -> "failed"
    }
  }
}

private object NoOpTokenProvider : TokenProvider {
  override suspend fun getDevToken(): String? = null
}

private object DisabledTranscriptionProvider : TranscriptionProvider {
  override suspend fun transcribe(
    encoderInfo: VoiceEncoderInfo,
    audioFrames: kotlinx.coroutines.flow.Flow<UByteArray>,
    isNotificationReply: Boolean,
  ): TranscriptionResult = TranscriptionResult.Disabled

  override suspend fun canServeSession(): Boolean = false
}

private object NoOpWebServices : WebServices {
  override suspend fun fetchLocker(): LockerModelWrapper? = null

  override suspend fun removeFromLocker(id: Uuid): Boolean = false

  override suspend fun checkForFirmwareUpdate(watch: WatchInfo): FirmwareUpdateCheckResult =
    FirmwareUpdateCheckResult.FoundNoUpdate

  override fun uploadMemfaultChunk(chunk: ByteArray, watchInfo: WatchInfo) = Unit
}
