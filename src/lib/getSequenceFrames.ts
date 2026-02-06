import fs from "fs";
import path from "path";

/**
 * Discovers sequence frames from public/sequence folder.
 * Supports both frame_XXXX.jpg and ezgif-frame-XXX.jpg naming.
 */
export function getSequenceFrameIds(): string[] {
  const sequenceDir = path.join(process.cwd(), "public", "sequence");

  if (!fs.existsSync(sequenceDir)) {
    return [];
  }

  const files = fs.readdirSync(sequenceDir);
  const frameIds = files
    .filter((f) => /^(frame_|ezgif-frame-)\d+\.jpg$/i.test(f))
    .map((f) => {
      const match = f.match(/^(?:frame_|ezgif-frame-)(\d+)\.jpg$/i);
      return match ? match[1].padStart(3, "0") : null;
    })
    .filter((id): id is string => id !== null)
    .sort((a, b) => parseInt(a, 10) - parseInt(b, 10));

  return frameIds;
}
