import { localEngineClient } from '../localEngineClient';
import { MemoryItem } from '../types';
import { emitMemoryDebugEvent } from '../debugBus';

export interface MemoryCluster {
  id: string;
  name: string;
  keywords: string[];
  memoryIds: string[];
  centroid: Float32Array;
  coherence: number; // 0-1 score
  size: number;
}

export interface MemoryInsights {
  totalMemories: number;
  averageSalience: number;
  topTopics: Array<{ topic: string; count: number; avgSalience: number }>;
  memoryTypes: Record<string, number>;
  clusters: MemoryCluster[];
  timeline: Array<{ date: string; count: number }>;
  searchPatterns: Array<{ query: string; frequency: number; lastUsed: string }>;
}

export interface SimilarityGroup {
  anchor: { id: string; content: string };
  similar: Array<{ id: string; content: string; similarity: number }>;
  theme: string;
}

export class MemoryAnalytics {
  private static readonly MIN_CLUSTER_SIZE = 3;
  private static readonly MAX_CLUSTERS = 10;
  private static readonly SIMILARITY_THRESHOLD = 0.7;

  /**
   * Generate comprehensive insights about the user's memory collection
   */
  async generateInsights(): Promise<MemoryInsights> {
    emitMemoryDebugEvent('analytics:start', { operation: 'generateInsights' });

    try {
      await localEngineClient.init();
      const stats = await localEngineClient.getStats();
      
      if (stats.node_count === 0) {
        return this.getEmptyInsights();
      }

      // Get all memories for analysis
      const memories = await localEngineClient.getCandidates('', { limit: 1000 });
      
      const insights: MemoryInsights = {
        totalMemories: memories.length,
        averageSalience: this.calculateAverageSalience(memories),
        topTopics: await this.extractTopTopics(memories),
        memoryTypes: this.analyzeMemoryTypes(memories),
        clusters: await this.clusterMemories(memories),
        timeline: this.generateTimeline(memories),
        searchPatterns: [] // Would be populated from usage analytics
      };

      emitMemoryDebugEvent('analytics:complete', { 
        insights: {
          totalMemories: insights.totalMemories,
          clustersFound: insights.clusters.length,
          topTopicsCount: insights.topTopics.length
        }
      });

      return insights;
    } catch (error) {
      emitMemoryDebugEvent('analytics:error', { error: error instanceof Error ? error.message : error });
      return this.getEmptyInsights();
    }
  }

  /**
   * Find similar memories and group them
   */
  async findSimilarityGroups(minSimilarity = 0.6): Promise<SimilarityGroup[]> {
    emitMemoryDebugEvent('analytics:start', { operation: 'findSimilarityGroups' });

    try {
      const memories = await localEngineClient.getCandidates('', { limit: 500 });
      const groups: SimilarityGroup[] = [];
      const processed = new Set<string>();

      for (const anchor of memories) {
        if (processed.has(anchor.id)) continue;

        // Find similar memories to this anchor
        const similarMemories = await localEngineClient.getCandidates(
          anchor.content.slice(0, 100), // Use content snippet as query
          { limit: 20 }
        );

        const similar = similarMemories
          .filter(m => m.id !== anchor.id && !processed.has(m.id))
          .map(m => ({
            id: m.id,
            content: m.content,
            similarity: this.calculateTextSimilarity(anchor.content, m.content)
          }))
          .filter(m => m.similarity >= minSimilarity)
          .sort((a, b) => b.similarity - a.similarity)
          .slice(0, 5);

        if (similar.length >= 2) {
          groups.push({
            anchor: { id: anchor.id, content: anchor.content },
            similar,
            theme: this.extractTheme([anchor.content, ...similar.map(s => s.content)])
          });

          processed.add(anchor.id);
          similar.forEach(s => processed.add(s.id));
        }
      }

      emitMemoryDebugEvent('analytics:complete', { 
        operation: 'findSimilarityGroups',
        groupsFound: groups.length 
      });

      return groups.slice(0, 10); // Limit to top 10 groups
    } catch (error) {
      emitMemoryDebugEvent('analytics:error', { error: error instanceof Error ? error.message : error });
      return [];
    }
  }

  /**
   * Get memory usage statistics and patterns
   */
  async getUsagePatterns(): Promise<{
    accessFrequency: Array<{ memoryId: string; content: string; accessCount: number }>;
    recentlyAccessed: Array<{ memoryId: string; content: string; lastAccessed: string }>;
    neverAccessed: Array<{ memoryId: string; content: string; created: string }>;
    averageAccessTime: number;
  }> {
    try {
      const memories = await localEngineClient.getCandidates('', { limit: 1000 });
      
      // Note: In a real implementation, we'd track access patterns
      // For now, we'll simulate based on available data
      
      return {
        accessFrequency: memories
          .map(m => ({ 
            memoryId: m.id, 
            content: m.content.slice(0, 100),
            accessCount: Math.floor(Math.random() * 20) // Simulated
          }))
          .sort((a, b) => b.accessCount - a.accessCount)
          .slice(0, 10),
        
        recentlyAccessed: memories
          .slice(0, 10)
          .map(m => ({
            memoryId: m.id,
            content: m.content.slice(0, 100),
            lastAccessed: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
          })),
        
        neverAccessed: memories
          .slice(-5)
          .map(m => ({
            memoryId: m.id,
            content: m.content.slice(0, 100),
            created: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
          })),
        
        averageAccessTime: Math.random() * 500 + 100 // Simulated ms
      };
    } catch (error) {
      emitMemoryDebugEvent('analytics:error', { error: error instanceof Error ? error.message : error });
      return {
        accessFrequency: [],
        recentlyAccessed: [],
        neverAccessed: [],
        averageAccessTime: 0
      };
    }
  }

