import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react";
import { useTheme } from "next-themes";
import { Toaster as Sonner, type ToasterProps } from "sonner";

// Redesigned toast component – simple, compact, top‑right corner, custom colors
const Toaster = ({ position = "top-right", theme: themeProp, ...props }: ToasterProps & { position?: string }) => {
  const { theme = "system" } = useTheme();
  const finalTheme = themeProp || theme;

  return (
    <Sonner
      theme={finalTheme as ToasterProps["theme"]}
      position={position}
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      // simple pastel palette – feels premium yet lightweight
      style={{
        "--normal-bg": "hsl(210, 20%, 98%)",
        "--normal-text": "hsl(210, 40%, 15%)",
        "--normal-border": "hsl(210, 20%, 85%)",
        "--border-radius": "0.5rem",
      } as React.CSSProperties}
      {...props}
    />
  );
};

export { Toaster };
