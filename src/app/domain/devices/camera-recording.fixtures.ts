import type { CameraRecordingClip } from './camera-recording.types';

function stableIndex(id: string, mod: number): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return hash % mod;
}

export function cameraRecordingsFor(deviceId: string, date: string): CameraRecordingClip[] {
  const seed = stableIndex(`${deviceId}:${date}`, 1000);
  const count = 3 + (seed % 6);
  const now = Date.now();

  const clips: CameraRecordingClip[] = [];
  for (let i = 0; i < count; i++) {
    const hour = (seed + i * 37) % 24;
    const minute = (seed + i * 53) % 60;
    const second = (seed + i * 19) % 60;
    const at = `${date}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}`;
    if (new Date(at).getTime() > now) continue;
    const durationSec = 12 + ((seed + i * 17) % 90);
    clips.push({ id: `${deviceId}-${date}-c${i}`, at, durationSec });
  }

  return clips.sort((a, b) => (a.at < b.at ? -1 : 1));
}
