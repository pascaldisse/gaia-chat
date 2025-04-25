import WebKit

// MARK: - Bridging between Swift and JavaScript
class GaiaScriptBridge: NSObject, WKScriptMessageHandler {
    var webView: WKWebView?
    
    func userContentController(_ userContentController: WKUserContentController, 
                             didReceive message: WKScriptMessage) {
        guard let dict = message.body as? [String: Any] else { return }
        print("Received message from JavaScript: \(dict)")
        
        // Handle specific messages here
        if let type = dict["type"] as? String {
            switch type {
            case "ready":
                print("GaiaScript app is ready")
                print("Bundle resource URL: \(Bundle.gaiaResources.resourceURL?.absoluteString ?? "nil")")
                
                // Send test message back to JavaScript
                self.sendMessage(["type": "test", "message": "Connection established"])
            case "action":
                if let action = dict["action"] as? String, 
                   let data = dict["data"] as? [String: Any] {
                    handleAction(action, data: data)
                }
            case "personaAdded":
                if let personaData = dict["persona"] as? [String: Any] {
                    print("New persona added: \(personaData)")
                    // Here you could save the persona to persistent storage if needed
                }
            case "sendMessage":
                if let messageText = dict["message"] as? String,
                   let personaId = dict["personaId"] as? String {
                    print("Message from user to persona \(personaId): \(messageText)")
                    
                    // Here we would process the message and generate a response
                    // For now, just echo back a simulated response
                    DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) {
                        let response = "I received your message: \"\(messageText)\""
                        self.sendMessage([
                            "type": "messageResponse",
                            "personaId": personaId,
                            "message": response
                        ])
                    }
                }
            default:
                break
            }
        }
    }
    
    func handleAction(_ action: String, data: [String: Any]) {
        // Handle different actions based on the action name
        print("Handling action: \(action) with data: \(data)")
    }
    
    func sendMessage(_ message: [String: Any]) {
        guard let webView = webView else { return }
        
        if let jsonData = try? JSONSerialization.data(withJSONObject: message),
           let jsonString = String(data: jsonData, encoding: .utf8) {
            let script = "window.iOSBridge.receiveMessage(\(jsonString))"
            webView.evaluateJavaScript(script) { result, error in
                if let error = error {
                    print("Error sending message to JavaScript: \(error)")
                }
            }
        }
    }
}