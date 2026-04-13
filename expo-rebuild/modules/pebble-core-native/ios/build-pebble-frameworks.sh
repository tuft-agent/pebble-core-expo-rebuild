#!/bin/bash

set -euo pipefail

SCRIPT_ROOT="$(cd "$(dirname "$0")" && pwd)"
MODULE_ROOT="$(cd "$SCRIPT_ROOT/.." && pwd)"
REPO_ROOT="$(cd "$MODULE_ROOT/../../.." && pwd)"
VENDOR_ROOT="$SCRIPT_ROOT/vendor"
PLATFORM_NAME="${PLATFORM_NAME:-iphonesimulator}"
CONFIGURATION="${CONFIGURATION:-Debug}"
CONFIGURATION_LOWER="$(printf '%s' "$CONFIGURATION" | tr '[:upper:]' '[:lower:]')"
ARCHS_VALUE="${ARCHS:-${NATIVE_ARCH_ACTUAL:-arm64}}"

if [[ -z "${JAVA_HOME:-}" && -d "/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home" ]]; then
  export JAVA_HOME="/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home"
fi

case "$PLATFORM_NAME" in
  iphoneos)
    KOTLIN_TARGET="IosArm64"
    SWIFT_SDK="iphoneos"
    ;;
  iphonesimulator)
    if [[ "$ARCHS_VALUE" == *"x86_64"* ]]; then
      KOTLIN_TARGET="IosX64"
    else
      KOTLIN_TARGET="IosSimulatorArm64"
    fi
    SWIFT_SDK="iphonesimulator"
    ;;
  *)
    echo "Unsupported PLATFORM_NAME: $PLATFORM_NAME" >&2
    exit 1
    ;;
esac

GRADLE_TASK=":libpebble3:link${CONFIGURATION}Framework${KOTLIN_TARGET}"

(
  cd "$REPO_ROOT"
  ./gradlew "$GRADLE_TASK"
)

KOTLIN_FRAMEWORK="$REPO_ROOT/libpebble3/build/bin/${KOTLIN_TARGET}/${CONFIGURATION_LOWER}Framework/libpebble3.framework"
SWIFT_FRAMEWORK="$REPO_ROOT/libpebble3/build/libpebble-swift/${SWIFT_SDK}/LibPebbleSwift.framework"

if [[ ! -d "$KOTLIN_FRAMEWORK" ]]; then
  echo "Missing Kotlin framework at $KOTLIN_FRAMEWORK" >&2
  exit 1
fi

if [[ ! -d "$SWIFT_FRAMEWORK" ]]; then
  echo "Missing Swift framework at $SWIFT_FRAMEWORK" >&2
  exit 1
fi

mkdir -p "$VENDOR_ROOT"
rm -rf "$VENDOR_ROOT/libpebble3.framework" "$VENDOR_ROOT/LibPebbleSwift.framework"
rsync -a "$KOTLIN_FRAMEWORK/" "$VENDOR_ROOT/libpebble3.framework/"
rsync -a "$SWIFT_FRAMEWORK/" "$VENDOR_ROOT/LibPebbleSwift.framework/"
