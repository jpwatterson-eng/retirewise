// src/components/JournalEntryForm.js
import React, { useState, useEffect } from 'react';
import { X, Plus, Calendar, Tag, Smile, Meh, Frown } from 'lucide-react';
import { createJournalEntry, updateJournalEntry } from '../db/journal';
import { getAllProjects } from '../db/projects';

const JournalEntryForm = ({ entry, onClose, onSaved }) => {
  const isEdit = !!entry;
  
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    projectId: null,
    entryType: 'reflection',
    sentiment: null,
    tags: [],
    favorite: false
  });
  
  const [tagInput, setTagInput] = useState('');
  const [projects, setProjects] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadProjects();
    
    if (entry) {
      setFormData({
        title: entry.title || '',
        content: entry.content || '',
        projectId: entry.projectId || null,
        entryType: entry.entryType || 'reflection',
        sentiment: entry.sentiment || null,
        tags: entry.tags || [],
        favorite: entry.favorite || false
      });
    }
  }, [entry]);

  const loadProjects = async () => {
    const allProjects = await getAllProjects();
    setProjects(allProjects);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.content.trim()) return;
    
    setSaving(true);

    try {
      if (isEdit) {
        await updateJournalEntry(entry.id, formData);
      } else {
        await createJournalEntry(formData);
      }

      onSaved();
      onClose();
    } catch (error) {
      console.error('Error saving journal entry:', error);
      alert('Failed to save entry');
    } finally {
      setSaving(false);
    }
  };

  const entryTypes = [
    { value: 'reflection', label: 'Reflection', emoji: '💭' },
    { value: 'learning', label: 'Learning', emoji: '📚' },
    { value: 'decision', label: 'Decision', emoji: '🎯' },
    { value: 'milestone', label: 'Milestone', emoji: '🏆' },
    { value: 'struggle', label: 'Struggle', emoji: '💪' },
    { value: 'idea', label: 'Idea', emoji: '💡' },
    { value: 'general', label: 'General', emoji: '📝' }
  ];

  const sentiments = [
    { value: 'positive', label: 'Positive', icon: Smile, color: 'text-green-600' },
    { value: 'neutral', label: 'Neutral', icon: Meh, color: 'text-gray-600' },
    { value: 'negative', label: 'Negative', icon: Frown, color: 'text-red-600' }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800">
            {isEdit ? 'Edit Entry' : 'New Journal Entry'}
          </h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Title (Optional) */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Title (optional)
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="Give this entry a title..."
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              What's on your mind? *
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => handleChange('content', e.target.value)}
              required
              placeholder="Write your thoughts, reflections, or observations..."
              rows="8"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.content.length} characters
            </p>
          </div>

          {/* Entry Type */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Entry Type
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {entryTypes.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => handleChange('entryType', type.value)}
                  className={`p-3 border-2 rounded-xl transition-colors text-center ${
                    formData.entryType === type.value
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-2xl mb-1">{type.emoji}</div>
                  <p className="text-xs font-medium text-gray-700">{type.label}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Project Link */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Link to Project (optional)
            </label>
            <select
              value={formData.projectId || ''}
              onChange={(e) => handleChange('projectId', e.target.value || null)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">No project</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.icon || '📁'} {project.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sentiment */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              How are you feeling?
            </label>
            <div className="flex gap-3">
              {sentiments.map((sentiment) => {
                const Icon = sentiment.icon;
                return (
                  <button
                    key={sentiment.value}
                    type="button"
                    onClick={() => handleChange('sentiment', 
                      formData.sentiment === sentiment.value ? null : sentiment.value
                    )}
                    className={`flex-1 p-3 border-2 rounded-xl transition-colors ${
                      formData.sentiment === sentiment.value
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Icon className={`w-6 h-6 mx-auto mb-1 ${sentiment.color}`} />
                    <p className="text-xs font-medium text-gray-700">{sentiment.label}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Tags
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                placeholder="Add tags..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={addTag}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag, idx) => (
                  <span 
                    key={idx}
                    className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full"
                  >
                    <Tag className="w-3 h-3" />
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Favorite Toggle */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="favorite"
              checked={formData.favorite}
              onChange={(e) => handleChange('favorite', e.target.checked)}
              className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
            <label htmlFor="favorite" className="text-sm font-medium text-gray-700">
              Mark as favorite ⭐
            </label>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !formData.content.trim()}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Entry'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default JournalEntryForm;