import type { BlogPost } from "@/data/blog-posts";
import { BRAND, SITE_URL } from "@/lib/constants";

export function blogIndexJsonLd(posts: BlogPost[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: posts.map((post, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: `${SITE_URL}${post.href}`,
      name: post.title,
    })),
  };
}

export function articleJsonLd(post: BlogPost & { seoDatePublished: string }) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    datePublished: post.seoDatePublished,
    description: post.excerpt,
    author: { "@type": "Person", name: BRAND.author },
    publisher: { "@type": "Organization", name: BRAND.name, url: SITE_URL },
    mainEntityOfPage: `${SITE_URL}${post.href}`,
  };
}
