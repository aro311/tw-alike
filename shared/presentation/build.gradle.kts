import org.jetbrains.kotlin.gradle.plugin.mpp.apple.XCFramework

plugins {
    alias(libs.plugins.kotlin.multiplatform)
    alias(libs.plugins.android.library.multiplatform)
    alias(libs.plugins.skie)
}

kotlin {
    android {
        compileSdk = 37
        namespace = "com.twalike.presentation"
    }
    val xcf = XCFramework("shared")
    listOf(iosX64(), iosArm64(), iosSimulatorArm64()).forEach { target ->
        target.binaries.framework {
            baseName = "shared"
            isStatic = true
            xcf.add(this)
        }
    }

    sourceSets {
        commonMain.dependencies {
            implementation(projects.shared.domain)
            implementation(libs.kotlinx.coroutines.core)
            implementation(libs.koin.core)
        }
        androidMain.dependencies {
            implementation(libs.kotlinx.coroutines.android)
        }
        iosMain.dependencies {
            implementation(projects.shared.data)
        }
        commonTest.dependencies {
            implementation(kotlin("test"))
            implementation(libs.kotlinx.coroutines.test)
            implementation(libs.turbine)
        }
        androidUnitTest.dependencies {
            implementation(libs.mockk)
        }
    }
}
