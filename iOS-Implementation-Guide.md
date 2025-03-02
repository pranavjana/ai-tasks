# Task AI iOS Implementation Guide

## Overview

This document provides a comprehensive guide for implementing Task AI's chat and task management functionality in an iOS app. The implementation will maintain feature parity with the web application while adopting native iOS patterns and best practices.

## Table of Contents
1. [System Architecture](#system-architecture)
2. [Database Schema](#database-schema)
3. [Core Services](#core-services)
4. [UI Components](#ui-components)
5. [Chat Implementation](#chat-implementation)
6. [Task Management Implementation](#task-management-implementation)
7. [iOS-specific Considerations](#ios-specific-considerations)

## System Architecture

The iOS app will follow a clean architecture with clear separation of concerns:

```
TaskAI/
├── App/                        # App entry point
├── Models/                     # Data models
├── Services/                   # Business logic
│   ├── AI/                     # AI services
│   ├── Database/               # Database services
│   ├── Network/                # Network services
│   └── ServiceRegistry.swift   # Dependency injection system
├── UI/                         # UI components
│   ├── Chat/                   # Chat interface components
│   ├── Tasks/                  # Task management components
│   └── Common/                 # Shared UI components
└── Utilities/                  # Helper functions
```

## Database Schema

The app will use the same database schema as the web app, implemented using either Core Data or SQLite with Supabase for cloud sync:

### Tasks Table
```swift
struct Task: Identifiable, Codable {
    let id: String
    var title: String
    var description: String?
    var schedule: Date?
    var time: String?
    var category: String?
    var priority: String?
    var completed: Bool
    var userId: String
    var createdAt: Date
    var updatedAt: Date
}
```

### Todos Table
```swift
struct Todo: Identifiable, Codable {
    let id: String
    var title: String
    var completed: Bool
    var userId: String
    var createdAt: Date
    var updatedAt: Date
    var subtasks: [Subtask]?
}
```

### Subtasks Table
```swift
struct Subtask: Identifiable, Codable {
    let id: String
    var todoId: String
    var title: String
    var completed: Bool
    var notes: String?
    var createdAt: Date
    var updatedAt: Date
}
```

## Core Services

### Service Registry for Dependency Injection

```swift
// ServiceRegistry.swift
final class ServiceRegistry {
    private var services: [String: Any] = [:]
    static let shared = ServiceRegistry()
    
    func register<T>(_ type: T.Type, instance: Any) {
        let key = String(describing: type)
        services[key] = instance
    }
    
    func resolve<T>(_ type: T.Type) -> T? {
        let key = String(describing: type)
        return services[key] as? T
    }
}

// Usage example
protocol ChatService {
    func sendMessage(_ message: String) async throws -> ChatResponse
}

// Register a service
ServiceRegistry.shared.register(ChatService.self, instance: GeminiChatService())

// Resolve a service
if let chatService = ServiceRegistry.shared.resolve(ChatService.self) {
    // Use the service
}
```

### GeminiService Implementation

```swift
// GeminiService.swift
import Foundation
import GoogleGenerativeAI

final class GeminiService: ChatService {
    private let apiKey: String
    private let model: GenerativeModel
    private var chat: GenerativeModelChat?
    private var conversationHistory: [Message] = []
    
    init(apiKey: String) {
        self.apiKey = apiKey
        self.model = GenerativeModel(
            name: "gemini-2.0-flash",
            apiKey: apiKey,
            generationConfig: GenerationConfig(temperature: 0.1, topK: 1, topP: 1, maxOutputTokens: 2048)
        )
        self.chat = model.startChat()
    }
    
    func createTask(_ input: String) async throws -> TaskResponse {
        // First determine the request type
        let requestType = try await determineRequestType(input)
        
        switch requestType.type {
        case "reminder":
            return try await handleReminder(input)
        case "todo_list":
            return try await handleTodoList(input)
        case "date_query":
            return try await handleDateQuery(input)
        case "conversation":
            return try await handleConversation(input)
        default:
            return TaskResponse(
                type: "conversation",
                data: ConversationData(response: "I'm not sure how to handle that. Could you try rephrasing your request?")
            )
        }
    }
    
    private func determineRequestType(_ input: String) async throws -> RequestType {
        let inputLower = input.lowercased()
        
        // Check for todo list creation patterns
        let todoPatterns = [
            "create a list",
            "make a list",
            "todo list",
            "to do list",
            "to-do list",
            "checklist",
            "task list",
            "shopping list",
            "list of",
            "create tasks",
            "make tasks",
            "add these tasks",
            "add these items"
        ]
        
        if todoPatterns.contains(where: { inputLower.contains($0) }) {
            return RequestType(type: "todo_list", explanation: "Contains todo list creation keywords", isQuestion: false)
        }
        
        // Check for reminder patterns
        if inputLower.contains("remind") || inputLower.contains("schedule") {
            return RequestType(type: "reminder", explanation: "Contains reminder keywords", isQuestion: false)
        }
        
        // Check for date query patterns
        if inputLower.contains("date") || inputLower.contains("when") {
            return RequestType(type: "date_query", explanation: "Contains date query", isQuestion: true)
        }
        
        // Fallback to conversation
        return RequestType(type: "conversation", explanation: "Default fallback to conversation", isQuestion: true)
    }
    
    // Additional methods for handling different request types...
}
```

### Database Service

```swift
// DatabaseService.swift
import Foundation
import Supabase

final class DatabaseService {
    private let supabase: SupabaseClient
    
    init(supabaseUrl: String, supabaseKey: String) {
        self.supabase = SupabaseClient(supabaseUrl: supabaseUrl, supabaseKey: supabaseKey)
    }
    
    func fetchTasks() async throws -> [Task] {
        let currentUser = try await supabase.auth.session
        
        guard let userId = currentUser.user?.id else {
            throw DatabaseError.notAuthenticated
        }
        
        return try await supabase.database
            .from("tasks")
            .select()
            .eq("user_id", value: userId)
            .order("created_at", ascending: false)
            .execute()
            .value
    }
    
    func createTask(_ task: Task) async throws -> Task {
        return try await supabase.database
            .from("tasks")
            .insert(task)
            .execute()
            .value
    }
    
    func updateTask(_ task: Task) async throws -> Task {
        return try await supabase.database
            .from("tasks")
            .update(task)
            .eq("id", value: task.id)
            .execute()
            .value
    }
    
    func deleteTask(id: String) async throws {
        try await supabase.database
            .from("tasks")
            .delete()
            .eq("id", value: id)
            .execute()
    }
    
    // Similar methods for todos and subtasks...
}

enum DatabaseError: Error {
    case notAuthenticated
    case invalidData
    case networkError
}
```

## UI Components

### ChatView Implementation

```swift
// ChatView.swift
import SwiftUI

struct ChatView: View {
    @StateObject private var viewModel = ChatViewModel()
    @State private var messageText = ""
    @State private var isLoading = false
    
    var body: some View {
        VStack {
            if viewModel.messages.isEmpty {
                EmptyStateView()
            } else {
                ScrollView {
                    LazyVStack(spacing: 16) {
                        ForEach(viewModel.messages) { message in
                            MessageView(message: message)
                                .id(message.id)
                        }
                    }
                    .padding(.horizontal)
                }
            }
            
            HStack {
                TextField("Message", text: $messageText)
                    .padding()
                    .background(Color(.systemGray6))
                    .cornerRadius(12)
                    .disabled(isLoading)
                
                Button(action: sendMessage) {
                    Image(systemName: isLoading ? "clock" : "arrow.up.circle.fill")
                        .font(.system(size: 24))
                }
                .disabled(messageText.isEmpty || isLoading)
            }
            .padding()
        }
        .navigationBarTitle("Chat", displayMode: .inline)
    }
    
    private func sendMessage() {
        guard !messageText.isEmpty else { return }
        
        let inputText = messageText
        messageText = ""
        isLoading = true
        
        Task {
            await viewModel.sendMessage(inputText)
            isLoading = false
        }
    }
}

struct MessageView: View {
    let message: Message
    
    var body: some View {
        HStack {
            if message.isFromUser {
                Spacer()
                
                Text(message.content)
                    .padding()
                    .background(Color.blue)
                    .foregroundColor(.white)
                    .clipShape(RoundedRectangle(cornerRadius: 12))
            } else {
                VStack(alignment: .leading, spacing: 8) {
                    if message.isTyping {
                        TypingIndicator()
                    } else {
                        FormattedMessageView(content: message.content)
                    }
                    
                    if let task = message.task {
                        TaskCardView(task: task)
                            .padding(.top, 8)
                    }
                    
                    if let tasks = message.tasks, !tasks.isEmpty {
                        TaskCreationTimelineView(tasks: tasks)
                            .padding(.top, 8)
                    }
                }
                .padding()
                .background(Color(.systemGray6))
                .foregroundColor(.primary)
                .clipShape(RoundedRectangle(cornerRadius: 12))
                
                Spacer()
            }
        }
    }
}

// Additional helper views...
```

### TaskViewModel

```swift
// ChatViewModel.swift
import Foundation

class ChatViewModel: ObservableObject {
    @Published var messages: [Message] = []
    @Published var reminders: [Task] = []
    @Published var todos: [Todo] = []
    
    private let geminiService: GeminiService
    private let databaseService: DatabaseService
    
    init() {
        // Resolve services from the registry
        self.geminiService = ServiceRegistry.shared.resolve(GeminiService.self) ?? GeminiService(apiKey: "YOUR_API_KEY")
        self.databaseService = ServiceRegistry.shared.resolve(DatabaseService.self) ?? DatabaseService(supabaseUrl: "YOUR_SUPABASE_URL", supabaseKey: "YOUR_SUPABASE_KEY")
        
        // Load initial data
        Task {
            await loadInitialData()
        }
    }
    
    func sendMessage(_ text: String) async {
        // Add user message to the UI
        let userMessageId = UUID().uuidString
        await MainActor.run {
            self.messages.append(Message(id: userMessageId, content: text, type: .user))
        }
        
        do {
            // Process with AI
            let response = try await geminiService.createTask(text)
            
            // Handle different response types
            await MainActor.run {
                switch response.type {
                case "task":
                    if let taskData = response.data as? Task {
                        self.reminders.insert(taskData, at: 0)
                        self.messages.append(Message(
                            id: UUID().uuidString,
                            content: "I've set up a reminder based on your request. Here's what I've scheduled:",
                            type: .ai,
                            task: taskData
                        ))
                    }
                    
                case "multiple_tasks":
                    if let tasksData = response.data as? [Task], !tasksData.isEmpty {
                        self.reminders.insert(contentsOf: tasksData, at: 0)
                        self.messages.append(Message(
                            id: UUID().uuidString,
                            content: response.message ?? "I've set up \(tasksData.count) reminder\(tasksData.count > 1 ? "s" : "") based on your request. Here's what I've scheduled:",
                            type: .ai,
                            tasks: tasksData
                        ))
                    }
                    
                case "todo":
                    if let todoData = response.data as? Todo {
                        self.todos.insert(todoData, at: 0)
                        self.messages.append(Message(
                            id: UUID().uuidString,
                            content: "I've added \"\(todoData.title)\" to your to-do list.",
                            type: .ai
                        ))
                    }
                    
                default:
                    if let conversationData = response.data as? ConversationData {
                        self.messages.append(Message(
                            id: UUID().uuidString,
                            content: conversationData.response,
                            type: .ai
                        ))
                    }
                }
            }
        } catch {
            // Handle error
            await MainActor.run {
                self.messages.append(Message(
                    id: UUID().uuidString,
                    content: "I'm sorry, I couldn't process your request. Please try again.",
                    type: .ai
                ))
            }
        }
    }
    
    private func loadInitialData() async {
        do {
            async let tasksResult = databaseService.fetchTasks()
            async let todosResult = databaseService.fetchTodos()
            
            let (tasks, todos) = try await (tasksResult, todosResult)
            
            await MainActor.run {
                self.reminders = tasks
                self.todos = todos
            }
        } catch {
            print("Error loading initial data: \(error)")
        }
    }
}
```

## Task Management Implementation

### TaskListView

```swift
// TaskListView.swift
import SwiftUI

struct TaskListView: View {
    @StateObject private var viewModel = TaskViewModel()
    @State private var selectedTab = 0
    
    var body: some View {
        VStack {
            // Tab selector
            Picker("View", selection: $selectedTab) {
                Text("Tasks").tag(0)
                Text("Todo").tag(1)
            }
            .pickerStyle(SegmentedPickerStyle())
            .padding(.horizontal)
            
            if selectedTab == 0 {
                // Tasks tab
                CalendarTaskView(tasks: viewModel.tasks, onDelete: viewModel.deleteTask)
            } else {
                // Todo tab
                TodoListView(todos: viewModel.todos, onToggle: viewModel.toggleTodo, onDelete: viewModel.deleteTodo)
            }
        }
        .navigationBarTitle("Tasks", displayMode: .inline)
        .onAppear {
            viewModel.loadTasks()
        }
    }
}

struct CalendarTaskView: View {
    let tasks: [Task]
    let onDelete: (String) -> Void
    @State private var selectedDate = Date()
    
    var body: some View {
        VStack {
            // Date selector
            DatePicker("Select Date", selection: $selectedDate, displayedComponents: .date)
                .datePickerStyle(GraphicalDatePickerStyle())
                .padding()
            
            // Tasks for selected date
            List {
                ForEach(tasksForSelectedDate) { task in
                    TaskRow(task: task)
                        .swipeActions {
                            Button(role: .destructive) {
                                onDelete(task.id)
                            } label: {
                                Label("Delete", systemImage: "trash")
                            }
                        }
                }
            }
        }
    }
    
    private var tasksForSelectedDate: [Task] {
        tasks.filter { task in
            guard let taskDate = task.schedule else { return false }
            return Calendar.current.isDate(taskDate, inSameDayAs: selectedDate)
        }
    }
}

struct TaskRow: View {
    let task: Task
    
    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack {
                Text(task.title)
                    .font(.headline)
                
                Spacer()
                
                // Priority badge
                Text(task.priority ?? "Medium")
                    .font(.caption)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 2)
                    .background(priorityColor(task.priority))
                    .foregroundColor(.white)
                    .clipShape(Capsule())
            }
            
            if let description = task.description, !description.isEmpty {
                Text(description)
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .lineLimit(2)
            }
            
            HStack(spacing: 12) {
                // Time
                if let time = task.time {
                    Label(time, systemImage: "clock")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                
                // Category
                if let category = task.category {
                    Label(category, systemImage: "tag")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
            .padding(.top, 4)
        }
        .padding(.vertical, 4)
    }
    
    private func priorityColor(_ priority: String?) -> Color {
        switch priority?.lowercased() {
        case "high": return .red
        case "medium": return .orange
        case "low": return .blue
        default: return .gray
        }
    }
}
```

### TodoListView

```swift
// TodoListView.swift
import SwiftUI

struct TodoListView: View {
    let todos: [Todo]
    let onToggle: (String) -> Void
    let onDelete: (String) -> Void
    @State private var expandedIds = Set<String>()
    
    var body: some View {
        List {
            // Incomplete todos
            Section(header: Text("In Progress")) {
                ForEach(incompleteTodos) { todo in
                    TodoRow(
                        todo: todo,
                        isExpanded: expandedIds.contains(todo.id),
                        onToggle: onToggle,
                        onDelete: onDelete,
                        onExpand: { toggleExpand(todo.id) }
                    )
                }
            }
            
            // Completed todos
            if !completedTodos.isEmpty {
                Section(header: Text("Completed")) {
                    ForEach(completedTodos) { todo in
                        TodoRow(
                            todo: todo,
                            isExpanded: expandedIds.contains(todo.id),
                            onToggle: onToggle,
                            onDelete: onDelete,
                            onExpand: { toggleExpand(todo.id) }
                        )
                    }
                }
            }
        }
    }
    
    private var incompleteTodos: [Todo] {
        todos.filter { todo in
            !todo.subtasks.map { $0.allSatisfy { $0.completed } }.contains(true)
        }
    }
    
    private var completedTodos: [Todo] {
        todos.filter { todo in
            todo.subtasks.map { $0.allSatisfy { $0.completed } }.contains(true)
        }
    }
    
    private func toggleExpand(_ id: String) {
        if expandedIds.contains(id) {
            expandedIds.remove(id)
        } else {
            expandedIds.insert(id)
        }
    }
}

struct TodoRow: View {
    let todo: Todo
    let isExpanded: Bool
    let onToggle: (String) -> Void
    let onDelete: (String) -> Void
    let onExpand: () -> Void
    
    var body: some View {
        VStack(alignment: .leading) {
            HStack {
                // Todo title
                Text(todo.title)
                    .font(.headline)
                    .foregroundColor(todo.completed ? .secondary : .primary)
                    .strikethrough(todo.completed)
                
                Spacer()
                
                // Expand/collapse button if there are subtasks
                if let subtasks = todo.subtasks, !subtasks.isEmpty {
                    Button(action: onExpand) {
                        Image(systemName: isExpanded ? "chevron.up" : "chevron.down")
                            .foregroundColor(.secondary)
                    }
                }
            }
            .contentShape(Rectangle())
            .onTapGesture {
                if todo.subtasks?.isEmpty ?? true {
                    onToggle(todo.id)
                } else {
                    onExpand()
                }
            }
            
            // Subtasks
            if isExpanded, let subtasks = todo.subtasks, !subtasks.isEmpty {
                ForEach(subtasks) { subtask in
                    SubtaskRow(subtask: subtask, onToggle: { 
                        // Handle subtask toggle
                    })
                    .padding(.leading)
                }
            }
        }
        .swipeActions {
            Button(role: .destructive) {
                onDelete(todo.id)
            } label: {
                Label("Delete", systemImage: "trash")
            }
        }
    }
}

struct SubtaskRow: View {
    let subtask: Subtask
    let onToggle: () -> Void
    
    var body: some View {
        Button(action: onToggle) {
            HStack {
                Image(systemName: subtask.completed ? "checkmark.circle.fill" : "circle")
                    .foregroundColor(subtask.completed ? .green : .secondary)
                
                Text(subtask.title)
                    .foregroundColor(subtask.completed ? .secondary : .primary)
                    .strikethrough(subtask.completed)
                
                Spacer()
                
                if subtask.notes != nil {
                    Image(systemName: "note.text")
                        .foregroundColor(.secondary)
                }
            }
        }
        .buttonStyle(PlainButtonStyle())
    }
}
```

## iOS-specific Considerations

### Siri Integration

Integrate with Siri to enable voice commands for task creation:

```swift
// SiriIntentHandler.swift
import Intents
import IntentsUI

class CreateTaskIntentHandler: NSObject, CreateTaskIntentHandling {
    func handle(intent: CreateTaskIntent, completion: @escaping (CreateTaskIntentResponse) -> Void) {
        guard let taskTitle = intent.taskTitle else {
            completion(CreateTaskIntentResponse(code: .failure, userActivity: nil))
            return
        }
        
        Task {
            do {
                let geminiService = ServiceRegistry.shared.resolve(GeminiService.self)!
                let response = try await geminiService.createTask(taskTitle)
                
                if response.type == "task" {
                    completion(CreateTaskIntentResponse(code: .success, userActivity: nil))
                } else {
                    completion(CreateTaskIntentResponse(code: .failure, userActivity: nil))
                }
            } catch {
                completion(CreateTaskIntentResponse(code: .failure, userActivity: nil))
            }
        }
    }
}
```

### Notifications

Implement local notifications for task reminders:

```swift
// NotificationService.swift
import UserNotifications

class NotificationService {
    func scheduleNotification(for task: Task) {
        guard let scheduleDate = task.schedule else { return }
        
        let content = UNMutableNotificationContent()
        content.title = task.title
        if let description = task.description {
            content.body = description
        }
        content.sound = .default
        
        // Create a calendar-based trigger
        var dateComponents = Calendar.current.dateComponents([.year, .month, .day], from: scheduleDate)
        if let timeString = task.time, let time = parseTime(timeString) {
            dateComponents.hour = time.hour
            dateComponents.minute = time.minute
        }
        
        let trigger = UNCalendarNotificationTrigger(dateMatching: dateComponents, repeats: false)
        
        // Create the request
        let request = UNNotificationRequest(identifier: task.id, content: content, trigger: trigger)
        
        // Add the notification request
        UNUserNotificationCenter.current().add(request) { error in
            if let error = error {
                print("Error scheduling notification: \(error)")
            }
        }
    }
    
    private func parseTime(_ timeString: String) -> (hour: Int, minute: Int)? {
        let formatter = DateFormatter()
        formatter.dateFormat = "h:mm a"
        
        if let date = formatter.date(from: timeString) {
            let calendar = Calendar.current
            let hour = calendar.component(.hour, from: date)
            let minute = calendar.component(.minute, from: date)
            return (hour, minute)
        }
        
        return nil
    }
}
```

### Widgets

Create widgets for quick access to upcoming tasks:

```swift
// TaskWidget.swift
import WidgetKit
import SwiftUI

struct TaskEntry: TimelineEntry {
    let date: Date
    let tasks: [Task]
}

struct TaskWidgetProvider: TimelineProvider {
    func placeholder(in context: Context) -> TaskEntry {
        TaskEntry(date: Date(), tasks: [])
    }
    
    func getSnapshot(in context: Context, completion: @escaping (TaskEntry) -> Void) {
        // Create example data for preview
        let sampleTasks = [
            Task(id: "1", title: "Team Meeting", description: "Weekly sync", schedule: Date(), time: "10:00 AM", category: "Work", priority: "High", completed: false, userId: "", createdAt: Date(), updatedAt: Date())
        ]
        completion(TaskEntry(date: Date(), tasks: sampleTasks))
    }
    
    func getTimeline(in context: Context, completion: @escaping (Timeline<TaskEntry>) -> Void) {
        Task {
            do {
                let databaseService = ServiceRegistry.shared.resolve(DatabaseService.self)!
                let tasks = try await databaseService.fetchTasks()
                
                // Filter for upcoming tasks
                let upcomingTasks = tasks.filter { task in
                    guard let scheduleDate = task.schedule else { return false }
                    return scheduleDate > Date()
                }.sorted { task1, task2 in
                    guard let date1 = task1.schedule, let date2 = task2.schedule else { return false }
                    return date1 < date2
                }.prefix(5)
                
                let entry = TaskEntry(date: Date(), tasks: Array(upcomingTasks))
                let timeline = Timeline(entries: [entry], policy: .after(Calendar.current.date(byAdding: .hour, value: 1, to: Date())!))
                
                completion(timeline)
            } catch {
                // Fallback with empty tasks
                let entry = TaskEntry(date: Date(), tasks: [])
                let timeline = Timeline(entries: [entry], policy: .after(Calendar.current.date(byAdding: .hour, value: 1, to: Date())!))
                completion(timeline)
            }
        }
    }
}

struct TaskWidgetView: View {
    var entry: TaskEntry
    
    var body: some View {
        VStack(alignment: .leading) {
            Text("Upcoming Tasks")
                .font(.headline)
                .padding(.bottom, 4)
            
            if entry.tasks.isEmpty {
                Text("No upcoming tasks")
                    .foregroundColor(.secondary)
            } else {
                ForEach(entry.tasks.prefix(3)) { task in
                    HStack {
                        Circle()
                            .fill(priorityColor(task.priority))
                            .frame(width: 8, height: 8)
                        
                        Text(task.title)
                            .font(.subheadline)
                            .lineLimit(1)
                        
                        Spacer()
                        
                        if let time = task.time {
                            Text(time)
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                    }
                    .padding(.vertical, 2)
                }
            }
        }
        .padding()
    }
    
    private func priorityColor(_ priority: String?) -> Color {
        switch priority?.lowercased() {
        case "high": return .red
        case "medium": return .orange
        case "low": return .blue
        default: return .gray
        }
    }
}

@main
struct TaskWidget: Widget {
    let kind: String = "TaskWidget"
    
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: TaskWidgetProvider()) { entry in
            TaskWidgetView(entry: entry)
        }
        .configurationDisplayName("Task AI")
        .description("View your upcoming tasks")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}
```

## Integration with Apple Services

### iCloud Syncing

For tasks that should be available offline or synchronized across Apple devices:

```swift
// CloudKitSyncService.swift
import CloudKit

class CloudKitSyncService {
    private let container: CKContainer
    private let database: CKDatabase
    
    init(containerIdentifier: String) {
        self.container = CKContainer(identifier: containerIdentifier)
        self.database = container.privateCloudDatabase
    }
    
    func syncTasks(_ tasks: [Task]) async throws {
        for task in tasks {
            let record = CKRecord(recordType: "Task", recordID: CKRecord.ID(recordName: task.id))
            record["title"] = task.title
            record["description"] = task.description
            // Set other fields...
            
            try await database.save(record)
        }
    }
    
    func fetchTasks() async throws -> [Task] {
        let query = CKQuery(recordType: "Task", predicate: NSPredicate(value: true))
        let result = try await database.records(matching: query)
        
        return result.matchResults.compactMap { _, result in
            do {
                let record = try result.get()
                
                guard 
                    let title = record["title"] as? String,
                    let userId = record["userId"] as? String
                else {
                    return nil
                }
                
                return Task(
                    id: record.recordID.recordName,
                    title: title,
                    description: record["description"] as? String,
                    schedule: record["schedule"] as? Date,
                    time: record["time"] as? String,
                    category: record["category"] as? String,
                    priority: record["priority"] as? String,
                    completed: record["completed"] as? Bool ?? false,
                    userId: userId,
                    createdAt: record.creationDate ?? Date(),
                    updatedAt: record.modificationDate ?? Date()
                )
            } catch {
                print("Error decoding record: \(error)")
                return nil
            }
        }
    }
}
```

## Conclusion

This implementation guide provides a comprehensive framework for building the Task AI iOS app with chat functionality and task management capabilities. By following these patterns and integrating with iOS-specific features like Siri, notifications, and widgets, you can create a powerful native experience that maintains feature parity with the web application while taking advantage of iOS platform capabilities.

The implementation leverages Swift's strong type system and modern concurrency features (async/await) to provide a clean, maintainable codebase. The architecture is designed for scalability, making it easy to add new features or modify existing ones as the application evolves.

## AI Prompts

This section outlines all the prompts needed for the AI chat functionality in the iOS app. These prompts are directly aligned with the web version to ensure consistent behavior across platforms.

### Request Type Detection

The current system uses pattern matching rather than prompting the AI to determine request types. Implement this logic in Swift:

```swift
func determineRequestType(_ input: String) -> RequestType {
    let inputLower = input.lowercased()
    
    // Check for todo list creation patterns
    let todoPatterns = [
        "create a list",
        "make a list",
        "todo list",
        "to do list",
        "to-do list",
        "checklist",
        "task list",
        "shopping list",
        "list of",
        "create tasks",
        "make tasks",
        "add these tasks",
        "add these items"
    ]
    
    if todoPatterns.contains(where: { inputLower.contains($0) }) {
        return RequestType(type: "todo_list", explanation: "Contains todo list creation keywords", isQuestion: false)
    }
    
    // Check for reminder patterns
    if inputLower.contains("remind") || inputLower.contains("schedule") {
        return RequestType(type: "reminder", explanation: "Contains reminder keywords", isQuestion: false)
    }
    
    // Check for date query patterns
    if inputLower.contains("date") || inputLower.contains("when") {
        return RequestType(type: "date_query", explanation: "Contains date query", isQuestion: true)
    }
    
    // Fallback to conversation
    return RequestType(type: "conversation", explanation: "Default fallback to conversation", isQuestion: true)
}
```

### Reminder Creation Prompt

```swift
let extractRemindersPrompt = """
Extract reminders from this text: "\(input)"

Return ONLY a JSON array containing exactly one reminder object in this format (no explanation, no backticks):
[{
  "title": "Brief title of the reminder (without the date/time part)",
  "description": "Full description if any",
  "category": "One of: Work, Personal, Health, Shopping, Home, Study, Social, Other",
  "date_query": "IMPORTANT: Extract the EXACT date-related text from the input (e.g., 'tomorrow', 'next week', 'day after tmr', etc.)",
  "time": "Extract time in 24-hour format (HH:mm) if specified, or null if no time mentioned"
}]

IMPORTANT: 
1. Response MUST be a JSON array with square brackets []
2. Array MUST contain exactly one reminder object with curly braces {}
3. Title should NOT include the date/time information
4. ALWAYS extract and preserve the EXACT date-related text in date_query
5. Time should be in 24-hour format (HH:mm) or null
"""
```

### Date Query Prompt

```swift
let dateQueryPrompt = """
Today is \(currentYear)-\(currentMonth)-\(currentDay). Based on the query "\(input)", what date (in YYYY-MM-DD format) is being referred to?
"""
```

### Todo List Creation Prompt

The todo list prompt varies based on the detected type of list. Here's how to implement it:

```swift
func getTodoPrompt(for input: String) -> String {
    let inputLower = input.lowercased()
    
    let isLearningRequest = inputLower.contains("learn") || 
                            inputLower.contains("study") || 
                            inputLower.contains("teach me")
                            
    let isShoppingList = inputLower.contains("buy") || 
                        inputLower.contains("shop") || 
                        inputLower.contains("purchase") ||
                        inputLower.contains("ingredients")
    
    if isLearningRequest {
        return """
        You are an expert educational AI assistant. Create a comprehensive, step-by-step learning path for the following request: "\(input)"
        
        Format the response as a structured todo list with the following:
        1. A main todo item with a clear title describing the learning goal
        2. A series of subtasks that break down the learning process into manageable steps
        3. Each subtask should be specific, actionable, and in a logical sequence
        4. Include estimated time commitments for each subtask
        5. Add resource recommendations (books, courses, websites) as notes for relevant subtasks
        
        IMPORTANT: Return ONLY the JSON object, no markdown formatting or additional text.
        {
          "title": "Main learning goal",
          "description": "Brief overview of the learning path",
          "subtasks": [
            {
              "content": "Step 1 description",
              "notes": "Optional resource recommendations or tips"
            }
          ]
        }
        """
    } else if isShoppingList {
        return """
        Create a detailed shopping list based on this request: "\(input)"
        
        If this is a recipe ingredients list:
        1. Include all necessary ingredients with quantities
        2. Group items by category (produce, dairy, pantry, etc.)
        3. Add any special notes about brands or substitutions
        
        If this is a general shopping list:
        1. Break down items into clear, specific entries
        2. Group similar items together
        3. Include any specific details mentioned (brands, sizes, etc.)
        
        IMPORTANT: Return ONLY the JSON object, no markdown formatting or additional text.
        {
          "title": "Shopping List: [Purpose]",
          "description": "List for [specific purpose/recipe]",
          "subtasks": [
            {
              "content": "Item with quantity/specifications",
              "notes": "Optional details about brands, alternatives, or where to find"
            }
          ]
        }
        """
    } else {
        return """
        Create a structured todo list based on this request: "\(input)"
        
        Break down the request into:
        1. A clear, concise main title
        2. A brief description of the overall goal
        3. A series of specific, actionable subtasks
        4. Any relevant notes or details for each subtask
        
        Consider:
        - Order tasks logically
        - Include any mentioned deadlines or timing
        - Add helpful details as notes
        
        IMPORTANT: Return ONLY the JSON object, no markdown formatting or additional text.
        {
          "title": "Main task or goal",
          "description": "Brief overview of what needs to be done",
          "subtasks": [
            {
              "content": "Specific task description",
              "notes": "Optional timing, requirements, or helpful details"
            }
          ]
        }
        """
    }
}
```

### Conversation Fallback

When a request doesn't match any of the specific task types, use this prompt for general conversation:

```swift
let conversationPrompt = """
Context from previous messages:
\(conversationHistory.map { "\($0.role): \($0.content)" }.joined(separator: "\n"))

Based on this context, respond to the user's message:
"\(input)"

Provide a helpful, concise, and relevant response. If the query is about tasks, reminders, or schedules, try to provide useful information related to productivity and time management.
"""
```

### Implementation in ChatViewModel

Here's how to implement these prompts in your `GeminiService`:

```swift
class GeminiService: ChatService {
    private let apiKey: String
    private let model: GenerativeModel
    private var chat: GenerativeModelChat?
    private var conversationHistory: [Message] = []
    
    init(apiKey: String) {
        self.apiKey = apiKey
        self.model = GenerativeModel(
            name: "gemini-2.0-flash",
            apiKey: apiKey,
            generationConfig: GenerationConfig(temperature: 0.1, topK: 1, topP: 1, maxOutputTokens: 2048)
        )
        self.chat = model.startChat()
    }
    
    func createTask(_ input: String) async throws -> TaskResponse {
        // First determine the request type
        let requestType = determineRequestType(input)
        
        switch requestType.type {
        case "reminder":
            return try await handleReminder(input)
        case "todo_list":
            return try await handleTodoList(input)
        case "date_query":
            return try await handleDateQuery(input)
        case "conversation":
            return try await handleConversation(input)
        default:
            return TaskResponse(
                type: "conversation",
                data: ConversationData(response: "I'm not sure how to handle that. Could you try rephrasing your request?")
            )
        }
    }
    
    private func determineRequestType(_ input: String) -> RequestType {
        // Implementation as shown above
    }
    
    private func handleReminder(_ input: String) async throws -> TaskResponse {
        let extractRemindersPrompt = """
        Extract reminders from this text: "\(input)"
        
        // Rest of prompt as shown above
        """
        
        let result = try await chat?.sendMessage(extractRemindersPrompt)
        // Process result and create reminder
    }
    
    private func handleDateQuery(_ input: String) async throws -> TaskResponse {
        let today = Date()
        let dateFormatter = DateFormatter()
        dateFormatter.dateFormat = "yyyy-MM-dd"
        let currentDate = dateFormatter.string(from: today)
        
        let prompt = "Today is \(currentDate). Based on the query \"\(input)\", what date (in YYYY-MM-DD format) is being referred to?"
        
        let result = try await chat?.sendMessage(prompt)
        // Process result and return date
    }
    
    private func handleTodoList(_ input: String) async throws -> TaskResponse {
        let todoPrompt = getTodoPrompt(for: input)
        
        let result = try await chat?.sendMessage(todoPrompt)
        // Process result and create todo list
    }
    
    private func getTodoPrompt(for input: String) -> String {
        // Implementation as shown above
    }
}
```

This implementation ensures that your iOS app will process user inputs in the same way as the web application, providing a consistent experience across platforms while taking advantage of native iOS capabilities. 