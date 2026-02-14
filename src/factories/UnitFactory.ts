import { World } from '../ecs/World';
import { Entity } from '../ecs/Entity';
import { TransformComponent } from '../ecs/components/TransformComponent';
import { RenderableComponent } from '../ecs/components/RenderableComponent';
import { SelectableComponent } from '../ecs/components/SelectableComponent';
import { MovementComponent } from '../ecs/components/MovementComponent';
import * as THREE from 'three';

/**
 * UnitFactory creates unit entities with all required components
 */
export class UnitFactory {
  private world: World;
  private scene: THREE.Scene;

  constructor(world: World, scene: THREE.Scene) {
    this.world = world;
    this.scene = scene;
  }

  /**
   * Create a basic unit entity at the specified position
   * @param x X position
   * @param y Y position (height)
   * @param z Z position
   * @returns The created entity
   */
  createUnit(x: number = 0, y: number = 0.5, z: number = 0): Entity {
    // Create entity
    const entity = this.world.createEntity();

    // Add Transform component
    const transform = new TransformComponent();
    transform.setPosition(x, y, z);
    entity.addComponent(transform);

    // Create unit mesh (blue box)
    const unitGeometry = new THREE.BoxGeometry(1, 1, 1);
    const unitMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x4444ff,
      metalness: 0.3,
      roughness: 0.7
    });
    const unitMesh = new THREE.Mesh(unitGeometry, unitMaterial);
    unitMesh.position.set(x, y, z);
    unitMesh.castShadow = true;
    unitMesh.receiveShadow = true;
    this.scene.add(unitMesh);

    // Create selection indicator (yellow ring)
    const ringGeometry = new THREE.TorusGeometry(0.7, 0.05, 16, 32);
    const ringMaterial = new THREE.MeshBasicMaterial({ 
      color: 0xffff00,
      transparent: true,
      opacity: 0
    });
    const selectionRing = new THREE.Mesh(ringGeometry, ringMaterial);
    selectionRing.rotation.x = Math.PI / 2; // Lay flat on ground
    selectionRing.position.set(x, 0.05, z); // Just above ground
    this.scene.add(selectionRing);

    // Add Renderable component
    const renderable = new RenderableComponent(unitMesh);
    entity.addComponent(renderable);

    // Add Selectable component with selection indicator
    const selectable = new SelectableComponent(selectionRing);
    entity.addComponent(selectable);

    // Add Movement component (5 units per second speed)
    const movement = new MovementComponent(5.0);
    entity.addComponent(movement);

    console.log(`Created unit ${entity.id} at position (${x}, ${y}, ${z})`);

    return entity;
  }

  /**
   * Create multiple units in a formation
   * @param count Number of units to create
   * @param spacing Space between units
   * @param centerX Center X position
   * @param centerZ Center Z position
   */
  createUnitFormation(count: number, spacing: number = 2, centerX: number = 0, centerZ: number = 0): Entity[] {
    const units: Entity[] = [];
    const unitsPerRow = Math.ceil(Math.sqrt(count));
    
    for (let i = 0; i < count; i++) {
      const row = Math.floor(i / unitsPerRow);
      const col = i % unitsPerRow;
      
      const x = centerX + (col - unitsPerRow / 2) * spacing;
      const z = centerZ + (row - unitsPerRow / 2) * spacing;
      
      units.push(this.createUnit(x, 0.5, z));
    }
    
    return units;
  }
}
