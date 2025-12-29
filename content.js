// Content script: listens for autofill command and fills forms using smart field detection.
(function(){
  // utility: try to match element to a profile key
  const KEYWORDS = {
    name: ['name','fullname','full_name','full-name','yourname','username'],
    first_name: ['first','firstname','given-name','given_name'],
    last_name: ['last','lastname','family-name','family_name','surname'],
    email: ['email','e-mail','user_email','login','emailaddress'],
    phone: ['phone','tel','telephone','mobile','contact'],
    address: ['address','addr','street','street-address','address1','address_1'],
    city: ['city','town','locality'],
    state: ['state','region','province','county'],
    zip: ['zip','postal','postalcode','postcode','zip_code'],
    country: ['country','country-name'],
    company: ['company','organization','org','employer']
  };

  function textOfLabel(el){
    try {
      if(!el || !el.labels) return '';
      for(const l of el.labels){
        if(l && l.innerText) return l.innerText.trim();
      }
    } catch(e){}
    return '';
  }

  function detectKey(el){
    const attrs = ['id','name','placeholder','aria-label','type','class'];
    let text='';
    for(const a of attrs){
      try {
        if(el.getAttribute && el.getAttribute(a)) text += ' ' + el.getAttribute(a).toLowerCase();
      } catch(e){}
    }
    text += ' ' + textOfLabel(el).toLowerCase();
    text = text.replace(/[^a-z0-9_ -]/g,' ');
    for(const key in KEYWORDS){
      for(const kw of KEYWORDS[key]){
        if(text.includes(kw)) return key;
      }
    }
    return null;
  }

  function visible(el){
    if(!el) return false;
    const style = window.getComputedStyle(el);
    if(style && (style.display === 'none' || style.visibility === 'hidden' || parseFloat(style.opacity) === 0)) return false;
    if(el.offsetWidth === 0 && el.offsetHeight === 0) return false;
    return true;
  }

  function fillInputs(profile){
    const inputs = Array.from(document.querySelectorAll('input, textarea, select'));
    let filled = 0;
    // First pass: direct matches
    for(const el of inputs){
      if(!visible(el)) continue;
      const key = detectKey(el);
      if(!key) continue;
      let value = '';
      if(key in profile) value = profile[key];
      // name handling: if full name and first/last exist, prefer splitting
      if(key === 'name' && (!value || value.trim()==='') && profile.first_name){
        value = profile.first_name + (profile.last_name ? (' ' + profile.last_name) : '');
      }
      if(value && value !== ''){
        try{
          // For select elements, try to choose matching option
          if(el.tagName.toLowerCase() === 'select'){
            const opt = Array.from(el.options).find(o => (o.text||'').toLowerCase().includes(String(value).toLowerCase()) || (o.value||'').toLowerCase() === String(value).toLowerCase());
            if(opt) { el.value = opt.value; el.dispatchEvent(new Event('change',{bubbles:true})); filled++; continue; }
          }
          el.focus();
          el.value = value;
          el.dispatchEvent(new Event('input', {bubbles:true}));
          el.dispatchEvent(new Event('change', {bubbles:true}));
          filled++;
        }catch(e){}
      }
    }
    // Second pass: generic email/phone fields without clear attributes
    if(filled === 0){
      const maybeEmail = document.querySelector('input[type="email"], input[name*="email"], input[id*="email"]');
      if(maybeEmail && visible(maybeEmail) && profile.email){ maybeEmail.value = profile.email; maybeEmail.dispatchEvent(new Event('input',{bubbles:true})); filled++; }
      const maybeTel = document.querySelector('input[type="tel"], input[name*="phone"], input[id*="phone"]');
      if(maybeTel && visible(maybeTel) && profile.phone){ maybeTel.value = profile.phone; maybeTel.dispatchEvent(new Event('input',{bubbles:true})); filled++; }
    }
    return filled;
  }

  // listen for messages
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if(msg && msg.action === 'autofill' && msg.profile){
      try{
        const profile = msg.profile;
        // normalize keys: lowercase keys
        const norm = {};
        for(const k in profile) norm[k.toLowerCase()] = profile[k];
        // try best-effort filling
        const filled = fillInputs(norm);
        sendResponse({result: filled > 0, filled});
      } catch(e){
        sendResponse({result:false, error: e && e.message});
      }
      // indicate async response
      return true;
    }
  });
})();
