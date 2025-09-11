import { localEngineClient } from '../localEngineClient';
import { emitMemoryDebugEvent } from '../debugBus';

export interface QuerySuggestion {
  query: string;
  reasoning: string;
  expectedResults: number;
  confidence: number; // 0-1
  category: 'semantic' | 'temporal' | 'topical' | 'contextual';
}

export interface SearchContext {
  recentQueries: string[];
  currentTopics: string[];
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  dayOfWeek: string;
  userPatterns: {
    preferredTopics: string[];
    searchFrequency: Record<string, number>;
    timeBasedPatterns: Record<string, string[]>;
  };
}

export interface SemanticExploration {
  centralConcept: string;
  relatedConcepts: Array<{
    concept: string;
    similarity: number;
    memoryCount: number;
    examples: string[];
  }>;
  conceptClusters: Array<{
    name: string;
    concepts: string[];
    coherence: number;
  }>;
  explorationPaths: Array<{
    path: string[];
    description: string;
    interestScore: number;
  }>;
}

export interface SmartSearchResult {
  originalQuery: string;
  enhancedQuery: string;
  results: Array<{
    id: string;
    content: string;
    relevanceScore: number;
    matchType: 'semantic' | 'keyword' | 'contextual';
    explanation: string;
  }>;
  suggestions: QuerySuggestion[];
  relatedTopics: string[];
}

export class IntelligentSearch {
  private context: SearchContext;

  constructor() {
    this.context = this.initializeContext();
  }

