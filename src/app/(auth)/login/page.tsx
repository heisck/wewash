import { LoginForm } from "./login-form";

export const metadata = {
  title: "Login | WeWash",
  description: "Sign in to your WeWash account",
};

export default function LoginPage() {
  return (
    <div className="flex min-h-screen">
      <div className="hidden lg:flex w-1/2 flex-col justify-center items-center bg-gray-900 text-white p-12 relative overflow-hidden">
        <div className="z-10 text-center max-w-lg">
          <h1 className="text-4xl font-bold mb-4">Welcome to WeWash</h1>
          <p className="text-gray-300 text-lg">
            Streamlining washing machine access, rotation schedules, and maintenance reporting across university halls.
          </p>
        </div>
        {/* Simple decorative background circles */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl pointer-events-none"></div>
      </div>
      <div className="flex w-full lg:w-1/2 flex-col items-center justify-center p-8 bg-gray-50 dark:bg-gray-950">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center lg:text-left">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Sign In</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Enter your details to access your account</p>
          </div>
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
