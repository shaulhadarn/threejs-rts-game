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

// ================================================================
// ON-SCREEN DIAGNOSTIC OVERLAY
// ================================================================

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
                icon = '[✕]';
                color = '#F44336';
                this.hasErrors = true;
                break;
            case 'pending':
                icon = '[...]';
                color = '#FFB74C';
                break;
        }

        item.innerHTML = `<span style="color: ${color}">${icon}</span> ${message}`;

        if (error) {
            const errorDetail = document.createElement('div');
            errorDetail.style.cssText = `
                color: #FF5252;
                font-size: 10px;
                margin-left: 20px;
                white-space: pre-wrap;
                word-break: break-word;
            `;
            errorDetail.textContent = typeof error === 'string' ? error : error?.message || JSON.stringify(error, null, 2);
            item.appendChild(errorDetail);
        }

        this.messageList.appendChild(item);
    }

    updateFPS(fps: number) {
        this.fpsDisplay.textContent = `FPS: ${fps.toFixed(1)}`;
    }

    hasReportedErrors(): boolean {
        return this.hasErrors;
    }
}

// ================================================================
// Global Error Handler
// ================================================================

const diagnostic = new DiagnosticOverlay();

window.addEventListener('error', (event) => {
    diagnostic.log('error', `Uncaught exception: ${event.message}`, event.error || event.message);
});

window.addEventListener('unhandledrejection', (event) => {
    diagnostic.log('error', 'Unhandled Promise Rejection', event.reason);
});

// ================================================================
// Main Game Initialization
// ================================================================

diagnostic.log('pending', 'Initializing Three.js RTS Game...');

try {
    diagnostic.log('pending', 'Creating scene, camera, and renderer...');

    // ================================================================
    // Scene, Camera, and Renderer
    // ================================================================

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(20, 20, 20);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    diagnostic.log('success', 'Scene, camera, and renderer created');

    // ================================================================
    // Lighting
    // ================================================================

    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
    directionalLight.position.set(50, 50, 50);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    diagnostic.log('success', 'Lighting added to scene');

    // ================================================================
    // Ground
    // ================================================================

    const groundGeometry = new THREE.PlaneGeometry(100, 100);
    const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x338833, side: THREE.DoubleSide });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.name = 'ground';
    scene.add(ground);

    diagnostic.log('success', 'Ground added to scene');

    // ================================================================
    // ECS World
    // ================================================================

    diagnostic.log('pending', 'Creating ECS world...');
    const world = new World();
    diagnostic.log('success', 'ECS world created');

    // ================================================================
    // Game Resources
    // ================================================================

    const gameResources = { gold: 0, wood: 0 };
    diagnostic.log('success', 'Game resources initialized');

    // ================================================================
    // UI
    // ================================================================

    diagnostic.log('pending', 'Creating UI...');

    const resourceDisplay = document.createElement('div');
    resourceDisplay.style.cssText = `
        position: absolute;
        top: 50%;
        left: 10px;
        color: white;
        font-family: monospace;
        font-size: 14px;
        background: rgba(0, 0, 0, 0.7);
        padding: 10px;
        border-radius: 5px;
        z-index: 1000;
    `;
    document.body.appendChild(resourceDisplay);

    function updateResourceDisplay() {
        resourceDisplay.innerHTML = `
            Gold: ${gameResources.gold}<br>
            Wood: ${gameResources.wood}
        `;
    }
    updateResourceDisplay();

    const instructions = document.createElement('div');
    instructions.style.cssText = `
        position: absolute;
        bottom: 10px;
        left: 10px;
        color: white;
        font-family: monospace;
        font-size: 12px;
        background: rgba(0, 0, 0, 0.7);
        padding: 10px;
        border-radius: 5px;
        z-index: 1000;
    `;
    instructions.innerHTML = `
        Left Click: Select Unit<br>
        Right Click: Move Selected Units<br>
        'W', 'A', 'D': Move Camera<br>
        'B': Building Mode<br>
        'ESC': Cancel Building
        '1', '2': Train Units (must select barrack)
    `;
    document.body.appendChild(instructions);

    diagnostic.log('success', 'UI created');

    // ================================================================
    // Systems
    // ================================================================

    diagnostic.log('pending', 'Initializing systems...');

    const selectionSystem = new SelectionSystem(world, scene, camera, renderer);
    diagnostic.log('success', 'SelectionSystem initialized');

    const movementSystem = new MovementSystem(world);
    diagnostic.log('success', 'MovementSystem initialized');

    const resourceGatheringSystem = new ResourceGatheringSystem(world, gameResources);
    diagnostic.log('success', 'ResourceGatheringSystem initialized');

    const buildingPlacementSystem = new BuildingPlacementSystem(world, scene, camera, renderer, gameResources);
    diagnostic.log('success', 'BuildingPlacementSystem initialized');

    const productionSystem = new ProductionSystem(world, scene, gameResources);
    diagnostic.log('success', 'ProductionSystem initialized');

    diagnostic.log('success', 'All systems initialized');

    // ================================================================
    // INITIAL GAME SETUP
    // ================================================================

    diagnostic.log('pending', 'Creating initial game objects...');

    // Create initial units
    const unitFactory = new UnitFactory(world, scene);
    unitFactory.createUnit('unit', 10, 0, 10);
    unitFactory.createUnit('unit', 15, 0, 10);
    diagnostic.log('success', 'Initial units created');

    // Create initial resources
    const resourceFactory = new ResourceFactory(world, scene);
    for (let i = 0; i < 20; i++) {
        // Scatter resources around the map
        const x = Math.random() * 80 - 40;
        const z = Math.random() * 80 - 40;
        const type = Math.random() < 0.5 ? 'gold' : 'wood';
        resourceFactory.createResource(type, x, 0, z);
    }
    diagnostic.log('success', 'Initial resources created');

    diagnostic.log('success', 'Initial game objects created');

    // ================================================================
    // Game Loop
    // ================================================================

    diagnostic.log('success', 'Starting game loop');

    let lastTime = 0;
    let fpsFrames = 0;
    let fpsLastTime = 0;

    function gameLoop(time: number) {
        if (diagnostic.hasReportedErrors()) {
            return; // Stop the game loop if an error occurred
        }

        requestAnimationFrame(gameLoop);

        const deltaTime = time - lastTime;
        lastTime = time;

        // FPS Calculation
        fpsFrames++;
        const fpsElapsed = time - fpsLastTime;
        if (fpsElapsed >= 1000) {
            const fps = (fpsFrames / fpsElapsed) * 1000;
            diagnostic.updateFPS(fps);
            fpsFrames = 0;
            fpsLastTime = time;
        }

        // Update systems
        selectionSystem.update();
        movementSystem.update(deltaTime);
        resourceGatheringSystem.update(deltaTime);
        buildingPlacementSystem.update();
        productionSystem.update(deltaTime);

        // Update resource display
        updateResourceDisplay();

        // Render
        renderer.render(scene, camera);
    }

    gameLoop(0);

    diagnostic.log('success', 'Game initialized successfully!');
} catch (error) {
    diagnostic.log('error', 'Failed to initialize game', error);
    console.error('Initialization error:', error);
}
