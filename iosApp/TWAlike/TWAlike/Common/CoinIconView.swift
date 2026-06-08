import SwiftUI

struct CoinIconView: View {
    let symbol: String

    private var baseAsset: String {
        String(symbol.prefix(while: { $0.isLetter }))
    }

    var body: some View {
        Circle()
            .fill(Color(hex: colorForSymbol(symbol)))
            .frame(width: 40, height: 40)
            .overlay(
                Text(String(baseAsset.prefix(2)))
                    .font(.system(size: 13, weight: .bold))
                    .foregroundColor(.white)
            )
    }

    private func colorForSymbol(_ s: String) -> String {
        let colors = ["1A6FE0", "E0701A", "1AE09A", "E01A6F", "701AE0", "E0C71A"]
        let index = s.unicodeScalars.reduce(0) { $0 + Int($1.value) } % colors.count
        return colors[index]
    }
}

extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let r = Double((int >> 16) & 0xFF) / 255
        let g = Double((int >> 8) & 0xFF) / 255
        let b = Double(int & 0xFF) / 255
        self.init(red: r, green: g, blue: b)
    }
}
