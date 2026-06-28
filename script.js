document.addEventListener('DOMContentLoaded', () => {
  // ══════════════════════════════════════════
  // 1. MOBILE NAVIGATION TOGGLE
  // ══════════════════════════════════════════
  const navToggle = document.getElementById('nav-toggle');
  const navList = document.getElementById('nav-list');

  if (navToggle && navList) {
    navToggle.addEventListener('click', () => {
      navList.classList.toggle('active');
      navToggle.classList.toggle('active');
    });
  }

  // ══════════════════════════════════════════
  // 2. FORM MODE SWITCHER (Normal vs Anonymous)
  // ══════════════════════════════════════════
  const btnNormal = document.getElementById('btn-normal');
  const btnAnon = document.getElementById('btn-anonymous');
  const formNormal = document.getElementById('form-normal');
  const formAnon = document.getElementById('form-anonymous');

  function switchFormMode(mode) {
    if (mode === 'normal') {
      btnNormal.classList.add('active');
      btnAnon.classList.remove('active');
      formNormal.style.display = 'block';
      if (formAnon) formAnon.style.display = 'none';
    } else {
      btnAnon.classList.add('active');
      btnNormal.classList.remove('active');
      formNormal.style.display = 'none';
      if (formAnon) formAnon.style.display = 'block';
    }
  }

  if (btnNormal && btnAnon) {
    btnNormal.addEventListener('click', () => switchFormMode('normal'));
    btnAnon.addEventListener('click', () => switchFormMode('anonymous'));
  }

  // ══════════════════════════════════════════
  // 3. TEXTAREA CHARACTER COUNTER
  // ══════════════════════════════════════════
  function setupCounter(inputId, counterId, maxLength) {
    const input = document.getElementById(inputId);
    const counter = document.getElementById(counterId);
    
    if (input && counter) {
      input.addEventListener('input', () => {
        const currentLength = input.value.length;
        counter.textContent = `${currentLength} / ${maxLength}`;
        if (currentLength > maxLength * 0.9) {
          counter.style.color = 'red';
        } else {
          counter.style.color = 'inherit';
        }
      });
    }
  }

  setupCounter('fn-description', 'counter-fn-description', 1000);
  setupCounter('an-description', 'counter-an-description', 1000); 

  // ══════════════════════════════════════════
  // 4. FORM SUBMISSION
  // ══════════════════════════════════════════
  [formNormal, formAnon].forEach(form => {
    if (!form) return;
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      let isValid = true;
      const mode = form.id === 'form-normal' ? 'normal' : 'anonymous';
      const prefix = mode === 'normal' ? 'fn' : 'an';

      form.querySelectorAll('.field-error').forEach(el => el.textContent = '');

      if (mode === 'normal') {
        const ninInput = document.getElementById('fn-nin');
        if (ninInput && !/^\d{18}$/.test(ninInput.value)) {
          document.getElementById('err-nin').textContent = 'رقم الهوية الوطنية يجب أن يتكون من 18 رقماً.';
          isValid = false;
        }

        const phoneInput = document.getElementById('fn-phone');
        if (phoneInput && !/^0[567][0-9]{8}$/.test(phoneInput.value.replace(/\s/g, ''))) {
          document.getElementById('err-phone').textContent = 'الرجاء إدخال رقم هاتف صحيح (مثال: 0550123456).';
          isValid = false;
        }
      }

      const descInput = document.getElementById(`${prefix}-description`);
      if (descInput && descInput.value.length < 10) {
        document.getElementById(`err-${prefix}-description`).textContent = 'الرجاء شرح الشكوى بالتفصيل (10 أحرف على الأقل).';
        isValid = false;
      }

      if (isValid) {
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        
        // واجهة تحميل شفافة كاملة تمنع الضغط العشوائي أثناء معالجة البيانات والرفع الفعلي
        const loadingOverlay = document.createElement('div');
        loadingOverlay.id = 'real-time-upload-overlay';
        loadingOverlay.innerHTML = `
            <div style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.8); z-index:99999; display:flex; flex-direction:column; justify-content:center; align-items:center; color:white;">
                <div style="border: 6px solid #f3f3f3; border-top: 6px solid #006233; border-radius: 50%; width: 60px; height: 60px; animation: spin 1s linear infinite;"></div>
                <p style="margin-top:20px; font-size:18px; font-weight:bold; font-family:sans-serif;">جاري إرسال الشكوى المرفوعة إلى ديوان الوالي... يرجى الانتظار</p>
            </div>
            <style>@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }</style>
        `;
        document.body.appendChild(loadingOverlay);
        submitBtn.disabled = true;

        const formData = new FormData(form);
        formData.append('complaintType', mode);
        
        if (uploadedFiles[mode]) {
          uploadedFiles[mode].forEach(file => {
            formData.append('documents', file);
          });
        }

        try {
          const response = await fetch('/api/submit', {
            method: 'POST',
            body: formData
          });
          
          const data = await response.json();
          
          if (document.getElementById('real-time-upload-overlay')) {
            document.getElementById('real-time-upload-overlay').remove();
          }

          if (data.success) {
            const trackingCode = data.trackingCode || (data.data && data.data.trackingCode);
            showSuccessModal(mode, trackingCode);
            form.reset();
            uploadedFiles[mode] = [];
            resetUploadZoneDesign(mode);
          } else {
            alert('خطأ من النظام: ' + (data.error || 'فشل إرسال الشكوى'));
          }
        } catch (error) {
          console.error(error);
          if (document.getElementById('real-time-upload-overlay')) {
            document.getElementById('real-time-upload-overlay').remove();
          }
          alert('تعذر الاتصال بالخادم. تأكد من تشغيل السيرفر وحجم الملفات.');
        } finally {
          submitBtn.innerHTML = originalText;
          submitBtn.disabled = false;
        }
      }
    });
  });

  // ══════════════════════════════════════════
  // 5. TRACKING LOGIC
  // ══════════════════════════════════════════
  const trackForm = document.getElementById('track-form');
  if (trackForm) {
    trackForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const code = document.getElementById('track-code').value.trim();
      const resultDiv = document.getElementById('track-result');
      const errorEl = document.getElementById('track-error');
      
      resultDiv.style.display = 'none';
      errorEl.style.display = 'none';

      try {
        const response = await fetch(`/api/track/${code}`);
        const data = await response.json();

        if (data.success && data.data) {
          document.getElementById('res-status').textContent = translateStatus(data.data.status);
          document.getElementById('res-status').className = `status-badge status-${data.data.status}`;
          document.getElementById('res-title').textContent = data.data.title;
          resultDiv.style.display = 'block';
        } else {
          errorEl.textContent = data.error || 'كود التتبع غير صحيح أو غير موجود.';
          errorEl.style.display = 'block';
        }
      } catch (err) {
        errorEl.textContent = 'حدث خطأ أثناء الاتصال بالخادم لتتبع الشكوى.';
        errorEl.style.display = 'block';
      }
    });
  }

  // ══════════════════════════════════════════
  // 6. BIND FILE INPUTS DYNAMICALLY (حل مشكلة عدم التجاوب)
  // ══════════════════════════════════════════
  const zoneNormal = document.getElementById('upload-zone-normal');
  const fileNormal = document.getElementById('fn-files');
  if (zoneNormal && fileNormal) {
    zoneNormal.addEventListener('click', () => fileNormal.click());
    fileNormal.addEventListener('change', (e) => handleFileSelect(e, 'normal'));
    zoneNormal.addEventListener('dragover', handleDragOver);
    zoneNormal.addEventListener('dragleave', handleDragLeave);
    zoneNormal.addEventListener('drop', (e) => handleDrop(e, 'normal'));
  }

  const zoneAnon = document.getElementById('upload-zone-anonymous');
  const fileAnon = document.getElementById('an-files');
  if (zoneAnon && fileAnon) {
    zoneAnon.addEventListener('click', () => fileAnon.click());
    fileAnon.addEventListener('change', (e) => handleFileSelect(e, 'anonymous'));
    zoneAnon.addEventListener('dragover', handleDragOver);
    zoneAnon.addEventListener('dragleave', handleDragLeave);
    zoneAnon.addEventListener('drop', (e) => handleDrop(e, 'anonymous'));
  }
});

