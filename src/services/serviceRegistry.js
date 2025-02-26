/**
 * Service Registry
 * 
 * This module provides a centralized registry for all services,
 * implementing a simple dependency injection system to avoid circular dependencies
 * and standardize how services are accessed throughout the application.
 */

class ServiceRegistry {
  constructor() {
    this.services = new Map();
    this.factories = new Map();
    this.instances = new Map();
  }

  /**
   * Register a service factory function
   * @param {string} name - The service name
   * @param {Function} factory - Factory function that creates the service
   * @param {Array<string>} dependencies - Names of services this service depends on
   */
  register(name, factory, dependencies = []) {
    this.services.set(name, { factory, dependencies });
  }

  /**
   * Get a service instance, creating it if necessary
   * @param {string} name - The service name
   * @returns {Object} - The service instance
   */
  get(name) {
    // Return cached instance if available
    if (this.instances.has(name)) {
      return this.instances.get(name);
    }

    const serviceInfo = this.services.get(name);
    if (!serviceInfo) {
      throw new Error(`Service '${name}' not registered`);
    }

    // Resolve dependencies
    const resolvedDependencies = serviceInfo.dependencies.map(depName => this.get(depName));
    
    // Create instance
    const instance = serviceInfo.factory(...resolvedDependencies);
    
    // Cache instance
    this.instances.set(name, instance);
    
    return instance;
  }

  /**
   * Initialize all registered services
   */
  initializeAll() {
    // Get all services to ensure they're instantiated
    for (const name of this.services.keys()) {
      this.get(name);
    }
    console.log('All services initialized');
  }
}

// Create and export singleton instance
const registry = new ServiceRegistry();
export default registry; 