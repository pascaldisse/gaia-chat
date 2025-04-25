import Foundation

extension Bundle {
    // Helper to access resources in the bundle
    static var gaiaResources: Bundle = {
        #if DEBUG
        // During development, use the module bundle
        return Bundle.module
        #else
        // In production, use the main bundle
        return Bundle.main
        #endif
    }()
}