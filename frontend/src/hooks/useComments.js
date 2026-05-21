import { useState } from 'react';
import API_URL from '../api';

/**
 * Gestiona el estado y operaciones de comentarios:
 * submit, resolve, delete, handleException (crear excepción desde CommentPanel).
 */
export function useComments({ projectId, token, setExceptions }) {
  const [comments, setComments] = useState([]);
  const [commentInputs, setCommentInputs] = useState({});
  const [replyingTo, setReplyingTo] = useState(null);
  const [mentionQuery, setMentionQuery] = useState(null);

  const submitComment = async (elementId, parentId = null) => {
    const key = parentId ? parentId : `new_${elementId}`;
    const text = (commentInputs[key] || '').trim();
    if (!text) return;

    const tok = JSON.parse(localStorage.getItem('tropica_user'))?.token;
    const res = await fetch(`${API_URL}/api/projects/${projectId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tok}` },
      body: JSON.stringify({ elementId, text, parentId })
    });
    const comment = await res.json();

    if (parentId) {
      setComments(prev => prev.map(c =>
        c.id === parentId ? { ...c, replies: [...(c.replies || []), comment] } : c
      ));
      setReplyingTo(null);
    } else {
      setComments(prev => [...prev, comment]);
    }
    setCommentInputs(prev => ({ ...prev, [key]: '' }));
  };

  const resolveComment = async (commentId) => {
    const tok = JSON.parse(localStorage.getItem('tropica_user'))?.token;
    const res = await fetch(`${API_URL}/api/comments/${commentId}/resolve`, {
      method: 'PATCH', headers: { 'Authorization': `Bearer ${tok}` }
    });
    const updated = await res.json();
    setComments(prev => prev.map(c => c.id === commentId ? updated : c));
  };

  const deleteComment = async (commentId, parentId = null) => {
    const tok = JSON.parse(localStorage.getItem('tropica_user'))?.token;
    await fetch(`${API_URL}/api/comments/${commentId}`, {
      method: 'DELETE', headers: { 'Authorization': `Bearer ${tok}` }
    });
    if (parentId) {
      setComments(prev => prev.map(c =>
        c.id === parentId ? { ...c, replies: (c.replies || []).filter(r => r.id !== commentId) } : c
      ));
    } else {
      setComments(prev => prev.filter(c => c.id !== commentId));
    }
  };

  const handleException = async (commentId, word, reason, canvases) => {
    const tok = JSON.parse(localStorage.getItem('tropica_user'))?.token;
    const comment = comments.find(c => c.id === commentId);
    const elementId = comment?.elementId;

    let imageUrl = null;
    if (elementId && canvases) {
      const allItems = [];
      const collect = (items) => items.forEach(item => {
        if (item.type === 'rowGroup' && item.items) item.items.forEach(c => allItems.push(c));
        else allItems.push(item);
      });
      collect([...(canvases.desktop || []), ...(canvases.mobile || [])]);
      imageUrl = allItems.find(i => i.uniqueId === elementId)?.uploadedImages?.[0] || null;
    }

    const res = await fetch(`${API_URL}/api/comments/${commentId}/exception`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tok}` },
      body: JSON.stringify({ word, reason, imageUrl, projectId, elementId })
    });
    const result = await res.json();
    if (result.exception) setExceptions(prev => [result.exception, ...prev]);
    if (result.resolved) setComments(prev => prev.map(c => c.id === commentId ? { ...c, resolved: true } : c));
  };

  return {
    comments, setComments,
    commentInputs, setCommentInputs,
    replyingTo, setReplyingTo,
    mentionQuery, setMentionQuery,
    submitComment, resolveComment, deleteComment, handleException
  };
}
