import { Component } from '../Component';

export interface BuildingData {
    buildingType: 'townhall' | 'barracks';
    constructionProgress: number;
    isConstructed: boolean;
}

export class BuildingComponent extends Component {
    static readonly TYPE = 'BuildingComponent';
    
    public buildingType: 'townhall' | 'barracks';
    public constructionProgress: number;
    public isConstructed: boolean;
    
    constructor(buildingType: 'townhall' | 'barracks') {
        super();
        this.buildingType = buildingType;
        this.constructionProgress = 0;
        this.isConstructed = true; // Start constructed for now
    }
    
    getType(): string {
        return BuildingComponent.TYPE;
    }
    
    serialize(): BuildingData {
        return {
            buildingType: this.buildingType,
            constructionProgress: this.constructionProgress,
            isConstructed: this.isConstructed
        };
    }
}