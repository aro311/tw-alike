import SwiftUI
import Combine
import WebKit
import shared

@MainActor
class ChartViewModelWrapper: ObservableObject {
    private let helper: ChartViewModelHelper
    @Published var state: ChartState
    private var task: Task<Void, Never>?

    init(symbol: String) {
        helper = ChartViewModelHelper(symbol: symbol)
        state = ChartState(
            symbol: symbol,
            interval: .oneDay,
            klineWindow: nil,
            indicators: [],
            drawings: [],
            isLoading: true,
            isStale: false,
            error: nil
        )
    }

    func start() {
        task = Task {
            for await s in helper.viewModel.state {
                self.state = s
            }
        }
    }

    func stop() { task?.cancel() }
    func changeInterval(_ interval: DomainInterval) { helper.viewModel.changeInterval(interval: interval) }
}

struct ChartScreen: View {
    let symbol: String
    @StateObject private var wrapper: ChartViewModelWrapper
    @State private var webView = WKWebView()

    init(symbol: String) {
        self.symbol = symbol
        _wrapper = StateObject(wrappedValue: ChartViewModelWrapper(symbol: symbol))
    }

    var body: some View {
        ZStack(alignment: .top) {
            ChartWebView(webView: webView)
                .ignoresSafeArea(edges: .bottom)

            if wrapper.state.isStale {
                Text("Showing cached data")
                    .font(.caption)
                    .padding(6)
                    .background(Color.yellow.opacity(0.2))
                    .cornerRadius(4)
                    .padding(.top, 4)
            }

            if wrapper.state.isLoading {
                ProgressView()
            }
        }
        .navigationTitle(symbol)
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                IntervalPicker(selected: wrapper.state.interval) { interval in
                    wrapper.changeInterval(interval)
                }
            }
        }
        .onChange(of: wrapper.state.klineWindow) { window in
            guard let window else { return }
            pushChartData(window: window, indicators: wrapper.state.indicators)
        }
        .onAppear {
            loadWebView()
            wrapper.start()
        }
        .onDisappear { wrapper.stop() }
    }

    private func loadWebView() {
        webView.configuration.preferences.javaScriptEnabled = true
        if let url = Bundle.main.url(forResource: "index", withExtension: "html", subdirectory: "chart") {
            webView.loadFileURL(url, allowingReadAccessTo: url.deletingLastPathComponent())
        }
    }

    private func pushChartData(window: DomainKlineWindow, indicators: [DomainIndicatorResult]) {
        let klines = window.klines.map { k -> [String: Any] in
            ["time": k.openTime, "open": k.open, "high": k.high, "low": k.low, "close": k.close, "volume": k.volume]
        }
        let inds = indicators.map { r -> [String: Any] in
            ["type": r.type.name, "pane": r.pane.name, "series": r.series.map { s -> [String: Any] in
                ["name": s.name, "values": s.values]
            }]
        }
        guard let json = try? JSONSerialization.data(withJSONObject: ["klines": klines, "indicators": inds]),
              let jsonStr = String(data: json, encoding: .utf8) else { return }
        webView.evaluateJavaScript("initChart(\(jsonStr))", completionHandler: nil)
    }
}

struct ChartWebView: UIViewRepresentable {
    let webView: WKWebView
    func makeUIView(context: Context) -> WKWebView { webView }
    func updateUIView(_ uiView: WKWebView, context: Context) {}
}

struct IntervalPicker: View {
    let selected: DomainInterval
    let onSelect: (DomainInterval) -> Void

    var body: some View {
        Menu {
            ForEach(DomainInterval.allCases, id: \.value) { interval in
                Button(interval.displayLabel) { onSelect(interval) }
            }
        } label: {
            Text(selected.displayLabel).font(.subheadline)
        }
    }
}
