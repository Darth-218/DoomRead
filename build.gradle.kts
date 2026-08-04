import org.jetbrains.kotlin.gradle.targets.js.nodejs.NodeJsEnvSpec
import org.jetbrains.kotlin.gradle.targets.js.nodejs.NodeJsPlugin

plugins {
    alias(libs.plugins.kotlin.multiplatform) apply false
    alias(libs.plugins.kotlinx.serialization) apply false
    alias(libs.plugins.android.library) apply false
}

allprojects {
    plugins.withType<NodeJsPlugin> {
        extensions.configure<NodeJsEnvSpec> {
            download.set(false)
        }
    }
}
