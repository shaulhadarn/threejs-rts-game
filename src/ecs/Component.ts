/**
 * Component Types Enum
 * Defines all available component types in the ECS
 */
export enum ComponentType {
  TRANSFORM = 'transform',
  RENDERABLE = 'renderable',
  SELECTABLE = 'selectable',
  MOVEMENT = 'movement',
  HEALTH = 'health',
  UNIT = 'unit',
  RESOURCE = 'resource',
  BUILDING = 'building',
}

/**
 * Base Component Interface
 * All components must implement this interface
 */
export interface Component {
  type: ComponentType;
  enabled: boolean;
}

/**
 * Base Component class with common functionality
 */
export abstract class BaseComponent implements Component {
  abstract type: ComponentType;
  enabled: boolean = true;

  constructor() {}

  enable(): void {
    this.enabled = true;
  }

  disable(): void {
    this.enabled = false;
  }
}

// Re-export everything explicitly
export type { Component as ComponentInterface };
export { ComponentType, BaseComponent };
