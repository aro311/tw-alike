import SwiftUI
import Combine
import shared

@MainActor
class WatchlistViewModelWrapper: ObservableObject {
    private let helper = WatchlistViewModelHelper()
    @Published var state: WatchlistState = WatchlistState(items: [], isLoading: true, error: nil)
    private var task: Task<Void, Never>?

    func start() {
        task = Task {
            for await s in helper.viewModel.state {
                self.state = s
            }
        }
    }

    func stop() { task?.cancel() }

    func removeEntry(symbol: String) {
        helper.viewModel.removeEntry(symbol: symbol)
    }
}

struct WatchlistScreen: View {
    @StateObject private var wrapper = WatchlistViewModelWrapper()
    @State private var showSearch = false

    var body: some View {
        List {
            ForEach(wrapper.state.items, id: \.entry.symbol) { item in
                NavigationLink(destination: ChartScreen(symbol: item.entry.symbol)) {
                    WatchlistRow(item: item)
                }
            }
            .onDelete { indexSet in
                for i in indexSet {
                    wrapper.removeEntry(symbol: wrapper.state.items[i].entry.symbol)
                }
            }
        }
        .navigationTitle("TWAlike")
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                Button { showSearch = true } label: {
                    Image(systemName: "plus")
                }
            }
        }
        .sheet(isPresented: $showSearch) {
            CoinSearchSheet(onDismiss: { showSearch = false })
        }
        .overlay {
            if wrapper.state.isLoading && wrapper.state.items.isEmpty {
                ProgressView()
            }
        }
        .onAppear { wrapper.start() }
        .onDisappear { wrapper.stop() }
    }
}

struct WatchlistRow: View {
    let item: DomainWatchlistItem

    var body: some View {
        HStack {
            CoinIconView(symbol: item.entry.symbol)
            Text(item.entry.symbol).font(.headline)
            Spacer()
            VStack(alignment: .trailing, spacing: 2) {
                if let ticker = item.ticker {
                    Text(String(format: "%.2f", ticker.lastPrice)).font(.headline)
                    Text(String(format: "%.2f%%", ticker.priceChangePercent))
                        .font(.caption)
                        .foregroundColor(ticker.priceChangePercent >= 0 ? Color(hex: "26A69A") : Color(hex: "EF5350"))
                } else {
                    Text("--").font(.headline)
                }
            }
        }
        .padding(.vertical, 4)
    }
}
