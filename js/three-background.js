let scene, camera, renderer, cubes;
let ambientLight, directionalLight;

function init() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Position the renderer behind other content
    renderer.domElement.style.position = 'fixed';
    renderer.domElement.style.top = '0';
    renderer.domElement.style.left = '0';
    renderer.domElement.style.zIndex = '-1';
    renderer.domElement.style.opacity = '0.15';

    // Lights
    ambientLight = new THREE.AmbientLight(0x404040); // soft white light
    scene.add(ambientLight);

    directionalLight = new THREE.DirectionalLight(0xffffff, 0.5); // white directional light
    directionalLight.position.set(1, 1, 1).normalize();
    scene.add(directionalLight);

    cubes = [];
    const geometry = new THREE.BoxGeometry(1, 1, 1);

    for (let i = 0; i < 50; i++) {
        const material = new THREE.MeshStandardMaterial({
            color: 0x00a8ff, // Primary color
            roughness: 0.4,
            metalness: 0.1,
            transparent: true,
            opacity: 0.6,
            wireframe: true // Keep wireframe for data-like feel
        });
        const cube = new THREE.Mesh(geometry, material);
        cube.position.set(
            (Math.random() - 0.5) * 20,
            (Math.random() - 0.5) * 20,
            (Math.random() - 0.5) * 20 - 10 // Push them slightly back
        );
        cube.rotation.set(
            Math.random() * Math.PI,
            Math.random() * Math.PI,
            Math.random() * Math.PI
        );
        cubes.push(cube);
        scene.add(cube);
    }

    camera.position.z = 5;

    // Initial theme color for cubes
    updateCubeColors();

    animate();
}

function updateCubeColors() {
    const isLightMode = document.body.classList.contains('light-mode');
    const primaryColor = isLightMode ? 0x007bff : 0x00a8ff; // Light mode blue vs dark mode blue
    cubes.forEach(cube => {
        cube.material.color.set(primaryColor);
    });
}

// Listen for theme changes
const observer = new MutationObserver((mutations) => {
    mutations.forEach(mutation => {
        if (mutation.attributeName === 'class') {
            updateCubeColors();
        }
    });
});
observer.observe(document.body, { attributes: true });

function animate() {
    requestAnimationFrame(animate);

    cubes.forEach(cube => {
        cube.rotation.x += 0.005;
        cube.rotation.y += 0.005;
        cube.position.y += 0.01; // Float upwards
        if (cube.position.y > 10) {
            cube.position.y = -10; // Reset position if it floats too high
        }
    });

    renderer.render(scene, camera);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

window.addEventListener('resize', onWindowResize);

init();