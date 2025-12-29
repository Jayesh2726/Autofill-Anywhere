let currentPage = 0;

const pages = document.querySelectorAll(".page");
const icons = document.querySelectorAll(".icon");
const title = document.getElementById("title");

const titles = ["Personal", "Education", "Experience", "Skills"];

function showPage(index) {
  pages.forEach(p => p.classList.remove("active"));
  icons.forEach(i => i.classList.remove("active"));

  pages[index].classList.add("active");
  icons[index].classList.add("active");

  title.textContent = titles[index];
}

document.getElementById("nextBtn").onclick = () => {
  if (currentPage < pages.length - 1) {
    currentPage++;
    showPage(currentPage);
  }
};

document.getElementById("prevBtn").onclick = () => {
  if (currentPage > 0) {
    currentPage--;
    showPage(currentPage);
  }
};

/* Sidebar click */
icons.forEach((icon, i) => {
  icon.onclick = () => {
    currentPage = i;
    showPage(i);
  };
});

/* SAVE DATA */
document.getElementById("saveBtn").onclick = () => {
  chrome.storage.sync.set({
    profile: {
      name: name.value,
      email: email.value,
      phone: phone.value,
      address: address.value
    }
  });
};

/* LOAD DATA */
document.addEventListener("DOMContentLoaded", () => {
  chrome.storage.sync.get(["profile"], res => {
    if (!res.profile) return;
    name.value = res.profile.name || "";
    email.value = res.profile.email || "";
    phone.value = res.profile.phone || "";
    address.value = res.profile.address || "";
  });
});
