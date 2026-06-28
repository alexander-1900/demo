/**
 * AFLOU COMPLAINTS PORTAL - ADMIN DEMO LOGIC (STATIC VERSION)
 * High-Level Interaction for Governor Portal - Serverless Static Demo
 */

document.addEventListener('DOMContentLoaded', () => {
  const complaintsTbody = document.getElementById('complaints-tbody');
  const totalCount = document.getElementById('total-count');
  const logoutBtn = document.getElementById('logout-btn');
  const detailsModal = document.getElementById('details-modal');
  const detailsBody = document.getElementById('details-body');
  const closeModalBtn = document.getElementById('close-modal-btn');

  // 1. قاعدة البيانات الثابتة للعرض (Mock Data)
  const mockComplaints = [
    {
      id: "comp-1",
      trackingCode: "AFL-2026-098",
      title: "طلب تهيئة المسالك الريفية وتعبيد الطريق المؤدي لقرية واد الرمان",
      createdAt: "2026-06-25T10:30:00Z",
      complaintType: "normal",
      status: "pending_governor",
      citizenName: "محمد بن علي",
      citizenPhone: "0661234567",
      citizenEmail: "m.benali@email.com",
      priority: "urgent",
      metadata: { commune: "أفلو", nin: "19203040506070" },
      content: "السلام عليكم سيادة الوالي، نتقدم إليكم بطلبنا هذا قصد النظر في الوضعية الكارثية للطريق المسلكي لقرية واد الرمان بأفلو، حيث نعاني من عزلة تامة خاصة في فصل الشتاء وهطول الأمطار مما يعيق تنقل التلاميذ والمرضى. نرجو من مصالحكم إدراج المشروع ضمن M.P.D.",
      attachments: [{ filename: "#", originalName: "تقرير_المعاينة_الميدانية.pdf" }]
    },
    {
      id: "comp-2",
      trackingCode: "AFL-2026-102",
      title: "انشغال مستعجل بخصوص تذبذب توزيع مياه الشرب بحي 20 أوت",
      createdAt: "2026-06-27T14:15:00Z",
      complaintType: "anonymous",
      status: "pending_governor",
      citizenName: null,
      citizenPhone: null,
      citizenEmail: null,
      priority: "very_urgent",
      metadata: { commune: "أفلو", nin: null },
      content: "نحيطكم علماً سيادة الوالي أن حي 20 أوت يعاني من انقطاع تام للماء الشروب منذ أكثر من 10 أيام متتالية دون سابق إنذار من شركة الجزائرية للمياه، نرجو تدخلكم الصارم لتنظيم برنامج التوزيع ورفع الغبن عن الساكنة.",
      attachments: []
    },
    {
      id: "comp-3",
      trackingCode: "AFL-2026-055",
      title: "شكوى بخصوص تأخر مشاريع الإنارة العمومية في المخطط الجديد",
      createdAt: "2026-06-20T09:00:00Z",
      complaintType: "normal",
      status: "resolved",
      citizenName: "عمر فاروق بوعلام",
      citizenPhone: "0550112233",
      citizenEmail: "omar.aflou@email.com",
      priority: "normal",
      metadata: { commune: "أفلو", nin: "185060708090" },
      content: "تم تقديم الطلب سابقاً لتوفير الإنارة بسبب خطورة المسلك ليلاً، ونشكر مصالحكم المحلية على الاستجابة السريعة وتنصيب الأعمدة الكهربائية الجديدة بالحي.",
      attachments: []
    }
  ];

  // 2. دالة تشغيل وتحميل لوحة التحكم مباشرة
  const initDashboard = () => {
    renderTable(mockComplaints, 'governor');
    totalCount.innerText = mockComplaints.length;
  };

  const escapeHTML = (str) => {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  };

  const renderTable = (complaints, role) => {
    if (complaints.length === 0) {
      complaintsTbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:50px; color:var(--text-muted);">لا توجد شكاوى حالياً</td></tr>`;
      return;
    }

    complaintsTbody.innerHTML = complaints.map(c => `
      <tr data-id="${c.id}">
        <td><strong style="color:var(--green);">${escapeHTML(c.trackingCode)}</strong></td>
        <td style="max-width:300px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${escapeHTML(c.title)}</td>
        <td>${new Date(c.createdAt).toLocaleDateString('ar-DZ')}</td>
        <td>${c.complaintType === 'anonymous' ? '<span style="color:var(--red);">مجهول</span>' : 'عادي'}</td>
        <td><span class="status-badge status-${c.status}">${translateStatus(c.status)}</span></td>
        <td>
          <div style="display:flex; gap:8px;">
            <button class="btn-action-sm btn-details" data-action="details">تفاصيل</button>
            ${role === 'governor' && c.status !== 'resolved' ? `<button class="btn-action-sm btn-resolve" data-action="resolve">إغلاق وحل</button>` : ''}
          </div>
        </td>
      </tr>
    `).join('');
  };

  const translateStatus = (s) => {
    const m = { 'pending_secretary': 'قيد الفرز', 'pending_governor': 'عند الوالي', 'resolved': 'تم الحل', 'spam': 'مرفوض' };
    return m[s] || s;
  };

  const translatePriority = (p) => {
    const m = { 'normal': 'عادي', 'urgent': 'مستعجل', 'very_urgent': 'جد مستعجل' };
    return m[p] || p;
  };

  // 3. التفاعل مع الأزرار محلياً
  complaintsTbody.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;

    const row = btn.closest('tr');
    const id = row.dataset.id;
    const action = btn.dataset.action;

    if (action === 'details') showDetailsStatic(id);
    if (action === 'resolve') resolveComplaintStatic(id, row);
  });

  const showDetailsStatic = (id) => {
    const c = mockComplaints.find(item => item.id === id);
    if (!c) return alert('الشكوى غير موجودة');

    detailsBody.innerHTML = `
      <div class="details-grid">
        <div class="detail-item">
          <span class="detail-label">المشتكي</span>
          <span class="detail-value">${escapeHTML(c.citizenName || 'مجهول الهوية')}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">رقم الهاتف</span>
          <span class="detail-value">${escapeHTML(c.citizenPhone || 'غير متوفر')}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">البريد الإلكتروني</span>
          <span class="detail-value">${escapeHTML(c.citizenEmail || 'غير متوفر')}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">درجة الأهمية</span>
          <span class="detail-value priority-${c.priority}">${translatePriority(c.priority)}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">تاريخ التقديم</span>
          <span class="detail-value">${new Date(c.createdAt).toLocaleString('ar-DZ')}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">كود التتبع</span>
          <span class="detail-value">${escapeHTML(c.trackingCode)}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">البلدية</span>
          <span class="detail-value">${escapeHTML(c.metadata?.commune || 'غير محدد')}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">رقم الهوية (NIN)</span>
          <span class="detail-value">${escapeHTML(c.metadata?.nin || 'غير متوفر')}</span>
        </div>
        <div class="detail-item detail-full-width">
          <span class="detail-label">الموضوع</span>
          <div class="detail-box">${escapeHTML(c.title)}</div>
        </div>
        <div class="detail-item detail-full-width">
          <span class="detail-label">نص الشكوى الكامل</span>
          <div class="detail-box" style="white-space:pre-wrap; background:white;">${escapeHTML(c.content)}</div>
        </div>
        ${c.attachments && c.attachments.length > 0 ? `
          <div class="detail-item detail-full-width">
            <span class="detail-label">المرفقات (${c.attachments.length})</span>
            <div style="display:flex; flex-wrap:wrap; gap:10px; margin-top:10px;">
              ${c.attachments.map(att => `
                <a href="#" onclick="alert('ملف محاكي للعرض: التحميل معطل في النسخة الاستاتيكية'); return false;" class="download-anchor">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  تحميل: ${escapeHTML(att.originalName)}
                </a>
              `).join('')}
            </div>
          </div>
        ` : '<div class="detail-item detail-full-width"><span class="detail-label">المرفقات</span><span class="detail-value">لا توجد مرفقات</span></div>'}
      </div>
    `;
    detailsModal.classList.add('show');
  };

  const resolveComplaintStatic = (id, row) => {
    if (!confirm('هل تأكدت من حل هذه الشكوى نهائياً؟')) return;
    const c = mockComplaints.find(item => item.id === id);
    if (c) c.status = 'resolved';

    const badge = row.querySelector('.status-badge');
    if (badge) {
      badge.className = 'status-badge status-resolved';
      badge.innerText = 'تم الحل';
    }
    const resolveBtn = row.querySelector('.btn-resolve');
    if (resolveBtn) resolveBtn.remove();
  };

  logoutBtn.addEventListener('click', () => {
    window.location.reload();
  });

  closeModalBtn.onclick = () => detailsModal.classList.remove('show');
  window.onclick = (e) => { if (e.target == detailsModal) detailsModal.classList.remove('show'); };

  // تشغيل مباشر للوحة التحكم عند فتح الصفحة
  initDashboard();
});