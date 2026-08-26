import org.jetbrains.kotlin.gradle.dsl.JsModuleKind
import org.jetbrains.kotlin.gradle.targets.js.ir.KotlinJsIrLink

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
        binaries.executable()
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

// Only the production executable is emitted as an ES module (so Vite can
// import it). The test compilation keeps the default UMD so jsNodeTest works.
tasks.withType<KotlinJsIrLink>().configureEach {
    if (name == "compileProductionExecutableKotlinJs") {
        compilerOptions.moduleKind.set(JsModuleKind.MODULE_ES)
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

// Copy the compiled ES-module core into the web app so Vite can import it.
// KGP 2.3.x emits the production executable as ESM *.mjs files; core.mjs
// imports its siblings (stdlib, serialization, ...) by their .mjs names, so
// they must all be copied verbatim. Vite resolves the extensionless import
// path to core.mjs, and core.d.ts supplies the types.
tasks.register<Copy>("prepareWebCore") {
    val dest = rootProject.layout.projectDirectory.dir("webApp/src/lib/core")
    dependsOn("jsProductionExecutableCompileSync")
    from(layout.buildDirectory.dir("compileSync/js/main/productionExecutable/kotlin")) {
        include("*.mjs", "*.mjs.map")
    }
    into(dest)
    doFirst {
        // Drop stale renamed outputs from the earlier .mjs->.js scheme so Vite
        // only ever sees the current core.mjs (core.d.ts is kept, it's ours).
        project.delete(dest.file("core.js"), dest.file("core.js.map"))
    }
    doLast {
        val f = dest.file("core.mjs").asFile
        if (!f.exists()) {
            logger.lifecycle("core.mjs MISSING")
            return@doLast
        }
        val text = f.readText()
        logger.lifecycle("core.mjs ${text.length} bytes")
        logger.lifecycle("ESM export present: ${text.contains("export {")}")
    }
}
