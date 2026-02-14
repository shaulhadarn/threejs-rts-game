import { System } from '../ecs/System';
import { World } from '../ecs/World';
import { ProductionQueueComponent } from '../ecs/components/ProductionQueueComponent';
import { BuildingComponent } from '../ecs/components/BuildingComponent';
import { TransformComponent } from '../ecs/components/TransformComponent';
import * as THREE from 'three';

export class ProductionSystem extends System {
    private world: World;
    private scene: THREE.Scene;
    private gameResources: { gold: number; wood: number };
    private unitFactory: any;
    
    constructor(world: World, scene: THREE.Scene, gameResources: { gold: number; wood: number }, unitFactory: any) {
        super();
        this.world = world;
        this.scene = scene;
        this.gameResources = gameResources;
        this.unitFactory = unitFactory;
    }
    
    update(deltaTime: number): void {
        const productionBuildings = this.world.getEntitiesWithComponents([
            ProductionQueueComponent.TYPE,
            BuildingComponent.TYPE,
            TransformComponent.TYPE
        ]);
        
        for (const building of productionBuildings) {
            const queue = building.getComponent(ProductionQueueComponent.TYPE) as ProductionQueueComponent;
            
            if (queue.queue.length > 0) {
                const currentUnit = queue.queue[0];
                currentUnit.progress += deltaTime * queue.productionRate * 20;
                
                if (currentUnit.progress >= 100) {
                    const transform = building.getComponent(TransformComponent.TYPE) as TransformComponent;
                    
                    const spawnOffset = new THREE.Vector3(3, 0, 0);
                    const spawnPos = transform.position.clone().add(spawnOffset);
                    
                    const newUnit = this.unitFactory.createUnit(spawnPos.x, spawnPos.y, spawnPos.z);
                    
                    // Add gathering component to new units
                    const { GatheringComponent } = require('../ecs/components/GatheringComponent');
                    newUnit.addComponent(new GatheringComponent(10, 10));
                    
                    queue.queue.shift();
                    
                    console.log(`Unit ${currentUnit.unitType} completed!`);
                }
            }
        }
    }
    
    trainUnit(buildingId: string): boolean {
        const building = this.world.getEntity(buildingId);
        if (!building) return false;
        
        const queue = building.getComponent(ProductionQueueComponent.TYPE) as ProductionQueueComponent;
        if (!queue) return false;
        
        const unitCost = { gold: 50, wood: 0 };
        
        if (this.gameResources.gold < unitCost.gold || this.gameResources.wood < unitCost.wood) {
            console.log('Not enough resources to train unit');
            return false;
        }
        
        const added = queue.addToQueue('worker', unitCost);
        
        if (added) {
            this.gameResources.gold -= unitCost.gold;
            this.gameResources.wood -= unitCost.wood;
            this.updateResourceUI();
            console.log('Unit added to production queue');
            return true;
        }
        
        return false;
    }
    
    private updateResourceUI(): void {
        const goldEl = document.getElementById('gold-amount');
        const woodEl = document.getElementById('wood-amount');
        
        if (goldEl) goldEl.textContent = this.gameResources.gold.toString();
        if (woodEl) woodEl.textContent = this.gameResources.wood.toString();
    }
    
    init(): void {
        console.log('ProductionSystem initialized');
        this.setupUI();
    }
    
    cleanup(): void {
        console.log('ProductionSystem cleanup');
    }
    
    private setupUI(): void {
        const trainBtn = document.getElementById('train-worker');
        if (trainBtn) {
            trainBtn.addEventListener('click', () => {
                const barracks = this.world.getEntitiesWithComponents([
                    ProductionQueueComponent.TYPE,
                    BuildingComponent.TYPE
                ]);
                
                if (barracks.length > 0) {
                    this.trainUnit(barracks[0].id);
                } else {
                    console.log('No barracks available');
                }
            });
        }
    }
}