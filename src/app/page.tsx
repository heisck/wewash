import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Globe } from "@/components/ui/globe";

export default function Home() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background">
      <div className="z-10 flex flex-col items-center justify-center space-y-6 text-center">
        <h1 className="text-5xl font-extrabold tracking-tighter sm:text-6xl md:text-7xl lg:text-8xl">
          <span className="bg-gradient-to-b from-black to-gray-400 bg-clip-text text-transparent dark:from-white dark:to-gray-600">
            WeWash
          </span>
        </h1>
        <p className="max-w-[600px] text-lg text-muted-foreground sm:text-xl">
          The modern washing machine management system for university halls. Effortless rotation, tracking, and payments.
        </p>
        <div className="flex gap-4">
          <Link href="/login">
            <Button size="lg" className="rounded-full px-8">
              Get Started
            </Button>
          </Link>
          <Link href="/login">
            <Button variant="outline" size="lg" className="rounded-full px-8">
              Student Portal
            </Button>
          </Link>
        </div>
      </div>
      <div className="absolute top-[40%] flex w-full justify-center opacity-40 mix-blend-color-dodge dark:opacity-20 pointer-events-none">
        <Globe />
      </div>
    </div>
  );
}
