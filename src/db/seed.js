// src/db/seed.js
import { createProject } from './projects';

// Seed some initial projects for testing
export const seedInitialData = async () => {
  console.log('🌱 Seeding initial data...');
  
  try {
    // Wanderwise
    await createProject({
      name: 'Wanderwise',
      type: 'building',
      description: 'AI-powered walking tour generator for travelers',
      goals: ['Complete MVP', 'Launch to family', 'Get 50 routes generated'],
      motivation: 'Solve our own travel planning problem, learn AI integration',
      tags: ['tech', 'travel', 'AI', 'product'],
      color: '#3B82F6',
      icon: '🗺️',
      targetHours: 200
    });
    
    // RetireWise
    await createProject({
      name: 'RetireWise',
      type: 'building',
      description: 'Intelligent retirement portfolio advisor with AI',
      goals: ['Build MVP', 'Implement AI advisor', 'Track portfolio effectively'],
      motivation: 'Manage my own retirement experiments, learn agentic AI',
      tags: ['tech', 'retirement', 'AI', 'personal'],
      color: '#8B5CF6',
      icon: '🧠',
      targetHours: 150
    });
    
    // AI Learning
    await createProject({
      name: 'AI Learning',
      type: 'learning',
      description: 'Learning about AI, prompt engineering, RAG, and agentic systems',
      goals: ['Complete prompt engineering courses', 'Build RAG system', 'Understand agentic AI'],
      motivation: 'Stay current with AI developments, apply to projects',
      tags: ['learning', 'AI', 'skills'],
      color: '#10B981',
      icon: '📚'
    });
    
    // Consulting
    await createProject({
      name: 'Consulting Exploration',
      type: 'consulting',
      description: 'Exploring consulting opportunities in operations/IT',
      goals: ['Decide if consulting is right path', 'Take one engagement', 'Evaluate fit'],
      motivation: 'Leverage expertise, uncertain if this is the right direction',
      tags: ['consulting', 'decision', 'business'],
      color: '#F59E0B',
      icon: '💼',
      targetHours: 50
    });
    
    console.log('✅ Seed data created successfully!');
    
  } catch (error) {
    console.error('❌ Error seeding data:', error);
  }
};

// Function to clear all data (useful for testing)
export const clearAllData = async () => {
  const db = (await import('./database')).default;
  
  await db.projects.clear();
  await db.timeLogs.clear();
  await db.journalEntries.clear();
  await db.conversations.clear();
  await db.insights.clear();
  await db.perspectiveScores.clear();
  await db.embeddingsCache.clear();
  
  console.log('🗑️ All data cleared');
};

export default { seedInitialData, clearAllData };