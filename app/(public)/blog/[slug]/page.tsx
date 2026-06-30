import React from 'react';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { blogPosts } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import ReactMarkdown from 'react-markdown';
import { Calendar, Share2, ArrowLeft, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const [post] = await db
    .select({
      metaTitle: blogPosts.metaTitle,
      metaDescription: blogPosts.metaDescription,
      ogImageUrl: blogPosts.ogImageUrl,
      title: blogPosts.title,
      excerpt: blogPosts.excerpt,
    })
    .from(blogPosts)
    .where(eq(blogPosts.slug, slug));

  if (!post) {
    return {};
  }

  return {
    title: post.metaTitle || `${post.title} | Stormo Blog`,
    description: post.metaDescription || post.excerpt,
    openGraph: {
      title: post.metaTitle || post.title,
      description: post.metaDescription || post.excerpt,
      images: post.ogImageUrl ? [{ url: post.ogImageUrl }] : [],
      type: 'article',
      url: `https://stormo.io/blog/${slug}`,
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;

  const [post] = await db
    .select()
    .from(blogPosts)
    .where(eq(blogPosts.slug, slug));

  if (!post || !post.published) {
    notFound();
  }

  const postUrl = `https://stormo.io/blog/${post.slug}`;
  const formattedDate = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Recently published';

  // Split content to insert mid-post CTA
  const content = post.content || '';
  const blocks = content.split('\n\n');
  const midIndex = Math.floor(blocks.length / 2);
  const firstHalf = blocks.slice(0, midIndex).join('\n\n');
  const secondHalf = blocks.slice(midIndex).join('\n\n');

  // CTA Component
  const CtaBanner = () => (
    <div className="my-10 bg-gradient-to-r from-primary to-[#ff7e36] text-white rounded-2xl p-6 sm:p-8 shadow-lg border-b-4 border-[#C4531A] text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-6">
      <div>
        <h3 className="text-xl sm:text-2xl font-black tracking-tight">
          Ready to get your first customers?
        </h3>
        <p className="text-white/90 text-sm mt-1 max-w-md">
          Start for $9 — get your daily automated marketing roadmap and grow your store without ads.
        </p>
      </div>
      <a
        href="/register"
        className="bg-white text-primary hover:bg-orange-tint font-bold px-6 py-3 rounded-lg shadow-md transition-colors flex-shrink-0 flex items-center justify-center gap-1.5 whitespace-nowrap"
        style={{ minHeight: '44px' }}
      >
        Start for $9
        <ArrowUpRight className="h-4 w-4" />
      </a>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-16">
      {/* Back button */}
      <div className="mb-8">
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 text-sm font-semibold text-subtle hover:text-primary transition-colors group"
          style={{ minHeight: '44px' }}
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Back to all articles
        </Link>
      </div>

      <article className="bg-white rounded-3xl p-6 sm:p-12 shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-gray-100/50">
        {/* Header */}
      <header className="space-y-4 mb-8">
        <div className="flex items-center gap-2 text-xs font-semibold text-subtle">
          <Calendar className="h-4 w-4 text-primary" />
          <time dateTime={post.publishedAt?.toISOString()}>{formattedDate}</time>
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-dark tracking-tight leading-tight">
          {post.title}
        </h1>
        <p className="text-subtle text-base sm:text-lg leading-relaxed border-l-3 border-primary pl-4 py-1">
          {post.excerpt}
        </p>
      </header>

      {/* Hero Image */}
      {post.ogImageUrl && (
        <div className="relative h-64 sm:h-96 w-full rounded-2xl overflow-hidden mb-10 shadow-md">
          <img
            src={post.ogImageUrl || undefined}
            alt={post.title || ''}
            className="object-cover w-full h-full"
            loading="eager"
            fetchPriority="high"
          />
        </div>
      )}

      {/* Share Actions */}
      <div className="flex flex-wrap items-center gap-4 py-4 border-y border-gray-200 mb-8 text-xs font-semibold text-subtle">
        <span className="flex items-center gap-1.5 uppercase tracking-wider">
          <Share2 className="h-4 w-4 text-primary" /> Share this article:
        </span>
        <div className="flex gap-2">
          <a
            href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(postUrl)}&text=${encodeURIComponent(post.title || '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 bg-gray-100 hover:bg-orange-tint hover:text-primary rounded-lg transition-colors"
            title="Share on Twitter"
            style={{ minWidth: '40px', minHeight: '40px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
          </a>
          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(postUrl)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 bg-gray-100 hover:bg-orange-tint hover:text-primary rounded-lg transition-colors"
            title="Share on Facebook"
            style={{ minWidth: '40px', minHeight: '40px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
              <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c4.56-.93 8-4.96 8-9.75z"/>
            </svg>
          </a>
          <a
            href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(postUrl)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 bg-gray-100 hover:bg-orange-tint hover:text-primary rounded-lg transition-colors"
            title="Share on LinkedIn"
            style={{ minWidth: '40px', minHeight: '40px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
              <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
            </svg>
          </a>
        </div>
      </div>

      {/* Article Content with CTA Banners */}
      <div className="prose prose-orange max-w-none prose-headings:text-dark prose-headings:font-bold prose-p:text-dark/95 prose-p:leading-relaxed prose-li:text-dark/95">
        <ReactMarkdown>{firstHalf}</ReactMarkdown>
        
        {/* Mid-post CTA */}
        <CtaBanner />

        <ReactMarkdown>{secondHalf}</ReactMarkdown>
        
        {/* End-of-post CTA */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <CtaBanner />
        </div>
      </div>
    </article>
  </div>
  );
}
