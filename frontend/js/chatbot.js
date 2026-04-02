// ============================================================
// CHATBOT GEMINI AI - CÔNG TY BK
// Thêm vào trang: <script src="js/chatbot.js"></script>
// Đổi API key bên dưới
// ============================================================

(function () {
  const GEMINI_API_KEY = 'AIzaSyDmqAVDJ-qPUL46QSxNXPceeQjLQINjsCk';

  const SYSTEM_PROMPT = `Bạn là trợ lý tư vấn bán hàng của CÔNG TY BK (CÔNG TY TNHH ĐẦU TƯ XÂY DỰNG VÀ VẬN TẢI BK).

THÔNG TIN CÔNG TY:
- Chuyên cung cấp giấy công nghiệp khổ lớn, lõi ống giấy, vải vụn
- Địa chỉ: 123 Đường Công Nghiệp, Quận 12, TP. Hồ Chí Minh
- Hotline: 0901 234 567 | Zalo: 0912 345 678
- Email: contact@congtyBK.vn
- Giờ làm việc: Thứ 2 – Thứ 7: 7:30 – 17:30

SẢN PHẨM CHÍNH:
- Giấy In Khổ Lớn A0 (841×1189mm), 80gsm — đơn vị: ream
- Giấy Cuộn Offset, khổ 60–120cm, 60–120gsm — đơn vị: cuộn
- Giấy Bìa Cứng 300gsm, khổ 70×100cm — đơn vị: kg/tấn
- Giấy Ảnh Cuộn bóng/mờ, 24–60 inch, 200gsm — đơn vị: cuộn
- Lõi Ống Giấy 3 inch (76mm) — đơn vị: cuộn
- Lõi Ống Giấy 6 inch (152mm) — đơn vị: cuộn
- Vải Vụn Cotton — đơn vị: kg/tấn
- Vải Vụn Tổng Hợp — đơn vị: kg/tấn

GIAO HÀNG:
- TP. HCM: giao trong ngày
- Bình Dương, Đồng Nai: 1–2 ngày
- Các tỉnh miền Nam: 2–3 ngày
- Toàn quốc: 3–5 ngày

HƯỚNG DẪN TRẢ LỜI:
- Trả lời ngắn gọn, thân thiện bằng tiếng Việt
- Nếu khách hỏi giá → nói "Vui lòng liên hệ hotline 0901 234 567 để nhận báo giá tốt nhất"
- Nếu khách muốn đặt hàng → hướng dẫn vào trang Sản Phẩm hoặc gọi hotline
- Không bịa thông tin không có trong dữ liệu trên`;

  let history = [];
  let isOpen = false;

  // ---- Gọi Gemini API ----
  async function askGemini(userMessage) {
    // Thêm system prompt vào tin nhắn đầu tiên nếu chưa có
    if (history.length === 0) {
      history.push({
        role: 'user',
        parts: [{ text: SYSTEM_PROMPT + '\n\nNgười dùng: ' + userMessage }]
      });
    } else {
      history.push({ role: 'user', parts: [{ text: userMessage }] });
    }

    const body = { contents: history };

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || 'API lỗi ' + res.status);
    }
    const data = await res.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Xin lỗi, tôi không hiểu câu hỏi này.';
    history.push({ role: 'model', parts: [{ text: reply }] });
    return reply;
  }

  // ---- Tạo UI ----
  function createWidget() {
    const style = document.createElement('style');
    style.textContent = `
      #bk-chat-btn {
        position: fixed; bottom: 24px; right: 24px; z-index: 9998;
        width: 56px; height: 56px; border-radius: 50%;
        background: linear-gradient(135deg, #1565c0, #1976d2);
        border: none; cursor: pointer; font-size: 24px;
        box-shadow: 0 4px 20px rgba(21,101,192,0.5);
        transition: transform 0.2s, box-shadow 0.2s;
        display: flex; align-items: center; justify-content: center;
      }
      #bk-chat-btn:hover { transform: scale(1.1); box-shadow: 0 6px 28px rgba(21,101,192,0.6); }

      #bk-chat-window {
        position: fixed; bottom: 92px; right: 24px; z-index: 9999;
        width: 360px; height: 520px; border-radius: 16px;
        background: #fff; box-shadow: 0 8px 40px rgba(0,0,0,0.2);
        display: flex; flex-direction: column; overflow: hidden;
        transform: scale(0.8) translateY(20px); opacity: 0;
        transition: all 0.25s cubic-bezier(0.34,1.56,0.64,1);
        pointer-events: none;
      }
      #bk-chat-window.open {
        transform: scale(1) translateY(0); opacity: 1; pointer-events: all;
      }

      #bk-chat-header {
        background: linear-gradient(135deg, #1565c0, #1976d2);
        padding: 14px 16px; display: flex; align-items: center; gap: 10px;
      }
      .bk-avatar {
        width: 36px; height: 36px; border-radius: 50%;
        background: rgba(255,255,255,0.2);
        display: flex; align-items: center; justify-content: center; font-size: 18px;
      }
      .bk-header-info { flex: 1; }
      .bk-header-name { color: #fff; font-weight: 700; font-size: 14px; }
      .bk-header-status { color: rgba(255,255,255,0.75); font-size: 11px; }
      #bk-chat-close {
        background: none; border: none; color: rgba(255,255,255,0.7);
        cursor: pointer; font-size: 20px; padding: 0; line-height: 1;
      }
      #bk-chat-close:hover { color: #fff; }

      #bk-chat-messages {
        flex: 1; overflow-y: auto; padding: 16px; display: flex;
        flex-direction: column; gap: 10px; background: #f8faff;
      }
      #bk-chat-messages::-webkit-scrollbar { width: 4px; }
      #bk-chat-messages::-webkit-scrollbar-thumb { background: #c5cae9; border-radius: 2px; }

      .bk-msg { display: flex; gap: 8px; max-width: 85%; }
      .bk-msg.user { align-self: flex-end; flex-direction: row-reverse; }
      .bk-msg.bot  { align-self: flex-start; }

      .bk-bubble {
        padding: 10px 14px; border-radius: 16px; font-size: 13px; line-height: 1.6;
        word-break: break-word;
      }
      .bk-msg.user .bk-bubble {
        background: #1565c0; color: #fff; border-bottom-right-radius: 4px;
      }
      .bk-msg.bot .bk-bubble {
        background: #fff; color: #333; border-bottom-left-radius: 4px;
        box-shadow: 0 1px 4px rgba(0,0,0,0.08);
      }
      .bk-msg-avatar {
        width: 28px; height: 28px; border-radius: 50%; flex-shrink: 0;
        background: #e3f2fd; display: flex; align-items: center; justify-content: center;
        font-size: 14px; margin-top: 2px;
      }

      .bk-typing { display: flex; gap: 4px; padding: 10px 14px; }
      .bk-typing span {
        width: 7px; height: 7px; border-radius: 50%; background: #9e9e9e;
        animation: bkTyping 1.2s infinite;
      }
      .bk-typing span:nth-child(2) { animation-delay: 0.2s; }
      .bk-typing span:nth-child(3) { animation-delay: 0.4s; }
      @keyframes bkTyping {
        0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
        30% { transform: translateY(-6px); opacity: 1; }
      }

      #bk-chat-input-area {
        padding: 12px; border-top: 1px solid #e8eaf6;
        display: flex; gap: 8px; background: #fff;
      }
      #bk-chat-input {
        flex: 1; padding: 10px 14px; border: 1.5px solid #e0e0e0;
        border-radius: 24px; font-size: 13px; outline: none;
        transition: border-color 0.2s; resize: none;
      }
      #bk-chat-input:focus { border-color: #1565c0; }
      #bk-chat-send {
        width: 40px; height: 40px; border-radius: 50%;
        background: #1565c0; border: none; cursor: pointer;
        color: #fff; font-size: 16px; display: flex;
        align-items: center; justify-content: center;
        transition: background 0.2s; flex-shrink: 0;
      }
      #bk-chat-send:hover { background: #0d47a1; }
      #bk-chat-send:disabled { background: #bdbdbd; cursor: not-allowed; }

      .bk-quick-btns {
        display: flex; flex-wrap: wrap; gap: 6px; padding: 0 16px 12px;
      }
      .bk-quick-btn {
        padding: 5px 12px; border: 1px solid #1565c0; border-radius: 16px;
        background: #fff; color: #1565c0; font-size: 12px; cursor: pointer;
        transition: all 0.2s;
      }
      .bk-quick-btn:hover { background: #1565c0; color: #fff; }

      @media (max-width: 480px) {
        #bk-chat-window { width: calc(100vw - 32px); right: 16px; bottom: 80px; }
      }
    `;
    document.head.appendChild(style);

    // Widget button
    const btn = document.createElement('button');
    btn.id = 'bk-chat-btn';
    btn.innerHTML = '💬';
    btn.title = 'Chat với tư vấn viên AI';
    document.body.appendChild(btn);

    // Chat window
    const win = document.createElement('div');
    win.id = 'bk-chat-window';
    win.innerHTML = `
      <div id="bk-chat-header">
        <div class="bk-avatar">🤖</div>
        <div class="bk-header-info">
          <div class="bk-header-name">Trợ Lý BK</div>
          <div class="bk-header-status">🟢 Trực tuyến • Hỗ trợ 24/7</div>
        </div>
        <button id="bk-chat-close">×</button>
      </div>
      <div id="bk-chat-messages"></div>
      <div class="bk-quick-btns" id="bk-quick-btns">
        <button class="bk-quick-btn">📦 Sản phẩm</button>
        <button class="bk-quick-btn">💰 Báo giá</button>
        <button class="bk-quick-btn">🚚 Giao hàng</button>
        <button class="bk-quick-btn">📞 Liên hệ</button>
      </div>
      <div id="bk-chat-input-area">
        <input id="bk-chat-input" placeholder="Nhập câu hỏi..." maxlength="500" />
        <button id="bk-chat-send">➤</button>
      </div>
    `;
    document.body.appendChild(win);

    // Events
    btn.addEventListener('click', toggleChat);
    document.getElementById('bk-chat-close').addEventListener('click', toggleChat);
    document.getElementById('bk-chat-send').addEventListener('click', sendMessage);
    document.getElementById('bk-chat-input').addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
    });
    document.querySelectorAll('.bk-quick-btn').forEach(b => {
      b.addEventListener('click', () => {
        document.getElementById('bk-chat-input').value = b.textContent.replace(/^[^\s]+\s/, '');
        sendMessage();
      });
    });

    // Tin nhắn chào
    addMessage('bot', '👋 Xin chào! Tôi là trợ lý tư vấn của **CÔNG TY BK**.\n\nTôi có thể giúp bạn tìm hiểu về sản phẩm, báo giá và đặt hàng. Bạn cần hỗ trợ gì?');
  }

  function toggleChat() {
    isOpen = !isOpen;
    const win = document.getElementById('bk-chat-window');
    const btn = document.getElementById('bk-chat-btn');
    win.classList.toggle('open', isOpen);
    btn.innerHTML = isOpen ? '✕' : '💬';
    if (isOpen) {
      setTimeout(() => document.getElementById('bk-chat-input').focus(), 300);
    }
  }

  function addMessage(role, text) {
    const msgs = document.getElementById('bk-chat-messages');
    const div = document.createElement('div');
    div.className = `bk-msg ${role}`;

    const avatar = role === 'bot' ? '<div class="bk-msg-avatar">🤖</div>' : '';
    const formatted = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');

    div.innerHTML = `${avatar}<div class="bk-bubble">${formatted}</div>`;
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
    return div;
  }

  function showTyping() {
    const msgs = document.getElementById('bk-chat-messages');
    const div = document.createElement('div');
    div.className = 'bk-msg bot';
    div.id = 'bk-typing-indicator';
    div.innerHTML = '<div class="bk-msg-avatar">🤖</div><div class="bk-bubble bk-typing"><span></span><span></span><span></span></div>';
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
  }

  function hideTyping() {
    const el = document.getElementById('bk-typing-indicator');
    if (el) el.remove();
  }

  async function sendMessage() {
    const input = document.getElementById('bk-chat-input');
    const sendBtn = document.getElementById('bk-chat-send');
    const text = input.value.trim();
    if (!text) return;

    // Ẩn quick buttons sau lần đầu
    const quickBtns = document.getElementById('bk-quick-btns');
    if (quickBtns) quickBtns.style.display = 'none';

    input.value = '';
    sendBtn.disabled = true;
    addMessage('user', text);

    // Nếu chưa có API key → dùng câu trả lời cố định
    if (GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY') {
      showTyping();
      await new Promise(r => setTimeout(r, 600));
      hideTyping();
      const fallback = getFallbackReply(text);
      addMessage('bot', fallback);
      sendBtn.disabled = false;
      input.focus();
      return;
    }

    showTyping();
    try {
      const reply = await askGemini(text);
      hideTyping();
      addMessage('bot', reply);
    } catch (e) {
      hideTyping();
      console.error('Gemini error:', e);
      addMessage('bot', '❌ Lỗi: ' + e.message + '\n\nVui lòng liên hệ hotline **0901 234 567**.');
    } finally {
      sendBtn.disabled = false;
      input.focus();
    }
  }

  // Câu trả lời dự phòng khi chưa có API key
  function getFallbackReply(text) {
    const t = text.toLowerCase();
    if (t.includes('giá') || t.includes('báo giá') || t.includes('price'))
      return '💰 Để nhận báo giá tốt nhất, vui lòng liên hệ:\n📞 Hotline: **0901 234 567**\n📱 Zalo: **0912 345 678**\nChúng tôi sẽ phản hồi trong vòng 30 phút!';
    if (t.includes('sản phẩm') || t.includes('hàng') || t.includes('giấy') || t.includes('lõi') || t.includes('vải'))
      return '📦 Sản phẩm của chúng tôi:\n• Giấy In Khổ Lớn A0, Giấy Cuộn Offset\n• Giấy Bìa Cứng 300gsm\n• Lõi Ống Giấy 3 & 6 inch\n• Vải Vụn Cotton & Tổng Hợp\n\nXem chi tiết tại trang **Sản Phẩm** hoặc gọi **0901 234 567**';
    if (t.includes('giao hàng') || t.includes('ship') || t.includes('vận chuyển'))
      return '🚚 Thời gian giao hàng:\n• TP. HCM: **giao trong ngày**\n• Bình Dương, Đồng Nai: **1–2 ngày**\n• Các tỉnh miền Nam: **2–3 ngày**\n• Toàn quốc: **3–5 ngày**';
    if (t.includes('liên hệ') || t.includes('hotline') || t.includes('điện thoại') || t.includes('địa chỉ'))
      return '📞 Thông tin liên hệ:\n• Hotline: **0901 234 567**\n• Zalo: **0912 345 678**\n• Email: contact@congtyBK.vn\n• Địa chỉ: 123 Đường Công Nghiệp, Q12, TP. HCM\n• Giờ làm việc: Thứ 2–7: **7:30–17:30**';
    if (t.includes('đặt hàng') || t.includes('mua') || t.includes('order'))
      return '🛒 Để đặt hàng, bạn có thể:\n1. Đăng ký tài khoản và đặt hàng online\n2. Gọi hotline **0901 234 567**\n3. Nhắn Zalo **0912 345 678**\n\nChúng tôi hỗ trợ thanh toán tiền mặt và chuyển khoản!';
    return '👋 Cảm ơn bạn đã liên hệ **CÔNG TY BK**!\n\nChúng tôi chuyên cung cấp giấy công nghiệp, lõi ống và vải vụn chất lượng cao.\n\n📞 Hotline: **0901 234 567**\nHoặc chọn câu hỏi bên dưới để được hỗ trợ nhanh hơn!';
  }

  // Khởi tạo khi DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createWidget);
  } else {
    createWidget();
  }
})();
