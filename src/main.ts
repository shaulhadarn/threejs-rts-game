import * as THREE from 'three';
import { World } from './ecs/World';
import { SelectionSystem } from './systems/SelectionSystem';
import { MovementSystem } from './systems/MovementSystem';
import { ResourceGatheringSystem } from './systems/ResourceGatheringSystem';
import { BuildingPlacementSystem } from './systems/BuildingPlacementSystem';
import { ProductionSystem } from './systems/ProductionSystem';
import { UnitFactory } from './factories/UnitFactory';
import { ResourceFactory } from './factories/ResourceFactory';
import { GatheringComponent } from './ecs/components/GatheringComponent';

// ============================================================
// ON-SCREEN DIAGNOSTIC OVERLAY
// ============================================================

interface DiagnosticMessage {
    status: 'success' | 'error' | 'pending';
    message: string;
    error?: string;
}

class DiagnosticOverlay {
    private overlay: HTMLDivElement;
    private messageList: HTMLDivElement;
    private fpsDisplay: HTMLDivElement;
    private hasErrors = false;

    constructor() {
        // Create overlay container
        this.overlay = document.createElement('div');
        this.overlay.style.cssText = `
            position: fixed;
            top: 10px;
            left: 10px;
            background: rgba(0, 0, 0, 0.85);
            color: white;
            padding: 15px;
            font-family: monospace;
            font-size: 12px;
            border-radius: 5px;
            z-index: 10000;
            max-width: 500px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.3);
        `;

        // Create title
        const title = document.createElement('div');
        title.textContent = 'Three.js RTS Game - Initialization';
        title.style.cssText = `
            font-weight: bold;
            margin-bottom: 10px;
            font-size: 14px;
            color: #4CAF50;
        `;
        this.overlay.appendChild(title);

        // Create message list
        this.messageList = document.createElement('div');
        this.overlay.appendChild(this.messageList);

        // Create FPS display
        this.fpsDisplay = document.createElement('div');
        this.fpsDisplay.style.cssText = `
            margin-top: 10px;
            padding-top: 10px;
            border-top: 1px solid #444;
            color: #4CAF50;
        `;
        this.overlay.appendChild(this.fpsDisplay);

        document.body.appendChild(this.overlay);
    }

    log(status: 'success' | 'error' | 'pending', message: string, error?: any) {
        const item = document.createElement('div');
        item.style.cssText = `
            margin: 5px 0;
            padding: 3px 0;
        `;

        let icon = '';
        let color = '';

        switch (status) {
            case 'success':
                icon = '[✓]';
                color = '#4CAF50';
                break;
            case 'error':
                icon = '[✗]';
                color = '#FF5252';
                this.hasErrors = true;
                break;
            case 'pending':
                icon = '[...]';
                color = '#FFB74C';
                break;
        }

        item.innerHTML = `<span style="color: ${color}">${icon}</span> ${message}`;

        if (error && status === 'error') {
            const errorDetail = document.createElement('div');
            errorDetail.style.cssText = `
                margin-left: 20px;
                font-size: 10px;
                color: #FF5252;
                white-space: pre-wrap;
            `;
            errorDetail.textContent = error?.toString() || 'Unknown error';
            item.appendChild(errorDetail);
        }

        this.messageList.appendChild(item);
    }

    updateFPS(fps: number) {
        this.fpsDisplay.textContent = `FPS: ${fps.toFixed(1)}`;
    }
}

const diagnostic = new DiagnosticOverlay();

const gameResources = {
    gold: 100,
    wood: 50,
};

// ============================================================
// SCENE SETUP
// ============================================================

diagnostic.log('pending', 'Setting up Three.js scene...');

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB);

const camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
);
camera.position.set(10, 10, 10);
camera.lookAt(0, 0, 0);

// Add lights
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.7);
directionalLight.position.set(50, 50, 50);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
directionalLight.shadow.camera.near = 0.1;
directionalLight.shadow.camera.far = 200;
directionalLight.shadow.camera.left = -30;
directionalLight.shadow.camera.right = 30;
directionalLight.shadow.camera.top = 30;
directionalLight.shadow.camera.bottom = -30;
scene.add(directionalLight);

// Ground plane
const groundGeometry = new THREE.PlaneGeometry(100, 100);
const groundMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x669054, 
        roughness: 0.8,
        metalness: 0.2,
});

const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
ground.name = 'ground';
scene.add(ground);

diagnostic.log('success', 'Three.js scene created');

// ============================================================
// ECS SETUP
// ============================================================

diagnostic.log('pending', 'Initializing ECS systems...');

const world = new World();

// Initialize systems
try {
        const selectionSystem = new SelectionSystem(world, scene, camera, renderer);
        world.addSystem(selectionSystem);
        diagnostic.log('success', 'SelectionSystem initialized');

        const movementSystem = new MovementSystem(world, scene, camera, renderer);
        world.addSystem(movementSystem);
        diagnostic.log('success', 'MovementSystem initialized');

        const resourceGatheringSystem = new ResourceGatheringSystem(world, scene);
        world.addSystem(resourceGatheringSystem);
        diagnostic.log('success', 'ResourceGatheringSystem initialized');

        const buildingPlacementSystem = new BuildingPlacementSystem(world, scene, camera, renderer, gameResources);
        world.addSystem(buildingPlacementSystem);
        diagnostic.log('success', 'BuildingPlacementSystem initialized');

        const productionSystem = new ProductionSystem(world, scene);
        world.addSystem(productionSystem);
        diagnostic.log('success', 'ProductionSystem initialized');
} catch (error) {
        diagnostic.log('error', 'FAILED to initialize systems', error);
        throw error;
}

// ============================================================
// SPAWN INITIAL ENTITIES
// ============================================================

diagnostic.log('pending', 'Spawning initial entities...');

// Add 3 units
for (let i = 0; i < 3; i++) {
        const unit = UnitFactory.createUnit(world, scene, i * 2, 3 * (i % 2));
        world.addEntity(unit);
}

diagnostic.log('success', '5 units created');

// Add 5 resource nodes
for(let i = 0; i < 5; i++) {
        const x = (Math.random() - 0.5) * 40;
        const z = (Math.random() - 0.5) * 40;
        
        const resourceType = Math.random() < 0.5 ? 'gold' : 'wood';
        const resourceNode = ResourceFactory.createResource(world, scene, resourceType, x, z);
        world.addEntity(resourceNode);
}

diagnostic.log('success', '5 resource nodes created');

// ============================================================
// GAME LOOP
// ============================================================

diagnostic.log('success', 'All systems go!');

let lastTime = performance.now();
let frameTimes: number[] = [];

function animate() {
        requestAnimationFrame(animate);
    
        const currentTime = performance.now();
        const delta = (currentTime - lastTime) / 1000;
        lastTime = currentTime;
    
        // Calculate FPS
        frameTimes.push(delta);
        if (frameTimes.length > 60) {
            frameTimes.shift();
        }
        const averageDelta = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;
        const fps = 1 / averageDelta;
        diagnostic.updateFPS(fps);
    
        world.update(delta);
        renderer.render(scene, camera);
}

animate();

// Handle window resize
window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
});
