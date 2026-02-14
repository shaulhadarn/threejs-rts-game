import { System } from '../ecs/System';
import { World } from '../ecs/World';
import { Entity } from '../ecs/Entity';
import { BuildingComponent } from '../ecs/components/BuildingComponent';
import { TransformComponent } from '../ecs/components/TransformComponent';
import { RenderableComponent } from '../ecs/components/RenderableComponent';
import { ProductionQueueComponent } from '../ecs/components/ProductionQueueComponent';
import * as THREE from 'three';

export class BuildingPlacementSystem implements System {
    requiredComponents = [] as const;
    enabled = true;
    priority = 0;

    private world: World;
    private scene: THREE.Scene;
    private camera: THREE.Camera;
    private renderer: THREE.Renderer;
    private gameResources: { gold: number; wood: number };

    private placementMode: boolean = false;
    private currentBuildingType: 'townhall' | 'barracks' | null = null;
    private ghostBuilding: THREE.Mesh | null = null;
    private raycaster: THREE.Raycaster;
    private mouse: THREE.Vector2;

    constructor(world: World, scene: THREE.Scene, camera: THREE.Camera, renderer: THREE.Renderer, gameResources: { gold: number; wood: number }) {
        this.world = world;
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;
        this.gameResources = gameResources;
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
    }

    update(deltaTime: number, entities: Entity[]): void {
        if (this.placementMode && this.ghostBuilding) {
            this.updateGhostPosition();
        }
    }

    init(): void {
        console.log('BuildingPlacementSystem initialized');
        this.setupUI();
        this.setupEventListeners();
    }

    cleanup(): void {
        console.log('BuildingPlacementSystem cleanup');
        if (this.ghostBuilding) {
            this.scene.remove(this.ghostBuilding);
        }
    }

    private setupUI(): void {
        const townhallBtn = document.getElementById('build-townhall');
        if (townhallBtn) {
            townhallBtn.addEventListener('click', () => this.enterPlacementMode('townhall'));
        }

        const barracksBtn = document.getElementById('build-barracks');
        if (barracksBtn) {
            barracksBtn.addEventListener('click', () => this.enterPlacementMode('barracks'));
        }
    }

    private setupEventListeners(): void {
        const canvas = this.renderer.domElement;

        canvas.addEventListener('mousemove', (event) => {
            if (!this.placementMode) return;

            const rect = canvas.getBoundingClientRect();
            this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        });

        canvas.addEventListener('click', (event) => {
            if (this.placementMode && event.button === 0) {
                this.placeBuilding();
            }
        });

        window.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && this.placementMode) {
                this.exitPlacementMode();
            }
        });
    }

    private enterPlacementMode(buildingType: 'townhall' | 'barracks'): void {
        const costs = this.getBuildingCost(buildingType);

        if (this.gameResources.gold < costs.gold || this.gameResources.wood < costs.wood) {
            console.log('Not enough resources!');
            return;
        }

        this.placementMode = true;
        this.currentBuildingType = buildingType;
        this.createGhostBuilding(buildingType);

        console.log(`Entering placement mode for ${buildingType}`);
    }

    private exitPlacementMode(): void {
        this.placementMode = false;
        this.currentBuildingType = null;

        if (this.ghostBuilding) {
            this.scene.remove(this.ghostBuilding);
            this.ghostBuilding = null;
        }

        console.log('Exited placement mode');
    }

    private createGhostBuilding(buildingType: string): void {
        const size = buildingType === 'townhall' ? 4 : 3;
        const color = buildingType === 'townhall' ? 0xd4af37 : 0x8b4513;

        const geometry = new THREE.BoxGeometry(size, size * 0.8, size);
        const material = new THREE.MeshStandardMaterial({
            color: color,
            transparent: true,
            opacity: 0.5
        });

        this.ghostBuilding = new THREE.Mesh(geometry, material);
        this.ghostBuilding.position.y = (size * 0.8) / 2;
        this.scene.add(this.ghostBuilding);
    }

    private updateGhostPosition(): void {
        if (!this.ghostBuilding) return;

        this.raycaster.setFromCamera(this.mouse, this.camera);

        const groundObjects = this.scene.children.filter(obj =>
            obj.userData.isGround === true
        );

        const intersects = this.raycaster.intersectObjects(groundObjects, false);

        if (intersects.length > 0) {
            const point = intersects[0].point;
            this.ghostBuilding.position.x = point.x;
            this.ghostBuilding.position.z = point.z;

            const isValid = this.isValidPlacement(point);
            const material = this.ghostBuilding.material as THREE.MeshStandardMaterial;
            material.color.setHex(isValid ? 0x00ff00 : 0xff0000);
        }
    }

    private isValidPlacement(position: THREE.Vector3): boolean {
        const minDistance = 5;

        const buildings = this.world.getEntitiesWithComponents([BuildingComponent.TYPE, TransformComponent.TYPE]);

        for (const building of buildings) {
            const transform = building.getComponent(TransformComponent.TYPE) as TransformComponent;
            const distance = position.distanceTo(transform.position);

            if (distance < minDistance) {
                return false;
            }
        }

        return true;
    }

    private placeBuilding(): void {
        if (!this.ghostBuilding || !this.currentBuildingType) return;

        const position = this.ghostBuilding.position.clone();

        if (!this.isValidPlacement(position)) {
            console.log('Invalid placement location');
            return;
        }

        const costs = this.getBuildingCost(this.currentBuildingType);

        this.gameResources.gold -= costs.gold;
        this.gameResources.wood -= costs.wood;
        this.updateResourceUI();

        this.createBuilding(this.currentBuildingType, position);

        console.log(`Placed ${this.currentBuildingType} at`, position);

        this.exitPlacementMode();
    }

    private createBuilding(buildingType: 'townhall' | 'barracks', position: THREE.Vector3): void {
        const entity = this.world.createEntity();

        const building = new BuildingComponent(buildingType);
        entity.addComponent(building);

        const transform = new TransformComponent(position.x, position.y, position.z);
        entity.addComponent(transform);

        const size = buildingType === 'townhall' ? 4 : 3;
        const color = buildingType === 'townhall' ? 0xd4af37 : 0x8b4513;

        const geometry = new THREE.BoxGeometry(size, size * 0.8, size);
        const material = new THREE.MeshStandardMaterial({ color });
        const mesh = new THREE.Mesh(geometry, material);

        mesh.position.copy(position);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.userData.entityId = entity.id;

        this.scene.add(mesh);

        const renderable = new RenderableComponent(mesh);
        entity.addComponent(renderable);

        if (buildingType === 'barracks') {
            const productionQueue = new ProductionQueueComponent();
            entity.addComponent(productionQueue);
        }
    }

    private getBuildingCost(buildingType: string): { gold: number; wood: number } {
        const costs: Record<string, { gold: number; wood: number }> = {
            'townhall': { gold: 200, wood: 150 },
            'barracks': { gold: 100, wood: 80 }
        };

        return costs[buildingType] || { gold: 0, wood: 0 };
    }

    private updateResourceUI(): void {
        const goldEl = document.getElementById('gold-amount');
        const woodEl = document.getElementById('wood-amount');

        if (goldEl) goldEl.textContent = this.gameResources.gold.toString();
        if (woodEl) woodEl.textContent = this.gameResources.wood.toString();
    }
}
