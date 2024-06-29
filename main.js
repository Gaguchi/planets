import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'; // Import OrbitControls
import './style.css';

// Add an element to the HTML to display the FPS
document.body.innerHTML += '<div id="fps" style="position: absolute; top: 10px; left: 10px; color: white;"></div>';

const scene = new THREE.Scene();
let camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.domElement.style.position = 'fixed';
renderer.domElement.style.top = '0px';
renderer.domElement.style.zIndex = '-1';
document.body.appendChild(renderer.domElement);
let cameraAction;
let assetsLoaded = false;
let windowResized = false;


const controls = new OrbitControls(camera, renderer.domElement); // Create OrbitControls instance
controls.enabled = false; // Disable controls initially

const axesHelper = new THREE.AxesHelper(5);
scene.add(axesHelper);

const gridHelper = new THREE.GridHelper(10, 10);
scene.add(gridHelper);

let mixer;
let sphereMixer;

const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('/node_modules/three/examples/jsm/libs/draco/');
const loader = new GLTFLoader();
loader.setDRACOLoader(dracoLoader);

// FPS Tracker
let fps = 0, frames = 0, lastTime = performance.now();

// Framerate limiter
let lastRenderTime = performance.now();
const maxFPS = 120; // Define your maximum FPS here
const minDeltaTime = 1000 / maxFPS; // Minimum time interval between frames

loader.load('models/planets.glb', function (gltf) {
    scene.add(gltf.scene);
    console.log(scene.children);

    gltf.scene.traverse(function (object) {
        if (object.isCamera) {
            camera = object;
        }
    });

    if (gltf.animations && gltf.animations.length) {
        mixer = new THREE.AnimationMixer(scene);
        sphereMixer = new THREE.AnimationMixer(scene);
        const sphereAnimations = [
            { name: 'planet_spin_1', speed: 6 },
            { name: 'planet_spin_2', speed: 6 },
            { name: 'planet_spin_3', speed: 6 },
            { name: 'planet_spin_4', speed: 6 },
            { name: 'ship_animation_01', speed: 6 },
            { name: 'signAnimation', speed: 4 },
            { name: 'RnMAction', speed: 8 }
        ];
        gltf.animations.forEach((clip) => {
            if (clip.name === 'CameraAction') {
                cameraAction = mixer.clipAction(clip);
                cameraAction.play();
            } else {
                const animation = sphereAnimations.find(a => a.name === clip.name);
                if (animation) {
                    const action = sphereMixer.clipAction(clip);
                    action.setEffectiveTimeScale(animation.speed);
                    action.play();
                }
            }
        });

        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();

        let mainCamera, planet1Camera;

        gltf.scene.traverse(function (object) {
            if (object.isCamera) {
                if (object.name === 'main_camera') {
                    mainCamera = object;
                    camera = mainCamera;
                } else if (object.name === 'camera_planet_1') {
                    planet1Camera = object;
                }
            } else if (object.name === 'Icosphere008_3') { // Check if the object is the planet
                planet1 = object; // Assign the planet object to the planet1 variable
            }
        });

    }

    animate();
    assetsLoaded = true;
    checkPreloader();
}, undefined, function (error) {
    console.error(error);
});

const clock = new THREE.Clock();
let targetAnimationTime = 0;
let currentAnimationTime = 0;

const sphereClock = new THREE.Clock(true);

document.addEventListener('wheel', (event) => {
    if (!cameraAction) return;
    const delta = event.deltaY * 0.001;
    targetAnimationTime += delta;
    cameraAction.time = targetAnimationTime;
});

function animate() {
    requestAnimationFrame(animate);

    const currentTime = performance.now();
    const deltaTime = currentTime - lastRenderTime;


    if (deltaTime >= minDeltaTime) {
        const delta = clock.getDelta();

        if (mixer) {
            currentAnimationTime += (targetAnimationTime - currentAnimationTime) * 0.05;
            mixer.setTime(currentAnimationTime);
        }

        if (sphereMixer) {
            const fixedUpdateRate = 0.0005;
            sphereMixer.update(fixedUpdateRate);
        }

        controls.update(); // Update controls

        renderer.render(scene, camera);

        // FPS Tracker
        frames++;
        const currentTime = performance.now();
        if (currentTime > lastTime + 1000) {
            fps = frames;
            frames = 0;
            lastTime = currentTime;
        }
        const fpsElement = document.getElementById('fps');
        if (fpsElement) {
            fpsElement.innerText = `FPS: ${fps}`;
        }

        lastRenderTime = currentTime; // Update the timestamp of the last rendered frame
    }
}

