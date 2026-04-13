plugins {
    id("org.jetbrains.kotlin.jvm")
    id("com.google.devtools.ksp")
}

dependencies {
    implementation(project(":blobannotations"))
    implementation(kotlin("stdlib-jdk8"))
    implementation("com.google.devtools.ksp:symbol-processing-api:2.1.20-1.0.32")
    implementation("com.squareup:kotlinpoet:2.1.0")
    implementation("com.squareup:kotlinpoet-ksp:2.1.0")
}

kotlin {
    jvmToolchain(libs.versions.jvm.toolchain.get().toInt())
}
