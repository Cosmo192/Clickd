import * as THREE from "three";

// Orthographic CPU renderer for the same interactive Three.js scene when WebGL
// is unavailable. Geometry, camera, raycasting, and key state remain shared.
export function createSoftwareRenderer() {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;
  let ratio = 1, width = 600, height = 400, frame = 0;
  let loop: ((time: number) => void) | null = null;
  const tintCache = new Map<string, { color: string; image: HTMLCanvasElement }>();
  const light = new THREE.Vector3(-0.45, 0.85, 0.5).normalize();
  type Point = { x: number; y: number; z: number };
  type Face = { pts: Point[]; depth: number; layer: number; color: string; texture?: HTMLCanvasElement; alpha: number; };
  function project(v: THREE.Vector3, camera: THREE.Camera): Point {
    const cameraPoint = v.clone().applyMatrix4(camera.matrixWorldInverse);
    const p = v.clone().project(camera);
    return { x: (p.x + 1) * width / 2, y: (1 - p.y) * height / 2, z: cameraPoint.z };
  }
  function render(scene: THREE.Scene, camera: THREE.Camera) {
    scene.updateMatrixWorld(true); camera.updateMatrixWorld(true);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0); ctx.clearRect(0, 0, width, height);
    const center = project(new THREE.Vector3(0.2, -0.68, 0.8), camera);
    ctx.save(); ctx.translate(center.x, center.y); ctx.scale(width * 0.44, height * 0.2);
    const shadow = ctx.createRadialGradient(0, 0, 0.08, 0, 0, 1);
    shadow.addColorStop(0, "rgba(38,55,85,0.19)"); shadow.addColorStop(0.5, "rgba(38,55,85,0.1)"); shadow.addColorStop(1, "rgba(38,55,85,0)");
    ctx.fillStyle = shadow; ctx.fillRect(-1, -1, 2, 2); ctx.restore();
    const faces: Face[] = [];
    function face(mesh: THREE.Mesh, verts: THREE.Vector3[], normal: THREE.Vector3, mat: THREE.Material & { color?: THREE.Color }, texture?: HTMLCanvasElement) {
      const normalMatrix = new THREE.Matrix3().getNormalMatrix(mesh.matrixWorld);
      const n = normal.clone().applyMatrix3(normalMatrix).normalize();
      const towardCamera = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 2).normalize();
      if (n.dot(towardCamera) < 0.001) return;
      const pts = verts.map(v => project(v.clone().applyMatrix4(mesh.matrixWorld), camera));
      const c = (mat.color ?? new THREE.Color(0xffffff)).clone();
      if (!texture) c.multiplyScalar(0.62 + Math.max(0, n.dot(light)) * 0.52);
      const layer = mesh.userData.keyIndex !== undefined || mesh.geometry.type === "CylinderGeometry" || (mesh.parent?.position.y ?? 0) > 0.8 ? 1 : 0;
      faces.push({ pts, depth: pts.reduce((a, p) => a + p.z, 0) / pts.length, layer, color: c.getStyle(), texture, alpha: mat.opacity });
    }
    function outline(w: number, d: number, y: number, r: number) {
      const pts: THREE.Vector3[] = [];
      const corners = [[w / 2 - r, d / 2 - r, 0], [-w / 2 + r, d / 2 - r, Math.PI / 2], [-w / 2 + r, -d / 2 + r, Math.PI], [w / 2 - r, -d / 2 + r, Math.PI * 1.5]];
      for (const [x, z, start] of corners) for (let i = 0; i <= 4; i++) { const a = start + i / 4 * Math.PI / 2; pts.push(new THREE.Vector3(x + Math.cos(a) * r, y, z + Math.sin(a) * r)); }
      return pts;
    }
    scene.traverse(obj => {
      if (!(obj instanceof THREE.Mesh) || obj instanceof THREE.InstancedMesh || !obj.visible) return;
      const mat = obj.material as THREE.MeshStandardMaterial;
      if (!mat || Array.isArray(mat) || mat.type === "ShadowMaterial" || obj.geometry.type === "TorusGeometry") return;
      const p = (obj.geometry as THREE.BoxGeometry).parameters;
      if (obj.geometry.type === "PlaneGeometry" && mat.map?.image) {
        const img = mat.map.image as HTMLCanvasElement;
        const color = mat.color.getStyle();
        let tint = tintCache.get(mat.uuid);
        if (!tint) { const image = document.createElement("canvas"); image.width = img.width; image.height = img.height; tint = { color: "", image }; tintCache.set(mat.uuid, tint); }
        if (tint.color !== color) { const c = tint.image.getContext("2d")!; c.clearRect(0, 0, img.width, img.height); c.globalCompositeOperation = "source-over"; c.drawImage(img, 0, 0); c.globalCompositeOperation = "source-in"; c.fillStyle = color; c.fillRect(0, 0, img.width, img.height); tint.color = color; }
        face(obj, [new THREE.Vector3(-p.width / 2, p.height / 2, 0), new THREE.Vector3(p.width / 2, p.height / 2, 0), new THREE.Vector3(p.width / 2, -p.height / 2, 0), new THREE.Vector3(-p.width / 2, -p.height / 2, 0)], new THREE.Vector3(0, 0, 1), mat, tint.image);
      } else if (obj.geometry.type === "CylinderGeometry") {
        const cp = (obj.geometry as THREE.CylinderGeometry).parameters;
        const top: THREE.Vector3[] = [], bottom: THREE.Vector3[] = [];
        for (let i = 0; i < 48; i++) { const a = i / 48 * Math.PI * 2; top.push(new THREE.Vector3(Math.cos(a) * cp.radiusTop, cp.height / 2, Math.sin(a) * cp.radiusTop)); bottom.push(new THREE.Vector3(Math.cos(a) * cp.radiusBottom, -cp.height / 2, Math.sin(a) * cp.radiusBottom)); }
        face(obj, top, new THREE.Vector3(0, 1, 0), mat);
        for (let i = 0; i < 48; i++) { const j = (i + 1) % 48; const normal = new THREE.Vector3(top[i].x + top[j].x, 0, top[i].z + top[j].z).normalize(); face(obj, [bottom[i], bottom[j], top[j], top[i]], normal, mat); }
      } else if (p?.width && p?.depth) {
        const isKey = obj.userData.keyIndex !== undefined;
        const w = p.width, h = p.height, d = p.depth;
        const radius = Math.min((p as unknown as { radius: number }).radius ?? 0.06, w / 3, d / 3);
        const bottom = outline(w, d, -h / 2, radius);
        const shoulder = outline(w, d, h / 2 - Math.min(0.1, h * 0.25), radius);
        const top = outline(w * (isKey ? 0.89 : 0.986), d * (isKey ? 0.86 : 0.98), h / 2, radius);
        face(obj, top, new THREE.Vector3(0, 1, 0), mat);
        face(obj, [...bottom].reverse(), new THREE.Vector3(0, -1, 0), mat);
        for (let i = 0; i < top.length; i++) {
          const j = (i + 1) % top.length;
          const edge = bottom[j].clone().sub(bottom[i]); const normal = new THREE.Vector3(edge.z, 0, -edge.x).normalize();
          face(obj, [bottom[i], bottom[j], shoulder[j], shoulder[i]], normal, mat);
          face(obj, [shoulder[i], shoulder[j], top[j], top[i]], normal.clone().add(new THREE.Vector3(0, 0.8, 0)).normalize(), mat);
        }
      }
    });
    faces.sort((a, b) => a.layer - b.layer || a.depth - b.depth);
    for (const f of faces) {
      ctx.globalAlpha = f.alpha;
      if (f.texture) {
        const [a, b, , d] = f.pts;
        ctx.save(); ctx.transform((b.x - a.x) / f.texture.width, (b.y - a.y) / f.texture.width, (d.x - a.x) / f.texture.height, (d.y - a.y) / f.texture.height, a.x, a.y); ctx.drawImage(f.texture, 0, 0); ctx.restore();
      } else { ctx.beginPath(); f.pts.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.closePath(); ctx.fillStyle = f.color; ctx.fill(); ctx.strokeStyle = f.color; ctx.lineWidth = 0.6; ctx.stroke(); }
    }
    ctx.globalAlpha = 1;
  }
  return {
    domElement: canvas,
    capabilities: { getMaxAnisotropy: () => 1 },
    shadowMap: { enabled: false, type: THREE.PCFSoftShadowMap },
    toneMapping: THREE.NoToneMapping, toneMappingExposure: 1,
    setPixelRatio(value: number) { ratio = Math.min(value, 1.5); },
    setClearColor() {},
    setSize(w: number, h: number) { width = w; height = h; canvas.width = w * ratio; canvas.height = h * ratio; canvas.style.width = `${w}px`; canvas.style.height = `${h}px`; },
    setAnimationLoop(callback: ((time: number) => void) | null) { loop = callback; cancelAnimationFrame(frame); if (loop) { const tick = (time: number) => { if (!loop) return; loop(time); frame = requestAnimationFrame(tick); }; frame = requestAnimationFrame(tick); } },
    render,
    dispose() { cancelAnimationFrame(frame); loop = null; tintCache.clear(); },
  } as unknown as THREE.WebGLRenderer;
}
