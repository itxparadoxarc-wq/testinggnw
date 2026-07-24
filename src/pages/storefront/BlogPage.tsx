import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { BookOpen, Calendar, ArrowRight } from 'lucide-react';

const BlogPage = () => {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('blog_posts').select('*').eq('status', 'published')
      .order('published_at', { ascending: false }).then(({ data }) => {
        setPosts(data || []);
        setLoading(false);
      });
  }, []);

  return (
    <div>
      {/* Hero */}
      <section className="bg-primary text-primary-foreground py-12 sm:py-16 lg:py-20">
        <div className="container-page text-center max-w-2xl mx-auto">
          <BookOpen className="h-10 w-10 mx-auto mb-4 opacity-80" />
          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl mb-3">Our Blog</h1>
          <p className="text-primary-foreground/70 text-sm sm:text-base">Style tips, fashion trends, and everything GrabnWear.</p>
        </div>
      </section>

      <div className="container-page py-10 sm:py-16">
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-video rounded-xl" />
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-full" />
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20 bg-card rounded-2xl border border-border">
            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-display text-xl mb-2">No Blog Posts Yet</h3>
            <p className="text-muted-foreground text-sm max-w-sm mx-auto">We're working on exciting content. Check back soon!</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map(post => (
              <Link key={post.id} to={`/blog/${post.slug}`} className="group">
                <div className="aspect-video bg-secondary rounded-xl overflow-hidden mb-4">
                  {post.featured_image_url ? (
                    <img src={post.featured_image_url} alt={post.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center">
                      <BookOpen className="h-10 w-10 text-primary/20" />
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                  {post.category && <span className="text-primary bg-primary/10 px-2 py-0.5 rounded-full font-medium">{post.category}</span>}
                  {post.published_at && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(post.published_at).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  )}
                </div>
                <h2 className="font-display text-lg group-hover:text-primary transition-colors mb-1">{post.title}</h2>
                {post.excerpt && <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{post.excerpt}</p>}
                <span className="text-xs text-primary font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                  Read More <ArrowRight className="h-3 w-3" />
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BlogPage;
