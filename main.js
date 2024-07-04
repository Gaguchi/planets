import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import './style.css';

document.body.innerHTML += '<div id="fps" style="position: absolute; top: 10px; left: 10px; color: white;"></div>';

const scene = new THREE.Scene();
let camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.domElement.style.cssText = 'position:fixed; top:0px; z-index:-1;';
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enabled = false;

// scene.add(new THREE.AxesHelper(5));
// scene.add(new THREE.GridHelper(10, 10));

const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('/node_modules/three/examples/jsm/libs/draco/');
const loader = new GLTFLoader();
loader.setDRACOLoader(dracoLoader);

let mixer,sphereMixer, cameraAction, planet1, assetsLoaded = false, windowResized = false;

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let lastRenderTime = 0;
let isTouching = false;
// Remove the duplicate declaration of 'lastTouchY'

// Remove the duplicate declaration of 'isDragging'
let previousMousePosition = { x: 0, y: 0 };

loader.load('models/planets.glb', function (gltf) {
    scene.add(gltf.scene);

    gltf.scene.traverse(object => {
        if (object.isCamera) camera = object;
        if (object.name === 'planet_1') planet1 = object;
    });

    if (gltf.animations && gltf.animations.length) {
        mixer = new THREE.AnimationMixer(scene);
        sphereMixer = new THREE.AnimationMixer(scene);
        const sphereAnimations = [
            //{ name: 'planet_spin_1', speed: 3 },
            //{ name: 'planet_spin_2', speed: 3 },
            //{ name: 'planet_spin_3', speed: 3 },
            //{ name: 'planet_spin_4', speed: 3 },
            { name: 'ship_animation_01', speed: 10 },
            { name: 'signAnimation', speed: 10 },
            { name: 'RnMAction', speed: 12 }
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
    }

    renderer.domElement.addEventListener('mousedown', onMouseDown);
    renderer.domElement.addEventListener('mousemove', onMouseMove);
    renderer.domElement.addEventListener('mouseup', onMouseUp);

    animate();
    assetsLoaded = true;
    checkPreloader();
}, undefined, console.error);

const clock = new THREE.Clock();
let targetAnimationTime = 0, currentAnimationTime = 0, fps = 0, frames = 0, lastTime = performance.now();
let isDragging = false;
let lastTouchY = 0;

document.addEventListener('wheel', event => {
    if (cameraAction && !isDragging) {
        targetAnimationTime += event.deltaY * 0.001;
        cameraAction.time = targetAnimationTime;
    }
});

document.addEventListener('touchstart', event => {
    const touch = event.touches[0];
    lastTouchY = touch.clientY;

    // Calculate normalized device coordinates
    mouse.x = (touch.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(touch.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children, true);

    if (intersects.length > 0) {
        const touchedObject = intersects[0].object;
        console.log('Touch started at:', touch.clientX, touch.clientY);
        console.log('Touched object:', touchedObject.name || touchedObject.id);
        console.log('Planet rotation:', planet1.rotation.x, planet1.rotation.y, planet1.rotation.z);
        
        // Find the parent group of the touched object
        let parentGroup = touchedObject.parent;
        while (parentGroup && !(parentGroup instanceof THREE.Group)) {
            parentGroup = parentGroup.parent;
        }

        if (parentGroup) {
            // Check if the parent group or its ancestors match 'planet_1'
            let isPlanet1 = false;
            let currentParent = parentGroup;
            while (currentParent) {
                if (currentParent.name === 'planet_1') {
                    isPlanet1 = true;
                    break;
                }
                currentParent = currentParent.parent;
            }

            if (isPlanet1) {
                isDragging = true;
                console.log(`isDragging: ${isDragging}`);
            } else {
                // Handle camera action for other objects or groups
                console.log('Camera action triggered for other object or group');
                targetAnimationTime += touch.clientY * 0.001;
                if (cameraAction) {
                    cameraAction.time = targetAnimationTime;
                }
            }
        }
    }
});



document.addEventListener('touchmove', event => {
    if (!isDragging) {
        const deltaY = event.touches[0].clientY - lastTouchY;
        lastTouchY = event.touches[0].clientY;

        // Adjust the targetAnimationTime based on deltaY and scroll direction
        targetAnimationTime -= deltaY * 0.001;
        if (cameraAction) {
            cameraAction.time = targetAnimationTime;
        }

    }
}, { passive: true });


document.addEventListener('touchend', () => {
    console.log('Touch ended');

    // Final touch position
    const finalTouchPositionX = mouse.x;
    const finalTouchPositionY = mouse.y;
    console.log(`Final touch position: ${finalTouchPositionX} ${finalTouchPositionY}`);

    // Final planet rotation quaternion
    const finalQuaternion = planet1.quaternion.toArray().map(value => value.toFixed(6)).join(' ');
    console.log(`Final planet rotation: ${finalQuaternion}`);
});




// const raycaster = new THREE.Raycaster();
// const mouse = new THREE.Vector2();

document.addEventListener('click', event => {
    // Calculate mouse position in normalized device coordinates (-1 to +1) for both components
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Update the raycaster with the camera and mouse position
    raycaster.setFromCamera(mouse, camera);

    // Calculate objects intersecting the ray
    const intersects = raycaster.intersectObjects(scene.children, true);

    if (intersects.length > 0) {
        // Log the name or id of the first intersected object
        console.log('Clicked on:', intersects[0].object.name || intersects[0].object.id);
        
        lastRenderTime = performance.now(); // Update lastRenderTime
    }
});

function animate() {
    requestAnimationFrame(animate);
    const deltaTime = performance.now() - lastRenderTime;
    if (deltaTime >= 1000 / 60) {
        const delta = clock.getDelta();
        if (mixer) mixer.setTime(currentAnimationTime += (targetAnimationTime - currentAnimationTime) * 0.05);
        if (planet1 && !isDragging) planet1.rotation.x += 0.01; // Rotate planet_1 around X-axis
        controls.update();
        renderer.render(scene, camera);
        frames++;
        if (sphereMixer) {
            const fixedUpdateRate = 0.0005;
            sphereMixer.update(fixedUpdateRate);
        }
        if (performance.now() > lastTime + 1000) {
            fps = frames;
            frames = 0;
            lastTime = performance.now();
        }
        document.getElementById('fps').innerText = `FPS: ${fps}`;
        lastRenderTime = performance.now();
    }
}
animate();

export const checkPlanetInView = () => {
    const frustum = new THREE.Frustum();
    const cameraViewProjectionMatrix = new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    frustum.setFromProjectionMatrix(cameraViewProjectionMatrix);
    const planet3 = scene.getObjectByName('planet_3');
    if (planet3) {
        const box = new THREE.Box3().setFromObject(planet3);
        console.log(frustum.intersectsBox(box) ? "planet 3 is on the screen" : "planet 3 is not on the screen");
    } else {
        console.log("planet_3 is undefined");
    }
}
window.addEventListener('scroll', checkPlanetInView);

window.addEventListener('resize', onResize);
window.addEventListener('resize orientationchange', debounce(() => {
    onResize();
    updateStars();
    windowResized = true;
    checkPreloader();
}, 250));

document.addEventListener('touchstart', onTouchStart, false);
document.addEventListener('touchmove', onTouchMove, { passive: false });
document.addEventListener('touchend', () => { isTouching = false; isDragging = false; }, false);

setTimeout(() => { window.dispatchEvent(new Event('orientationchange')); }, 100);

function onMouseDown(event) {
    updateMouse(event);
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(planet1);
    if (intersects.length > 0) {
        console.log('Clicked on planet_1');
        isDragging = true;
        previousMousePosition.x = event.clientX;
        previousMousePosition.y = event.clientY;
    }
}

function onMouseMove(event) {
    if (isDragging) {
        const deltaMove = {
            x: (event.clientX - previousMousePosition.x) * -1,
            y: (event.clientY - previousMousePosition.y) * -1
        };

        const deltaRotationQuaternion = new THREE.Quaternion()
            .setFromEuler(new THREE.Euler(
                deltaMove.y * 0.005, // Rotate along X-axis
                deltaMove.x * 0.005, // Rotate along Y-axis
                0,
                'XYZ'
            ));

        planet1.quaternion.multiplyQuaternions(deltaRotationQuaternion, planet1.quaternion);

        previousMousePosition.x = event.clientX;
        previousMousePosition.y = event.clientY;

        lastRenderTime = performance.now(); // Update lastRenderTime
    }
}

function onMouseUp() {
    isDragging = false;
}

function onTouchStart(e) {
    if (e.touches.length === 1) {
        updateMouse(e.touches[0]);
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObject(planet1);
        if (intersects.length > 0) {
            console.log('Touched planet_1');
            isDragging = true;
            previousMousePosition.x = e.touches[0].clientX;
            previousMousePosition.y = e.touches[0].clientY;
        }
    }
}


let reverseYRotation = false;
let reverseXRotation = false;

function onTouchMove(e) {
    if (isDragging && e.touches.length === 1) {
        const deltaMove = {
            x: e.touches[0].clientX - previousMousePosition.x,
            y: e.touches[0].clientY - previousMousePosition.y
        };

        // Adjust rotation based on touch direction relative to screen coordinates
        const deltaRotation = {
            y: -((reverseXRotation ? -1 : 1) * deltaMove.x * 0.005),
            x: -((reverseYRotation ? -1 : 1) * deltaMove.y * 0.005)
        };

        // Apply rotation to planet1
        planet1.rotation.x += deltaRotation.y;
        planet1.rotation.y += deltaRotation.x;

        previousMousePosition.x = e.touches[0].clientX;
        previousMousePosition.y = e.touches[0].clientY;

        e.preventDefault();
    }
}









function debounce(func, timeout = 300) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => { func.apply(this, args); }, timeout);
    };
}

