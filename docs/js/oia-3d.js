import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const DEMOS = [
  {
    id: "deltoid",
    title: "Middle deltoid",
    origin: "Acromion of the scapula",
    insertion: "Deltoid tuberosity of the humerus",
    action: "Shoulder abduction",
    color: 0xc8f05e,
  },
  {
    id: "biceps",
    title: "Biceps brachii",
    origin: "Coracoid / supraglenoid tubercle",
    insertion: "Radial tuberosity",
    action: "Elbow flexion & supination",
    color: 0x4fd1c5,
  },
  {
    id: "glute",
    title: "Gluteus maximus",
    origin: "Ilium, sacrum, coccyx region",
    insertion: "Gluteal tuberosity / IT band",
    action: "Hip extension",
    color: 0xff8a65,
  },
];

/**
 * Mount an interactive OIA 3D demo into a container.
 * @returns {() => void} dispose
 */
export function mountOiaScene(container, captionEl) {
  if (!container) return () => {};

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const width = () => Math.max(280, container.clientWidth || 480);
  const height = () => Math.max(280, container.clientHeight || 360);

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x0b2f33, 8, 18);

  const camera = new THREE.PerspectiveCamera(42, width() / height(), 0.1, 50);
  camera.position.set(2.8, 1.6, 4.2);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(width(), height(), false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  container.appendChild(renderer.domElement);
  renderer.domElement.style.width = "100%";
  renderer.domElement.style.height = "100%";
  renderer.domElement.style.display = "block";
  renderer.domElement.setAttribute("aria-label", "3D muscle origin insertion action animation");

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.minDistance = 3;
  controls.maxDistance = 8;
  controls.target.set(0, 0.9, 0);
  controls.enablePan = false;
  controls.autoRotate = !reducedMotion;
  controls.autoRotateSpeed = 0.55;

  scene.add(new THREE.AmbientLight(0xb7d8d2, 0.85));
  const key = new THREE.DirectionalLight(0xffffff, 1.15);
  key.position.set(3, 5, 2);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xc8f05e, 0.45);
  rim.position.set(-3, 2, -2);
  scene.add(rim);

  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(3.2, 48),
    new THREE.MeshStandardMaterial({ color: 0x0d3d42, roughness: 0.2, metalness: 0.05, transparent: true, opacity: 0.55 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.02;
  scene.add(floor);

  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0x1a4f55,
    roughness: 0.55,
    metalness: 0.12,
  });
  const softMat = new THREE.MeshStandardMaterial({
    color: 0x2a6a70,
    roughness: 0.45,
    metalness: 0.08,
  });

  const root = new THREE.Group();
  scene.add(root);

  // Stylized figure
  const pelvis = mesh(new THREE.CapsuleGeometry(0.28, 0.22, 6, 12), bodyMat, [0, 0.55, 0]);
  const torso = mesh(new THREE.CapsuleGeometry(0.34, 0.7, 8, 16), bodyMat, [0, 1.25, 0]);
  const head = mesh(new THREE.SphereGeometry(0.22, 24, 16), softMat, [0, 1.95, 0]);
  root.add(pelvis, torso, head);

  // Shoulder pivot + right arm
  const shoulder = new THREE.Group();
  shoulder.position.set(0.38, 1.55, 0);
  root.add(shoulder);
  const upperArm = mesh(new THREE.CapsuleGeometry(0.09, 0.42, 6, 12), softMat, [0.28, 0, 0]);
  upperArm.rotation.z = -Math.PI / 2;
  shoulder.add(upperArm);

  const elbow = new THREE.Group();
  elbow.position.set(0.56, 0, 0);
  shoulder.add(elbow);
  const forearm = mesh(new THREE.CapsuleGeometry(0.075, 0.38, 6, 12), softMat, [0.26, 0, 0]);
  forearm.rotation.z = -Math.PI / 2;
  elbow.add(forearm);

  // Left arm (static balance)
  const leftShoulder = new THREE.Group();
  leftShoulder.position.set(-0.38, 1.55, 0);
  root.add(leftShoulder);
  const leftUpper = mesh(new THREE.CapsuleGeometry(0.09, 0.42, 6, 12), softMat, [-0.28, 0, 0]);
  leftUpper.rotation.z = Math.PI / 2;
  leftShoulder.add(leftUpper);

  // Right leg for glute demo
  const hip = new THREE.Group();
  hip.position.set(0.16, 0.42, 0);
  root.add(hip);
  const thigh = mesh(new THREE.CapsuleGeometry(0.11, 0.5, 6, 12), softMat, [0, -0.38, 0]);
  hip.add(thigh);
  const leftHip = mesh(new THREE.CapsuleGeometry(0.11, 0.5, 6, 12), softMat, [-0.16, 0.04, 0]);
  root.add(leftHip);

  // Muscle path visuals
  const originOrb = glowSphere(0.07, 0xc8f05e);
  const insertOrb = glowSphere(0.07, 0xff8a65);
  root.add(originOrb, insertOrb);

  let muscleMesh = null;
  let pulse = null;
  let muscleCurve = null;
  let demoIndex = 0;
  let phase = 0; // 0 show O, 1 show path, 2 action, 3 hold
  let phaseT = 0;
  let disposed = false;
  let raf = 0;

  function setCaption(demo, stepLabel) {
    if (!captionEl) return;
    captionEl.innerHTML = `
      <p class="oia3d-step">${stepLabel}</p>
      <h3>${escapeHtml(demo.title)}</h3>
      <ul>
        <li><strong>Origin:</strong> ${escapeHtml(demo.origin)}</li>
        <li><strong>Insertion:</strong> ${escapeHtml(demo.insertion)}</li>
        <li><strong>Action:</strong> ${escapeHtml(demo.action)}</li>
      </ul>`;
  }

  function layoutForDemo(demo) {
    // Reset limbs
    shoulder.rotation.set(0, 0, 0);
    elbow.rotation.set(0, 0, 0);
    hip.rotation.set(0, 0, 0);

    let o;
    let i;
    if (demo.id === "deltoid") {
      o = new THREE.Vector3(0.22, 1.62, 0.05);
      i = new THREE.Vector3(0.72, 1.28, 0.02);
    } else if (demo.id === "biceps") {
      o = new THREE.Vector3(0.34, 1.52, 0.08);
      i = new THREE.Vector3(0.95, 1.12, 0.05);
    } else {
      o = new THREE.Vector3(0.05, 0.78, -0.12);
      i = new THREE.Vector3(0.22, 0.18, 0.05);
    }

    originOrb.position.copy(o);
    insertOrb.position.copy(i);
    originOrb.material.color.setHex(demo.color);
    insertOrb.material.emissive.setHex(demo.color);

    if (muscleMesh) {
      root.remove(muscleMesh);
      muscleMesh.geometry.dispose();
      muscleMesh.material.dispose();
    }
    if (pulse) {
      root.remove(pulse);
      pulse.geometry.dispose();
      pulse.material.dispose();
    }

    muscleCurve = new THREE.QuadraticBezierCurve3(
      o.clone(),
      o.clone().lerp(i, 0.5).add(new THREE.Vector3(0.05, 0.12, 0.18)),
      i.clone()
    );
    muscleMesh = new THREE.Mesh(
      new THREE.TubeGeometry(muscleCurve, 40, 0.045, 10, false),
      new THREE.MeshStandardMaterial({
        color: demo.color,
        emissive: demo.color,
        emissiveIntensity: 0.35,
        roughness: 0.35,
        metalness: 0.15,
        transparent: true,
        opacity: 0,
      })
    );
    root.add(muscleMesh);

    pulse = glowSphere(0.055, demo.color);
    pulse.visible = false;
    root.add(pulse);

    originOrb.scale.setScalar(0.001);
    insertOrb.scale.setScalar(0.001);
  }

  function animateAction(demo, t) {
    // t 0..1
    const ease = 0.5 - 0.5 * Math.cos(Math.min(1, Math.max(0, t)) * Math.PI);
    if (demo.id === "deltoid") {
      shoulder.rotation.z = -ease * (Math.PI / 2.3);
    } else if (demo.id === "biceps") {
      elbow.rotation.y = -ease * (Math.PI / 2.1);
      shoulder.rotation.z = -0.15;
    } else {
      hip.rotation.x = -ease * 0.85;
    }
  }

  layoutForDemo(DEMOS[0]);
  setCaption(DEMOS[0], "Watch the 3D cycle");

  const clock = new THREE.Clock();

  function tick() {
    if (disposed) return;
    raf = requestAnimationFrame(tick);
    const dt = Math.min(0.033, clock.getDelta());
    phaseT += dt;
    const demo = DEMOS[demoIndex];

    // Phase timings
    const durations = reducedMotion ? [0.01, 0.01, 0.01, 4.5] : [1.1, 1.4, 1.8, 2.2];
    const d = durations[phase];
    const p = Math.min(1, phaseT / d);

    if (phase === 0) {
      originOrb.scale.setScalar(0.2 + p * 0.8);
      setCaption(demo, "1 · Origin");
      if (p >= 1) {
        phase = 1;
        phaseT = 0;
      }
    } else if (phase === 1) {
      originOrb.scale.setScalar(1);
      muscleMesh.material.opacity = Math.min(0.95, p * 1.2);
      insertOrb.scale.setScalar(0.2 + p * 0.8);
      if (pulse && muscleCurve) {
        pulse.visible = true;
        pulse.position.copy(muscleCurve.getPoint(p));
      }
      setCaption(demo, "2 · Insertion path");
      if (p >= 1) {
        phase = 2;
        phaseT = 0;
        if (pulse) pulse.visible = false;
        muscleMesh.material.opacity = 0.95;
      }
    } else if (phase === 2) {
      insertOrb.scale.setScalar(1);
      animateAction(demo, p);
      const pulseAmp = 0.35 + 0.25 * Math.sin(phaseT * 8);
      muscleMesh.material.emissiveIntensity = pulseAmp;
      setCaption(demo, "3 · Action");
      if (p >= 1) {
        phase = 3;
        phaseT = 0;
      }
    } else {
      animateAction(demo, 1);
      setCaption(demo, "Hold · Origin · Insertion · Action");
      if (p >= 1) {
        demoIndex = (demoIndex + 1) % DEMOS.length;
        phase = 0;
        phaseT = 0;
        layoutForDemo(DEMOS[demoIndex]);
      }
    }

    root.rotation.y = Math.sin(clock.elapsedTime * 0.15) * 0.08;
    controls.update();
    renderer.render(scene, camera);
  }

  function onResize() {
    const w = width();
    const h = height();
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
  }

  const ro = new ResizeObserver(onResize);
  ro.observe(container);
  tick();

  return function dispose() {
    disposed = true;
    cancelAnimationFrame(raf);
    ro.disconnect();
    controls.dispose();
    renderer.dispose();
    if (renderer.domElement.parentNode === container) {
      container.removeChild(renderer.domElement);
    }
    scene.traverse((obj) => {
      if (obj.isMesh) {
        obj.geometry?.dispose?.();
        if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose?.());
        else obj.material?.dispose?.();
      }
    });
  };
}

function mesh(geometry, material, position) {
  const m = new THREE.Mesh(geometry, material);
  m.position.set(...position);
  return m;
}

function glowSphere(radius, color) {
  return new THREE.Mesh(
    new THREE.SphereGeometry(radius, 20, 16),
    new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.7,
      roughness: 0.25,
      metalness: 0.1,
    })
  );
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
