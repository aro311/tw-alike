plugins {
    alias(libs.plugins.kotlin.multiplatform)
    alias(libs.plugins.android.library.multiplatform)
}

kotlin {
    android {
        compileSdk = 37
        namespace = "com.twalike.domain"
    }
    iosX64()
    iosArm64()
    iosSimulatorArm64()

    sourceSets {
        commonMain.dependencies {
            implementation(libs.kotlinx.coroutines.core)
        }
        commonTest.dependencies {
            implementation(kotlin("test"))
            implementation(libs.kotlinx.coroutines.test)
            implementation(libs.turbine)
        }
    }
}
