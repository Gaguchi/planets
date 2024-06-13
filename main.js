import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import './style.css'; // Assuming you want to keep the styles

// Setup the scene, camera, and renderer
const scene = new THREE.Scene();
let camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.domElement.style.position = 'fixed'; // Set the canvas to have a fixed position
renderer.domElement.style.top = '0px'; // Set the canvas to be at the top of the viewport
renderer.domElement.style.zIndex = '-1'; // Set the canvas to be behind the content
document.body.appendChild(renderer.domElement);

// Add a Directional Light for diagnostic purposes
// const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
// directionalLight.position.set(0, -1, 0);
// scene.add(directionalLight);


// Add Axes Helper
const axesHelper = new THREE.AxesHelper(5);
scene.add(axesHelper);

// Add Grid Helper
const gridHelper = new THREE.GridHelper(10, 10);
scene.add(gridHelper);

// Declare variables for the animation mixers
let mixer;
let sphereMixer; // Separate mixer for the sphere animation

// Load the GLTF model
const loader = new GLTFLoader();
loader.load('models/planets.glb', function (gltf) {
    scene.add(gltf.scene);

    // Search for the camera in the loaded model
    gltf.scene.traverse(function (object) {
        if (object.isCamera) {
            camera = object;
        }
    });

// Initialize the mixers if there are animations
if (gltf.animations && gltf.animations.length) {
    mixer = new THREE.AnimationMixer(scene);
    sphereMixer = new THREE.AnimationMixer(scene);
    // List of animation names for sphereMixer
    const sphereAnimations = ['Sphere.001Action', 'ship_animation_01', 'signAnimation'];
    gltf.animations.forEach((clip) => {
        if (clip.tracks.some(track => track.name.includes('Camera'))) {
            const action = mixer.clipAction(clip);
            action.play();
        } else if (sphereAnimations.includes(clip.name)) {
            const action = sphereMixer.clipAction(clip);
            action.play();
        }
    });
}

    animate();
}, undefined, function (error) {
    console.error(error);
});

// Main animation clock
const clock = new THREE.Clock();
let targetAnimationTime = 0;
let currentAnimationTime = 0;

// Separate clock for the sphere animation
const sphereClock = new THREE.Clock(true); // Automatically starts the clock

// Handle scroll to move animation forwards or backwards
document.addEventListener('wheel', (event) => {
    if (!mixer) return;
    const delta = event.deltaY * 0.001;
    targetAnimationTime += delta;
});

function animate() {
    requestAnimationFrame(animate);

    const delta = clock.getDelta(); // Get the delta time for the main animations

    if (mixer) {
        currentAnimationTime += (targetAnimationTime - currentAnimationTime) * 0.05;
        mixer.setTime(currentAnimationTime);
    }

    if (sphereMixer) {
      // Define a fixed update rate for the sphere animation
      const fixedUpdateRate = 0.0005; // Adjust this value to control the speed of the sphere animation

      // Update the sphere mixer with the fixed update rate for a constant speed animation
      sphereMixer.update(fixedUpdateRate);
    }

    renderer.render(scene, camera);
}

animate();

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Initialize touch position tracking
let lastTouchY = 0;
let isTouching = false;

// Add touch event listeners
document.addEventListener('touchstart', function(e) {
    lastTouchY = e.touches[0].clientY;
    isTouching = true;
}, false);

document.addEventListener('touchmove', function(e) {
    if (!isTouching || !mixer) return;
    const currentTouchY = e.touches[0].clientY;
    const touchDeltaY = lastTouchY - currentTouchY;
    const scrollDelta = touchDeltaY * 0.0015; // Adjust scaling factor as needed
    targetAnimationTime += scrollDelta;
    lastTouchY = currentTouchY; // Update the last touch position
    e.preventDefault(); // Prevent the default scroll behavior for a smoother animation
}, { passive: false });

document.addEventListener('touchend', function() {
    isTouching = false;
}, false);

// Debounce function for resize events
function debounce(func, timeout = 300) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => { func.apply(this, args); }, timeout);
    };
}


// Modify the createStars function to immediately add stars to the scene
function createStars(numberOfStars = 10000, sizeVariation = 0.7) {
    const starsGeometry = new THREE.BufferGeometry();
    const starsVertices = [];

    for (let i = 0; i < numberOfStars; i++) {
        const x = THREE.MathUtils.randFloatSpread(2000); // spread in x
        const y = THREE.MathUtils.randFloatSpread(2000); // spread in y
        const z = THREE.MathUtils.randFloatSpread(2000); // spread in z

        starsVertices.push(x, y, z);
    }

    starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3));
    const starsMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: sizeVariation });
    const stars = new THREE.Points(starsGeometry, starsMaterial);
    stars.name = 'stars'; // Assign a name for easy identification

    return stars;
}

// Initial creation of stars
const initialStars = createStars(20000, 1.0); // Adjust number and size as needed
scene.add(initialStars);


// Enhanced resize event handling
// Enhanced resize event handling with proper star update
window.addEventListener('resize', debounce(() => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);

    // Ensure stars are correctly displayed after resize
    // Check if stars already exist in the scene and remove them
    let existingStars = scene.getObjectByName('stars');
    if (existingStars) {
        scene.remove(existingStars);
    }

    // Recreate stars to ensure they are correctly displayed after resize
    // Adjust the number of stars and size as needed for better visibility
    const stars = createStars(1000000, 1.0); // Example: Increase number of stars
    stars.name = 'stars'; // Assign a name for easy identification
    scene.add(stars);
}, 250)); // Adjust debounce timeout as needed


setTimeout(() => {
    window.dispatchEvent(new Event('resize'));
}, 100); // Adjust the timeout as needed

