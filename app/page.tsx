import Link from "next/link";
import React from "react";
import { Show, UserButton } from "@clerk/nextjs";

// Встроенные SVG-иконки, чтобы не требовались внешние библиотеки (например, lucide-react)
const ZapIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z" />
  </svg>
);

const ArrowRightIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
  </svg>
);

const PlaySquareIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="18" height="18" x="3" y="3" rx="2" /><path d="m9 8 6 4-6 4Z" />
  </svg>
);

const VideoIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5" /><rect x="2" y="6" width="14" height="12" rx="2" ry="2" />
  </svg>
);

const YoutubeIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
    <path d="m10 15 5-3-5-3z" />
  </svg>
);

const ShareIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
    <line x1="8.59" x2="15.42" y1="13.51" y2="17.49" /><line x1="15.41" x2="8.59" y1="6.51" y2="10.49" />
  </svg>
);

const MailIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
);

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-50 font-sans selection:bg-purple-500/30">
      {/* Навигационная панель */}
      <header className="fixed top-0 w-full border-b border-white/10 bg-slate-950/80 backdrop-blur-md z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl tracking-tighter">
            <ZapIcon className="w-6 h-6 text-purple-500" />
            <span>Shorts<span className="text-purple-400">Gen</span></span>
          </div>
          <nav className="hidden md:flex gap-8 text-sm font-medium text-slate-300">
            <Link href="#features" className="hover:text-white transition-colors">Преимущества</Link>
            <Link href="#how-it-works" className="hover:text-white transition-colors">Как это работает</Link>
            <Link href="#pricing" className="hover:text-white transition-colors">Тарифы</Link>
          </nav>
          <div className="flex items-center gap-4">
            <Show when="signed-out">
              <>
                <Link href="/sign-in" className="text-sm font-medium hover:text-white transition-colors hidden sm:block">
                  Войти
                </Link>
                <Link href="/sign-up" className="bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium px-4 py-2 rounded-full transition-all">
                  Начать бесплатно
                </Link>
              </>
            </Show>
            <Show when="signed-in">
              <UserButton />
            </Show>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Главная секция (Hero Section) */}
        <section className="pt-32 pb-20 md:pt-48 md:pb-32 px-4 relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-purple-600/20 rounded-full blur-[120px] -z-10 pointer-events-none" />

          <div className="container mx-auto max-w-5xl text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-purple-500/30 text-purple-300 text-sm font-medium mb-8">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
              </span>
              Лучший SaaS инструмент для генерации видео 2026 года
            </div>

            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 leading-tight">
              Создавайте вирусные короткие видео с{" "}
              <span className="bg-gradient-to-r from-purple-400 to-blue-500 bg-clip-text text-transparent">
                Помощью ИИ
              </span>
            </h1>

            <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
              Превращайте обычный текст в захватывающие короткие видеоролики за считанные секунды. Автоматическая выкладка в TikTok, YouTube Shorts, VK Клипы и рассылки по Email.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/dashboard" className="w-full sm:w-auto flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-8 py-4 rounded-full font-semibold text-lg transition-all hover:scale-105 active:scale-95 shadow-[0_0_40px_-10px_rgba(168,85,247,0.5)]">
                Создать видео
                <ArrowRightIcon className="w-5 h-5" />
              </Link>
              <Link href="#demo" className="w-full sm:w-auto flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-8 py-4 rounded-full font-semibold text-lg transition-all">
                Смотреть демо
                <PlaySquareIcon className="w-5 h-5 text-slate-400" />
              </Link>
            </div>
          </div>
        </section>

        {/* Секция интеграций */}
        <section id="features" className="py-24 bg-slate-900/50 relative border-y border-white/5">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
                Автопубликация видео везде
              </h2>
              <p className="text-slate-400 text-lg max-w-2xl mx-auto">
                Создайте видео один раз, и наш умный ИИ автоматически оптимизирует и выложит его на все популярные платформы.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* TikTok */}
              <div className="bg-slate-900 p-8 rounded-3xl border border-white/5 hover:border-pink-500/30 transition-colors group">
                <div className="w-14 h-14 bg-pink-500/10 rounded-2xl flex items-center justify-center mb-6 text-pink-400 group-hover:scale-110 transition-transform">
                  <VideoIcon className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold mb-2">TikTok</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Идеальные вертикальные 9:16 видео с автогенерацией трендовых хэштегов.
                </p>
              </div>

              {/* YouTube Shorts */}
              <div className="bg-slate-900 p-8 rounded-3xl border border-white/5 hover:border-red-500/30 transition-colors group">
                <div className="w-14 h-14 bg-red-500/10 rounded-2xl flex items-center justify-center mb-6 text-red-500 group-hover:scale-110 transition-transform">
                  <YoutubeIcon className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold mb-2">YouTube Shorts</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Постоянный органический трафик на ваш канал через короткие ролики.
                </p>
              </div>

              {/* VK Video */}
              <div className="bg-slate-900 p-8 rounded-3xl border border-white/5 hover:border-blue-500/30 transition-colors group">
                <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-6 text-blue-500 group-hover:scale-110 transition-transform">
                  <ShareIcon className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold mb-2">VK Клипы</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Автоматическая загрузка видео в крупнейшую социальную сеть рунета (ВКонтакте).
                </p>
              </div>

              {/* Email */}
              <div className="bg-slate-900 p-8 rounded-3xl border border-white/5 hover:border-emerald-500/30 transition-colors group">
                <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-6 text-emerald-500 group-hover:scale-110 transition-transform">
                  <MailIcon className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold mb-2">Email Рассылки</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Мгновенная отправка сгенерированных видео-сводок и новостей вашим клиентам.
                </p>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* Футер */}
      <footer className="bg-slate-950 py-12 border-t border-white/10 mt-auto">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            <div className="col-span-1 md:col-span-1">
              <div className="flex items-center gap-2 font-bold text-xl tracking-tighter mb-4">
                <ZapIcon className="w-6 h-6 text-purple-500" />
                <span>Shorts<span className="text-purple-400">Gen</span></span>
              </div>
              <p className="text-slate-400 text-sm mb-6">
                Ведущая SaaS-платформа для создания и дистрибуции коротких AI-видео для бизнеса и блогеров.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-white">Продукт</h4>
              <ul className="space-y-3 text-sm text-slate-400">
                <li><Link href="#" className="hover:text-purple-400 transition-colors">Генератор Видео</Link></li>
                <li><Link href="#" className="hover:text-purple-400 transition-colors">Все интеграции</Link></li>
                <li><Link href="#" className="hover:text-purple-400 transition-colors">Цены</Link></li>
                <li><Link href="#" className="hover:text-purple-400 transition-colors">API Доступ</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-white">Ресурсы</h4>
              <ul className="space-y-3 text-sm text-slate-400">
                <li><Link href="#" className="hover:text-purple-400 transition-colors">Документация</Link></li>
                <li><Link href="#" className="hover:text-purple-400 transition-colors">Блог ИИ</Link></li>
                <li><Link href="#" className="hover:text-purple-400 transition-colors">Видеоуроки</Link></li>
                <li><Link href="#" className="hover:text-purple-400 transition-colors">Служба поддержки</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-white">Правовая информация</h4>
              <ul className="space-y-3 text-sm text-slate-400">
                <li><Link href="#" className="hover:text-purple-400 transition-colors">Политика конфиденциальности</Link></li>
                <li><Link href="#" className="hover:text-purple-400 transition-colors">Пользовательское соглашение</Link></li>
                <li><Link href="#" className="hover:text-purple-400 transition-colors">Cookies</Link></li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-white/10 text-sm text-slate-500">
            <p>© 2026 ShortsGen Inc. Все права защищены.</p>
            <div className="flex gap-4 mt-4 md:mt-0">
              <Link href="#" className="hover:text-white transition-colors">VK</Link>
              <Link href="#" className="hover:text-white transition-colors">Telegram</Link>
              <Link href="#" className="hover:text-white transition-colors">YouTube</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
