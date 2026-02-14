import * as THREE from 'three';
import { BaseComponent, ComponentType } from '../Component';

/**
 * SelectableComponent
 * Marks an entity as selectable and tracks its selection state
 */
export class SelectableComponent extends BaseComponent {
  type = ComponentType.SELECTABLE;

  isSelected: boolean;
  selectionIndicator: THREE.Object3D | null;
  selectionColor: THREE.Color;
  originalColor: THREE.Color | null;

  constructor(
    selectionColor: THREE.ColorRepresentation = 0x00ff00
  ) {
    super();
    this.isSelected = false;
    this.selectionIndicator = null;
    this.selectionColor = new THREE.Color(selectionColor);
    this.originalColor = null;
  }

  /**
   * Select this entity
   */
  select(): void {
    this.isSelected = true;
    if (this.selectionIndicator) {
      this.selectionIndicator.visible = true;
    }
  }

  /**
   * Deselect this entity
   */
  deselect(): void {
    this.isSelected = false;
    if (this.selectionIndicator) {
      this.selectionIndicator.visible = false;
    }
  }

  /**
   * Toggle selection state
   */
  toggle(): void {
    if (this.isSelected) {
      this.deselect();
    } else {
      this.select();
    }
  }

  /**
   * Set the selection indicator (visual feedback)
   */
  setSelectionIndicator(indicator: THREE.Object3D): void {
    this.selectionIndicator = indicator;
    this.selectionIndicator.visible = this.isSelected;
  }

  /**
   * Store the original color before selection
   */
  storeOriginalColor(color: THREE.Color): void {
    this.originalColor = color.clone();
  }

  /**
   * Get the original color
   */
  getOriginalColor(): THREE.Color | null {
    return this.originalColor;
  }

  /**
   * Cleanup
   */
  dispose(): void {
    if (this.selectionIndicator) {
      this.selectionIndicator.removeFromParent();
      this.selectionIndicator = null;
    }
  }
}
