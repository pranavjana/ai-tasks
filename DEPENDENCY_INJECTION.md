# Dependency Injection System

This document outlines the dependency injection system implemented in the Task Scheduling application to improve code structure, reduce circular dependencies, and standardize export patterns.

## Overview

The dependency injection system consists of:

1. A central service registry that manages all service instances
2. Factory functions for creating service instances
3. Explicit dependency declarations for each service
4. Standardized export patterns across all services

## Service Registry

The service registry (`src/services/serviceRegistry.js`) is responsible for:

- Registering services with their dependencies
- Creating service instances in the correct order
- Caching instances to avoid duplicate instantiation
- Providing a centralized way to access services

## Factory Functions

Each service now exports a factory function that creates a new instance of the service:

```javascript
export function createMetricsService() {
  return new MetricsService();
}
```

Services that require dependencies receive them as parameters:

```javascript
export function createUserPreferencesService(metricsService) {
  return new UserPreferencesService(metricsService);
}
```

## Service Initialization

Services are initialized in `src/services/initServices.js`, which:

1. Registers all services with their dependencies
2. Defines the dependency graph
3. Initializes all services in the correct order
4. Provides a `getService` function to access services

## Benefits

This dependency injection system provides several benefits:

### 1. Elimination of Circular Dependencies

By explicitly declaring dependencies and initializing services in the correct order, circular dependencies are eliminated.

### 2. Standardized Export Patterns

All services now follow the same export pattern:
- A factory function for creating new instances
- A default export for backward compatibility

### 3. Improved Testability

Services can be easily mocked or replaced with test doubles since dependencies are explicitly injected.

### 4. Better Error Handling

The service registry provides clear error messages when dependencies are missing or circular.

### 5. Centralized Configuration

Service configuration is centralized in the initialization file, making it easier to modify.

## Usage

To get a service instance:

```javascript
import { getService } from './services/initServices';

// In a component or another service
const metricsService = getService('metrics');
const userPreferencesService = getService('userPreferences');
```

## Backward Compatibility

For backward compatibility, each service still exports a singleton instance as the default export:

```javascript
// Old way (deprecated)
import metricsService from './services/metrics';

// New way
import { getService } from './services/initServices';
const metricsService = getService('metrics');
```

## Future Improvements

Future improvements to the dependency injection system could include:

1. Lazy initialization of services
2. Environment-specific service configurations
3. Runtime service replacement for testing
4. Service lifecycle management (initialization, shutdown) 