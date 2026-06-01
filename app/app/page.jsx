import DemoGate from "@/components/DemoGate";
import ShortsAgencyOS from "@/components/ShortsAgencyOS";

export const metadata = {
  title: "Workspace — Shorts Agency OS",
};

export default function AppPage() {
  return (
    <DemoGate>
      <ShortsAgencyOS />
    </DemoGate>
  );
}
