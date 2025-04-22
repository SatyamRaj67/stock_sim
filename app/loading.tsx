import { TbLoader } from "react-icons/tb";

export default function Loading() {
  return (
    <div className="flex h-full min-h-[calc(100vh-theme(spacing.16))] flex-1 items-center justify-center">
      <TbLoader className="text-primary size-8 animate-spin" />
    </div>
  );
}
