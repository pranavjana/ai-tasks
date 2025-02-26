# Task Scheduling System

A smart task scheduling system that helps users optimize their time and productivity.

## Features

- **Intelligent Task Scheduling**: Automatically suggests the best time to schedule tasks based on your existing commitments and preferences.
- **Schedule Analysis**: Identifies your busiest and least busy days to help with planning.
- **User Preferences**: Customizable work hours, productive times, and break periods.
- **Performance Metrics**: Tracks task completion rates and productivity patterns.

## Architecture Improvements

The system has been enhanced with several architectural improvements:

### 1. Reduced AI Dependency

- Implemented rule-based classification for common query patterns
- AI is only used as a fallback for ambiguous queries
- Reduced latency and API costs

### 2. User Preferences

- Added user preferences service to store and retrieve user-specific settings
- Customizable work hours, work days, productive hours, and break times
- Preferences are used in scheduling algorithms for better personalization

### 3. Caching Layer

- Implemented caching for schedule analysis and user preferences
- Reduced database queries and computation time
- Configurable TTL (Time To Live) for cache entries

### 4. Improved Error Handling

- Context-specific error messages
- Graceful degradation with fallback suggestions
- Comprehensive error logging

### 5. Metrics and Logging

- Added metrics service to track performance and usage
- Detailed logging of operations with timestamps
- Performance tracking with timer checkpoints

### 6. Code Structure

- Better separation of concerns with specialized handlers
- Improved database schema with migrations
- Enhanced documentation with JSDoc comments

## System Architecture

### Overview

The Task Scheduling System follows a modern, modular architecture with clear separation of concerns. It's built as a single-page application (SPA) with a React frontend and a serverless backend powered by Supabase. The system uses a dependency injection pattern to manage service dependencies and avoid circular references.

### Core Architectural Principles

1. **Separation of Concerns**: Each component and service has a single responsibility
2. **Dependency Injection**: Services explicitly declare their dependencies
3. **Factory Pattern**: Services are created via factory functions
4. **Caching Strategy**: Performance-critical operations use in-memory caching
5. **Error Handling**: Comprehensive error handling with graceful degradation

### Frontend Architecture

The frontend is built with React and follows a component-based architecture:

#### Component Hierarchy

```
App
├── AuthProvider
│   ├── LoginPage
│   ├── LandingPage
│   └── ProtectedApp
│       └── ChatInterface
│           ├── SearchBar
│           ├── Message
│           │   └── FormattedMessage
│           │       └── CodeBlock
│           ├── Tasks
│           │   ├── DayColumn
│           │   │   └── TaskCard
│           │   └── Todos
│           │       ├── TodoItem
│           │       └── SubtaskItem
│           ├── Timeline
│           │   └── CompletionGraph
│           └── UserProfile
```

#### Key Components

- **ChatInterface**: The main interface for user interaction
- **SearchBar**: Handles user input for task creation and queries
- **Tasks**: Displays tasks in a calendar view with day columns
- **Todos**: Displays to-do lists with subtasks
- **Timeline**: Shows productivity analytics and completion patterns

### Backend Services Architecture

The backend uses a service-oriented architecture with a central service registry:

#### Service Registry Pattern

The system implements a custom dependency injection system through a central service registry (`ServiceRegistry`) that:

1. Registers services with their dependencies
2. Resolves the dependency graph
3. Instantiates services in the correct order
4. Provides a unified access point via `getService()`

#### Service Hierarchy

```
ServiceRegistry
├── MetricsService
├── AiUtils
├── UserPreferencesService
│   └── MetricsService
├── TaskRankingService
│   ├── MetricsService
│   └── UserPreferencesService
├── ScheduleService
│   ├── MetricsService
│   ├── UserPreferencesService
│   └── TaskRankingService
├── TodoHandler
│   └── MetricsService
├── ConversationHandler
│   ├── MetricsService
│   └── ScheduleService
└── GeminiService
    ├── MetricsService
    ├── AiUtils
    ├── ScheduleService
    ├── TodoHandler
    └── ConversationHandler
```

