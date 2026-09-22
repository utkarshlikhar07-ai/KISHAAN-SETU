import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  X, 
  Send, 
  Mic, 
  MicOff, 
  Volume2, 
  Sparkles, 
  ArrowRight,
  Languages
} from 'lucide-react';
import { api } from '../services/api';

export default function SaarthiAssistant({ 
  isOpen, 
  onClose, 
  language = 'hi', 
  farmer,
  onNavigateTab
}) {
  const [messages, setMessages] = useState([
    {
      sender: 'saarthi',
      text: language === 'hi' 
        ? 'नमस्ते सरदार बलदेव सिंह जी! मैं आपका किसान सेतु सारथी AI सहायक हूँ। आप मुझसे मंडी में भीड़, अपनी कतार स्थिति, या MSP भुगतान के बारे में पूछ सकते हैं।'
        : language === 'pa'
        ? 'ਸਤਿ ਸ਼੍ਰੀ ਅਕਾਲ ਜੀ! ਮੈਂ ਤੁਹਾਡਾ ਕਿਸਾਨ ਸੇਤੂ ਸਾਰਥੀ AI ਸਹਾਇਕ ਹਾਂ। ਤੁਸੀਂ ਮੰਡੀ ਵਿੱਚ ਭੀੜ ਜਾਂ ਟੋਕਨ ਬਾਰੇ ਪੁੱਛ ਸਕਦੇ ਹੋ।'
        : 'Welcome! I am your Kisan Setu Saarthi AI Assistant. How can I assist you with mandi queues or payments today?',
      actions: [
        { label: 'Check Queue (कतार स्थिति)', action: 'QUEUE' },
        { label: 'Nearest Mandi (नजदीकी मंडी)', action: 'CENTERS' },
        { label: 'Track MSP Payment (भुगतान)', action: 'PAYMENTS' }
      ]
    }
  ]);

  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [loading, setLoading] = useState(false);
  const chatBottomRef = useRef(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const quickPrompts = [
    { label: 'मंडी में आज कितनी भीड़ है?', text: 'करनाल मंडी में आज कितनी भीड़ है?' },
    { label: 'मेरा टोकन कब आएगा?', text: 'मेरा टोकन नंबर कब आएगा और आगे कितने किसान हैं?' },
    { label: 'MSP भुगतान की स्थिति?', text: 'मेरे गेहूं उपार्जन का MSP भुगतान कब आएगा?' },
    { label: 'बेस्ट मंडी कौन सी है?', text: 'सबसे कम प्रतीक्षा समय वाली मंडी कौन सी है?' },
  ];

  const handleSend = async (textToSend) => {
    const query = textToSend || inputText;
    if (!query.trim()) return;

    // Add user message
    const userMsg = { sender: 'user', text: query };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setLoading(true);

    try {
      const response = await api.querySaarthi({
        textQuery: query,
        language,
        farmerId: farmer?.id || 1,
      });

      const saarthiMsg = {
        sender: 'saarthi',
        text: response.response_text,
        intent: response.intent,
        actions: response.quick_actions?.map(qa => ({
          label: qa.label,
          route: qa.route
        }))
      };

      setMessages(prev => [...prev, saarthiMsg]);

      // Voice read-out via Web Speech API if supported
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(response.response_text);
        utterance.lang = language === 'hi' ? 'hi-IN' : (language === 'pa' ? 'pa-IN' : 'en-IN');
        window.speechSynthesis.speak(utterance);
      }

    } catch (err) {
      setMessages(prev => [
        ...prev,
        { sender: 'saarthi', text: `सारथी सेवा में समस्या: ${err.message}` }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleMicToggle = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      // Simulation for demo if browser SpeechRecognition not allowed
      setIsListening(true);
      setTimeout(() => {
        setIsListening(false);
        handleSend("करनाल मंडी में अभी कतार की स्थिति क्या है?");
      }, 2000);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = language === 'hi' ? 'hi-IN' : 'en-IN';
    recognition.continuous = false;
    recognition.interimResults = false;

    if (!isListening) {
      recognition.start();
      setIsListening(true);
      recognition.onresult = (event) => {
        const spoken = event.results[0][0].transcript;
        setIsListening(false);
        handleSend(spoken);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
    } else {
      recognition.stop();
      setIsListening(false);
    }
  };

  const speakText = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language === 'hi' ? 'hi-IN' : 'en-IN';
      window.speechSynthesis.speak(utterance);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      width: '420px',
      maxWidth: 'calc(100vw - 48px)',
      height: '620px',
      maxHeight: 'calc(100vh - 48px)',
      background: '#ffffff',
      borderRadius: '24px',
      boxShadow: '0 20px 40px -10px rgba(0,0,0,0.25)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 150,
      overflow: 'hidden',
      border: '1px solid #e2e8f0',
      animation: 'fadeIn 0.2s ease-out'
    }}>
      
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #065f46 0%, #047857 100%)',
        color: '#ffffff',
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#34d399' }}>
            <Bot size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800 }}>Saarthi AI (सारथी)</h3>
              <span style={{ fontSize: '0.68rem', background: '#a7f3d0', color: '#064e3b', fontWeight: 700, padding: '2px 6px', borderRadius: '10px' }}>
                SARVAM + BHASHINI
              </span>
            </div>
            <p style={{ fontSize: '0.72rem', color: '#d1fae5' }}>
              Multi-lingual voice & intent assistant
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', width: '30px', height: '30px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <X size={16} />
        </button>
      </div>

      {/* Quick Prompts Bar */}
      <div style={{ padding: '8px 12px', background: '#f8fafc', borderBottom: '1px solid #f1f5f9', display: 'flex', gap: '6px', overflowX: 'auto' }}>
        {quickPrompts.map((qp, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(qp.text)}
            style={{
              fontSize: '0.72rem',
              whiteSpace: 'nowrap',
              padding: '4px 10px',
              borderRadius: '20px',
              border: '1px solid #cbd5e1',
              background: '#fff',
              color: '#334155',
              cursor: 'pointer'
            }}
          >
            {qp.label}
          </button>
        ))}
      </div>

      {/* Messages Area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px', background: '#fcfdfd' }}>
        {messages.map((m, idx) => (
          <div
            key={idx}
            style={{
              alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '85%',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px'
            }}
          >
            <div style={{
              background: m.sender === 'user' ? '#15803d' : '#f1f5f9',
              color: m.sender === 'user' ? '#ffffff' : '#0f172a',
              padding: '12px 16px',
              borderRadius: m.sender === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
              fontSize: '0.85rem',
              lineHeight: 1.45,
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              position: 'relative'
            }}>
              {m.text}

              {m.sender === 'saarthi' && (
                <button
                  onClick={() => speakText(m.text)}
                  style={{
                    position: 'absolute',
                    bottom: '6px',
                    right: '6px',
                    background: 'transparent',
                    border: 'none',
                    color: '#64748b',
                    cursor: 'pointer',
                    padding: '2px'
                  }}
                  title="Read aloud"
                >
                  <Volume2 size={13} />
                </button>
              )}
            </div>

            {/* Quick Action Navigation Buttons */}
            {m.actions && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                {m.actions.map((act, aIdx) => (
                  <button
                    key={aIdx}
                    onClick={() => {
                      if (act.action === 'QUEUE' && onNavigateTab) onNavigateTab('QUEUE');
                      if (act.action === 'CENTERS' && onNavigateTab) onNavigateTab('CENTERS');
                      if (act.action === 'PAYMENTS' && onNavigateTab) onNavigateTab('PAYMENTS');
                      if (act.route) {
                        if (act.route.includes('queue') && onNavigateTab) onNavigateTab('QUEUE');
                        if (act.route.includes('centers') && onNavigateTab) onNavigateTab('CENTERS');
                        if (act.route.includes('payments') && onNavigateTab) onNavigateTab('PAYMENTS');
                      }
                    }}
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      padding: '4px 10px',
                      borderRadius: '12px',
                      background: '#ecfdf5',
                      color: '#065f46',
                      border: '1px solid #a7f3d0',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    {act.label}
                    <ArrowRight size={11} />
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div style={{ alignSelf: 'flex-start', background: '#f1f5f9', padding: '10px 16px', borderRadius: '18px', fontSize: '0.82rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="traffic-dot-low" /> Saarthi AI is processing speech intent...
          </div>
        )}
        <div ref={chatBottomRef} />
      </div>

      {/* Input Tray */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid #e2e8f0', background: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
        
        {/* Voice Input Button */}
        <button
          type="button"
          onClick={handleMicToggle}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: isListening ? '#fee2e2' : '#f1f5f9',
            border: isListening ? '2px solid #ef4444' : '1px solid #cbd5e1',
            color: isListening ? '#ef4444' : '#334155',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s'
          }}
          title={isListening ? "Listening..." : "Click to speak voice query"}
        >
          {isListening ? <Mic size={18} className="traffic-dot-high" /> : <Mic size={18} />}
        </button>

        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder={isListening ? "बोलिए, सुन रहा हूँ... (Listening...)" : "बोलें या लिखें (Ask Saarthi)..."}
          style={{
            flex: 1,
            padding: '10px 14px',
            borderRadius: '20px',
            border: '1px solid #cbd5e1',
            outline: 'none',
            fontSize: '0.85rem'
          }}
        />

        <button
          onClick={() => handleSend()}
          disabled={!inputText.trim()}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: inputText.trim() ? '#15803d' : '#e2e8f0',
            border: 'none',
            color: '#ffffff',
            cursor: inputText.trim() ? 'pointer' : 'default',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Send size={16} />
        </button>
      </div>

    </div>
  );
}
