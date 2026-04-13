package io.rebble.libpebblecommon.expo

import io.rebble.libpebblecommon.connection.BleDiscoveredPebbleDevice
import io.rebble.libpebblecommon.connection.CommonConnectedDevice
import io.rebble.libpebblecommon.connection.ConnectedPebbleDevice
import io.rebble.libpebblecommon.connection.ConnectingPebbleDevice
import io.rebble.libpebblecommon.connection.DisconnectingPebbleDevice
import io.rebble.libpebblecommon.connection.FirmwareUpdateCheckResult
import io.rebble.libpebblecommon.connection.KnownPebbleDevice
import io.rebble.libpebblecommon.connection.LibPebble
import io.rebble.libpebblecommon.connection.PebbleDevice
import kotlinx.serialization.Serializable
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import kotlin.time.ExperimentalTime

private val bridgeJson = Json {
    encodeDefaults = true
    explicitNulls = false
}

@Serializable
internal data class PebbleCoreStateSnapshot(
    val initialized: Boolean,
    val bluetooth: String,
    val bluetoothEnabled: Boolean,
    val scanning: Boolean,
    val watches: List<PebbleCoreWatchSnapshot>,
)

@Serializable
internal data class PebbleCoreWatchSnapshot(
    val identifier: String,
    val name: String,
    val displayName: String,
    val nickname: String? = null,
    val kind: String,
    val connectionFailures: Int,
    val connectionFailureReason: String? = null,
    val rssi: Int? = null,
    val firmware: String? = null,
    val serial: String? = null,
    val watchType: String? = null,
    val lastConnectedEpochMs: Long? = null,
    val capabilities: List<String>? = null,
    val batteryLevel: Int? = null,
    val usingBtClassic: Boolean? = null,
    val watchInfoName: String? = null,
    val watchInfoPlatform: String? = null,
    val watchInfoRevision: String? = null,
    val watchInfoBoard: String? = null,
    val negotiating: Boolean? = null,
    val rebootingAfterFirmwareUpdate: Boolean? = null,
    val runningApp: String? = null,
    val devConnectionActive: Boolean? = null,
    val firmwareUpdateState: String? = null,
    val firmwareUpdateAvailable: String? = null,
)

internal fun LibPebble.snapshotJson(): String = bridgeJson.encodeToString(snapshot())

internal fun LibPebble.watchesJson(): String = bridgeJson.encodeToString(
    watches.value.map(PebbleDevice::snapshot)
)

internal fun LibPebble.snapshot(): PebbleCoreStateSnapshot = PebbleCoreStateSnapshot(
    initialized = true,
    bluetooth = bluetoothEnabled.value.name,
    bluetoothEnabled = bluetoothEnabled.value.enabled(),
    scanning = isScanningBle.value,
    watches = watches.value.map(PebbleDevice::snapshot),
)

@OptIn(ExperimentalTime::class)
internal fun PebbleDevice.snapshot(): PebbleCoreWatchSnapshot {
    val kind = when (this) {
        is ConnectedPebbleDevice -> "connected"
        is CommonConnectedDevice -> "connected"
        is ConnectingPebbleDevice -> "connecting"
        is DisconnectingPebbleDevice -> "disconnecting"
        is BleDiscoveredPebbleDevice -> "discovered"
        is KnownPebbleDevice -> "known"
        else -> "unknown"
    }

    return PebbleCoreWatchSnapshot(
        identifier = identifier.asString,
        name = name,
        displayName = displayName(),
        nickname = nickname,
        kind = kind,
        connectionFailures = connectionFailureInfo?.times ?: 0,
        connectionFailureReason = connectionFailureInfo?.reason?.name,
        rssi = (this as? BleDiscoveredPebbleDevice)?.rssi,
        firmware = (this as? KnownPebbleDevice)?.runningFwVersion,
        serial = (this as? KnownPebbleDevice)?.serial,
        watchType = (this as? KnownPebbleDevice)?.watchType?.name,
        lastConnectedEpochMs = (this as? KnownPebbleDevice)?.lastConnected?.toEpochMilliseconds(),
        capabilities = (this as? KnownPebbleDevice)?.capabilities?.map { it.name },
        batteryLevel = (this as? CommonConnectedDevice)?.batteryLevel,
        usingBtClassic = (this as? CommonConnectedDevice)?.usingBtClassic,
        watchInfoName = (this as? CommonConnectedDevice)?.watchInfo?.platform?.watchType?.codename,
        watchInfoPlatform = (this as? CommonConnectedDevice)?.watchInfo?.platform?.name,
        watchInfoRevision = (this as? CommonConnectedDevice)?.watchInfo?.platform?.revision?.toString(),
        watchInfoBoard = (this as? CommonConnectedDevice)?.watchInfo?.board?.toString(),
        negotiating = (this as? ConnectingPebbleDevice)?.negotiating,
        rebootingAfterFirmwareUpdate = (this as? ConnectingPebbleDevice)?.rebootingAfterFirmwareUpdate,
        runningApp = (this as? ConnectedPebbleDevice)?.runningApp?.value?.toString(),
        devConnectionActive = (this as? ConnectedPebbleDevice)?.devConnectionActive?.value,
        firmwareUpdateState = (this as? ConnectedPebbleDevice)?.firmwareUpdateState?.let {
            it::class.simpleName
        },
        firmwareUpdateAvailable = (this as? ConnectedPebbleDevice)?.firmwareUpdateAvailable?.result.firmwareState(),
    )
}

private fun FirmwareUpdateCheckResult?.firmwareState(): String? = when (this) {
    null -> null
    is FirmwareUpdateCheckResult.FoundUpdate -> "update-available"
    FirmwareUpdateCheckResult.FoundNoUpdate -> "no-update"
    is FirmwareUpdateCheckResult.UpdateCheckFailed -> "failed"
}
