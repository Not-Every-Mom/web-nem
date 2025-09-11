import { localEngineClient, LocalMemoryEngine } from '../localEngineClient';
import type { MemoryItem } from '../types';

// Helper function to generate test embedding
export function generateTestEmbedding(): Float32Array {
  return new Float32Array(Array.from({ length: 384 }, () => Math.random()));
}

// Simple test function to verify the local engine works
export async function testLocalEngine(): Promise<void> {
  console.log('Testing local memory engine...');
  
  try {
    // Initialize the engine
    await localEngineClient.init();
    console.log('✅ Engine initialized');
    
    // Test adding a memory
    const testMemory: MemoryItem = {
      id: 'test-1',
      user_id: 'test-user',
      memory_type: 'semantic',
      content: 'I love chocolate ice cream',
      salience: 0.8,
      sensitive: false,
      usage_count: 0,
      last_used_at: null,
      cooldown_until: null,
      topic_tags: ['preference'],
      source: 'test',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    await localEngineClient.addMemory(testMemory);
    console.log('✅ Memory added');
    
    // Test retrieving candidates
    const candidates = await localEngineClient.getCandidates('chocolate', { limit: 5 });
    console.log('✅ Candidates retrieved:', candidates.length);
    
    if (candidates.length > 0) {
      console.log('Found candidate:', candidates[0]);
    }
    
    // Test stats
    const stats = await localEngineClient.getStats();
    console.log('✅ Stats retrieved:', stats);
    
    // Test usage update
    await localEngineClient.updateUsage('test-1', { count: 1 });
    console.log('✅ Usage updated');
    
    console.log('🎉 All basic tests passed!');
  } catch (error) {
    console.error('❌ Basic test failed:', error);
    throw error;
  }
}

// Test the legacy API adapter
export async function testLegacyAPI(): Promise<void> {
  console.log('Testing legacy API adapter...');
  
  try {
    // Initialize via legacy API
    const initResult = await LocalMemoryEngine.init();
    console.log('✅ Legacy init completed:', initResult);
    
    // Add memory via legacy API
    await LocalMemoryEngine.addMemory({
      memory_type: 'semantic',
      content: 'I enjoy vanilla ice cream too',
      salience: 0.7,
      sensitive: false,
      topic_tags: ['preference'],
      source: 'test',
      embedFromText: false
    });
    console.log('✅ Legacy addMemory completed');
    
    // Test search
    const dummyEmbedding = new Float32Array([0.1, 0.2, 0.3, 0.4, 0.5]);
    const searchResults = await LocalMemoryEngine.searchByEmbedding(dummyEmbedding, 3);
    console.log('✅ Legacy search completed:', searchResults);
    
    console.log('🎉 All legacy API tests passed!');
  } catch (error) {
    console.error('❌ Legacy API test failed:', error);
    throw error;
  }
}