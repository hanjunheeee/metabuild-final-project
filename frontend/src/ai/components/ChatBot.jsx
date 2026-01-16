import React, { useState, useRef, useEffect } from 'react';
import { marked } from 'marked';
import { useNavigate } from 'react-router-dom'; // 페이지 이동을 위함

const ChatBot = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');

  // [수정] sessionStorage 사용하여 브라우저 탭 종료 전까지 대화 유지
  const [messages, setMessages] = useState(() => {
    const saved = sessionStorage.getItem('chat_session');
    return saved ? JSON.parse(saved) : [
      { role: 'ai', content: '안녕하세요! 빌릴수e서울 도서 큐레이터입니다. 어떤 책을 추천해 드릴까요?' }
    ];
  });

  const chatWindowRef = useRef(null);

  // 메시지 변경 시 세션 스토리지 저장 및 스크롤 조절
  useEffect(() => {
    sessionStorage.setItem('chat_session', JSON.stringify(messages));
    if (chatWindowRef.current) {
      chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    marked.setOptions({ breaks: true, gfm: true });
  }, []);

  // [추가] 마크다운 내 링크 클릭 시 리액트 라우터로 처리하는 로직
  const handleContentClick = (e) => {
    const target = e.target;
    if (target.tagName === 'A') {
      e.preventDefault();
      const href = target.getAttribute('href');

      if (href.startsWith('/')) {
        // [수정] 단순 navigate 대신 window.location.href를 사용하여
        // 검색 페이지가 파라미터를 읽고 새롭게 검색을 수행하도록 합니다.
        window.location.href = href;
      } else {
        window.open(href, '_blank');
      }
    }
  };

  const toggleChat = () => setIsOpen(!isOpen);

  // [수정] 초기화 버튼 클릭 시 동작 (멘트 변경 및 로컬/서버 내역 삭제)
  const resetChat = async () => {
    const initialMsg = [{ role: 'ai', content: '안녕하세요! 빌릴수e서울 도서 큐레이터입니다. 어떤 책을 추천해 드릴까요?' }];
    setMessages(initialMsg);
    sessionStorage.removeItem('chat_session');

    try {
      await fetch('http://localhost:7878/api/chat/reset', { method: 'POST' });
    } catch (e) {
      console.log("서버 리셋 요청 실패");
    }
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
            <span style={{ fontSize: '16px' }}>북봇 큐레이터</span>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <button onClick={resetChat} style={styles.resetBtn}>🔄 초기화</button>
              <button onClick={toggleChat} style={styles.closeBtn}>✕</button>
            </div>
          </div>

          <div style={styles.window} ref={chatWindowRef} onClick={handleContentClick}>
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
  launcher: { position: 'fixed', bottom: '30px', right: '30px', width: '65px', height: '65px', backgroundColor: '#007bff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.2)', cursor: 'pointer', zIndex: 9999 },
  bubble: { position: 'absolute', right: '80px', width: '160px', backgroundColor: '#333', color: 'white', padding: '8px 12px', borderRadius: '10px', fontSize: '12px', textAlign: 'center' },
  container: { position: 'fixed', bottom: '110px', right: '30px', width: '350px', height: '550px', backgroundColor: 'white', borderRadius: '15px', boxShadow: '0 8px 24px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column', zIndex: 9999, border: '1px solid #eee', overflow: 'hidden' },
  header: { backgroundColor: '#007bff', color: 'white', padding: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 'bold' },
  resetBtn: { background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', fontSize: '12px', cursor: 'pointer', padding: '4px 8px', borderRadius: '4px', marginRight: '10px' },
  closeBtn: { background: 'none', border: 'none', color: 'white', fontSize: '18px', cursor: 'pointer' },
  window: { flex: 1, overflowY: 'auto', padding: '15px', display: 'flex', flexDirection: 'column', gap: '12px', backgroundColor: '#f9f9f9' },
  message: { padding: '10px 14px', borderRadius: '12px', fontSize: '14px', maxWidth: '85%', lineHeight: '1.6', wordBreak: 'break-word' },
  userMsg: { backgroundColor: '#007bff', color: 'white', alignSelf: 'flex-end', borderBottomRightRadius: '2px' },
  aiMsg: { backgroundColor: '#ffffff', color: '#333', alignSelf: 'flex-start', borderBottomLeftRadius: '2px', border: '1px solid #e0e0e0' },
  inputArea: { padding: '15px 10px', display: 'flex', gap: '8px', borderTop: '1px solid #eee', backgroundColor: 'white' },
  input: { flex: 1, border: '1px solid #ddd', borderRadius: '20px', padding: '10px 15px', outline: 'none', fontSize: '14px' },
  sendBtn: { backgroundColor: '#007bff', color: 'white', border: 'none', padding: '8px 20px', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold' },
};

export default ChatBot;