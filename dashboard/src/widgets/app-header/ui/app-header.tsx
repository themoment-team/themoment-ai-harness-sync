'use client';

import Image from 'next/image';
import Link from 'next/link';

import { signOut, useSession } from 'next-auth/react';

import { ThemeToggle } from '@/features/theme';

export function AppHeader() {
  const { data: session, status } = useSession();
  const isGitHubAuthenticated = status === 'authenticated' && !session.githubTokenError;
  const profileUrl = session?.githubLogin ? `https://github.com/${session.githubLogin}` : undefined;

  return (
    <header className="border-border bg-bg/90 sticky top-0 z-50 border-b backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link
          href="/"
          className="text-fg hover:text-accent shrink-0 text-sm font-bold tracking-tight transition-colors"
        >
          AI Harness Sync
        </Link>
        <nav
          aria-label="주요 탐색"
          className="text-fg-muted hidden items-center gap-6 text-sm sm:flex"
        >
          <Link href="/" className="hover:text-fg transition-colors">
            대시보드
          </Link>
          <Link href="/guide" className="hover:text-fg transition-colors">
            가이드
          </Link>
        </nav>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          {isGitHubAuthenticated ? (
            <>
              <a
                href={profileUrl}
                target={profileUrl ? '_blank' : undefined}
                rel={profileUrl ? 'noreferrer' : undefined}
                className={profileUrl ? 'cursor-pointer' : undefined}
                aria-label={
                  profileUrl ? `${session.user?.name ?? 'GitHub'}의 GitHub 프로필 열기` : undefined
                }
              >
                {session.user?.image ? (
                  <Image
                    src={session.user.image}
                    alt={`${session.user?.name ?? 'GitHub'}의 GitHub 프로필 사진`}
                    width={32}
                    height={32}
                    className="border-border size-8 rounded-full border object-cover"
                  />
                ) : (
                  <span
                    className="bg-bg-subtle text-fg-muted flex size-8 items-center justify-center rounded-full text-xs font-semibold"
                    aria-label={`${session.user?.name ?? 'GitHub'}의 GitHub 프로필 사진`}
                  >
                    {(session.user?.name ?? 'G').slice(0, 1).toUpperCase()}
                  </span>
                )}
              </a>
              <button
                type="button"
                onClick={() => void signOut({ callbackUrl: '/' })}
                className="border-border text-fg hover:bg-bg-subtle cursor-pointer rounded border px-3 py-1.5 text-sm font-medium transition-colors"
              >
                로그아웃
              </button>
            </>
          ) : status !== 'loading' ? (
            <Link
              href="/api/auth/signin/github?callbackUrl=/"
              className="border-border text-fg hover:bg-bg-subtle cursor-pointer rounded border px-3 py-1.5 text-sm font-medium transition-colors"
            >
              GitHub 로그인
            </Link>
          ) : (
            <span className="inline-block h-9 w-28" aria-hidden />
          )}
        </div>
      </div>
    </header>
  );
}
