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

const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('/node_modules/three/examples/jsm/libs/draco/');
const loader = new GLTFLoader();
loader.setDRACOLoader(dracoLoader);

let mixer, sphereMixer, cameraAction, planet1, planet2, planet3, planet4, assetsLoaded = false, windowResized = false;

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let lastRenderTime = 0;
let isTouching = false;
let previousMousePosition = { x: 0, y: 0 };

loader.load('models/planets.glb', function (gltf) {
    scene.add(gltf.scene);

    gltf.scene.traverse(object => {
        if (object.isCamera) camera = object;
        if (object.name === 'planet_1') planet1 = object;
        if (object.name === 'planet_2') planet2 = object;
        if (object.name === 'planet_3') planet3 = object;
        if (object.name === 'planet_4') planet4 = object;
    });

    if (gltf.animations && gltf.animations.length) {
        mixer = new THREE.AnimationMixer(scene);
        sphereMixer = new THREE.AnimationMixer(scene);
        const sphereAnimations = [
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

// New scroll event listener
document.addEventListener('scroll', (event) => {
    if (cameraAction && !isDragging) {
        targetAnimationTime += window.scrollY * 0.001;
        cameraAction.time = targetAnimationTime;
    }
});

document.addEventListener('touchstart', event => {
    const touch = event.touches[0];
    lastTouchY = touch.clientY;

    mouse.x = (touch.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(touch.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children, true);

    if (intersects.length > 0) {
        const touchedObject = intersects[0].object;
        let parentGroup = touchedObject.parent;
        while (parentGroup && !(parentGroup instanceof THREE.Group)) {
            parentGroup = parentGroup.parent;
        }

        if (parentGroup) {
            let isPlanet = false;
            let currentParent = parentGroup;
            while (currentParent) {
                if (['planet_1', 'planet_2', 'planet_3', 'planet_4'].includes(currentParent.name)) {
                    isPlanet = true;
                    break;
                }
                currentParent = currentParent.parent;
            }

            if (isPlanet) {
                isDragging = true;
                console.log(`isDragging: ${isDragging}`);
            } 
        }
    }
}, { passive: false });

// New touchmove event listener
document.addEventListener('touchmove', event => {
    if (!isDragging && cameraAction) {
        const touch = event.touches[0];
        const deltaY = touch.clientY - lastTouchY;
        targetAnimationTime -= deltaY * 0.001;
        cameraAction.time = targetAnimationTime;
        lastTouchY = touch.clientY;
        event.preventDefault(); // Prevent default scrolling behavior
    }
}, { passive: false }); // Add this options object


function onPointerMove(e) {
    if (isDragging) {
        let clientX, clientY;

        if (e.touches && e.touches.length === 1) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }

        const deltaMove = {
            x: clientX - previousMousePosition.x,
            y: clientY - previousMousePosition.y
        };

        // Calculate the rotation angles
        const deltaRotationY = -((reverseXRotation ? -1 : 1) * deltaMove.y * 0.005);
        const deltaRotationX = -((reverseYRotation ? -1 : 1) * deltaMove.x * 0.005);

        // Create quaternions for each axis rotation
        const quaternionY = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), deltaRotationY);
        const quaternionX = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), deltaRotationX);

        // Combine the rotations
        const quaternion = new THREE.Quaternion().multiplyQuaternions(quaternionY, quaternionX);

        // Apply the rotation to planet1
        planet1.quaternion.multiplyQuaternions(quaternion, planet1.quaternion);
        planet2.quaternion.multiplyQuaternions(quaternion, planet2.quaternion);
        planet3.quaternion.multiplyQuaternions(quaternion, planet3.quaternion);
        planet4.quaternion.multiplyQuaternions(quaternion, planet4.quaternion);

        previousMousePosition.x = clientX;
        previousMousePosition.y = clientY;

        e.preventDefault();
    }
}

function onPointerDown(e) {
    if (e.touches && e.touches.length === 1) {
        previousMousePosition.x = e.touches[0].clientX;
        previousMousePosition.y = e.touches[0].clientY;
    } else {
        previousMousePosition.x = e.clientX;
        previousMousePosition.y = e.clientY;
    }
}

function onPointerUp() {
    isDragging = false;
}

// Add event listeners for both touch and mouse events
document.addEventListener('mousemove', onPointerMove, { passive: false });
document.addEventListener('mousedown', onPointerDown, false);
document.addEventListener('mouseup', onPointerUp, false);

document.addEventListener('touchmove', onPointerMove, { passive: false });
document.addEventListener('touchstart', onPointerDown, false);
document.addEventListener('touchend', onPointerUp, false);


