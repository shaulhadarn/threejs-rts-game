import { Entity } from './Entity';
import { ComponentType } from './Component';

/**
 * Base System interface
 * All systems must implement this interface
 * Exported for use in game systems (SelectionSystem, MovementSystem, etc.)
 */
export interface System {
  /**
   * Update method called every frame
   * @param deltaTime Time elapsed since last frame in seconds
   * @param entities Array of entities that match this system's requirements
   */
  update(deltaTime: number, entities: Entity[]): void;

  /**
   * Component types required for this system to process an entity
   */
  requiredComponents: ComponentType[];

  /**
   * Priority of this system (lower numbers run first)
   */
  priority?: number;

  /**
   * Whether this system is enabled
   */
  enabled: boolean;
}

/**
 * Base System class with common functionality
 */
export abstract class BaseSystem implements System {
  abstract requiredComponents: ComponentType[];
  priority: number = 0;
  enabled: boolean = true;

  abstract update(deltaTime: number, entities: Entity[]): void;

  /**
   * Filter entities that have all required components
   */
  protected filterEntities(allEntities: Entity[]): Entity[] {
    return allEntities.filter(entity => 
      entity.enabled && entity.hasComponents(...this.requiredComponents)
    );
  }
}

/**
 * SystemManager
 * Manages all systems and their execution order
 */
export class SystemManager {
  private systems: System[] = [];

  /**
   * Register a system
   */
  register(system: System): this {
    this.systems.push(system);
    // Sort by priority (lower numbers first)
    this.systems.sort((a, b) => (a.priority || 0) - (b.priority || 0));
    return this;
  }

  /**
   * Unregister a system
   */
  unregister(system: System): boolean {
    const index = this.systems.indexOf(system);
    if (index !== -1) {
      this.systems.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Update all systems
   */
  update(deltaTime: number, entities: Entity[]): void {
    for (const system of this.systems) {
      if (!system.enabled) continue;

      // Filter entities that match this system's requirements
      const matchingEntities = entities.filter(entity =>
        entity.enabled && entity.hasComponents(...system.requiredComponents)
      );

      system.update(deltaTime, matchingEntities);
    }
  }

  /**
   * Get all registered systems
   */
  getSystems(): System[] {
    return [...this.systems];
  }

  /**
   * Clear all systems
   */
  clear(): void {
    this.systems = [];
  }
}