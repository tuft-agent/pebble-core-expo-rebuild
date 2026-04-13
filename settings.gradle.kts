import java.util.Properties

val properties = Properties()
if (file("local.properties").exists()) {
    file("local.properties").inputStream().use { properties.load(it) }
}

pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
        maven { url = uri("https://jitpack.io") }
    }
    plugins {
        id("com.android.application") version "8.13.2"
        id("com.android.library") version "8.13.2"
        id("org.jetbrains.compose") version "1.10.1"
        id("org.jetbrains.kotlin.jvm") version "2.3.10"
        id("org.jetbrains.kotlin.multiplatform") version "2.3.10"
        id("org.jetbrains.kotlin.native.cocoapods") version "2.3.10"
        id("org.jetbrains.kotlin.plugin.compose") version "2.3.10"
        id("org.jetbrains.kotlin.plugin.serialization") version "2.3.10"
        id("org.jetbrains.kotlinx.atomicfu") version "0.29.0"
        id("androidx.room") version "2.8.4"
        id("com.google.devtools.ksp") version "2.3.5"
    }
}

dependencyResolutionManagement {
    repositories {
        google()
        mavenCentral()
        maven(url = "https://jitpack.io")
    }
}

rootProject.name = "libpebbleroot"

include(":libpebble3")
include(":blobdbgen")
include(":blobannotations")
include(":composeApp")
include(":pebble")
include(":util")
include(":mcp")
include(":index-ai")
include(":resampler")
include(":cactus")
include(":experimental")
include(":krisp-stubs")
