import SwiftUI
import shared

@main
struct TWAlikeApp: App {
    init() {
        doInitKoin()
    }

    var body: some Scene {
        WindowGroup {
            AppRootView()
        }
    }
}
