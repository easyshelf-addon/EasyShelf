(function () {
  const WORKER_URL = 'https://blendershelf-feedback.denis-ghome.workers.dev';

  function showResult(message, isError) {
    const result = document.getElementById('feedback-result');
    if (!result) return;
    result.innerHTML = '';
    const p = document.createElement('p');
    p.className = isError ? 'error' : 'success';
    p.textContent = message;
    result.appendChild(p);
  }

  function updateConditionalFields(form) {
    const isBug = form.querySelector('input[name="type"]:checked')?.value === 'bug';
    const severityField = form.querySelector('.severity-field');
    const versionsField = form.querySelector('.versions-field');
    const blenderVersionInput = form.querySelector('#feedback-blender-version');
    const addonVersionInput = form.querySelector('#feedback-addon-version');

    severityField.hidden = !isBug;
    versionsField.hidden = !isBug;
    blenderVersionInput.required = isBug;
    addonVersionInput.required = isBug;
  }

  function collectFields(form) {
    const data = new FormData(form);
    return {
      type: data.get('type') || '',
      severity: data.get('severity') || '',
      blenderVersion: (data.get('blenderVersion') || '').trim(),
      addonVersion: (data.get('addonVersion') || '').trim(),
      description: (data.get('description') || '').trim(),
      contact: (data.get('contact') || '').trim(),
      website: data.get('website') || '',
    };
  }

  async function submitFeedback(form) {
    const lang = (typeof currentLanguage === 'function') ? currentLanguage() : 'ru';
    const fields = collectFields(form);

    if (!fields.type) {
      showResult(lang === 'ru' ? 'Выберите тип обращения.' : 'Pick a type.', true);
      return;
    }
    if (!fields.description) {
      showResult(lang === 'ru' ? 'Опишите проблему или идею.' : 'Please add a description.', true);
      return;
    }
    if (fields.type === 'bug' && (!fields.severity || !fields.blenderVersion || !fields.addonVersion)) {
      showResult(
        lang === 'ru'
          ? 'Для бага укажите критичность и обе версии.'
          : 'For a bug, fill in severity and both version fields.',
        true
      );
      return;
    }

    const submitButton = form.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    try {
      const res = await fetch(WORKER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields),
      });
      const data = await res.json().catch(() => ({ ok: false }));
      if (res.ok && data.ok) {
        showResult(lang === 'ru' ? 'Спасибо! Обращение отправлено.' : 'Thanks! Your feedback was submitted.', false);
        form.reset();
        updateConditionalFields(form);
      } else {
        throw new Error('submit failed');
      }
    } catch (e) {
      showResult(
        lang === 'ru' ? 'Не получилось отправить, попробуйте позже.' : "Couldn't submit, please try again later.",
        true
      );
    } finally {
      submitButton.disabled = false;
    }
  }

  if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
      const form = document.getElementById('feedback-form');
      if (!form) return;

      updateConditionalFields(form);
      form.querySelectorAll('input[name="type"]').forEach((radio) => {
        radio.addEventListener('change', () => updateConditionalFields(form));
      });

      form.addEventListener('submit', (e) => {
        e.preventDefault();
        submitFeedback(form);
      });
    });
  }
})();
