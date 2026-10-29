// Top-level build file where you can add configuration options common to all sub-projects/modules.
plugins {
    id("com.android.application") version "8.5.2" apply false
    id("org.jetbrains.kotlin.android") version "1.9.24" apply false
    id("org.mozilla.rust-android-gradle.rust-android") version "0.9.4" apply false
}

buildscript {
    repositories {
        google()
        mavenCentral()
    }
}

