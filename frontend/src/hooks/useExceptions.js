import { useState } from 'react';
import API_URL from '../api';

export function useExceptions({ projectId }) {
  const [exceptions, setExceptions] = useState([]);
  const [showMaiaPanel, setShowMaiaPanel] = useState(false);
  const [newExWord, setNewExWord] = useState('');
  const [newExReason, setNewExReason] = useState('');
  const [newExLoading, setNewExLoading] = useState(false);
  const [editingExId, setEditingExId] = useState(null);
  const [editWord, setEditWord] = useState('');
  const [editReason, setEditReason] = useState('');

  const addException = async () => {
    if (!newExWord.trim()) return;
    const tok = JSON.parse(localStorage.getItem('tropica_user'))?.token;
    setNewExLoading(true);
    const res = await fetch(`${API_URL}/api/projects/${projectId}/exceptions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tok}` },
      body: JSON.stringify({ word: newExWord, reason: newExReason })
    });
    const ex = await res.json();
    if (ex.id) {
      setExceptions(prev => [ex, ...prev]);
      setNewExWord(''); setNewExReason('');
    }
    setNewExLoading(false);
  };

  const deleteException = async (exId) => {
    const tok = JSON.parse(localStorage.getItem('tropica_user'))?.token;
    await fetch(`${API_URL}/api/exceptions/${exId}`, {
      method: 'DELETE', headers: { 'Authorization': `Bearer ${tok}` }
    });
    setExceptions(prev => prev.filter(e => e.id !== exId));
  };

  const editException = async (exId) => {
    if (!editWord.trim()) return;
    const tok = JSON.parse(localStorage.getItem('tropica_user'))?.token;
    const res = await fetch(`${API_URL}/api/exceptions/${exId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tok}` },
      body: JSON.stringify({ word: editWord, reason: editReason })
    });
    const updated = await res.json();
    if (updated.id) {
      setExceptions(prev => prev.map(e => e.id === exId ? updated : e));
      setEditingExId(null);
    }
  };

  const startEditing = (ex) => {
    setEditingExId(ex.id);
    setEditWord(ex.word);
    setEditReason(ex.reason || '');
  };

  return {
    exceptions, setExceptions,
    showMaiaPanel, setShowMaiaPanel,
    newExWord, setNewExWord,
    newExReason, setNewExReason,
    newExLoading,
    editingExId, setEditingExId,
    editWord, setEditWord,
    editReason, setEditReason,
    addException, deleteException, editException, startEditing
  };
}
