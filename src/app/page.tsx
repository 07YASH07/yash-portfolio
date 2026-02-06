import ChipScroll from "@/components/ChipScroll";
import { getSequenceFrameIds } from "@/lib/getSequenceFrames";

export default function Home() {
  const frameIds = getSequenceFrameIds();

  return (
    <div className="min-h-screen bg-[#050505]">
      <ChipScroll frameIds={frameIds} />
    </div>
  );
}
