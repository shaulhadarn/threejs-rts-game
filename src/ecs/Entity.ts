import { Component, ComponentType } from './Component';

/**
 * Entity class
 * Represents a game object that can have components attached
 */
export class Entity {
  private static nextId: number = 0;
  
  public readonly id: number;
  private components: Map<ComponentType, Component>;
  private _enabled: boolean;

  constructor() {
    this.id = Entity.nextId++;
    this.components = new Map();
    this._enabled = true;
  }

  /**
   * Add a component to this entity
   */
  addComponent(component: Component): this {
    this.components.set(component.type, component);
    return this;
  }

  /**
   * Get a component by type
   */
  getComponent<T extends Component>(type: ComponentType): T | undefined {
    return this.components.get(type) as T | undefined;
  }

  /**
   * Check if entity has a component
   */
  hasComponent(type: ComponentType): boolean {
    return this.components.has(type);
  }

  /**
   * Check if entity has all specified components
   */
  hasComponents(...types: ComponentType[]): boolean {
    return types.every(type => this.components.has(type));
  }

  /**
   * Remove a component from this entity
   */
  removeComponent(type: ComponentType): boolean {
    return this.components.delete(type);
  }

  /**
   * Get all components
   */
  getAllComponents(): Component[] {
    return Array.from(this.components.values());
  }

  /**
   * Get all component types
   */
  getComponentTypes(): ComponentType[] {
    return Array.from(this.components.keys());
  }

  /**
   * Enable this entity
   */
  enable(): void {
    this._enabled = true;
  }

  /**
   * Disable this entity
   */
  disable(): void {
    this._enabled = false;
  }

  /**
   * Check if entity is enabled
   */
  get enabled(): boolean {
    return this._enabled;
  }

  /**
   * Destroy this entity (cleanup)
   */
  destroy(): void {
    this.components.clear();
    this._enabled = false;
  }
}
