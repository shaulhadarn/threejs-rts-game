import { Entity } from './Entity';
import { ComponentType } from './Component';
import { SystemManager } from './System';

/**
 * World class
 * Central manager for the ECS, handles entities and systems
 */
export class World {
  private entities: Map<number, Entity>;
  private systemManager: SystemManager;
  private entitiesToDestroy: Set<number>;

  constructor() {
    this.entities = new Map();
    this.systemManager = new SystemManager();
    this.entitiesToDestroy = new Set();
  }

  /**
   * Create a new entity
   */
  createEntity(): Entity {
    const entity = new Entity();
    this.entities.set(entity.id, entity);
    return entity;
  }

  /**
   * Get an entity by ID
   */
  getEntity(id: number): Entity | undefined {
    return this.entities.get(id);
  }

  /**
   * Get all entities
   */
  getAllEntities(): Entity[] {
    return Array.from(this.entities.values());
  }

  /**
   * Get enabled entities
   */
  getEnabledEntities(): Entity[] {
    return Array.from(this.entities.values()).filter(e => e.enabled);
  }

  /**
   * Query entities by required components
   */
  queryEntities(...componentTypes: ComponentType[]): Entity[] {
    return Array.from(this.entities.values()).filter(entity =>
      entity.enabled && entity.hasComponents(...componentTypes)
    );
  }

  /**
   * Mark an entity for destruction (will be removed at end of frame)
   */
  destroyEntity(entityId: number): void {
    this.entitiesToDestroy.add(entityId);
  }

  /**
   * Immediately remove an entity
   */
  removeEntity(entityId: number): boolean {
    const entity = this.entities.get(entityId);
    if (entity) {
      entity.destroy();
      return this.entities.delete(entityId);
    }
    return false;
  }

  /**
   * Process entity destruction queue
   */
  private processDestructions(): void {
    for (const entityId of this.entitiesToDestroy) {
      this.removeEntity(entityId);
    }
    this.entitiesToDestroy.clear();
  }

  /**
   * Get the system manager
   */
  getSystemManager(): SystemManager {
    return this.systemManager;
  }

  /**
   * Update all systems
   */
  update(deltaTime: number): void {
    const entities = this.getEnabledEntities();
    this.systemManager.update(deltaTime, entities);
    this.processDestructions();
  }

  /**
   * Clear all entities and systems
   */
  clear(): void {
    // Destroy all entities
    for (const entity of this.entities.values()) {
      entity.destroy();
    }
    this.entities.clear();
    this.entitiesToDestroy.clear();
    this.systemManager.clear();
  }

  /**
   * Get statistics about the world
   */
  getStats(): {
    entityCount: number;
    enabledEntityCount: number;
    systemCount: number;
  } {
    return {
      entityCount: this.entities.size,
      enabledEntityCount: this.getEnabledEntities().length,
      systemCount: this.systemManager.getSystems().length,
    };
  }
}
