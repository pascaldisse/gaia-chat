import SwiftUI
import AppKit

// Console app entry point
// main.swift automatically becomes the entry point for executable targets

// Start the application
let app = NSApplication.shared
let delegate = AppDelegate()
app.delegate = delegate
app.run()

// App Delegate to handle application lifecycle
class AppDelegate: NSObject, NSApplicationDelegate {
    var window: NSWindow!
    
    func applicationDidFinishLaunching(_ notification: Notification) {
        // Create the SwiftUI view that provides the window contents.
        let contentView = ContentView()
        
        // Create the window and set the content view.
        window = NSWindow(
            contentRect: NSRect(x: 0, y: 0, width: 800, height: 600),
            styleMask: [.titled, .closable, .miniaturizable, .resizable, .fullSizeContentView],
            backing: .buffered,
            defer: false)
        window.center()
        window.setFrameAutosaveName("Main Window")
        window.contentView = NSHostingView(rootView: contentView)
        window.title = "GAIA Desktop"
        
        // Configure window appearance
        window.titlebarAppearsTransparent = true
        window.isMovableByWindowBackground = true
        window.backgroundColor = NSColor.white  // Change to white for visibility
        
        // Explicitly bring window to front
        window.level = NSWindow.Level.floating
        window.orderFrontRegardless()
        
        print("Window created and should be visible now at position: \(window.frame)")
        print("Window is key: \(window.isKeyWindow)")
        print("Window is visible: \(window.isVisible)")
        
        // Set up menu
        setupMenu()
    }
    
    func setupMenu() {
        let mainMenu = NSMenu()
        
        // Application menu
        let appMenu = NSMenu()
        let appMenuItem = NSMenuItem()
        appMenuItem.submenu = appMenu
        
        appMenu.addItem(withTitle: "About GAIA Desktop", action: #selector(showAbout), keyEquivalent: "")
        appMenu.addItem(NSMenuItem.separator())
        appMenu.addItem(withTitle: "Quit", action: #selector(NSApplication.terminate(_:)), keyEquivalent: "q")
        
        mainMenu.addItem(appMenuItem)
        
        // Edit menu
        let editMenu = NSMenu(title: "Edit")
        let editMenuItem = NSMenuItem()
        editMenuItem.submenu = editMenu
        
        editMenu.addItem(withTitle: "Undo", action: #selector(UndoManager.undo), keyEquivalent: "z")
        editMenu.addItem(withTitle: "Redo", action: #selector(UndoManager.redo), keyEquivalent: "Z")
        editMenu.addItem(NSMenuItem.separator())
        editMenu.addItem(withTitle: "Cut", action: #selector(NSText.cut(_:)), keyEquivalent: "x")
        editMenu.addItem(withTitle: "Copy", action: #selector(NSText.copy(_:)), keyEquivalent: "c")
        editMenu.addItem(withTitle: "Paste", action: #selector(NSText.paste(_:)), keyEquivalent: "v")
        
        mainMenu.addItem(editMenuItem)
        
        // Window menu
        let windowMenu = NSMenu(title: "Window")
        let windowMenuItem = NSMenuItem()
        windowMenuItem.submenu = windowMenu
        
        windowMenu.addItem(withTitle: "Minimize", action: #selector(NSWindow.miniaturize(_:)), keyEquivalent: "m")
        windowMenu.addItem(withTitle: "Zoom", action: #selector(NSWindow.zoom(_:)), keyEquivalent: "")
        
        mainMenu.addItem(windowMenuItem)
        
        // Set the menu
        NSApplication.shared.mainMenu = mainMenu
    }
    
    @objc func showAbout() {
        NSApplication.shared.orderFrontStandardAboutPanel(
            options: [
                NSApplication.AboutPanelOptionKey.applicationName: "GAIA Desktop",
                NSApplication.AboutPanelOptionKey.applicationVersion: "1.0.0",
                NSApplication.AboutPanelOptionKey.credits: NSAttributedString(
                    string: "A SwiftUI-based floating persona bubble application for macOS"
                )
            ]
        )
    }
    
    func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool {
        return true
    }
}