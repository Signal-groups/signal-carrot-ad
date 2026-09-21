(() => {
  'use strict';

  // 배진우 개인 전용 Apps Script: 이메일 + 텔레그램 + 구글시트
  const ENDPOINT = 'https://script.google.com/macros/s/AKfycbxSI6a82YhBdLoE3lekYihAt2B-MU0bwFUQM5qOb9Lwn8IquOjpa2sdn9SahPjkEics/exec';
  const REGIONS = {
    all: { label: '전국', short: '전국' },
    wj: { label: '강원 원주', short: '원주' },
    cc: { label: '강원 춘천', short: '춘천' },
    ic: { label: '경기 이천', short: '이천' },
    yj: { label: '경기 여주', short: '여주' },
    sn: { label: '경기 성남', short: '성남' }
  };
  const pathParts = location.pathname.split('/').filter(Boolean);
  const regionCode = [...pathParts].reverse().find(part => REGIONS[part]) || 'all';
  const region = REGIONS[regionCode];

  document.title = `${region.label} 시니어케어 전문 컨설턴트 공개채용 | 시그널그룹`;
  document.querySelector('meta[name="description"]')?.setAttribute('content', `${region.label} 시니어케어 전문 컨설턴트 공개채용 상담 신청. 시그널그룹.`);
  document.querySelectorAll('[data-region]').forEach(element => { element.textContent = region.label; });
  document.querySelectorAll('[data-region-short]').forEach(element => { element.textContent = region.short; });
  document.querySelectorAll('[data-regional-only]').forEach(element => { element.hidden = regionCode === 'all'; });
  document.querySelectorAll('[data-national-only]').forEach(element => { element.hidden = regionCode !== 'all'; });

  const tabs = [...document.querySelectorAll('.section-tabs a')];
  const sections = tabs.map(tab => document.querySelector(tab.getAttribute('href'))).filter(Boolean);
  if ('IntersectionObserver' in window) {
    const spy = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        tabs.forEach(tab => tab.classList.toggle('active', tab.getAttribute('href') === `#${entry.target.id}`));
      });
    }, { rootMargin: '-20% 0px -65% 0px', threshold: 0 });
    sections.forEach(section => spy.observe(section));
  }

  const form = document.getElementById('leadForm');
  const phone = form.elements.phone;
  const message = form.querySelector('.form-message');
  const submitButton = form.querySelector('[type="submit"]');
  let submitting = false;

  phone.addEventListener('input', () => {
    const digits = phone.value.replace(/\D/g, '').slice(0, 11);
    phone.value = digits.length > 7
      ? `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`
      : digits.length > 3 ? `${digits.slice(0, 3)}-${digits.slice(3)}` : digits;
  });

  const privacyModal = document.getElementById('privacyModal');
  const successModal = document.getElementById('successModal');
  const openModal = modal => { modal.classList.add('open'); modal.querySelector('button').focus(); };
  const closeModal = modal => modal.classList.remove('open');
  document.getElementById('privacyOpen').addEventListener('click', () => openModal(privacyModal));
  document.getElementById('privacyClose').addEventListener('click', () => closeModal(privacyModal));
  document.getElementById('successClose').addEventListener('click', () => closeModal(successModal));
  [privacyModal, successModal].forEach(modal => modal.addEventListener('click', event => { if (event.target === modal) closeModal(modal); }));
  document.addEventListener('keydown', event => { if (event.key === 'Escape') { closeModal(privacyModal); closeModal(successModal); } });

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (submitting || form.elements.website.value) return;
    const name = form.elements.name.value.trim();
    const phoneNumber = phone.value.trim();
    if (!name || !/^01[016789]-?\d{3,4}-?\d{4}$/.test(phoneNumber) || !form.elements.privacy.checked) {
      message.textContent = '이름, 올바른 연락처, 개인정보 동의를 확인해 주세요.';
      message.style.color = '#c83232';
      return;
    }

    submitting = true;
    submitButton.disabled = true;
    submitButton.textContent = '상담 신청 접수 중…';
    const query = new URLSearchParams(location.search);
    const timestamp = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
    const payload = {
      schema_version: '2.0',
      formType: 'recruit',
      page_id: `signal-open-recruit-${regionCode}`,
      page_type: 'RECRUIT',
      platform: query.get('utm_source') || 'daangn',
      campaign_code: query.get('utm_campaign') || `signal-open-recruit-${regionCode}`,
      content_code: query.get('utm_content') || '시니어케어 전문 컨설턴트 공개채용',
      timestamp,
      createdAt: new Date().toISOString(),
      name,
      customer_name: name,
      phone: phoneNumber,
      region: region.label,
      loc: region.label,
      exp: '공개채용 상담 신청',
      memo: '시니어케어 전문 컨설턴트 공개채용 상담 신청',
      message: '시니어케어 전문 컨설턴트 공개채용 상담 신청',
      privacy_agreed: true,
      request_type: 'recruit',
      consultation_type: '공개채용 상담 신청',
      advisor: '배진우',
      expert: '배진우',
      landing_page: location.pathname,
      landing_url: location.href,
      page_url: location.href,
      referrer: document.referrer,
      brand: '(주)시그널그룹',
      telegramTitle: `[(주)시그널그룹 공개채용] ${region.label} 상담 신청`
    };

    try {
      await fetch(ENDPOINT, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload),
        keepalive: true
      });
      form.reset();
      message.textContent = '';
      openModal(successModal);
    } catch (error) {
      message.textContent = '접수 중 문제가 발생했습니다. 전화 또는 카카오톡으로 문의해 주세요.';
      message.style.color = '#c83232';
    } finally {
      submitting = false;
      submitButton.disabled = false;
      submitButton.textContent = '15분 공개채용 상담 신청하기';
    }
  });

  if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); }
    }), { threshold: .1 });
    document.querySelectorAll('.reveal').forEach(element => observer.observe(element));
  } else {
    document.querySelectorAll('.reveal').forEach(element => element.classList.add('visible'));
  }
})();
