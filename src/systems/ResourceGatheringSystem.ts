import { System } from '../ecs/System';
import { World } from '../ecs/World';
import { Entity } from '../ecs/Entity';
import { GatheringComponent } from '../ecs/components/GatheringComponent';
import { ResourceComponent } from '../ecs/components/ResourceComponent';
import { TransformComponent } from '../ecs/components/TransformComponent';
import { MovementComponent } from '../ecs/components/MovementComponent';
import * as THREE from 'three';

export class ResourceGatheringSystem implements System {
    requiredComponents = [] as const;
    enabled = true;
    priority = 0;

    private world: World;
    private scene: THREE.Scene;
    private gameResources: { gold: number; wood: number };

    constructor(world: World, scene: THREE.Scene, gameResources: { gold: number; wood: number }) {
        this.world = world;
        this.scene = scene;
        this.gameResources = gameResources;
    }

    update(deltaTime: number, entities: Entity[]): void {
        const gatheringEntities = this.world.getEntitiesWithComponents([
            GatheringComponent.TYPE,
            TransformComponent.TYPE,
            MovementComponent.TYPE
        ]);

        for (const entity of gatheringEntities) {
            const gathering = entity.getComponent(GatheringComponent.TYPE) as GatheringComponent;
            const transform = entity.getComponent(TransformComponent.TYPE) as TransformComponent;
            const movement = entity.getComponent(MovementComponent.TYPE) as MovementComponent;

            // If unit is carrying resources and not moving, they should return to base
            if (gathering.currentCarry >= gathering.carryCapacity && !movement.isMoving) {
                // Check if near town hall (simplified - check distance to origin)
                const distanceToBase = transform.position.length();

                if (distanceToBase < 3) {
                    // Deposit resources
                    if (gathering.resourceType === 'gold') {
                        this.gameResources.gold += gathering.currentCarry;
                    } else if (gathering.resourceType === 'wood') {
                        this.gameResources.wood += gathering.currentCarry;
                    }

                    gathering.currentCarry = 0;
                    gathering.resourceType = null;
                    gathering.isGathering = false;

                    console.log(`Resources deposited! Gold: ${this.gameResources.gold}, Wood: ${this.gameResources.wood}`);
                    this.updateResourceUI();
                }
            }

            // If unit has a target resource and is near it
            if (gathering.targetResourceId && !movement.isMoving) {
                const resourceEntity = this.world.getEntity(gathering.targetResourceId);

                if (resourceEntity) {
                    const resource = resourceEntity.getComponent(ResourceComponent.TYPE) as ResourceComponent;
                    const resourceTransform = resourceEntity.getComponent(TransformComponent.TYPE) as TransformComponent;

                    if (resource && resourceTransform) {
                        const distance = transform.position.distanceTo(resourceTransform.position);

                        // If within gathering range
                        if (distance < 2 && !resource.depleted) {
                            gathering.isGathering = true;
                            gathering.gatherTimer += deltaTime;

                            // Gather every second
                            if (gathering.gatherTimer >= 1.0) {
                                const gathered = resource.gather(gathering.gatherRate);
                                gathering.currentCarry += gathered;
                                gathering.resourceType = resource.type;
                                gathering.gatherTimer = 0;

                                console.log(`Gathered ${gathered} ${resource.type}`);

                                // If carrying full load, return to base
                                if (gathering.currentCarry >= gathering.carryCapacity) {
                                    gathering.isGathering = false;
                                    gathering.targetResourceId = null;
                                    // Set movement target to base (origin)
                                    movement.targetPosition.set(0, 0.5, 0);
                                    movement.isMoving = true;
                                }
                            }
                        } else if (resource.depleted) {
                            gathering.targetResourceId = null;
                            gathering.isGathering = false;
                        }
                    }
                }
            }

            // Auto-find nearby resources if idle and not carrying
            if (!gathering.isGathering && !movement.isMoving && gathering.currentCarry === 0) {
                this.findNearestResource(entity);
            }
        }
    }

    private findNearestResource(entity: Entity): void {
        const gathering = entity.getComponent(GatheringComponent.TYPE) as GatheringComponent;
        const transform = entity.getComponent(TransformComponent.TYPE) as TransformComponent;
        const movement = entity.getComponent(MovementComponent.TYPE) as MovementComponent;

        const resourceEntities = this.world.getEntitiesWithComponents([ResourceComponent.TYPE, TransformComponent.TYPE]);

        let nearestResource: Entity | null = null;
        let nearestDistance = Infinity;

        for (const resourceEntity of resourceEntities) {
            const resource = resourceEntity.getComponent(ResourceComponent.TYPE) as ResourceComponent;
            if (resource.depleted) continue;

            const resourceTransform = resourceEntity.getComponent(TransformComponent.TYPE) as TransformComponent;
            const distance = transform.position.distanceTo(resourceTransform.position);

            if (distance < nearestDistance && distance < 20) {
                nearestDistance = distance;
                nearestResource = resourceEntity;
            }
        }

        if (nearestResource) {
            gathering.targetResourceId = nearestResource.id;
            const resourceTransform = nearestResource.getComponent(TransformComponent.TYPE) as TransformComponent;
            movement.targetPosition.copy(resourceTransform.position);
            movement.isMoving = true;
        }
    }

    private updateResourceUI(): void {
        const goldEl = document.getElementById('gold-amount');
        const woodEl = document.getElementById('wood-amount');

        if (goldEl) goldEl.textContent = this.gameResources.gold.toString();
        if (woodEl) woodEl.textContent = this.gameResources.wood.toString();
    }

    init(): void {
        console.log('ResourceGatheringSystem initialized');
        this.updateResourceUI();
    }

    cleanup(): void {
        console.log('ResourceGatheringSystem cleanup');
    }
}
