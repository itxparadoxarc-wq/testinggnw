import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const BlogPostPage = () => {
  const { slug } = useParams();
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    supabase.from('blog_posts').select('*').eq('slug', slug).eq('status', 'published').maybeSingle()
      .then(({ data }) => { setPost(data); setLoading(false); });
  }, [slug]);

  if (loading) return <div className="container-page py-16"><div className="h-40 bg-secondary rounded-lg animate-pulse" /></div>;
  if (!post) return <div className="container-page py-16 text-center"><p>Post not found.</p></div>;

  return (
    <div className="container-page py-8 max-w-3xl mx-auto">
      <Link to="/blog" className="text-sm text-accent hover:underline mb-4 inline-block">← Back to Blog</Link>
      {post.featured_image_url && (
        <div className="aspect-video bg-secondary rounded-lg overflow-hidden mb-6">
          <img src={post.featured_image_url} alt={post.title} className="w-full h-full object-cover" />
        </div>
      )}
      <p className="text-sm text-muted-foreground mb-2">
        {post.category && <span className="text-accent">{post.category}</span>}
        {post.published_at && <span> · {new Date(post.published_at).toLocaleDateString()}</span>}
      </p>
      <h1 className="font-display text-3xl mb-6">{post.title}</h1>
      {post.content_html ? (
        <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: post.content_html }} />
      ) : (
        <p className="text-muted-foreground">No content.</p>
      )}
    </div>
  );
};

export default BlogPostPage;
