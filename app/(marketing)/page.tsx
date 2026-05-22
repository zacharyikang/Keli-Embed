import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Zap, BookOpen, Target, Brain, BarChart3, Star } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col items-center overflow-x-hidden min-h-screen bg-background relative">
      {/* Premium Cinematic Background */}
      <div className="fixed inset-0 -z-10 bg-grid-refined [mask-image:radial-gradient(ellipse_at_center,black,transparent)] opacity-40 dark:opacity-20" />
      <div className="fixed inset-0 -z-20 overflow-hidden pointer-events-none">
        {/* Dynamic Animated Blobs */}
        <div className="absolute top-[-10%] left-[-10%] size-[600px] rounded-full bg-brand/10 blur-[100px] animate-blob mix-blend-multiply dark:mix-blend-soft-light" />
        <div className="absolute top-[10%] right-[-5%] size-[500px] rounded-full bg-primary/10 blur-[120px] animate-blob [animation-delay:2s] mix-blend-multiply dark:mix-blend-soft-light" />
        <div className="absolute bottom-[-10%] left-[20%] size-[700px] rounded-full bg-secondary/20 blur-[140px] animate-blob [animation-delay:4s] mix-blend-multiply dark:mix-blend-soft-light" />
      </div>

      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center min-h-[75vh] px-6 py-12 text-center relative max-w-7xl mx-auto">
        <div className="animate-float mb-6">
          <div className="group relative">
            <div className="absolute inset-0 bg-brand/30 blur-xl rounded-full animate-pulse-glow group-hover:bg-brand/50 transition-all duration-700" />
            <div className="relative flex size-16 items-center justify-center rounded-2xl bg-foreground text-background font-black text-2xl shadow-2xl border border-white/10 backdrop-blur-sm">
              ES
            </div>
          </div>
        </div>

        <div className="animate-slide-up space-y-6 md:space-y-8">
          <div className="space-y-3 md:space-y-4">
             <span className="text-[10px] md:text-xs font-black uppercase tracking-[0.5em] text-brand/80 animate-pulse block">Advanced Laboratory System</span>
             <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-[5.5rem] font-black tracking-tighter leading-[1.05] text-foreground">
               嵌入式实验室 <br/>
               <span className="text-transparent bg-clip-text bg-gradient-to-b from-foreground via-foreground/90 to-foreground/20 italic block mt-2 md:mt-3">
                 Studio.
               </span>
             </h1>
          </div>
          
          <div className="flex flex-col items-center gap-6 md:gap-8">
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-muted-foreground font-black max-w-3xl mx-auto leading-tight tracking-tight px-6">
              EmbedStudio: <span className="text-foreground">嵌入式工程师的科学进阶之道</span>
            </p>
            
            <div className="flex items-center gap-3">
               <div className="h-[2px] w-10 bg-gradient-to-r from-transparent to-foreground/20" />
               <div className="size-1.5 rounded-full bg-brand shadow-[0_0_10px_var(--color-brand)]" />
               <div className="h-[2px] w-10 bg-gradient-to-l from-transparent to-foreground/20" />
            </div>
            
            <p className="text-xs md:text-sm lg:text-base text-muted-foreground/50 max-w-xl mx-auto leading-relaxed font-medium tracking-wide px-6">
              基于工业级 SRS 算法，深度覆盖 C 语言、MCU、RTOS、通信协议及 Linux 内核。
              <span className="block text-[9px] uppercase tracking-[0.3em] font-black mt-3 opacity-30">Industrial-Grade Learning Infrastructure</span>
            </p>
          </div>
        </div>


        <div className="mt-10 flex gap-4 flex-wrap justify-center animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <a
            href="/today"
            className={cn(
              buttonVariants({ size: "default" }),
              "bg-foreground text-background hover:bg-brand hover:text-black font-black px-10 h-12 rounded-full shadow-lg transition-all hover:scale-105 active:scale-95 text-base relative group overflow-hidden",
            )}
          >
            <span className="relative z-10">立即开启 Mastery</span>
            <div className="absolute inset-0 bg-brand translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out" />
          </a>
          <a
            href="/library"
            className={cn(
              buttonVariants({ variant: "outline", size: "default" }),
              "px-10 h-12 rounded-full glass glass-dark font-black transition-all hover:bg-foreground hover:text-background border-foreground/10 text-base",
            )}
          >
            浏览题库
          </a>
        </div>
      </section>

      {/* Bento Infrastructure Grid */}
      <section className="w-full max-w-7xl px-6 py-16 md:py-20 relative">
        <div className="absolute inset-0 -z-10 bg-foreground/[0.01] border-y border-foreground/5" />

        <div className="flex flex-col items-start mb-10 space-y-3 animate-slide-up">
          <div className="flex items-center gap-2">
             <div className="h-px w-6 bg-brand" />
             <span className="text-[9px] font-black uppercase tracking-[0.5em] text-brand">System Architecture</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-black tracking-tighter text-foreground">基础设施与核心架构.</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6 auto-rows-[280px] md:auto-rows-[320px]">
          {/* Main Intelligence - 8 Columns */}
          <div className="md:col-span-8 group relative overflow-hidden rounded-2xl border glass glass-dark p-6 md:p-8 flex flex-col justify-between hover:border-brand/40 transition-all duration-700 shadow-2xl hover:shadow-brand/5">
            <div className="space-y-4 relative z-10 max-w-lg">
              <div className="flex size-12 items-center justify-center rounded-xl bg-foreground text-background shadow-xl">
                <Brain className="size-6" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl md:text-3xl font-black tracking-tight text-foreground leading-[1.1]">自适应学习引擎</h3>
                <p className="text-muted-foreground leading-snug text-sm md:text-base font-medium">
                  针对复杂工程知识优化的 SM-2 算法，精准捕捉遗忘临界点，最大化技术记忆效率。
                </p>
              </div>
              <div className="flex items-center gap-3 text-[9px] font-black uppercase tracking-[0.2em] text-foreground/20">
                 <span>Optimized SM-2</span>
                 <div className="size-1 rounded-full bg-foreground/10" />
                 <span>Retention Max</span>
              </div>
            </div>
            {/* Visual background element */}
            <div className="absolute top-1/2 -right-20 -translate-y-1/2 size-96 bg-brand/5 blur-[80px] rounded-full group-hover:bg-brand/10 transition-all duration-700" />
            <Zap className="absolute -bottom-10 -right-10 size-64 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-700 rotate-12" />
          </div>

          {/* Coverage - 4 Columns */}
          <div className="md:col-span-4 group relative overflow-hidden rounded-2xl border glass glass-dark p-6 md:p-8 flex flex-col justify-between hover:border-brand/40 transition-all duration-700 shadow-2xl">
            <div className="flex size-12 items-center justify-center rounded-xl bg-brand/10 text-brand group-hover:bg-brand group-hover:text-black transition-colors duration-500">
              <BookOpen className="size-6" />
            </div>
            <div className="space-y-3">
              <h3 className="text-xl font-black tracking-tight leading-tight">全栈知识图谱</h3>
              <p className="text-xs md:text-sm text-muted-foreground font-medium leading-relaxed">
                覆盖从底层寄存器操作到 Linux 内核空间的完整知识体系。
              </p>
              <div className="h-1 w-10 bg-foreground/5 group-hover:w-full transition-all duration-700" />
            </div>
          </div>

          {/* Small Specialized Units */}
          <div className="md:col-span-4 group relative overflow-hidden rounded-2xl border glass glass-dark p-6 md:p-8 flex flex-col items-start justify-between hover:border-brand/40 transition-all duration-700 shadow-2xl">
            <div className="flex size-12 items-center justify-center rounded-xl bg-foreground/5 text-foreground/40 group-hover:bg-foreground group-hover:text-background transition-colors duration-500">
              <Target className="size-6" />
            </div>
            <div className="space-y-3">
              <h3 className="text-xl font-black tracking-tight leading-tight">薄弱环节诊断</h3>
              <p className="text-xs md:text-sm text-muted-foreground font-medium italic leading-relaxed">智能识别并隔离知识盲区，针对性补强。</p>
              <span className="text-[9px] font-black uppercase tracking-widest text-foreground/10 group-hover:text-brand transition-colors">Neural Isolation.</span>
            </div>
          </div>

          <div className="md:col-span-8 group relative overflow-hidden rounded-2xl border glass glass-dark p-6 md:p-8 flex items-center justify-between hover:border-brand/40 transition-all duration-700 shadow-2xl">
            <div className="space-y-4 max-w-md">
               <h3 className="text-2xl font-black tracking-tight leading-tight">多维数据看板</h3>
               <p className="text-muted-foreground font-medium text-xs md:text-sm leading-relaxed">高保真热力图与方向性进度分析，通过数据量化每一刻的技术成长。</p>
               <div className="flex gap-1.5">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-1 w-6 rounded-full bg-foreground/5 group-hover:bg-brand transition-all duration-700" style={{ transitionDelay: `${i*100}ms` }} />
                  ))}
               </div>
            </div>
            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-brand/5 text-brand shadow-[0_0_50px_-10px_var(--color-brand)] group-hover:scale-110 group-hover:bg-brand group-hover:text-black transition-all duration-700">
              <BarChart3 className="size-6" />
            </div>
          </div>
        </div>
      </section>

      {/* Corporate Social Proof */}
      <section className="w-full py-12 px-6 text-center space-y-8">
        <div className="space-y-1.5">
           <p className="text-[9px] font-black uppercase tracking-[0.6em] text-muted-foreground/30">Trusted Engineering Community</p>
           <div className="h-px w-24 mx-auto bg-gradient-to-r from-transparent via-foreground/10 to-transparent" />
        </div>
        <div className="flex flex-wrap justify-center gap-x-12 gap-y-6 grayscale opacity-20 hover:opacity-50 transition-all duration-1000">
           <span className="text-xl font-black tracking-tighter">华为技术</span>
           <span className="text-xl font-black tracking-tighter">大疆创新</span>
           <span className="text-xl font-black tracking-tighter">小米科技</span>
           <span className="text-xl font-black tracking-tighter">比亚迪</span>
           <span className="text-xl font-black tracking-tighter">海康威视</span>
        </div>
      </section>

      {/* CTA Final */}
      <section className="w-full max-w-6xl px-6 py-16 md:py-20 text-center">
        <div className="relative rounded-3xl bg-foreground text-background p-12 md:p-16 overflow-hidden shadow-[0_50px_120px_-30px_rgba(0,0,0,0.4)] group">
          <div className="absolute top-0 right-0 size-[500px] bg-brand/30 blur-[150px] animate-blob" />
          <div className="absolute bottom-0 left-0 size-[400px] bg-brand/10 blur-[120px] animate-blob [animation-delay:3s]" />
          
          <div className="relative z-10 space-y-6">
            <h2 className="text-4xl md:text-6xl font-black tracking-tighter leading-[0.95]">准备好 <br/>优化认知.</h2>
            <p className="text-base md:text-lg text-background/50 max-w-xs mx-auto font-medium leading-tight">
              加入嵌入式精英圈层，开启科学的技能演进之旅。
            </p>
            <div className="pt-4">
              <a
                href="/auth/sign-up"
                className={cn(
                  buttonVariants({ size: "default" }),
                  "bg-brand text-black hover:bg-brand-hover font-black px-10 h-12 rounded-full shadow-2xl transition-all hover:scale-110 active:scale-95 text-base",
                )}
              >
                免费注册账户
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full py-12 text-center relative border-t border-foreground/5 bg-foreground/[0.01]">
        <div className="flex justify-center gap-8 mb-8 text-[9px] font-black uppercase tracking-[0.4em] text-muted-foreground/30">
           <a href="#" className="hover:text-foreground hover:tracking-[0.6em] transition-all duration-500">Privacy</a>
           <a href="#" className="hover:text-foreground hover:tracking-[0.6em] transition-all duration-500">Terms</a>
           <a href="#" className="hover:text-foreground hover:tracking-[0.6em] transition-all duration-500">GITHUB</a>
        </div>
        <div className="space-y-2">
           <p className="text-sm text-muted-foreground/40 font-black tracking-[0.3em] uppercase">EmbedStudio © 2026</p>
           <p className="text-[9px] text-muted-foreground/20 font-black uppercase tracking-[1.2em]">Industrial Grade</p>
        </div>
      </footer>
    </div>
  );
}
