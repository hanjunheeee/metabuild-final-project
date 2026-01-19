import React, { useState, useRef, useEffect } from 'react';
import { marked } from 'marked';
import { useNavigate, useLocation } from 'react-router-dom';

const ChatBot = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const LOADING_MESSAGE = 'Loading...';

  const hiddenPaths = ['/login', '/signup', '/mypage', '/admin', '/admin/login'];
  const isHidden = hiddenPaths.some(path => location.pathname.startsWith(path));

  const [messages, setMessages] = useState(() => {
    const saved = sessionStorage.getItem('chat_session');
    return saved ? JSON.parse(saved) : [
      { role: 'ai', content: '안녕하세요 **빌릴수e서울** 도서 큐레이터입니다.\n 어떤 책을 추천해드릴까요?' }
    ];
  });

  const chatWindowRef = useRef(null);

  useEffect(() => {
    sessionStorage.setItem('chat_session', JSON.stringify(messages));
    if (chatWindowRef.current) {
      chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    marked.setOptions({ breaks: true, gfm: true });
  }, []);

  const handleContentClick = (e) => {
    const target = e.target;
    if (target.tagName === 'A') {
      e.preventDefault();
      const href = target.getAttribute('href');

      // 배포 환경 고려: localhost:3001 하드코딩 제거, 현재 origin 인식
      const currentOrigin = window.location.origin;

      if (href.startsWith('/') || href.startsWith(currentOrigin)) {
        // 내부 경로인 경우 (예: /book-detail/1)
        const path = href.replace(currentOrigin, '');
        navigate(path);
      } else {
        // 외부 경로인 경우 새 창 열기
        window.open(href, '_blank');
      }
    }
  };

  const toggleChat = () => setIsOpen(!isOpen);

  const resetChat = async () => {
    const initialMsg = [{ role: 'ai', content: '안녕하세요 **빌릴수e서울** 도서 큐레이터입니다.\n 어떤 책을 추천해드릴까요?' }];
    setMessages(initialMsg);
    sessionStorage.removeItem('chat_session');
    try {
      await fetch('http://localhost:7878/api/chat/reset', { method: 'POST' });
    } catch (e) {
      console.log('서버 리셋 요청 실패');
    }
  };

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userText = input;
    setMessages(prev => [...prev, { role: 'user', content: userText }]);
    setInput('');
    setMessages(prev => [...prev, { role: 'ai', content: LOADING_MESSAGE }]);

    try {
      const history = [...messages]
        .filter(msg => msg.content !== LOADING_MESSAGE)
        .slice(-8)
        .map(({ role, content }) => ({ role, content }));
      history.push({ role: 'user', content: userText });

      const response = await fetch('http://localhost:7878/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: userText, history })
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
  if (isHidden) return null;

  return (
    <div style={{ fontFamily: '"Pretendard", sans-serif' }}>
      {/* 런처 버튼 - 로봇 아이콘 적용 */}
      <div style={styles.launcher} onClick={toggleChat}>
        <span style={{ fontSize: '30px' }}>{isOpen ? 'X' : '🤖'}</span>
        {!isOpen && <div style={styles.bubble}>도서 추천 서비스</div>}
      </div>

      {isOpen && (
        <div style={styles.container}>
          <div style={styles.header}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '18px' }}>🤖</span>
              <span style={{ fontSize: '16px', fontWeight: 'bold' }}>북봇 큐레이터</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <button onClick={resetChat} style={styles.resetBtn}>대화 리셋</button>
              <button onClick={toggleChat} style={styles.closeBtn}>닫기</button>
            </div>
          </div>

          <div style={styles.window} ref={chatWindowRef} onClick={handleContentClick}>
            {messages.map((msg, index) => (
              <div key={index} style={msg.role === 'user' ? styles.userRow : styles.aiRow}>
                {msg.role === 'ai' && <div style={styles.aiIcon}>🤖</div>}
                <div style={{ display: 'flex', flexDirection: 'column', maxWidth: '85%' }}>
                  {msg.role === 'ai' && <span style={styles.aiName}>북봇 큐레이터</span>}
                  <div
                    className="markdown-content"
                    style={msg.role === 'user' ? styles.userMsg : styles.aiMsg}
                    dangerouslySetInnerHTML={{ __html: marked.parse(msg.content) }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div style={styles.inputArea}>
            <input
              style={styles.input}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="질문을 입력하세요.."
            />
            <button style={styles.sendBtn} onClick={sendMessage}>전송</button>
          </div>
        </div>
      )}

      <style>{`
        /* 1. '이동하기' 버튼 스타일 (강조 박스) */
        .markdown-content a {
          display: inline-block !important;
          color: #007bff !important;
          text-decoration: none !important;
          font-weight: 700 !important;
          background-color: #eef6ff !important;
          padding: 6px 14px !important;
          margin-top: 10px !important;
          margin-bottom: 5px !important;
          border-radius: 5px !important;
          border: 1px solid #cce5ff !important;
          cursor: pointer !important;
          pointer-events: auto !important; /* 클릭 가능하도록 명시 */
        }

        .markdown-content a:hover {
          background-color: #007bff !important;
          color: white !important;
        }

        /* 2. '책제목' 링크는 버튼 스타일 제외 (텍스트 강조) */
        /* href에 searchbook이 포함되지 않는 '이동하기' 링크를 제외 처리 */
        .markdown-content a:not([href*="searchbook"]):not(:contains("이동하기")) {
          background: none !important;
          border: none !important;
          padding: 0 !important;
          color: inherit !important;
          font-weight: bold !important;
          pointer-events: none !important;
        }

        /* 3. 도서 카드 구분선 설정: 검은 구분선 */
          .markdown-content p:has(a),
          .markdown-content li:has(a) {
            margin-bottom: 30px !important;
            padding-bottom: 20px !important;
            border-bottom: 3px solid #000000 !important; /* 검은 구분선 2px 적용 */
            list-style: none !important;
          }

        /* 4. 마지막 요소 구분선 제거 */
        .markdown-content p:last-child,
        .markdown-content li:last-child,
        .markdown-content p:has(a):last-child {
          border-bottom: none !important;
          margin-bottom: 0 !important;
          padding-bottom: 0 !important;
        }

        .markdown-content p { margin-bottom: 8px; line-height: 1.6; }
        .markdown-content strong { color: #000; }
      `}</style>
    </div>
  );
};

const styles = {
  launcher: { position: 'fixed', bottom: '30px', right: '30px', width: '65px', height: '65px', backgroundColor: '#007bff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.2)', cursor: 'pointer', zIndex: 9999 },
  bubble: { position: 'absolute', right: '80px', width: '130px', backgroundColor: '#333', color: 'white', padding: '8px 12px', borderRadius: '10px', fontSize: '12px', textAlign: 'center' },
  container: { position: 'fixed', bottom: '110px', right: '30px', width: '500px', height: '600px', backgroundColor: 'white', borderRadius: '15px', boxShadow: '0 8px 24px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column', zIndex: 9999, border: '1px solid #eee', overflow: 'hidden' },
  header: { backgroundColor: '#007bff', color: 'white', padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  resetBtn: { background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', fontSize: '11px', cursor: 'pointer', padding: '4px 8px', borderRadius: '4px', marginRight: '10px' },
  closeBtn: { background: 'none', border: 'none', color: 'white', fontSize: '12px', cursor: 'pointer' },
  window: { flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px', backgroundColor: '#f9f9f9' },
  userRow: { display: 'flex', justifyContent: 'flex-end' },
  aiRow: { display: 'flex', justifyContent: 'flex-start', gap: '10px' },
  aiIcon: { width: '32px', height: '32px', backgroundColor: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', border: '1px solid #ddd' },
  aiName: { fontSize: '13px', color: '#888', marginBottom: '4px', marginLeft: '2px' },
  userMsg: { backgroundColor: '#007bff', color: 'white', padding: '10px 14px', borderRadius: '15px', borderBottomRightRadius: '2px', fontSize: '16px' },
  aiMsg: { backgroundColor: '#ffffff', color: '#333', padding: '12px 16px', borderRadius: '15px', borderBottomLeftRadius: '2px', border: '1px solid #e0e0e0', fontSize: '16px' },
  inputArea: { padding: '15px', display: 'flex', gap: '8px', borderTop: '1px solid #eee' },
  input: { flex: 1, border: '1px solid #ddd', borderRadius: '20px', padding: '10px 15px', outline: 'none', fontSize: '14px' },
  sendBtn: { backgroundColor: '#007bff', color: 'white', border: 'none', padding: '8px 18px', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' },
};

export default ChatBot;
