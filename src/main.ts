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

// ==================================================
// ON-SCREEN DIAGNOSTIC OVERLAY
// ==================================================

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
                color = '#f44336';
                this.hasErrors = true;
                break;
            case 'pending':
                icon = '[⋯]';
                color = '#FFC702';
                break;
        }

        item.innerHTML = `<span style="color: ${color}">${icon}</span> ${message}`;

        if (error) {
            const errorDetail = document.createElement('div');
            errorDetail.style.cssText = `
                margin-left: 20px;
                color: #f44336;
                font-size: 10px;
                margin-top: 5px;
            `;
            errorDetail.textContent = `Error: ${error.message || error}`;
            item.appendChild(errorDetail);
        }

        this.messageList.appendChild(item);
    }

    updateFps(fps: number) {
        this.fpsDisplay.textContent = `FPS: ${fps.toFixed(1)}`;
    }

    hide() {
        if (!this.hasErrors) {
            setTimeout(() => {
                this.overlay.style.transition = 'opacity 1s';
                this.overlay.style.opacity = '0';
                setTimeout(() => this.overlay.remove(), 1000);
            }, 3000);
        }
    }
}

// ==================================================
// MAIN GAME INITIALIZATION
// ==================================================

const diagnostics = new DiagnosticOverlay();

try {
    diagnostics.log('pending', 'Initializing game...');

    // ==================================================
    // SCENE SETUP
    // ==================================================
    diagnostics.log('pending', 'Creating scene...');
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb);
    diagnostics.log('success', 'Scene created');

    // ==================================================
    // CAMERA SETUP
    // ==================================================
    diagnostics.log('pending', 'Setting up camera...');
    const camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    camera.position.set(0, 10, 15);
    camera.lookAt(0, 0, 0);
    diagnostics.log('success', 'Camera configured');

    // ==================================================
    // RENDERER SETUP
    // ==================================================
    diagnostics.log('pending', 'Initializing renderer...');
    const canvas = document.getElementById('game-canvas');
    if (!canvas) {
        throw new Error('Canvas element not found');
    }

    const renderer = new THREE.WebGLRenderer({ 
        canvas: canvas as HTMLCanvasElement,
        antialias: true 
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    diagnostics.log('success', 'Renderer initialized');

    // ==================================================
    // LIGHTING
    // ==================================================
    diagnostics.log('pending', 'Adding lights...');
    
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 10);
    directionalLight.castShadow = true;
    directionalLight.shadow.camera.left = -20;
    directionalLight.shadow.camera.right = 20;
    directionalLight.shadow.camera.top = 20;
    directionalLight.shadow.camera.bottom = -20;
    scene.add(directionalLight);
    
    diagnostics.log('success', 'Lights added');

    // ==================================================
    // GROUND PLANE
    // ==================================================
    diagnostics.log('pending', 'Creating ground...');
    const groundGeometry = new THREE.PlaneGeometry(50, 50);
    const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x3a9d3a });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);
    diagnostics.log('success', 'Ground created');

    // ==================================================
    // ECS SETUP
    // ==================================================
    diagnostics.log('pending', 'Initializing ECS world...');
    const world = new World();
    diagnostics.log('success', 'ECS world created');

    // ==================================================
    // SYSTEM INITIALIZATION
    // ==================================================
    diagnostics.log('pending', 'Registering systems...');
    const selectionSystem = new SelectionSystem(world, scene, camera, renderer);
    const movementSystem = new MovementSystem(world);
    const buildingPlacementSystem = new BuildingPlacementSystem(world, scene, camera, renderer);
    const resourceGatheringSystem = new ResourceGatheringSystem(world);
    const productionSystem = new ProductionSystem(world);
    diagnostics.log('success', 'All systems registered');

    // ==================================================
    // FACTORY SETUP
    // ==================================================
    diagnostics.log('pending', 'Setting up factories...');
    const unitFactory = new UnitFactory(world, scene);
    const resourceFactory = new ResourceFactory(world, scene);
    diagnostics.log('success', 'Factories ready');

    // ==================================================
    // INITIAL GAME OBJECTS
    // ==================================================
    diagnostics.log('pending', 'Creating initial game objects...');
    
    // Create initial units
    const unit1 = unitFactory.createWorker(-5, 0, 'Player');
    const unit2 = unitFactory.createWorker(5, 0, 'Player');
    const unit3 = unitFactory.createWorker(0, -5, 'Player');
    
    // Create resources
    resourceFactory.createGoldMine(10, 10);
    resourceFactory.createGoldMine(-10, 10);
    resourceFactory.createGoldMine(10, -10);
    
    diagnostics.log('success', 'Initial objects created');

    // ==================================================
    // WINDOW RESIZE HANDLER
    // ==================================================
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // ==================================================
    // GAME LOOP
    // ==================================================
    diagnostics.log('pending', 'Starting game loop...');
    
    let lastTime = performance.now();
    let frameCount = 0;
    let fpsUpdateTime = 0;

    function animate() {
        requestAnimationFrame(animate);

        const currentTime = performance.now();
        const deltaTime = (currentTime - lastTime) / 1000;
        lastTime = currentTime;

        // Update systems
        movementSystem.update(deltaTime);
        resourceGatheringSystem.update(deltaTime);
        productionSystem.update(deltaTime);
        selectionSystem.update(deltaTime);
        buildingPlacementSystem.update(deltaTime);

        // Render
        renderer.render(scene, camera);

        // FPS counter
        frameCount++;
        fpsUpdateTime += deltaTime;
        if (fpsUpdateTime >= 0.5) {
            const fps = frameCount / fpsUpdateTime;
            diagnostics.updateFps(fps);
            frameCount = 0;
            fpsUpdateTime = 0;
        }
    }

    animate();
    diagnostics.log('success', 'Game loop running');
    diagnostics.log('success', 'Initialization complete!');
    diagnostics.hide();

} catch (error) {
    diagnostics.log('error', 'Fatal initialization error', error);
    console.error('Game initialization failed:', error);
}