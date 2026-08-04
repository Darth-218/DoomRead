plugins {
    alias(libs.plugins.kotlin.multiplatform)
    alias(libs.plugins.kotlinx.serialization)
    alias(libs.plugins.android.library)
}

kotlin {
    jvm()
    androidTarget()
    js(IR) {
        nodejs()
        outputModuleName.set("core")
    }

    sourceSets {
        commonMain.dependencies {
            implementation(libs.kotlinx.serialization.json)
        }
        commonTest.dependencies {
            implementation(kotlin("test"))
        }
    }
}

android {
    namespace = "dev.doomread.core"
    compileSdk = 36
    buildToolsVersion = "36.1.0"
    defaultConfig {
        minSdk = 26
    }
}
