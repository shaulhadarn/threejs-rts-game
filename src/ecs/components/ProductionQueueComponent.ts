import { Component } from '../Component';

export interface QueuedUnit {
    unitType: string;
    progress: number;
    cost: { gold: number; wood: number };
}

export interface ProductionQueueData {
    queue: QueuedUnit[];
    productionRate: number;
    maxQueueSize: number;
}

export class ProductionQueueComponent extends Component {
    static readonly TYPE = 'ProductionQueueComponent';
    
    public queue: QueuedUnit[];
    public productionRate: number;
    public maxQueueSize: number;
    
    constructor(productionRate: number = 1, maxQueueSize: number = 5) {
        super();
        this.queue = [];
        this.productionRate = productionRate;
        this.maxQueueSize = maxQueueSize;
    }
    
    getType(): string {
        return ProductionQueueComponent.TYPE;
    }
    
    addToQueue(unitType: string, cost: { gold: number; wood: number }): boolean {
        if (this.queue.length >= this.maxQueueSize) {
            return false;
        }
        
        this.queue.push({
            unitType,
            progress: 0,
            cost
        });
        
        return true;
    }
    
    serialize(): ProductionQueueData {
        return {
            queue: this.queue,
            productionRate: this.productionRate,
            maxQueueSize: this.maxQueueSize
        };
    }
}