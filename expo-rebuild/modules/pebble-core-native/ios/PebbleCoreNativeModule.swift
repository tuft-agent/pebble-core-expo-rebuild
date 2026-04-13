import ExpoModulesCore
import Foundation
import UIKit
import UserNotifications
import libpebble3

public final class PebbleCoreNativeModule: Module {
  private let bridge = PebbleCoreIOSAdapter()

  public func definition() -> ModuleDefinition {
    Name("PebbleCoreNative")

    Events("onStateChange", "onConnectionEvent", "onUserFacingError")

    AsyncFunction("isSupportedAsync") {
      ExpoPebbleCoreBridge.shared.isSupported()
    }
    .runOnQueue(.main)

    AsyncFunction("initializeAsync") {
      try self.bridge.state(from: ExpoPebbleCoreBridge.shared.initialize())
    }
    .runOnQueue(.main)

    AsyncFunction("onPermissionsHandledAsync") {
      try self.bridge.state(from: ExpoPebbleCoreBridge.shared.onPermissionsHandled())
    }
    .runOnQueue(.main)

    AsyncFunction("getStateAsync") {
      try self.bridge.state(from: ExpoPebbleCoreBridge.shared.getState())
    }
    .runOnQueue(.main)

    AsyncFunction("getWatchesAsync") {
      try self.bridge.watchList(from: ExpoPebbleCoreBridge.shared.getWatches())
    }
    .runOnQueue(.main)

    AsyncFunction("startBleScanAsync") {
      try self.bridge.state(from: ExpoPebbleCoreBridge.shared.startBleScan())
    }
    .runOnQueue(.main)

    AsyncFunction("stopBleScanAsync") {
      try self.bridge.state(from: ExpoPebbleCoreBridge.shared.stopBleScan())
    }
    .runOnQueue(.main)

    AsyncFunction("connectAsync") { (identifier: String) in
      try self.bridge.state(from: ExpoPebbleCoreBridge.shared.connectWithIdentifier(identifier: identifier))
    }
    .runOnQueue(.main)

    AsyncFunction("disconnectAsync") { (identifier: String) in
      try self.bridge.state(from: ExpoPebbleCoreBridge.shared.disconnectWithIdentifier(identifier: identifier))
    }
    .runOnQueue(.main)

    AsyncFunction("forgetAsync") { (identifier: String) in
      try self.bridge.state(from: ExpoPebbleCoreBridge.shared.forgetWithIdentifier(identifier: identifier))
    }
    .runOnQueue(.main)

    AsyncFunction("debugStateAsync") {
      ExpoPebbleCoreBridge.shared.debugState()
    }
    .runOnQueue(.main)

    AsyncFunction("hasNotificationAccessAsync") { (promise: Promise) in
      UNUserNotificationCenter.current().getNotificationSettings { settings in
        let status = settings.authorizationStatus
        promise.resolve(
          status == .authorized || status == .provisional || status == .ephemeral
        )
      }
    }
    .runOnQueue(.main)

    AsyncFunction("openNotificationAccessSettingsAsync") {
      guard let url = URL(string: UIApplication.openSettingsURLString) else {
        return
      }
      UIApplication.shared.open(url)
    }
    .runOnQueue(.main)
  }
}

private final class PebbleCoreIOSAdapter {
  func state(from jsonString: String) throws -> [String: Any] {
    try dictionary(from: jsonString)
  }

  func watchList(from jsonString: String) throws -> [[String: Any]] {
    let object = try jsonObject(from: jsonString)
    guard let watches = object as? [[String: Any]] else {
      throw PebbleCoreIOSAdapterError.invalidJSONArray
    }
    return watches
  }

  private func dictionary(from jsonString: String) throws -> [String: Any] {
    let object = try jsonObject(from: jsonString)
    guard let state = object as? [String: Any] else {
      throw PebbleCoreIOSAdapterError.invalidJSONObject
    }
    return state
  }

  private func jsonObject(from jsonString: String) throws -> Any {
    let data = Data(jsonString.utf8)
    return try JSONSerialization.jsonObject(with: data)
  }
}

private enum PebbleCoreIOSAdapterError: Error {
  case invalidJSONObject
  case invalidJSONArray
}