// ══════════════════════════════════════════
// 7. SUCCESS MODAL LOGIC (حل مشكلة توسيط النافذة على الحافة)
// ══════════════════════════════════════════
// ══════════════════════════════════════════
// 7. SUCCESS MODAL LOGIC (التوسيط المطلق في مركز الشاشة)
// ══════════════════════════════════════════
function showSuccessModal(mode, trackingCode) {
  const modal = document.getElementById('success-modal');
  const refDisplay = document.getElementById('modal-ref');
  const infoNormal = document.getElementById('modal-info-normal');
  
  if (refDisplay) {
    refDisplay.innerHTML = trackingCode 
      ? `كود التتبع الخاص بك: <strong style="color:#006233; font-size:18px;">${trackingCode}</strong>` 
      : 'خطأ في استخراج كود التتبع';
  }
  
  if (infoNormal) {
    infoNormal.style.display = (mode === 'normal') ? 'block' : 'none';
  }
  
  // 1. تحويل الحاوية الكبرى إلى غطاء كامل للشاشة وممركز بالـ Flexbox
  modal.style.position = 'fixed';
  modal.style.top = '0';
  modal.style.left = '0';
  modal.style.width = '100vw';
  modal.style.height = '100vh';
  modal.style.backgroundColor = 'rgba(0, 0, 0, 0.6)'; // تعتيم رائع للخلفية لبروز النافذة
  modal.style.display = 'flex';
  modal.style.justifyContent = 'center'; // التوسيط الأفقي القاطع
  modal.style.alignItems = 'center';     // التوسيط العمودي القاطع
  modal.style.zIndex = '99999';
  modal.style.margin = '0';
  modal.style.padding = '15px';
  
  // 2. تصفير أي هوامش أو إزاحات موروثة للكرت الأبيض الداخلي تسبب انحرافه
  const innerCard = modal.querySelector('.modal-content, .modal-dialog, div');
  if (innerCard) {
    innerCard.style.margin = '0 auto';
    innerCard.style.position = 'relative';
    innerCard.style.left = 'unset';
    innerCard.style.right = 'unset';
    innerCard.style.transform = 'unset';
    innerCard.style.maxWidth = '500px'; // حجم مثالي متناسق للنافذة
    innerCard.style.width = '100%';
  }

  modal.classList.add('show');

  // تفعيل زر حسناً للإغلاق والإنعاش الفوري
  const okBtn = modal.querySelector('button, .btn-submit, #ok-button');
  if (okBtn) {
    okBtn.replaceWith(okBtn.cloneNode(true));
    const newOkBtn = modal.querySelector('button, .btn-submit, #ok-button');
    newOkBtn.addEventListener('click', closeSuccessModal);
  }
}

