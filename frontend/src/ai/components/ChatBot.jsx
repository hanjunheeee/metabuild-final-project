import React, { useState, useRef, useEffect } from 'react';
import { marked } from 'marked';

const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    { role: 'ai', content: '안녕하세요! 빌릴수e서울 도서 큐레이터입니다. 어떤 책을 추천해 드릴까요?' }
  ]);
  const chatWindowRef = useRef(null);

  // 메시지 추가 시 자동 스크롤 하단 이동
  useEffect(() => {
    if (chatWindowRef.current) {
      chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const toggleChat = () => setIsOpen(!isOpen);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userText = input;
    // 1. 사용자 메시지 추가
    setMessages(prev => [...prev, { role: 'user', content: userText }]);
    setInput('');

    // 2. 대기 메시지 추가
    setMessages(prev => [...prev, { role: 'ai', content: '추천 도서를 검색 중입니다...' }]);

    try {
      const response = await fetch('http://localhost:7878/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: userText })
      });
      const data = await response.text();

      // 3. 마지막 로딩 메시지를 실제 답변으로 교체
      setMessages(prev => {
        const newMsgs = [...prev];
        newMsgs.pop(); // "검색 중..." 메시지 제거
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
      {/* 플로팅 버튼 */}
      <div style={styles.launcher} onClick={toggleChat}>
        <span style={{ fontSize: '30px' }}>📚</span>
        {!isOpen && (
          <div style={styles.bubble}>도서 추천은 저에게 물어보세요!</div>
        )}
      </div>

      {/* 채팅창 */}
      {isOpen && (
        <div style={styles.container}>
          <div style={styles.header}>
            <span>북봇 큐레이터</span>
            <button onClick={toggleChat} style={styles.closeBtn}>✕</button>
          </div>
          <div style={styles.window} ref={chatWindowRef}>
            {messages.map((msg, index) => (
              <div
                key={index}
                style={{
                  ...styles.message,
                  ...(msg.role === 'user' ? styles.userMsg : styles.aiMsg)
                }}
                dangerouslySetInnerHTML={{ __html: marked.parse(msg.content) }}
              />
            ))}
          </div>
          <div style={styles.inputArea}>
            <input
              style={styles.input}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="궁금한 책이나 분위기를 입력하세요..."
            />
            <button style={styles.sendBtn} onClick={sendMessage}>보내기</button>
          </div>
        </div>
      )}
    </div>
  );
};

// CSS-in-JS 스타일링
const styles = {
  launcher: {
    position: 'fixed', bottom: '30px', right: '30px', width: '65px', height: '65px',
    backgroundColor: '#007bff', borderRadius: '50%', display: 'flex', alignItems: 'center',
    justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.2)', cursor: 'pointer', zIndex: 9999,
  },
  bubble: {
    position: 'absolute', right: '80px', width: '160px', backgroundColor: '#333',
    color: 'white', padding: '8px 12px', borderRadius: '10px', fontSize: '12px', textAlign: 'center',
  },
  container: {
    position: 'fixed', bottom: '110px', right: '30px', width: '350px', height: '500px',
    backgroundColor: 'white', borderRadius: '15px', boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
    display: 'flex', flexDirection: 'column', zIndex: 9999, border: '1px solid #eee', overflow: 'hidden'
  },
  header: {
    backgroundColor: '#007bff', color: 'white', padding: '15px', display: 'flex',
    justifyContent: 'space-between', alignItems: 'center', fontWeight: 'bold'
  },
  closeBtn: { background: 'none', border: 'none', color: 'white', fontSize: '18px', cursor: 'pointer' },
  window: { flex: 1, overflowY: 'auto', padding: '15px', display: 'flex', flexDirection: 'column', gap: '10px', backgroundColor: '#f9f9f9' },
  message: { padding: '10px 14px', borderRadius: '12px', fontSize: '14px', maxWidth: '85%', lineHeight: '1.4' },
  userMsg: { backgroundColor: '#007bff', color: 'white', alignSelf: 'flex-end', borderBottomRightRadius: '2px' },
  aiMsg: { backgroundColor: '#e9ecef', color: '#333', alignSelf: 'flex-start', borderBottomLeftRadius: '2px' },
  inputArea: { padding: '10px', display: 'flex', gap: '5px', borderTop: '1px solid #eee' },
  input: { flex: 1, border: '1px solid #ddd', borderRadius: '20px', padding: '8px 15px', outline: 'none' },
  sendBtn: { backgroundColor: '#007bff', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '20px', cursor: 'pointer' }
};

export default ChatBot;