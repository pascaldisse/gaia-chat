import SwiftUI

// MARK: - Content View
struct ContentView: View {
    @State private var showSettings = false
    @State private var showTodoList = false
    
    var body: some View {
        ZStack {
            // Light gray background instead of transparent for visibility
            Color.gray.opacity(0.1)
            
            // WebView container
            GaiaWebView()
                .edgesIgnoringSafeArea(.all)
            
            // Control buttons (add chat, todo list and settings)
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
                    
                    // Todo List button
                    Button(action: {
                        showTodoList.toggle()
                    }) {
                        Image(systemName: "list.bullet")
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
        .sheet(isPresented: $showTodoList) {
            TodoListView()
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

// MARK: - Todo List Item
struct TodoItem: Identifiable {
    let id = UUID()
    var title: String
    var isCompleted: Bool = false
    var isBacklog: Bool = false
}

// MARK: - Todo List View
struct TodoListView: View {
    @State private var todoItems = [
        TodoItem(title: "Implement chat message sending", isCompleted: true),
        TodoItem(title: "Add UI for persona creation"),
        TodoItem(title: "Support for multiple personas"),
        TodoItem(title: "Fix chat bubble positioning"),
        TodoItem(title: "Improve message formatting", isBacklog: true),
        TodoItem(title: "Integrate with external AI services", isBacklog: true),
        TodoItem(title: "Create toolbar customization", isBacklog: true),
        TodoItem(title: "Add drag handle for window resizing", isBacklog: true)
    ]
    
    @State private var newTodoTitle = ""
    @State private var showBacklog = false
    
    var body: some View {
        VStack {
            HStack {
                Text("Gaia Desktop Todo List")
                    .font(.headline)
                Spacer()
                Toggle("Show Backlog", isOn: $showBacklog)
            }
            .padding(.bottom, 10)
            
            HStack {
                TextField("New task...", text: $newTodoTitle)
                    .textFieldStyle(RoundedBorderTextFieldStyle())
                
                Button(action: {
                    if !newTodoTitle.isEmpty {
                        todoItems.append(TodoItem(title: newTodoTitle))
                        newTodoTitle = ""
                    }
                }) {
                    Text("Add")
                        .padding(.horizontal, 10)
                }
                .buttonStyle(.borderedProminent)
            }
            
            List {
                Section(header: Text("Current Tasks")) {
                    ForEach(todoItems.filter { !$0.isBacklog }) { item in
                        HStack {
                            Button(action: {
                                if let index = todoItems.firstIndex(where: { $0.id == item.id }) {
                                    todoItems[index].isCompleted.toggle()
                                }
                            }) {
                                Image(systemName: item.isCompleted ? "checkmark.circle.fill" : "circle")
                                    .foregroundColor(item.isCompleted ? .green : .gray)
                            }
                            .buttonStyle(.plain)
                            
                            Text(item.title)
                                .strikethrough(item.isCompleted)
                                .foregroundColor(item.isCompleted ? .gray : .primary)
                            
                            Spacer()
                            
                            Button(action: {
                                if let index = todoItems.firstIndex(where: { $0.id == item.id }) {
                                    todoItems[index].isBacklog.toggle()
                                }
                            }) {
                                Image(systemName: "arrow.down.circle")
                                    .foregroundColor(.blue)
                            }
                            .buttonStyle(.plain)
                        }
                    }
                }
                
                if showBacklog {
                    Section(header: Text("Backlog")) {
                        ForEach(todoItems.filter { $0.isBacklog }) { item in
                            HStack {
                                Text(item.title)
                                    .foregroundColor(.gray)
                                
                                Spacer()
                                
                                Button(action: {
                                    if let index = todoItems.firstIndex(where: { $0.id == item.id }) {
                                        todoItems[index].isBacklog.toggle()
                                    }
                                }) {
                                    Image(systemName: "arrow.up.circle")
                                        .foregroundColor(.blue)
                                }
                                .buttonStyle(.plain)
                            }
                        }
                    }
                }
            }
        }
        .padding()
        .frame(width: 450, height: 500)
    }
}