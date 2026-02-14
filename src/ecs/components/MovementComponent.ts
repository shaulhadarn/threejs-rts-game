import * as THREE from 'three';
import { BaseComponent, ComponentType } from '../Component';

/**
 * MovementComponent
 * Handles entity movement with speed and target position
 */
export class MovementComponent extends BaseComponent {
  type = ComponentType.MOVEMENT;

  speed: number;
  targetPosition: THREE.Vector3 | null;
  isMoving: boolean;
  rotationSpeed: number;
  arrivalThreshold: number;

  constructor(
    speed: number = 5.0,
    rotationSpeed: number = 5.0,
    arrivalThreshold: number = 0.1
  ) {
    super();
    this.speed = speed;
    this.rotationSpeed = rotationSpeed;
    this.targetPosition = null;
    this.isMoving = false;
    this.arrivalThreshold = arrivalThreshold;
  }

  /**
   * Set a target position to move towards
   */
  setTarget(target: THREE.Vector3): void {
    this.targetPosition = target.clone();
    this.isMoving = true;
  }

  /**
   * Clear the target and stop moving
   */
  clearTarget(): void {
    this.targetPosition = null;
    this.isMoving = false;
  }

  /**
   * Check if entity has reached its target
   */
  hasReachedTarget(currentPosition: THREE.Vector3): boolean {
    if (!this.targetPosition) return true;
    
    const distance = currentPosition.distanceTo(this.targetPosition);
    return distance <= this.arrivalThreshold;
  }

  /**
   * Get direction vector to target
   */
  getDirectionToTarget(currentPosition: THREE.Vector3): THREE.Vector3 | null {
    if (!this.targetPosition) return null;
    
    const direction = new THREE.Vector3()
      .subVectors(this.targetPosition, currentPosition)
      .normalize();
    
    return direction;
  }

  /**
   * Get distance to target
   */
  getDistanceToTarget(currentPosition: THREE.Vector3): number | null {
    if (!this.targetPosition) return null;
    return currentPosition.distanceTo(this.targetPosition);
  }

  /**
   * Set movement speed
   */
  setSpeed(speed: number): void {
    this.speed = speed;
  }

  /**
   * Stop movement immediately
   */
  stop(): void {
    this.clearTarget();
  }
}