function closeSuccessModal() {
  const modal = document.getElementById('success-modal');
  if (modal) {
    modal.classList.remove('show');
    modal.style.display = 'none';
  }
  window.location.reload();
}

// ══════════════════════════════════════════
// 8. FILE UPLOAD VISUAL DESIGN INDICATORS (تصميم تفاعلي كامل عند الرفع)
// ══════════════════════════════════════════
const uploadedFiles = { normal: [], anonymous: [] };
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_FILES = 5;

function handleDragOver(event) {
  event.preventDefault();
  event.currentTarget.style.borderColor = '#006233';
  event.currentTarget.style.backgroundColor = 'rgba(0, 98, 51, 0.05)';
}

function handleDragLeave(event) {
  event.preventDefault();
  event.currentTarget.style.borderColor = '#ccc';
  event.currentTarget.style.backgroundColor = 'transparent';
}

function handleDrop(event, mode) {
  event.preventDefault();
  handleDragLeave(event);
  processFiles(event.dataTransfer.files, mode);
}

function handleFileSelect(event, mode) {
  processFiles(event.target.files, mode);
}

// الدالة المسؤولة عن بناء الديزاين التفاعلي الفوري للملف المرفوع
function processFiles(files, mode) {
  const currentCount = uploadedFiles[mode].length;
  const newFiles = Array.from(files);

  if (currentCount + newFiles.length > MAX_FILES) {
    alert(`عذراً، يمكنك رفع ${MAX_FILES} ملفات كحد أقصى.`);
    return;
  }

  newFiles.forEach(file => {
    if (file.size > MAX_FILE_SIZE) {
      alert(`الملف "${file.name}" يتجاوز الحجم المسموح به (5MB).`);
      return;
    }
    uploadedFiles[mode].push(file);
  });

  // تحديث شكل مستطيل الرفع (ديزاين النجاح الفوري قبل الإرسال)
  const zone = document.getElementById(`upload-zone-${mode}`);
  if (zone) {
    zone.style.borderColor = '#006233';
    zone.style.backgroundColor = '#f0f9f4';
    zone.innerHTML = `
      <div style="text-align: center; padding: 10px;">
        <span style="font-size: 40px; color: #006233;">✓</span>
        <h4 style="margin: 5px 0; color: #006233;">تم تحميل الملفات بنجاح في المتصفح!</h4>
        <p style="font-size: 13px; color: #555; margin: 0;">عدد الملفات المجهزة الآن: <strong>${uploadedFiles[mode].length} ملف</strong></p>
        <div style="width: 80%; background: #ddd; height: 6px; border-radius: 3px; margin: 10px auto; overflow: hidden;">
          <div style="width: 100%; background: #006233; height: 100%; animation: loadSim 0.6s ease-out;"></div>
        </div>
        <span style="font-size: 12px; color: #2d6a4f; cursor: pointer; text-decoration: underline;">اضغط هنا لإضافة المزيد من الوثائق</span>
      </div>
      <style>@keyframes loadSim { from { width: 0%; } to { width: 100%; } }</style>
    `;
  }

  renderFileList(mode);
}

