import React, { useState, useEffect } from 'react';
import { Key, Download, Upload, Trash2, AlertTriangle, Check, Eye, EyeOff, Info } from 'lucide-react';

import { useAuth } from '../contexts/AuthContext';
import { migrateAllData, checkMigrationStatus } from '../utils/migrateToFirestore';
import { Cloud, Database, CheckCircle } from 'lucide-react';

import db from '../db/database';

const Settings = () => {
  const [settings, setSettings] = useState(null);
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const { currentUser } = useAuth();
const [migrationStatus, setMigrationStatus] = useState(null);
const [migrating, setMigrating] = useState(false);
const [migrationResults, setMigrationResults] = useState(null);

  // Check if API key is configured via environment variable
  const isApiKeyConfigured = !!process.env.REACT_APP_ANTHROPIC_API_KEY;
  const isDevelopment = process.env.NODE_ENV === 'development';

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const userSettings = await db.settings.get('user_settings');
      if (userSettings) {
        setSettings(userSettings);
        // Don't load the actual API key for security
        setApiKey(userSettings.ai?.apiKey ? '••••••••••••••••' : '');
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

// Add this useEffect to check migration status on load
useEffect(() => {
  if (currentUser) {
    checkMigration();
  }
}, [currentUser]);

const checkMigration = async () => {
  try {
    const status = await checkMigrationStatus(currentUser.uid);
    setMigrationStatus(status);
  } catch (error) {
    console.error('Error checking migration:', error);
  }
};

// Add this migration handler function
const handleMigration = async () => {
  if (!currentUser) {
    alert('You must be logged in to migrate data');
    return;
  }

  const confirmed = window.confirm(
    '🔄 This will copy all your local data to the cloud.\n\n' +
    '• Your local data will NOT be deleted\n' +
    '• This may take a few minutes\n' +
    '• You can continue using the app during migration\n\n' +
    'Ready to proceed?'
  );

  if (!confirmed) return;

  setMigrating(true);
  try {
    const results = await migrateAllData(currentUser.uid);
    setMigrationResults(results);
    await checkMigration();
    
    alert(
      `✅ Migration complete!\n\n` +
      `📦 Projects: ${results.projects}\n` +
      `⏰ Time Logs: ${results.timeLogs}\n` +
      `📓 Journal Entries: ${results.journalEntries}\n` +
      `💡 Insights: ${results.insights}\n` +
      `💬 Conversations: ${results.conversations}\n` +
      (results.errors.length > 0 ? `\n⚠️ Errors: ${results.errors.length}` : '')
    );
  } catch (error) {
    console.error('Migration error:', error);
    alert('❌ Migration failed: ' + error.message);
  } finally {
    setMigrating(false);
  }
};



  const handleSaveApiKey = async () => {
    if (!apiKey || apiKey === '••••••••••••••••') return;
    
    setSaving(true);
    try {
      await db.settings.update('user_settings', {
        ai: {
          ...settings.ai,
          apiKey: apiKey
        },
        updatedAt: new Date().toISOString()
      });
      
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      
      // Reload settings
      await loadSettings();
      setShowApiKey(false);
      
      console.log('✅ API key saved');
    } catch (error) {
      console.error('Error saving API key:', error);
      alert('Failed to save API key');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePreference = async (category, key, value) => {
    try {
      const updates = {
        [category]: {
          ...settings[category],
          [key]: value
        },
        updatedAt: new Date().toISOString()
      };
      
      await db.settings.update('user_settings', updates);
      await loadSettings();
      
      console.log(`✅ Updated ${category}.${key}`);
    } catch (error) {
      console.error('Error updating preference:', error);
    }
  };

  const handleExportData = async () => {
    try {
      const allData = {
        projects: await db.projects.toArray(),
        timeLogs: await db.timeLogs.toArray(),
        journalEntries: await db.journalEntries.toArray(),
        conversations: await db.conversations.toArray(),
        settings: await db.settings.toArray(),
        exportDate: new Date().toISOString(),
        version: '1.0'
      };
      
      const dataStr = JSON.stringify(allData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `retirewise-backup-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      
      URL.revokeObjectURL(url);
      
      alert('✅ Data exported successfully!');
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Failed to export data');
    }
  };

  const handleImportData = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      if (!data.projects || !data.exportDate) {
        throw new Error('Invalid backup file format');
      }
      
      const confirmed = window.confirm(
        'This will replace all current data. Are you sure you want to import?'
      );
      
      if (!confirmed) return;
      
      // Clear existing data
      await db.projects.clear();
      await db.timeLogs.clear();
      await db.journalEntries.clear();
      await db.conversations.clear();
      
      // Import new data
      await db.projects.bulkAdd(data.projects);
      await db.timeLogs.bulkAdd(data.timeLogs);
      await db.journalEntries.bulkAdd(data.journalEntries);
      if (data.conversations) {
        await db.conversations.bulkAdd(data.conversations);
      }
      
      alert('✅ Data imported successfully! Refreshing...');
      window.location.reload();
    } catch (error) {
      console.error('Error importing data:', error);
      alert('Failed to import data: ' + error.message);
    }
  };

  const handleClearAllData = async () => {
    const confirmed = window.confirm(
      '⚠️ WARNING: This will permanently delete ALL your data including projects, time logs, journal entries, and conversations. This cannot be undone.\n\nAre you absolutely sure?'
    );
    
    if (!confirmed) return;
    
    const doubleConfirm = window.confirm(
      'Last chance! Type YES in the next prompt to confirm deletion.'
    );
    
    if (!doubleConfirm) return;
    
    const finalConfirm = prompt('Type YES to confirm deletion:');
    
    if (finalConfirm !== 'YES') {
      alert('Deletion cancelled');
      return;
    }
    
    try {
      await db.projects.clear();
      await db.timeLogs.clear();
      await db.journalEntries.clear();
      await db.conversations.clear();
      await db.insights.clear();
      await db.perspectiveScores.clear();
      await db.embeddingsCache.clear();
      
      alert('✅ All data cleared. Refreshing...');
      window.location.reload();
    } catch (error) {
      console.error('Error clearing data:', error);
      alert('Failed to clear data');
    }
  };

  if (!settings) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      <h1 className="text-2xl font-bold text-gray-800">Settings</h1>

      {/* API Key Section - Only show in development or if not configured */}
      {(isDevelopment && !isApiKeyConfigured) && (
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Key className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-gray-800">Claude API Key</h2>
          </div>
          
          <p className="text-sm text-gray-600 mb-4">
            Your API key is stored locally and never leaves your device. Get your key from{' '}
            <a 
              href="https://console.anthropic.com/settings/keys" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              console.anthropic.com
            </a>
          </p>

          <div className="space-y-3">
            <div className="flex gap-2">
              <input
                type={showApiKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-ant-api03-..."
                className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              />
              <button
                onClick={() => setShowApiKey(!showApiKey)}
                className="p-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
              >
                {showApiKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            
            <button
              onClick={handleSaveApiKey}
              disabled={saving || !apiKey || apiKey === '••••••••••••••••'}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {saving ? 'Saving...' : saveSuccess ? (
                <>
                  <Check className="w-5 h-5" />
                  Saved!
                </>
              ) : 'Save API Key'}
            </button>
          </div>
        </div>
      )}

      {/* API Key Status - Show in production */}
      {isApiKeyConfigured && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <div className="flex items-center gap-2 text-green-800">
            <Check className="w-5 h-5" />
            <p className="font-medium">API Key Configured</p>
          </div>
          <p className="text-sm text-green-700 mt-1">
            Your AI features are enabled and ready to use.
          </p>
        </div>
      )}

{/* Cloud Sync & Migration */}
<div className="bg-white rounded-xl p-6 shadow-sm">
  <div className="flex items-center gap-2 mb-4">
    <Cloud className="w-5 h-5 text-purple-600" />
    <h2 className="text-lg font-bold text-gray-800">Cloud Sync</h2>
  </div>
  
  {/* Migration Status */}
  {migrationStatus && (
    <div className={`mb-4 p-4 rounded-xl border ${
      migrationStatus.hasMigrated 
        ? 'bg-green-50 border-green-200' 
        : 'bg-blue-50 border-blue-200'
    }`}>
      <div className="flex items-center gap-2">
        {migrationStatus.hasMigrated ? (
          <>
            <CheckCircle className="w-5 h-5 text-green-600" />
            <div>
              <p className="font-medium text-green-800">Cloud sync enabled</p>
              <p className="text-sm text-green-700 mt-1">
                {migrationStatus.projectCount} projects synced to cloud
              </p>
            </div>
          </>
        ) : (
          <>
            <Database className="w-5 h-5 text-blue-600" />
            <div>
              <p className="font-medium text-blue-800">Local storage only</p>
              <p className="text-sm text-blue-700 mt-1">
                Your data is stored on this device only
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )}

  <div className="space-y-3">
    <div className="bg-gray-50 rounded-lg p-4">
      <h3 className="font-semibold text-gray-800 mb-2">About Cloud Sync</h3>
      <ul className="text-sm text-gray-600 space-y-2">
        <li>✅ Access your data on any device</li>
        <li>✅ Automatic backup to the cloud</li>
        <li>✅ Real-time sync across devices</li>
        <li>✅ Your local data remains intact</li>
      </ul>
    </div>

    {!migrationStatus?.hasMigrated ? (
      <button
        onClick={handleMigration}
        disabled={migrating}
        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {migrating ? (
          <>
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Migrating to Cloud...
          </>
        ) : (
          <>
            <Cloud className="w-5 h-5" />
            Enable Cloud Sync
          </>
        )}
      </button>
    ) : (
      <button
        onClick={handleMigration}
        disabled={migrating}
        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Cloud className="w-5 h-5" />
        Re-sync All Data
      </button>
    )}

    {migrationResults && (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="font-medium text-blue-900 mb-2">Last Migration:</p>
        <div className="text-sm text-blue-800 space-y-1">
          <p>📦 Projects: {migrationResults.projects}</p>
          <p>⏰ Time Logs: {migrationResults.timeLogs}</p>
          <p>📓 Journal Entries: {migrationResults.journalEntries}</p>
          <p>💡 Insights: {migrationResults.insights}</p>
          <p>💬 Conversations: {migrationResults.conversations}</p>
          {migrationResults.errors.length > 0 && (
            <p className="text-red-600 mt-2">
              ⚠️ {migrationResults.errors.length} errors occurred
            </p>
          )}
        </div>
      </div>
    )}
  </div>
</div>

      {/* Notifications */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-bold text-gray-800 mb-4">Notifications</h2>
        
        <div className="space-y-3">
          <label className="flex items-center justify-between">
            <span className="text-gray-700">Daily check-in reminder</span>
            <input
              type="checkbox"
              checked={settings.notifications?.dailyCheckIn}
              onChange={(e) => handleUpdatePreference('notifications', 'dailyCheckIn', e.target.checked)}
              className="w-5 h-5 text-blue-600 rounded"
            />
          </label>
          
          <label className="flex items-center justify-between">
            <span className="text-gray-700">Weekly review notification</span>
            <input
              type="checkbox"
              checked={settings.notifications?.weeklyReview}
              onChange={(e) => handleUpdatePreference('notifications', 'weeklyReview', e.target.checked)}
              className="w-5 h-5 text-blue-600 rounded"
            />
          </label>
          
          <label className="flex items-center justify-between">
            <span className="text-gray-700">AI insight alerts</span>
            <input
              type="checkbox"
              checked={settings.notifications?.insightAlerts}
              onChange={(e) => handleUpdatePreference('notifications', 'insightAlerts', e.target.checked)}
              className="w-5 h-5 text-blue-600 rounded"
            />
          </label>
        </div>
      </div>

      {/* UI Preferences */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-bold text-gray-800 mb-4">Appearance</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Theme
            </label>
            <select
              value={settings.ui?.theme || 'auto'}
              onChange={(e) => handleUpdatePreference('ui', 'theme', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="auto">Auto (System)</option>
            </select>
          </div>

          <label className="flex items-center justify-between">
            <span className="text-gray-700">Show perspective scores</span>
            <input
              type="checkbox"
              checked={settings.ui?.showPerspectiveScores}
              onChange={(e) => handleUpdatePreference('ui', 'showPerspectiveScores', e.target.checked)}
              className="w-5 h-5 text-blue-600 rounded"
            />
          </label>
        </div>
      </div>

      {/* Data Management */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-bold text-gray-800 mb-4">Data Management</h2>
        
        <div className="space-y-3">
          <button
            onClick={handleExportData}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-medium"
          >
            <Download className="w-5 h-5" />
            Export All Data
          </button>
          
          <label className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium cursor-pointer">
            <Upload className="w-5 h-5" />
            Import Data
            <input
              type="file"
              accept=".json"
              onChange={handleImportData}
              className="hidden"
            />
          </label>
          
          <div className="pt-4 border-t border-gray-200">
            <button
              onClick={handleClearAllData}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium"
            >
              <Trash2 className="w-5 h-5" />
              Clear All Data
            </button>
            <p className="text-xs text-red-600 text-center mt-2">
              ⚠️ This action cannot be undone
            </p>
          </div>
        </div>
      </div>

      {/* About */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Info className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-bold text-gray-800">About RetireWise</h2>
        </div>
        
        <div className="space-y-2 text-sm text-gray-600">
          <p><strong>Version:</strong> 1.0.0 MVP</p>
          <p><strong>Built:</strong> December 2024</p>
          <p><strong>Database:</strong> IndexedDB (Local-First)</p>
          <p><strong>AI Model:</strong> Claude Sonnet 4</p>
          <p className="pt-3 border-t border-gray-200">
            Your intelligent retirement portfolio advisor. All data is stored locally on your device.
          </p>
        </div>
      </div>

      {/* Storage Info */}
      <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-600">
        <p className="font-medium mb-2">💾 Local Storage</p>
        <p>All your data is stored securely on your device using IndexedDB. No data is sent to external servers except when you use the AI chat feature, which communicates with Claude API using your API key.</p>
      </div>
    </div>
  );
};

export default Settings;