
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, ExternalLink, Heart, Download, Loader2, Search as SearchIcon } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useState, useMemo } from "react";
import { BookmarkButton } from "@/components/resources/BookmarkButton";
import { useBookmarks } from "@/hooks/useBookmarks";
import { ResourceDetailDrawer } from "@/components/resources/ResourceDetailDrawer";

type Resource = {
  id: string;
  title: string;
  description: string;
  image_url?: string;
  category?: string | null;
  url?: string | null;
  type: string;
  is_featured: boolean;
  order_index: number;
  content_html?: string | null;
};

const ResourcesPage = () => {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [openDrawer, setOpenDrawer] = useState(false);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);

  const { data: resources, isLoading, error } = useQuery({
    queryKey: ['resources'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('resources')
        .select('*')
        .order('order_index', { ascending: true });
      
      if (error) throw error;
      return data as Resource[];
    }
  });

  const { bookmarkedIds } = useBookmarks();

  const categories = useMemo(() => {
    const list = Array.from(new Set((resources || []).map(r => r.category).filter(Boolean))) as string[];
    return ["all", ...list.map(s => s!.toLowerCase())];
  }, [resources]);

  const byType = useMemo(() => {
    const list = (resources || []).filter(r => {
      const matchesCategory = category === "all" || (r.category || "").toLowerCase() === category;
      const q = search.trim().toLowerCase();
      const matchesSearch = !q || r.title.toLowerCase().includes(q) || r.description.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
    return {
      featuredArticles: list.filter(r => r.is_featured && r.type === 'article'),
      externalResources: list.filter(r => r.type === 'external'),
      downloadableGuides: list.filter(r => r.type === 'download'),
      favorites: list.filter(r => bookmarkedIds.has(r.id)),
    };
  }, [resources, search, category, bookmarkedIds]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-powder-blue" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Failed to load resources</p>
          <Button 
            variant="outline" 
            onClick={() => window.location.reload()}
            className="mt-4"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  const getReadTime = (title: string) => {
    if (title.includes('Resilience')) return '8 min read';
    if (title.includes('Self-Compassion')) return '5 min read';
    if (title.includes('Boundaries')) return '10 min read';
    return '6 min read';
  };

  const getCategoryIcon = (type: string) => {
    switch (type) {
      case 'download':
        return <Download className="w-6 h-6 text-powder-blue" />;
      case 'external':
        return <ExternalLink className="w-4 h-4" />;
      default:
        return <Heart className="w-5 h-5 mr-2 text-powder-blue" />;
    }
  };

  const handleOpen = (res: Resource) => {
    setSelectedResource(res);
    setOpenDrawer(true);
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <header className="bg-card/50 backdrop-blur-sm border-b border-powder-blue/20 px-6 py-4" role="banner">
        <div className="flex items-center space-x-3">
          <BookOpen className="w-8 h-8 text-powder-blue" aria-hidden="true" />
          <div>
            <h1 className="font-heading text-2xl text-deep-green">Resources</h1>
            <p className="font-body text-sm text-muted-foreground">
              Helpful articles, guides, and external resources for your wellbeing journey
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8" role="main">
        {/* Filters */}
        <section className="flex flex-col gap-3 mb-6" aria-labelledby="filters-heading">
          <h2 id="filters-heading" className="sr-only">Filter and search resources</h2>
          <div className="relative">
            <SearchIcon className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <Input
              placeholder="Search resources..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
              aria-label="Search through available resources"
              role="searchbox"
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            {categories.map((cat) => (
              <Button
                key={cat}
                variant={category === cat ? "default" : "outline"}
                size="sm"
                className={
                  category === cat
                    ? "bg-powder-blue text-white"
                    : "border-powder-blue/30 text-muted-foreground"
                }
                onClick={() => setCategory(cat)}
              >
                {cat === "all" ? "All" : cat.charAt(0).toUpperCase() + cat.slice(1)}
              </Button>
            ))}
          </div>
        </section>

        {/* Favorites */}
        {byType.favorites.length > 0 && (
          <section className="mb-8" aria-labelledby="favorites-heading">
            <h2 id="favorites-heading" className="font-heading text-2xl text-deep-green mb-2">Your Favorites</h2>
            <p className="text-sm text-muted-foreground mb-4">Quick access to your bookmarked resources</p>
            <div className="grid gap-4">
              {byType.favorites.map((res) => (
                <Card key={res.id} className="border-powder-blue/20 hover:bg-powder-blue/5 transition-gentle">
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-heading text-lg text-deep-green truncate">{res.title}</h3>
                          {res.category && (
                            <Badge variant="outline" className="text-xs border-powder-blue/30">
                              {res.category}
                            </Badge>
                          )}
                        </div>
                        <p className="font-body text-sm text-muted-foreground line-clamp-2 mt-1">
                          {res.description}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <BookmarkButton resourceId={res.id} />
                        {res.type === "external" ? (
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="border-powder-blue/30 text-powder-blue hover:bg-powder-blue/10"
                            onClick={() => res.url && window.open(`https://${res.url}`, '_blank')}
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        ) : (
                          <Button variant="ghost" size="sm" className="text-powder-blue" onClick={() => handleOpen(res)}>
                            Read
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        <div className="space-y-8">
          {/* Featured Articles */}
          {byType.featuredArticles.length > 0 && (
            <section aria-labelledby="featured-heading">
              <h2 id="featured-heading" className="font-heading text-2xl text-deep-green mb-4">Featured Articles</h2>
              <div className="grid gap-6">
                {byType.featuredArticles.map((article) => (
                  <Card key={article.id} className="border-powder-blue/20 hover:shadow-warm transition-gentle cursor-pointer">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="font-heading text-lg text-deep-green mb-2">
                            {article.title}
                          </CardTitle>
                          <CardDescription className="font-body text-muted-foreground">
                            {article.description}
                          </CardDescription>
                        </div>
                        <BookmarkButton resourceId={article.id} />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          {article.category && (
                            <span className="bg-powder-blue/10 text-powder-blue px-2 py-1 rounded-md font-body">
                              {article.category}
                            </span>
                          )}
                          <span className="font-body">{getReadTime(article.title)}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-powder-blue hover:text-deep-green"
                          onClick={() => handleOpen(article)}
                        >
                          Read More
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {/* External Resources */}
          {byType.externalResources.length > 0 && (
            <section aria-labelledby="external-heading">
              <h2 id="external-heading" className="font-heading text-2xl text-deep-green mb-4">Trusted External Resources</h2>
              <div className="grid gap-4">
                {byType.externalResources.map((resource) => (
                  <Card key={resource.id} className="border-powder-blue/20 hover:bg-powder-blue/5 transition-gentle">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="font-heading text-lg text-deep-green">{resource.title}</h3>
                            {resource.category && (
                              <span className="bg-muted-gold/10 text-muted-gold px-2 py-1 rounded-md text-xs font-body">
                                {resource.category}
                              </span>
                            )}
                          </div>
                          <p className="font-body text-muted-foreground mb-2">{resource.description}</p>
                          {resource.url && (
                            <p className="font-body text-sm text-powder-blue">{resource.url}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <BookmarkButton resourceId={resource.id} />
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="border-powder-blue/30 text-powder-blue hover:bg-powder-blue/10"
                            onClick={() => resource.url && window.open(`https://${resource.url}`, '_blank')}
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {/* Downloadable Guides */}
          {byType.downloadableGuides.length > 0 && (
            <section aria-labelledby="guides-heading">
              <h2 id="guides-heading" className="font-heading text-2xl text-deep-green mb-4">Downloadable Guides</h2>
              <div className="space-y-4">
                {byType.downloadableGuides.map((guide) => (
                  <Card key={guide.id} className="bg-gradient-warm border-powder-blue/20">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="font-heading text-xl text-deep-green flex items-center">
                            {getCategoryIcon(guide.type)}
                            {guide.title}
                          </CardTitle>
                          <CardDescription className="font-body">
                            {guide.description}
                          </CardDescription>
                        </div>
                        <BookmarkButton resourceId={guide.id} />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-powder-blue/20 rounded-lg flex items-center justify-center">
                            <Download className="w-6 h-6 text-powder-blue" />
                          </div>
                          <div>
                            <p className="font-body text-sm text-muted-foreground">PDF • 24 pages</p>
                            <p className="font-body text-sm text-deep-green">Free download</p>
                          </div>
                        </div>
                        <Button className="bg-gradient-primary hover:opacity-90 text-white">
                          Download Guide
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {/* Empty state if no results after filtering */}
          {byType.featuredArticles.length === 0 &&
            byType.externalResources.length === 0 &&
            byType.downloadableGuides.length === 0 && (
              <Card className="border-powder-blue/20">
                <CardContent className="py-12 text-center">
                  <SearchIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-heading text-lg text-deep-green mb-2">No resources found</h3>
                  <p className="font-body text-muted-foreground">Try different keywords or a different category.</p>
                </CardContent>
              </Card>
            )}
        </div>
      </main>

      {/* Drawer for clean reading */}
      <ResourceDetailDrawer
        open={openDrawer}
        onOpenChange={setOpenDrawer}
        resource={selectedResource}
      />
      
      {/* Live region for search results */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {search && (
          `Found ${byType.featuredArticles.length + byType.externalResources.length + byType.downloadableGuides.length} resources matching "${search}"`
        )}
      </div>
    </div>
  );
};

export default ResourcesPage;
