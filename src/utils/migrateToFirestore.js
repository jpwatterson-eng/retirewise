// src/utils/migrateToFirestore.js
import db from '../db/database';
import * as firestoreDB from '../db/firestore/firestoreDB';

export const migrateAllData = async (userId) => {
  console.log('🚀 Starting migration to Firestore...');
  
  const results = {
    projects: 0,
    timeLogs: 0,
    journalEntries: 0,
    insights: 0,
    conversations: 0,
    errors: []
  };

  try {
    // 1. Migrate Projects
    console.log('📦 Migrating projects...');
    const projects = await db.projects.toArray();
    for (const project of projects) {
      try {
        const { id, ...projectData } = project; // Remove Dexie ID
        await firestoreDB.createProject(userId, {
          ...projectData,
          dexieId: id // Keep reference to old ID
        });
        results.projects++;
      } catch (error) {
        console.error('Error migrating project:', project.id, error);
        results.errors.push({ type: 'project', id: project.id, error: error.message });
      }
    }
    console.log(`✅ Migrated ${results.projects} projects`);

    // 2. Migrate Time Logs
    console.log('⏰ Migrating time logs...');
    const timeLogs = await db.timeLogs.toArray();
    for (const log of timeLogs) {
      try {
        const { id, ...logData } = log;
        await firestoreDB.createTimeLog(userId, {
          ...logData,
          dexieId: id
        });
        results.timeLogs++;
      } catch (error) {
        console.error('Error migrating time log:', log.id, error);
        results.errors.push({ type: 'timeLog', id: log.id, error: error.message });
      }
    }
    console.log(`✅ Migrated ${results.timeLogs} time logs`);

    // 3. Migrate Journal Entries
    console.log('📓 Migrating journal entries...');
    const journals = await db.journalEntries.toArray();
    for (const entry of journals) {
      try {
        const { id, ...entryData } = entry;
        await firestoreDB.createJournalEntry(userId, {
          ...entryData,
          dexieId: id
        });
        results.journalEntries++;
      } catch (error) {
        console.error('Error migrating journal entry:', entry.id, error);
        results.errors.push({ type: 'journal', id: entry.id, error: error.message });
      }
    }
    console.log(`✅ Migrated ${results.journalEntries} journal entries`);

    // 4. Migrate Insights
    console.log('💡 Migrating insights...');
    const insights = await db.insights.toArray();
    for (const insight of insights) {
      try {
        const { id, ...insightData } = insight;
        await firestoreDB.createInsight(userId, {
          ...insightData,
          dexieId: id
        });
        results.insights++;
      } catch (error) {
        console.error('Error migrating insight:', insight.id, error);
        results.errors.push({ type: 'insight', id: insight.id, error: error.message });
      }
    }
    console.log(`✅ Migrated ${results.insights} insights`);

    // 5. Migrate Conversations
    console.log('💬 Migrating conversations...');
    const conversations = await db.conversations.toArray();
    for (const conv of conversations) {
      try {
        const { id, ...convData } = conv;
        await firestoreDB.createConversation(userId, {
          ...convData,
          dexieId: id
        });
        results.conversations++;
      } catch (error) {
        console.error('Error migrating conversation:', conv.id, error);
        results.errors.push({ type: 'conversation', id: conv.id, error: error.message });
      }
    }
    console.log(`✅ Migrated ${results.conversations} conversations`);

    console.log('🎉 Migration complete!', results);
    return results;

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
};

// Check if user has already migrated
export const checkMigrationStatus = async (userId) => {
  try {
    const projects = await firestoreDB.getProjects(userId);
    return {
      hasMigrated: projects.length > 0,
      projectCount: projects.length
    };
  } catch (error) {
    console.error('Error checking migration status:', error);
    return { hasMigrated: false, projectCount: 0 };
  }
};

export default {
  migrateAllData,
  checkMigrationStatus
};