import Spinner from "@/components/ui/Spinner";

export default function Loading() {
  return (
    <div className="grid min-h-[70svh] place-items-center">
      <Spinner className="size-10" />
    </div>
  );
}
