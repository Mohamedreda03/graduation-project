import { LoginForm } from "@/components/login-form";

export function LoginPage() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6 md:p-10 bg-muted/30">
      <div className="w-full max-w-md">
        <LoginForm />
      </div>
    </div>
  );
}
