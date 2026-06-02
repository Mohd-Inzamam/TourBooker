import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, X, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useNotifications } from '../../context/NotificationContext';
import { getConversations, getMessages, sendMessage } from '../../services/messaging.service';
import { formatRelativeTime } from '../../utils/formatDate';
import './MessagesPage.css';

const MessagesPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { refreshNotifications } = useNotifications();
  
  const [conversations, setConversations] = useState([]);
  const [filteredConversations, setFilteredConversations] = useState([]);
  const [search, setSearch] = useState('');
  
  const [activeConvId, setActiveConvId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  
  const [inputVal, setInputVal] = useState('');
  const [sending, setSending] = useState(false);
  
  const messagesEndRef = useRef(null);

  // Initial Conversation Load
  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      const res = await getConversations();
      if (res.success || res.status === 'success') {
         const list = res.conversations || res.data?.conversations || [];
         setConversations(list);
         setFilteredConversations(list);
      }
    } catch(err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (!search) {
      setFilteredConversations(conversations);
      return;
    }
    const lower = search.toLowerCase();
    const filtered = conversations.filter(c => {
       const other = c.participants.find(p => p._id !== user._id);
       const nameMatch = other && other.name.toLowerCase().includes(lower);
       const tourMatch = c.tourId && c.tourId.title.toLowerCase().includes(lower);
       return nameMatch || tourMatch;
    });
    setFilteredConversations(filtered);
  }, [search, conversations, user._id]);

  useEffect(() => {
     if (activeConvId) {
        loadMessages(activeConvId, 1);
     }
  }, [activeConvId]);

  const loadMessages = async (convId, pageNum = 1) => {
    try {
       const res = await getMessages(convId, pageNum);
       if (res.success || res.status === 'success') {
          const fetchedMessages = res.messages || res.data?.messages || [];
          if (pageNum === 1) {
             setMessages(fetchedMessages);
          } else {
             setMessages(prev => [...fetchedMessages, ...prev]);
          }
          setPage(res.currentPage || pageNum);
          setHasMore(res.totalPages > (res.currentPage || pageNum));
          
          if (pageNum === 1) {
             setTimeout(scrollToBottom, 100);
             refreshNotifications(); // Clear badge logic
             // Update local unread explicitly
             setConversations(prev => prev.map(c => c._id === convId ? { ...c, isUnread: false } : c));
          }
       }
    } catch(err) {
       console.error(err);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async () => {
    if (!inputVal.trim() || sending || !activeConvId) return;
    setSending(true);
    try {
      const res = await sendMessage(activeConvId, { content: inputVal });
      if (res.success || res.status === 'success') {
         const newMsg = res.message || res.data;
         setMessages(prev => [...prev, newMsg]);
         setInputVal('');
         setTimeout(scrollToBottom, 50);
         fetchConversations(); // refresh list to bump last message upwards
      }
    } catch(err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getPartner = (conv) => {
    return conv.participants.find(p => p._id !== user._id) || user;
  };

  const getAvatarColor = (name) => {
    const charCode = name.charCodeAt(0) || 0;
    const colors = ['#b8860b', '#2563eb', '#db2777', '#059669', '#7c3aed', '#ea580c'];
    return colors[charCode % colors.length];
  };

  const activeConvObj = conversations.find(c => c._id === activeConvId);

  return (
    <div className="ag-messages-layout">
      {/* LEFT PANEL */}
      <div className="ag-conversation-list" style={{ display: (activeConvId && window.innerWidth <= 768) ? 'none' : 'flex' }}>
        <div className="ag-conversation-search">
          <input 
            type="text" 
            placeholder="Search messages..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--ag-border)', borderRadius: '8px', fontSize: '0.9rem' }}
          />
        </div>
        
        {filteredConversations.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#888' }}>
            No conversations yet
          </div>
        ) : (
          filteredConversations.map(conv => {
            const partner = getPartner(conv);
            return (
              <div 
                key={conv._id} 
                className={`ag-conversation-item ${conv._id === activeConvId ? 'active' : ''} ${conv.isUnread ? 'unread' : ''}`}
                onClick={() => setActiveConvId(conv._id)}
              >
                <div className="ag-avatar" style={{ background: getAvatarColor(partner.name) }}>
                  {partner.name.charAt(0).toUpperCase()}
                </div>
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                    <span className="ag-conv-name" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{partner.name}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '0.7rem', color: '#888' }}>{formatRelativeTime(conv.lastMessageAt)}</span>
                      {conv.isUnread && <div className="ag-unread-dot"></div>}
                    </div>
                  </div>
                  {conv.tourId && (
                    <div style={{ fontSize: '0.7rem', color: '#888', marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      re: {conv.tourId.title}
                    </div>
                  )}
                  <div style={{ fontSize: '0.8rem', color: conv.isUnread ? '#333' : '#888', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {conv.lastMessage || 'Start conversation...'}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* RIGHT PANEL */}
      <div className="ag-message-thread" style={{ display: (!activeConvId && window.innerWidth <= 768) ? 'none' : 'flex' }}>
        {!activeConvObj ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#888' }}>
            <MessageSquare size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
            <p>Select a conversation to start messaging</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--ag-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff', zIndex: 5, boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {window.innerWidth <= 768 && (
                  <button onClick={() => setActiveConvId(null)} style={{ background: 'none', border: 'none', padding: '4px', cursor: 'pointer', marginRight: '4px' }}>
                     <X size={20} />
                  </button>
                )}
                <div className="ag-avatar" style={{ background: getAvatarColor(getPartner(activeConvObj).name), width: 36, height: 36, fontSize: '0.8rem' }}>
                  {getPartner(activeConvObj).name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '1rem' }}>{getPartner(activeConvObj).name}</div>
                  {activeConvObj.tourId && (
                     <span style={{ fontSize: '0.75rem', padding: '2px 8px', background: '#f1f1f1', borderRadius: '12px', color: '#666' }}>re: {activeConvObj.tourId.title}</span>
                  )}
                </div>
              </div>

              {(user?.role === 'admin' || user?.role === 'operator') && (
                <button 
                  onClick={() => navigate(`/${user.role}/dashboard`)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '8px 16px', borderRadius: '8px',
                    background: 'var(--ag-surface, #f8fafc)',
                    border: '1px solid var(--ag-border, #e2e8f0)',
                    color: 'var(--ag-text-main, #0f172a)',
                    fontSize: '0.85rem', fontWeight: 600,
                    cursor: 'pointer', transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
                  onMouseLeave={e => e.currentTarget.style.background = 'var(--ag-surface, #f8fafc)'}
                >
                  <ArrowLeft size={16} />
                  Back to Dashboard
                </button>
              )}
            </div>

            {/* Messages */}
            <div className="ag-messages-area">
              {hasMore && (
                <button 
                  onClick={() => loadMessages(activeConvId, page + 1)} 
                  style={{ alignSelf: 'center', background: 'none', border: '1px solid #ddd', padding: '4px 12px', borderRadius: '16px', fontSize: '0.8rem', cursor: 'pointer', color: '#666', marginBottom: '1rem' }}
                >
                  Load Older Messages
                </button>
              )}
              {messages.map((msg, i) => {
                 const isSystem = msg.messageType === 'system';
                 const isMine = msg.senderId === user._id;
                 const cssClass = isSystem ? 'system' : (isMine ? 'sent' : 'received');

                 return (
                   <div key={msg._id || i} className={`ag-message ${cssClass}`}>
                     <div className="ag-message-bubble">{msg.content}</div>
                     {!isSystem && <div className="ag-message-timestamp">{new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>}
                   </div>
                 );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            {activeConvObj.status === 'closed' ? (
              <div style={{ padding: '1rem', background: '#ffebee', color: '#c62828', textAlign: 'center', fontSize: '0.9rem', fontWeight: 500 }}>
                This conversation has been closed.
              </div>
            ) : (
              <div className="ag-message-input-area">
                <div style={{ flex: 1, position: 'relative' }}>
                  <textarea 
                    className="ag-message-textarea"
                    placeholder="Write a message..."
                    value={inputVal}
                    onChange={(e) => setInputVal(e.target.value)}
                    onKeyDown={handleKeyDown}
                    rows={1}
                  />
                  {inputVal.length > 100 && (
                    <span style={{ position: 'absolute', right: '12px', bottom: '12px', fontSize: '0.7rem', color: inputVal.length > 2000 ? 'red' : '#888' }}>
                      {inputVal.length}/2000
                    </span>
                  )}
                </div>
                <button 
                  onClick={handleSend}
                  disabled={!inputVal.trim() || sending || inputVal.length > 2000}
                  style={{ background: 'var(--ag-primary)', color: '#fff', border: 'none', borderRadius: '50%', width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, opacity: (!inputVal.trim() || sending) ? 0.6 : 1 }}
                >
                  <Send size={18} style={{ marginLeft: '2px' }} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default MessagesPage;
