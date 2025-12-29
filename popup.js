// Popup script: save profile to chrome.storage, send autofill message to content script
const $ = id => document.getElementById(id);
const fields = ['name','email','phone','address','city','state','zip','country','company'];

function showStatus(msg, ok=true){
  const s = $('status');
  s.textContent = msg;
  s.style.color = ok ? 'green' : 'red';
  setTimeout(()=> s.textContent = '', 3000);
}

// Load saved profile on open
document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.sync.get('autofill_profile', (res) => {
    if(res.autofill_profile){
      const p = res.autofill_profile;
      fields.forEach(f => { if(p[f]) $(f).value = p[f]; });
    }
  });
});

// Save profile
$('saveBtn').addEventListener('click', () => {
  const profile = {};
  fields.forEach(f => profile[f] = $(f).value || '');
  chrome.storage.sync.set({autofill_profile: profile}, () => {
    showStatus('Profile saved ✔');
  });
});

// Clear saved profile (and inputs)
$('clearBtn').addEventListener('click', () => {
  chrome.storage.sync.remove('autofill_profile', () => {
    fields.forEach(f => $(f).value='');
    showStatus('Profile cleared');
  });
});

// Send autofill command to active tab
$('autofillBtn').addEventListener('click', async () => {
  chrome.storage.sync.get('autofill_profile', async (res) => {
    const profile = res.autofill_profile || {};
    if(Object.keys(profile).length === 0){
      showStatus('No profile saved', false);
      return;
    }
    // get active tab
    chrome.tabs.query({active:true,currentWindow:true}, (tabs) => {
      if(!tabs || tabs.length === 0) { showStatus('No active tab', false); return; }
      const tab = tabs[0];
      chrome.tabs.sendMessage(tab.id, {action:'autofill', profile}, (resp) => {
        if(chrome.runtime.lastError){
          // likely the page didn't allow content script or no content script loaded
          showStatus('Could not contact page. Try reloading the page.', false);
        } else {
          showStatus(resp && resp.result ? 'Autofilled ✔' : 'Nothing filled');
        }
      });
    });
  });
});
