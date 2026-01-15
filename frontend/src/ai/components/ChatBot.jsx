import React, { useState, useRef, useEffect } from 'react';
import { marked } from 'marked';

const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');

  // [수정] 초기 상태를 localStorage에서 불러오기
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem('chat_history');
    return saved ? JSON.parse(saved) : [
      { role: 'ai', content: '안녕하세요! 빌릴수e서울 도서 큐레이터입니다. 어떤 책을 추천해 드릴까요?' }
    ];
  });

  const chatWindowRef = useRef(null);

  // [추가] 메시지가 변경될 때마다 localStorage에 저장
  useEffect(() => {
    localStorage.setItem('chat_history', JSON.stringify(messages));
    if (chatWindowRef.current) {
      chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    marked.setOptions({
      breaks: true,
      gfm: true
    });
  }, []);

  const toggleChat = () => setIsOpen(!isOpen);

  // [추가] 대화 내역 초기화 기능 (필요할 경우 사용)
  const resetChat = () => {
    const initialMsg = [{ role: 'ai', content: '안녕하세요! 대화가 초기화되었습니다. 어떤 책을 찾으시나요?' }];
    setMessages(initialMsg);
    localStorage.removeItem('chat_history');
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userText = input;
    setMessages(prev => [...prev, { role: 'user', content: userText }]);
    setInput('');
    setMessages(prev => [...prev, { role: 'ai', content: '생각 중입니다...' }]);

    try {
      const response = await fetch('http://localhost:7878/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: userText })
      });
      const data = await response.text();

      setMessages(prev => {
        const newMsgs = [...prev];
        newMsgs.pop();
        return [...newMsgs, { role: 'ai', content: data }];
      });
    } catch (error) {
      setMessages(prev => {
        const newMsgs = [...prev];
        newMsgs.pop();
        return [...newMsgs, { role: 'ai', content: '서버와 연결할 수 없습니다.' }];
      });
    }
  };

  return (
    <div style={{ fontFamily: 'sans-serif' }}>
      <div style={styles.launcher} onClick={toggleChat}>
        <span style={{ fontSize: '30px' }}>📚</span>
        {!isOpen && <div style={styles.bubble}>도서 추천은 저에게 물어보세요!</div>}
      </div>

      {isOpen && (
        <div style={styles.container}>
          <div style={styles.header}>
            <span>북봇 큐레이터</span>
            <div>
              <button onClick={resetChat} style={{...styles.closeBtn, fontSize: '12px', marginRight: '10px'}}>🔄 초기화</button>
              <button onClick={toggleChat} style={styles.closeBtn}>✕</button>
            </div>
          </div>

          <div style={styles.window} ref={chatWindowRef}>
            {messages.map((msg, index) => (
              <div
                key={index}
                style={{
                  ...styles.message,
                  ...(msg.role === 'user' ? styles.userMsg : styles.aiMsg)
                }}
              >
                <div
                  className="markdown-content"
                  style={styles.markdown} // [추가] 하이퍼링크 스타일 적용
                  dangerouslySetInnerHTML={{ __html: marked.parse(msg.content) }}
                />
              </div>
            ))}
          </div>

          <div style={styles.inputArea}>
            <input
              style={styles.input}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="질문을 입력하세요..."
            />
            <button style={styles.sendBtn} onClick={sendMessage}>보내기</button>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  // ... (기존 스타일 유지)
  launcher: { position: 'fixed', bottom: '30px', right: '30px', width: '65px', height: '65px', backgroundColor: '#007bff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.2)', cursor: 'pointer', zIndex: 9999 },
  bubble: { position: 'absolute', right: '80px', width: '160px', backgroundColor: '#333', color: 'white', padding: '8px 12px', borderRadius: '10px', fontSize: '12px', textAlign: 'center' },
  container: { position: 'fixed', bottom: '110px', right: '30px', width: '350px', height: '550px', backgroundColor: 'white', borderRadius: '15px', boxShadow: '0 8px 24px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column', zIndex: 9999, border: '1px solid #eee', overflow: 'hidden' },
  header: { backgroundColor: '#007bff', color: 'white', padding: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 'bold' },
  closeBtn: { background: 'none', border: 'none', color: 'white', fontSize: '18px', cursor: 'pointer' },
  window: { flex: 1, overflowY: 'auto', padding: '15px', display: 'flex', flexDirection: 'column', gap: '12px', backgroundColor: '#f9f9f9' },
  message: { padding: '10px 14px', borderRadius: '12px', fontSize: '14px', maxWidth: '85%', lineHeight: '1.6', whiteSpace: 'pre-wrap', wordBreak: 'break-word' },
  userMsg: { backgroundColor: '#007bff', color: 'white', alignSelf: 'flex-end', borderBottomRightRadius: '2px' },
  aiMsg: { backgroundColor: '#ffffff', color: '#333', alignSelf: 'flex-start', borderBottomLeftRadius: '2px', border: '1px solid #e0e0e0' },
  inputArea: { padding: '10px', display: 'flex', gap: '5px', borderTop: '1px solid #eee', backgroundColor: 'white' },
  input: { flex: 1, border: '1px solid #ddd', borderRadius: '20px', padding: '10px 15px', outline: 'none' },
  sendBtn: { backgroundColor: '#007bff', color: 'white', border: 'none', padding: '8px 20px', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold' },

  // [추가] 마크다운 내부 링크 스타일링
  markdown: {
    '& a': {
      color: '#007bff',
      textDecoration: 'underline',
      fontWeight: 'bold'
    }
  }
};

export default ChatBot;