import { System } from '../ecs/System';
import { World } from '../ecs/World';
import { Entity } from '../ecs/Entity';
import { SelectableComponent } from '../ecs/components/SelectableComponent';
import { RenderableComponent } from '../ecs/components/RenderableComponent';
import { TransformComponent } from '../ecs/components/TransformComponent';
import * as THREE from 'three';

/**
 * SelectionSystem handles unit selection via mouse clicks
 * Uses raycasting to detect clicks on selectable entities
 */
export class SelectionSystem implements System {
  requiredComponents = ['Selectable' as const];
  enabled = true;
  priority = 0;

  private world: World;
  private scene: THREE.Scene;
  private camera: THREE.Camera;
  private renderer: THREE.WebGLRenderer;
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private currentlySelected: number | null = null;

  constructor(world: World, scene: THREE.Scene, camera: THREE.Camera, renderer: THREE.WebGLRenderer) {
    this.world = world;
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    // Bind click handler
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    window.addEventListener('click', (event: MouseEvent) => {
      // Only handle left clicks for selection
      if (event.button === 0) {
        this.handleSelection(event);
      }
    });
  }

  private handleSelection(event: MouseEvent): void {
    // Calculate mouse position in normalized device coordinates (-1 to +1)
    const canvas = this.renderer.domElement;
    const rect = canvas.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    // Update raycaster
    this.raycaster.setFromCamera(this.mouse, this.camera);

    // Get all selectable entities
    const selectableEntities = this.world.queryEntities('Selectable');
    
    // Build array of meshes to test
    const selectableMeshes: { mesh: THREE.Mesh; entityId: number }[] = [];
    
    for (const entity of selectableEntities) {
      const renderable = entity.getComponent<RenderableComponent>('Renderable');
      if (renderable && renderable.mesh) {
        selectableMeshes.push({ mesh: renderable.mesh, entityId: entity.id });
      }
    }

    // Perform raycast
    const intersects = this.raycaster.intersectObjects(
      selectableMeshes.map(sm => sm.mesh)
    );

    // Deselect current selection
    if (this.currentlySelected !== null) {
      const previousEntity = this.world.getEntity(this.currentlySelected);
      if (previousEntity) {
        const selectable = previousEntity.getComponent<SelectableComponent>('Selectable');
        if (selectable) {
          selectable.setSelected(false);
        }
      }
    }

    // Select new entity if clicked
    if (intersects.length > 0) {
      const clickedMesh = intersects[0].object as THREE.Mesh;
      const selectedItem = selectableMeshes.find(sm => sm.mesh === clickedMesh);
      
      if (selectedItem) {
        const entity = this.world.getEntity(selectedItem.entityId);
        if (entity) {
          const selectable = entity.getComponent<SelectableComponent>('Selectable');
          if (selectable) {
            selectable.setSelected(true);
            this.currentlySelected = entity.id;
            console.log(`Selected unit ${entity.id}`);
          }
        }
      }
    } else {
      // Clicked on empty space - deselect
      this.currentlySelected = null;
    }
  }

  update(deltaTime: number, entities: Entity[]): void {
    // Selection is handled via events, no per-frame update needed
    // But we could add hover effects here in the future
  }

  /**
   * Get the currently selected entity ID
   */
  getSelectedEntity(): number | null {
    return this.currentlySelected;
  }
}
