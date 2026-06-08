import SwiftUI

struct AppRootView: View {
    var body: some View {
        TabView {
            NavigationStack {
                WatchlistScreen()
            }
            .tabItem {
                Label("Watchlist", systemImage: "list.bullet")
            }

            NavigationStack {
                SettingsScreen()
            }
            .tabItem {
                Label("Settings", systemImage: "gearshape")
            }
        }
        .preferredColorScheme(.dark)
    }
}
