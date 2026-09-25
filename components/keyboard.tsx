"use client";

import { useEffect, useRef, useState } from "react";
import { Keyboard as KeyboardIcon } from "lucide-react";
import { skills } from "@/lib/portfolio-data";

export type KeyboardTheme = "cloud" | "blue" | "midnight";
export type KeyboardApi = { reset: () => void; press: (key: string) => void };
type Props = { selected: string; theme: KeyboardTheme; sound: boolean; onSelect: (name: string) => void; onKnob: () => void; apiRef: React.RefObject<KeyboardApi | null> };

export default function Keyboard({ selected, theme, sound, onSelect, onKnob, apiRef }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const state = useRef({ selected, theme, sound, onSelect, onKnob });
  const [status, setStatus] = useState("loading");
  state.current = { selected, theme, sound, onSelect, onKnob };

  useEffect(() => {
    let disposed = false;
    let cleanup = () => {};
    async function mount() {
      const THREE = await import("three");
      const { RoundedBoxGeometry } = await import("three/addons/geometries/RoundedBoxGeometry.js");
      if (disposed || !host.current) return;
      const el = host.current;
      let renderer: InstanceType<typeof THREE.WebGLRenderer>;
      try {
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("webgl2", { antialias: true, alpha: true });
        if (context) {
          renderer = new THREE.WebGLRenderer({ canvas, context, antialias: true, alpha: true, powerPreference: "low-power" });
          el.dataset.renderer = "webgl";
        } else {
          const { createSoftwareRenderer } = await import("@/lib/software-renderer");
          if (disposed) return;
          renderer = createSoftwareRenderer();
          el.dataset.renderer = "software";
        }
      } catch { setStatus("fallback"); return; }
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.7));
      renderer.setClearColor(0x000000, 0);
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.22;
      renderer.domElement.setAttribute("aria-label", "Interactive AULA F75-inspired keyboard. Drag to rotate. Click a skill key or use the skill buttons below. Use arrow keys when focused to rotate; Escape resets the view.");
      renderer.domElement.setAttribute("role", "img");
      renderer.domElement.tabIndex = 0;
      el.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      const camera = new THREE.OrthographicCamera(-10, 10, 7, -7, 0.1, 100);
      camera.position.set(0, 14, 17);
      camera.lookAt(0, 0.1, 0);
      scene.add(new THREE.HemisphereLight(0xffffff, 0x62748e, 2.5));
      const light = new THREE.DirectionalLight(0xffffff, 4.2);
      light.position.set(-7, 15, 9);
      light.castShadow = true;
      light.shadow.mapSize.set(1024, 1024);
      Object.assign(light.shadow.camera, { left: -13, right: 13, top: 11, bottom: -11, near: 1, far: 40 });
      light.shadow.normalBias = 0.055;
      light.shadow.bias = -0.0001;
      light.shadow.radius = 4;
      scene.add(light);
      const fill = new THREE.DirectionalLight(0xc5dcff, 2);
      fill.position.set(10, 6, -8);
      scene.add(fill);
      const floor = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), new THREE.ShadowMaterial({ opacity: 0.13 }));
      floor.rotation.x = -Math.PI / 2;
      floor.position.y = -0.65;
      floor.receiveShadow = true;
      scene.add(floor);
      const board = new THREE.Group();
      board.rotation.y = -0.22;
      scene.add(board);

      const caseMat = new THREE.MeshStandardMaterial({ color: 0xd7dee8, roughness: 0.34, metalness: 0.15 });
      const lipMat = new THREE.MeshStandardMaterial({ color: 0xf1f4f8, roughness: 0.33, metalness: 0.08 });
      const plateMat = new THREE.MeshStandardMaterial({ color: 0x818c9c, roughness: 0.68 });
      function box(w: number, h: number, d: number, radius: number, mat: InstanceType<typeof THREE.Material>, y: number) {
        const m = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 3, radius), mat);
        m.position.y = y; m.castShadow = true; m.receiveShadow = true; board.add(m); return m;
      }
      box(17.25, 0.68, 7.17, 0.3, caseMat, 0);
      box(17.15, 0.22, 7.07, 0.25, lipMat, 0.39);
      box(16.64, 0.06, 6.55, 0.18, plateMat, 0.525);
      const glowMat = new THREE.MeshStandardMaterial({ color: 0x2170ff, emissive: 0x2170ff, emissiveIntensity: 1.5 });
      const frontStrip = box(14.8, 0.025, 0.025, 0.01, glowMat, -0.025);
      frontStrip.position.z = 3.586;

      type KeyRecord = { group: InstanceType<typeof THREE.Group>; cap: InstanceType<typeof THREE.Mesh>; material: InstanceType<typeof THREE.MeshStandardMaterial>; labelMat: InstanceType<typeof THREE.MeshBasicMaterial>; key: string; skill?: string; accent: boolean; modifier: boolean; baseY: number; until: number; color: InstanceType<typeof THREE.Color> };
      const keys: KeyRecord[] = [];
      const targets: InstanceType<typeof THREE.Object3D>[] = [];
      const textures: InstanceType<typeof THREE.Texture>[] = [];
      const startX = -8.125;
      const rowsZ = [-2.76, -1.42, -0.36, 0.7, 1.76, 2.82];
      function legend(text: string, sub: string, width: number) {
        const c = document.createElement("canvas");
        c.width = Math.round(160 * width); c.height = 160;
        const ctx = c.getContext("2d")!;
        ctx.fillStyle = "#ffffff"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.font = `600 ${text.length > 5 ? 25 : text.length > 3 ? 31 : 41}px Arial, sans-serif`;
        ctx.fillText(text, c.width / 2, sub ? 72 : 84);
        if (sub) { ctx.font = "500 19px Arial, sans-serif"; ctx.globalAlpha = 0.7; ctx.fillText(sub, c.width / 2, 121); }
        const texture = new THREE.CanvasTexture(c); texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 4); textures.push(texture); return texture;
      }
      function addKey(label: string, width: number, x: number, row: number) {
        const skill = skills.find(s => s.key === label);
        const group = new THREE.Group();
        const baseY = 0.86 + (5 - row) * 0.014;
        group.position.set(startX + x + width / 2, baseY, rowsZ[row]);
        const mat = new THREE.MeshStandardMaterial({ roughness: 0.47, metalness: 0.02 });
        const geometry = new RoundedBoxGeometry(width - 0.09, 0.48, 0.94, 2, 0.105);
        const pos = geometry.attributes.position;
        for (let i = 0; i < pos.count; i++) {
          const y = pos.getY(i); const scale = 1 - Math.max(0, y + 0.14) * 0.15;
          pos.setX(i, pos.getX(i) * scale); pos.setZ(i, pos.getZ(i) * scale);
        }
        geometry.computeVertexNormals();
        const cap = new THREE.Mesh(geometry, mat); cap.castShadow = true; cap.receiveShadow = true; group.add(cap);
        const labelMat = new THREE.MeshBasicMaterial({ map: legend(skill?.short ?? label, skill ? label : "", width), transparent: true, depthWrite: false, color: 0x27354b });
        const text = new THREE.Mesh(new THREE.PlaneGeometry(width - 0.18, 0.76), labelMat);
        text.rotation.x = -Math.PI / 2; text.position.y = 0.246; group.add(text);
        const key: KeyRecord = { group, cap, material: mat, labelMat, key: label, skill: skill?.name, accent: ["esc", "enter", "↑", "←", "↓", "→"].includes(label), modifier: row === 0 || label.length > 1 && !skill, baseY, until: 0, color: new THREE.Color() };
        cap.userData.keyIndex = keys.length; text.userData.keyIndex = keys.length; keys.push(key); targets.push(cap, text); board.add(group);
      }
      function row(items: [string, number][], r: number) { let x = 0; for (const [label, w] of items) { addKey(label, w, x, r); x += w; } }
      addKey("esc", 1, 0, 0);
      for (let f = 1; f <= 12; f++) addKey(`F${f}`, 1, 1.42 + (f - 1) + Math.floor((f - 1) / 4) * 0.32, 0);
      row([["~", 1], ..."1234567890-=".split("").map(k => [k, 1] as [string, number]), ["back", 2]], 1);
      row([["tab", 1.5], ..."QWERTYUIOP[]".split("").map(k => [k, 1] as [string, number]), ["\\", 1.5]], 2);
      row([["caps", 1.75], ..."ASDFGHJKL;'".split("").map(k => [k, 1] as [string, number]), ["enter", 2.25]], 3);
      row([["shift", 2.25], ..."ZXCVBNM,./".split("").map(k => [k, 1] as [string, number]), ["shift", 1.75]], 4);
      row([["ctrl", 1.25], ["⌘", 1.25], ["alt", 1.25], ["create something.", 6.25], ["alt", 1], ["fn", 1]], 5);
      ["del", "pgup", "pgdn", "end"].forEach((label, i) => addKey(label, 1, 15.25, i + 1));
      addKey("↑", 1, 14.15, 4); addKey("←", 1, 13.05, 5); addKey("↓", 1, 14.15, 5); addKey("→", 1, 15.25, 5);

      const knob = new THREE.Group(); knob.position.set(7.58, 0.95, -2.68);
      const knobMaterial = new THREE.MeshStandardMaterial({ color: 0x9da8bb, roughness: 0.27, metalness: 0.78 });
      const knobBody = new THREE.Mesh(new THREE.CylinderGeometry(0.49, 0.49, 0.6, 48), knobMaterial);
      knobBody.castShadow = true; knob.add(knobBody);
      const top = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.04, 48), new THREE.MeshStandardMaterial({ color: 0xd7e0ed, roughness: 0.25, metalness: 0.85 }));
      top.position.y = 0.32; knob.add(top);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.495, 0.023, 8, 48), glowMat);
      ring.rotation.x = Math.PI / 2; ring.position.y = -0.17; knob.add(ring);
      const grooveGeom = new THREE.BoxGeometry(0.018, 0.4, 0.018);
      const grooves = new THREE.InstancedMesh(grooveGeom, new THREE.MeshStandardMaterial({ color: 0x64718b, metalness: 0.7, roughness: 0.4 }), 48);
      const temp = new THREE.Object3D();
      for (let i = 0; i < 48; i++) { const angle = i / 48 * Math.PI * 2; temp.position.set(Math.sin(angle) * 0.493, 0, Math.cos(angle) * 0.493); temp.rotation.y = angle; temp.updateMatrix(); grooves.setMatrixAt(i, temp.matrix); }
      knob.add(grooves);
      const tick = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.012, 0.16), new THREE.MeshBasicMaterial({ color: 0x324257 })); tick.position.set(0, 0.345, -0.23); knob.add(tick);
      knobBody.userData.knob = true; top.userData.knob = true; targets.push(knobBody, top); board.add(knob);

      const brandMaterial = new THREE.MeshBasicMaterial({ map: legend("AULA   /   F75", "", 4), transparent: true, color: 0x6b778a });
      const brand = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.34), brandMaterial);
      brand.position.set(5.7, 0.04, 3.594); board.add(brand);

      const palettes = {
        cloud: { base: 0xe6ebf1, key: 0xf5f6f8, mod: 0xc4d0e1, plate: 0x8391a7, ink: 0x2c3a51, accent: 0x246bf3 },
        blue: { base: 0x9ebadf, key: 0xd5e4fa, mod: 0x76a2df, plate: 0x557cac, ink: 0x1a3961, accent: 0x195ce4 },
        midnight: { base: 0x273142, key: 0x46536a, mod: 0x313e52, plate: 0x121f33, ink: 0xf2f5fc, accent: 0x3e7dfc },
      };
      let targetY = -0.22; let targetX = 0; let hovered = -1; let dragging = false; let moved = false;
      let downX = 0; let downY = 0; let prevX = 0; let prevY = 0;
      let inView = true; let lastFrame = 0; let audio: AudioContext | null = null;
      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
      const ray = new THREE.Raycaster(); const pointer = new THREE.Vector2();
      function hit(e: PointerEvent) { const rect = renderer.domElement.getBoundingClientRect(); pointer.set((e.clientX - rect.left) / rect.width * 2 - 1, -(e.clientY - rect.top) / rect.height * 2 + 1); ray.setFromCamera(pointer, camera); return ray.intersectObjects(targets, false)[0]?.object; }
      function clickSound() {
        if (!state.current.sound) return;
        try {
          audio ??= new AudioContext(); if (audio.state === "suspended") void audio.resume();
          const now = audio.currentTime;
          const osc = audio.createOscillator(); const gain = audio.createGain();
          osc.type = "triangle"; osc.frequency.setValueAtTime(240 + Math.random() * 65, now); osc.frequency.exponentialRampToValueAtTime(75, now + 0.035);
          gain.gain.setValueAtTime(0.095, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.065);
          osc.connect(gain); gain.connect(audio.destination); osc.start(now); osc.stop(now + 0.07);
        } catch { /* Sound is optional. */ }
      }
      function press(key: KeyRecord) { key.until = performance.now() + 165; if (key.skill) state.current.onSelect(key.skill); clickSound(); }
      function down(e: PointerEvent) { if (e.button !== 0) return; dragging = true; moved = false; downX = prevX = e.clientX; downY = prevY = e.clientY; renderer.domElement.setPointerCapture(e.pointerId); }
      function move(e: PointerEvent) {
        if (dragging) { if (Math.hypot(e.clientX - downX, e.clientY - downY) > 5) moved = true; if (moved) { targetY += (e.clientX - prevX) * 0.007; targetX = THREE.MathUtils.clamp(targetX + (e.clientY - prevY) * 0.005, -0.4, 0.8); } prevX = e.clientX; prevY = e.clientY; }
        else { const obj = hit(e); hovered = obj?.userData.keyIndex ?? -1; renderer.domElement.style.cursor = obj ? "pointer" : "grab"; }
      }
      function up(e: PointerEvent) { if (!dragging) return; if (!moved) { const obj = hit(e); if (obj?.userData.knob) { knob.rotation.y += 0.6; state.current.onKnob(); clickSound(); } else if (obj?.userData.keyIndex !== undefined) press(keys[obj.userData.keyIndex]); } dragging = false; if (renderer.domElement.hasPointerCapture(e.pointerId)) renderer.domElement.releasePointerCapture(e.pointerId); }
      function cancel() { dragging = false; hovered = -1; }
      function leave() { hovered = -1; }
      function reset() { targetY = -0.22; targetX = 0; }
      function keydown(e: KeyboardEvent) {
        if (!inView || e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
        const element = e.target as HTMLElement;
        if (element.closest("input,textarea,select,button,a,[contenteditable=true],[role=radio]")) return;
        if (e.target === renderer.domElement && ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Escape"].includes(e.key)) {
          e.preventDefault(); if (e.key === "Escape") reset();
          else if (e.key === "ArrowLeft") targetY -= 0.15;
          else if (e.key === "ArrowRight") targetY += 0.15;
          else targetX = THREE.MathUtils.clamp(targetX + (e.key === "ArrowDown" ? 0.12 : -0.12), -0.4, 0.8);
          return;
        }
        const key = keys.find(k => k.key === e.key.toUpperCase()); if (key) press(key);
      }
      function resize() { const w = el.clientWidth; const h = el.clientHeight; const aspect = w / h; const viewWidth = 19.4; camera.left = -viewWidth / 2; camera.right = viewWidth / 2; camera.top = viewWidth / aspect / 2; camera.bottom = -viewWidth / aspect / 2; camera.updateProjectionMatrix(); renderer.setSize(w, h); }
      const resizeObserver = new ResizeObserver(resize); resizeObserver.observe(el); resize();
      const visibilityObserver = new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; }); visibilityObserver.observe(el);
      apiRef.current = { reset, press: key => { const k = keys.find(k => k.key === key); if (k) press(k); } };
      renderer.domElement.addEventListener("pointerdown", down); renderer.domElement.addEventListener("pointermove", move); renderer.domElement.addEventListener("pointerup", up); renderer.domElement.addEventListener("pointercancel", cancel); renderer.domElement.addEventListener("pointerleave", leave);
      window.addEventListener("keydown", keydown);
      const lost = (e: Event) => { e.preventDefault(); setStatus("fallback"); renderer.setAnimationLoop(null); };
      renderer.domElement.addEventListener("webglcontextlost", lost);
      const selectedColor = new THREE.Color(); const inkColor = new THREE.Color();
      renderer.setAnimationLoop(time => {
        if (!inView || document.hidden || time - lastFrame < 24) return; lastFrame = time;
        const p = palettes[state.current.theme];
        board.rotation.y += (targetY - board.rotation.y) * 0.13; board.rotation.x += (targetX - board.rotation.x) * 0.13;
        board.position.y = reducedMotion.matches ? 0 : Math.sin(time * 0.0008) * 0.06;
        caseMat.color.lerp(selectedColor.set(p.base), 0.15); lipMat.color.lerp(selectedColor.set(p.base), 0.15); plateMat.color.set(p.plate);
        keys.forEach((key, i) => {
          const active = key.skill === state.current.selected;
          key.group.position.y += (key.baseY + (time < key.until ? -0.16 : i === hovered ? 0.09 : 0) - key.group.position.y) * 0.32;
          key.color.set(active || key.accent ? p.accent : key.modifier ? p.mod : p.key);
          key.material.color.lerp(key.color, 0.22);
          key.labelMat.color.lerp(inkColor.set(active || key.accent ? 0xffffff : p.ink), 0.22);
          key.material.emissive.set(active ? p.accent : 0x000000); key.material.emissiveIntensity = active ? 0.09 : 0;
        });
        renderer.render(scene, camera);
      });
      setStatus("ready");
      cleanup = () => {
        renderer.setAnimationLoop(null); resizeObserver.disconnect(); visibilityObserver.disconnect(); window.removeEventListener("keydown", keydown);
        renderer.domElement.removeEventListener("pointerdown", down); renderer.domElement.removeEventListener("pointermove", move); renderer.domElement.removeEventListener("pointerup", up); renderer.domElement.removeEventListener("pointercancel", cancel); renderer.domElement.removeEventListener("pointerleave", leave); renderer.domElement.removeEventListener("webglcontextlost", lost);
        const materials = new Set<InstanceType<typeof THREE.Material>>(); const geometries = new Set<InstanceType<typeof THREE.BufferGeometry>>();
        scene.traverse(obj => { if (obj instanceof THREE.Mesh) { geometries.add(obj.geometry); (Array.isArray(obj.material) ? obj.material : [obj.material]).forEach(m => materials.add(m)); } });
        geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose()); textures.forEach(t => t.dispose());
        renderer.dispose(); renderer.domElement.remove(); if (audio) void audio.close(); apiRef.current = null;
      };
    }
    mount().catch(() => { if (!disposed) setStatus("fallback"); });
    return () => { disposed = true; cleanup(); };
  }, [apiRef]);

  return <div className="keyboard-canvas" ref={host} data-status={status}>
    {status === "loading" && <div className="canvas-message"><KeyboardIcon size={32} /><span>Setting up the keys…</span></div>}
    {status === "fallback" && <div className="canvas-message"><KeyboardIcon size={40} /><strong>My stack, at your fingertips.</strong><span>3D isn’t available in this browser. Explore every skill using the buttons below.</span></div>}
  </div>;
}