document.addEventListener('touchend', () => {
    isTouching = false;
    isDragging = false;

    // Final touch position
    const finalTouchPositionX = mouse.x;
    const finalTouchPositionY = mouse.y;

    // Final planet rotation quaternion
    const finalQuaternion = planet1.quaternion.toArray().map(value => value.toFixed(6)).join(' ');
    lastTouchY = 0;
}, { passive: false });




// const raycaster = new THREE.Raycaster();
// const mouse = new THREE.Vector2();

document.addEventListener('mousedown', event => {
    // Calculate mouse position in normalized device coordinates (-1 to +1) for both components
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Update the raycaster with the camera and mouse position
    raycaster.setFromCamera(mouse, camera);

    // Calculate objects intersecting the ray
    const intersects = raycaster.intersectObjects(scene.children, true);

    if (intersects.length > 0) {
        const clickedObject = intersects[0].object;
        console.log(`Clicked on object: ${clickedObject.name}`);

        let parentGroup = clickedObject.parent;
        console.log(parentGroup);
        while (parentGroup && !(parentGroup instanceof THREE.Group)) {
            parentGroup = parentGroup.parent;
        }

        if (parentGroup) {
            console.log(`Parent group: ${parentGroup.name}`);

            const planetNames = ['planet_1', 'planet_2', 'planet_3', 'planet_4'];
            if (planetNames.includes(parentGroup.name)) {
                isDragging = true;
                previousMousePosition.x = event.clientX;
                previousMousePosition.y = event.clientY;
                console.log(`isDragging: ${isDragging}`);
                console.log(`Previous mouse position: x=${previousMousePosition.x}, y=${previousMousePosition.y}`);
            } else {
                console.log(`Parent group ${parentGroup.name} is not in the list of planet names.`);
            }
        } else {
            console.log('No parent group found.');
        }

        lastRenderTime = performance.now(); // Update lastRenderTime
    } else {
        console.log('No intersections found.');
    }
});

document.addEventListener('mouseup', event => {
    if (isDragging) {
        isDragging = false;
        console.log(`isDragging: ${isDragging}`);
    }
});

function animate() {
    requestAnimationFrame(animate);
    const deltaTime = performance.now() - lastRenderTime;
    if (deltaTime >= 1000 / 60) {
        const delta = clock.getDelta();
        if (mixer) {
            currentAnimationTime += (targetAnimationTime - currentAnimationTime) * 0.05;
            mixer.setTime(currentAnimationTime);
        }
        if (planet1 && !isDragging) planet1.rotation.x += 0.01;
        if (planet2 && !isDragging) planet2.rotation.x += 0.01;
        if (planet3 && !isDragging) planet3.rotation.x += 0.01;
        if (planet4 && !isDragging) planet4.rotation.x += 0.01;
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

    const intersects = raycaster.intersectObjects(scene.children, true);

    if (intersects.length > 0) {
        const clickedObject = intersects[0].object;
        console.log(`Clicked on object: ${clickedObject.name}`);

        let parentGroup = clickedObject.parent;
        console.log(parentGroup)
        while (parentGroup && !(parentGroup instanceof THREE.Group)) {
            parentGroup = parentGroup.parent;
        }

        if (parentGroup) {
            console.log(`Parent group: ${parentGroup.name}`);

            const planetNames = ['planet_1', 'planet_2', 'planet_3', 'planet_4'];
            if (planetNames.includes(parentGroup.name)) {
                isDragging = true;
                previousMousePosition.x = event.clientX;
                previousMousePosition.y = event.clientY;
                console.log(`isDragging: ${isDragging}`);
                console.log(`Previous mouse position: x=${previousMousePosition.x}, y=${previousMousePosition.y}`);
            } else {
                console.log(`Parent group ${parentGroup.name} is not in the list of planet names.`);
            }
        } else {
            console.log('No parent group found.');
        }
    } else {
        console.log('No intersections found.');
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

        // List of planets to check
        const planets = [planet1, planet2, planet3, planet4];
        let planetTouched = false;

        for (const planet of planets) {
            const intersects = raycaster.intersectObject(planet);
            if (intersects.length > 0) {
                console.log(`Touched ${planet.name}`);
                isDragging = true;
                previousMousePosition.x = e.touches[0].clientX;
                previousMousePosition.y = e.touches[0].clientY;
                planetTouched = true;
                break; // Exit the loop once a planet is touched
            }
        }

        if (!planetTouched) {
            isDragging = false;
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
        
        planet2.rotation.x += deltaRotation.y;
        planet2.rotation.y += deltaRotation.x;
        
        planet3.rotation.x += deltaRotation.y;
        planet3.rotation.y += deltaRotation.x;
        
        planet4.rotation.x += deltaRotation.y;
        planet4.rotation.y += deltaRotation.x;

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