animate();

// Step 1: Wrap the frustum check code into a function
export const checkPlanetInView = () => {
    const frustum = new THREE.Frustum();
    const cameraViewProjectionMatrix = new THREE.Matrix4();

    // Combine the camera's view matrix and projection matrix
    cameraViewProjectionMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    frustum.setFromProjectionMatrix(cameraViewProjectionMatrix);

    // Assuming planet_3 is the variable holding your group
    const planet_3 = scene.getObjectByName('planet_3');

    if (planet_3) {
        // Create an AABB for planet_3 and check for intersection with the frustum
        const box = new THREE.Box3().setFromObject(planet_3);

        if (frustum.intersectsBox(box)) {
            console.log("planet 3 is on the screen");
        } else {
            console.log("planet 3 is not on the screen");
        }
    } else {
        console.log("planet_3 is undefined");
    }
}
// Step 2: Add an event listener for the scroll event
window.addEventListener('scroll', checkPlanetInView);

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

let lastTouchY = 0;
let isTouching = false;

document.addEventListener('touchstart', function(e) {
    lastTouchY = e.touches[0].clientY;
    isTouching = true;
}, false);

document.addEventListener('touchmove', function(e) {
    if (!isTouching || !mixer) return;
    const currentTouchY = e.touches[0].clientY;
    const touchDeltaY = lastTouchY - currentTouchY;
    const scrollDelta = touchDeltaY * 0.0015;
    targetAnimationTime += scrollDelta;
    lastTouchY = currentTouchY;
    e.preventDefault();
}, { passive: false })

document.addEventListener('touchend', function() {
    isTouching = false;
}, false);

function debounce(func, timeout = 300) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => { func.apply(this, args); }, timeout);
    };
}

function createStars(numberOfStars = 10000, sizeVariation = 0.7) {
    const starsGeometry = new THREE.BufferGeometry();
    const starsVertices = [];

    for (let i = 0; i < numberOfStars; i++) {
        const x = THREE.MathUtils.randFloatSpread(2000);
        const y = THREE.MathUtils.randFloatSpread(2000);
        const z = THREE.MathUtils.randFloatSpread(2000);

        starsVertices.push(x, y, z);
    }

    starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3));
    const starsMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: sizeVariation });
    const stars = new THREE.Points(starsGeometry, starsMaterial);
    stars.name = 'stars';

    return stars;
}

const initialStars = createStars(20000, 1.0);
scene.add(initialStars);

window.addEventListener('resize orientationchange', debounce(() => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);

    let existingStars = scene.getObjectByName('stars');
    if (existingStars) {
        scene.remove(existingStars);
    }

    const stars = createStars(1000000, 1.0);
    stars.name = 'stars';
    scene.add(stars);
    windowResized = true;
    checkPreloader();
}, 250));

function checkPreloader() {
    if (assetsLoaded && windowResized) {
        const preloader = document.getElementById('preloader');
        if (preloader) {
            preloader.style.display = 'none';
        }
    }

    // Dispatch a resize event manually only if assets have loaded and window hasn't been resized yet
    if (assetsLoaded && !windowResized) {
        window.dispatchEvent(new Event('resize'));
        windowResized = true; // Set windowResized to true to prevent further resize events
        const preloader = document.getElementById('preloader');
        if (preloader) {
            preloader.style.opacity = 0;
            setTimeout(() => {
                preloader.style.display = 'none';
            }, 500); // Delay the removal to allow for the opacity transition
        }
    }
}

setTimeout(() => {
    window.dispatchEvent(new Event('orientationchange'));
}, 100);