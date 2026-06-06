import React from 'react';
import Link from 'next/link';
import { db } from '@/lib/db';
import { blogPosts } from '@/lib/db/schema';
import { desc, eq } from 'drizzle-orm';
import { Calendar, ArrowRight, BookOpen } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'The Stormo Blog | Marketing Tactics for Ecommerce Store Owners',
  description: 'Discover actionable marketing guides, organic growth strategies, micro-influencer outreach tips, and tactics to get your first 100 ecommerce customers.',
};

export default async function BlogListingPage() {
  // Fetch published posts
  const posts = await db
    .select({
      id: blogPosts.id,
      slug: blogPosts.slug,
      title: blogPosts.title,
      excerpt: blogPosts.excerpt,
      publishedAt: blogPosts.publishedAt,
      ogImageUrl: blogPosts.ogImageUrl,
    })
    .from(blogPosts)
    .where(eq(blogPosts.published, true))
    .orderBy(desc(blogPosts.publishedAt));

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {/* Blog Header */}
      <div className="text-center max-w-3xl mx-auto mb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-tint text-primary text-xs font-semibold uppercase tracking-wider mb-4">
          <BookOpen className="h-3.5 w-3.5" />
          Resources & Guides
        </div>
        <h1 className="text-4xl sm:text-5xl font-black text-dark tracking-tight mb-4">
          The Stormo Blog
        </h1>
        <p className="text-subtle text-lg sm:text-xl leading-relaxed">
          Marketing tactics for ecommerce store owners
        </p>
      </div>

      {/* Blog Post Grid */}
      {posts.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center max-w-md mx-auto border border-gray-100">
          <p className="text-subtle text-base font-medium">No blog posts available at the moment. Check back soon!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8 lg:gap-10">
          {posts.map((post) => {
            const formattedDate = post.publishedAt
              ? new Date(post.publishedAt).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })
              : 'Recently published';

            return (
              <article
                key={post.id}
                className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-150 flex flex-col justify-between transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg"
              >
                <div>
                  {/* Thumbnail */}
                  {post.ogImageUrl && (
                    <div className="relative h-56 w-full overflow-hidden bg-gray-100">
                      <img
                        src={post.ogImageUrl || undefined}
                        alt={post.title || ''}
                        className="object-cover w-full h-full"
                        loading="lazy"
                      />
                    </div>
                  )}

                  {/* Card Content */}
                  <div className="p-6 sm:p-8 space-y-4">
                    <div className="flex items-center gap-2 text-xs font-medium text-subtle">
                      <Calendar className="h-4 w-4 text-primary" />
                      <time dateTime={post.publishedAt?.toISOString()}>{formattedDate}</time>
                    </div>

                    <h2 className="text-2xl font-bold text-dark tracking-tight leading-snug hover:text-primary transition-colors">
                      <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                    </h2>

                    <p className="text-subtle text-sm leading-relaxed line-clamp-3">
                      {post.excerpt}
                    </p>
                  </div>
                </div>

                <div className="p-6 sm:p-8 pt-0 border-t border-gray-100/50">
                  <Link
                    href={`/blog/${post.slug}`}
                    className="inline-flex items-center gap-2 text-primary hover:text-[#C4531A] font-semibold text-sm transition-colors group"
                    style={{ minHeight: '44px' }}
                  >
                    Read Full Article
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
