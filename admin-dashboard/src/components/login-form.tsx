import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/auth-context";
import { Loader2, Wifi } from "lucide-react";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [email, setEmail] = useState("admin@smartattendance.edu");
  const [password, setPassword] = useState("admin123456");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await login(email, password);
      navigate("/");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || "حدث خطأ أثناء تسجيل الدخول");
      } else {
        setError("حدث خطأ أثناء تسجيل الدخول");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="border border-border shadow-sm">
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-6">
              <div className="bg-primary/10 text-primary flex aspect-square size-14 items-center justify-center rounded-2xl">
                <Wifi className="size-8" />
              </div>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              حضوري الذكي
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              لوحة تحكم إدارة النظام
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <FieldGroup className="space-y-4">
              {error && (
                <div className="bg-destructive/5 text-destructive text-xs p-3 rounded-lg border border-destructive/10 text-center font-medium">
                  {error}
                </div>
              )}
              <Field className="space-y-1.5">
                <FieldLabel
                  htmlFor="email"
                  className="text-right block w-full text-xs font-semibold text-muted-foreground"
                >
                  البريد الإلكتروني
                </FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@university.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  dir="ltr"
                  className="text-left h-11 bg-muted/20 border-border/50 focus-visible:bg-background transition-all"
                />
              </Field>
              <Field className="space-y-1.5">
                <FieldLabel
                  htmlFor="password"
                  className="text-right block w-full text-xs font-semibold text-muted-foreground"
                >
                  كلمة المرور
                </FieldLabel>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  dir="ltr"
                  className="text-left h-11 bg-muted/20 border-border/50 focus-visible:bg-background transition-all"
                />
              </Field>
              <div className="pt-2">
                <Button
                  type="submit"
                  className="w-full h-11 font-bold"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                      جاري التحقق...
                    </>
                  ) : (
                    "تسجيل الدخول"
                  )}
                </Button>
              </div>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
      <p className="text-center text-[10px] text-muted-foreground/60 font-medium">
        نظام إدارة الحضور والغياب الذكي © 2026
      </p>
    </div>
  );
}
