import SwiftUI
import Combine
import shared

@MainActor
class SettingsViewModelWrapper: ObservableObject {
    private let helper = SettingsViewModelHelper()
    @Published var state: SettingsState = SettingsState(
        favoriteIntervals: [],
        allIntervals: DomainInterval.allCases
    )
    private var task: Task<Void, Never>?

    func start() {
        task = Task {
            for await s in helper.viewModel.state {
                self.state = s
            }
        }
    }

    func stop() { task?.cancel() }
    func addFavorite(_ interval: DomainInterval) { helper.viewModel.addFavorite(interval: interval) }
    func removeFavorite(_ interval: DomainInterval) { helper.viewModel.removeFavorite(interval: interval) }
}

struct SettingsScreen: View {
    @StateObject private var wrapper = SettingsViewModelWrapper()

    private var favoriteSet: Set<String> {
        Set(wrapper.state.favoriteIntervals.map { $0.interval.value })
    }

    var body: some View {
        List {
            Section {
                LazyVGrid(columns: [GridItem(.adaptive(minimum: 70))], spacing: 8) {
                    ForEach(wrapper.state.allIntervals, id: \.value) { interval in
                        let isFav = favoriteSet.contains(interval.value)
                        Button {
                            if isFav { wrapper.removeFavorite(interval) }
                            else { wrapper.addFavorite(interval) }
                        } label: {
                            Text(interval.displayLabel)
                                .font(.subheadline)
                                .padding(.horizontal, 12)
                                .padding(.vertical, 6)
                                .frame(maxWidth: .infinity)
                                .background(isFav ? Color.accentColor : Color(.systemGray5))
                                .foregroundColor(isFav ? .white : .primary)
                                .cornerRadius(8)
                        }
                        .buttonStyle(.plain)
                    }
                }
                .padding(.vertical, 4)
            } header: {
                Text("Favorite Intervals")
            } footer: {
                Text("Starred intervals appear at the top of the interval picker.")
            }
        }
        .navigationTitle("Settings")
        .onAppear { wrapper.start() }
        .onDisappear { wrapper.stop() }
    }
}
