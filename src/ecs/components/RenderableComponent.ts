import * as THREE from 'three';
import { BaseComponent, ComponentType } from '../Component';

/**
 * RenderableComponent
 * Holds a reference to a Three.js mesh for rendering
 */
export class RenderableComponent extends BaseComponent {
  type = ComponentType.RENDERABLE;

  mesh: THREE.Mesh | THREE.Group | THREE.Object3D;
  visible: boolean;
  castShadow: boolean;
  receiveShadow: boolean;

  constructor(
    mesh: THREE.Mesh | THREE.Group | THREE.Object3D,
    options: {
      visible?: boolean;
      castShadow?: boolean;
      receiveShadow?: boolean;
    } = {}
  ) {
    super();
    this.mesh = mesh;
    this.visible = options.visible ?? true;
    this.castShadow = options.castShadow ?? true;
    this.receiveShadow = options.receiveShadow ?? true;

    // Apply shadow settings
    this.mesh.castShadow = this.castShadow;
    this.mesh.receiveShadow = this.receiveShadow;
    this.mesh.visible = this.visible;
  }

  /**
   * Show the mesh
   */
  show(): void {
    this.visible = true;
    this.mesh.visible = true;
  }

  /**
   * Hide the mesh
   */
  hide(): void {
    this.visible = false;
    this.mesh.visible = false;
  }

  /**
   * Set material color (if mesh has a material)
   */
  setColor(color: THREE.ColorRepresentation): void {
    if (this.mesh instanceof THREE.Mesh && this.mesh.material) {
      const material = this.mesh.material as THREE.MeshStandardMaterial;
      material.color.set(color);
    }
  }

  /**
   * Dispose of the mesh and its resources
   */
  dispose(): void {
    if (this.mesh instanceof THREE.Mesh) {
      this.mesh.geometry?.dispose();
      if (Array.isArray(this.mesh.material)) {
        this.mesh.material.forEach(mat => mat.dispose());
      } else {
        this.mesh.material?.dispose();
      }
    }
  }
}
