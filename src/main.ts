import * as THREE from 'three';
import { World } from './ecs/World';
import { SelectionSystem } from './systems/SelectionSystem';
import { MovementSystem } from './systems/MovementSystem';
import { UnitFactory } from './factories/UnitFactory';

// Get canvas element
const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;

// Create scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb); // Sky blue

// Create camera
const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);
camera.position.set(0, 10, 15);
camera.lookAt(0, 0, 0);

// Create renderer
const renderer = new THREE.WebGLRenderer({ 
    canvas,
    antialias: true 
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// Add lights
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(10, 20, 10);
directionalLight.castShadow = true;
directionalLight.shadow.camera.left = -50;
directionalLight.shadow.camera.right = 50;
directionalLight.shadow.camera.top = 50;
directionalLight.shadow.camera.bottom = -50;
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
scene.add(directionalLight);

// Create ground/terrain
const groundGeometry = new THREE.PlaneGeometry(100, 100);
const groundMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x3a7d44,
    roughness: 0.8,
    metalness: 0.2
});
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
ground.userData.isGround = true; // Mark as ground for raycasting
scene.add(ground);

// Add grid helper for better spatial reference
const gridHelper = new THREE.GridHelper(100, 50, 0x000000, 0x000000);
gridHelper.material.opacity = 0.2;
gridHelper.material.transparent = true;
scene.add(gridHelper);

// Initialize ECS World
const world = new World();

// Create and register systems
const selectionSystem = new SelectionSystem(world, scene, camera, renderer);
const movementSystem = new MovementSystem(world, scene, camera, renderer);

// Connect the systems (movement system needs to know what's selected)
movementSystem.setSelectionSystem(selectionSystem);

world.addSystem(selectionSystem);
world.addSystem(movementSystem);

// Create unit factory
const unitFactory = new UnitFactory(world, scene);

// Create test units at different positions
unitFactory.createUnit(-5, 0.5, -5);
unitFactory.createUnit(0, 0.5, 0);
unitFactory.createUnit(5, 0.5, 5);

console.log('Created 3 test units');

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Animation loop with ECS updates
let lastTime = performance.now();

function animate() {
    requestAnimationFrame(animate);
    
    // Calculate delta time
    const currentTime = performance.now();
    const deltaTime = (currentTime - lastTime) / 1000; // Convert to seconds
    lastTime = currentTime;
    
    // Update ECS world
    world.update(deltaTime);
    
    // Render scene
    renderer.render(scene, camera);
}

// Start animation
animate();

console.log('Three.js RTS Game initialized with ECS and unit selection/movement!');
