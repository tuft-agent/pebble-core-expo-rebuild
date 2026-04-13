Pod::Spec.new do |s|
  s.name           = 'PebbleCoreNative'
  s.version        = '1.0.0'
  s.summary        = 'Expo bridge for the Core Devices Pebble runtime'
  s.description    = 'Wraps the upstream libpebble3 iOS runtime inside an Expo native module.'
  s.author         = ''
  s.homepage       = 'https://github.com/coredevices/mobileapp'
  s.platforms      = {
    :ios => '15.1'
  }
  s.source         = { git: 'https://github.com/coredevices/mobileapp' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'
  s.preserve_paths = ['vendor/**/*.framework', 'build-pebble-frameworks.sh']
  s.vendored_frameworks = ['vendor/libpebble3.framework', 'vendor/LibPebbleSwift.framework']

  # Swift/Objective-C compatibility
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'FRAMEWORK_SEARCH_PATHS' => '$(inherited) "${PODS_TARGET_SRCROOT}/vendor"',
    'OTHER_LDFLAGS' => '$(inherited) -framework "libpebble3" -framework "LibPebbleSwift"',
  }
  s.user_target_xcconfig = {
    'FRAMEWORK_SEARCH_PATHS' => '$(inherited) "${SRCROOT}/../modules/pebble-core-native/ios/vendor"',
    'OTHER_LDFLAGS' => '$(inherited) -framework "libpebble3" -framework "LibPebbleSwift"',
  }

  script_phase = {
    name: '[PebbleCore] Build upstream iOS frameworks',
    execution_position: :before_compile,
    script: <<-EOS
set -euo pipefail
"$PODS_TARGET_SRCROOT/build-pebble-frameworks.sh"
    EOS
  }

  if Gem::Version.new(Pod::VERSION) >= Gem::Version.new('1.13.0')
    script_phase[:always_out_of_date] = '1'
  end

  s.script_phase = script_phase
  s.source_files = "**/*.{h,m,mm,swift,hpp,cpp}"
  s.exclude_files = 'vendor/**/*'
end