#### Key Services

- **GeminiService**: Core service that processes user input and coordinates responses
- **ScheduleService**: Handles schedule analysis and optimal time suggestions
- **UserPreferencesService**: Manages user-specific settings and preferences
- **TaskRankingService**: Analyzes and ranks tasks by priority and busyness
- **MetricsService**: Provides logging and performance tracking

### Data Flow

1. **User Input Flow**:
   - User enters text in SearchBar
   - Input is sent to GeminiService
   - GeminiService determines request type using rule-based classification
   - Request is routed to appropriate handler (ConversationHandler, TodoHandler, etc.)
   - Response is generated and displayed to user

2. **Task Scheduling Flow**:
   - User requests optimal scheduling
   - ScheduleService fetches existing tasks from Supabase
   - UserPreferencesService provides user's work hours and preferences
   - TaskRankingService analyzes busyness patterns
   - ScheduleService suggests optimal time slots
   - Suggestion is presented to user

3. **Data Persistence Flow**:
   - Tasks, todos, and preferences are stored in Supabase
   - Real-time updates via Supabase's Postgres changes API
   - Client subscribes to relevant channels for live updates

### Database Integration

The system uses Supabase as its backend, providing:

1. **PostgreSQL Database**: For structured data storage
2. **Authentication**: User management and session handling
3. **Row-Level Security**: Data access control at the database level
4. **Real-time Subscriptions**: Live updates via WebSockets
5. **Serverless Functions**: For complex operations

### Error Handling Strategy

The system implements a multi-layered error handling approach:

1. **Service-Level Error Handling**: Each service handles its own errors
2. **Fallback Mechanisms**: Alternative suggestions when optimal solutions fail
3. **User-Friendly Messages**: Context-specific error messages
4. **Comprehensive Logging**: Errors are logged with context for debugging

### Performance Optimization

1. **Caching Strategy**:
   - In-memory caching for frequently accessed data
   - TTL-based cache invalidation
   - Cache hit/miss tracking

2. **Lazy Loading**:
   - Components and services are loaded on demand
   - Code splitting for reduced initial load time

3. **Optimized Rendering**:
   - Memoization for expensive calculations
   - Virtualized lists for large data sets

### Security Measures

1. **Authentication**: Secure user authentication via Supabase Auth
2. **Row-Level Security**: Database-level access control
3. **Environment Variables**: Sensitive configuration stored in environment variables
4. **Input Validation**: Validation of user input before processing

## Database Schema

The system uses the following tables:

- `tasks`: Stores user tasks with scheduling information
- `todos`: Stores user to-do items with due dates
- `subtasks`: Stores subtasks related to to-do items
- `user_preferences`: Stores user-specific preferences for scheduling

## Technical Implementation Details

### Technology Stack

- **Frontend**:
  - React 18+ for UI components
  - React Router for navigation
  - TailwindCSS for styling
  - Framer Motion for animations
  - MUI X Charts for data visualization

- **Backend**:
  - Supabase for database, authentication, and real-time updates
  - PostgreSQL as the underlying database
  - Row-Level Security (RLS) policies for data protection

- **AI Integration**:
  - Google Generative AI (Gemini 2.0 Flash) for natural language processing
  - Custom rule-based classification for query categorization
  - Prompt engineering for specialized task extraction

- **Build & Development**:
  - Vite for fast development and optimized builds
  - ESLint for code quality
  - npm for package management

### Key Implementation Features

#### Dependency Injection System

The custom dependency injection system is implemented in `src/services/serviceRegistry.js` and provides:

```javascript
// Service registration
registry.register('serviceName', factoryFunction, ['dependency1', 'dependency2']);

// Service retrieval
const service = getService('serviceName');
```

This system ensures:
- Services are initialized in the correct order
- Dependencies are properly injected
- Circular dependencies are avoided
- Services are singleton instances

#### Database Migrations

