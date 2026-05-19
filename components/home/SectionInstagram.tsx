'use client';
import { useEffect, useRef, useState } from 'react';
import { Reveal } from '@/components/ui/Reveal';

type IgPost = {
  id: string;
  thumbnail_url: string | null;
  media_url: string | null;
  permalink: string;
  caption: string;
  timestamp: string;
};

function timeAgo(ts: string): string {
  const diff = (Date.now() - new Date(ts).getTime()) / 1000;
  if (diff < 3600)  return `il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)} h`;
  return `il y a ${Math.floor(diff / 86400)} j`;
}

function ReelCard({ post, index }: { post: IgPost; index: number }) {
  const [hov, setHov] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  function handleEnter() {
    setHov(true);
    if (videoRef.current) videoRef.current.play().catch(() => {});
  }
  function handleLeave() {
    setHov(false);
    if (videoRef.current) { videoRef.current.pause(); videoRef.current.currentTime = 0; }
  }

  return (
    <Reveal delay={index * 0.1}>
      <a
        href={post.permalink}
        target="_blank"
        rel="noopener noreferrer"
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
        style={{
          display: 'block', textDecoration: 'none',
          borderRadius: 16, overflow: 'hidden',
          border: '1px solid #e2e8f0',
          boxShadow: hov ? '0 20px 56px rgba(232,24,90,0.10)' : '0 2px 8px rgba(0,0,0,0.04)',
          transform: hov ? 'translateY(-6px)' : 'none',
          transition: 'all 0.35s cubic-bezier(0.16,1,0.3,1)',
          background: '#fff',
        }}
      >
        {/* Thumbnail */}
        <div style={{ position: 'relative', aspectRatio: '4/5', background: '#f0f0f4', overflow: 'hidden' }}>
          {post.thumbnail_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={post.thumbnail_url}
              alt={post.caption || 'Reel Instagram'}
              style={{ width: '100%', height: '100%', objectFit: 'cover',
                transform: hov ? 'scale(1.04)' : 'scale(1)',
                transition: 'transform 0.5s ease' }}
            />
          ) : (
            <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg,#f9d3e0,#e8eaf8)' }} />
          )}
          {post.media_url && (
            <video
              ref={videoRef}
              src={post.media_url}
              muted
              loop
              playsInline
              style={{
                position: 'absolute', inset: 0,
                width: '100%', height: '100%', objectFit: 'cover',
                opacity: hov ? 1 : 0,
                transition: 'opacity 0.3s ease',
              }}
            />
          )}

          {/* Gradient + play overlay */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 50%)',
          }} />

          {/* Reels icon top-right */}
          <div style={{
            position: 'absolute', top: 12, right: 12,
            background: 'rgba(0,0,0,0.45)', borderRadius: 8, padding: '4px 8px',
            display: 'flex', alignItems: 'center', gap: 4,
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
            </svg>
            <span style={{ color: '#fff', fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-body)' }}>Reel</span>
          </div>

          {/* Time bottom-left */}
          <span style={{
            position: 'absolute', bottom: 10, left: 12,
            color: 'rgba(255,255,255,0.85)', fontSize: 11, fontFamily: 'var(--font-body)',
          }}>
            {timeAgo(post.timestamp)}
          </span>
        </div>

        {/* Caption */}
        <div style={{ padding: '14px 16px 16px' }}>
          {post.caption ? (
            <p style={{
              fontSize: 13, color: '#374151', fontFamily: 'var(--font-body)',
              lineHeight: 1.5, margin: 0,
              display: '-webkit-box', WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical', overflow: 'hidden',
            }}>
              {post.caption}
            </p>
          ) : (
            <p style={{ fontSize: 13, color: '#9ca3af', fontFamily: 'var(--font-body)', margin: 0, fontStyle: 'italic' }}>
              Voir le reel
            </p>
          )}
          <div style={{
            marginTop: 10, display: 'flex', alignItems: 'center', gap: 5,
            fontSize: 12, fontWeight: 700, color: '#E8185A', fontFamily: 'var(--font-body)',
            opacity: hov ? 1 : 0.6,
            transition: 'opacity 0.3s ease',
          }}>
            <span>Voir sur Instagram</span>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 17L17 7M17 7H7M17 7v10"/>
            </svg>
          </div>
        </div>
      </a>
    </Reveal>
  );
}

function SkeletonCard({ index }: { index: number }) {
  return (
    <Reveal delay={index * 0.1}>
      <div style={{
        borderRadius: 16, overflow: 'hidden', border: '1px solid #e2e8f0',
        background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      }}>
        <div style={{ aspectRatio: '4/5', background: 'linear-gradient(90deg,#f0f0f4 25%,#e8e8ec 50%,#f0f0f4 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />
        <div style={{ padding: '14px 16px 16px' }}>
          <div style={{ height: 13, borderRadius: 6, background: '#f0f0f4', marginBottom: 8 }} />
          <div style={{ height: 13, borderRadius: 6, background: '#f0f0f4', width: '70%' }} />
        </div>
      </div>
    </Reveal>
  );
}

const FUNCTION_URL = process.env.NEXT_PUBLIC_INSTAGRAM_FUNCTION_URL || '';
const IG_HANDLE   = process.env.NEXT_PUBLIC_INSTAGRAM_HANDLE || '@surprisez.vous';

export function SectionInstagram() {
  const [posts, setPosts]     = useState<IgPost[] | null>(null);
  const [error, setError]     = useState(false);

  useEffect(() => {
    if (!FUNCTION_URL) { setError(true); return; }
    fetch(FUNCTION_URL)
      .then(r => r.json())
      .then(d => setPosts(d.posts || []))
      .catch(() => setError(true));
  }, []);

  const loading = posts === null && !error;
  const noData  = error || (posts && posts.length === 0);

  return (
    <section style={{ background: '#fafbfc', padding: '80px 32px' }}>
      <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <Reveal>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 48, flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div style={{ fontSize: 12, fontFamily: 'var(--font-body)', fontWeight: 700, color: '#E8185A', textTransform: 'uppercase', letterSpacing: 3, marginBottom: 8 }}>
                Instagram
              </div>
              <h2 style={{ fontSize: 36, fontFamily: 'var(--font-heading)', fontWeight: 900, color: '#1e2a35', margin: 0 }}>
                Nos derniers Reels
              </h2>
            </div>
            <a
              href={`https://www.instagram.com/${IG_HANDLE.replace('@', '')}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: 'linear-gradient(135deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)',
                color: '#fff', fontFamily: 'var(--font-body)', fontWeight: 700,
                fontSize: 13, padding: '10px 20px', borderRadius: 100,
                textDecoration: 'none',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
              Suivre {IG_HANDLE}
            </a>
          </div>
        </Reveal>

        {noData ? (
          <Reveal>
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#9ca3af', fontFamily: 'var(--font-body)', fontSize: 14 }}>
              Feed Instagram non configuré.
            </div>
          </Reveal>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 24 }}>
            {loading
              ? [0, 1, 2].map(i => <SkeletonCard key={i} index={i} />)
              : posts!.map((p, i) => <ReelCard key={p.id} post={p} index={i} />)
            }
          </div>
        )}
      </div>
    </section>
  );
}
