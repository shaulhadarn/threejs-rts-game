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

// Add console logging for debugging
console.log('[Game Init] Starting Three.js RTS Game initialization...');

// Detect mobile device
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
console.log('[Game Init] Device type:', isMobile ? 'Mobile' : 'Desktop');

// Get canvas element
const canvas = document.getElementById('game-canvas');
if (!canvas) {
    console.error('[Game Init] FATAL: Canvas element #game-canvas not found!');
    throw new Error('Canvas element not found');
}
console.log('[Game Init] Canvas element found');

// Create scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb); // Sky blue
console.log('[Game Init] Scene created with sky blue background');

// Create camera
const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);
camera.position.set(0, 15, 20);
camera.lookAt(0, 0, 0);
console.log('[Game Init] Camera created at position:', camera.position);

// Create renderer with error handling
let renderer: THREE.WebGLRenderer;
try {
    renderer = new THREE.WebGLRenderer({ 
        canvas: canvas as HTMLCanvasElement,
        antialias: !isMobile // Disable antialiasing on mobile for performance
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(isMobile ? 1 : window.devicePixelRatio); // Limit pixel ratio on mobile
    renderer.shadowMap.enabled = !isMobile; // Disable shadows on mobile for performance
    if (renderer.shadowMap.enabled) {
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }
    console.log('[Game Init] WebGL Renderer created successfully');
    console.log('[Game Init] Renderer size:', window.innerWidth, 'x', window.innerHeight);
    console.log('[Game Init] WebGL context:', renderer.getContext());
} catch (error) {
    console.error('[Game Init] FATAL: Failed to create WebGL renderer:', error);
    throw error;
}

// Add lights
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);
console.log('[Game Init] Ambient light added');

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(10, 20, 10);
directionalLight.castShadow = !isMobile; // Disable shadows on mobile
if (directionalLight.castShadow) {
    directionalLight.shadow.camera.left = -50;
    directionalLight.shadow.camera.right = 50;
    directionalLight.shadow.camera.top = 50;
    directionalLight.shadow.camera.bottom = -50;
    directionalLight.shadow.mapSize.width = isMobile ? 512 : 2048; // Lower quality on mobile
    directionalLight.shadow.mapSize.height = isMobile ? 512 : 2048;
}
scene.add(directionalLight);
console.log('[Game Init] Directional light added');

// Create ground/terrain
const groundGeometry = new THREE.PlaneGeometry(100, 100);
const groundMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x3a7d44,
    roughness: 0.8,
    metalness: 0.2
});
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = !isMobile;
ground.userData.isGround = true; // Mark as ground for raycasting
scene.add(ground);
console.log('[Game Init] Ground terrain added to scene');

// Add grid helper for better spatial reference
const gridHelper = new THREE.GridHelper(100, 50, 0x000000, 0x000000);
gridHelper.material.opacity = 0.2;
(gridHelper.material as THREE.Material).transparent = true;
scene.add(gridHelper);
console.log('[Game Init] Grid helper added');

// Game resources
const gameResources = { gold: 100, wood: 50 };

// Initialize ECS World
let world: World;
try {
    world = new World();
    console.log('[Game Init] ECS World initialized');
} catch (error) {
    console.error('[Game Init] FATAL: Failed to initialize ECS World:', error);
    throw error;
}

// Create factories
let unitFactory: UnitFactory;
let resourceFactory: ResourceFactory;
try {
    unitFactory = new UnitFactory(world, scene);
    resourceFactory = new ResourceFactory(world, scene);
    console.log('[Game Init] Factories created');
} catch (error) {
    console.error('[Game Init] FATAL: Failed to create factories:', error);
    throw error;
}

// Create and register systems
try {
    const selectionSystem = new SelectionSystem(world, scene, camera, renderer);
    const movementSystem = new MovementSystem(world, scene, camera, renderer);
    const gatheringSystem = new ResourceGatheringSystem(world, scene, camera, renderer);
    const buildingSystem = new BuildingPlacementSystem(world, scene, camera, renderer);
    const productionSystem = new ProductionSystem(world, scene, camera, renderer);

    world.registerSystem(selectionSystem);
    world.registerSystem(movementSystem);
    world.registerSystem(gatheringSystem);
    world.registerSystem(buildingSystem);
    world.registerSystem(productionSystem);
    console.log('[Game Init] All systems registered');
} catch (error) {
    console.error('[Game Init] FATAL: Failed to create/register systems:', error);
    throw error;
}

// Spawn initial units
try {
    for (let i = 0; i < 5; i++) {
        const x = (Math.random() - 0.5) * 20;
        const z = (Math.random() - 0.5) * 20;
        unitFactory.createUnit(x, 0, z, 'worker');
    }
    console.log('[Game Init] 5 worker units spawned');
} catch (error) {
    console.error('[Game Init] ERROR: Failed to spawn units:', error);
}

