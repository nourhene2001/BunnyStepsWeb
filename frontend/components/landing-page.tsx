import { Button } from "@/components/ui/button"
import Link from "next/link"
import Image from "next/image"

interface LandingPageProps {
  user?: any // user object from AuthService.getCurrentUser()
}

export default function LandingPage({ user }: LandingPageProps) {
  const isLoggedIn = !!user

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Logo */}
            <div className="w-10 h-10 relative">
              <Image
                src="BunnyStepsWeb\frontend\images\logo.png"
                alt="BunnySteps logo"
                fill
                className="object-contain rounded-lg"
                priority
              />
            </div>
            <span className="text-xl font-bold text-foreground">BunnySteps</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#features" className="text-foreground hover:text-primary transition-colors">
              Features
            </a>
            <a href="#benefits" className="text-foreground hover:text-primary transition-colors">
              Why BunnySteps
            </a>
            <Button asChild className="bg-primary hover:bg-primary/90">
              <Link href={isLoggedIn ? "/dashboard" : "/register"}>
                {isLoggedIn ? "Go to your space" : "Get Started"}
              </Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section - Personalized if logged in */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <div className="space-y-6">
          {isLoggedIn ? (
            <h1 className="text-5xl md:text-6xl font-bold text-foreground leading-tight">
              Welcome back{user?.username ? `, ${user.username}` : ""}! 🐰
            </h1>
          ) : (
            <h1 className="text-5xl md:text-6xl font-bold text-foreground leading-tight">
              Focus without the pressure
            </h1>
          )}

          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            {isLoggedIn
              ? "Ready to continue your gentle progress?"
              : "BunnySteps helps minds build habits gently, with gamified rewards and flexible focus modes."}
          </p>

          <Button asChild size="lg" className="bg-primary hover:bg-primary/90">
            <Link href={isLoggedIn ? "/dashboard" : "/register"}>
              {isLoggedIn ? "Go to your space" : "Get Started"}
            </Link>
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-foreground mb-4">Powerful Features</h2>
          <p className="text-lg text-muted-foreground">Everything you need to manage your life your way</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Feature 1 */}
          <div className="bg-card border border-border rounded-xl p-6 hover:shadow-lg hover:border-primary/20 transition-all">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">✓</span>
            </div>
            <h3 className="font-semibold text-foreground mb-2 text-lg">Smart Task Manager</h3>
            <p className="text-muted-foreground">
              Break down tasks into bite-sized steps. No overwhelming to-do lists, just gentle progress.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-card border border-border rounded-xl p-6 hover:shadow-lg hover:border-primary/20 transition-all">
            <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">⚡</span>
            </div>
            <h3 className="font-semibold text-foreground mb-2 text-lg">Focus Sessions</h3>
            <p className="text-muted-foreground">
              Pomodoro-style focus blocks that adapt to your rhythm. Work in harmony with your brain.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-card border border-border rounded-xl p-6 hover:shadow-lg hover:border-primary/20 transition-all">
            <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">🎮</span>
            </div>
            <h3 className="font-semibold text-foreground mb-2 text-lg">Gamified Rewards</h3>
            <p className="text-muted-foreground">
              Earn points, unlock achievements, and celebrate wins. Make productivity feel rewarding, not draining.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="bg-card border border-border rounded-xl p-6 hover:shadow-lg hover:border-primary/20 transition-all">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">😌</span>
            </div>
            <h3 className="font-semibold text-foreground mb-2 text-lg">Mood Tracking</h3>
            <p className="text-muted-foreground">
              Understand your emotional patterns. Connect your mood to tasks and find your optimal working times.
            </p>
          </div>

          {/* Feature 5 */}
          <div className="bg-card border border-border rounded-xl p-6 hover:shadow-lg hover:border-primary/20 transition-all">
            <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">🎯</span>
            </div>
            <h3 className="font-semibold text-foreground mb-2 text-lg">Hobby Tracker</h3>
            <p className="text-muted-foreground">
              Track your passions alongside your tasks. Balance productivity with the things that bring you joy.
            </p>
          </div>

          {/* Feature 6 */}
          <div className="bg-card border border-border rounded-xl p-6 hover:shadow-lg hover:border-primary/20 transition-all">
            <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">💬</span>
            </div>
            <h3 className="font-semibold text-foreground mb-2 text-lg">AI Chat Support</h3>
            <p className="text-muted-foreground">
              Your personal productivity coach. Get gentle reminders, motivation, and strategies whenever you need them.
            </p>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 bg-accent/5 rounded-2xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-4xl font-bold text-foreground mb-6">Made with care</h2>
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-primary font-bold">1</span>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">No guilt, no shame</h3>
                  <p className="text-muted-foreground">
                    We get it. You're not lazy, your brain works differently. BunnySteps meets you where you are.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-primary font-bold">2</span>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Dopamine-driven</h3>
                  <p className="text-muted-foreground">
                    Gamification isn't just fun—it's how our brains thrive. Get the motivation boost you need.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-primary font-bold">3</span>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Flexible & forgiving</h3>
                  <p className="text-muted-foreground">
                    Miss a day? Hyperfocus on one task? It's all okay. BunnySteps adapts to your rhythm.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-card border border-border rounded-2xl p-8">
            <div className="aspect-video bg-gradient-to-br from-primary/20 to-secondary/20 rounded-lg flex items-center justify-center">
              <span className="text-6xl">🎉</span>
            </div>
          </div>
        </div>
      </section>

  {/* CTA Section - also personalized */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <div className="bg-primary/10 border border-primary/20 rounded-2xl p-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            {isLoggedIn ? "Jump back in?" : "Ready to focus without pressure?"}
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            {isLoggedIn
              ? "Your space is waiting with all your tasks, habits, and rewards."
              : "Join our community in building better habits, one small step at a time."}
          </p>
          <Button asChild size="lg" className="bg-primary hover:bg-primary/90">
            <Link href={isLoggedIn ? "/dashboard" : "/register"}>
              {isLoggedIn ? "Go to your space" : "Start Your Free Journey"}
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer remains the same */}
      <footer className="border-t border-border mt-20 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between">
            <div className="flex items-center gap-2 mb-4 sm:mb-0">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold">
                🐰
              </div>
              <span className="font-semibold text-foreground">BunnySteps</span>
            </div>
            <p className="text-sm text-muted-foreground">Made with care for neurodivergent humans.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}