function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function updateMouse(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

function createStars(numberOfStars = 10000, sizeVariation = 0.7) {
    const starsGeometry = new THREE.BufferGeometry();
    const starsVertices = [];
    for (let i = 0; i < numberOfStars; i++) {
        starsVertices.push(
            THREE.MathUtils.randFloatSpread(2000),
            THREE.MathUtils.randFloatSpread(2000),
            THREE.MathUtils.randFloatSpread(2000)
        );
    }
    starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3));
    return new THREE.Points(starsGeometry, new THREE.PointsMaterial({ color: 0xffffff, size: sizeVariation }));
}

const initialStars = createStars(20000, 1.0);
scene.add(initialStars);

function updateStars() {
    let existingStars = scene.getObjectByName("stars");
    if (existingStars) scene.remove(existingStars);
    const newStars = createStars(20000, 1.0);
    newStars.name = "stars";
    scene.add(newStars);
}

function checkPreloader() {
    if (assetsLoaded && windowResized) {
        const preloader = document.getElementById('preloader');
        if (preloader) preloader.style.display = 'none';
    }
    if (assetsLoaded && !windowResized) {
        window.dispatchEvent(new Event('resize'));
        windowResized = true;
        const preloader = document.getElementById('preloader');
        if (preloader) {
            preloader.style.opacity = 0;
            setTimeout(() => { preloader.style.display = 'none'; }, 500);
        }
    }
}