// Spawn initial resources
try {
    for (let i = 0; i < 10; i++) {
        const x = (Math.random() - 0.5) * 40;
        const z = (Math.random() - 0.5) * 40;
        const resourceType = Math.random() > 0.5 ? 'gold' : 'wood';
        resourceFactory.createResource(x, 0, z, resourceType, 100);
    }
    console.log('[Game Init] 10 resources spawned');
} catch (error) {
    console.error('[Game Init] ERROR: Failed to spawn resources:', error);
}

// UI Elements
const goldDisplay = document.getElementById('gold-amount');
const woodDisplay = document.getElementById('wood-amount');

if (!goldDisplay || !woodDisplay) {
    console.error('[Game Init] WARNING: Resource display elements not found');
}

// Update resource display
function updateResourceDisplay() {
    if (goldDisplay) goldDisplay.textContent = gameResources.gold.toString();
    if (woodDisplay) woodDisplay.textContent = gameResources.wood.toString();
}

// Game time tracking
let gameTime = 0;

// Window resize handler
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    console.log('[Game] Window resized to:', window.innerWidth, 'x', window.innerHeight);
});

// Mobile touch controls
if (isMobile) {
    console.log('[Game Init] Setting up mobile touch controls');
    let touchStartTime = 0;
    let touchStartPos = { x: 0, y: 0 };
    
    canvas.addEventListener('touchstart', (event) => {
        touchStartTime = Date.now();
        const touch = event.touches[0];
        touchStartPos = { x: touch.clientX, y: touch.clientY };
    });
    
    canvas.addEventListener('touchend', (event) => {
        const touchDuration = Date.now() - touchStartTime;
        const touch = event.changedTouches[0];
        const moveDistance = Math.sqrt(
            Math.pow(touch.clientX - touchStartPos.x, 2) + 
            Math.pow(touch.clientY - touchStartPos.y, 2)
        );
        
        // Tap (short touch with minimal movement) = left click
        if (touchDuration < 300 && moveDistance < 10) {
            const mouseEvent = new MouseEvent('click', {
                clientX: touch.clientX,
                clientY: touch.clientY,
                bubbles: true
            });
            canvas.dispatchEvent(mouseEvent);
        }
        // Long press = right click (move command)
        else if (touchDuration >= 300 && moveDistance < 10) {
            const mouseEvent = new MouseEvent('contextmenu', {
                clientX: touch.clientX,
                clientY: touch.clientY,
                bubbles: true
            });
            canvas.dispatchEvent(mouseEvent);
        }
    });
    
    console.log('[Game Init] Mobile touch controls configured');
}

// Game loop
let lastTime = performance.now();
let frameCount = 0;
let fpsCheckTime = performance.now();

function animate(currentTime: number) {
    requestAnimationFrame(animate);
    
    try {
        const deltaTime = (currentTime - lastTime) / 1000;
        lastTime = currentTime;
        
        // Update game time
        gameTime += deltaTime;
        
        // FPS logging (every 5 seconds)
        frameCount++;
        if (currentTime - fpsCheckTime > 5000) {
            const fps = frameCount / 5;
            console.log('[Game] Average FPS:', fps.toFixed(1));
            frameCount = 0;
            fpsCheckTime = currentTime;
        }
        
        // Update all systems
        world.update(deltaTime);
        
        // Process gathering events and update resources
        const entities = world.getEntities();
        entities.forEach(entity => {
            const gathering = entity.getComponent(GatheringComponent);
            if (gathering && gathering.lastGatherTime) {
                const timeSinceGather = gameTime - gathering.lastGatherTime;
                if (timeSinceGather >= gathering.gatherInterval) {
                    if (gathering.resourceType === 'gold') {
                        gameResources.gold += gathering.gatherAmount;
                    } else if (gathering.resourceType === 'wood') {
                        gameResources.wood += gathering.gatherAmount;
                    }
                    gathering.lastGatherTime = gameTime;
                    updateResourceDisplay();
                }
            }
        });
        
        // Render the scene
        renderer.render(scene, camera);
    } catch (error) {
        console.error('[Game Loop] ERROR during animation frame:', error);
    }
}

// Initialize and start game
console.log('[Game Init] Starting game loop...');
try {
    updateResourceDisplay();
    animate(performance.now());
    console.log('[Game Init] ✓ Game initialized successfully! Rendering should be visible now.');
} catch (error) {
    console.error('[Game Init] FATAL: Failed to start game loop:', error);
    throw error;
}