// src/App.js
import React, { useState, useEffect } from 'react';
import { Home, MessageSquare, BookOpen, BarChart3, Settings, Plus, FolderOpen } from 'lucide-react';
import { Lightbulb } from 'lucide-react';
import { useAuth } from './contexts/AuthContext';
import AuthScreen from './components/Auth/AuthScreen';
// import db from './db/database';

import * as unifiedDB from './db/unifiedDB';

import { getActiveInsights } from './db/insights';

import ProjectDetails from './components/ProjectDetails';
import ProjectForm from './components/ProjectForm';
import AIChat from './components/AIChat';
import JournalList from './components/JournalList';
import QuickTimeLog from './components/QuickTimeLog';
import Analytics from './components/Analytics';
import AppSettings from './components/AppSettings';
import './index.css';
import InsightsPanel from './components/InsightsPanel';
import TimeLogsView from './components/TimeLogsView';
import ProjectsListView from './components/ProjectsListView';
import { setJournalUserId } from './db/journal';


function App() {
  const { currentUser } = useAuth();
 
  const [currentScreen, setCurrentScreen] = useState('home');
  const [projects, setProjects] = useState([]);
  const [todayHours, setTodayHours] = useState(0);
  const [topInsights, setTopInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modals
  const [selectedProject, setSelectedProject] = useState(null);
  const [showProjectDetails, setShowProjectDetails] = useState(false);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [editingProject, setEditingProject] = useState(null);

  const loadData = async () => {
    try {
      const allProjects = await unifiedDB.getAllProjects();
      // Show active and planning projects on home
      const visibleProjects = allProjects.filter(p => 
        p.status === 'active' || p.status === 'planning'
      );
      setProjects(visibleProjects);
      
//      const [activeProjects, todayLogs] = await Promise.all([
//      unifiedDB.getActiveProjects(),  // Changed
//      unifiedDB.getTodayTimeLogs()    // Changed
//      ]);

      const todayLogs = await unifiedDB.getTodayTimeLogs();

      const totalToday = todayLogs.reduce((sum, log) => sum + log.duration, 0);
    
//      setProjects(activeProjects);
      setTodayHours(totalToday);
    
      // Load insights separately with error handling
      try {
        const insights = await getActiveInsights();
        setTopInsights(insights.slice(0, 2));
      } catch (insightError) {
        console.error('Error loading insights:', insightError);
        setTopInsights([]); // Set empty array if insights fail
      }
    
      setLoading(false);
    } catch (error) {
        console.error('Error loading data:', error);
        setLoading(false);
    }
  };

  const handleProjectClick = (project) => {
    
    console.log('Project clicked: ', project);
  console.log('handleProjectClick called:', project.name);
  console.log('Before - showProjectDetails:', showProjectDetails);
    setSelectedProject(project);
    setShowProjectDetails(true);
  };

  const handleEditProject = (project) => {
    setEditingProject(project);
    setShowProjectDetails(false);
    setShowProjectForm(true);
  };

  const handleCloseDetails = () => {
    setShowProjectDetails(false);
    setSelectedProject(null);
  };

  const handleCloseForm = () => {
    setShowProjectForm(false);
    setEditingProject(null);
  };

  const handleProjectSaved = () => {
    loadData();
  };

  const handleProjectDeleted = () => {
    loadData();
  };

  // Set the user for unified DB
  useEffect(() => {
    if (currentUser) {
      unifiedDB.setCurrentUser(currentUser.uid);
      setJournalUserId(currentUser.uid);
    } else {
      unifiedDB.setCurrentUser(null);
      setJournalUserId(null);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser){
      loadData();
    }

    // Listen for time log additions
    const handleTimeLogAdded = () => loadData();
    window.addEventListener('timeLogAdded', handleTimeLogAdded);
  
    // Listen for navigation to time logs
    const handleNavigateToTimeLogs = () => setCurrentScreen('timelogs');
    window.addEventListener('navigateToTimeLogs', handleNavigateToTimeLogs);
  
    return () => {
      window.removeEventListener('timeLogAdded', handleTimeLogAdded);
      window.removeEventListener('navigateToTimeLogs', handleNavigateToTimeLogs);
    };
  }, [currentUser]);

  // If not logged in, show auth screen
  if (!currentUser) {
    return <AuthScreen />;
  }

  // If logged in but still loading data, show loading
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl mx-auto mb-4 flex items-center justify-center text-white font-bold text-2xl animate-pulse">
            R
          </div>
          <p className="text-gray-600">Loading RetireWise...</p>
        </div>
      </div>
    );
  }

  // Placeholder screens
  const HomeScreen = () => (
    <div className="space-y-4">
      <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-sm opacity-90">Welcome to</p>
            <h2 className="text-3xl font-bold">RetireWise</h2>
          </div>
          <div className="text-right">
            <p className="text-sm opacity-90">Today</p>
            <div className="flex items-baseline gap-1">
              <p className="text-3xl font-bold">{todayHours.toFixed(1)}</p>
              <p className="text-sm">hours</p>
            </div>
          </div>
        </div>
        <p className="text-sm opacity-90">Your intelligent retirement portfolio advisor</p>
      </div>

      {/* Top Insights Preview */}
      {topInsights && topInsights.length > 0 && (
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-yellow-500" />
              Latest Insights
            </h3>
            <button
              onClick={() => setCurrentScreen('insights')}
              className="text-blue-600 text-sm font-medium hover:underline"
            >
              View All
            </button>
          </div>
          <div className="space-y-2">
            {topInsights.map(insight => (
              <div key={insight.id} className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-800">{insight.title}</p>
                <p className="text-xs text-gray-600 mt-1 line-clamp-2">{insight.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-800">Your Projects</h3>
          <span className="text-sm text-gray-500">{projects.length} active</span>
        </div>
        
        {projects.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p className="mb-4">No projects yet. Create your first one to get started!</p>
            <button 
              onClick={() => setShowProjectForm(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
            >
              Create Your First Project
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {projects.map((project) => (
              <button
                key={project.id}
                onClick={() => handleProjectClick(project)}
                className="w-full flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div 
                  className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-semibold text-lg flex-shrink-0"
                  style={{ backgroundColor: project.color }}
                >
                  {project.icon || project.name[0]}
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="font-medium text-gray-800 truncate">{project.name}</p>
                  <p className="text-xs text-gray-500">
                    {project.totalHoursLogged}h logged
                    {project.lastWorkedAt && ` • Last: ${new Date(project.lastWorkedAt).toLocaleDateString()}`}
                  </p>
                </div>
                <div className={`px-2 py-1 rounded-full text-xs flex-shrink-0 ${
                  project.status === 'active' ? 'bg-green-100 text-green-700' :
                  project.status === 'planning' ? 'bg-purple-100 text-purple-700' :
                  project.status === 'paused' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {project.status}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );

//  const PlaceholderScreen = ({ title, icon: Icon }) => (
//    <div className="flex flex-col items-center justify-center h-full text-gray-500">
//      <Icon className="w-16 h-16 mb-4 text-gray-400" />
//      <h2 className="text-xl font-semibold mb-2">{title}</h2>
//      <p className="text-sm">Coming soon...</p>
//    </div>
//  );

  // Navigation items
  const navItems = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'chat', icon: MessageSquare, label: 'AI Advisor' },
    { id: 'journal', icon: BookOpen, label: 'Journal' },
    { id: 'stats', icon: BarChart3, label: 'Analytics' }
  ];

//  if (loading) {
//    return (
//      <div className="flex items-center justify-center h-screen bg-gray-50">
//        <div className="text-center">
//          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl mx-auto mb-4 flex items-center justify-center text-white font-bold text-2xl animate-pulse">
//            R
//          </div>
//          <p className="text-gray-600">Loading RetireWise...</p>
//        </div>
//      </div>
//    );
//  }

  console.log('Modal check - showProjectDetails:', {showProjectDetails});
  console.log('Modal check - selectedProject:', {selectedProject});

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-gray-50 relative">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
            R
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-800">RetireWise</h1>
            <p className="text-xs text-gray-500">MVP v0.1</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentScreen('projects')}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <FolderOpen className="w-5 h-5" />
          </button>
          <button
            onClick={() => setCurrentScreen('insights')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative"
          >
            <Lightbulb className="w-5 h-5 text-gray-600" />
            {topInsights && topInsights.length > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-yellow-500 rounded-full"></span>
            )}
          </button>
          <button 
            onClick={() => setCurrentScreen('settings')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Settings className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {currentScreen === 'home' && <HomeScreen />}

        {currentScreen === 'chat' && (
          <div className="h-full -m-4">
            <AIChat />
          </div>
        )}
        {currentScreen === 'projects' && (
          <ProjectsListView
            onProjectClick={handleProjectClick}
            onEditProject={handleEditProject}
            onNewProject={() => setShowProjectForm(true)}
          />
        )}
        {currentScreen === 'journal' && <JournalList />}
        {currentScreen === 'stats' && <Analytics />}
        {currentScreen === 'insights' && <InsightsPanel />}
        {currentScreen === 'settings' && <AppSettings />}
        {currentScreen === 'timelogs' && <TimeLogsView />}

      </div>

      {/* Quick Time Log Button (only on Home screen) */}
      {currentScreen === 'home' && <QuickTimeLog />}

      {/* Floating Action Button (only on Home screen) */}
      {currentScreen === 'home' && (
        <button
          onClick={() => setShowProjectForm(true)}
          className="fixed bottom-20 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all hover:scale-110 flex items-center justify-center z-40"
        >
          <Plus className="w-6 h-6" />
        </button>
      )}

      {/* Bottom Navigation */}
      <div className="bg-white border-t border-gray-200 px-4 py-2 flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentScreen === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentScreen(item.id)}
              className="flex flex-col items-center gap-1 py-2 px-3 rounded-lg transition-colors"
            >
              <Icon className={`w-6 h-6 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
              <span className={`text-xs ${isActive ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Modals */}
      

      {showProjectDetails && selectedProject && (
        <ProjectDetails
          projectId={selectedProject.id}
          onClose={handleCloseDetails}
          onEdit={handleEditProject}
          onDeleted={handleProjectDeleted}
        />
      )}


      {showProjectForm && (
        <ProjectForm
          project={editingProject}
          onClose={handleCloseForm}
          onSaved={handleProjectSaved}
        />
      )}
    </div>
  );
}

export default App;