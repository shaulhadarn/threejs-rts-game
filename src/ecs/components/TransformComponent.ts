import { Component } from '../Component';
import * as THREE from 'three';

/**
 * TransformComponent stores position, rotation, and scale data
 * for entities in 3D space using Three.js math types.
 */
export class TransformComponent extends Component {
  public position: THREE.Vector3;
  public rotation: THREE.Euler;
  public scale: THREE.Vector3;

  constructor(
    position: THREE.Vector3 = new THREE.Vector3(0, 0, 0),
    rotation: THREE.Euler = new THREE.Euler(0, 0, 0),
    scale: THREE.Vector3 = new THREE.Vector3(1, 1, 1)
  ) {
    super('Transform');
    this.position = position.clone();
    this.rotation = rotation.clone();
    this.scale = scale.clone();
  }

  /**
   * Set position from x, y, z coordinates
   */
  setPosition(x: number, y: number, z: number): void {
    this.position.set(x, y, z);
  }

  /**
   * Set rotation from x, y, z angles (in radians)
   */
  setRotation(x: number, y: number, z: number): void {
    this.rotation.set(x, y, z);
  }

  /**
   * Set uniform scale
   */
  setScale(s: number): void {
    this.scale.set(s, s, s);
  }

  /**
   * Set non-uniform scale
   */
  setScaleXYZ(x: number, y: number, z: number): void {
    this.scale.set(x, y, z);
  }

  /**
   * Create a transformation matrix from this transform
   */
  getMatrix(): THREE.Matrix4 {
    const matrix = new THREE.Matrix4();
    matrix.compose(this.position, new THREE.Quaternion().setFromEuler(this.rotation), this.scale);
    return matrix;
  }

  /**
   * Apply this transform to a Three.js Object3D
   */
  applyToObject3D(object: THREE.Object3D): void {
    object.position.copy(this.position);
    object.rotation.copy(this.rotation);
    object.scale.copy(this.scale);
  }

  /**
   * Update this transform from a Three.js Object3D
   */
  updateFromObject3D(object: THREE.Object3D): void {
    this.position.copy(object.position);
    this.rotation.copy(object.rotation);
    this.scale.copy(object.scale);
  }

  /**
   * Clone this transform component
   */
  clone(): TransformComponent {
    return new TransformComponent(this.position, this.rotation, this.scale);
  }
}