// ==================== MAIN ====================
(function () {
    const canvas = document.getElementById('game-canvas');
    const particlesCanvas = document.getElementById('particles-canvas');
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a1a);
    scene.fog = new THREE.FogExp2(0x0a0a1a, 0.035);

    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
    const initDist = 11;
    camera.position.copy(new THREE.Vector3(1, 0.6, 0.8).normalize().multiplyScalar(initDist));
    camera.lookAt(0, 0, 0);

    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = false;
    controls.enablePan = false;
    controls.minDistance = 4;
    controls.maxDistance = 20;
    // Left click rotates camera, cube manipulation with right click
    controls.mouseButtons = {
        LEFT: THREE.MOUSE.ROTATE,
        MIDDLE: THREE.MOUSE.DOLLY,
        RIGHT: null
    };
    // Touch: single finger rotates camera, two fingers zoom/rotate
    controls.touches = {
        ONE: THREE.TOUCH.ROTATE,
        TWO: THREE.TOUCH.DOLLY_ROTATE
    };

    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const dl1 = new THREE.DirectionalLight(0xffffff, 1.0);
    dl1.position.set(5, 8, 5); scene.add(dl1);
    const dl2 = new THREE.DirectionalLight(0x6366f1, 0.2);
    dl2.position.set(-5, -3, -5); scene.add(dl2);
    const pl1 = new THREE.PointLight(0x8b5cf6, 0.5, 20); scene.add(pl1);
    const pl2 = new THREE.PointLight(0x6366f1, 0.3, 20); scene.add(pl2);
    const fill = new THREE.PointLight(0x2255aa, 0.2, 15);
    fill.position.set(0, -5, 0); scene.add(fill);

    const envGeo = new THREE.SphereGeometry(30, 32, 32);
    const envMat = new THREE.MeshBasicMaterial({ color: 0x111122, side: THREE.BackSide });
    scene.add(new THREE.Mesh(envGeo, envMat));

    const grid = new THREE.GridHelper(25, 25, 0x222244, 0x1a1a33);
    grid.position.y = -2.5;
    grid.material.opacity = 0.2; grid.material.transparent = true;
    scene.add(grid);

    const particleSystem = new ParticleSystem(particlesCanvas);
    particleSystem.resize();

    let cubeSize = 3;
    let rubiksCube = new RubiksCube(scene, cubeSize);
    let gameStarted = false, gameStartTime = null, timerInterval = null;
    let moveCount = 0, bestTime = null, scrambled = false, loaded = false;

    function formatTime(ms) {
        if (!ms && ms !== 0) return '--:--.--';
        const totalCs = Math.floor(ms / 10);
        const cs = totalCs % 10;
        const s = Math.floor(totalCs / 10) % 60;
        const m = Math.floor(totalCs / 600);
        return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}.${cs}`;
    }

    function startTimer() {
        if (timerInterval) return;
        gameStarted = true; gameStartTime = performance.now();
        timerInterval = setInterval(() => {
            document.getElementById('timer').textContent =
                formatTime(performance.now() - gameStartTime);
        }, 50);
    }

    function stopTimer() {
        if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
    }

    function resetTimer() {
        stopTimer(); gameStarted = false; gameStartTime = null; moveCount = 0;
        document.getElementById('timer').textContent = formatTime(0);
        document.getElementById('move-counter').textContent = '0';
    }

    function getElapsed() { return gameStarted ? performance.now() - gameStartTime : 0; }

    function addMove(notation) {
        moveCount++;
        document.getElementById('move-counter').textContent = moveCount;
        const el = document.getElementById('move-history');
        const entry = document.createElement('div');
        entry.className = 'move-entry';
        entry.innerHTML = `<span class="move-num">${moveCount}</span>${notation}`;
        el.appendChild(entry); el.scrollTop = el.scrollHeight;
    }

    function clearHistory() {
        document.getElementById('move-history').innerHTML = '';
        moveCount = 0;
        document.getElementById('move-counter').textContent = '0';
    }

    // ==================== RAYCASTING / DRAG ====================

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    // State
    let dragState = null; // null | 'preparing' | 'rotating'

    // Helper plane for drag detection
    const helperPlane = new THREE.Mesh(
        new THREE.PlaneGeometry(200, 200),
        new THREE.MeshBasicMaterial({ depthWrite: false, transparent: true, opacity: 0 })
    );
    scene.add(helperPlane);

    function getPointerPos(e) {
        const touch = e.touches ? (e.touches[0] || e.changedTouches[0]) : e;
        return { x: touch.clientX, y: touch.clientY };
    }

    function screenToNDC(x, y) {
        const rect = renderer.domElement.getBoundingClientRect();
        return new THREE.Vector2(
            ((x - rect.left) / rect.width) * 2 - 1,
            -((y - rect.top) / rect.height) * 2 + 1
        );
    }

    function getCubieMeshes() {
        const meshes = [];
        for (const c of rubiksCube.cubies) {
            c.traverse(ch => { if (ch.isMesh) { ch.userData.cubie = c; meshes.push(ch); } });
        }
        return meshes;
    }

    function getMainAxis(v) {
        return Math.abs(v.x) > Math.abs(v.y)
            ? (Math.abs(v.x) > Math.abs(v.z) ? 'x' : 'z')
            : (Math.abs(v.y) > Math.abs(v.z) ? 'y' : 'z');
    }

    function onPointerDown(e) {
        if (!loaded) return;
        // Only left button or touch (right button also allowed for cube)
        if (e.button !== undefined && e.button > 1) return;

        const pos = getPointerPos(e);
        const ndc = screenToNDC(pos.x, pos.y);
        raycaster.setFromCamera(ndc, camera);

        const meshes = getCubieMeshes();
        const hits = raycaster.intersectObjects(meshes, false);
        
        // Let OrbitControls handle empty space clicks
        if (hits.length === 0) {
            return;
        }

        const hit = hits[0];
        const cubie = hit.object.userData.cubie;
        if (!cubie) return;

        e.preventDefault();
        e.stopPropagation();

        // Get face normal in world space (use hit face, not cubie orientation)
        const faceNormal = hit.face.normal.clone();
        
        // Snap to nearest axis
        const axis = getMainAxis(faceNormal);
        faceNormal.set(0, 0, 0);
        faceNormal[axis] = Math.round(faceNormal[axis]);
        if (faceNormal[axis] === 0) faceNormal[axis] = 1; // Default to + if 0

        // Setup helper plane at hit point, facing along face normal
        helperPlane.position.copy(hit.point);
        helperPlane.lookAt(hit.point.clone().add(faceNormal));
        helperPlane.updateMatrixWorld();

        // Store drag state
        const localPoint = helperPlane.worldToLocal(hit.point.clone());
        dragState = {
            cubie,
            faceNormal: faceNormal.clone(),
            axis,
            dragStart: localPoint.clone(),
            dragCurrent: localPoint.clone(),
            dragTotal: new THREE.Vector3(),
            flipAxis: null,
            flipLayer: null,
            flipAngle: 0,
            layerValue: 0,
        };

        // Disable orbit controls during drag
        controls.enabled = false;
    }

    function onPointerMove(e) {
        if (!dragState) return;
        e.preventDefault();

        const pos = getPointerPos(e);
        const ndc = screenToNDC(pos.x, pos.y);
        raycaster.setFromCamera(ndc, camera);

        const planeHits = raycaster.intersectObject(helperPlane, false);
        if (planeHits.length === 0) return;

        const localPoint = helperPlane.worldToLocal(planeHits[0].point.clone());
        const delta = localPoint.clone().sub(dragState.dragCurrent);
        dragState.dragTotal.add(delta);
        dragState.dragCurrent = localPoint.clone();

        const totalLen = dragState.dragTotal.length();

        // If still preparing, check if drag is significant
        if (dragState.flipAxis === null) {
            if (totalLen < 0.05) return;

            // Determine dominant drag direction in plane local space
            const dragDir = new THREE.Vector3();
            if (Math.abs(dragState.dragTotal.x) > Math.abs(dragState.dragTotal.y)) {
                dragDir.x = Math.sign(dragState.dragTotal.x);
            } else {
                dragDir.y = Math.sign(dragState.dragTotal.y);
            }

            // Convert to world space
            const worldDir = helperPlane.localToWorld(dragDir).sub(helperPlane.position).normalize();

            // Rotation axis = cross(faceNormal, dragDirection)
            const flipAxis = new THREE.Vector3().crossVectors(dragState.faceNormal, worldDir).normalize();

            // Snap to nearest axis
            const fa = getMainAxis(flipAxis);
            flipAxis.set(0, 0, 0);
            flipAxis[fa] = Math.round(flipAxis[fa]);

            dragState.flipAxis = flipAxis;

            // Determine which layer to rotate based on clicked cubie position
            // Positions are: size 3 -> -1,0,1; size 4 -> -1.5,-0.5,0.5,1.5; etc.
            // We need to round to get integer-like values
            const cubiePos = dragState.cubie.position.clone();
            cubiePos.x = Math.round(cubiePos.x * 2) / 2;
            cubiePos.y = Math.round(cubiePos.y * 2) / 2;
            cubiePos.z = Math.round(cubiePos.z * 2) / 2;
            const layerAxis = fa;
            const layerValue = cubiePos[layerAxis];

            dragState.layerValue = layerValue;

            // Find all cubies in this layer
            const allCubies = rubiksCube.cubies;
            const layer = [];
            const tol = 0.3;
            for (const c of allCubies) {
                const cp = c.position.clone();
                cp.x = Math.round(cp.x * 2) / 2;
                cp.y = Math.round(cp.y * 2) / 2;
                cp.z = Math.round(cp.z * 2) / 2;
                if (Math.abs(cp[layerAxis] - layerValue) < tol) {
                    layer.push(c);
                }
            }

            dragState.flipLayer = layer;
            dragState.flipAngle = 0;

            // Attach layer to pivot
            rubiksCube._attachToPivot(layer);
        }

        // Now rotating
        if (dragState.flipAxis !== null && dragState.flipLayer) {
            // Determine which local axis of the helper plane corresponds to rotation
            // The rotation axis is perpendicular to both faceNormal and dragDir
            // We need to figure out: does dragging along plane-x or plane-y cause rotation?
            // Answer: both do, but we use the dominant one
            const domAxis = Math.abs(dragState.dragTotal.x) > Math.abs(dragState.dragTotal.y) ? 'x' : 'y';
            const rotAmount = domAxis === 'x' ? delta.x : delta.y;

            const axis = getMainAxis(dragState.flipAxis);
            rubiksCube.pivot.rotation[axis] += rotAmount;
            dragState.flipAngle += rotAmount;
        }
    }

    function onPointerUp(e) {
        if (!dragState) return;
        e.preventDefault();

        if (dragState.flipLayer && dragState.flipAngle !== 0) {
            // Snap to nearest 90 degrees
            const axis = getMainAxis(dragState.flipAxis);
            const currentAngle = rubiksCube.pivot.rotation[axis];
            const snapped = Math.round(currentAngle / (Math.PI / 2)) * (Math.PI / 2);
            const remaining = snapped - currentAngle;

            // Animate the remaining rotation
            const dur = 150;
            const start = Date.now();
            const startRot = rubiksCube.pivot.rotation[axis];

            function snapAnim() {
                const p = Math.min((Date.now() - start) / dur, 1);
                const e = 1 - Math.pow(1 - p, 3);
                rubiksCube.pivot.rotation[axis] = startRot + remaining * e;
                if (p < 1) {
                    requestAnimationFrame(snapAnim);
                } else {
                    rubiksCube.pivot.rotation[axis] = snapped;
                    rubiksCube._detachFromPivot(dragState.flipLayer);
                    rubiksCube.pivot.rotation[axis] = 0;

                    // Snap positions to nearest 0.5 to handle floating point drift
                    for (const c of dragState.flipLayer) {
                        c.position.x = Math.round(c.position.x * 2) / 2;
                        c.position.y = Math.round(c.position.y * 2) / 2;
                        c.position.z = Math.round(c.position.z * 2) / 2;
                    }

                    // Record the move for solve tracking
                    if (!gameStarted) startTimer();
                    moveCount++;
                    document.getElementById('move-counter').textContent = moveCount;

                    // Check if solved
                    if (scrambled && rubiksCube.isSolved()) {
                        onSolved();
                    }

                    dragState = null;
                    controls.enabled = true;
                }
            }
            requestAnimationFrame(snapAnim);
        } else {
            // No significant drag, just cancel
            if (dragState.flipLayer) {
                rubiksCube._detachFromPivot(dragState.flipLayer);
                rubiksCube.pivot.rotation.set(0, 0, 0);
            }
            dragState = null;
            controls.enabled = true;
        }
    }

    function axisToFace(axis, layerValue) {
        const absX = Math.abs(axis.x);
        const absY = Math.abs(axis.y);
        const absZ = Math.abs(axis.z);
        
        if (absX >= absY && absX >= absZ) {
            if (axis.x > 0.1) return 'R';
            if (axis.x < -0.1) return 'L';
            return 'M';
        }
        if (absY >= absX && absY >= absZ) {
            if (axis.y > 0.1) return 'U';
            if (axis.y < -0.1) return 'D';
            return 'E';
        }
        if (absZ >= absX && absZ >= absY) {
            if (axis.z > 0.1) return 'F';
            if (axis.z < -0.1) return 'B';
            return 'S';
        }
        return null;
    }

    // Event listeners
    renderer.domElement.addEventListener('pointerdown', onPointerDown, false);
    renderer.domElement.addEventListener('pointermove', onPointerMove, false);
    renderer.domElement.addEventListener('pointerup', onPointerUp, false);
    renderer.domElement.addEventListener('pointercancel', onPointerUp, false);
    renderer.domElement.addEventListener('pointerleave', onPointerUp, false);

    // ==================== EXECUTE MOVE ====================

    function executeMove({ face, ccw }) {
        if (!gameStarted) startTimer();
        const notation = face + (ccw ? "'" : "");
        rubiksCube.rotateFace(face, ccw).then(() => {
            addMove(notation);
            if (scrambled && rubiksCube.isSolved()) onSolved();
        });
    }

    // ==================== WIN ====================

    function onSolved() {
        stopTimer();
        const elapsed = getElapsed();
        const ts = formatTime(elapsed);
        let nb = false;
        if (bestTime === null || elapsed < bestTime) {
            bestTime = elapsed;
            document.getElementById('best-time').textContent = ts;
            nb = true;
        }
        document.getElementById('win-time').textContent = ts;
        document.getElementById('win-moves').textContent = moveCount;
        const be = document.getElementById('win-best');
        nb ? be.classList.remove('hidden') : be.classList.add('hidden');
        document.getElementById('win-screen').classList.remove('hidden');
        particleSystem.explode(120);
    }

    // ==================== KEYBOARD ====================

    document.addEventListener('keydown', (e) => {
        if (!loaded) return;
        const k = e.key.toUpperCase();
        if (['CONTROL','SHIFT','ALT','META','TAB'].includes(k)) return;
        if (k === 'ESCAPE') {
            document.getElementById('win-screen').classList.add('hidden');
            document.getElementById('keyboard-guide').classList.add('hidden');
            return;
        }
        const map = { R: 'R', L: 'L', U: 'U', D: 'D', F: 'F', B: 'B', M: 'M', E: 'E', S: 'S' };
        if (map[k]) { executeMove({ face: map[k], ccw: e.shiftKey }); return; }
        if (k === 'S') handleScramble();
        if (k === 'H') document.getElementById('keyboard-guide').classList.toggle('hidden');
    });

    // ==================== ACTIONS ====================

    async function handleScramble() {
        if (rubiksCube.isAnimating) return;
        resetTimer(); clearHistory(); scrambled = false;
        rubiksCube.reset();
        const overlay = document.getElementById('scramble-overlay');
        overlay.classList.remove('hidden');
        const moves = await rubiksCube.scramble(25);
        scrambled = true;
        overlay.classList.add('hidden');
        clearHistory();
        for (const m of moves) addMove(m);
        document.getElementById('status-text').textContent = 'Cube scrambled! Solve it by dragging faces or using keyboard.';
    }

    function handleReset() {
        resetTimer(); clearHistory(); scrambled = false;
        rubiksCube.reset(); updateCamera();
        document.getElementById('status-text').textContent = 'Cube reset. Click Scramble to begin.';
    }

    async function handleAutoSolve() {
        if (rubiksCube.isAnimating || !scrambled) return;
        stopTimer();
        const hist = await rubiksCube.autoSolve();
        for (const n of hist) addMove(n);
        scrambled = false;
        onSolved();
    }

    // ==================== UI ====================

    document.getElementById('btn-scramble').addEventListener('click', handleScramble);
    document.getElementById('btn-reset').addEventListener('click', handleReset);
    document.getElementById('btn-solve').addEventListener('click', () => {
        if (!scrambled || rubiksCube.solvedMoves.length === 0) {
            handleScramble().then(() => handleAutoSolve());
        } else handleAutoSolve();
    });
    document.getElementById('btn-play-again').addEventListener('click', () => {
        document.getElementById('win-screen').classList.add('hidden');
        handleScramble();
    });

    document.querySelectorAll('.size-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            cubeSize = parseInt(btn.dataset.size);
            scrambled = false; resetTimer(); clearHistory();
            rubiksCube.destroy();
            rubiksCube = new RubiksCube(scene, cubeSize);
            updateCamera();
            document.getElementById('difficulty-badge').textContent = `${cubeSize}x${cubeSize}`;
            document.getElementById('status-text').textContent = 'Click Scramble to begin.';
        });
    });

    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            scrambled = false; resetTimer(); clearHistory();
            const theme = btn.dataset.theme;
            rubiksCube.destroy();
            rubiksCube = new RubiksCube(scene, cubeSize);
            rubiksCube.theme = theme;
            rubiksCube.reset();
            updateCamera();
            document.getElementById('status-text').textContent = 'Click Scramble to begin.';
        });
    });

    document.getElementById('anim-speed').addEventListener('input', (e) => {
        const v = parseInt(e.target.value);
        document.getElementById('speed-value').textContent = v;
        rubiksCube.animationSpeed = 850 - v * 80;
    });
    document.getElementById('anim-speed').dispatchEvent(new Event('input'));

    document.getElementById('btn-keyboard').addEventListener('click', () => {
        document.getElementById('keyboard-guide').classList.toggle('hidden');
    });

    function updateCamera() {
        const dist = (cubeSize - 3) * 3 + initDist;
        const d = new THREE.Vector3(1, 0.6, 0.8).normalize().multiplyScalar(dist);
        camera.position.copy(d);
        controls.update();
    }

    function animate() {
        requestAnimationFrame(animate);
        if (controls.enabled) controls.update();
        const t = performance.now() * 0.001;
        pl1.position.set(Math.sin(t * 0.3) * 5, 3, Math.cos(t * 0.3) * 5);
        pl2.position.set(Math.cos(t * 0.2) * 4, -2, Math.sin(t * 0.2) * 4);
        renderer.render(scene, camera);
    }
    animate();

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        particleSystem.resize();
    });

    document.getElementById('best-time').textContent = formatTime(bestTime);
    loaded = true;
    handleScramble();
})();
