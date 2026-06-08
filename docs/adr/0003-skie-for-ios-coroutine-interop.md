# SKIE for Kotlin coroutine / StateFlow interop on iOS

We use the SKIE Gradle plugin (by Touchlab) to expose KMP `StateFlow` and coroutines as native Swift `AsyncStream` and `async/await`. Without SKIE, each shared ViewModel requires a hand-written Swift `ObservableObject` wrapper (~15 lines per ViewModel) to bridge `StateFlow` to SwiftUI. SKIE eliminates this boilerplate entirely, keeping iOS code idiomatic Swift with no wrapper classes.
