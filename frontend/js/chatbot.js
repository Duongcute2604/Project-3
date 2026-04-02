// ============================================================
// CHATBOT RULE-BASED - CÔNG TY BK (không cần API key)
// ============================================================

(function () {

  // Map intent → câu trả lời
  const INTENTS = {
    greeting: {
      patterns: ['xin chao', 'hello', 'hi ', 'chao ban', 'hey', 'alo'],
      reply: '👋 Xin chào! Tôi là trợ lý tư vấn của **CÔNG TY BK**.\n\nTôi có thể giúp bạn về:\n• 📦 Sản phẩm\n• 💰 Báo giá\n• 🚚 Giao hàng\n• 📞 Liên hệ\n\nBạn cần hỗ trợ gì?'
    },
    shipping: {
      patterns: ['giao hang', 'ship', 'van chuyen', 'delivery', 'bao lau', 'may ngay', 'thoi gian giao', 'giao o dau'],
      reply: '🚚 **Thời gian giao hàng:**\n\n• 📍 TP. Hồ Chí Minh: **Giao trong ngày**\n• 📍 Bình Dương, Đồng Nai: **1–2 ngày**\n• 📍 Các tỉnh miền Nam: **2–3 ngày**\n• 📍 Toàn quốc: **3–5 ngày**\n\n✅ Giao hàng tận nơi, đóng gói cẩn thận!'
    },
    price: {
      patterns: ['bao gia', 'bao nhieu tien', 'gia bao nhieu', 'gia ca', 'chi phi', 'price', 'cost', 'don gia'],
      reply: '💰 **Báo giá sản phẩm:**\n\nGiá phụ thuộc vào loại sản phẩm, số lượng và thời điểm đặt hàng.\n\n📞 Liên hệ ngay để nhận báo giá tốt nhất:\n• Hotline: **0901 234 567**\n• Zalo: **0912 345 678**\n• Email: contact@congtyBK.vn\n\n⏰ Phản hồi trong vòng **30 phút**!'
    },
    product: {
      patterns: ['san pham', 'hang hoa', 'ban gi', 'co gi', 'danh muc', 'loai hang', 'mat hang'],
      reply: '📦 **Sản phẩm chính của chúng tôi:**\n\n📄 **Giấy khổ lớn:**\n• Giấy In A0 (841×1189mm), 80gsm\n• Giấy Cuộn Offset, 60–120cm\n• Giấy Bìa Cứng 300gsm\n• Giấy Ảnh Cuộn bóng/mờ\n\n🧻 **Lõi ống giấy:**\n• Lõi 3 inch (76mm)\n• Lõi 6 inch (152mm)\n\n🧵 **Vải vụn:**\n• Vải Vụn Cotton & Tổng Hợp\n\nBạn quan tâm sản phẩm nào?'
    },
    paper: {
      patterns: ['giay', 'a0', 'a3', 'a4', 'offset', 'bia cung', 'giay anh'],
      reply: '📄 **Giấy khổ lớn CÔNG TY BK:**\n\n• **Giấy In A0** — 80gsm, bản vẽ kỹ thuật\n• **Giấy Cuộn Offset** — 60–120cm, 60–120gsm\n• **Giấy Bìa Cứng** — 300gsm, khổ 70×100cm\n• **Giấy Ảnh Cuộn** — 200gsm, bóng/mờ\n\n📞 Gọi **0901 234 567** để nhận báo giá!'
    },
    core: {
      patterns: ['loi ong', 'ong giay', 'core', '3 inch', '6 inch'],
      reply: '🧻 **Lõi ống giấy CÔNG TY BK:**\n\n• **Lõi 3 inch** (76mm) — dài 30–150cm\n• **Lõi 6 inch** (152mm) — thành dày 5–10mm\n\nĐơn vị: cuộn\n📞 Báo giá: **0901 234 567**'
    },
    fabric: {
      patterns: ['vai vun', 'cotton', 'polyester', 'vai'],
      reply: '🧵 **Vải vụn CÔNG TY BK:**\n\n• **Vải Vụn Cotton** — đóng gói theo kg\n• **Vải Vụn Tổng Hợp** — phân loại theo màu\n\nĐơn vị: kg / tấn\n📞 Báo giá: **0901 234 567**'
    },
    order: {
      patterns: ['dat hang', 'mua hang', 'order', 'lam don', 'cach mua'],
      reply: '🛒 **Cách đặt hàng:**\n\n1️⃣ **Online:** Đăng ký → Chọn sản phẩm → Đặt hàng\n2️⃣ **Điện thoại:** Gọi **0901 234 567**\n3️⃣ **Zalo:** Nhắn **0912 345 678**\n\n💳 Thanh toán: Tiền mặt hoặc chuyển khoản'
    },
    contact: {
      patterns: ['lien he', 'hotline', 'dien thoai', 'dia chi', 'email', 'zalo', 'so dt', 'lien lac'],
      reply: '📞 **Thông tin liên hệ CÔNG TY BK:**\n\n📱 Hotline: **0901 234 567**\n💬 Zalo: **0912 345 678**\n📧 Email: contact@congtyBK.vn\n📍 Địa chỉ: 123 Đường Công Nghiệp, Q12, TP. HCM\n⏰ Giờ làm việc: **Thứ 2–7: 7:30–17:30**'
    },
    payment: {
      patterns: ['thanh toan', 'chuyen khoan', 'tien mat', 'hoa don', 'vat', 'payment'],
      reply: '💳 **Phương thức thanh toán:**\n\n• 💵 Tiền mặt khi nhận hàng\n• 🏦 Chuyển khoản ngân hàng\n• 🧾 Xuất hóa đơn VAT theo yêu cầu\n\nLiên hệ **0901 234 567** để biết thêm!'
    },
    about: {
      patterns: ['cong ty', 'gioi thieu', 've chung toi', 'kinh nghiem', 'lich su'],
      reply: '🏭 **CÔNG TY TNHH ĐẦU TƯ XÂY DỰNG VÀ VẬN TẢI BK**\n\n✅ Hơn **10 năm** kinh nghiệm\n✅ Phục vụ **500+** khách hàng\n✅ Kho hàng **5.000 m²** hiện đại\n✅ Giao hàng toàn quốc\n\n📞 **0901 234 567**'
    },
    thanks: {
      patterns: ['cam on', 'thanks', 'thank you', 'ok roi', 'duoc roi', 'hieu roi', 'xong roi'],
      reply: '😊 Cảm ơn bạn đã liên hệ **CÔNG TY BK**!\n\nNếu cần thêm thông tin, đừng ngại hỏi nhé.\n📞 Hotline: **0901 234 567**'
    },
  };

  // Normalize: bỏ dấu, lowercase, bỏ emoji
  function normalize(str) {
    return str
      .replace(/[\u{1F300}-\u{1FFFF}]/gu, '') // bỏ emoji
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  function getReply(text) {
    const t = normalize(text);
    for (const [, intent] of Object.entries(INTENTS)) {
      if (intent.patterns.some(p => t.includes(p))) {
        return intent.reply;
      }
    }
    return '🤔 Xin lỗi, tôi chưa hiểu câu hỏi của bạn.\n\nBạn có thể hỏi về:\n• 📦 Sản phẩm\n• 💰 Báo giá\n• 🚚 Giao hàng\n• 📞 Liên hệ\n\nHoặc gọi trực tiếp **0901 234 567**!';
  }

  // Map nút quick → intent key để match chính xác
  const QUICK_MAP = {
    'Sản phẩm': 'san pham',
    'Báo giá':  'bao gia',
    'Giao hàng':'giao hang',
    'Liên hệ':  'lien he',
    'Đặt hàng': 'dat hang',
  };

  let isOpen = false;

  function createWidget() {
    const style = document.createElement('style');
    style.textContent = `
      #bk-chat-btn {
        position:fixed;bottom:24px;right:24px;z-index:9998;
        width:56px;height:56px;border-radius:50%;
        background:linear-gradient(135deg,#1565c0,#1976d2);
        border:none;cursor:pointer;font-size:24px;
        box-shadow:0 4px 20px rgba(21,101,192,0.5);
        transition:transform 0.2s,box-shadow 0.2s;
        display:flex;align-items:center;justify-content:center;
      }
      #bk-chat-btn:hover{transform:scale(1.1);box-shadow:0 6px 28px rgba(21,101,192,0.6);}
      #bk-chat-window{
        position:fixed;bottom:92px;right:24px;z-index:9999;
        width:360px;height:520px;border-radius:16px;
        background:#fff;box-shadow:0 8px 40px rgba(0,0,0,0.2);
        display:flex;flex-direction:column;overflow:hidden;
        transform:scale(0.8) translateY(20px);opacity:0;
        transition:all 0.25s cubic-bezier(0.34,1.56,0.64,1);pointer-events:none;
      }
      #bk-chat-window.open{transform:scale(1) translateY(0);opacity:1;pointer-events:all;}
      #bk-chat-header{background:linear-gradient(135deg,#1565c0,#1976d2);padding:14px 16px;display:flex;align-items:center;gap:10px;}
      .bk-avatar{width:36px;height:36px;border-radius:50%;background:rgba(255,255,255,0.2);display:flex;align-items:center;justify-content:center;font-size:18px;}
      .bk-header-name{color:#fff;font-weight:700;font-size:14px;}
      .bk-header-status{color:rgba(255,255,255,0.75);font-size:11px;}
      #bk-chat-close{background:none;border:none;color:rgba(255,255,255,0.7);cursor:pointer;font-size:20px;padding:0;margin-left:auto;}
      #bk-chat-close:hover{color:#fff;}
      #bk-chat-messages{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:10px;background:#f8faff;}
      #bk-chat-messages::-webkit-scrollbar{width:4px;}
      #bk-chat-messages::-webkit-scrollbar-thumb{background:#c5cae9;border-radius:2px;}
      .bk-msg{display:flex;gap:8px;max-width:88%;}
      .bk-msg.user{align-self:flex-end;flex-direction:row-reverse;}
      .bk-msg.bot{align-self:flex-start;}
      .bk-bubble{padding:10px 14px;border-radius:16px;font-size:13px;line-height:1.6;word-break:break-word;}
      .bk-msg.user .bk-bubble{background:#1565c0;color:#fff;border-bottom-right-radius:4px;}
      .bk-msg.bot .bk-bubble{background:#fff;color:#333;border-bottom-left-radius:4px;box-shadow:0 1px 4px rgba(0,0,0,0.08);}
      .bk-msg-avatar{width:28px;height:28px;border-radius:50%;flex-shrink:0;background:#e3f2fd;display:flex;align-items:center;justify-content:center;font-size:14px;margin-top:2px;}
      .bk-typing{display:flex;gap:4px;padding:10px 14px;}
      .bk-typing span{width:7px;height:7px;border-radius:50%;background:#9e9e9e;animation:bkTyping 1.2s infinite;}
      .bk-typing span:nth-child(2){animation-delay:0.2s;}
      .bk-typing span:nth-child(3){animation-delay:0.4s;}
      @keyframes bkTyping{0%,60%,100%{transform:translateY(0);opacity:0.4;}30%{transform:translateY(-6px);opacity:1;}}
      .bk-quick-btns{display:flex;flex-wrap:wrap;gap:6px;padding:8px 12px;background:#fff;border-top:1px solid #f0f0f0;}
      .bk-quick-btn{padding:5px 12px;border:1px solid #1565c0;border-radius:16px;background:#fff;color:#1565c0;font-size:12px;cursor:pointer;transition:all 0.2s;white-space:nowrap;}
      .bk-quick-btn:hover{background:#1565c0;color:#fff;}
      #bk-chat-input-area{padding:10px 12px;border-top:1px solid #e8eaf6;display:flex;gap:8px;background:#fff;}
      #bk-chat-input{flex:1;padding:9px 14px;border:1.5px solid #e0e0e0;border-radius:24px;font-size:13px;outline:none;transition:border-color 0.2s;}
      #bk-chat-input:focus{border-color:#1565c0;}
      #bk-chat-send{width:38px;height:38px;border-radius:50%;background:#1565c0;border:none;cursor:pointer;color:#fff;font-size:15px;display:flex;align-items:center;justify-content:center;transition:background 0.2s;flex-shrink:0;}
      #bk-chat-send:hover{background:#0d47a1;}
      @media(max-width:480px){#bk-chat-window{width:calc(100vw - 32px);right:16px;}}
    `;
    document.head.appendChild(style);

    const btn = document.createElement('button');
    btn.id = 'bk-chat-btn';
    btn.innerHTML = '💬';
    btn.title = 'Chat tư vấn';
    document.body.appendChild(btn);

    const win = document.createElement('div');
    win.id = 'bk-chat-window';
    win.innerHTML = `
      <div id="bk-chat-header">
        <div class="bk-avatar">🤖</div>
        <div>
          <div class="bk-header-name">Trợ Lý BK</div>
          <div class="bk-header-status">🟢 Trực tuyến • Hỗ trợ 24/7</div>
        </div>
        <button id="bk-chat-close">×</button>
      </div>
      <div id="bk-chat-messages"></div>
      <div class="bk-quick-btns">
        <button class="bk-quick-btn" data-key="Sản phẩm">📦 Sản phẩm</button>
        <button class="bk-quick-btn" data-key="Báo giá">💰 Báo giá</button>
        <button class="bk-quick-btn" data-key="Giao hàng">🚚 Giao hàng</button>
        <button class="bk-quick-btn" data-key="Liên hệ">📞 Liên hệ</button>
        <button class="bk-quick-btn" data-key="Đặt hàng">🛒 Đặt hàng</button>
      </div>
      <div id="bk-chat-input-area">
        <input id="bk-chat-input" placeholder="Nhập câu hỏi..." maxlength="300" />
        <button id="bk-chat-send">➤</button>
      </div>
    `;
    document.body.appendChild(win);

    btn.addEventListener('click', toggleChat);
    document.getElementById('bk-chat-close').addEventListener('click', toggleChat);
    document.getElementById('bk-chat-send').addEventListener('click', sendMessage);
    document.getElementById('bk-chat-input').addEventListener('keydown', e => {
      if (e.key === 'Enter') { e.preventDefault(); sendMessage(); }
    });

    // Nút quick dùng QUICK_MAP để match chính xác
    document.querySelectorAll('.bk-quick-btn').forEach(b => {
      b.addEventListener('click', () => {
        const key = b.dataset.key;
        const mapped = QUICK_MAP[key] || key;
        addMessage('user', key);
        showTypingThen(getReply(mapped));
      });
    });

    addMessage('bot', '👋 Xin chào! Tôi là trợ lý tư vấn của **CÔNG TY BK**.\n\nTôi có thể giúp bạn về sản phẩm, báo giá và đặt hàng. Bạn cần hỗ trợ gì?');
  }

  function toggleChat() {
    isOpen = !isOpen;
    document.getElementById('bk-chat-window').classList.toggle('open', isOpen);
    document.getElementById('bk-chat-btn').innerHTML = isOpen ? '✕' : '💬';
    if (isOpen) setTimeout(() => document.getElementById('bk-chat-input').focus(), 300);
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
  }

  function showTypingThen(reply) {
    const msgs = document.getElementById('bk-chat-messages');
    const typing = document.createElement('div');
    typing.className = 'bk-msg bot';
    typing.innerHTML = '<div class="bk-msg-avatar">🤖</div><div class="bk-bubble bk-typing"><span></span><span></span><span></span></div>';
    msgs.appendChild(typing);
    msgs.scrollTop = msgs.scrollHeight;
    setTimeout(() => { typing.remove(); addMessage('bot', reply); }, 600 + Math.random() * 400);
  }

  function sendMessage() {
    const input = document.getElementById('bk-chat-input');
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    addMessage('user', text);
    showTypingThen(getReply(text));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createWidget);
  } else {
    createWidget();
  }
})();
