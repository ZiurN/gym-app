import { ImageResponse } from "next/og";
import { AppIcon } from "@/lib/app-icon";

export const dynamic = "force-static";

export function GET() {
  return new ImageResponse(<AppIcon size={192} />, { width: 192, height: 192 });
}
