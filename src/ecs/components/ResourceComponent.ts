import { Component } from '../Component';
import * as THREE from 'three';

export interface ResourceData {
    type: 'gold' | 'wood';
    amount: number;
    maxAmount: number;
    depleted: boolean;
}

export class ResourceComponent extends Component {
    static readonly TYPE = 'ResourceComponent';
    
    public type: 'gold' | 'wood';
    public amount: number;
    public maxAmount: number;
    public depleted: boolean;
    
    constructor(type: 'gold' | 'wood', amount: number) {
        super();
        this.type = type;
        this.amount = amount;
        this.maxAmount = amount;
        this.depleted = false;
    }
    
    getType(): string {
        return ResourceComponent.TYPE;
    }
    
    gather(gatherAmount: number): number {
        if (this.depleted) return 0;
        
        const actualAmount = Math.min(gatherAmount, this.amount);
        this.amount -= actualAmount;
        
        if (this.amount <= 0) {
            this.depleted = true;
        }
        
        return actualAmount;
    }
    
    serialize(): ResourceData {
        return {
            type: this.type,
            amount: this.amount,
            maxAmount: this.maxAmount,
            depleted: this.depleted
        };
    }
}