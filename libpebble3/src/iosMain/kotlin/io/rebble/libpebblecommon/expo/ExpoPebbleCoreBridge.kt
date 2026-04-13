package io.rebble.libpebblecommon.expo

import io.rebble.libpebblecommon.LibPebbleConfig
import io.rebble.libpebblecommon.connection.AppContext
import io.rebble.libpebblecommon.connection.CommonConnectedDevice
import io.rebble.libpebblecommon.connection.ConnectedPebbleDevice
import io.rebble.libpebblecommon.connection.ConnectingPebbleDevice
import io.rebble.libpebblecommon.connection.DisconnectingPebbleDevice
import io.rebble.libpebblecommon.connection.FirmwareUpdateCheckResult
import io.rebble.libpebblecommon.connection.KnownPebbleDevice
import io.rebble.libpebblecommon.connection.LibPebble
import io.rebble.libpebblecommon.connection.LibPebble3
import io.rebble.libpebblecommon.connection.TokenProvider
import io.rebble.libpebblecommon.connection.WebServices
import io.rebble.libpebblecommon.services.WatchInfo
import io.rebble.libpebblecommon.voice.TranscriptionProvider
import io.rebble.libpebblecommon.voice.TranscriptionResult
import io.rebble.libpebblecommon.voice.VoiceEncoderInfo
import io.rebble.libpebblecommon.web.LockerModelWrapper
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlin.experimental.ExperimentalObjCName
import kotlin.native.ObjCName
import kotlin.uuid.Uuid

@OptIn(ExperimentalObjCName::class)
@ObjCName("ExpoPebbleCoreBridge")
object ExpoPebbleCoreBridge {
    private var libPebble: LibPebble? = null

    @ObjCName("isSupported")
    fun isSupported(): Boolean = true

    @ObjCName("initialize")
    fun initialize(): String = ensureInitialized().snapshotJson()

    @ObjCName("onPermissionsHandled")
    fun onPermissionsHandled(): String {
        val pebble = ensureInitialized()
        pebble.doStuffAfterPermissionsGranted()
        return pebble.snapshotJson()
    }

    @ObjCName("getState")
    fun getState(): String = ensureInitialized().snapshotJson()

    @ObjCName("getWatches")
    fun getWatches(): String = ensureInitialized().watchesJson()

    @ObjCName("startBleScan")
    fun startBleScan(): String {
        val pebble = ensureInitialized()
        pebble.startBleScan()
        return pebble.snapshotJson()
    }

    @ObjCName("stopBleScan")
    fun stopBleScan(): String {
        val pebble = ensureInitialized()
        pebble.stopBleScan()
        return pebble.snapshotJson()
    }

    @ObjCName("connectWithIdentifier")
    fun connect(identifier: String): String {
        val pebble = ensureInitialized()
        pebble.watches.value.firstOrNull { it.identifier.asString == identifier }?.connect()
        return pebble.snapshotJson()
    }

    @ObjCName("disconnectWithIdentifier")
    fun disconnect(identifier: String): String {
        val pebble = ensureInitialized()
        pebble.watches.value.firstOrNull { it.identifier.asString == identifier }?.let { device ->
            when (device) {
                is CommonConnectedDevice -> device.disconnect()
                is ConnectingPebbleDevice -> device.disconnect()
                is DisconnectingPebbleDevice -> Unit
                else -> Unit
            }
        }
        return pebble.snapshotJson()
    }

    @ObjCName("forgetWithIdentifier")
    fun forget(identifier: String): String {
        val pebble = ensureInitialized()
        pebble.watches.value.firstOrNull { it.identifier.asString == identifier }?.let { device ->
            if (device is KnownPebbleDevice) {
                device.forget()
            }
        }
        return pebble.snapshotJson()
    }

    @ObjCName("debugState")
    fun debugState(): String = ensureInitialized().watchesDebugState()

    private fun ensureInitialized(): LibPebble {
        val existing = libPebble
        if (existing != null) {
            return existing
        }

        val created = LibPebble3.create(
            defaultConfig = LibPebbleConfig(),
            webServices = NoOpWebServices,
            appContext = AppContext(),
            tokenProvider = NoOpTokenProvider,
            proxyTokenProvider = MutableStateFlow(null),
            transcriptionProvider = DisabledTranscriptionProvider,
        )
        created.init()
        libPebble = created
        return created
    }
}

private object NoOpTokenProvider : TokenProvider {
    override suspend fun getDevToken(): String? = null
}

private object DisabledTranscriptionProvider : TranscriptionProvider {
    override suspend fun transcribe(
        encoderInfo: VoiceEncoderInfo,
        audioFrames: Flow<UByteArray>,
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
