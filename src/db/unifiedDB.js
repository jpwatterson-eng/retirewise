// src/db/unifiedDB.js
// Unified database layer that uses Firestore when logged in, Dexie when offline
import * as firestoreDB from './firestore/firestoreDB';
import * as dexieProjects from './projects';
import * as dexieTimeLogs from './timeLogs';

let currentUserId = null;

// Set the current user ID (call this when user logs in)
export const setCurrentUser = (userId) => {
  currentUserId = userId;
  console.log('📊 Database user set:', userId ? 'Firestore' : 'Local');
};

// Check if using Firestore
const isUsingFirestore = () => !!currentUserId;

// ==================== PROJECTS ====================

export const getAllProjects = async () => {
  if (currentUserId) {
    return await firestoreDB.getProjects(currentUserId);
  }
  return await dexieProjects.getAllProjects();
};

export const getActiveProjects = async () => {
  const projects = await getAllProjects();
  return projects.filter(p => p.status === 'active');
};

export const getProject = async (projectId) => {
  if (currentUserId) {
    return await firestoreDB.getProject(currentUserId, projectId);
  }
  return await dexieProjects.getProject(projectId);
};

export const createProject = async (projectData) => {
  if (currentUserId) {
    const id = await firestoreDB.createProject(currentUserId, projectData);
    return { id, ...projectData };
  }
  return await dexieProjects.createProject(projectData);
};

export const updateProject = async (projectId, updates) => {
  if (currentUserId) {
    await firestoreDB.updateProject(currentUserId, projectId, updates);
    return;
  }
  return await dexieProjects.updateProject(projectId, updates);
};

export const deleteProject = async (projectId) => {
  if (currentUserId) {
    await firestoreDB.deleteProject(currentUserId, projectId);
    return;
  }
  return await dexieProjects.deleteProject(projectId);
};

// Real-time subscription (Firestore only)
export const subscribeToProjects = (callback) => {
  if (currentUserId) {
    return firestoreDB.subscribeToProjects(currentUserId, callback);
  }
  // For Dexie, do a one-time load
  getAllProjects().then(callback);
  return () => {}; // Return empty unsubscribe function
};


// ==================== TIME LOGS ====================

export const getAllTimeLogs = async () => {
  if (currentUserId) {
    const logs = await firestoreDB.getTimeLogs(currentUserId);
    
    // Enrich with project data
    const projects = await getAllProjects();
    const projectMap = projects.reduce((map, p) => {
      map[p.id] = p;
      return map;
    }, {});
    
    return logs.map(log => ({
      ...log,
      projectName: projectMap[log.projectId]?.name || 'Unknown',
      projectColor: projectMap[log.projectId]?.color,
      projectIcon: projectMap[log.projectId]?.icon
    }));
  }
  return await dexieTimeLogs.getAllTimeLogs();
};

export const getTodayTimeLogs = async () => {
  if (currentUserId) {
    const allLogs = await firestoreDB.getTimeLogs(currentUserId);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return allLogs.filter(log => {
      const logDate = new Date(log.date);
      return logDate >= today && logDate < tomorrow;
    });
  }
  return await dexieTimeLogs.getTodayTimeLogs();
};

export const createTimeLog = async (logData) => {
  if (currentUserId) {
    const id = await firestoreDB.createTimeLog(currentUserId, logData);
    
    // Update project hours in Firestore
    const project = await getProject(logData.projectId);
    if (project) {
      await updateProject(logData.projectId, {
        totalHoursLogged: (project.totalHoursLogged || 0) + logData.duration,
        lastWorkedAt: logData.date
      });
    }
    
    return { id, ...logData };
  }
  return await dexieTimeLogs.createTimeLog(logData);
};

export const updateTimeLog = async (logId, updates) => {
  if (currentUserId) {
    // Get old log to calculate hour difference
    const allLogs = await firestoreDB.getTimeLogs(currentUserId);
    const oldLog = allLogs.find(l => l.id === logId);
    
    await firestoreDB.updateTimeLog(currentUserId, logId, updates);
    
    // Update project hours if duration or project changed
    if (oldLog && (updates.duration !== undefined || updates.projectId !== undefined)) {
      const oldProject = await getProject(oldLog.projectId);
      const newProjectId = updates.projectId || oldLog.projectId;
      const newDuration = updates.duration !== undefined ? updates.duration : oldLog.duration;
      
      // Remove hours from old project
      if (oldProject) {
        await updateProject(oldLog.projectId, {
          totalHoursLogged: Math.max(0, oldProject.totalHoursLogged - oldLog.duration)
        });
      }
      
      // Add hours to new project
      const newProject = await getProject(newProjectId);
      if (newProject) {
        await updateProject(newProjectId, {
          totalHoursLogged: (newProject.totalHoursLogged || 0) + newDuration,
          lastWorkedAt: updates.date || oldLog.date
        });
      }
    }
    
    return;
  }
  return await dexieTimeLogs.updateTimeLog(logId, updates);
};

export const deleteTimeLog = async (logId) => {
  if (currentUserId) {
    // Get log to update project hours
    const allLogs = await firestoreDB.getTimeLogs(currentUserId);
    const log = allLogs.find(l => l.id === logId);
    
    await firestoreDB.deleteTimeLog(currentUserId, logId);
    
    // Update project hours
    if (log) {
      const project = await getProject(log.projectId);
      if (project) {
        await updateProject(log.projectId, {
          totalHoursLogged: Math.max(0, project.totalHoursLogged - log.duration)
        });
      }
    }
    
    return;
  }
  return await dexieTimeLogs.deleteTimeLog(logId);
};

// ==================== JOURNAL ====================

export const getAllJournalEntries = async () => {
  if (currentUserId) {
    return await firestoreDB.getJournalEntries(currentUserId);
  }
  const db = (await import('./database')).default;
  return await db.journalEntries.toArray();
};

export const createJournalEntry = async (entryData) => {
  if (currentUserId) {
    const id = await firestoreDB.createJournalEntry(currentUserId, entryData);
    return { id, ...entryData };
  }
  const db = (await import('./database')).default;
  const id = `journal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  await db.journalEntries.add({ id, ...entryData });
  return { id, ...entryData };
};

export const updateJournalEntry = async (entryId, updates) => {
  if (currentUserId) {
    await firestoreDB.updateJournalEntry(currentUserId, entryId, updates);
    return;
  }
  const db = (await import('./database')).default;
  await db.journalEntries.update(entryId, updates);
};

export const deleteJournalEntry = async (entryId) => {
  if (currentUserId) {
    await firestoreDB.deleteJournalEntry(currentUserId, entryId);
    return;
  }
  const db = (await import('./database')).default;
  await db.journalEntries.delete(entryId);
};

// ==================== INSIGHTS ====================

export const getActiveInsights = async () => {
  if (currentUserId) {
    const insights = await firestoreDB.getInsights(currentUserId);
    return insights.filter(i => !i.dismissed);
  }
  const db = (await import('./database')).default;
  return await db.insights
    .where('dismissed')
    .equals(0)
    .or('dismissed')
    .equals(false)
    .sortBy('generatedAt');
};

export default {
  setCurrentUser,
  
  // Projects
  getAllProjects,
  getActiveProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  subscribeToProjects,
  
  // Time Logs
  getAllTimeLogs,
  getTodayTimeLogs,
  createTimeLog,
  updateTimeLog,
  deleteTimeLog,
  
  // Journal
  getAllJournalEntries,
  createJournalEntry,
  updateJournalEntry,
  deleteJournalEntry,
  
  // Insights
  getActiveInsights
};