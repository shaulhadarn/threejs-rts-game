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
camera.position.set(0, 15, 20);
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

// Game resources
const gameResources = { gold: 100, wood: 50 };

// Initialize ECS World
const world = new World();

// Create factories
const unitFactory = new UnitFactory(world, scene);
const resourceFactory = new ResourceFactory(world, scene);

// Create and register systems
const selectionSystem = new SelectionSystem(world, scene, camera, renderer);
const movementSystem = new MovementSystem(world, scene, camera, renderer);
const gatheringSystem = new ResourceGatheringSystem(world, scene, gameResources);
const buildingSystem = new BuildingPlacementSystem(world, scene, camera, renderer, gameResources);
const productionSystem = new ProductionSystem(world, scene, gameResources, unitFactory);

// Connect the systems (movement system needs to know what's selected)
movementSystem.setSelectionSystem(selectionSystem);

// Register systems with the SystemManager
world.getSystemManager().register(selectionSystem);
world.getSystemManager().register(movementSystem);
world.getSystemManager().register(gatheringSystem);
world.getSystemManager().register(buildingSystem);
world.getSystemManager().register(productionSystem);

// Create test units at different positions with gathering ability
const unit1 = unitFactory.createUnit(-5, 0.5, -5);
unit1.addComponent(new GatheringComponent(10, 10));

const unit2 = unitFactory.createUnit(0, 0.5, 0);
unit2.addComponent(new GatheringComponent(10, 10));

const unit3 = unitFactory.createUnit(5, 0.5, 5);
unit3.addComponent(new GatheringComponent(10, 10));

console.log('Created 3 test units with gathering abilities');

// Create resource nodes
resourceFactory.createGoldMine(-10, 1, -10);
resourceFactory.createGoldMine(10, 1, -10);
resourceFactory.createTree(-10, 0, 10);
resourceFactory.createTree(10, 0, 10);
resourceFactory.createTree(0, 0, 15);

console.log('Created resource nodes');

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Animation loop
let lastTime = performance.now();

function animate() {
    requestAnimationFrame(animate);
    
    const currentTime = performance.now();
    const deltaTime = (currentTime - lastTime) / 1000; // Convert to seconds
    lastTime = currentTime;
    
    // Update all systems
    world.update(deltaTime);
    
    // Render
    renderer.render(scene, camera);
}

// Start the game
console.log('Starting Three.js RTS Game...');
animate();