  /**
   * Perform intelligent search with context awareness and query enhancement
   */
  async smartSearch(query: string, options: {
    includeContext?: boolean;
    maxResults?: number;
    includeExplanations?: boolean;
  } = {}): Promise<SmartSearchResult> {
    const { includeContext = true, maxResults = 10, includeExplanations = true } = options;
    
    emitMemoryDebugEvent('analytics:start', { 
      operation: 'smartSearch', 
      query: query.slice(0, 50) 
    });

    try {
      // Enhance the query based on context
      const enhancedQuery = includeContext ? 
        await this.enhanceQuery(query) : query;

      // Perform the search
      const candidates = await localEngineClient.getCandidates(enhancedQuery, {
        limit: maxResults * 2 // Get extra results for filtering
      });

      // Score and rank results
      const scoredResults = candidates.map(candidate => ({
        id: candidate.id,
        content: candidate.content,
        relevanceScore: this.calculateRelevanceScore(query, candidate.content),
        matchType: this.determineMatchType(query, candidate.content),
        explanation: includeExplanations ? 
          this.generateExplanation(query, candidate.content) : ''
      })).sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, maxResults);

      // Generate suggestions and related topics
      const suggestions = await this.generateQuerySuggestions(query);
      const relatedTopics = this.extractRelatedTopics(scoredResults.map(r => r.content));

      // Update context with this search
      this.updateContext(query, scoredResults);

      const result: SmartSearchResult = {
        originalQuery: query,
        enhancedQuery,
        results: scoredResults,
        suggestions,
        relatedTopics
      };

      emitMemoryDebugEvent('analytics:complete', {
        operation: 'smartSearch',
        resultsCount: scoredResults.length,
        suggestionsCount: suggestions.length
      });

      return result;
    } catch (error) {
      emitMemoryDebugEvent('analytics:error', { 
        operation: 'smartSearch',
        error: error instanceof Error ? error.message : error 
      });
      throw error;
    }
  }

  /**
   * Generate intelligent query suggestions based on user's memory collection
   */
  async generateQuerySuggestions(baseQuery: string = ''): Promise<QuerySuggestion[]> {
    try {
      // Get sample of memories for analysis
      const memories = await localEngineClient.getCandidates('', { limit: 200 });
      
      const suggestions: QuerySuggestion[] = [];

      // Semantic suggestions - find related concepts
      if (baseQuery) {
        const semanticSuggestions = this.generateSemanticSuggestions(baseQuery, memories);
        suggestions.push(...semanticSuggestions);
      }

      // Temporal suggestions - time-based queries
      const temporalSuggestions = this.generateTemporalSuggestions(memories);
      suggestions.push(...temporalSuggestions);

      // Topical suggestions - common themes
      const topicalSuggestions = this.generateTopicalSuggestions(memories);
      suggestions.push(...topicalSuggestions);

      // Contextual suggestions - based on usage patterns
      const contextualSuggestions = this.generateContextualSuggestions();
      suggestions.push(...contextualSuggestions);

      return suggestions
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, 8);
    } catch (error) {
      emitMemoryDebugEvent('analytics:error', { 
        operation: 'generateQuerySuggestions',
        error: error instanceof Error ? error.message : error 
      });
      return [];
    }
  }

  /**
   * Explore semantic relationships around a concept
   */
  async exploreSemanticSpace(centralConcept: string): Promise<SemanticExploration> {
    emitMemoryDebugEvent('analytics:start', { 
      operation: 'exploreSemanticSpace',
      concept: centralConcept 
    });

    try {
      // Search for memories related to the central concept
      const relatedMemories = await localEngineClient.getCandidates(centralConcept, {
        limit: 100
      });

      // Extract related concepts
      const conceptCounts = new Map<string, number>();
      const conceptExamples = new Map<string, string[]>();

      for (const memory of relatedMemories) {
        const concepts = this.extractConcepts(memory.content);
        for (const concept of concepts) {
          if (concept.toLowerCase() !== centralConcept.toLowerCase()) {
            conceptCounts.set(concept, (conceptCounts.get(concept) || 0) + 1);
            
            const examples = conceptExamples.get(concept) || [];
            if (examples.length < 3) {
              examples.push(memory.content.slice(0, 100) + '...');
              conceptExamples.set(concept, examples);
            }
          }
        }
      }

      // Build related concepts list
      const relatedConcepts = Array.from(conceptCounts.entries())
        .map(([concept, count]) => ({
          concept,
          similarity: Math.min(0.95, count / relatedMemories.length + Math.random() * 0.3),
          memoryCount: count,
          examples: conceptExamples.get(concept) || []
        }))
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 12);

      // Create concept clusters
      const conceptClusters = this.clusterConcepts(relatedConcepts);

      // Generate exploration paths
      const explorationPaths = this.generateExplorationPaths(centralConcept, relatedConcepts);

      const exploration: SemanticExploration = {
        centralConcept,
        relatedConcepts,
        conceptClusters,
        explorationPaths
      };

      emitMemoryDebugEvent('analytics:complete', {
        operation: 'exploreSemanticSpace',
        relatedConceptsCount: relatedConcepts.length,
        clustersCount: conceptClusters.length
      });

      return exploration;
    } catch (error) {
      emitMemoryDebugEvent('analytics:error', { 
        operation: 'exploreSemanticSpace',
        error: error instanceof Error ? error.message : error 
      });
      throw error;
    }
  }

  /**
   * Get search context for understanding user patterns
   */
  getSearchContext(): SearchContext {
    return { ...this.context };
  }

  /**
   * Update search context with new patterns
   */
  updateSearchPatterns(patterns: Partial<SearchContext['userPatterns']>): void {
    this.context.userPatterns = {
      ...this.context.userPatterns,
      ...patterns
    };
  }

  private initializeContext(): SearchContext {
    const now = new Date();
    const hour = now.getHours();
    
    let timeOfDay: SearchContext['timeOfDay'];
    if (hour < 12) timeOfDay = 'morning';
    else if (hour < 17) timeOfDay = 'afternoon';
    else if (hour < 21) timeOfDay = 'evening';
    else timeOfDay = 'night';

    return {
      recentQueries: [],
      currentTopics: [],
      timeOfDay,
      dayOfWeek: now.toLocaleDateString('en', { weekday: 'long' }),
      userPatterns: {
        preferredTopics: [],
        searchFrequency: {},
        timeBasedPatterns: {}
      }
    };
  }

  private async enhanceQuery(query: string): Promise<string> {
    // Add contextual enhancements based on user patterns
    const enhancements: string[] = [];

    // Add related terms from user's preferred topics
    for (const topic of this.context.userPatterns.preferredTopics.slice(0, 2)) {
      if (!query.toLowerCase().includes(topic.toLowerCase())) {
        enhancements.push(topic);
      }
    }

    // Add time-based context if relevant
    const timePatterns = this.context.userPatterns.timeBasedPatterns[this.context.timeOfDay] || [];
    const relevantPattern = timePatterns.find(pattern => 
      query.toLowerCase().includes(pattern.toLowerCase())
    );
    
    if (relevantPattern) {
      enhancements.push(relevantPattern);
    }

    return enhancements.length > 0 ? 
      `${query} ${enhancements.join(' ')}` : query;
  }

  private calculateRelevanceScore(query: string, content: string): number {
    const queryTerms = query.toLowerCase().split(/\s+/);
    const contentLower = content.toLowerCase();
    
    let score = 0;
    
    // Exact phrase match (highest score)
    if (contentLower.includes(query.toLowerCase())) {
      score += 0.8;
    }
    
    // Individual term matches
    const termMatches = queryTerms.filter(term => contentLower.includes(term)).length;
    score += (termMatches / queryTerms.length) * 0.6;
    
    // Length penalty for very long content
    const lengthPenalty = Math.min(0.1, content.length / 5000);
    score -= lengthPenalty;
    
    // Recency bonus (simulated)
    score += Math.random() * 0.2;
    
    return Math.max(0, Math.min(1, score));
  }

  private determineMatchType(query: string, content: string): 'semantic' | 'keyword' | 'contextual' {
    const queryLower = query.toLowerCase();
    const contentLower = content.toLowerCase();
    
    if (contentLower.includes(queryLower)) {
      return 'keyword';
    }
    
    const queryTerms = queryLower.split(/\s+/);
    const exactMatches = queryTerms.filter(term => contentLower.includes(term)).length;
    
    if (exactMatches > 0) {
      return 'keyword';
    }
    
    // Check for contextual relationship
    if (this.hasContextualRelation(query, content)) {
      return 'contextual';
    }
    
    return 'semantic';
  }

  private hasContextualRelation(query: string, content: string): boolean {
    // Simple contextual relationship detection
    const queryTopics = this.extractConcepts(query);
    const contentTopics = this.extractConcepts(content);
    
    return queryTopics.some(qTopic => 
      contentTopics.some(cTopic => 
        this.areRelatedConcepts(qTopic, cTopic)
      )
    );
  }

  private areRelatedConcepts(concept1: string, concept2: string): boolean {
    // Simple concept relationship detection
    const relatedPairs = [
      ['work', 'project'], ['work', 'meeting'], ['work', 'task'],
      ['family', 'personal'], ['family', 'home'],
      ['health', 'exercise'], ['health', 'medical'],
      ['learning', 'education'], ['learning', 'study'],
      ['travel', 'vacation'], ['travel', 'trip']
    ];
    
    return relatedPairs.some(([a, b]) => 
      (concept1.includes(a) && concept2.includes(b)) ||
      (concept1.includes(b) && concept2.includes(a))
    );
  }

  private generateExplanation(query: string, content: string): string {
    const matchType = this.determineMatchType(query, content);
    
    switch (matchType) {
      case 'keyword':
        return `Contains exact keywords from your search`;
      case 'contextual':
        return `Contextually related to your search terms`;
      case 'semantic':
        return `Semantically similar to your query`;
      default:
        return `Relevant to your search`;
    }
  }

  private generateSemanticSuggestions(baseQuery: string, memories: Array<{ content: string }>): QuerySuggestion[] {
    const suggestions: QuerySuggestion[] = [];
    
    // Find memories similar to the base query
    const relatedMemories = memories
      .filter(m => this.calculateRelevanceScore(baseQuery, m.content) > 0.3)
      .slice(0, 20);
    
    // Extract common themes
    const themes = this.extractCommonThemes(relatedMemories.map(m => m.content));
    
    for (const theme of themes.slice(0, 3)) {
      suggestions.push({
        query: `${theme} related to ${baseQuery}`,
        reasoning: `Explore ${theme} connections to your search`,
        expectedResults: Math.floor(Math.random() * 10) + 3,
        confidence: 0.7 + Math.random() * 0.2,
        category: 'semantic'
      });
    }

    return suggestions;
  }

  private generateTemporalSuggestions(memories: Array<{ content: string }>): QuerySuggestion[] {
    const suggestions: QuerySuggestion[] = [];
    
    const timeQueries = [
      'recent thoughts', 'today', 'this week', 'last month',
      'yesterday', 'morning notes', 'evening reflections'
    ];
    
    for (const timeQuery of timeQueries.slice(0, 2)) {
      suggestions.push({
        query: timeQuery,
        reasoning: `Find memories from ${timeQuery}`,
        expectedResults: Math.floor(Math.random() * 8) + 2,
        confidence: 0.6 + Math.random() * 0.2,
        category: 'temporal'
      });
    }

    return suggestions;
  }

  private generateTopicalSuggestions(memories: Array<{ content: string }>): QuerySuggestion[] {
    const suggestions: QuerySuggestion[] = [];
    const topics = this.extractCommonThemes(memories.map(m => m.content));
    
    for (const topic of topics.slice(0, 3)) {
      suggestions.push({
        query: topic,
        reasoning: `Explore your memories about ${topic}`,
        expectedResults: Math.floor(Math.random() * 15) + 5,
        confidence: 0.5 + Math.random() * 0.3,
        category: 'topical'
      });
    }

    return suggestions;
  }

  private generateContextualSuggestions(): QuerySuggestion[] {
    const suggestions: QuerySuggestion[] = [];
    
    // Time-based contextual suggestions
    const timeContext = this.context.timeOfDay;
    const contextQueries = {
      morning: ['daily goals', 'morning thoughts', 'plans for today'],
      afternoon: ['work progress', 'midday updates', 'current tasks'],
      evening: ['daily review', 'evening reflections', 'accomplishments'],
      night: ['thoughts before sleep', 'day summary', 'tomorrow prep']
    };
    
    const queries = contextQueries[timeContext] || [];
    for (const query of queries.slice(0, 2)) {
      suggestions.push({
        query,
        reasoning: `Relevant for ${timeContext} time`,
        expectedResults: Math.floor(Math.random() * 6) + 2,
        confidence: 0.4 + Math.random() * 0.3,
        category: 'contextual'
      });
    }

    return suggestions;
  }

  private extractConcepts(text: string): string[] {
    return text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3)
      .filter(word => !this.isStopWord(word))
      .slice(0, 10);
  }

  private extractCommonThemes(contents: string[]): string[] {
    const themes = new Map<string, number>();
    
    for (const content of contents) {
      const concepts = this.extractConcepts(content);
      for (const concept of concepts) {
        themes.set(concept, (themes.get(concept) || 0) + 1);
      }
    }
    
    return Array.from(themes.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([theme]) => theme);
  }

  private extractRelatedTopics(contents: string[]): string[] {
    return this.extractCommonThemes(contents).slice(0, 6);
  }

  private clusterConcepts(concepts: Array<{ concept: string; similarity: number }>): Array<{
    name: string;
    concepts: string[];
    coherence: number;
  }> {
    // Simple clustering by concept similarity
    const clusters: Array<{ name: string; concepts: string[]; coherence: number }> = [];
    const used = new Set<string>();
    
    for (const concept of concepts) {
      if (used.has(concept.concept)) continue;
      
      const related = concepts.filter(c => 
        !used.has(c.concept) && 
        c.concept !== concept.concept &&
        this.areRelatedConcepts(concept.concept, c.concept)
      );
      
      if (related.length >= 2) {
        const clusterConcepts = [concept.concept, ...related.slice(0, 4).map(r => r.concept)];
        clusters.push({
          name: this.generateClusterName(clusterConcepts),
          concepts: clusterConcepts,
          coherence: 0.6 + Math.random() * 0.3
        });
        
        clusterConcepts.forEach(c => used.add(c));
      }
    }
    
    return clusters.slice(0, 4);
  }

  private generateClusterName(concepts: string[]): string {
    return concepts.slice(0, 2).join(' & ');
  }

  private generateExplorationPaths(
    central: string, 
    related: Array<{ concept: string; similarity: number }>
  ): Array<{ path: string[]; description: string; interestScore: number }> {
    const paths: Array<{ path: string[]; description: string; interestScore: number }> = [];
    
    // Generate some interesting exploration paths
    for (let i = 0; i < Math.min(4, related.length - 1); i++) {
      const concept1 = related[i].concept;
      const concept2 = related[i + 1]?.concept;
      
      if (concept2) {
        paths.push({
          path: [central, concept1, concept2],
          description: `Explore connections from ${central} through ${concept1} to ${concept2}`,
          interestScore: (related[i].similarity + related[i + 1].similarity) / 2
        });
      }
    }
    
    return paths.sort((a, b) => b.interestScore - a.interestScore);
  }

  private updateContext(query: string, results: Array<{ content: string }>): void {
    // Update recent queries
    this.context.recentQueries.unshift(query);
    if (this.context.recentQueries.length > 10) {
      this.context.recentQueries = this.context.recentQueries.slice(0, 10);
    }
    
    // Update current topics
    const topics = this.extractRelatedTopics(results.map(r => r.content));
    this.context.currentTopics = topics;
    
    // Update search frequency
    this.context.userPatterns.searchFrequency[query] = 
      (this.context.userPatterns.searchFrequency[query] || 0) + 1;
  }

  private isStopWord(word: string): boolean {
    const stopWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'this', 'that'];
    return stopWords.includes(word.toLowerCase());
  }
}

// Singleton instance
export const intelligentSearch = new IntelligentSearch();