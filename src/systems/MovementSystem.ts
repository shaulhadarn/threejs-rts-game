import { System } from '../ecs/System';
import { World } from '../ecs/World';
import { Entity } from '../ecs/Entity';
import { MovementComponent } from '../ecs/components/MovementComponent';
import { TransformComponent } from '../ecs/components/TransformComponent';
import { RenderableComponent } from '../ecs/components/RenderableComponent';
import { SelectionSystem } from './SelectionSystem';
import * as THREE from 'three';

/**
 * MovementSystem handles unit movement and pathfinding
 * Responds to right-clicks to move selected units
 */
export class MovementSystem implements System {
  public requiredComponents = ['Movement', 'Transform', 'Renderable'];
  public enabled = true;
  public priority = 10;
  
  private world: World;
  private scene: THREE.Scene;
  private camera: THREE.Camera;
  private renderer: THREE.WebGLRenderer;
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private selectionSystem: SelectionSystem | null = null;

  constructor(world: World, scene: THREE.Scene, camera: THREE.Camera, renderer: THREE.WebGLRenderer) {
    this.world = world;
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    this.setupEventListeners();
  }

  setSelectionSystem(selectionSystem: SelectionSystem): void {
    this.selectionSystem = selectionSystem;
  }

  private setupEventListeners(): void {
    window.addEventListener('contextmenu', (event: MouseEvent) => {
      event.preventDefault();
      this.handleMoveCommand(event);
    });
  }

  private handleMoveCommand(event: MouseEvent): void {
    if (!this.selectionSystem) return;

    const selectedEntityId = this.selectionSystem.getSelectedEntity();
    if (selectedEntityId === null) return;

    // Calculate mouse position
    const canvas = this.renderer.domElement;
    const rect = canvas.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    // Raycast to find ground position
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const groundObjects = this.scene.children.filter(obj => obj.userData.isGround);
    const intersects = this.raycaster.intersectObjects(groundObjects);

    if (intersects.length > 0) {
      const targetPosition = intersects[0].point;
      
      // Get the selected entity and set its movement target
      const entity = this.world.getEntity(selectedEntityId);
      if (entity) {
        const movement = entity.getComponent<MovementComponent>('Movement');
        if (movement) {
          movement.setTarget(targetPosition.x, targetPosition.y, targetPosition.z);
          console.log(`Moving unit ${entity.id} to (${targetPosition.x.toFixed(2)}, ${targetPosition.y.toFixed(2)}, ${targetPosition.z.toFixed(2)})`);
        }
      }
    }
  }

  update(deltaTime: number, entities: Entity[]): void {
    for (const entity of entities) {
      const movement = entity.getComponent<MovementComponent>('Movement');
      const transform = entity.getComponent<TransformComponent>('Transform');
      const renderable = entity.getComponent<RenderableComponent>('Renderable');

      if (!movement || !transform || !renderable) continue;

      // Update movement component
      movement.update(deltaTime);

      // Sync transform with movement
      if (movement.isMoving) {
        transform.position.copy(movement.position);
        
        // Update the mesh position
        if (renderable.mesh) {
          renderable.mesh.position.copy(movement.position);
          
          // Optional: rotate mesh to face movement direction
          if (movement.velocity.length() > 0.01) {
            const angle = Math.atan2(movement.velocity.x, movement.velocity.z);
            renderable.mesh.rotation.y = angle;
          }
        }
      }
    }
  }
}