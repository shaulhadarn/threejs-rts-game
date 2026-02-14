import { Component } from '../Component';

export interface GatheringData {
    gatherRate: number;
    carryCapacity: number;
    currentCarry: number;
    resourceType: 'gold' | 'wood' | null;
    targetResourceId: string | null;
    isGathering: boolean;
    gatherTimer: number;
}

export class GatheringComponent extends Component {
    static readonly TYPE = 'GatheringComponent';
    
    public gatherRate: number;
    public carryCapacity: number;
    public currentCarry: number;
    public resourceType: 'gold' | 'wood' | null;
    public targetResourceId: string | null;
    public isGathering: boolean;
    public gatherTimer: number;
    
    constructor(gatherRate: number = 10, carryCapacity: number = 10) {
        super();
        this.gatherRate = gatherRate;
        this.carryCapacity = carryCapacity;
        this.currentCarry = 0;
        this.resourceType = null;
        this.targetResourceId = null;
        this.isGathering = false;
        this.gatherTimer = 0;
    }
    
    getType(): string {
        return GatheringComponent.TYPE;
    }
    
    serialize(): GatheringData {
        return {
            gatherRate: this.gatherRate,
            carryCapacity: this.carryCapacity,
            currentCarry: this.currentCarry,
            resourceType: this.resourceType,
            targetResourceId: this.targetResourceId,
            isGathering: this.isGathering,
            gatherTimer: this.gatherTimer
        };
    }
}