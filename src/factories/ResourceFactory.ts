import { World } from '../ecs/World';
import { Entity } from '../ecs/Entity';
import { ResourceComponent } from '../ecs/components/ResourceComponent';
import { TransformComponent } from '../ecs/components/TransformComponent';
import { RenderableComponent } from '../ecs/components/RenderableComponent';
import * as THREE from 'three';

export class ResourceFactory {
    private world: World;
    private scene: THREE.Scene;
    
    constructor(world: World, scene: THREE.Scene) {
        this.world = world;
        this.scene = scene;
    }
    
    createGoldMine(x: number, y: number, z: number): Entity {
        const entity = this.world.createEntity();
        
        // Add resource component
        const resource = new ResourceComponent('gold', 500);
        entity.addComponent(resource);
        
        // Add transform
        const transform = new TransformComponent(x, y, z);
        entity.addComponent(transform);
        
        // Create mesh (yellow cube)
        const geometry = new THREE.BoxGeometry(2, 2, 2);
        const material = new THREE.MeshStandardMaterial({ 
            color: 0xffd700,
            metalness: 0.6,
            roughness: 0.4
        });
        const mesh = new THREE.Mesh(geometry, material);
        
        mesh.position.set(x, y, z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.userData.entityId = entity.id;
        
        this.scene.add(mesh);
        
        // Add renderable component
        const renderable = new RenderableComponent(mesh);
        entity.addComponent(renderable);
        
        return entity;
    }
    
    createTree(x: number, y: number, z: number): Entity {
        const entity = this.world.createEntity();
        
        // Add resource component
        const resource = new ResourceComponent('wood', 300);
        entity.addComponent(resource);
        
        // Add transform
        const transform = new TransformComponent(x, y, z);
        entity.addComponent(transform);
        
        // Create tree mesh (cylinder for trunk, cone for leaves)
        const group = new THREE.Group();
        
        // Trunk
        const trunkGeometry = new THREE.CylinderGeometry(0.3, 0.3, 2, 8);
        const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        trunk.position.y = 1;
        trunk.castShadow = true;
        
        // Leaves
        const leavesGeometry = new THREE.ConeGeometry(1.5, 3, 8);
        const leavesMaterial = new THREE.MeshStandardMaterial({ color: 0x228b22 });
        const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
        leaves.position.y = 3;
        leaves.castShadow = true;
        
        group.add(trunk);
        group.add(leaves);
        group.position.set(x, y, z);
        group.userData.entityId = entity.id;
        
        this.scene.add(group);
        
        // Add renderable component
        const renderable = new RenderableComponent(group);
        entity.addComponent(renderable);
        
        return entity;
    }
}