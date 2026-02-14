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

// ============================================
// ON-SCREEN DIAGNOSTIC OVERLAY
// ============================================

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
                icon = '[...]';
                color = '#FFC107';
                break;
        }

        item.innerHTML = `<span style="color: ${color}; font-weight: bold;">${icon}</span> ${message}`;
        
        if (error) {
            const errorDetail = document.createElement('div');
            errorDetail.style.cssText = `
                margin-left: 20px;
                color: #ff8a80;
                font-size: 11px;
                margin-top: 3px;
            `;
            errorDetail.textContent = `${error.message || error}`;
            if (error.stack) {
                const stackTrace = document.createElement('pre');
                stackTrace.style.cssText = `
                    margin: 5px 0 0 0;
                    font-size: 10px;
                    color: #ffab91;
                    max-height: 100px;
                    overflow-y: auto;
                `;
                stackTrace.textContent = error.stack;
                errorDetail.appendChild(stackTrace);
            }
            item.appendChild(errorDetail);
        }

        this.messageList.appendChild(item);
        
        // Log to console as well
        const consoleMsg = `[Diagnostic] ${icon} ${message}`;
        if (status === 'error') {
            console.error(consoleMsg, error);
        } else {
            console.log(consoleMsg);
        }
    }

    updateFPS(fps: number) {
        this.fpsDisplay.textContent = `FPS: ${fps}`;
    }

    checkWebGLSupport(): { supported: boolean; message: string; context?: any } {
        const canvas = document.createElement('canvas');
        let gl: any;
        
        try {
            gl = canvas.getContext('webgl2') || canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        } catch (e) {
            return { supported: false, message: `WebGL error: ${e}` };
        }

        if (!gl) {
            return { 
                supported: false, 
                message: 'WebGL not supported by browser' 
            };
        }

        // Get WebGL info
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        let gpuInfo = 'Unknown GPU';
        if (debugInfo) {
            gpuInfo = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
        }

        return {
            supported: true,
            message: `WebGL supported - GPU: ${gpuInfo}`,
            context: gl
        };
    }

    hide() {
        setTimeout(() => {
            if (!this.hasErrors) {
                this.overlay.style.display = 'none';
            }
        }, 3000);
    }
}

// ============================================
// MAIN GAME INITIALIZATION
// ============================================

const diagnostics = new DiagnosticOverlay();

