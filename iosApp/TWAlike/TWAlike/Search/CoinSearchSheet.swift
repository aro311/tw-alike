import SwiftUI
import Combine
import shared

@MainActor
class CoinSearchViewModelWrapper: ObservableObject {
    private let helper = CoinSearchViewModelHelper()
    @Published var state: CoinSearchState = CoinSearchState(query: "", results: [], isLoading: false)
    private var task: Task<Void, Never>?

    func start() {
        task = Task {
            for await s in helper.viewModel.state {
                self.state = s
            }
        }
    }

    func stop() { task?.cancel() }
    func updateQuery(_ query: String) { helper.viewModel.updateQuery(query: query) }
    func addToWatchlist(_ symbol: String) { helper.viewModel.addToWatchlist(symbol: symbol) }
}

struct CoinSearchSheet: View {
    let onDismiss: () -> Void
    @StateObject private var wrapper = CoinSearchViewModelWrapper()
    @State private var query = ""

    var body: some View {
        NavigationStack {
            List(wrapper.state.results, id: \.name) { symbol in
                Button {
                    wrapper.addToWatchlist(symbol.name)
                    onDismiss()
                } label: {
                    VStack(alignment: .leading) {
                        Text(symbol.name).font(.headline)
                        Text("\(symbol.baseAsset) / \(symbol.quoteAsset)")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }
                .foregroundColor(.primary)
            }
            .searchable(text: $query, prompt: "Search symbol, e.g. BTC")
            .onChange(of: query) { wrapper.updateQuery($0) }
            .navigationTitle("Add Symbol")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") { onDismiss() }
                }
            }
        }
        .onAppear { wrapper.start() }
        .onDisappear { wrapper.stop() }
    }
}
