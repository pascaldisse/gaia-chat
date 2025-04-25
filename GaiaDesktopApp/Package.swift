// swift-tools-version:5.5
import PackageDescription

let package = Package(
    name: "GaiaDesktopApp",
    platforms: [
        .macOS(.v12)
    ],
    products: [
        .executable(name: "GaiaDesktopApp", targets: ["GaiaDesktopApp"]),
    ],
    dependencies: [],
    targets: [
        .executableTarget(
            name: "GaiaDesktopApp",
            dependencies: [],
            resources: [
                .process("Resources")
            ])
    ]
)