// Wrap everything in try-catch for global error handling
try {
    diagnostics.log('pending', 'Starting Three.js RTS Game initialization...');

    // Detect mobile device
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    diagnostics.log('success', `Device type: ${isMobile ? 'Mobile' : 'Desktop'}`);

    // Check WebGL support FIRST
    const webglCheck = diagnostics.checkWebGLSupport();
    if (!webglCheck.supported) {
        diagnostics.log('error', 'WebGL not supported', new Error(webglCheck.message));
        throw new Error(webglCheck.message);
    }
    diagnostics.log('success', webglCheck.message);

    // Get canvas element
    const canvas = document.getElementById('game-canvas');
    if (!canvas) {
        diagnostics.log('error', 'Canvas element #game-canvas not found', new Error('Canvas element missing from HTML'));
        throw new Error('Canvas element not found');
    }
    diagnostics.log('success', 'Canvas element found');

    // Create scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb);
    diagnostics.log('success', 'Scene created with sky blue background');

    // Create camera
    const camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    camera.position.set(0, 15, 20);
    camera.lookAt(0, 0, 0);
    diagnostics.log('success', `Camera positioned at (0, 15, 20)`);

    // Create renderer with comprehensive error handling
    let renderer: THREE.WebGLRenderer;
    try {
        renderer = new THREE.WebGLRenderer({ 
            canvas: canvas as HTMLCanvasElement,
            antialias: !isMobile
        });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(isMobile ? 1 : window.devicePixelRatio);
        renderer.shadowMap.enabled = !isMobile;
        if (renderer.shadowMap.enabled) {
            renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        }
        diagnostics.log('success', `Renderer created (${window.innerWidth}x${window.innerHeight})`);
        
        // Verify WebGL context
        const gl = renderer.getContext();
        if (!gl) {
            throw new Error('Failed to get WebGL context from renderer');
        }
        diagnostics.log('success', 'WebGL context verified');
    } catch (error) {
        diagnostics.log('error', 'Failed to create WebGL renderer', error);
        throw error;
    }

    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    diagnostics.log('success', 'Ambient light added');

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 10);
    directionalLight.castShadow = !isMobile;
    if (directionalLight.castShadow) {
        directionalLight.shadow.camera.left = -20;
        directionalLight.shadow.camera.right = 20;
        directionalLight.shadow.camera.top = 20;
        directionalLight.shadow.camera.bottom = -20;
    }
    scene.add(directionalLight);
    diagnostics.log('success', 'Directional light added');

    // Create terrain
    const terrainGeometry = new THREE.PlaneGeometry(50, 50, 10, 10);
    const terrainMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x228b22,
        roughness: 0.8,
        metalness: 0.2
    });
    const terrain = new THREE.Mesh(terrainGeometry, terrainMaterial);
    terrain.rotation.x = -Math.PI / 2;
    terrain.receiveShadow = !isMobile;
    scene.add(terrain);
    diagnostics.log('success', `Terrain added (${scene.children.length} objects in scene)`);

    // Initialize ECS World
    const world = new World();
    diagnostics.log('success', 'ECS World created');

    // Initialize systems
    const selectionSystem = new SelectionSystem(world, scene, camera, canvas as HTMLCanvasElement);
    const movementSystem = new MovementSystem(world);
    const resourceGatheringSystem = new ResourceGatheringSystem(world);
    const buildingPlacementSystem = new BuildingPlacementSystem(world, scene, camera, canvas as HTMLCanvasElement);
    const productionSystem = new ProductionSystem(world);
    diagnostics.log('success', 'All game systems initialized');

    // Add systems to world
    world.addSystem(selectionSystem);
    world.addSystem(movementSystem);
    world.addSystem(resourceGatheringSystem);
    world.addSystem(buildingPlacementSystem);
    world.addSystem(productionSystem);
    diagnostics.log('success', 'Systems added to world');

    // Create units
    const unitFactory = new UnitFactory(world, scene);
    for (let i = 0; i < 3; i++) {
        unitFactory.createUnit(
            'worker',
            new THREE.Vector3(Math.random() * 10 - 5, 0, Math.random() * 10 - 5)
        );
    }
    diagnostics.log('success', '3 worker units created');

    // Create resources
    const resourceFactory = new ResourceFactory(world, scene);
    for (let i = 0; i < 5; i++) {
        resourceFactory.createResource(
            'wood',
            new THREE.Vector3(Math.random() * 20 - 10, 0, Math.random() * 20 - 10)
        );
    }
    diagnostics.log('success', '5 wood resources created');

    // FPS counter
    let lastTime = performance.now();
    let frameCount = 0;
    let fps = 0;

    // Animation loop with error handling
    function animate() {
        try {
            requestAnimationFrame(animate);

            // Calculate FPS
            frameCount++;
            const currentTime = performance.now();
            if (currentTime >= lastTime + 1000) {
                fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
                frameCount = 0;
                lastTime = currentTime;
                diagnostics.updateFPS(fps);
            }

            // Update systems
            world.update(0.016);

            // Render
            renderer.render(scene, camera);
        } catch (error) {
            diagnostics.log('error', 'Error in animation loop', error);
            throw error;
        }
    }

    // Handle window resize
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        diagnostics.log('success', `Window resized: ${window.innerWidth}x${window.innerHeight}`);
    });

    // Mobile touch controls
    if (isMobile) {
        diagnostics.log('pending', 'Setting up mobile touch controls...');
        
        let touchStartTime = 0;
        let touchStartPos = { x: 0, y: 0 };
        const LONG_PRESS_DURATION = 500;
        
        canvas.addEventListener('touchstart', (event) => {
            event.preventDefault();
            touchStartTime = Date.now();
            const touch = event.touches[0];
            touchStartPos = { x: touch.clientX, y: touch.clientY };
        });
        
        canvas.addEventListener('touchend', (event) => {
            event.preventDefault();
            const touchDuration = Date.now() - touchStartTime;
            const touch = event.changedTouches[0];
            const touchEndPos = { x: touch.clientX, y: touch.clientY };
            
            const distance = Math.sqrt(
                Math.pow(touchEndPos.x - touchStartPos.x, 2) + 
                Math.pow(touchEndPos.y - touchStartPos.y, 2)
            );
            
            if (distance < 10) {
                if (touchDuration < LONG_PRESS_DURATION) {
                    const mouseEvent = new MouseEvent('click', {
                        clientX: touch.clientX,
                        clientY: touch.clientY
                    });
                    canvas.dispatchEvent(mouseEvent);
                } else {
                    const mouseEvent = new MouseEvent('contextmenu', {
                        clientX: touch.clientX,
                        clientY: touch.clientY
                    });
                    canvas.dispatchEvent(mouseEvent);
                }
            }
        });
        
        diagnostics.log('success', 'Mobile touch controls configured');
    }

    // Start animation loop
    diagnostics.log('pending', 'Starting animation loop...');
    animate();
    diagnostics.log('success', 'Game initialization complete! Animation loop running.');
    
    // Hide diagnostics after 3 seconds if no errors
    diagnostics.hide();

} catch (error) {
    diagnostics.log('error', 'FATAL: Game initialization failed', error);
    console.error('[Game Init] Fatal error:', error);
}
