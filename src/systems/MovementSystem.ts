import { System } from '../ecs/System';
import { World } from '../ecs/World';
import { MovementComponent } from '../ecs/components/MovementComponent';
import { TransformComponent } from '../ecs/components/TransformComponent';
import * as THREE from 'three';

/**
 * MovementSystem handles unit movement to target positions
 * Uses simple linear interpolation for smooth movement
 */
export class MovementSystem extends System {
  private scene: THREE.Scene;
  private camera: THREE.Camera;
  private renderer: THREE.WebGLRenderer;
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private ground: THREE.Mesh | null = null;
  private selectionSystem: any; // Will be injected

  constructor(world: World, scene: THREE.Scene, camera: THREE.Camera, renderer: THREE.WebGLRenderer) {
    super(world);
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    // Find the ground plane for raycasting
    this.findGround();

    // Setup right-click listener for movement commands
    this.setupEventListeners();
  }

  /**
   * Set reference to SelectionSystem to know which unit is selected
   */
  setSelectionSystem(selectionSystem: any): void {
    this.selectionSystem = selectionSystem;
  }

  private findGround(): void {
    // Look for the ground mesh in the scene
    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh && object.userData.isGround) {
        this.ground = object;
      }
    });
  }

  private setupEventListeners(): void {
    // Prevent context menu on right-click
    window.addEventListener('contextmenu', (event: MouseEvent) => {
      event.preventDefault();
    });

    // Handle right-click for movement
    window.addEventListener('mousedown', (event: MouseEvent) => {
      if (event.button === 2) { // Right click
        this.handleMovementCommand(event);
      }
    });
  }

  private handleMovementCommand(event: MouseEvent): void {
    if (!this.selectionSystem) {
      console.warn('SelectionSystem not set');
      return;
    }

    const selectedEntityId = this.selectionSystem.getSelectedEntity();
    if (selectedEntityId === null) {
      return; // No unit selected
    }

    // Calculate mouse position
    const canvas = this.renderer.domElement;
    const rect = canvas.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    // Raycast to find ground intersection
    this.raycaster.setFromCamera(this.mouse, this.camera);
    
    if (!this.ground) {
      this.findGround();
      if (!this.ground) {
        console.warn('Ground not found');
        return;
      }
    }

    const intersects = this.raycaster.intersectObject(this.ground);
    
    if (intersects.length > 0) {
      const targetPosition = intersects[0].point;
      
      // Get the selected entity and set its movement target
      const entity = this.world.getEntity(selectedEntityId);
      if (entity) {
        const movement = entity.getComponent<MovementComponent>('Movement');
        if (movement) {
          movement.setTarget(targetPosition.x, targetPosition.z);
          console.log(`Moving unit ${selectedEntityId} to (${targetPosition.x.toFixed(2)}, ${targetPosition.z.toFixed(2)})`);
        }
      }
    }
  }

  update(deltaTime: number): void {
    // Update all entities with movement components
    const movingEntities = this.world.getEntitiesWithComponent('Movement');
    
    for (const entity of movingEntities) {
      const movement = entity.getComponent<MovementComponent>('Movement');
      const transform = entity.getComponent<TransformComponent>('Transform');
      
      if (!movement || !transform) continue;
      
      const target = movement.getTarget();
      if (!target) continue;
      
      const currentPos = transform.getPosition();
      const dx = target.x - currentPos.x;
      const dz = target.z - currentPos.z;
      const distanceSquared = dx * dx + dz * dz;
      
      // Check if we've reached the target
      if (distanceSquared < 0.01) { // Within 0.1 units
        movement.clearTarget();
        continue;
      }
      
      // Move towards target
      const distance = Math.sqrt(distanceSquared);
      const moveDistance = movement.speed * deltaTime;
      
      if (moveDistance >= distance) {
        // Reached target this frame
        transform.setPosition(target.x, currentPos.y, target.z);
        movement.clearTarget();
      } else {
        // Move towards target
        const ratio = moveDistance / distance;
        const newX = currentPos.x + dx * ratio;
        const newZ = currentPos.z + dz * ratio;
        transform.setPosition(newX, currentPos.y, newZ);
      }
    }
  }
}