  private getEmptyInsights(): MemoryInsights {
    return {
      totalMemories: 0,
      averageSalience: 0,
      topTopics: [],
      memoryTypes: {},
      clusters: [],
      timeline: [],
      searchPatterns: []
    };
  }

  private calculateAverageSalience(memories: Array<{ content: string }>): number {
    if (memories.length === 0) return 0;
    
    // Simulate salience calculation based on content length and keywords
    const total = memories.reduce((sum, memory) => {
      const contentLength = memory.content.length;
      const hasKeywords = /important|remember|key|significant|crucial/i.test(memory.content);
      const salience = Math.min(0.9, (contentLength / 200) + (hasKeywords ? 0.3 : 0));
      return sum + salience;
    }, 0);
    
    return total / memories.length;
  }

  private async extractTopTopics(memories: Array<{ content: string }>): Promise<Array<{ topic: string; count: number; avgSalience: number }>> {
    const topicCounts = new Map<string, { count: number; salienceSum: number }>();
    
    for (const memory of memories) {
      const topics = this.extractTopicsFromContent(memory.content);
      const salience = Math.random() * 0.5 + 0.5; // Simulated
      
      for (const topic of topics) {
        const current = topicCounts.get(topic) || { count: 0, salienceSum: 0 };
        topicCounts.set(topic, {
          count: current.count + 1,
          salienceSum: current.salienceSum + salience
        });
      }
    }

    return Array.from(topicCounts.entries())
      .map(([topic, data]) => ({
        topic,
        count: data.count,
        avgSalience: data.salienceSum / data.count
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  private extractTopicsFromContent(content: string): string[] {
    const words = content.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3);

    // Simple topic extraction - in production, use NLP
    const commonTopics = ['work', 'family', 'health', 'travel', 'learning', 'project', 'meeting', 'idea', 'goal', 'plan'];
    return commonTopics.filter(topic => words.some(word => word.includes(topic)));
  }

  private analyzeMemoryTypes(memories: Array<{ content: string }>): Record<string, number> {
    const types: Record<string, number> = {};
    
    for (const memory of memories) {
      const type = this.classifyMemoryType(memory.content);
      types[type] = (types[type] || 0) + 1;
    }
    
    return types;
  }

  private classifyMemoryType(content: string): string {
    const lower = content.toLowerCase();
    
    if (lower.includes('meeting') || lower.includes('call')) return 'Meeting';
    if (lower.includes('idea') || lower.includes('thought')) return 'Idea';
    if (lower.includes('task') || lower.includes('todo')) return 'Task';
    if (lower.includes('learn') || lower.includes('study')) return 'Learning';
    if (lower.includes('personal') || lower.includes('family')) return 'Personal';
    
    return 'General';
  }

  private async clusterMemories(memories: Array<{ id: string; content: string }>): Promise<MemoryCluster[]> {
    if (memories.length < MemoryAnalytics.MIN_CLUSTER_SIZE) {
      return [];
    }

    // Simplified clustering - group by content similarity
    const clusters: MemoryCluster[] = [];
    const assigned = new Set<string>();
    
    for (let i = 0; i < memories.length && clusters.length < MemoryAnalytics.MAX_CLUSTERS; i++) {
      if (assigned.has(memories[i].id)) continue;
      
      const anchor = memories[i];
      const similar = memories.filter(m => 
        !assigned.has(m.id) && 
        m.id !== anchor.id &&
        this.calculateTextSimilarity(anchor.content, m.content) > MemoryAnalytics.SIMILARITY_THRESHOLD
      );

      if (similar.length >= MemoryAnalytics.MIN_CLUSTER_SIZE - 1) {
        const clusterMemories = [anchor, ...similar.slice(0, 8)];
        const clusterId = `cluster-${clusters.length + 1}`;
        
        clusters.push({
          id: clusterId,
          name: this.generateClusterName(clusterMemories.map(m => m.content)),
          keywords: this.extractKeywords(clusterMemories.map(m => m.content)),
          memoryIds: clusterMemories.map(m => m.id),
          centroid: new Float32Array(384).fill(0.1), // Simulated
          coherence: Math.random() * 0.3 + 0.7,
          size: clusterMemories.length
        });

        clusterMemories.forEach(m => assigned.add(m.id));
      }
    }

    return clusters;
  }

  private generateTimeline(memories: Array<{ content: string }>): Array<{ date: string; count: number }> {
    const timeline = new Map<string, number>();
    const now = new Date();
    
    // Generate timeline for last 30 days
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      
      // Simulate memory creation distribution
      const count = Math.floor(Math.random() * (memories.length / 10)) || 0;
      timeline.set(dateStr, count);
    }

    return Array.from(timeline.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  private generateClusterName(contents: string[]): string {
    const keywords = this.extractKeywords(contents);
    if (keywords.length > 0) {
      return keywords.slice(0, 2).join(' & ');
    }
    return `Cluster ${Math.floor(Math.random() * 1000)}`;
  }

  private extractKeywords(contents: string[]): string[] {
    const wordCounts = new Map<string, number>();
    
    for (const content of contents) {
      const words = content.toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(word => word.length > 3 && !this.isStopWord(word));
      
      for (const word of words) {
        wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
      }
    }

    return Array.from(wordCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([word]) => word);
  }

  private isStopWord(word: string): boolean {
    const stopWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'this', 'that', 'these', 'those'];
    return stopWords.includes(word.toLowerCase());
  }

  private calculateTextSimilarity(text1: string, text2: string): number {
    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size; // Jaccard similarity
  }

  private extractTheme(contents: string[]): string {
    const keywords = this.extractKeywords(contents);
    return keywords.slice(0, 3).join(', ') || 'Mixed content';
  }
}

// Singleton instance
export const memoryAnalytics = new MemoryAnalytics();