The system includes a robust migration system (`src/db/run-migrations.js`) that:
- Tracks applied migrations in a `migrations` table
- Applies migrations in order based on filename
- Provides detailed logging of migration status
- Handles errors gracefully

#### Caching Implementation

Services implement in-memory caching with TTL (Time To Live):

```javascript
// Example caching implementation
const cacheKey = `${userId}_${startDate}_${endDate}`;
const cachedResult = this.rankingCache.get(cacheKey);

if (cachedResult && (Date.now() - cachedResult.timestamp < this.cacheTTL)) {
  this.metricsService.trackCacheHit('rankingCache');
  return cachedResult.data;
}

// Fetch and compute data if not cached
const result = await computeExpensiveOperation();

// Store in cache
this.rankingCache.set(cacheKey, {
  data: result,
  timestamp: Date.now()
});
```

#### Performance Metrics

The `MetricsService` provides detailed performance tracking:

```javascript
// Start a timer
const timerId = metricsService.startTimer('operation_name');

// Add checkpoints
metricsService.checkpoint(timerId, 'step_completed');

// End timer with metadata
metricsService.endTimer(timerId, { 
  success: true, 
  data_size: dataSize 
});
```

This enables:
- Performance bottleneck identification
- Operation timing with microsecond precision
- Detailed logging with contextual metadata
- Cache hit/miss ratio tracking

#### Real-time Updates

The system leverages Supabase's real-time capabilities:

```javascript
// Subscribe to changes
const channel = supabase
  .channel('table_changes')
  .on('postgres_changes', 
    { event: '*', schema: 'public', table: 'tasks' }, 
    (payload) => {
      // Handle change
    }
  )
  .subscribe();
```

This provides:
- Instant UI updates when data changes
- Collaborative features without polling
- Reduced server load for real-time applications

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables (see `.env.example`)
4. Run database migrations: `node src/db/run-migrations.js`
5. Start the application: `npm start`

## Usage

### Scheduling a Task

Ask the assistant to schedule a task:

```
When is the best time to work on my project presentation?
```

### Analyzing Your Schedule

Ask about your busiest or least busy days:

```
When am I busiest this week?
What's my least busy day in the next week?
```

### Setting Preferences

Update your preferences through the settings page or ask the assistant:

```
Set my work hours from 8 AM to 4 PM
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Future Enhancements & Roadmap

The Task Scheduling System has a planned roadmap for future development:

### Short-term Enhancements (1-3 months)

1. **Enhanced AI Integration**
   - Fine-tuning of the rule-based classifier with machine learning
   - Improved natural language understanding for complex scheduling requests
   - Context-aware responses based on user history

2. **Mobile Application**
   - React Native implementation for iOS and Android
   - Offline capabilities with local storage
   - Push notifications for task reminders

3. **Advanced Analytics**
   - Productivity score calculations
   - Personalized insights based on task completion patterns
   - Visual reports for productivity trends

### Medium-term Goals (3-6 months)

1. **Calendar Integration**
   - Google Calendar and Microsoft Outlook synchronization
   - Two-way sync of tasks and events
   - Conflict detection and resolution

2. **Team Collaboration Features**
   - Shared tasks and projects
   - Team scheduling optimization
   - Role-based access control

3. **Advanced User Preferences**
   - Machine learning to automatically detect optimal work hours
   - Location-based preferences
   - Context-aware scheduling (e.g., different preferences for different types of tasks)

### Long-term Vision (6+ months)

1. **AI-powered Schedule Optimization**
   - Reinforcement learning for schedule optimization
   - Predictive task duration estimation
   - Automatic rescheduling based on changing priorities

2. **Ecosystem Expansion**
   - Public API for third-party integrations
   - Plugin system for extensibility
   - Enterprise features for large organizations

3. **Advanced Natural Language Capabilities**
   - Voice interface for hands-free task management
   - Multilingual support
   - Sentiment analysis for task prioritization

## License

This project is licensed under the MIT License - see the LICENSE file for details.
