import SwiftUI

// MARK: - Content View
struct ContentView: View {
    @State private var showSettings = false
    
    var body: some View {
        ZStack {
            // Light gray background instead of transparent for visibility
            Color.gray.opacity(0.1)
            
            // WebView container
            GaiaWebView()
                .edgesIgnoringSafeArea(.all)
            
            // Control buttons (add chat and settings)
            VStack {
                Spacer()
                HStack {
                    Spacer()
                    // Add new chat button
                    Button(action: {
                        // Action to add a new chat
                        // This will need to call into the web app via JavaScript bridge
                        let script = "window.addNewChat && window.addNewChat()"
                        NotificationCenter.default.post(name: NSNotification.Name("ExecuteJavaScript"), 
                                                      object: nil, 
                                                      userInfo: ["script": script])
                    }) {
                        Image(systemName: "plus")
                            .font(.system(size: 20))
                            .foregroundColor(.blue)
                            .frame(width: 40, height: 40)
                            .background(
                                Circle()
                                    .fill(Color.white.opacity(0.9))
                                    .shadow(color: Color.black.opacity(0.2), radius: 5)
                            )
                    }
                    .buttonStyle(PlainButtonStyle())
                    .padding(.trailing, 10)
                    .padding(.bottom, 20)
                    
                    // Settings button
                    Button(action: {
                        showSettings.toggle()
                    }) {
                        Image(systemName: "gear")
                            .font(.system(size: 20))
                            .foregroundColor(.blue)
                            .frame(width: 40, height: 40)
                            .background(
                                Circle()
                                    .fill(Color.white.opacity(0.9))
                                    .shadow(color: Color.black.opacity(0.2), radius: 5)
                            )
                    }
                    .buttonStyle(PlainButtonStyle())
                    .padding(.trailing, 20)
                    .padding(.bottom, 20)
                }
            }
        }
        .sheet(isPresented: $showSettings) {
            SettingsView()
        }
    }
}

// MARK: - Settings View
struct SettingsView: View {
    @State private var darkMode = true
    @State private var bubbleOpacity = 0.9
    @State private var idleAnimations = true
    @State private var snapToEdge = false
    
    var body: some View {
        VStack(alignment: .leading, spacing: 20) {
            Text("GAIA Desktop Settings")
                .font(.headline)
                .padding(.bottom, 10)
            
            Toggle("Dark Mode", isOn: $darkMode)
            Toggle("Idle Animations", isOn: $idleAnimations)
            Toggle("Snap to Edge", isOn: $snapToEdge)
            
            VStack(alignment: .leading) {
                Text("Bubble Opacity: \(Int(bubbleOpacity * 100))%")
                Slider(value: $bubbleOpacity, in: 0.1...1.0, step: 0.1)
            }
            
            Spacer()
            
            HStack {
                Spacer()
                Button("Apply") {
                    // Apply settings here
                }
                .buttonStyle(.borderedProminent)
            }
        }
        .padding()
        .frame(width: 400, height: 300)
    }
}