function renderFileList(mode) {
  const list = document.getElementById(`file-list-${mode}`);
  if (!list) return;
  list.innerHTML = '';
  
  uploadedFiles[mode].forEach((file, index) => {
    const item = document.createElement('div');
    item.className = 'file-item';
    item.style = "display: flex; align-items: center; justify-content: space-between; background: #ffffff; margin: 8px 0; padding: 12px; border-radius: 6px; border-right: 5px solid #006233; box-shadow: 0 2px 4px rgba(0,0,0,0.05);";
    item.innerHTML = `
      <div style="display:flex; align-items:center; gap:12px;">
        <span style="font-size:20px;">📄</span>
        <div>
          <div class="file-item-name" style="font-weight:bold; color:#222; font-size:14px;">${file.name}</div>
          <div class="file-item-size" style="color:#666; font-size:12px;">(${(file.size / 1024 / 1024).toFixed(2)} MB) - <span style="color:#006233; font-weight:bold;">جاهز للرفع والتسجيل</span></div>
        </div>
      </div>
      <button type="button" class="file-item-remove" style="background:#ffebe9; border:none; color:#d90429; cursor:pointer; font-weight:bold; width:28px; height:28px; border-radius:50%; display:flex; align-items:center; justify-content:center;" onclick="removeFile(${index}, '${mode}')">✕</button>
    `;
    list.appendChild(item);
  });
}

function removeFile(index, mode) {
  uploadedFiles[mode].splice(index, 1);
  if (uploadedFiles[mode].length === 0) {
    resetUploadZoneDesign(mode);
  } else {
    const zone = document.getElementById(`upload-zone-${mode}`);
    if (zone) {
      const textEl = zone.querySelector('p') || zone;
      textEl.innerHTML = `<span style="color:#006233; font-weight:bold;">✓ تم تجهيز (${uploadedFiles[mode].length}) ملفات للرفع بنجاح!</span>`;
    }
  }
  renderFileList(mode);
}

function resetUploadZoneDesign(mode) {
  const zone = document.getElementById(`upload-zone-${mode}`);
  if (zone) {
    zone.style.borderColor = '#ccc';
    zone.style.backgroundColor = 'transparent';
    zone.innerHTML = `
      <div class="upload-zone-content" style="text-align:center; padding:20px;">
        <span style="font-size:30px; color:#aaa;">☁️</span>
        <p style="margin:10px 0 0 0;">اسحب وأفلت الملفات هنا أو انقر للاختيار</p>
        <span style="font-size:11px; color:#888;">PDF, صور (JPG, PNG) • الحجم الأقصى: 5MB لكل ملف • حتى 5 ملفات</span>
      </div>
    `;
  }
}

function translateStatus(s) {
  const m = { 'pending_secretary': 'قيد الفرز الإداري', 'pending_governor': 'عند السيد الوالي', 'resolved': 'تمت المعالجة والحل', 'spam': 'مرفوض / سبام' };
  return m[s] || s;
}