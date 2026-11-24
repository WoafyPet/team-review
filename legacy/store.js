const combinedCatalogPhotos={"four-paw-anti-slip-dog-socks":"/team-review/assets/shop-uniform-socks.webp","cushioned-dog-elbow-sleeves":"/team-review/assets/shop-uniform-elbow.webp","adjustable-folding-dog-ramp":"/team-review/assets/shop-uniform-ramp.webp","adjustable-rear-leg-support-brace":"/team-review/assets/shop-uniform-brace.webp","custom-photo-projection-light":"/team-review/assets/shop-uniform-light.webp"};
const combinedProductNames={"four-paw-anti-slip-dog-socks": "Four-Paw Grip Socks", "cushioned-dog-elbow-sleeves": "Cushioned Elbow Sleeves", "adjustable-folding-dog-ramp": "Folding Dog Ramp", "adjustable-rear-leg-support-brace": "Rear-Leg Support Brace", "custom-photo-projection-light": "Dog Photo Projection Light"};
const combinedProductBenefits={"four-paw-anti-slip-dog-socks": "Extra grip for steadier steps at home.", "cushioned-dog-elbow-sleeves": "Cushion both elbows on hard floors.", "adjustable-folding-dog-ramp": "Their favorite spot, without the jump.", "adjustable-rear-leg-support-brace": "Targeted rear-leg support. Fit matters.", "custom-photo-projection-light": "Turn their photo into a little light."};
const combinedProductPhotos={"four-paw-anti-slip-dog-socks": "/team-review/assets/socks-original-set.png", "cushioned-dog-elbow-sleeves": "/team-review/assets/cushioned-dog-elbow-sleeves-6.webp", "adjustable-folding-dog-ramp": "/team-review/assets/ramp-open-real.webp", "adjustable-rear-leg-support-brace": "/team-review/assets/adjustable-rear-leg-support-brace-0.webp", "custom-photo-projection-light": "/team-review/assets/custom-photo-projection-light-1.webp"};
const header = document.querySelector("[data-header]");

const updateHeader = () => {
  header?.classList.toggle("is-scrolled", window.scrollY > 12);
};

window.addEventListener("scroll", updateHeader, { passive: true });
updateHeader();

const navMenus = [...document.querySelectorAll("[data-nav-menu]")];
navMenus.forEach((menu) => {
  menu.querySelector("summary")?.addEventListener("click", () => {
    const willOpen = !menu.open;
    if (!willOpen) return;
    navMenus.forEach((other) => {
      if (other !== menu) other.open = false;
    });
  });
});

document.addEventListener("click", (event) => {
  if (event.target.closest("[data-nav-menu]")) return;
  navMenus.forEach((menu) => {
    menu.open = false;
  });
});

document.querySelectorAll("[data-waitlist-form]").forEach((form) => {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const note = form.querySelector("[data-form-note]");
    const button = form.querySelector("button[type='submit']");
    const email = form.querySelector("[name='email']")?.value || "";
    const concern = form.querySelector("[name='concern']")?.value || "";
    const consent = Boolean(form.querySelector("[name='consent']")?.checked);

    if (button) {
      button.disabled = true;
      button.textContent = "Saving your place...";
    }
    if (note) note.textContent = "";

    try {
      const response = await fetch("/team-review/api/waitlist", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, concern, consent }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "We could not save your place right now.");
      document.dispatchEvent(new CustomEvent("woafmeow:conversion", { detail: { channel: "waitlist" } }));
      if (note) note.textContent = result.message;
      form.reset();
      if (button) button.textContent = "You are on the list";
    } catch (error) {
      if (note) note.textContent = error.message || "We could not save your place right now. Please try again.";
      if (button) button.textContent = "Join the Waitlist";
    } finally {
      if (button) button.disabled = false;
    }
  });
});

document.querySelectorAll("[data-checklist]").forEach((container) => {
  const key = `woafypet-checklist:${container.dataset.checklist}`;
  const note = container.querySelector("[data-checklist-note]");
  const checks = [...container.querySelectorAll("[data-check-item]")];
  const fields = [...container.querySelectorAll("[data-note-field]")];

  const readState = () => {
    try {
      return JSON.parse(localStorage.getItem(key) || "{}");
    } catch {
      return {};
    }
  };

  const writeState = () => {
    const state = {
      checks: checks.map((input) => input.checked),
      fields: fields.map((field) => field.value),
    };
    localStorage.setItem(key, JSON.stringify(state));
    if (note) note.textContent = "Saved for this device.";
  };

  const state = readState();
  checks.forEach((input, index) => {
    input.checked = Boolean(state.checks?.[index]);
    input.addEventListener("change", writeState);
  });
  fields.forEach((field, index) => {
    field.value = state.fields?.[index] || "";
    field.addEventListener("input", writeState);
  });

  container.querySelector("[data-reset-checklist]")?.addEventListener("click", () => {
    checks.forEach((input) => {
      input.checked = false;
    });
    fields.forEach((field) => {
      field.value = "";
    });
    localStorage.removeItem(key);
    if (note) note.textContent = "Cleared.";
  });
});

const directorySearch = document.querySelector("[data-directory-search]");
const directoryCategory = document.querySelector("[data-directory-category]");
const directoryCoverage = document.querySelector("[data-directory-coverage]");
const directoryCards = [...document.querySelectorAll("[data-directory-item]")];
const directoryEmpty = document.querySelector("[data-directory-empty]");
const directoryResultCount = document.querySelector("[data-directory-results-count]");

const filterDirectory = () => {
  const query = (directorySearch?.value || "").trim().toLowerCase();
  const category = directoryCategory?.value || "all";
  const coverage = directoryCoverage?.value || "all";
  let visible = 0;

  directoryCards.forEach((card) => {
    const matchesQuery = !query || (card.dataset.search || "").toLowerCase().includes(query);
    const matchesCategory = category === "all" || (card.dataset.categories || "").split("|").includes(category);
    const cardCoverage = card.dataset.coverage || "all";
    const matchesCoverage = coverage === "all" || cardCoverage === "all" || cardCoverage === coverage;
    const show = matchesQuery && matchesCategory && matchesCoverage;
    card.hidden = !show;
    if (show && card.hasAttribute("data-directory-profile")) visible += 1;
  });

  if (directoryEmpty) directoryEmpty.hidden = visible > 0;
  if (directoryResultCount) directoryResultCount.textContent = `${visible} ${visible === 1 ? "result" : "results"}`;
};

directorySearch?.addEventListener("input", filterDirectory);
directoryCategory?.addEventListener("change", filterDirectory);
directoryCoverage?.addEventListener("change", filterDirectory);
filterDirectory();

const resourceSearch = document.querySelector("[data-resource-search]");
const resourceSort = document.querySelector("[data-resource-sort]");
const resourceCards = [...document.querySelectorAll("[data-resource-card]")];
const resourceEmpty = document.querySelector("[data-resource-empty]");
const resourceFilters = [...document.querySelectorAll("[data-resource-filter]")];
let activeResourceFilter = "all";

const filterResources = () => {
  const query = (resourceSearch?.value || "").trim().toLowerCase();
  let visible = 0;
  resourceCards.forEach((card) => {
    const title = card.dataset.title.toLowerCase();
    const category = card.dataset.category || "";
    const matchesQuery = !query || title.includes(query);
    const matchesFilter =
      activeResourceFilter === "all" ||
      (activeResourceFilter === "care" && !category.includes("bobby") && !category.includes("first-time")) ||
      (activeResourceFilter === "guide" && (category.includes("vet") || category.includes("comfort") || category.includes("quality"))) ||
      (activeResourceFilter === "story" && (category.includes("bobby") || category.includes("first-time")));
    const show = matchesQuery && matchesFilter;
    card.hidden = !show;
    if (show) visible += 1;
  });
  if (resourceEmpty) resourceEmpty.hidden = visible > 0;
};

const sortResources = () => {
  if (!resourceSort || resourceCards.length === 0) return;
  const parent = resourceCards[0].parentElement;
  const sorted = [...resourceCards].sort((a, b) => {
    if (resourceSort.value === "shortest") return Number(a.dataset.read || 0) - Number(b.dataset.read || 0);
    if (resourceSort.value === "practical") return a.dataset.title.localeCompare(b.dataset.title);
    return 0;
  });
  sorted.forEach((card) => parent.appendChild(card));
};

resourceFilters.forEach((button) => {
  button.addEventListener("click", () => {
    activeResourceFilter = button.dataset.resourceFilter || "all";
    resourceFilters.forEach((item) => item.classList.toggle("is-active", item === button));
    filterResources();
  });
});

resourceSearch?.addEventListener("input", filterResources);
resourceSort?.addEventListener("change", () => {
  sortResources();
  filterResources();
});
sortResources();
filterResources();

const topicSearch = document.querySelector("[data-topic-search]");
const topicClear = document.querySelector("[data-topic-clear]");
const topicCards = [...document.querySelectorAll("[data-topic-card]")];
const topicEmpty = document.querySelector("[data-topic-empty]");

const filterTopics = () => {
  const query = (topicSearch?.value || "").trim().toLowerCase();
  let visible = 0;
  topicCards.forEach((card) => {
    const show = !query || card.dataset.title.toLowerCase().includes(query);
    card.hidden = !show;
    if (show) visible += 1;
  });
  if (topicEmpty) topicEmpty.hidden = visible > 0;
};

topicSearch?.addEventListener("input", filterTopics);
topicClear?.addEventListener("click", () => {
  if (topicSearch) topicSearch.value = "";
  filterTopics();
});
filterTopics();

const memberStorageKey = "woafypet-care-circle-member";
const pendingLessonKey = "woafypet-pending-lesson";

const readMember = () => {
  try {
    const member = JSON.parse(localStorage.getItem(memberStorageKey) || "null");
    return member?.id && member?.token && member?.dogId && member?.dogName ? member : null;
  } catch {
    return null;
  }
};

const saveMember = (member) => {
  localStorage.setItem(memberStorageKey, JSON.stringify(member));
  return member;
};

const localPreview = ["127.0.0.1", "localhost"].includes(window.location.hostname);
const localPetsStorageKey = "woafmeow-local-pets-v1";
const readLocalPets = () => {
  try { return JSON.parse(localStorage.getItem(localPetsStorageKey) || "[]"); } catch { return []; }
};
const saveLocalPets = (pets) => localStorage.setItem(localPetsStorageKey, JSON.stringify(pets));

const localAccountRequest = async (url, payload) => {
  if (url === "/team-review/api/enroll") {
    const dogId = `pet_${crypto.randomUUID()}`;
    const member = {
      id: `member_${crypto.randomUUID()}`,
      token: crypto.randomUUID(),
      dogId,
      dogName: payload.dogName,
      species: payload.species,
      breed: payload.breed,
      ageYears: payload.ageYears,
      weightLbs: payload.weightLbs,
      focus: payload.focus,
      healthConditions: payload.healthConditions,
      medications: payload.medications,
      routineNotes: payload.routineNotes,
      firstName: payload.ownerName,
      email: payload.email,
      location: payload.location,
    };
    saveLocalPets([member]);
    return { member, pet: member, message: `${payload.dogName}'s care account is ready.` };
  }
  if (url === "/team-review/api/pets") {
    const member = readMember();
    if (!member) throw new Error("Sign in before adding another pet.");
    const pet = { ...payload, dogId: `pet_${crypto.randomUUID()}` };
    saveLocalPets([...readLocalPets(), pet]);
    return { pet, message: `${payload.dogName} was added.` };
  }
  return null;
};

document.querySelectorAll("[data-account-signout]").forEach((link) => {
  link.addEventListener("click", () => {
    localStorage.removeItem(memberStorageKey);
  });
});

const requestJson = async (url, payload, extraHeaders = {}) => {
  if (localPreview && ["/team-review/api/enroll", "/team-review/api/pets"].includes(url)) {
    return localAccountRequest(url, payload);
  }
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json", ...extraHeaders },
    body: JSON.stringify(payload),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || "We could not save that right now. Please try again.");
  const analyticsChannel = { "/team-review/api/newsletter": "newsletter", "/team-review/api/contact": "contact", "/team-review/api/session-interest": "session", "/team-review/api/provider-inquiry": "provider", "/team-review/api/memorial-interest": "memorial" }[url];
  if (analyticsChannel) document.dispatchEvent(new CustomEvent("woafmeow:conversion", { detail: { channel: analyticsChannel } }));
  return result;
};

document.querySelectorAll("[data-session-interest-form]").forEach((form) => {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const note = form.querySelector("[data-session-interest-note]");
    const button = form.querySelector("button[type='submit']");
    const values = Object.fromEntries(new FormData(form).entries());
    const payload = {
      ...values,
      sessionSlug: form.dataset.sessionSlug || "next-live-care-session",
      sessionTitle: form.dataset.sessionTitle || "Next live Care Session",
      consent: Boolean(form.querySelector("[name='consent']")?.checked),
    };
    const original = button?.textContent || "Reserve my place";

    if (button) {
      button.disabled = true;
      button.textContent = "Saving your place...";
    }
    if (note) note.textContent = "";
    try {
      const result = await requestJson("/team-review/api/session-interest", payload);
      if (note) note.textContent = result.message;
      form.reset();
      if (button) button.textContent = "Your place is saved";
    } catch (error) {
      if (note) note.textContent = error.message || "We could not save your session request right now.";
      if (button) button.textContent = original;
    } finally {
      if (button) button.disabled = false;
    }
  });
});

document.querySelectorAll("[data-newsletter-form]").forEach((form) => {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const note = form.querySelector("[data-newsletter-note]");
    const button = form.querySelector("button[type='submit']");
    const email = form.querySelector("[name='email']")?.value || "";
    const consent = Boolean(form.querySelector("[name='consent']")?.checked);
    if (button) {
      button.disabled = true;
      button.textContent = "Signing up...";
    }
    if (note) note.textContent = "";
    try {
      const result = await requestJson("/team-review/api/newsletter", { email, consent });
      if (note) {
        note.replaceChildren(document.createTextNode(result.message));
        if (result.delivery === "fallback" && result.guideUrl) {
          note.append(document.createTextNode(" "));
          const link = document.createElement("a");
          link.href = result.guideUrl;
          link.textContent = "Open the guide";
          note.append(link);
        }
      }
      form.reset();
      if (button) button.textContent = result.delivery === "sent" ? "Guide sent" : "Open the guide below";
    } catch (error) {
      if (note) note.textContent = error.message || "We could not save your signup right now.";
      if (button) button.textContent = "Sign up";
    } finally {
      if (button) button.disabled = false;
    }
  });
});

document.querySelectorAll("[data-contact-form]").forEach((form) => {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const note = form.querySelector("[data-contact-note]");
    const button = form.querySelector("button[type='submit']");
    const original = button?.textContent || "Send message";
    const values = Object.fromEntries(new FormData(form).entries());
    const payload = { ...values };
    if (button) {
      button.disabled = true;
      button.textContent = "Sending...";
    }
    if (note) note.textContent = "";
    try {
      const result = await requestJson("/team-review/api/contact", payload);
      if (note) note.textContent = result.message;
      form.reset();
      if (button) button.textContent = "Message sent";
    } catch (error) {
      if (note) note.textContent = error.message || "We could not send that message right now.";
      if (button) button.textContent = original;
    } finally {
      if (button) button.disabled = false;
    }
  });
});

document.querySelectorAll("[data-memorial-interest-form]").forEach((form) => {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const note = form.querySelector("[data-memorial-interest-note]");
    const button = form.querySelector("button[type='submit']");
    const values = Object.fromEntries(new FormData(form).entries());
    const original = button?.textContent || "Keep me informed";
    const payload = { ...values };

    if (button) {
      button.disabled = true;
      button.textContent = "Saving your request...";
    }
    if (note) note.textContent = "";
    try {
      const result = await requestJson("/team-review/api/memorial-interest", payload);
      if (note) note.textContent = result.message;
      form.reset();
      if (button) button.textContent = "You are on the list";
    } catch (error) {
      if (note) note.textContent = error.message || "We could not save that request right now.";
      if (button) button.textContent = original;
    } finally {
      if (button) button.disabled = false;
    }
  });
});

const memberHeaders = (member) =>
  member ? { "x-care-circle-member": member.id, "x-care-circle-token": member.token } : {};

const sevenDayPrompts = {
  dog: [
    "How does the first rise after rest look today? Notice the pause, the first few steps, and whether movement gets easier.",
    "How does your pet settle this evening? Note pacing, room changes, panting, or what helps them rest.",
    "How did appetite and water compare with the usual routine today?", 
    "What route felt different today: stairs, a jump, a walk, or getting to a favorite room?",
    "What still brought clear joy today: greeting, food, a walk, people, or a familiar place?",
    "What did you notice that would be hard to remember exactly at a vet visit?",
    "Looking across the week, what pattern feels worth bringing to the next veterinary conversation?",
  ],
  cat: [
    "How did your cat get up, step down, or choose a jump today? Notice a lower route or longer pause without asking them to repeat it.",
    "How did your cat settle today? Note hiding, a new sleep place, restlessness, or what made a familiar place easier to use.",
    "How did appetite and water compare with the usual routine today?", 
    "How did the litter-box routine look today: frequency, hesitation, time in the box, vocalizing, or a change in output?",
    "What still brought clear joy today: a window, food, a person, grooming, play, or a familiar place?",
    "What did you notice that would be hard to remember exactly at a vet visit?",
    "Looking across the week, what pattern feels worth bringing to the next veterinary conversation?",
  ],
};

const trackerPromptFor = (member, dayNumber) => {
  const prompts = sevenDayPrompts[member?.species] || sevenDayPrompts.dog;
  return prompts[Math.max(1, Math.min(7, Number(dayNumber) || 1)) - 1];
};

const applyTrackerPrompt = (form, member) => {
  const day = form.querySelector("[data-tracker-day]");
  const promptNode = form.querySelector("[data-tracker-prompt]");
  if (!promptNode) return;
  const prompt = trackerPromptFor(member, day?.value || 1);
  promptNode.textContent = prompt;
  form.dataset.trackerPrompt = prompt;
};

const stateLabels = {
  same: "About the same",
  different: "Different lately",
  "not-sure": "Not sure",
};

const loadCareRecord = async (member) => {
  const response = await fetch(`/team-review/api/checkin?dogId=${encodeURIComponent(member.dogId)}`, {
    headers: { accept: "application/json", ...memberHeaders(member) },
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || "We could not load your care record right now.");
  return result;
};

const renderVetSummary = (panel, member, entries) => {
  panel.replaceChildren();
  const title = document.createElement("h3");
  title.textContent = `${member.dogName}'s care record`;
  const intro = document.createElement("p");
  intro.textContent = entries.length
    ? `Here are the ${entries.length} most recent observations saved in this profile. Keep the examples that best match the current concern.`
    : "Save at least one day before you prepare a summary for a veterinary visit.";
  panel.append(title, intro);

  if (!entries.length) return;

  const list = document.createElement("ol");
  list.className = "vet-summary-list";
  entries.slice().reverse().forEach((entry) => {
    const item = document.createElement("li");
    const heading = document.createElement("strong");
    heading.textContent = `Day ${entry.dayNumber || "saved observation"}`;
    const prompt = document.createElement("span");
    prompt.textContent = entry.prompt || "Observation";
    const states = document.createElement("span");
    states.textContent = `Sleep: ${stateLabels[entry.sleep] || entry.sleep}; movement: ${stateLabels[entry.mobility] || entry.mobility}; appetite: ${stateLabels[entry.appetite] || entry.appetite}.`;
    item.append(heading, prompt, states);
    if (entry.note) {
      const note = document.createElement("p");
      note.textContent = entry.note;
      item.append(note);
    }
    list.append(item);
  });
  panel.append(list);
};

const accountFocusLabels = {
  mobility: "Mobility and movement",
  sleep: "Sleep and settling",
  appetite: "Appetite and routine",
  comfort: "Comfort at home",
  "vet-visit": "Vet visit preparation",
  "not-sure": "A care baseline",
};

let accountPetProfiles = [];
let accountOwner = {};
let accountProfilePhotoUrl = "";

const accountValue = (selector, value) => {
  document.querySelectorAll(selector).forEach((node) => { node.textContent = value; });
};

const loadPrivateProfilePhoto = async (pet, member) => {
  const images = [...document.querySelectorAll("[data-profile-photo]")];
  const fallbacks = [...document.querySelectorAll("[data-profile-photo-fallback]")];
  const defaultPhoto = pet?.species === "cat"
    ? "/team-review/legacy-media/real/photo-55.jpg"
    : "/team-review/legacy-media/real/photo-01.jpg";
  images.forEach((image) => {
    image.src = defaultPhoto;
    image.alt = `${pet?.dogName || "Pet"} profile placeholder`;
    image.hidden = false;
  });
  fallbacks.forEach((node) => { node.hidden = true; });
  if (!pet?.profileMediaId || !member) return;
  try {
    const response = await fetch(`/team-review/api/media/${encodeURIComponent(pet.profileMediaId)}`, { headers: memberHeaders(member) });
    if (!response.ok) return;
    if (accountProfilePhotoUrl) URL.revokeObjectURL(accountProfilePhotoUrl);
    accountProfilePhotoUrl = URL.createObjectURL(await response.blob());
    images.forEach((image) => {
      image.src = accountProfilePhotoUrl;
      image.alt = `${pet.dogName}'s profile photo`;
      image.hidden = false;
    });
    fallbacks.forEach((node) => { node.hidden = true; });
  } catch {
    // The neutral species photo remains visible when a private image cannot be loaded.
  }
};

const fillPetEditForm = (pet) => {
  document.querySelectorAll("[data-edit-pet-form]").forEach((form) => {
    ["dogName", "species", "breed", "ageYears", "weightLbs", "focus", "healthConditions", "medications", "routineNotes"].forEach((name) => {
      const field = form.elements.namedItem(name);
      if (field) field.value = pet?.[name] ?? "";
    });
  });
};

const renderPetProfile = (pet, member = readMember()) => {
  if (!pet) return;
  accountValue("[data-profile-dog-name]", pet.dogName || "Your pet");
  accountValue("[data-account-pet-meta]", [pet.species === "cat" ? "Cat" : "Dog", pet.breed, pet.ageYears ? `${pet.ageYears} years old` : ""].filter(Boolean).join(" · "));
  accountValue("[data-account-age]", pet.ageYears ? `${pet.ageYears} years` : "Not added");
  accountValue("[data-account-breed]", pet.breed || "Not added");
  accountValue("[data-account-weight]", pet.weightLbs ? `${pet.weightLbs} lb` : "Not added");
  accountValue("[data-account-focus]", accountFocusLabels[pet.focus] || "A care baseline");
  accountValue("[data-account-conditions]", pet.healthConditions || "None added");
  accountValue("[data-account-medications]", pet.medications || "None added");
  accountValue("[data-account-routine]", pet.routineNotes || "None added");
  fillPetEditForm(pet);
  loadPrivateProfilePhoto(pet, member);
};

const renderAccountSnapshot = (member, result) => {
  const pet = result?.pet || {};
  const entries = Array.isArray(result?.entries) ? result.entries : [];
  document.querySelectorAll("[data-account-pet]").forEach((node) => {
    const details = [pet.name || member.dogName, pet.species || member.species].filter(Boolean);
    node.textContent = details.join(" · ");
  });
  document.querySelectorAll("[data-account-focus]").forEach((node) => {
    node.textContent = accountFocusLabels[pet.focus || member.focus] || "Care baseline";
  });
  document.querySelectorAll("[data-account-observation-count]").forEach((node) => {
    node.textContent = String(entries.length);
  });
};

const loadAccountSnapshot = async (member) => {
  if (!member || !document.querySelector("[data-account-overview]")) return;
  try {
    const result = await loadCareRecord(member);
    renderAccountSnapshot(member, result);
  } catch {
    renderAccountSnapshot(member, null);
  }
};

const activatePet = (owner, pet) => saveMember({
  ...readMember(),
  ...owner,
  ...pet,
  id: readMember()?.id,
  token: readMember()?.token,
});

const loadPetProfiles = async (member) => {
  const switches = [...document.querySelectorAll("[data-pet-switch]")];
  if (!member || !switches.length) return;
  if (localPreview) {
    const pets = readLocalPets().length ? readLocalPets() : [member];
    accountPetProfiles = pets;
    accountOwner = { firstName: member.firstName, email: member.email, location: member.location };
    const activePet = pets.find((pet) => pet.dogId === member.dogId) || pets[0];
    renderPetProfile(activePet, member);
    switches.forEach((select) => {
      select.replaceChildren(...pets.map((pet) => new Option(`${pet.dogName} · ${pet.species}`, pet.dogId)));
      select.value = activePet.dogId;
    });
    document.querySelectorAll("[data-add-pet-link]").forEach((link) => {
      link.href = "/my-pet/?panel=add-pet#add-pet";
      link.textContent = "Add another pet";
    });
    return;
  }
  try {
    const response = await fetch("/team-review/api/pets", { headers: { accept: "application/json", ...memberHeaders(member) } });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || "We could not load your pets.");
    const pets = Array.isArray(result.pets) ? result.pets : [];
    accountPetProfiles = pets;
    accountOwner = result.owner || {};
    const activePet = pets.find((pet) => pet.dogId === member.dogId) || pets[0];
    if (activePet) {
      activatePet({ firstName: result.owner?.firstName, email: result.owner?.email, location: result.owner?.location }, activePet);
      renderPetProfile(activePet, readMember());
    }
    document.querySelectorAll("[data-add-pet-link]").forEach((link) => {
      link.href = "/my-pet/?panel=add-pet#add-pet";
      link.textContent = "Add another pet";
    });
    document.querySelectorAll("[data-memory-member-gate]").forEach((gate) => { gate.hidden = true; });
    document.querySelectorAll("[data-memory-member-content]").forEach((content) => { content.hidden = false; });
    switches.forEach((select) => {
      select.replaceChildren();
      pets.forEach((pet) => {
        const option = document.createElement("option");
        option.value = pet.dogId;
        option.textContent = `${pet.dogName} · ${pet.species}`;
        select.append(option);
      });
      select.value = pets.some((pet) => pet.dogId === member.dogId) ? member.dogId : pets[0]?.dogId || "";
      select.addEventListener("change", () => {
        const pet = pets.find((item) => item.dogId === select.value);
        if (!pet) return;
        activatePet({ firstName: result.owner?.firstName, email: result.owner?.email, location: result.owner?.location }, pet);
        window.location.reload();
      }, { once: true });
    });
  } catch {
    switches.forEach((select) => {
      select.replaceChildren();
      const option = document.createElement("option");
      option.value = member.dogId;
      option.textContent = member.dogName;
      select.append(option);
    });
  }
};

const renderNotifications = (items, unreadCount = 0) => {
  document.querySelectorAll("[data-notification-count]").forEach((badge) => {
    badge.textContent = String(unreadCount);
    badge.hidden = unreadCount < 1;
  });
  document.querySelectorAll("[data-notification-list]").forEach((root) => {
    root.replaceChildren();
    if (!items.length) {
      const empty = document.createElement("p");
      empty.textContent = "You are all caught up.";
      root.append(empty);
      return;
    }
    items.forEach((item) => {
      const article = document.createElement("article");
      article.className = `notification-item${item.isRead ? "" : " is-unread"}`;
      const copy = document.createElement("div");
      const title = document.createElement("strong");
      title.textContent = item.title;
      const body = document.createElement("p");
      body.textContent = item.body || "";
      copy.append(title, body);
      const link = document.createElement("a");
      link.href = item.href || "/my-pet/";
      link.textContent = "Open";
      article.append(copy, link);
      root.append(article);
    });
  });
};

const loadNotifications = async (member = readMember()) => {
  if (!member) return;
  try {
    const response = await fetch("/team-review/api/notifications", { headers: { accept: "application/json", ...memberHeaders(member) } });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) return;
    renderNotifications(Array.isArray(result.notifications) ? result.notifications : [], Number(result.unreadCount || 0));
  } catch {
    // Notification state is non-blocking.
  }
};

document.querySelectorAll("[data-notifications-read]").forEach((button) => {
  button.addEventListener("click", async () => {
    const member = readMember();
    if (!member) return;
    button.disabled = true;
    try {
      await fetch("/team-review/api/notifications", {
        method: "PATCH",
        headers: { "content-type": "application/json", ...memberHeaders(member) },
        body: JSON.stringify({ all: true }),
      });
      await loadNotifications(member);
    } finally {
      button.disabled = false;
    }
  });
});

document.querySelectorAll("[data-edit-pet-form]").forEach((form) => {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const member = readMember();
    const note = form.querySelector("[data-edit-pet-note]");
    const button = form.querySelector("button[type='submit']");
    if (!member) return;
    const values = Object.fromEntries(new FormData(form).entries());
    if (button) { button.disabled = true; button.textContent = "Saving profile..."; }
    if (note) note.textContent = "";
    try {
      const response = await fetch("/team-review/api/pets", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...values, dogId: member.dogId, memberId: member.id, memberToken: member.token }) });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "We could not update that profile.");
      activatePet(accountOwner, result.pet);
      renderPetProfile(result.pet, readMember());
      if (note) note.textContent = result.message;
      setTimeout(() => form.closest("[data-account-panel-content]")?.setAttribute("hidden", ""), 650);
    } catch (error) {
      if (note) note.textContent = error.message || "We could not update that profile right now.";
    } finally {
      if (button) { button.disabled = false; button.textContent = "Save profile"; }
    }
  });
});

document.querySelectorAll("[data-profile-photo-input]").forEach((input) => {
  input.addEventListener("change", async () => {
    const member = readMember();
    const file = input.files?.[0];
    const note = input.closest(".pet-profile-photo")?.querySelector("[data-profile-photo-note]");
    if (!member || !file) return;
    if (!file.type.startsWith("image/")) { if (note) note.textContent = "Choose a JPG, PNG, or WebP image."; return; }
    if (file.size > 20 * 1024 * 1024) { if (note) note.textContent = "Choose an image under 20 MB."; return; }
    if (note) note.textContent = "Uploading photo...";
    const formData = new FormData();
    formData.append("memberId", member.id);
    formData.append("memberToken", member.token);
    formData.append("dogId", member.dogId);
    formData.append("purpose", "profile");
    formData.append("file", file);
    try {
      const response = await fetch("/team-review/api/media", { method: "POST", body: formData });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "We could not upload that photo.");
      const pet = accountPetProfiles.find((item) => item.dogId === member.dogId) || { ...member };
      pet.profileMediaId = result.media?.id || pet.profileMediaId;
      activatePet(accountOwner, pet);
      await loadPrivateProfilePhoto(pet, readMember());
      if (note) note.textContent = "Profile photo saved.";
    } catch (error) {
      if (note) note.textContent = error.message || "We could not upload that photo right now.";
    } finally {
      input.value = "";
    }
  });
});

const applyMemberState = () => {
  const member = readMember();
  document.querySelectorAll("[data-profile-form]").forEach((form) => {
    const complete = form.closest(".profile-section")?.querySelector("[data-profile-complete]");
    const enrollLayout = form.closest(".profile-enroll-layout");
    if (!member) return;
    if (enrollLayout) enrollLayout.hidden = true;
    if (complete) complete.hidden = false;
    complete?.querySelectorAll("[data-profile-dog-name]").forEach((node) => {
      node.textContent = member.dogName;
    });
    complete?.querySelectorAll("[data-checkin-form]").forEach((checkinForm) => applyTrackerPrompt(checkinForm, member));
  });
  document.querySelectorAll("[data-community-gate]").forEach((gate) => {
    const enroll = gate.querySelector("[data-community-enroll]");
    const compose = gate.querySelector("[data-community-form]");
    if (enroll) enroll.hidden = Boolean(member);
    if (compose) compose.hidden = !member;
  });
  document.querySelectorAll("[data-circle-gate]").forEach((gate) => {
    const enroll = gate.querySelector("[data-circle-enroll]");
    const form = gate.querySelector("[data-circle-form]");
    const success = gate.querySelector("[data-circle-host-success]");
    if (enroll) enroll.hidden = Boolean(member);
    if (form) form.hidden = !member;
    if (success && !member) success.hidden = true;
  });
  document.querySelectorAll("[data-community-research-gate]").forEach((gate) => {
    const enroll = gate.querySelector("[data-community-research-enroll]");
    const form = gate.querySelector("[data-community-research-form]");
    if (enroll) enroll.hidden = Boolean(member);
    if (form) form.hidden = !member;
  });
  document.querySelectorAll("[data-care-chat-gate]").forEach((gate) => {
    const enroll = gate.querySelector("[data-care-chat-enroll]");
    const form = gate.querySelector("[data-care-chat-form]");
    if (enroll) enroll.hidden = Boolean(member);
    if (form) form.hidden = !member;
  });
  document.querySelectorAll("[data-meetup-gate]").forEach((gate) => {
    const enroll = gate.querySelector("[data-meetup-enroll]");
    const readiness = gate.querySelector("[data-meetup-readiness]");
    const content = gate.querySelector("[data-meetup-content]");
    if (enroll) enroll.hidden = Boolean(member);
    if (readiness) readiness.hidden = !member;
    if (content) content.hidden = true;
  });
  if (member) {
    document.querySelectorAll("[data-memory-member-gate]").forEach((gate) => { gate.hidden = true; });
    document.querySelectorAll("[data-memory-member-content]").forEach((content) => { content.hidden = false; });
    loadAccountSnapshot(member);
    loadPetProfiles(member);
    loadCommunityResearch();
    loadCareChatHistory(member);
    loadMemories(member);
    loadNotifications(member);
    loadMeetups(member);
  }
  return member;
};

const meetupLabel = (value) => String(value || "").replaceAll("-", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

const meetupRatingField = (label, name) => {
  const field = document.createElement("label");
  const caption = document.createElement("span");
  const select = document.createElement("select");
  caption.textContent = label;
  select.name = name;
  [5, 4, 3, 2, 1].forEach((value) => {
    const option = document.createElement("option");
    option.value = String(value);
    option.textContent = `${value} / 5`;
    select.append(option);
  });
  field.append(caption, select);
  return field;
};

const renderMeetupMatches = (matches = []) => {
  const root = document.querySelector("[data-meetup-results]");
  if (!root) return;
  root.replaceChildren();
  if (!matches.length) {
    const empty = document.createElement("div");
    empty.className = "meetup-empty";
    empty.innerHTML = "<h3>No introduction yet.</h3><p>Your contact details are never shown. Our team reviews matching profiles each Wednesday and emails one thoughtful introduction when there is a fit.</p>";
    root.append(empty);
    return;
  }
  matches.forEach((match) => {
    const card = document.createElement("article");
    card.className = "meetup-match-card";
    const reasons = Array.isArray(match.reasons) ? match.reasons : [];
    const score = document.createElement("div");
    score.className = "meetup-match-score";
    const scoreValue = document.createElement("strong");
    const scoreLabel = document.createElement("span");
    scoreValue.textContent = `${Math.max(0, Math.min(100, Number(match.score || 0)))}%`;
    scoreLabel.textContent = "fit";
    score.append(scoreValue, scoreLabel);

    const summary = document.createElement("div");
    const badge = document.createElement("span");
    const title = document.createElement("h3");
    const meta = document.createElement("p");
    const reasonList = document.createElement("ul");
    badge.className = "source-badge";
    badge.textContent = "Suggested match";
    title.textContent = `${match.petName || "A nearby pet"} & ${match.ownerFirstName || "their person"}`;
    meta.textContent = [match.breed, match.species && meetupLabel(match.species), match.city && `${match.city}, ${match.region || ""}`.replace(/,\s*$/, "")].filter(Boolean).join(" · ");
    reasons.forEach((reason) => {
      const item = document.createElement("li");
      item.textContent = String(reason || "");
      reasonList.append(item);
    });
    summary.append(badge, title, meta, reasonList);
    card.append(score, summary);
    if (!match.feedbackSubmitted) {
      const details = document.createElement("details");
      details.className = "meetup-feedback";
      const detailsSummary = document.createElement("summary");
      const form = document.createElement("form");
      const ratingGrid = document.createElement("div");
      const notesField = document.createElement("label");
      const notesCaption = document.createElement("span");
      const notes = document.createElement("textarea");
      const againField = document.createElement("label");
      const again = document.createElement("input");
      const againCaption = document.createElement("span");
      const button = document.createElement("button");
      const note = document.createElement("p");
      detailsSummary.textContent = "Share private feedback after meeting";
      form.dataset.meetupFeedback = "";
      form.dataset.matchId = String(match.id || "");
      ratingGrid.className = "meetup-rating-grid";
      ratingGrid.append(
        meetupRatingField("Pet comfort", "comfortRating"),
        meetupRatingField("Energy fit", "energyFitRating"),
        meetupRatingField("Owner fit", "ownerFitRating"),
        meetupRatingField("Safety", "safetyRating")
      );
      notesCaption.textContent = "One useful detail (optional)";
      notes.name = "notes";
      notes.maxLength = 600;
      notesField.append(notesCaption, notes);
      againField.className = "meetup-mixed";
      again.type = "checkbox";
      again.name = "meetAgain";
      againCaption.textContent = "We would meet again.";
      againField.append(again, againCaption);
      button.className = "button secondary";
      button.type = "submit";
      button.textContent = "Save private feedback";
      note.className = "form-note";
      note.dataset.meetupFeedbackNote = "";
      form.append(ratingGrid, notesField, againField, button, note);
      details.append(detailsSummary, form);
      card.append(details);
    }
    root.append(card);
  });
};

const applyMeetupProfile = (form, profile) => {
  if (!form || !profile) return;
  Object.entries(profile).forEach(([key, value]) => {
    const field = form.elements.namedItem(key);
    if (!field) return;
    if (field.type === "checkbox") field.checked = Boolean(value);
    else field.value = value ?? "";
  });
};

const loadMeetups = async (member = readMember()) => {
  const form = document.querySelector("[data-meetup-profile-form]");
  if (!member || !form) return;
  const gate = form.closest("[data-meetup-gate]");
  const readiness = gate?.querySelector("[data-meetup-readiness]");
  const content = gate?.querySelector("[data-meetup-content]");
  const note = form.querySelector("[data-meetup-note]");
  try {
    const response = await fetch(`/team-review/api/meetups?petId=${encodeURIComponent(member.dogId)}`, { headers: { accept: "application/json", ...memberHeaders(member) } });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || "We could not load meetup matching.");
    if (readiness) {
      readiness.hidden = Boolean(result.unlocked);
      const count = readiness.querySelector("[data-meetup-context-count]");
      const remaining = readiness.querySelector("[data-meetup-context-remaining]");
      if (count) count.textContent = String(Math.min(result.contextCount || 0, result.requiredContextCount || 3));
      if (remaining) remaining.textContent = String(Math.max(0, (result.requiredContextCount || 3) - (result.contextCount || 0)));
    }
    if (content) content.hidden = !result.unlocked;
    applyMeetupProfile(form, result.profile);
    renderMeetupMatches(result.matches || []);
  } catch (error) {
    if (note) note.textContent = error.message || "Meetup matching is unavailable right now.";
  }
};

document.querySelectorAll("[data-meetup-profile-form]").forEach((form) => {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const member = readMember();
    const note = form.querySelector("[data-meetup-note]");
    const button = form.querySelector("button[type='submit']");
    if (!member) return;
    const values = Object.fromEntries(new FormData(form).entries());
    if (button) { button.disabled = true; button.textContent = "Saving..."; }
    if (note) note.textContent = "";
    try {
      const result = await requestJson("/team-review/api/meetups", { ...values, mixedSpeciesOk: Boolean(form.elements.mixedSpeciesOk?.checked), action: "profile", petId: member.dogId, memberId: member.id, memberToken: member.token });
      if (note) note.textContent = `${result.message || "Your matching profile is saved."} Our team reviews profiles each Wednesday and emails one thoughtful introduction when there is a fit.`;
      applyMeetupProfile(form, result.profile);
    } catch (error) {
      if (note) note.textContent = error.message || "We could not save matching preferences.";
    } finally {
      if (button) { button.disabled = false; button.textContent = "Save matching profile"; }
    }
  });
});

document.querySelectorAll("[data-meetup-find]").forEach((button) => {
  button.hidden = true;
  button.disabled = true;
});

document.addEventListener("submit", async (event) => {
  const form = event.target.closest("[data-meetup-feedback]");
  if (!form) return;
  event.preventDefault();
  const member = readMember();
  const note = form.querySelector("[data-meetup-feedback-note]");
  const button = form.querySelector("button[type='submit']");
  if (!member) return;
  const values = Object.fromEntries(new FormData(form).entries());
  if (button) { button.disabled = true; button.textContent = "Saving..."; }
  try {
    const result = await requestJson("/team-review/api/meetups", { ...values, meetAgain: Boolean(form.elements.meetAgain?.checked), action: "feedback", matchId: form.dataset.matchId, petId: member.dogId, memberId: member.id, memberToken: member.token });
    if (note) note.textContent = result.message;
    await loadMeetups(member);
  } catch (error) {
    if (note) note.textContent = error.message || "We could not save that feedback.";
  } finally {
    if (button) { button.disabled = false; button.textContent = "Save private feedback"; }
  }
});

document.querySelectorAll("[data-profile-form]").forEach((form) => {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const note = form.querySelector("[data-profile-note]");
    const button = form.querySelector("button[type='submit']");
    const values = Object.fromEntries(new FormData(form).entries());
    values.location = [values.city, values.region].filter(Boolean).join(", ");
    const payload = { ...values };

    if (button) {
      button.disabled = true;
      button.textContent = "Creating care account...";
    }
    if (note) note.textContent = "";
    try {
      const result = await requestJson("/team-review/api/enroll", payload);
      saveMember({ ...result.member, focus: values.focus, species: values.species });
      if (note) note.textContent = result.message;
      applyMemberState();
      loadCircles();
      const pendingLesson = localStorage.getItem(pendingLessonKey);
      if (pendingLesson) {
        localStorage.removeItem(pendingLessonKey);
        window.location.href = `/community/?topic=${encodeURIComponent(pendingLesson)}#ask`;
        return;
      }
      requestAnimationFrame(() => {
        form.closest(".profile-section")?.querySelector("[data-profile-complete]")?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    } catch (error) {
      if (note) note.textContent = error.message || "We could not save that profile right now.";
      if (button) button.textContent = "Create my care account";
    } finally {
      if (button) button.disabled = false;
    }
  });
});

document.querySelectorAll("[data-add-pet-form]").forEach((form) => {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const member = readMember();
    const note = form.querySelector("[data-add-pet-note]");
    const button = form.querySelector("button[type='submit']");
    if (!member) return;
    const values = Object.fromEntries(new FormData(form).entries());
    if (button) { button.disabled = true; button.textContent = "Adding pet..."; }
    if (note) note.textContent = "";
    try {
      const result = await requestJson("/team-review/api/pets", { ...values, memberId: member.id, memberToken: member.token });
      activatePet({}, result.pet);
      if (note) note.textContent = result.message;
      window.location.reload();
    } catch (error) {
      if (note) note.textContent = error.message || "We could not add that pet right now.";
    } finally {
      if (button) { button.disabled = false; button.textContent = "Add this pet"; }
    }
  });
});

document.querySelectorAll("[data-checkin-form]").forEach((form) => {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const member = readMember();
    const note = form.querySelector("[data-checkin-note]");
    const button = form.querySelector("button[type='submit']");
    if (!member) {
      if (note) note.textContent = "Create your pet's profile before saving a check-in.";
      return;
    }
    const values = Object.fromEntries(new FormData(form).entries());
    if (button) {
      button.disabled = true;
      button.textContent = "Saving check-in...";
    }
    if (note) note.textContent = "";
    try {
      const result = await requestJson("/team-review/api/checkin", {
        ...values,
        prompt: form.dataset.trackerPrompt || trackerPromptFor(member, values.dayNumber),
        memberId: member.id,
        memberToken: member.token,
        dogId: member.dogId,
      });
      if (note) note.textContent = result.message;
      const glanceRoot = form.querySelector("[data-day-glance-result]");
      if (glanceRoot && result.glance) {
        glanceRoot.hidden = false;
        glanceRoot.replaceChildren();
        const title = document.createElement("h3");
        title.textContent = result.glance.headline;
        const reflection = document.createElement("p");
        reflection.textContent = result.glance.reflection;
        const share = document.createElement("button");
        share.type = "button";
        share.className = "button secondary";
        share.textContent = "Share this glance";
        share.addEventListener("click", async () => {
          const text = result.glance.shareText;
          if (navigator.share) await navigator.share({ title: result.glance.headline, text }).catch(() => {});
          else await navigator.clipboard?.writeText(text);
          share.textContent = navigator.share ? "Shared" : "Copied";
        });
        glanceRoot.append(title, reflection, share);
      }
      form.reset();
      applyTrackerPrompt(form, member);
      loadAccountSnapshot(member);
      loadNotifications(member);
    } catch (error) {
      if (note) note.textContent = error.message || "We could not save that check-in right now.";
    } finally {
      if (button) {
        button.disabled = false;
        button.textContent = "Save today's glance";
      }
    }
  });
});

document.querySelectorAll("[data-tracker-day]").forEach((select) => {
  select.addEventListener("change", () => {
    const form = select.closest("[data-checkin-form]");
    if (form) applyTrackerPrompt(form, readMember());
  });
});

document.addEventListener("click", async (event) => {
  const buildButton = event.target.closest("[data-build-vet-summary]");
  if (buildButton) {
    const member = readMember();
    const tool = buildButton.closest("[data-vet-summary-tool]");
    const panel = tool?.querySelector("[data-vet-summary-panel]");
    if (!member || !panel) return;
    buildButton.disabled = true;
    buildButton.textContent = "Loading record...";
    try {
      const result = await loadCareRecord(member);
      panel.hidden = false;
      renderVetSummary(panel, member, Array.isArray(result.entries) ? result.entries : []);
    } catch (error) {
      panel.hidden = false;
      panel.replaceChildren();
      const message = document.createElement("p");
      message.textContent = error.message || "We could not load the care record right now.";
      panel.append(message);
    } finally {
      buildButton.disabled = false;
      buildButton.textContent = "See my saved observations";
    }
  }
});

document.querySelectorAll("[data-vet-email-form]").forEach((form) => {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const member = readMember();
    const note = form.querySelector("[data-vet-email-note]");
    const button = form.querySelector("button[type='submit']");
    if (!member) return;
    button.disabled = true;
    button.textContent = "Sending securely...";
    if (note) note.textContent = "Preparing the summary and original record attachments...";
    try {
      const result = await requestJson("/team-review/api/vet-summary", {
        memberId: member.id,
        memberToken: member.token,
        dogId: member.dogId,
        email: form.elements.email.value,
      });
      if (note) note.textContent = result.message;
      form.reset();
    } catch (error) {
      if (note) note.textContent = error.message || "The veterinary email was not sent. Check the address and try again.";
    } finally {
      button.disabled = false;
      button.textContent = "Email health summary";
    }
  });
});

const createCommunityPost = (post) => {
  const article = document.createElement("article");
  article.className = "community-post";
  const topic = document.createElement("span");
  topic.className = "community-topic";
  topic.textContent = post.topic;
  const heading = document.createElement("h3");
  heading.textContent = post.groupTitle || `${post.dogName}'s family`;
  const body = document.createElement("p");
  body.textContent = post.body;
  const meta = document.createElement("span");
  meta.className = "community-post-meta";
  const created = new Date(post.createdAt);
  const dateText = Number.isNaN(created.getTime()) ? "Shared by an owner" : `Shared ${created.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
  meta.textContent = post.groupTitle ? `${post.dogName}'s family · ${dateText}` : dateText;
  article.append(topic, heading, body, meta);

  const media = Array.isArray(post.media) ? post.media : [];
  if (media.length) {
    const mediaList = document.createElement("div");
    mediaList.className = "community-post-media";
    media.forEach((asset) => {
      if (asset.mediaKind === "image") {
        const image = document.createElement("img");
        image.src = asset.url;
        image.alt = "Care Circle member update";
        image.loading = "lazy";
        mediaList.append(image);
      } else if (asset.mediaKind === "video") {
        const video = document.createElement("video");
        video.src = asset.url;
        video.controls = true;
        video.preload = "metadata";
        mediaList.append(video);
      } else if (asset.mediaKind === "audio") {
        const audio = document.createElement("audio");
        audio.src = asset.url;
        audio.controls = true;
        audio.preload = "metadata";
        mediaList.append(audio);
      }
    });
    article.append(mediaList);
  }

  const replies = Array.isArray(post.replies) ? post.replies : [];
  const actions = document.createElement("div");
  actions.className = "community-post-actions";
  if (post.conversationId) {
    const lesson = document.createElement("button");
    lesson.type = "button";
    lesson.dataset.publicLesson = post.id;
    lesson.className = "community-read-lesson";
    lesson.textContent = "Read lesson";
    actions.append(lesson);
  }
  const helpful = document.createElement("button");
  helpful.type = "button";
  helpful.dataset.communityAction = "helpful";
  helpful.dataset.postId = post.id;
  helpful.className = post.viewerHelpful ? "is-active" : "";
  helpful.textContent = `Like ${Number(post.helpfulCount || 0)}`;
  const comments = document.createElement("button");
  comments.type = "button";
  comments.textContent = `Comments ${replies.length}`;
  comments.setAttribute("aria-label", `${replies.length} ${replies.length === 1 ? "comment" : "comments"}`);
  comments.addEventListener("click", () => {
    const replyInput = article.querySelector(".community-reply-form textarea");
    const replyList = article.querySelector(".community-replies");
    (replyInput || replyList)?.scrollIntoView({ behavior: "smooth", block: "center" });
    replyInput?.focus();
  });
  const save = document.createElement("button");
  save.type = "button";
  save.dataset.communityAction = "save";
  save.dataset.postId = post.id;
  save.className = post.viewerSaved ? "is-active" : "";
  save.textContent = post.viewerSaved ? "Saved" : `Save ${Number(post.saveCount || 0)}`;
  const share = document.createElement("button");
  share.type = "button";
  share.dataset.communityShare = post.id;
  share.dataset.shareTitle = heading.textContent;
  share.textContent = "Share";
  actions.append(helpful, comments, save, share);
  article.append(actions);

  if (replies.length) {
    const replyList = document.createElement("div");
    replyList.className = "community-replies";
    const replyHeading = document.createElement("h4");
    replyHeading.textContent = replies.length === 1 ? "1 owner reply" : `${replies.length} owner replies`;
    replyList.append(replyHeading);
    replies.forEach((reply) => {
      const replyCard = document.createElement("div");
      replyCard.className = "community-reply";
      const replyName = document.createElement("strong");
      replyName.textContent = `${reply.dogName}'s family`;
      const replyBody = document.createElement("p");
      replyBody.textContent = reply.body;
      replyCard.append(replyName, replyBody);
      replyList.append(replyCard);
    });
    article.append(replyList);
  }

  if (readMember()) {
    const replyForm = document.createElement("form");
    replyForm.className = "community-reply-form";
    replyForm.dataset.communityReply = "";
    replyForm.dataset.postId = post.id;
    const replyLabel = document.createElement("label");
    const replyText = document.createElement("span");
    replyText.textContent = "Add a thoughtful reply";
    const replyInput = document.createElement("textarea");
    replyInput.name = "body";
    replyInput.required = true;
    replyInput.maxLength = 800;
    replyInput.placeholder = "Share what helped or the question you would carry forward.";
    replyLabel.append(replyText, replyInput);
    const replyButton = document.createElement("button");
    replyButton.className = "button secondary";
    replyButton.type = "submit";
    replyButton.textContent = "Reply";
    const replyNote = document.createElement("p");
    replyNote.className = "form-note";
    replyNote.dataset.communityReplyNote = "";
    replyForm.append(replyLabel, replyButton, replyNote);
    article.append(replyForm);
  }
  return article;
};

const communityStarters = [
  {
    topic: "Movement",
    title: "The first steps after a nap",
    body: "What one family records before a mobility visit.",
    prompt: "My older pet is slower after resting. Help me understand exactly what to watch, record, and discuss with my veterinarian.",
    image: "/team-review/legacy-media/real/photo-03.jpg",
    href: "/community/lessons/slower-after-rest/",
    likeCount: 0,
    commentCount: 0,
  },
  {
    topic: "Night routine",
    title: "When the house stops sleeping",
    body: "A simple timeline for pacing, wake-ups, and settling.",
    prompt: "My older pet is waking or pacing at night. Help me build a useful timeline and understand which changes need veterinary attention.",
    image: "/team-review/legacy-media/real/photo-21.jpg",
    href: "/community/lessons/restless-at-night/",
    likeCount: 0,
    commentCount: 0,
  },
  {
    topic: "Eating",
    title: "When dinner looks different",
    body: "Separate one missed meal from a pattern worth calling about.",
    prompt: "My older pet is eating less. Help me compare the pattern with drinking, weight, dental comfort, nausea, medicine, and energy.",
    image: "/team-review/legacy-media/real/photo-08.jpg",
    href: "/community/lessons/changes-in-appetite/",
    likeCount: 0,
    commentCount: 0,
  },
  {
    topic: "Senior cats",
    title: "The jump they stopped making",
    body: "What changed height, grooming, and litter habits can reveal.",
    prompt: "My older cat has stopped jumping to a favorite place. Help me understand what else to watch and what to ask my veterinarian.",
    image: "/team-review/legacy-media/real/photo-55.jpg",
    href: "/community/lessons/senior-cat-joint-changes/",
    likeCount: 0,
    commentCount: 0,
  },
  {
    topic: "Quality of life",
    title: "Preparing before a crisis",
    body: "Comfort, function, joy, and the questions families can prepare.",
    prompt: "I want to prepare for end-of-life decisions before a crisis. Help me understand comfort, function, joy, recovery, and questions for my veterinary team.",
    image: "/team-review/legacy-media/real/photo-60.jpg",
    href: "/preparing-for-pet-loss/",
    likeCount: 0,
    commentCount: 0,
  },
];

const createCommunityStarter = (starter) => {
  const article = document.createElement("article");
  article.className = "community-post community-starter";
  if (starter.image) {
    const image = document.createElement("img");
    image.className = "community-starter-image";
    image.src = starter.image;
    image.alt = "";
    image.setAttribute("aria-hidden", "true");
    image.loading = "lazy";
    article.append(image);
  }
  const topic = document.createElement("span");
  topic.className = "community-topic";
  topic.textContent = `Suggested · ${starter.topic}`;
  const heading = document.createElement("h3");
  heading.textContent = starter.title;
  const body = document.createElement("p");
  body.textContent = starter.body;
  const engagement = document.createElement("span");
  engagement.className = "community-post-meta";
  engagement.textContent = `Like ${Number(starter.likeCount || 0)} · Comments ${Number(starter.commentCount || 0)}`;
  const link = document.createElement("a");
  link.className = "text-link";
  link.href = starter.href;
  link.textContent = "Open lesson";
  article.append(topic, heading, body, engagement, link);
  return article;
};

const renderCommunityStarters = (list, empty, count, reconnecting = false) => {
  list.replaceChildren(...communityStarters.map(createCommunityStarter));
  if (empty) empty.hidden = true;
  if (count) count.textContent = reconnecting ? "Suggested topics" : "Five starting points";
};

const focusLabels = {
  mobility: "mobility and movement",
  sleep: "sleep and settling",
  appetite: "appetite and daily routine",
  comfort: "comfort at home",
  recovery: "recovery and healing",
  "quality-of-life": "good days and quality of life",
  "daily-routine": "daily routines",
  "vet-visit": "veterinary conversations",
};

const circleSpeciesLabels = {
  dog: "Older dogs",
  cat: "Older cats",
  all: "Older dogs and cats",
};

const createCircleCard = (group, member) => {
  const article = document.createElement("article");
  article.className = "circle-group-card";
  const focus = document.createElement("span");
  focus.className = "community-topic";
  focus.textContent = `${circleSpeciesLabels[group.species] || circleSpeciesLabels.all} · ${focusLabels[group.focus] || group.focus}`;
  const title = document.createElement("h3");
  title.textContent = group.title;
  const description = document.createElement("p");
  description.textContent = group.description;
  const meta = document.createElement("p");
  meta.className = "circle-group-meta";
  const count = Number(group.memberCount || 0);
  meta.textContent = `Hosted by ${group.hostDogName}'s family · ${count} ${count === 1 ? "member" : "members"} · ${group.cadence.replace("-", " ")}`;
  article.append(focus, title, description, meta);

  if (!member) {
    const enroll = document.createElement("a");
    enroll.className = "button secondary";
    enroll.href = "/my-pet/";
    enroll.textContent = "Enroll to Join";
    article.append(enroll);
  } else if (group.isHost) {
    const host = document.createElement("span");
    host.className = "circle-member-status";
    host.textContent = "You host this Circle";
    article.append(host);
  } else if (group.isJoined) {
    const joined = document.createElement("span");
    joined.className = "circle-member-status";
    joined.textContent = "You are in this Circle";
    article.append(joined);
  } else {
    const join = document.createElement("button");
    join.className = "button secondary";
    join.type = "button";
    join.dataset.circleJoin = group.id;
    join.textContent = "Join This Circle";
    article.append(join);
  }
  return article;
};

const refreshCommunityGroupChoices = (groups, member) => {
  document.querySelectorAll("[data-community-group]").forEach((select) => {
    const selected = select.value;
    select.replaceChildren();
    const communityOption = document.createElement("option");
    communityOption.value = "";
    communityOption.textContent = "Care Circle community";
    select.append(communityOption);
    groups.filter((group) => group.isJoined || group.isHost).forEach((group) => {
      const option = document.createElement("option");
      option.value = group.id;
      option.textContent = group.title;
      select.append(option);
    });
    select.value = [...select.options].some((option) => option.value === selected) ? selected : "";
    select.disabled = !member;
  });
};

const loadCircles = async () => {
  const list = document.querySelector("[data-circle-list]");
  const empty = document.querySelector("[data-circle-empty]");
  const count = document.querySelector("[data-circle-count]");
  const matchCopy = document.querySelector("[data-circle-match-copy]");
  const pendingList = document.querySelector("[data-circle-pending]");
  const hostSuccess = document.querySelector("[data-circle-host-success]");
  if (!list) return;
  const member = readMember();
  try {
    const response = await fetch("/team-review/api/circles", { headers: { accept: "application/json", ...memberHeaders(member) } });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || "We could not load Care Circles right now.");
    const groups = Array.isArray(result.groups) ? result.groups : [];
    const pendingGroups = Array.isArray(result.pendingGroups) ? result.pendingGroups : [];
    list.replaceChildren(...groups.map((group) => createCircleCard(group, member)));
    if (empty) empty.hidden = groups.length > 0;
    if (count) count.textContent = groups.length === 1 ? "1 open Circle" : `${groups.length} open Circles`;
    refreshCommunityGroupChoices(groups, member);
    if (pendingList) {
      pendingList.replaceChildren();
      pendingList.hidden = pendingGroups.length === 0;
      if (pendingGroups.length) {
        const heading = document.createElement("h3");
        heading.textContent = "Your Circles in setup";
        const intro = document.createElement("p");
        intro.textContent = "These invitations are saved and waiting for a quick clarity and safety review before other owners can join.";
        const cards = document.createElement("div");
        cards.className = "circle-pending-cards";
        pendingGroups.forEach((group) => {
          const card = document.createElement("article");
          card.className = "circle-pending-card";
          const title = document.createElement("strong");
          title.textContent = group.title;
          const detail = document.createElement("span");
          detail.textContent = `${circleSpeciesLabels[group.species] || circleSpeciesLabels.all} · ${focusLabels[group.focus] || group.focus}`;
          card.append(title, detail);
          cards.append(card);
        });
        pendingList.append(heading, intro, cards);
      }
    }
    if (hostSuccess && pendingGroups.length) {
      hostSuccess.hidden = false;
      hostSuccess.querySelector("[data-circle-host-title]").textContent = pendingGroups[0].title;
      hostSuccess.querySelector("[data-circle-host-message]").textContent = "Your invitation is saved. It will open once the purpose is clear and the space is ready to welcome other owners.";
    }
    if (matchCopy && member) {
      const matching = groups.filter((group) => group.focus === member.focus && (!group.species || group.species === "all" || group.species === member.species));
      matchCopy.textContent = matching.length
        ? `We found ${matching.length === 1 ? "a Circle" : `${matching.length} Circles`} around ${focusLabels[member.focus] || "the concern you chose"}.`
        : `When a Circle forms around ${focusLabels[member.focus] || "the concern you chose"}, it will appear here.`;
    }
  } catch (error) {
    if (empty) {
      empty.hidden = false;
      empty.querySelector("p").textContent = error.message || "We could not load Care Circles right now.";
    }
    if (count) count.textContent = "Unavailable";
  }
};

const loadCommunity = async () => {
  const list = document.querySelector("[data-community-list]");
  const empty = document.querySelector("[data-community-empty]");
  const count = document.querySelector("[data-community-count]");
  if (!list) return;
  try {
    const response = await fetch("/team-review/api/community", { headers: { accept: "application/json", ...memberHeaders(readMember()) } });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || "We could not load Care Circle right now.");
    const posts = Array.isArray(result.posts) ? result.posts : [];
    if (posts.length) {
      list.replaceChildren(...posts.map(createCommunityPost));
      if (empty) empty.hidden = true;
      if (count) count.textContent = posts.length === 1 ? "1 conversation" : `${posts.length} conversations`;
    } else {
      renderCommunityStarters(list, empty, count);
    }
  } catch (error) {
    renderCommunityStarters(list, empty, count, true);
  }
};

const renderResearchResult = (result, { historical = false } = {}) => {
  const root = document.querySelector("[data-community-research-result]");
  if (!root || !result?.brief) return;
  root.hidden = false;
  root.replaceChildren();
  const heading = document.createElement("h3");
  heading.textContent = historical ? `Saved brief: ${result.query}` : result.brief.title;
  const summary = document.createElement("p");
  summary.textContent = historical
    ? "This brief is saved in your account. Public-source access is still being configured."
    : result.sourceStatus || "Your research brief is saved in your account.";
  const list = document.createElement("ul");
  (result.brief.prompts || []).forEach((prompt) => {
    const item = document.createElement("li");
    item.textContent = prompt;
    list.append(item);
  });
  root.append(heading, summary, list);
  if (result.quota) {
    const quota = document.createElement("span");
    quota.className = "research-quota";
    quota.textContent = `${result.quota.remaining} of ${result.quota.limit} free searches left today`;
    root.append(quota);
  }
};

const loadCommunityResearch = async () => {
  const member = readMember();
  if (!member || !document.querySelector("[data-community-research-gate]")) return;
  try {
    const response = await fetch(`/team-review/api/community-research?dogId=${encodeURIComponent(member.dogId)}`, {
      headers: { accept: "application/json", ...memberHeaders(member) },
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !Array.isArray(result.history) || !result.history.length) return;
    renderResearchResult({ ...result.history[0], quota: result.quota }, { historical: true });
  } catch {
    // The account and Circle remain useful even when a research history cannot load.
  }
};

document.querySelectorAll("[data-community-research-form]").forEach((form) => {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const member = readMember();
    const note = form.querySelector("[data-community-research-note]");
    const button = form.querySelector("button[type='submit']");
    if (!member) {
      if (note) note.textContent = "Enroll a pet before saving a research brief.";
      return;
    }
    const values = Object.fromEntries(new FormData(form).entries());
    if (button) {
      button.disabled = true;
      button.textContent = "Saving brief...";
    }
    if (note) note.textContent = "";
    try {
      const result = await requestJson(
        "/team-review/api/community-research",
        { ...values, dogId: member.dogId },
        memberHeaders(member)
      );
      if (note) note.textContent = result.message;
      renderResearchResult(result);
      form.reset();
    } catch (error) {
      if (note) note.textContent = error.message || "We could not save that research request right now.";
    } finally {
      if (button) {
        button.disabled = false;
        button.textContent = "Build research brief";
      }
    }
  });
});

const showCommunityMediaChoices = (input) => {
  const list = input.closest("form")?.querySelector("[data-community-media-list]");
  if (!list) return;
  const files = [...(input.files || [])];
  list.replaceChildren();
  if (!files.length) return;
  const message = document.createElement("p");
  message.textContent = files.length > 3 ? "Choose up to 3 attachments." : files.map((file) => file.name).join(" · ");
  list.append(message);
};

const uploadCommunityMedia = async (files, member) => {
  const uploaded = [];
  for (const file of files) {
    const formData = new FormData();
    formData.append("memberId", member.id);
    formData.append("memberToken", member.token);
    formData.append("dogId", member.dogId);
    formData.append("file", file);
    const response = await fetch("/team-review/api/media", { method: "POST", body: formData });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || "We could not upload that attachment right now.");
    uploaded.push(result.media.id);
  }
  return uploaded;
};

document.querySelectorAll("[data-community-form]").forEach((form) => {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const member = readMember();
    const note = form.querySelector("[data-community-note]");
    const button = form.querySelector("button[type='submit']");
    if (!member) {
      if (note) note.textContent = "Enroll your pet before starting a conversation.";
      return;
    }
    const values = Object.fromEntries(new FormData(form).entries());
    const mediaInput = form.querySelector("[data-community-media]");
    const files = [...(mediaInput?.files || [])];
    if (files.length > 3) {
      if (note) note.textContent = "Choose up to 3 attachments for one update.";
      return;
    }
    if (button) {
      button.disabled = true;
      button.textContent = files.length ? "Uploading attachment..." : "Sending for review...";
    }
    if (note) note.textContent = "";
    try {
      const mediaIds = files.length ? await uploadCommunityMedia(files, member) : [];
      if (button && mediaIds.length) button.textContent = "Sending for review...";
      const result = await requestJson("/team-review/api/community", { ...values, mediaIds, kind: "post", memberId: member.id, memberToken: member.token, dogId: member.dogId });
      if (note) note.textContent = result.message;
      form.reset();
      form.querySelector("[data-community-media-list]")?.replaceChildren();
    } catch (error) {
      if (note) note.textContent = error.message || "We could not save that post right now.";
    } finally {
      if (button) {
        button.disabled = false;
        button.textContent = "Send for review";
      }
    }
  });
});

document.querySelectorAll("[data-community-media]").forEach((input) => {
  input.addEventListener("change", () => showCommunityMediaChoices(input));
});

document.querySelectorAll("[data-circle-form]").forEach((form) => {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const member = readMember();
    const note = form.querySelector("[data-circle-note]");
    const button = form.querySelector("button[type='submit']");
    if (!member) {
      if (note) note.textContent = "Enroll your pet before hosting a Care Circle.";
      return;
    }
    const values = Object.fromEntries(new FormData(form).entries());
    if (button) {
      button.disabled = true;
      button.textContent = "Saving your Circle...";
    }
    if (note) note.textContent = "";
    try {
      const result = await requestJson("/team-review/api/circles", { ...values, kind: "create", memberId: member.id, memberToken: member.token, dogId: member.dogId });
      if (note) note.textContent = result.message;
      const success = form.closest("[data-circle-gate]")?.querySelector("[data-circle-host-success]");
      if (success) {
        success.hidden = false;
        success.querySelector("[data-circle-host-title]").textContent = result.group?.title || values.title;
        success.querySelector("[data-circle-host-message]").textContent = result.message;
      }
      form.reset();
      await loadCircles();
    } catch (error) {
      if (note) note.textContent = error.message || "We could not create that Care Circle right now.";
    } finally {
      if (button) {
        button.disabled = false;
        button.textContent = "Submit Circle";
      }
    }
  });
});

document.querySelectorAll("[data-provider-inquiry-form]").forEach((form) => {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const note = form.querySelector("[data-provider-inquiry-note]");
    const button = form.querySelector("button[type='submit']");
    const values = Object.fromEntries(new FormData(form).entries());
    const payload = { ...values, consent: Boolean(form.querySelector("[name='consent']")?.checked) };
    if (button) {
      button.disabled = true;
      button.textContent = "Saving request...";
    }
    if (note) note.textContent = "";
    try {
      const result = await requestJson("/team-review/api/provider-inquiry", payload);
      if (note) note.textContent = result.message;
      form.reset();
      if (button) button.textContent = "Listing request received";
    } catch (error) {
      if (note) note.textContent = error.message || "We could not save that listing request right now.";
      if (button) button.textContent = "Send listing request";
    } finally {
      if (button) button.disabled = false;
    }
  });
});

document.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-circle-join]");
  if (!button) return;
  const member = readMember();
  if (!member) return;
  button.disabled = true;
  const original = button.textContent;
  button.textContent = "Joining...";
  try {
    await requestJson("/team-review/api/circles", { kind: "join", groupId: button.dataset.circleJoin, memberId: member.id, memberToken: member.token, dogId: member.dogId });
    await loadCircles();
  } catch {
    button.disabled = false;
    button.textContent = original;
  }
});

document.addEventListener("submit", async (event) => {
  const form = event.target;
  if (!(form instanceof HTMLFormElement) || !form.matches("[data-community-reply]")) return;
  event.preventDefault();
  const member = readMember();
  const note = form.querySelector("[data-community-reply-note]");
  const button = form.querySelector("button[type='submit']");
  if (!member) {
    if (note) note.textContent = "Enroll your pet before replying in Care Circle.";
    return;
  }
  const values = Object.fromEntries(new FormData(form).entries());
  if (button) {
    button.disabled = true;
    button.textContent = "Replying...";
  }
  if (note) note.textContent = "";
  try {
    const result = await requestJson("/team-review/api/community", { ...values, kind: "reply", postId: form.dataset.postId, memberId: member.id, memberToken: member.token, dogId: member.dogId });
    if (note) note.textContent = result.message;
    form.reset();
    await loadCommunity();
  } catch (error) {
    if (note) note.textContent = error.message || "We could not save that reply right now.";
  } finally {
    if (button) {
      button.disabled = false;
      button.textContent = "Reply";
    }
  }
});

document.addEventListener("click", (event) => {
  const close = event.target.closest("[data-account-close]");
  if (close) {
    close.closest("[data-account-panel-content]")?.setAttribute("hidden", "");
    document.querySelectorAll("[data-account-panel]").forEach((button) => button.classList.remove("is-active"));
    return;
  }
  const trigger = event.target.closest("[data-account-panel]");
  if (!trigger) return;
  const name = trigger.dataset.accountPanel;
  document.querySelectorAll("[data-account-panel]").forEach((button) => button.classList.toggle("is-active", button === trigger));
  document.querySelectorAll("[data-account-panel-content]").forEach((panel) => {
    panel.hidden = panel.dataset.accountPanelContent !== name;
  });
  document.querySelector(`[data-account-panel-content="${name}"]`)?.scrollIntoView({ behavior: "smooth", block: "nearest" });
});

const openRequestedAccountPanel = () => {
  const requestedAccountPanel = new URLSearchParams(window.location.search).get("panel") || window.location.hash.replace("#", "");
  if (["add-pet", "edit-profile", "memories", "observe", "record", "ask", "notifications"].includes(requestedAccountPanel)) {
    window.setTimeout(() => document.querySelector(`[data-account-panel="${requestedAccountPanel}"]`)?.click(), 100);
  }
};
openRequestedAccountPanel();
window.addEventListener("hashchange", openRequestedAccountPanel);

const renderCareChatHistory = (items) => {
  document.querySelectorAll("[data-chat-history]").forEach((root) => {
    root.replaceChildren();
    if (!items.length) {
      const empty = document.createElement("span");
      empty.textContent = "Your saved questions appear here.";
      root.append(empty);
      return;
    }
    items.forEach((item) => {
      const row = document.createElement("button");
      row.type = "button";
      row.className = "knowledge-book-entry";
      row.dataset.loadChat = item.id;
      const title = document.createElement("strong");
      title.textContent = item.title;
      const meta = document.createElement("span");
      meta.textContent = `${item.topic} lesson · ${item.privacy}`;
      row.append(title, meta);
      root.append(row);
    });
  });
};

const loadCareChatHistory = async (member) => {
  if (!member || !document.querySelector("[data-chat-history]")) return;
  try {
    const response = await fetch("/team-review/api/care-chat", { headers: { accept: "application/json", ...memberHeaders(member) } });
    const result = await response.json().catch(() => ({}));
    if (response.ok) renderCareChatHistory(Array.isArray(result.conversations) ? result.conversations : []);
  } catch {
    renderCareChatHistory([]);
  }
};

const addChatBubble = (text, role) => {
  const thread = document.querySelector("[data-chat-thread]");
  if (!thread) return null;
  const bubble = document.createElement("article");
  bubble.className = `care-chat-bubble care-chat-bubble--${role}`;
  const paragraph = document.createElement("p");
  paragraph.textContent = text;
  bubble.append(paragraph);
  thread.append(bubble);
  return bubble;
};

const makeCareElement = (tag, className = "", text = "") => {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text) element.textContent = text;
  return element;
};

const renderCareIntake = (result, member, originForm) => {
  const thread = document.querySelector("[data-chat-thread]");
  const intake = result?.intake;
  if (!thread || !intake) return;
  originForm.hidden = true;
  const questions = Array.isArray(intake.questions) ? intake.questions : [];
  const context = {};
  let questionIndex = 0;
  addChatBubble(intake.intro || "I need a few details so this lesson fits your pet.", "assistant");
  const followup = makeCareElement("article", "care-chat-followup");
  thread.append(followup);

  const buildLesson = async () => {
    thread.append(followup);
    followup.replaceChildren(makeCareElement("p", "care-chat-thinking", "Building a chapter around what you shared..."));
    try {
      const lesson = await requestJson("/team-review/api/care-chat", {
        stage: "lesson",
        question: result.question,
        privacy: result.privacy,
        context,
        memberId: member.id,
        memberToken: member.token,
        dogId: member.dogId,
      });
      followup.remove();
      renderRichCareAnswer(lesson);
      originForm.reset();
      originForm.querySelector("[name='privacy'][value='public']").checked = true;
      loadCareChatHistory(member);
    } catch (error) {
      followup.replaceChildren(makeCareElement("p", "form-note", error.message || "We could not build that lesson right now."));
      const retry = makeCareElement("button", "button secondary", "Try again");
      retry.type = "button";
      retry.addEventListener("click", buildLesson);
      followup.append(retry);
    }
  };

  const renderQuestion = () => {
    thread.append(followup);
    const question = questions[questionIndex];
    if (!question) {
      buildLesson();
      return;
    }
    followup.replaceChildren();
    const progress = makeCareElement("span", "care-chat-progress", `Quick follow-up · ${questionIndex + 1} of ${questions.length}`);
    const prompt = makeCareElement("h3", "", question.label);
    followup.append(progress, prompt);
    if (question.type === "select") {
      const replies = makeCareElement("div", "care-chat-quick-replies");
      (question.options || []).forEach(([value, label]) => {
        const choice = makeCareElement("button", "", label);
        choice.type = "button";
        choice.addEventListener("click", () => {
          context[question.name] = value;
          addChatBubble(label, "owner");
          questionIndex += 1;
          renderQuestion();
        });
        replies.append(choice);
      });
      followup.append(replies);
    } else {
      const answerForm = makeCareElement("form", "care-chat-reply-form");
      const input = document.createElement("textarea");
      input.name = question.name;
      input.rows = 2;
      input.placeholder = question.optional ? "Add what matters, or skip." : "Type a short answer.";
      const actions = makeCareElement("div", "care-chat-reply-actions");
      const send = makeCareElement("button", "button primary", "Continue");
      send.type = "submit";
      actions.append(send);
      if (question.optional) {
        const skip = makeCareElement("button", "button secondary", "Skip");
        skip.type = "button";
        skip.addEventListener("click", () => {
          context[question.name] = "";
          questionIndex += 1;
          renderQuestion();
        });
        actions.append(skip);
      }
      answerForm.append(input, actions);
      answerForm.addEventListener("submit", (event) => {
        event.preventDefault();
        const value = input.value.trim();
        if (!value && !question.optional) {
          input.focus();
          return;
        }
        context[question.name] = value;
        if (value) addChatBubble(value, "owner");
        questionIndex += 1;
        renderQuestion();
      });
      followup.append(answerForm);
      input.focus();
    }
    followup.scrollIntoView({ behavior: "smooth", block: "nearest" });
  };

  renderQuestion();
};

const renderRichCareAnswer = (result) => {
  const thread = document.querySelector("[data-chat-thread]");
  const answer = result?.answer;
  if (!thread || !answer) return;
  const shell = thread.closest(".care-assistant-shell");
  shell?.classList.add("has-open-lesson");

  const card = makeCareElement("article", `care-lesson care-course${answer.topic === "urgent" ? " is-urgent" : ""}`);
  const courseLayout = makeCareElement("div", "care-course-layout");
  const outline = makeCareElement("aside", "care-course-outline");
  const outlineHead = makeCareElement("div", "care-course-outline-head");
  outlineHead.append(
    makeCareElement("span", "lesson-kicker", answer.bookTitle || "Care knowledge book"),
    makeCareElement("strong", "", answer.title),
  );
  const outlineNav = makeCareElement("nav", "care-course-nav");
  outlineNav.setAttribute("aria-label", "Lesson chapters");
  const introLink = makeCareElement("button", "is-active", "Start here");
  introLink.type = "button";
  introLink.dataset.lessonTarget = "lesson-overview";
  outlineNav.append(introLink);
  (answer.chapters || []).forEach((chapter) => {
    const button = makeCareElement("button", "", chapter.title);
    button.type = "button";
    button.dataset.lessonTarget = `lesson-chapter-${chapter.number}`;
    outlineNav.append(button);
  });
  const finishLink = makeCareElement("button", "", "Sources & next steps");
  finishLink.type = "button";
  finishLink.dataset.lessonTarget = "lesson-finish";
  outlineNav.append(finishLink);
  const askAgain = makeCareElement("button", "care-course-ask-again", "Ask another question");
  askAgain.type = "button";
  askAgain.addEventListener("click", () => {
    const form = document.querySelector("[data-care-chat-form]");
    form?.removeAttribute("hidden");
    form?.querySelector("[name='question']")?.focus();
    form?.scrollIntoView({ behavior: "smooth", block: "center" });
  });
  outline.append(outlineHead, outlineNav, askAgain);

  const reader = makeCareElement("div", "care-course-reader");
  const overviewPage = makeCareElement("section", "care-course-page is-active");
  overviewPage.dataset.coursePage = "lesson-overview";
  const cover = makeCareElement("header", "care-lesson-cover");
  const coverTop = makeCareElement("div", "care-lesson-cover-top");
  coverTop.append(
    makeCareElement("span", "lesson-kicker", answer.topic === "urgent" ? "Urgent next step" : "Built for this pet"),
    makeCareElement("span", "lesson-topic", answer.topic || "care"),
  );
  cover.append(coverTop, makeCareElement("h3", "", answer.title));
  if (answer.petContext) cover.append(makeCareElement("p", "care-lesson-pet", answer.petContext));
  cover.append(makeCareElement("p", "care-lesson-summary", answer.summary));
  if (result.question) {
    const question = makeCareElement("blockquote", "care-lesson-question");
    question.append(makeCareElement("span", "", "Question"), makeCareElement("p", "", result.question));
    cover.append(question);
  }
  overviewPage.append(cover);

  if (Array.isArray(answer.profileFacts) && answer.profileFacts.length) {
    const profile = makeCareElement("section", "care-lesson-profile");
    const profileHeading = makeCareElement("div", "care-lesson-profile-heading");
    profileHeading.append(makeCareElement("span", "lesson-kicker", "Context used"), makeCareElement("h4", "", "The care profile behind this lesson"));
    if (answer.evidenceNote) profileHeading.append(makeCareElement("p", "", answer.evidenceNote));
    const facts = makeCareElement("dl", "care-lesson-profile-facts");
    answer.profileFacts.forEach(([label, value]) => {
      const item = document.createElement("div");
      item.append(makeCareElement("dt", "", label), makeCareElement("dd", "", value));
      facts.append(item);
    });
    profile.append(profileHeading, facts);
    overviewPage.append(profile);
  }

  if (Array.isArray(answer.pattern) && answer.pattern.length) {
    const figure = makeCareElement("figure", "care-pattern-figure");
    const caption = makeCareElement("figcaption");
    caption.append(makeCareElement("strong", "", "Your observation map"), makeCareElement("span", "", "This organizes what you reported. It is not a medical score."));
    const rows = makeCareElement("div", "care-pattern-rows");
    answer.pattern.forEach((point) => {
      const row = makeCareElement("div", "care-pattern-row");
      const meta = makeCareElement("div");
      meta.append(makeCareElement("strong", "", point.label), makeCareElement("span", "", point.text));
      const track = makeCareElement("div", "care-pattern-track");
      const fill = makeCareElement("span", "care-pattern-fill");
      fill.style.width = `${Math.max(8, Math.min(100, Number(point.value || 0)))}%`;
      track.append(fill);
      row.append(meta, track);
      rows.append(row);
    });
    figure.append(caption, rows);
    overviewPage.append(figure);
  }
  reader.append(overviewPage);

  (answer.chapters || []).forEach((chapter) => {
    const section = makeCareElement("section", "care-chapter care-course-page");
    section.id = `lesson-chapter-${chapter.number}`;
    section.dataset.coursePage = `lesson-chapter-${chapter.number}`;
    const media = makeCareElement("figure", "care-chapter-media");
    const image = document.createElement("img");
    image.src = chapter.image;
    image.alt = `${chapter.title} care example`;
    image.loading = "lazy";
    media.append(image, makeCareElement("figcaption", "", `Figure ${chapter.number}. A real-life care moment related to this chapter.`));
    const copy = makeCareElement("div", "care-chapter-copy");
    copy.append(makeCareElement("span", "lesson-kicker", `Chapter ${chapter.number}`), makeCareElement("h4", "", chapter.title));
    (chapter.paragraphs || []).forEach((paragraph) => copy.append(makeCareElement("p", "", paragraph)));
    if (Array.isArray(chapter.bullets) && chapter.bullets.length) {
      const list = document.createElement("ul");
      chapter.bullets.forEach((value) => list.append(makeCareElement("li", "", value)));
      copy.append(list);
    }
    if (Array.isArray(chapter.table) && chapter.table.length) {
      const table = makeCareElement("dl", "care-chapter-table");
      chapter.table.forEach(([label, value]) => {
        const row = document.createElement("div");
        row.append(makeCareElement("dt", "", label), makeCareElement("dd", "", value));
        table.append(row);
      });
      copy.append(table);
    }
    if (chapter.marginNote) {
      const note = makeCareElement("aside", "care-chapter-note");
      note.append(makeCareElement("span", "lesson-kicker", "For this pet"), makeCareElement("p", "", chapter.marginNote));
      copy.append(note);
    }
    const chapterQuiz = (answer.quiz || []).find((item) => Number(item.chapter) === Number(chapter.number));
    if (chapterQuiz) {
      const check = makeCareElement("div", "care-chapter-check");
      check.append(makeCareElement("span", "lesson-kicker", "Check your understanding"), makeCareElement("strong", "", chapterQuiz.question));
      const options = makeCareElement("div", "care-chapter-check-options");
      (chapterQuiz.options || []).forEach((option, optionIndex) => {
        const label = document.createElement("label");
        const input = document.createElement("input");
        input.type = "radio";
        input.name = `lesson-quiz-${result.conversationId || Date.now()}-${chapter.number}`;
        input.value = String(optionIndex);
        label.append(input, makeCareElement("span", "", option));
        options.append(label);
      });
      const feedback = makeCareElement("p", "quiz-feedback");
      options.addEventListener("change", (event) => {
        const choice = Number(event.target.value);
        feedback.textContent = `${choice === Number(chapterQuiz.answer) ? "Correct. " : "Try again. "}${chapterQuiz.explanation}`;
        feedback.classList.toggle("is-correct", choice === Number(chapterQuiz.answer));
      });
      check.append(options, feedback);
      copy.append(check);
    }
    section.append(media, copy);
    reader.append(section);
  });

  const finish = makeCareElement("section", "care-course-finish care-course-page");
  finish.id = "lesson-finish";
  finish.dataset.coursePage = "lesson-finish";
  const callout = makeCareElement("div", "care-answer-callout");
  const calloutTitle = makeCareElement("strong", "", "When to contact a veterinarian");
  const calloutCopy = makeCareElement("span", "", answer.vet);
  callout.append(calloutTitle, calloutCopy);
  finish.append(callout);

  if (Array.isArray(answer.chart) && answer.chart.length) {
    const chart = makeCareElement("section", "care-answer-chart");
    const h4 = makeCareElement("h4", "", "Your saved seven-day pattern");
    const bars = makeCareElement("div");
    answer.chart.forEach((point) => {
      const bar = document.createElement("div");
      const fill = document.createElement("span");
      fill.style.height = `${Math.max(8, Number(point.changed || 0) * 30)}%`;
      const caption = document.createElement("small");
      caption.textContent = point.label;
      bar.append(fill, caption);
      bars.append(bar);
    });
    chart.append(h4, bars);
    finish.append(chart);
  }

  const questions = makeCareElement("section", "care-answer-questions");
  const qTitle = makeCareElement("h4", "", "Questions to carry into the next conversation");
  const qList = makeCareElement("div");
  (answer.questions || []).forEach((question) => {
    const label = document.createElement("label");
    const input = document.createElement("input");
    input.type = "checkbox";
    const text = document.createElement("span");
    text.textContent = question;
    label.append(input, text);
    qList.append(label);
  });
  questions.append(qTitle, qList);
  finish.append(questions);
  if (Array.isArray(answer.sources) && answer.sources.length) {
    const sources = makeCareElement("section", "care-lesson-sources");
    sources.append(makeCareElement("h4", "", "Sources behind this lesson"));
    const sourceList = document.createElement("ul");
    answer.sources.forEach(([text, href]) => {
      const item = document.createElement("li");
      const link = makeCareElement("a", "", text);
      link.href = href;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      item.append(link);
      sourceList.append(item);
    });
    sources.append(sourceList);
    finish.append(sources);
  }

  const footer = makeCareElement("div", "care-answer-footer");
  (answer.nextSteps || []).forEach((step) => {
    if (step.type === "lesson") {
      const button = makeCareElement("button", "button secondary", step.label);
      button.type = "button";
      button.dataset.chatPrompt = step.prompt;
      footer.append(button);
      return;
    }
    const link = makeCareElement("a", "button secondary", step.label);
    link.href = step.href;
    footer.append(link);
  });
  if (result.privacy === "public") {
    const publicLink = makeCareElement("a", "button primary", result.published ? "View Care Circle" : "Publish to Care Circle");
    if (result.published) publicLink.href = "/community/#conversations";
    else {
      publicLink.href = "#";
      publicLink.setAttribute("role", "button");
      publicLink.dataset.publishChat = result.conversationId;
    }
    footer.append(publicLink);
  }
  finish.append(footer);
  reader.append(finish);
  const pages = [...reader.querySelectorAll("[data-course-page]")];
  pages.forEach((page, pageIndex) => {
    const pager = makeCareElement("nav", "care-course-pager");
    pager.setAttribute("aria-label", "Lesson page navigation");
    const previous = makeCareElement("button", "button secondary", "Previous");
    previous.type = "button";
    previous.dataset.courseGo = String(pageIndex - 1);
    previous.disabled = pageIndex === 0;
    const progress = makeCareElement("span", "", `${pageIndex + 1} / ${pages.length}`);
    const next = makeCareElement("button", "button primary", pageIndex === pages.length - 1 ? "Ask another question" : "Next chapter");
    next.type = "button";
    next.dataset.courseGo = pageIndex === pages.length - 1 ? "ask" : String(pageIndex + 1);
    pager.append(previous, progress, next);
    page.append(pager);
  });
  courseLayout.append(outline, reader);
  card.append(courseLayout);
  thread.append(card);
  const showCoursePage = (pageIndex) => {
    const target = pages[pageIndex];
    if (!target) return;
    pages.forEach((page) => page.classList.toggle("is-active", page === target));
    card.querySelectorAll("[data-lesson-target]").forEach((button) => button.classList.toggle("is-active", button.dataset.lessonTarget === target.dataset.coursePage));
    card.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  card.querySelectorAll("[data-lesson-target]").forEach((button) => button.addEventListener("click", () => showCoursePage(pages.findIndex((page) => page.dataset.coursePage === button.dataset.lessonTarget))));
  card.querySelectorAll("[data-course-go]").forEach((button) => button.addEventListener("click", () => {
    if (button.dataset.courseGo === "ask") {
      const form = document.querySelector("[data-care-chat-form]");
      form?.removeAttribute("hidden");
      form?.querySelector("[name='question']")?.focus();
      form?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    showCoursePage(Number(button.dataset.courseGo));
  }));
  card.scrollIntoView({ behavior: "smooth", block: "start" });
};

document.addEventListener("click", (event) => {
  const button = event.target.closest("[data-chat-prompt]");
  if (!button) return;
  const prompt = button.dataset.chatPrompt || "";
  const member = readMember();
  if (!member) {
    localStorage.setItem(pendingLessonKey, prompt);
    window.location.href = "/my-pet/#enroll";
    return;
  }
  const field = document.querySelector("[data-care-chat-form] [name='question']");
  if (!field) {
    window.location.href = `/community/?topic=${encodeURIComponent(prompt)}#ask`;
    return;
  }
  field.value = prompt;
  document.querySelector("#ask")?.scrollIntoView({ behavior: "smooth", block: "start" });
  field.focus();
});

const suggestedQuestion = new URLSearchParams(window.location.search).get("topic");
if (suggestedQuestion) {
  const suggestedField = document.querySelector("[data-care-chat-form] [name='question']");
  if (suggestedField) suggestedField.value = suggestedQuestion.slice(0, 900);
}

document.addEventListener("click", async (event) => {
  const trigger = event.target.closest("[data-load-chat]");
  if (!trigger) return;
  const member = readMember();
  if (!member) return;
  trigger.disabled = true;
  try {
    const response = await fetch(`/team-review/api/care-chat?conversationId=${encodeURIComponent(trigger.dataset.loadChat)}`, {
      headers: { accept: "application/json", ...memberHeaders(member) },
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || "We could not reopen that lesson.");
    const thread = document.querySelector("[data-chat-thread]");
    thread?.replaceChildren();
    document.querySelector("[data-chat-welcome]")?.setAttribute("hidden", "");
    addChatBubble(result.question, "owner");
    renderRichCareAnswer(result);
  } catch (error) {
    const note = document.querySelector("[data-care-chat-note]");
    if (note) note.textContent = error.message;
  } finally {
    trigger.disabled = false;
  }
});

document.querySelectorAll("[data-care-chat-form]").forEach((form) => {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const member = readMember();
    const note = form.querySelector("[data-care-chat-note]");
    const button = form.querySelector("button[type='submit']");
    if (!member) return;
    const values = Object.fromEntries(new FormData(form).entries());
    const question = String(values.question || "").trim();
    if (button) { button.disabled = true; button.textContent = "Learning about your pet..."; }
    if (note) note.textContent = "";
    document.querySelector("[data-chat-welcome]")?.setAttribute("hidden", "");
    addChatBubble(question, "owner");
    const file = form.querySelector("[name='media']")?.files?.[0];
    if (file) addChatBubble(`${file.name} is attached for your reference. WoafyPet does not diagnose a pet from an image or video.`, "attachment");
    try {
      const result = await requestJson("/team-review/api/care-chat", { stage: "context", question, privacy: values.privacy, memberId: member.id, memberToken: member.token, dogId: member.dogId });
      if (result.needsContext) {
        renderCareIntake(result, member, form);
      } else {
        renderRichCareAnswer(result);
        form.reset();
        form.querySelector("[name='privacy'][value='public']").checked = true;
        form.hidden = true;
        loadCareChatHistory(member);
      }
    } catch (error) {
      if (note) note.textContent = error.message || "We could not build that answer right now.";
    } finally {
      if (button) { button.disabled = false; button.textContent = "Ask WoafyPet"; }
    }
  });
});

document.addEventListener("click", async (event) => {
  const publish = event.target.closest("[data-publish-chat]");
  if (!publish) return;
  const member = readMember();
  if (!member) return;
  publish.disabled = true;
  publish.textContent = "Publishing...";
  try {
    const result = await requestJson("/team-review/api/care-chat-publish", { conversationId: publish.dataset.publishChat, memberId: member.id, memberToken: member.token, dogId: member.dogId });
    publish.textContent = "Published";
    const note = document.createElement("span");
    note.className = "form-note";
    note.textContent = result.message;
    publish.parentElement.append(note);
    await loadCommunity();
    document.querySelector("#conversations")?.scrollIntoView({ behavior: "smooth" });
  } catch (error) {
    publish.disabled = false;
    publish.textContent = "Publish to Care Circle";
    window.alert(error.message || "We could not publish that conversation.");
  }
});

const uploadPrivateMemoryMedia = async (file, member) => {
  if (!file) return "";
  const body = new FormData();
  body.append("memberId", member.id);
  body.append("memberToken", member.token);
  body.append("dogId", member.dogId);
  body.append("purpose", "memory");
  body.append("file", file);
  const response = await fetch("/team-review/api/media", { method: "POST", body });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || "We could not upload that memory.");
  return result.media?.id || "";
};

const renderMemories = (items, member) => {
  document.querySelectorAll("[data-memory-list]").forEach((root) => {
    root.replaceChildren();
    if (!items.length) {
      const empty = document.createElement("p");
      empty.textContent = "Your first saved moment will appear here.";
      root.append(empty);
      return;
    }
    items.forEach((item) => {
      const card = document.createElement("article");
      if (item.mediaId && item.mediaKind === "image") {
        const image = document.createElement("img");
        image.src = `/team-review/api/media/${encodeURIComponent(item.mediaId)}?memberId=${encodeURIComponent(member.id)}&memberToken=${encodeURIComponent(member.token)}`;
        image.alt = item.title;
        image.loading = "lazy";
        card.append(image);
      } else if (item.mediaId && item.mediaKind === "video") {
        const video = document.createElement("video");
        video.src = `/team-review/api/media/${encodeURIComponent(item.mediaId)}?memberId=${encodeURIComponent(member.id)}&memberToken=${encodeURIComponent(member.token)}`;
        video.controls = true;
        video.preload = "metadata";
        card.append(video);
      } else if (item.mediaId && item.mediaKind === "audio") {
        const audio = document.createElement("audio");
        audio.src = `/team-review/api/media/${encodeURIComponent(item.mediaId)}?memberId=${encodeURIComponent(member.id)}&memberToken=${encodeURIComponent(member.token)}`;
        audio.controls = true;
        card.append(audio);
      }
      const copy = document.createElement("div");
      const title = document.createElement("h4");
      title.textContent = item.title;
      const story = document.createElement("p");
      story.textContent = item.story;
      const date = document.createElement("span");
      date.textContent = new Date(item.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
      copy.append(title, story, date);
      card.append(copy);
      root.append(card);
    });
  });
};

const loadMemories = async (member) => {
  if (!member || !document.querySelector("[data-memory-list]")) return;
  try {
    const response = await fetch(`/team-review/api/memories?dogId=${encodeURIComponent(member.dogId)}`, { headers: { accept: "application/json", ...memberHeaders(member) } });
    const result = await response.json().catch(() => ({}));
    if (response.ok) renderMemories(Array.isArray(result.memories) ? result.memories : [], member);
  } catch {
    renderMemories([], member);
  }
};

document.querySelectorAll("[data-memory-form]").forEach((form) => {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const member = readMember();
    const note = form.querySelector("[data-memory-note]");
    const button = form.querySelector("button[type='submit']");
    if (!member) return;
    const values = Object.fromEntries(new FormData(form).entries());
    const file = form.querySelector("[name='media']")?.files?.[0];
    if (button) { button.disabled = true; button.textContent = file ? "Uploading..." : "Saving..."; }
    if (note) note.textContent = "";
    try {
      const mediaId = await uploadPrivateMemoryMedia(file, member);
      const result = await requestJson("/team-review/api/memories", { title: values.title, story: values.story, mediaId, memberId: member.id, memberToken: member.token, dogId: member.dogId });
      if (note) note.textContent = result.message;
      form.reset();
      await loadMemories(member);
    } catch (error) {
      if (note) note.textContent = error.message || "We could not save that memory.";
    } finally {
      if (button) { button.disabled = false; button.textContent = "Save to the timeline"; }
    }
  });
});

document.addEventListener("click", async (event) => {
  const actionButton = event.target.closest("[data-community-action]");
  const shareButton = event.target.closest("[data-community-share]");
  const lessonButton = event.target.closest("[data-public-lesson]");
  if (lessonButton) {
    lessonButton.disabled = true;
    const previousLabel = lessonButton.textContent;
    lessonButton.textContent = "Opening...";
    try {
      const response = await fetch(`/team-review/api/public-lesson?postId=${encodeURIComponent(lessonButton.dataset.publicLesson)}`, {
        headers: { accept: "application/json" },
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "We could not open that public lesson.");
      const thread = document.querySelector("[data-chat-thread]");
      thread?.replaceChildren();
      document.querySelector("[data-chat-welcome]")?.setAttribute("hidden", "");
      addChatBubble(result.question, "owner");
      renderRichCareAnswer(result);
    } catch (error) {
      window.alert(error.message || "We could not open that public lesson.");
    } finally {
      lessonButton.disabled = false;
      lessonButton.textContent = previousLabel;
    }
  }
  if (actionButton) {
    const member = readMember();
    if (!member) { window.location.href = "/my-pet/"; return; }
    actionButton.disabled = true;
    try {
      await requestJson("/team-review/api/community-action", { action: actionButton.dataset.communityAction, postId: actionButton.dataset.postId, memberId: member.id, memberToken: member.token });
      await loadCommunity();
    } catch (error) {
      actionButton.disabled = false;
      window.alert(error.message || "We could not save that action.");
    }
  }
  if (shareButton) {
    const url = `${window.location.origin}${window.location.pathname}#conversations`;
    const data = { title: shareButton.dataset.shareTitle || "Care Circle conversation", text: "A senior-pet Care Circle conversation", url };
    try {
      if (navigator.share) await navigator.share(data);
      else { await navigator.clipboard.writeText(url); shareButton.textContent = "Link copied"; }
    } catch {
      // Closing the native share sheet needs no error message.
    }
  }
});

const storeCartKey = "woafmeow-store-cart-v1";
const storeCouponKey = "woafmeow-store-coupon-v1";

const readStoreCart = () => {
  try {
    const cart = JSON.parse(localStorage.getItem(storeCartKey) || "[]");
    if (!Array.isArray(cart)) return [];
    return cart
      .map((item) => ({
        slug: String(item.slug || ""),
        title: String(item.title || "Product"),
        priceCents: Math.max(0, Number.parseInt(item.priceCents, 10) || 0),
        imageUrl: String(item.imageUrl || ""),
        spriteX: item.spriteX !== null && item.spriteX !== undefined && Number.isInteger(Number(item.spriteX)) ? Number(item.spriteX) : null,
        spriteY: item.spriteY !== null && item.spriteY !== undefined && Number.isInteger(Number(item.spriteY)) ? Number(item.spriteY) : null,
        quantity: Math.min(Number(item.maxQuantity || 8), Math.max(1, Number.parseInt(item.quantity, 10) || 1)),
        maxQuantity: Number(item.maxQuantity || 8),
        variantId: String(item.variantId || ""),
        variantLabel: String(item.variantLabel || ""),
        customizationPriceCents: Number(item.customizationPriceCents ?? 1000),
        customize: item.customize === true,
        customizationType: String(item.customizationType || "none"),
        dogName: String(item.dogName || ""),
        customizationShape: String(item.customizationShape || ""),
        customizationImageId: String(item.customizationImageId || ""),
        design: String(item.design || ""),
      }))
      .filter((item) => item.slug && item.priceCents > 0);
  } catch {
    return [];
  }
};

const writeStoreCart = (cart) => {
  localStorage.setItem(storeCartKey, JSON.stringify(cart));
};

const storeMoney = (priceCents) => new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
}).format(Number(priceCents || 0) / 100);

const storeItemKey = (item) => `${item.slug}|${item.variantId || ""}|${item.customize ? "custom" : item.design || "standard"}|${item.dogName || ""}|${item.customizationShape || ""}|${item.customizationImageId || ""}`;

const renderStoreCartItem = (item, index) => {
  const article = document.createElement("article");
  article.className = "store-cart-item";
  const media = document.createElement("span");
  media.className = "store-cart-item-media";
  const image = document.createElement("img");
  image.src = item.imageUrl;
  image.alt = "";
  if (item.spriteX !== null && item.spriteY !== null) {
    media.classList.add("is-sprite");
    media.style.setProperty("--sprite-image", `url('${item.imageUrl}')`);
    media.style.setProperty("--sprite-x", `${item.spriteX * 33.333333}%`);
    media.style.setProperty("--sprite-y", `${item.spriteY * 50}%`);
  }
  media.append(image);
  const copy = document.createElement("div");
  copy.className = "store-cart-item-copy";
  const title = document.createElement("strong");
  title.textContent = item.title;
  copy.append(title);
  if (item.variantLabel) {
    const variant = document.createElement("span");
    variant.className = "store-cart-customization";
    variant.textContent = item.variantLabel;
    copy.append(variant);
  }
  if (item.customize) {
    const customization = document.createElement("span");
    customization.className = "store-cart-customization";
    customization.textContent = [item.dogName ? `Customized for ${item.dogName}` : "Customized", item.customizationShape].filter(Boolean).join(" · ");
    copy.append(customization);
  } else if (item.design) {
    const design = document.createElement("span");
    design.className = "store-cart-customization";
    design.textContent = item.design;
    copy.append(design);
  }
  const controls = document.createElement("div");
  controls.className = "store-cart-item-controls";
  const decrease = document.createElement("button");
  decrease.type = "button";
  decrease.dataset.cartQuantity = String(index);
  decrease.dataset.cartDelta = "-1";
  decrease.setAttribute("aria-label", `Decrease ${item.title} quantity`);
  decrease.textContent = "−";
  const quantity = document.createElement("span");
  quantity.textContent = String(item.quantity);
  const increase = document.createElement("button");
  increase.type = "button";
  increase.dataset.cartQuantity = String(index);
  increase.dataset.cartDelta = "1";
  increase.setAttribute("aria-label", `Increase ${item.title} quantity`);
  increase.textContent = "+";
  const remove = document.createElement("button");
  remove.type = "button";
  remove.className = "store-cart-remove";
  remove.dataset.cartRemove = String(index);
  remove.textContent = "Remove";
  controls.append(decrease, quantity, increase, remove);
  const price = document.createElement("strong");
  price.className = "store-cart-item-price";
  price.textContent = storeMoney(item.priceCents * item.quantity);
  copy.append(controls);
  article.append(media, copy, price);
  return article;
};

const renderStoreCart = () => {
  const cart = readStoreCart();
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce((sum, item) => sum + item.priceCents * item.quantity, 0);
  const coupon = localStorage.getItem(storeCouponKey) === "WELCOME15" ? "WELCOME15" : "";
  const discount = coupon ? cart.reduce((sum, item) => {
    const basePrice = item.priceCents - (item.customize ? item.customizationPriceCents : 0);
    return sum + (basePrice - Math.round(basePrice * 0.85)) * item.quantity;
  }, 0) : 0;
  document.querySelectorAll("[data-cart-count]").forEach((node) => {
    node.textContent = node.closest(".shop-cart") ? `${itemCount} ${itemCount === 1 ? "item" : "items"}` : String(itemCount);
  });
  document.querySelectorAll("[data-cart-items]").forEach((root) => {
    root.replaceChildren(...cart.map(renderStoreCartItem));
  });
  document.querySelectorAll("[data-cart-empty]").forEach((node) => { node.hidden = cart.length > 0; });
  document.querySelectorAll("[data-shop-checkout]").forEach((node) => { node.hidden = cart.length === 0; });
  document.querySelectorAll("[data-cart-subtotal]").forEach((node) => { node.textContent = storeMoney(subtotal); });
  document.querySelectorAll("[data-cart-discount]").forEach((node) => { node.textContent = `−${storeMoney(discount)}`; });
  document.querySelectorAll("[data-cart-discount-row]").forEach((node) => { node.hidden = discount === 0; });
  document.querySelectorAll("[data-cart-total]").forEach((node) => { node.textContent = storeMoney(subtotal - discount); });
  document.querySelectorAll("[data-shop-checkout-full] button[type='submit']").forEach((button) => { button.disabled = cart.length === 0 || button.form?.storeCheckoutPending === true || button.form?.storeShippingReady === false; });
  document.querySelectorAll("[data-cart-shipping]").forEach(() => refreshStoreShipping());
};

const openStoreCart = () => {
  const cart = document.querySelector("[data-shop-cart]");
  const backdrop = document.querySelector("[data-cart-backdrop]");
  if (!cart) return;
  cart.hidden = false;
  cart.setAttribute("aria-hidden", "false");
  if (backdrop) backdrop.hidden = false;
  document.body.classList.add("shop-cart-open");
  cart.querySelector("[data-cart-close]")?.focus();
};

const closeStoreCart = () => {
  const cart = document.querySelector("[data-shop-cart]");
  const backdrop = document.querySelector("[data-cart-backdrop]");
  if (cart) {
    cart.hidden = true;
    cart.setAttribute("aria-hidden", "true");
  }
  if (backdrop) backdrop.hidden = true;
  document.body.classList.remove("shop-cart-open");
};

const storeProductFromButton = (button) => {
  const detail = button.closest(".product-detail");
  const choice = detail?.querySelector('input[name="productDesign"]:checked');
  const customize = choice ? choice.value === "custom" : Boolean(detail?.querySelector("[data-product-customize]")?.checked);
  const variant = detail?.querySelector("[data-product-variant]");
  return {
    slug: button.dataset.productSlug || "",
    title: button.dataset.productTitle || "Product",
    priceCents: Number(button.dataset.productPrice || 0),
    customizationPriceCents: Number(button.dataset.customizationPrice ?? 1000),
    maxQuantity: Number(button.dataset.maxQuantity || 8),
    variantId: variant?.value || "",
    variantLabel: variant?.selectedOptions[0]?.dataset.label || "",
    imageUrl: button.dataset.productImage || "",
    spriteX: button.dataset.productSpriteX === undefined ? null : Number.parseInt(button.dataset.productSpriteX, 10),
    spriteY: button.dataset.productSpriteY === undefined ? null : Number.parseInt(button.dataset.productSpriteY, 10),
    quantity: Number.parseInt(detail?.querySelector("[data-product-quantity]")?.value, 10) || 1,
    customize,
    design: choice && !customize ? choice.value : "",
    customizationType: button.dataset.customizationType || "none",
    dogName: customize ? String(detail?.querySelector("[data-customization-dog-name]")?.value || "").trim() : "",
    customizationShape: customize ? detail?.querySelector("[data-customization-shape-input]")?.value || "" : "",
    customizationImageId: "",
  };
};

const uploadCustomizationImage = async (file) => {
  const prepared = await resizeProductImage(file);
  const data = new FormData();
  data.append("image", prepared, prepared.name);
  const response = await fetch("/team-review/api/customization-images", { method: "POST", headers: { accept: "application/json" }, body: data });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || !result.imageId) throw new Error(result.error || "The customization photo could not be uploaded.");
  return result.imageId;
};

document.addEventListener("click", async (event) => {
  const open = event.target.closest("[data-cart-open]");
  const close = event.target.closest("[data-cart-close], [data-cart-backdrop]");
  const add = event.target.closest("[data-add-cart]");
  const quantityButton = event.target.closest("[data-cart-quantity]");
  const removeButton = event.target.closest("[data-cart-remove]");
  if (open) {
    openStoreCart();
    return;
  }
  if (close) {
    closeStoreCart();
    return;
  }
  if (add && !add.disabled) {
    const item = storeProductFromButton(add);
    if (!item.slug || !item.priceCents) return;
    const detail = add.closest(".product-detail");
    const status = detail?.querySelector("[data-product-status]");
    if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > item.maxQuantity) {
      if (status) { status.hidden = false; status.textContent = `Choose between 1 and ${item.maxQuantity} units.`; }
      return;
    }
    if (detail?.querySelector("[data-product-design-list]") && !detail.querySelector('input[name="productDesign"]:checked')) {
      if (status) { status.hidden = false; status.textContent = "Choose a design."; }
      return;
    }
    const requiresName = item.customizationType === "name" || item.customizationType === "name_photo";
    const requiresPhoto = item.customizationType === "photo" || item.customizationType === "name_photo";
    if (item.customize && requiresName && !item.dogName) {
      if (status) { status.hidden = false; status.textContent = "Add your dog's name."; }
      detail?.querySelector("[data-customization-dog-name]")?.focus();
      return;
    }
    if (item.customize && Array.from(item.dogName).length > 10) {
      if (status) { status.hidden = false; status.textContent = "Use up to 10 characters for your dog's name."; }
      detail?.querySelector("[data-customization-dog-name]")?.focus();
      return;
    }
    if (item.customize && detail?.querySelector("[data-customization-shape-input]")?.options.length && !item.customizationShape) {
      if (status) { status.hidden = false; status.textContent = "Choose a shape."; }
      return;
    }
    if (item.customize && requiresPhoto) {
      const file = detail?.querySelector("[data-customization-photo-input]")?.files?.[0];
      if (!file) {
        if (status) { status.hidden = false; status.textContent = "Add a dog-face photo."; }
        return;
      }
      add.disabled = true;
      add.textContent = "Uploading photo…";
      try { item.customizationImageId = await uploadCustomizationImage(file); }
      catch (error) {
        if (status) { status.hidden = false; status.textContent = error.message || "The customization photo could not be uploaded."; }
        add.disabled = false;
        add.textContent = "Add to cart";
        return;
      }
    }
    const cart = readStoreCart();
    const existing = cart.find((candidate) => storeItemKey(candidate) === storeItemKey(item));
    if (existing) existing.quantity = Math.min(item.maxQuantity, existing.quantity + item.quantity);
    else cart.push(item);
    writeStoreCart(cart);
    document.dispatchEvent(new CustomEvent("woafmeow:commerce", { detail: { name: "add_to_cart", items: [item] } }));
    renderStoreCart();
    const original = "Add to cart";
    add.textContent = "Added ✓";
    add.disabled = false;
    if (status) { status.hidden = true; status.textContent = ""; }
    window.setTimeout(() => { add.textContent = original; }, 900);
    openStoreCart();
    return;
  }
  if (quantityButton) {
    const cart = readStoreCart();
    const index = Number.parseInt(quantityButton.dataset.cartQuantity, 10);
    const delta = Number.parseInt(quantityButton.dataset.cartDelta, 10);
    if (!cart[index] || !Number.isFinite(delta)) return;
    cart[index].quantity += delta;
    if (cart[index].quantity < 1) cart.splice(index, 1);
    else cart[index].quantity = Math.min(cart[index].maxQuantity, cart[index].quantity);
    writeStoreCart(cart);
    renderStoreCart();
    return;
  }
  if (removeButton) {
    const cart = readStoreCart();
    const index = Number.parseInt(removeButton.dataset.cartRemove, 10);
    if (!cart[index]) return;
    document.dispatchEvent(new CustomEvent("woafmeow:commerce", { detail: { name: "remove_from_cart", items: [cart[index]] } }));
    cart.splice(index, 1);
    writeStoreCart(cart);
    renderStoreCart();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeStoreCart();
});

const createDynamicProductCard = (product, rank = 1000) => {
  const article = document.createElement("article");
  article.className = "product-card";
  article.dataset.storeProductCard = "";
  article.dataset.productTitle = String(product.title || "").toLowerCase();
  article.dataset.productSearch = `${product.title || ""} ${product.shortDescription || ""}`.toLowerCase();
  article.dataset.productPrice = String(Number(product.priceCents || 0));
  article.dataset.productRank = String(rank);
  const imageLink = document.createElement("a");
  imageLink.className = "product-card-image";
  imageLink.href = `/team-review/shop/product/?slug=${encodeURIComponent(product.slug)}`;
  const image = document.createElement("img");
  image.src = combinedCatalogPhotos[product.slug] || combinedProductPhotos[product.slug] || product.imageUrl;
  image.alt = product.title;
  image.loading = "lazy";
  imageLink.append(image);
  if (product.previewOnly) {
    const badge = document.createElement("span");
    badge.className = "product-preview-badge";
    badge.textContent = "Preview";
    imageLink.append(badge);
  }
  const copy = document.createElement("div");
  if (window.location.pathname.startsWith("/team-review/shop/")) {
    const wordmark = document.createElement("img");
    wordmark.className = "store-product-wordmark";
    wordmark.src = "/team-review/assets/woafypet-orange-logo.webp";
    wordmark.alt = "WoafyPet Shop";
    wordmark.width = 120;
    wordmark.height = 15;
    copy.append(wordmark);
  }
  const title = document.createElement("h3");
  const titleLink = document.createElement("a");
  titleLink.href = imageLink.href;
  titleLink.textContent = combinedProductNames[product.slug] || product.title;
  title.append(titleLink);
  const description = document.createElement("p");
  description.textContent = combinedProductBenefits[product.slug] || product.shortDescription || "View complete product details.";
  const footer = document.createElement("div");
  footer.className = "product-card-footer";
  const price = document.createElement("strong");
  if (!product.previewOnly) { price.textContent = storeMoney(product.priceCents); footer.append(price); }
  if (!product.previewOnly) {
    const actions = document.createElement("div");
    const add = document.createElement(product.designOptions?.length || product.variants?.length ? "a" : "button");
    if (add.tagName === "BUTTON") {
      add.type = "button";
      add.dataset.addCart = "";
      add.dataset.productSlug = product.slug;
      add.dataset.productTitle = product.title;
      add.dataset.productPrice = String(product.priceCents);
      add.dataset.productImage = product.imageUrl;
      add.dataset.maxQuantity = String(Math.min(product.maxQuantity || 8, product.stockQuantity ?? 100));
      add.disabled = product.stockQuantity === 0;
    } else add.href = imageLink.href;
    add.className = "button primary";
    add.textContent = add.tagName === "BUTTON" ? product.stockQuantity === 0 ? "Sold out" : "Add to cart" : "Choose yours today";
    actions.append(add);
    footer.append(actions);
  }
  copy.append(title, description);
  if (footer.childElementCount) copy.append(footer);
  article.append(imageLink, copy);
  return article;
};

const storeQuery = new URLSearchParams(window.location.search);
let activeStoreSearch = String(storeQuery.get("q") || "").trim().toLowerCase();
let activeStoreSort = "featured";

const sortStoreProducts = () => {
  const root = document.querySelector("[data-shop-catalog-grid]");
  if (!root) return;
  const cards = [...root.querySelectorAll(":scope > [data-store-product-card]")];
  cards.sort((left, right) => {
    if (activeStoreSort === "price-low") return Number(left.dataset.productPrice || 0) - Number(right.dataset.productPrice || 0);
    if (activeStoreSort === "price-high") return Number(right.dataset.productPrice || 0) - Number(left.dataset.productPrice || 0);
    if (activeStoreSort === "title") return String(left.dataset.productTitle || "").localeCompare(String(right.dataset.productTitle || ""));
    return Number(left.dataset.productRank || 0) - Number(right.dataset.productRank || 0);
  });
  root.append(...cards);
};

const applyStoreFilter = () => {
  let visible = 0;
  document.querySelectorAll("[data-store-product-card]").forEach((card) => {
    const matchesSearch = !activeStoreSearch || String(card.dataset.productSearch || card.dataset.productTitle || "").includes(activeStoreSearch);
    const show = matchesSearch;
    card.hidden = !show;
    if (show) visible += 1;
  });
  const empty = document.querySelector("[data-shop-empty-filter]");
  if (empty) empty.hidden = visible > 0;
};

const reconcileStoreCartWithProducts = (products) => {
  const catalog = new Map(products.map((product) => [product.slug, product]));
  const current = readStoreCart();
  const next = current.filter((item) => {
    const product = catalog.get(item.slug);
    if (!product || (item.customize && product.customizationType === "none")) return false;
    const options = Array.isArray(product.designOptions) ? product.designOptions : [];
    const variants = product.variants || [];
    const variant = variants.find((option) => option.id === item.variantId && option.active !== false);
    if ((variants.length && !variant) || (!variants.length && item.variantId)) return false;
    if ((variant ? variant.stockQuantity : product.stockQuantity) === 0) return false;
    return options.length ? item.customize || options.some((option) => option.label === item.design) : !item.design;
  }).map((item) => {
    const product = catalog.get(item.slug);
    const variant = product.variants?.find((option) => option.id === item.variantId);
    const design = product.designOptions?.find((option) => option.label === item.design);
    const maxQuantity = Math.min(product.maxQuantity || 8, (variant ? variant.stockQuantity : product.stockQuantity) ?? 100);
    return {
      ...item,
      title: product.title,
      priceCents: Number(variant ? variant.priceCents : product.priceCents) + Number(design?.priceAdjustmentCents || 0) + (item.customize ? Number(product.customizationPriceCents ?? 1000) : 0),
      customizationPriceCents: Number(product.customizationPriceCents ?? 1000),
      maxQuantity,
      quantity: Math.min(item.quantity, maxQuantity),
      variantLabel: variant ? [variant.label, variant.color, variant.size].filter(Boolean).join(" · ") : "",
      imageUrl: product.designOptions?.find((option) => option.label === item.design)?.imageUrl || product.imageUrl,
      customizationType: product.customizationType || "none",
      spriteX: null,
      spriteY: null,
    };
  });
  if (JSON.stringify(current) !== JSON.stringify(next)) {
    writeStoreCart(next);
    renderStoreCart();
  }
};

document.querySelectorAll(".store-search input[name='q']").forEach((input) => { input.value = storeQuery.get("q") || ""; });

document.querySelector("[data-shop-sort]")?.addEventListener("change", (event) => {
  activeStoreSort = event.currentTarget.value || "featured";
  sortStoreProducts();
});

const loadPublishedStoreProducts = async () => {
  const root = document.querySelector("[data-shop-catalog-grid]");
  if (!root) return;
  const loading = document.querySelector("[data-shop-catalog-loading]");
  const empty = document.querySelector("[data-shop-empty-filter]");
  root.replaceChildren();
  root.setAttribute("aria-busy", "true");
  try {
    const response = await fetch("/team-review/api/products", { headers: { accept: "application/json" } });
    if (!response.ok) throw new Error("catalog unavailable");
    const result = await response.json();
    if (!Array.isArray(result?.products)) throw new Error("catalog unavailable");
    const products = result.products;
    reconcileStoreCartWithProducts(products);
    const featuredSlugs = ["dog-calming-diffuser", "dog-calming-room-spray", "treat-holding-play-ball", "dental-chew-sticks", "everyday-dog-wipes", "custom-photo-projection-light"];
    root.append(...products.map((product, index) => {
      const rank = featuredSlugs.indexOf(product.slug);
      return createDynamicProductCard(product, rank === -1 ? featuredSlugs.length + index : rank);
    }));
    sortStoreProducts();
    applyStoreFilter();
  } catch {
    if (empty) {
      empty.hidden = false;
      empty.textContent = "Products are temporarily unavailable. Please try again shortly.";
    }
  } finally {
    root.setAttribute("aria-busy", "false");
    if (loading) loading.hidden = true;
  }
};

const reconcileCheckoutCart = async () => {
  if (!document.querySelector("[data-shop-checkout-full]")) return;
  try {
    const response = await fetch("/team-review/api/products", { headers: { accept: "application/json" } });
    if (!response.ok) return;
    const result = await response.json();
    if (Array.isArray(result?.products)) reconcileStoreCartWithProducts(result.products);
  } catch {}
};

const renderProductMedia = (root, product) => {
  const viewer = root.querySelector("[data-product-image-frame]");
  const thumbnails = root.querySelector("[data-product-thumbnails]");
  root.querySelector("[data-media-caption]")?.remove();
  const media = Array.isArray(product.media) && product.media.length ? product.media.filter(item => !item.url?.startsWith("/team-review/assets/product-story-")) : [{ id: "primary", kind: "image", url: product.imageUrl }];
  if(combinedProductPhotos[product.slug]&&!media.some(item=>item.url===combinedProductPhotos[product.slug]))media.unshift({id:"combined-product-photo",kind:"image",url:combinedProductPhotos[product.slug],alt:product.title});
  let caption = null;
  if (product.mediaCaption || media.some((item) => item.caption)) {
    caption = document.createElement("p");
    caption.dataset.mediaCaption = "";
    caption.className = "product-media-caption";
    thumbnails.after(caption);
  }
  const mediaCaption = (item) => item.caption || product.mediaCaption || "";
  let selectedIndex = 0;
  let zoom = null;
  const openImage = () => {
    if (media[selectedIndex].kind === "video") return;
    if (!zoom) {
      zoom = document.createElement("dialog");
      zoom.className = "product-media-zoom";
      zoom.setAttribute("aria-label", `${product.title} image viewer`);
      const close = document.createElement("button");
      close.type = "button";
      close.className = "product-media-zoom-close";
      close.textContent = "Close ×";
      close.addEventListener("click", () => zoom.close());
      const image = document.createElement("img");
      image.onload = () => { image.style.maxWidth = `${image.naturalWidth}px`; image.style.marginInline = "auto"; };
      const note = document.createElement("p");
      note.className = "product-media-caption";
      const controls = document.createElement("div");
      controls.className = "product-media-zoom-controls";
      const images = media.filter((item) => item.kind !== "video");
      const step = (direction) => {
        const current = images.indexOf(media[selectedIndex]);
        const next = images[(current + direction + images.length) % images.length];
        show(next);
        image.src = next.url;
        image.alt = next.alt || product.title;
        note.textContent = mediaCaption(next);
      };
      [-1, 1].forEach((direction) => {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = direction < 0 ? "← Previous" : "Next →";
        button.disabled = images.length < 2;
        button.addEventListener("click", () => step(direction));
        controls.append(button);
      });
      zoom.append(close, image, note, controls);
      zoom.addEventListener("click", (event) => { if (event.target === zoom) zoom.close(); });
      zoom.addEventListener("keydown", (event) => {
        if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
          event.preventDefault();
          step(event.key === "ArrowLeft" ? -1 : 1);
        }
      });
      root.append(zoom);
    }
    const image = zoom.querySelector("img");
    image.src = media[selectedIndex].url;
    image.alt = media[selectedIndex].alt || product.title;
    zoom.querySelector("p").textContent = mediaCaption(media[selectedIndex]);
    zoom.showModal();
  };
  const show = (item) => {
    selectedIndex = media.indexOf(item);
    if (caption) caption.textContent = mediaCaption(item);
    viewer.querySelector("video")?.pause();
    viewer.replaceChildren();
    const element = item.kind === "video" ? document.createElement("video") : document.createElement("img");
    element.src = item.url;
    if (item.kind === "video") {
      element.controls = true;
      element.playsInline = true;
      element.preload = "metadata";
      if (item.poster) element.poster = item.poster;
      element.setAttribute("aria-label", item.alt || `${product.title} demonstration`);
      viewer.removeAttribute("tabindex");
      viewer.removeAttribute("role");
      viewer.removeAttribute("aria-label");
    } else {
      element.alt = item.alt || product.title;
      element.onload = () => {
        element.style.maxWidth = `${element.naturalWidth}px`;
        element.style.marginInline = "auto";
        viewer.classList.toggle("is-low-resolution", element.naturalWidth < 640);
      };
      viewer.tabIndex = 0;
      viewer.setAttribute("role", "button");
      viewer.setAttribute("aria-label", "Enlarge product image");
    }
    viewer.append(element);
    viewer.hidden = false;
    thumbnails.querySelectorAll("button").forEach((button) => {
      const active = button.dataset.mediaId === item.id;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
  };
  viewer.onclick = (event) => { if (event.target.tagName !== "VIDEO") openImage(); };
  viewer.onkeydown = (event) => {
    if (event.target === viewer && (event.key === "Enter" || event.key === " ")) {
      event.preventDefault();
      openImage();
    }
  };
  thumbnails.replaceChildren(...media.map((item, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.mediaId = item.id;
    button.setAttribute("aria-label", `${item.kind === "video" ? "Play video" : "View image"} ${index + 1}`);
    const preview = item.kind === "video" ? document.createElement("span") : document.createElement("img");
    if (item.kind === "video") { preview.className = "product-video-icon"; preview.textContent = "▶"; }
    else { preview.src = item.url; preview.alt = ""; preview.width = 80; preview.height = 80; preview.loading = "eager"; }
    button.append(preview);
    button.addEventListener("click", () => {
      show(item);
      if (item.kind === "video") viewer.scrollIntoView({ block: "center", behavior: "smooth" });
    });
    return button;
  }));
  show(media.find((item) => item.kind === "image") || media[0]);
};

const starText = (rating) => `${"★".repeat(Math.round(rating))}${"☆".repeat(5 - Math.round(rating))}`;
const reviewToken = new URLSearchParams(window.location.hash.slice(1)).get("review") || "";
if (reviewToken) history.replaceState(null, "", window.location.pathname + window.location.search + "#product-reviews");
const loadProductReviews = async (slug) => {
  const summary = document.querySelector("[data-review-summary]");
  const top = document.querySelector("[data-product-rating]");
  const list = document.querySelector("[data-review-list]");
  const open = document.querySelector("[data-review-open]");
  const overview = document.querySelector(".product-review-overview");
  if (!summary || !list) return;
  if (open) open.hidden = true;
  try {
    const response = await fetch(`/team-review/api/product-reviews?slug=${encodeURIComponent(slug)}`, { headers: { accept: "application/json", ...(reviewToken ? { "x-product-review-token": reviewToken } : {}) } });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Reviews could not be loaded.");
    const reviews = result.reviews || [];
    const count = reviews.length;
    const verifiedReviews = reviews.filter((review) => review.verifiedPurchase === true);
    const verifiedCount = verifiedReviews.length;
    const verifiedAverage = verifiedCount ? verifiedReviews.reduce((sum, review) => sum + Number(review.rating), 0) / verifiedCount : 0;
    if (overview) overview.hidden = !verifiedCount;
    const average = verifiedAverage;
    summary.replaceChildren();
    if (verifiedCount) {
      const score = document.createElement("strong");
      score.textContent = average.toFixed(1) + " / 5";
      summary.append(score);
    }
    const stars = document.createElement("span");
    stars.className = "review-stars";
    stars.textContent = verifiedCount ? starText(average) : "";
    const caption = document.createElement("span");
    caption.textContent = count ? `${count} ${count === 1 ? "review" : "reviews"} · ${verifiedCount} verified ${verifiedCount === 1 ? "purchase" : "purchases"}` : "No ratings yet";
    if (verifiedCount) summary.append(stars);
    summary.append(caption);
    const distribution = document.querySelector("[data-review-distribution]");
    distribution.replaceChildren(...[5, 4, 3, 2, 1].map((rating) => {
      const row = document.createElement("div");
      row.className = "review-distribution-row";
      const label = document.createElement("span");
      label.textContent = rating + " ★";
      const meter = document.createElement("meter");
      meter.min = 0; meter.max = verifiedCount || 1;
      meter.value = verifiedReviews.filter((review) => Number(review.rating) === rating).length;
      meter.setAttribute("aria-label", rating + " star verified-purchase reviews");
      const number = document.createElement("span");
      number.textContent = meter.value;
      row.append(label, meter, number);
      return row;
    }));
    if (top) { top.hidden = !verifiedCount; top.textContent = verifiedCount ? `${starText(verifiedAverage)} ${verifiedAverage.toFixed(1)} (${verifiedCount}) · Verified purchases` : ""; }
    const toolbar = document.querySelector("[data-review-toolbar]");
    toolbar.hidden = !count;
    document.querySelector("[data-review-count]").textContent = count + (count === 1 ? " review" : " reviews");
    const sort = document.querySelector("[data-review-sort]");
    const render = () => {
      if (!count) {
        list.innerHTML = '<div class="product-review-empty"><h3>Share your experience</h3><p>No customer reviews yet. Bought this product? Use the review link in your order email to share an honest rating, fit notes and everyday experience. All star ratings are welcome.</p></div>';
        return;
      }
      const sorted = [...reviews].sort((a, b) => {
        switch (sort.value) {
          case "highest": return b.rating - a.rating;
          case "lowest": return a.rating - b.rating;
          default: return new Date(b.createdAt) - new Date(a.createdAt);
        }
      });
      list.replaceChildren(...sorted.map((review) => {
        const article = document.createElement("article");
        article.className = "product-review-card";
        const heading = document.createElement("div");
        const name = document.createElement("strong");
        name.textContent = review.displayName;
        const stars = document.createElement("span");
        stars.textContent = starText(review.rating);
        heading.append(name, stars);
        const verified = review.verifiedPurchase === true ? document.createElement("small") : null;
        if (verified) verified.textContent = "Verified purchase";
        const date = document.createElement("time");
        if (review.createdAt) { date.dateTime = review.createdAt; date.textContent = (verified ? " · " : "") + new Date(review.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", ...(/^\d{4}-\d{2}-\d{2}$/.test(review.createdAt) ? { timeZone: "UTC" } : {}) }); }
        const body = document.createElement("p");
        body.textContent = review.reviewText;
        article.append(heading);
        if (verified) article.append(verified);
        article.append(date, body);
        return article;
      }));
    };
    sort.onchange = render;
    render();
    if (open) open.hidden = !result.canReview;
    if (reviewToken && !result.canReview) document.querySelector("[data-review-access]").textContent = "This review link is unavailable or has already been used.";
  } catch (error) {
    console.error("Product reviews:", error);
    if (overview) overview.hidden = true;
    if (top) top.hidden = true;
    document.querySelector("[data-review-toolbar]").hidden = true;
    list.innerHTML = '<p class="product-review-empty">Reviews are temporarily unavailable.</p>';
  }
};
document.querySelector("[data-review-open]")?.addEventListener("click", () => document.querySelector("[data-review-dialog]").showModal());
document.querySelector("[data-review-close]")?.addEventListener("click", () => document.querySelector("[data-review-dialog]").close());

const renderProductContent = (root, product) => {
  document.querySelector("[data-product-story]")?.remove();
  document.querySelector("[data-product-section-nav]")?.remove();
  const story = document.createElement("div");
  story.dataset.productStory = "";
  const navigation = document.createElement("nav");
  navigation.className = "product-section-nav";
  navigation.dataset.productSectionNav = "";
  navigation.setAttribute("aria-label", "Product information");
  const groups = [
    ["feature", "product-description", "Overview", "Why you'll love it"],
    ["demonstration", "product-demonstration", "Use & care", "How it works"],
    ["specifications", "product-specifications", "Details", "Product specifications"],
    ["faq", "product-questions", "FAQs", "Your questions, answered"],
  ];
  const addLink = (id, label) => {
    const link = document.createElement("a");
    link.href = `#${id}`;
    link.textContent = label;
    navigation.append(link);
  };
  const chunks = [];
  const sections = (product.content || []).filter((section) => section.visible !== false);
  // Keep the existing catalog's standard structure until a team saves an explicit layout.
  if (!sections.some((section) => section.layout)) sections.sort((a, b) => groups.findIndex((group) => group[0] === (a.type || "feature")) - groups.findIndex((group) => group[0] === (b.type || "feature")));
  sections.forEach((section) => {
    const type = section.type || "feature";
    if (chunks.at(-1)?.type !== type) chunks.push({ type, sections: [] });
    chunks.at(-1).sections.push(section);
  });
  const seen = new Map();
  chunks.forEach(({ type, sections }) => {
    const [, baseId, label, title] = groups.find((group) => group[0] === type);
    const occurrence = (seen.get(type) || 0) + 1;
    seen.set(type, occurrence);
    const id = occurrence === 1 ? baseId : `${baseId}-${occurrence}`;
    if (occurrence === 1) addLink(id, label);
    const group = document.createElement("section");
    group.className = `product-story-section product-story-${type}`;
    group.id = id;
    const wrap = document.createElement("div");
    wrap.className = "wrap";
    const heading = document.createElement("h2");
    const useSectionHeading = type === "feature" || occurrence > 1 || (type !== "faq" && sections.length === 1);
    heading.textContent = useSectionHeading ? sections[0].heading : title;
    const integratedHeading = type === "feature" && Boolean(sections[0].mediaId);
    if (!integratedHeading) wrap.append(heading);
    const blocks = document.createElement("div");
    blocks.className = "product-story-blocks";
    sections.forEach((section, index) => {
      const article = document.createElement(type === "faq" ? "details" : "article");
      article.className = "product-story-block";
      article.classList.add(`layout-${section.layout || "auto"}`);
      if (type === "feature" && index === 0) article.classList.add("is-lead");
      if (type === "faq" && index === 0) article.open = true;
      const copy = document.createElement("div");
      copy.className = "product-story-copy";
      const heading = document.createElement(type === "faq" ? "summary" : integratedHeading && index === 0 ? "h2" : "h3");
      heading.textContent = section.heading;
      if (type === "faq") article.append(heading);
      else if (!(useSectionHeading && index === 0) || integratedHeading) copy.append(heading);
      switch (type) {
        case "specifications": {
          const list = document.createElement("dl");
          list.className = "product-spec-list";
          section.text.split("\n").filter((line) => line.trim()).forEach((line) => {
            const separator = line.indexOf(":");
            const row = document.createElement("div");
            const term = document.createElement("dt");
            const value = document.createElement("dd");
            term.textContent = separator < 0 ? "Detail" : line.slice(0, separator).trim();
            value.textContent = separator < 0 ? line.trim() : line.slice(separator + 1).trim();
            row.append(term, value);
            list.append(row);
          });
          copy.append(list);
          break;
        }
        case "demonstration": {
          const steps = document.createElement("ol");
          steps.className = "product-demo-steps";
          section.text.split(/\n+/).filter((line) => line.trim()).forEach((text) => {
            const step = document.createElement("li");
            step.textContent = text;
            steps.append(step);
          });
          copy.append(steps);
          break;
        }
        default:
          section.text.split(/\n\s*\n/).filter(Boolean).forEach((text) => {
            const paragraph = document.createElement("p");
            paragraph.textContent = text;
            copy.append(paragraph);
          });
      }
      const media = product.media?.find((item) => item.id === section.mediaId);
      const mobileMedia = product.media?.find((item) => item.id === section.mobileMediaId && item.kind === "image");
      const isLead = type === "feature" && index === 0;
      const copyFirst = isLead || section.layout === "full-width" || section.layout === "gallery";
      if (copyFirst) article.append(copy);
      const addAsset = (media, target, mobileMedia) => {
        const asset = document.createElement(media.kind === "video" ? "video" : "img");
        asset.src = media.url;
        if (media.kind === "video") { asset.controls = true; asset.playsInline = true; asset.preload = "metadata"; }
        else { asset.alt = media.alt || section.heading; asset.loading = "lazy"; asset.onload = () => { asset.style.maxWidth = `${asset.naturalWidth}px`; asset.style.marginInline = "auto"; }; }
        if (media.kind === "image" && mobileMedia) {
          const picture = document.createElement("picture");
          const source = document.createElement("source");
          source.media = "(min-width: 761px)";
          source.srcset = media.url;
          asset.src = mobileMedia.url;
          picture.append(source, asset);
          target.append(picture);
          article.classList.add("has-responsive-media");
        } else target.append(asset);
      };
      if (section.layout === "gallery") {
        const gallery = document.createElement("div");
        gallery.className = "product-story-gallery";
        section.mediaIds.forEach((id) => {
          const item = product.media?.find((item) => item.id === id);
          if (!item) return;
          const frame = document.createElement(item.kind === "image" ? "a" : "div");
          if (item.kind === "image") { frame.href = item.url; frame.target = "_blank"; frame.rel = "noopener"; frame.setAttribute("aria-label", `View ${section.heading} photo`); }
          addAsset(item, frame);
          gallery.append(frame);
        });
        article.append(gallery);
        article.classList.add("has-media");
      } else if (media) {
        addAsset(media, article, mobileMedia);
        article.classList.add("has-media");
      }
      if (!copyFirst) article.append(copy);
      blocks.append(article);
    });
    wrap.append(blocks);
    group.append(wrap);
    story.append(group);
  });
  if (!product.previewOnly) addLink("product-reviews", "Reviews");
  root.after(navigation, story);
};

const shopEmailStateKey = "woafmeow-shop-email-session";
const saveShopEmailState = (state) => {
  try { sessionStorage.setItem(shopEmailStateKey, JSON.stringify(state)); } catch {}
};
const restoreShopEmailForm = (form) => {
  let state;
  try { state = JSON.parse(sessionStorage.getItem(shopEmailStateKey) || "null"); } catch { return; }
  if (!state) return;
  form.querySelector("[name='email']").value = state.email;
  form.querySelector("[name='consent']").checked = state.consent;
  if (!state.saved) return;
  form.dataset.shopEmailSaved = "true";
  const button = form.querySelector("button[type='submit']");
  button.textContent = "Subscribed";
  button.disabled = true;
  form.querySelectorAll("input").forEach((input) => { input.disabled = true; });
  form.querySelector("[data-shop-email-note]").textContent = state.message + (state.coupon && form.dataset.shopEmailForm === "memorial-offer" ? ` Your code: ${state.coupon}.` : "");
};
document.querySelectorAll("[data-shop-email-form]").forEach(restoreShopEmailForm);
["input", "change"].forEach((type) => document.addEventListener(type, (event) => {
  const form = event.target.closest("[data-shop-email-form]");
  if (!form || form.dataset.shopEmailSaved || form.dataset.shopEmailPending) return;
  saveShopEmailState({ email: form.querySelector("[name='email']").value, consent: form.querySelector("[name='consent']").checked });
}));

const showFirstVisitMemorialOffer = () => {
  if (!/^\/team-review\/shop\/(?:$|product\/)/.test(window.location.pathname)) return;
  const key = "woafmeow-memorial-offer-seen";
  const replay = new URLSearchParams(window.location.search).get("offer-preview") === "1";
  try { if (localStorage.getItem(key) && !replay) return; } catch {}
  const dialog = document.createElement("dialog");
  dialog.className = "memorial-offer-dialog";
  dialog.setAttribute("aria-labelledby", "memorial-offer-title");
  dialog.setAttribute("aria-describedby", "memorial-offer-copy");
  const close = document.createElement("button");
  close.type = "button";
  close.className = "memorial-offer-close";
  close.setAttribute("aria-label", "Close offer");
  close.textContent = "×";
  const logo = document.createElement("img");
  logo.className = "memorial-offer-logo";
  logo.src = "/team-review/assets/woafypet-orange-logo.webp";
  logo.alt = "WoafyPet";
  logo.width = 512;
  logo.height = 64;
  const heading = document.createElement("h2");
  heading.id = "memorial-offer-title";
  heading.textContent = "Welcome offer: 15% off";
  const copy = document.createElement("p");
  copy.id = "memorial-offer-copy";
  copy.textContent = "Sign up for 15% off everyday care and comfort for your pet.";
  const form = document.createElement("form");
  form.dataset.shopEmailForm = "memorial-offer";
  form.className = "shop-email-form";
  const emailLabel = document.createElement("label");
  const emailCaption = document.createElement("span");
  emailCaption.textContent = "Email address";
  const email = document.createElement("input");
  email.name = "email";
  email.type = "email";
  email.autocomplete = "email";
  email.placeholder = "you@example.com";
  email.required = true;
  email.maxLength = 254;
  emailLabel.append(emailCaption, email);
  const consentLabel = document.createElement("label");
  consentLabel.className = "shop-email-consent";
  const consent = document.createElement("input");
  consent.name = "consent";
  consent.type = "checkbox";
  consent.required = true;
  const consentCaption = document.createElement("span");
  consentCaption.textContent = "Email me WoafyPet offers and updates.";
  consentLabel.append(consent, consentCaption);
  const submit = document.createElement("button");
  submit.type = "submit";
  submit.className = "button primary";
  submit.textContent = "Sign up for 15% off";
  const note = document.createElement("p");
  note.dataset.shopEmailNote = "";
  note.className = "form-note";
  note.setAttribute("role", "status");
  form.append(emailLabel, consentLabel, submit, note);
  restoreShopEmailForm(form);
  close.onclick = () => dialog.close();
  dialog.addEventListener("click", (event) => { if (event.target === dialog) { const rect = dialog.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close(); } });
  dialog.addEventListener("close", () => dialog.remove());
  dialog.append(close, logo, heading, copy, form);
  document.body.append(dialog);
  dialog.showModal();
  try { localStorage.setItem(key, "1"); } catch {}
};

document.addEventListener("submit", async (event) => {
  const form = event.target.closest("[data-shop-email-form]");
  if (!form) return;
  event.preventDefault();
  if (form.dataset.shopEmailPending || form.dataset.shopEmailSaved) return;
  const button = form.querySelector("button[type='submit']");
  const note = form.querySelector("[data-shop-email-note]");
  const original = button.textContent;
  const state = { email: form.querySelector("[name='email']").value, consent: form.querySelector("[name='consent']").checked };
  saveShopEmailState(state);
  form.dataset.shopEmailPending = "true";
  form.setAttribute("aria-busy", "true");
  button.disabled = true;
  button.textContent = "Signing up…";
  note.textContent = "Saving your subscription. Please wait…";
  form.querySelectorAll("input").forEach((input) => { input.disabled = true; });
  try {
    const response = await fetch("/team-review/api/shop-newsletter", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...state, source: form.dataset.shopEmailForm }) });
    const result = await response.json();
    if (!response.ok || !result.saved) throw new Error(result.error || "Your email was not saved. Please try again.");
    saveShopEmailState({ ...state, saved: true, message: result.message, coupon: result.coupon });
    document.querySelectorAll("[data-shop-email-form]").forEach(restoreShopEmailForm);
    form.dataset.shopEmailSaved = "true";
    note.textContent = result.message + (result.coupon && form.dataset.shopEmailForm === "memorial-offer" ? ` Your code: ${result.coupon}.` : "");
    button.textContent = "Subscribed";
  } catch (error) {
    note.textContent = error.message;
    button.textContent = original;
    button.disabled = false;
    form.querySelectorAll("input").forEach((input) => { input.disabled = false; });
  } finally {
    delete form.dataset.shopEmailPending;
    form.setAttribute("aria-busy", "false");
  }
});

const renderProductVariants = (root, variants, slug) => {
  if (!variants.length) return null;
  const active = variants.filter((variant) => variant.active !== false);
  const picker = document.createElement("div");
  picker.className = "product-variant-picker";
  const select = document.createElement("select");
  select.dataset.productVariant = "";
  select.append(new Option("Choose an option", ""));
  active.forEach((variant) => {
    const name = [variant.color, variant.size].filter(Boolean).join(" / ") || variant.label;
    const option = new Option(`${name} — ${storeMoney(variant.priceCents)}${variant.stockQuantity === 0 ? " — Sold out" : ""}`, variant.id);
    option.disabled = variant.stockQuantity === 0;
    option.dataset.label = name;
    select.append(option);
  });
  const axes = ["color", "size"].filter((axis) => active.length && active.every((variant) => variant[axis]));
  const keys = active.map((variant) => JSON.stringify(axes.map((axis) => variant[axis])));
  const split = axes.length && new Set(keys).size === active.length;
  if (split) {
    select.hidden = true;
    const chosen = {};
    const controls = [];
    const refresh = () => {
      const variant = active.find((item) => axes.every((axis) => item[axis] === chosen[axis]));
      select.value = variant && variant.stockQuantity !== 0 ? variant.id : "";
      controls.forEach(({ axis, value, button }) => {
        const available = active.some((item) => item[axis] === value && item.stockQuantity !== 0 && (axis === "color" || !chosen.color || item.color === chosen.color));
        button.disabled = !available;
        button.setAttribute("aria-pressed", String(chosen[axis] === value));
      });
    };
    axes.forEach((axis) => {
      const group = document.createElement("fieldset");
      const legend = document.createElement("legend");
      const isBrace = slug === "adjustable-rear-leg-support-brace";
      legend.textContent = axis === "color" ? (isBrace ? "Rear leg" : "Color") : (isBrace ? "Weight category" : "Size");
      const options = document.createElement("div");
      options.className = "product-option-buttons";
      [...new Set(active.map((item) => item[axis]))].forEach((value) => {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = value;
        button.onclick = () => {
          chosen[axis] = value;
          if (axis === "color" && chosen.size && !active.some((item) => item.color === value && item.size === chosen.size && item.stockQuantity !== 0)) delete chosen.size;
          refresh();
          root.dispatchEvent(new Event("change", { bubbles: true }));
        };
        controls.push({ axis, value, button });
        options.append(button);
      });
      group.append(legend, options);
      picker.append(group);
    });
    refresh();
    picker.append(select);
  } else {
    const label = document.createElement("label");
    const caption = document.createElement("span");
    caption.textContent = "Choose an option";
    label.append(caption, select);
    picker.append(label);
  }
  root.querySelector("[data-product-customization]").before(picker);
  return select;
};

const loadStoreProductPage = async () => {
  const root = document.querySelector("[data-store-product-page]");
  if (!root) return;
  const quantity = root.querySelector("[data-product-quantity]");
  const add = root.querySelector("[data-add-cart]");
  const status = root.querySelector("[data-product-status]");
  const retry = root.querySelector("[data-product-retry]");
  const reviews = document.querySelector(".product-reviews-section");
  const purchaseNote = root.querySelector(".product-purchase-note");
  const mobilePurchase = root.querySelector("[data-product-mobile-purchase]");
  if (mobilePurchase) mobilePurchase.hidden = true;
  root.setAttribute("aria-busy", "true");
  add.disabled = true;
  quantity.disabled = true;
  if (status) status.hidden = true;
  if (retry) { retry.disabled = true; retry.textContent = "Loading…"; retry.onclick = loadStoreProductPage; }
  const slug = new URLSearchParams(window.location.search).get("slug") || "";
  let product = null;
  let unavailable = false;
  try {
    const response = await fetch("/team-review/api/products", { headers: { accept: "application/json" } });
    if (!response.ok) throw new Error("catalog unavailable");
    const result = await response.json();
    if (!Array.isArray(result?.products)) throw new Error("catalog unavailable");
    reconcileStoreCartWithProducts(result.products);
    product = result.products.find((item) => item.slug === slug) || null;
  } catch {
    unavailable = true;
  } finally {
    root.setAttribute("aria-busy", "false");
    if (retry) { retry.disabled = false; retry.textContent = "Try again"; retry.hidden = !unavailable; }
  }
  if (!product) {
    root.querySelector("[data-product-title]").textContent = unavailable ? "Unable to load this product" : "Product not found";
    root.querySelector("[data-product-description]").textContent = unavailable ? "Product details are temporarily unavailable." : "This product may be hidden or no longer available.";
    root.querySelector(".product-buy-row").hidden = true;
    root.querySelector(".product-included-block").hidden = true;
    if (purchaseNote) purchaseNote.hidden = true;
    if (reviews) reviews.hidden = true;
    if (status) { status.hidden = false; status.textContent = unavailable ? "Please try again. Your cart has not been changed." : "Return to the Shop to choose another product."; }
    return;
  }
  root.querySelector(".product-buy-row").hidden = false;
  if (purchaseNote) purchaseNote.hidden = false;
  if (reviews) reviews.hidden = false;
  const priceCents = Number(product.priceCents || 0);
  const imageUrl = product.imageUrl || "";
  const title = product.title || "Product";
  document.title = `${title} | WoafyPet`;
  document.querySelector('meta[name="description"]')?.setAttribute("content", product.shortDescription || "");
  const details = Array.isArray(product.details) ? product.details : [];
  const merchandising = product.merchandising || {};
  root.querySelector("[data-product-title]").textContent = ({"four-paw-anti-slip-dog-socks":"Four-Paw Grip Socks","cushioned-dog-elbow-sleeves":"Cushioned Elbow Sleeves","adjustable-folding-dog-ramp":"Folding Dog Ramp","adjustable-rear-leg-support-brace":"Rear-Leg Support Brace","custom-photo-projection-light":"Dog Photo Projection Light"})[product.slug] || title;
  root.querySelector("[data-product-price]").textContent = storeMoney(priceCents);
  root.querySelector("[data-product-description]").textContent = product.shortDescription || "";
  renderProductMedia(root, product);
  const included = Array.isArray(merchandising.included) && merchandising.included.length ? merchandising.included : details;
  root.querySelector("[data-product-details]").replaceChildren(...included.slice(0, 3).map((detail) => {
    const item = document.createElement("li");
    item.textContent = detail;
    return item;
  }));
  const includedBlock = root.querySelector(".product-included-block");
  if (includedBlock) includedBlock.hidden = !included.length;
  if (product.previewOnly) {
    root.dataset.productPreview = "true";
    root.querySelector("[data-product-price]").hidden = true;
    root.querySelector(".product-buy-row").hidden = true;
    if (purchaseNote) purchaseNote.hidden = true;
    if (reviews) reviews.hidden = true;
    if (status) {
      status.hidden = false;
      status.className = "product-preview-notice";
      status.textContent = "Not available to order yet. Final specifications and pricing will be published before launch.";
    }
    renderProductContent(root, product);
    document.title = `${title} — Preview | WoafyPet`;
    return;
  }
  add.dataset.productSlug = product.slug;
  add.dataset.productTitle = title;
  add.dataset.productPrice = String(priceCents);
  add.dataset.productImage = imageUrl;
  add.dataset.customizationType = product.customizationType || "none";
  add.dataset.customizationPrice = String(product.customizationPriceCents ?? 1000);
  add.disabled = false;
  const variants = product.variants || [];
  const variantSelect = renderProductVariants(root, variants, product.slug);
  const options = root.querySelector(".product-configurator");
  if (mobilePurchase && options && typeof IntersectionObserver === "function") {
    root._mobilePurchaseObserver?.disconnect();
    mobilePurchase.classList.add("is-before-options");
    root._mobilePurchaseObserver = new IntersectionObserver(([entry]) => {
      mobilePurchase.classList.toggle("is-before-options", entry.boundingClientRect.bottom > 0);
    });
    root._mobilePurchaseObserver.observe(options);
  }
  const updateSelection = () => {
    const variant = variants.find((item) => item.id === variantSelect?.value);
    const choice = root.querySelector('input[name="productDesign"]:checked');
    const customize = choice ? choice.value === "custom" : Boolean(root.querySelector("[data-product-customize]")?.checked);
    const design = product.designOptions?.find((item) => item.label === choice?.value);
    const unitPrice = Number(variant ? variant.priceCents : priceCents) + Number(design?.priceAdjustmentCents || 0) + (customize ? Number(product.customizationPriceCents ?? 1000) : 0);
    add.dataset.productPrice = String(unitPrice);
    root.querySelector("[data-product-price]").textContent = storeMoney(unitPrice);
    const mobilePrice = root.querySelector("[data-product-mobile-price]");
    if (mobilePrice) mobilePrice.textContent = storeMoney(unitPrice);
    const maximum = Math.min(product.maxQuantity || 8, (variant ? variant.stockQuantity : product.stockQuantity) ?? 100);
    const previousQuantity = Number(quantity.value || 1);
    quantity.replaceChildren(...Array.from({ length: maximum }, (_, index) => new Option(String(index + 1))));
    quantity.value = String(Math.min(previousQuantity, maximum));
    quantity.disabled = maximum === 0;
    add.dataset.maxQuantity = String(maximum);
    add.disabled = maximum === 0 || (variants.length > 0 && !variant);
    if (mobilePurchase) mobilePurchase.hidden = maximum === 0;
    add.textContent = maximum === 0 ? "Sold out" : "Add to cart";
  };
  root.addEventListener("change", updateSelection);
  const customization = root.querySelector("[data-product-customization]");
  const customizationType = product.customizationType || "none";
  const designOptions = Array.isArray(product.designOptions) ? product.designOptions : [];
  if (customization && (customizationType !== "none" || designOptions.length)) {
    customization.hidden = false;
    const customName = product.customizationLabel || "Customize this product";
    const customPrice = `+${storeMoney(product.customizationPriceCents ?? 1000)}`;
    customization.querySelector(".product-customization-toggle strong").textContent = customName;
    customization.querySelector(".product-customization-toggle b").textContent = customPrice;
    if (designOptions.length) {
      customization.querySelector(".product-customization-toggle").hidden = true;
      const choices = document.createElement("fieldset");
      choices.className = "product-design-options";
      choices.dataset.productDesignList = "";
      const legend = document.createElement("legend");
      legend.textContent = "Choose a design";
      choices.append(legend);
      const hasBreedArtwork = product.slug === "custom-photo-projection-light" && designOptions.some((option) => Number.isInteger(option.artworkIndex));
      let designList = choices;
      let breedSummary;
      if (hasBreedArtwork) {
        const browser = document.createElement("details");
        browser.className = "product-breed-picker";
        breedSummary = document.createElement("summary");
        breedSummary.textContent = `Browse ${designOptions.length} breed designs`;
        designList = document.createElement("div");
        designList.className = "product-breed-grid";
        browser.append(breedSummary, designList);
        choices.append(browser);
      }
      designOptions.forEach((option) => {
        const label = document.createElement("label");
        const input = document.createElement("input");
        input.type = "radio";
        input.name = "productDesign";
        input.value = option.label;
        const name = document.createElement("span");
        name.textContent = option.label + (option.priceAdjustmentCents ? ` +${storeMoney(option.priceAdjustmentCents)}` : "");
        label.append(input);
        if (hasBreedArtwork && Number.isInteger(option.artworkIndex)) {
          const art = document.createElement("span");
          art.className = "product-breed-art";
          art.setAttribute("aria-hidden", "true");
          art.style.backgroundPosition = `${(40 + option.artworkIndex % 4 * 195) / 640 * 100}% ${(183 + Math.floor(option.artworkIndex / 4) * 204) / 1314 * 100}%`;
          label.append(art);
        } else if (option.imageUrl) {
          const image = document.createElement("img");
          image.src = option.imageUrl;
          image.alt = "";
          label.append(image);
        }
        label.append(name);
        designList.append(label);
      });
      if (customizationType !== "none") {
        const label = document.createElement("label");
        const input = document.createElement("input");
        input.type = "radio";
        input.name = "productDesign";
        input.value = "custom";
        const name = document.createElement("span");
        name.textContent = `${customName} ${customPrice}`;
        label.append(input, name);
        choices.append(label);
      }
      customization.prepend(choices);
      choices.addEventListener("change", (event) => {
        const selected = event.target.value;
        if (breedSummary) {
          breedSummary.textContent = selected === "custom" ? `Browse ${designOptions.length} breed designs` : `${selected} — change design`;
          breedSummary.parentElement.open = false;
          breedSummary.focus();
        }
        root.querySelector("[data-product-customization-fields]").hidden = selected !== "custom";
        root.querySelector("[data-product-status]").hidden = true;
        const imageUrl = designOptions.find((option) => option.label === selected)?.imageUrl;
        if (imageUrl) root.querySelector(`[data-media-id="${imageUrl.split("/team-review/").pop()}"]`)?.click();
      });
    }
    root.querySelector("[data-customization-name]").hidden = customizationType === "none";
    root.querySelector("[data-customization-name] span").textContent = customizationType === "photo" ? "Dog's name (optional) · up to 10 characters" : "Dog's name · up to 10 characters";
    root.querySelector("[data-customization-photo]").hidden = !(customizationType === "photo" || customizationType === "name_photo");
    const shapes = product.customizationShapes || [];
    if (shapes.length) {
      root.querySelector("[data-customization-shape]").hidden = false;
      const select = root.querySelector("[data-customization-shape-input]");
      select.replaceChildren(new Option("Choose a shape", ""), ...shapes.map((shape) => new Option(shape, shape)));
    }
  }
  updateSelection();
  renderProductContent(root, product);
  if (status) { status.hidden = true; status.textContent = ""; }
  loadProductReviews(product.slug);
  document.dispatchEvent(new CustomEvent("woafmeow:commerce", { detail: { name: "view_item", items: [{ slug: product.slug, priceCents: product.priceCents, quantity: 1 }] } }));
};

document.querySelector("[data-product-customize]")?.addEventListener("change", (event) => {
  const fields = document.querySelector("[data-product-customization-fields]");
  if (fields) fields.hidden = !event.currentTarget.checked;
  const status = document.querySelector("[data-product-status]");
  if (status) { status.hidden = true; status.textContent = ""; }
});

document.querySelector("[data-product-review-form]")?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const note = form.querySelector("[data-product-review-note]");
  const button = form.querySelector("button[type='submit']");
  const values = Object.fromEntries(new FormData(form).entries());
  const slug = new URLSearchParams(window.location.search).get("slug") || "";
  if (button) { button.disabled = true; button.textContent = "Posting…"; }
  try {
    const response = await fetch("/team-review/api/product-reviews", { method: "POST", headers: { "content-type": "application/json", accept: "application/json", "x-product-review-token": reviewToken }, body: JSON.stringify({ ...values, slug }) });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || "The review could not be posted.");
    form.reset();
    if (note) note.textContent = result.message;
    await loadProductReviews(slug);
    document.querySelector("[data-review-dialog]")?.close();
  } catch (error) {
    if (note) note.textContent = error.message || "The review could not be posted.";
  } finally {
    if (button) { button.disabled = false; button.textContent = "Post review"; }
  }
});

let shippingQuoteRevision = 0;
let shippingQuoteTimer;
const refreshStoreShipping = async () => {
  const form = document.querySelector("[data-shop-checkout-full]");
  if (!form) return;
  const revision = ++shippingQuoteRevision;
  const values = Object.fromEntries(new FormData(form).entries());
  const cart = readStoreCart();
  const amount = document.querySelector("[data-cart-shipping]");
  const total = document.querySelector(".checkout-summary [data-cart-total]");
  const note = document.querySelector("[data-shipping-note]");
  const retry = document.querySelector("[data-shipping-retry]");
  const postalNote = form.querySelector("[data-shipping-address-note]");
  const postal = form.querySelector("[name='postalCode']");
  const button = form.querySelector("button[type='submit']");
  form.storeShippingReady = false;
  form.storeShippingQuote = null;
  retry.hidden = true;
  button.disabled = true;
  total.textContent = "—";
  postal.setCustomValidity("");
  postal.setAttribute("aria-invalid", "false");
  postalNote.textContent = values.country === "US" ? "U.S. ZIP: 5 digits or ZIP+4." : "Canadian postal code, for example M5V 1A1.";
  if (!cart.length || !String(values.region || "").trim() || !String(values.postalCode || "").trim()) {
    amount.textContent = "Add delivery details";
    note.textContent = cart.length ? "Enter your state or province and postal code to calculate shipping." : "Add a product to calculate shipping.";
    return;
  }
  amount.textContent = "Calculating…";
  note.textContent = "Calculating shipping for your order…";
  try {
    const response = await fetch("/team-review/api/store-checkout", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ quoteOnly: true, country: values.country, region: values.region, postalCode: values.postalCode, coupon: localStorage.getItem(storeCouponKey) || "", items: cart }) });
    const result = await response.json();
    if (revision !== shippingQuoteRevision) return;
    if (!response.ok) {
      if (result.errorField === "postalCode") {
        postalNote.textContent = result.error;
        postal.setCustomValidity(result.error);
        postal.setAttribute("aria-invalid", "true");
      }
      throw new Error(result.error || "Shipping could not be calculated. Please try again.");
    }
    form.storeShippingQuote = result;
    form.storeShippingReady = true;
    amount.textContent = result.shippingCents === 0 ? "Free" : storeMoney(result.shippingCents);
    total.textContent = storeMoney(result.totalCents);
    note.textContent = result.shippingLabel;
    button.disabled = form.storeCheckoutPending === true;
  } catch (error) {
    if (revision !== shippingQuoteRevision) return;
    amount.textContent = "Not calculated";
    note.textContent = error.message || "Shipping could not be calculated. Please try again.";
    retry.hidden = false;
  }
};
const shippingCheckoutForm = document.querySelector("[data-shop-checkout-full]");
document.querySelector("[data-shipping-retry]")?.addEventListener("click", refreshStoreShipping);
["input", "change"].forEach((type) => shippingCheckoutForm?.addEventListener(type, (event) => {
  if (!["country", "region", "postalCode"].includes(event.target.name)) return;
  clearTimeout(shippingQuoteTimer);
  shippingQuoteRevision += 1;
  const form = event.currentTarget;
  form.storeShippingReady = false;
  form.storeShippingQuote = null;
  form.querySelector("[name='postalCode']").setCustomValidity("");
  form.querySelector("button[type='submit']").disabled = true;
  document.querySelector("[data-cart-shipping]").textContent = "Calculating…";
  document.querySelector(".checkout-summary [data-cart-total]").textContent = "—";
  shippingQuoteTimer = setTimeout(refreshStoreShipping, 300);
}));

document.querySelector("[data-shop-promo-form]")?.addEventListener("submit", (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const code = String(new FormData(form).get("coupon") || "").trim().toUpperCase();
  const note = form.querySelector("[data-shop-promo-note]");
  if (code !== "WELCOME15") {
    localStorage.removeItem(storeCouponKey);
    if (note) note.textContent = code ? "That promo code is not valid." : "Enter a promo code.";
  } else {
    localStorage.setItem(storeCouponKey, code);
    if (note) note.textContent = "WELCOME15 applied: 15% off this order.";
  }
  renderStoreCart();
});

document.querySelector("[data-shop-checkout-full]")?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  if (form.storeCheckoutPending) return;
  if (form.storeShippingReady === false) return;
  const cart = readStoreCart();
  const note = form.querySelector("[data-shop-checkout-note]");
  const button = form.querySelector("button[type='submit']");
  if (!cart.length) {
    if (note) note.textContent = "Your cart is empty. Add a product before checkout.";
    return;
  }
  const values = Object.fromEntries(new FormData(form).entries());
  const member = readMember();
  const payload = {
    name: `${values.firstName || ""} ${values.lastName || ""}`.trim(),
    email: values.email,
    phone: values.phone,
    address1: values.address1,
    address2: values.address2,
    city: values.city,
    region: values.region,
    postalCode: values.postalCode,
    country: values.country,
    deliveryNote: values.deliveryNote,
    coupon: localStorage.getItem(storeCouponKey) || "",
    quotedTotalCents: form.storeShippingQuote?.totalCents,
    items: cart.map(({ slug, quantity, customize, dogName, customizationShape, customizationImageId, design, variantId }) => ({ slug, quantity, customize, dogName, customizationShape, customizationImageId, design, variantId })),
    ...(member ? { memberId: member.id, memberToken: member.token } : {}),
  };
  const fingerprint = JSON.stringify([values, payload.coupon, cart]);
  const checkoutUnchanged = () => JSON.stringify([Object.fromEntries(new FormData(form).entries()), localStorage.getItem(storeCouponKey) || "", readStoreCart()]) === fingerprint;
  if (form.storeCheckoutAttempt?.fingerprint !== fingerprint) form.storeCheckoutAttempt = { fingerprint, id: crypto.randomUUID() };
  payload.checkoutAttemptId = form.storeCheckoutAttempt.id;
  form.storeCheckoutPending = true;
  if (button) { button.disabled = true; button.textContent = "Opening secure payment…"; }
  if (note) note.textContent = "Creating your secure checkout session.";
  try {
    payload.analytics = await window.woafmeowAnalyticsIdentity?.() || null;
    if (!checkoutUnchanged()) throw new Error("Your order changed. Review it and continue to secure payment again.");
    const response = await fetch("/team-review/api/store-checkout", { method: "POST", headers: { "content-type": "application/json", accept: "application/json" }, body: JSON.stringify(payload) });
    const isJson = response.headers.get("content-type")?.includes("application/json");
    const result = isJson ? await response.json().catch(() => ({})) : {};
    if (!checkoutUnchanged()) throw new Error("Your order changed. Review it and continue to secure payment again.");
    if (!response.ok || !result.checkoutUrl) {
      if (result.quoteChanged) await refreshStoreShipping();
      const fallback = response.status === 404
        ? "Checkout is not running in this preview. Open the Cloudflare preview or live site and try again."
        : "Secure payment could not be opened. Please try again.";
      throw new Error(result.error || fallback);
    }
    try { sessionStorage.setItem(`woafmeow-checkout-${result.orderId}`, JSON.stringify({ cart, coupon: payload.coupon })); } catch {}
    document.dispatchEvent(new CustomEvent("woafmeow:commerce", { detail: { name: "begin_checkout", items: result.checkoutItems } }));
    window.location.assign(result.checkoutUrl);
  } catch (error) {
    if (note) note.textContent = error.message || "Secure payment could not be opened. Please try again.";
    if (button) { button.disabled = readStoreCart().length === 0 || form.storeShippingReady === false; button.textContent = "Continue to secure payment"; }
  } finally {
    form.storeCheckoutPending = false;
  }
});

const showStoreCheckoutResult = async () => {
  const params = new URLSearchParams(window.location.search);
  const checkoutResult = params.get("checkout");
  if (!["success", "cancelled"].includes(checkoutResult)) return;
  const notice = document.createElement("div");
  notice.className = "shop-checkout-notice";
  notice.setAttribute("role", "status");
  document.querySelector(".shop-hero")?.before(notice);
  if (checkoutResult === "cancelled") {
    notice.textContent = "Payment was not completed. Your cart is still here when you are ready.";
    return;
  }
  notice.textContent = "Checking your payment confirmation…";
  try {
    const query = new URLSearchParams({ order: params.get("order") || "", session_id: params.get("session_id") || "" });
    for (let attempt = 0; attempt < 4; attempt += 1) {
      const response = await fetch(`/team-review/api/store-order?${query}`, { headers: { accept: "application/json" } });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      if (result.status === "paid") {
        const key = `woafmeow-checkout-${params.get("order")}`;
        let submitted;
        try { submitted = JSON.parse(sessionStorage.getItem(key) || "null"); } catch {}
        if (submitted && JSON.stringify(readStoreCart()) === JSON.stringify(submitted.cart)) {
          localStorage.removeItem(storeCartKey);
          if ((localStorage.getItem(storeCouponKey) || "") === submitted.coupon) localStorage.removeItem(storeCouponKey);
          renderStoreCart();
        }
        try { sessionStorage.removeItem(key); } catch {}
        notice.classList.add("is-success");
        notice.textContent = "Payment confirmed. Your order confirmation will arrive by email.";
        return;
      }
      if (attempt < 3) await new Promise((resolve) => window.setTimeout(resolve, 1000));
    }
    notice.textContent = "Your payment is still being confirmed. Your cart is saved; check your email before paying again.";
  } catch {
    notice.textContent = "We could not verify this checkout. Your cart is saved. If you paid, check your email or contact hello@woafmeow.com before trying again.";
  }
};
showStoreCheckoutResult();

renderStoreCart();
loadPublishedStoreProducts();
loadStoreProductPage();
setTimeout(showFirstVisitMemorialOffer, 1500);
reconcileCheckoutCart();

const formatDashboardDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleString(undefined, { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
};

const dashboardTable = (title, columns, rows) => {
  const section = document.createElement("section");
  section.className = "admin-data-section";
  const heading = document.createElement("h3");
  heading.textContent = title;
  section.append(heading);
  if (!rows.length) {
    const empty = document.createElement("p");
    empty.textContent = "No records yet.";
    section.append(empty);
    return section;
  }
  const scroll = document.createElement("div");
  scroll.className = "admin-table-scroll";
  const table = document.createElement("table");
  const headerRow = document.createElement("tr");
  columns.forEach((column) => {
    const cell = document.createElement("th");
    cell.textContent = column.label;
    headerRow.append(cell);
  });
  const thead = document.createElement("thead");
  thead.append(headerRow);
  const tbody = document.createElement("tbody");
  rows.forEach((row) => {
    const tr = document.createElement("tr");
    columns.forEach((column) => {
      const cell = document.createElement("td");
      const value = row[column.key];
      cell.textContent = column.format ? column.format(value, row) : value || "—";
      tr.append(cell);
    });
    tbody.append(tr);
  });
  table.append(thead, tbody);
  scroll.append(table);
  section.append(scroll);
  return section;
};

const renderAdminStoreOrders = (orders) => {
  const section = document.createElement("section");
  section.className = "admin-table-block admin-store-orders";
  const heading = document.createElement("h2");
  heading.textContent = "Store orders";
  section.append(heading);
  if (!orders.length) {
    const empty = document.createElement("p");
    empty.textContent = "No store orders yet.";
    section.append(empty);
    return section;
  }
  const list = document.createElement("div");
  list.className = "admin-order-list";
  orders.forEach((order) => {
    const card = document.createElement("article");
    const header = document.createElement("div");
    const title = document.createElement("strong");
    title.textContent = `Order ${order.orderCode}`;
    const status = document.createElement("span");
    status.textContent = order.status;
    header.append(title, status);
    const customer = document.createElement("p");
    customer.textContent = `${order.customerName} · ${order.email} · Items: ${storeMoney(order.subtotalCents)}`;
    const items = document.createElement("ul");
    (order.items || []).forEach((item) => {
      const row = document.createElement("li");
      const text = document.createElement("span");
      const selection = [item.variantLabel, item.color ? `Color: ${item.color}` : "", item.size ? `Size: ${item.size}` : "", item.design ? `Design: ${item.design}` : "", item.dogName ? `Name: ${item.dogName}` : "", item.customizationShape ? `Shape: ${item.customizationShape}` : "", Number.isSafeInteger(item.priceCents) ? `${storeMoney(item.priceCents)} each` : ""].filter(Boolean).join(" · ");
      text.textContent = `${item.title} × ${item.quantity}${selection ? ` · ${selection}` : ""}`;
      row.append(text);
      if (item.customizationImageId) {
        const view = document.createElement("button");
        view.type = "button";
        view.className = "text-button";
        view.dataset.adminCustomizationImage = item.customizationImageId;
        view.textContent = "View dog photo";
        row.append(view);
      }
      items.append(row);
    });
    const shipping = order.shipping || {};
    const address = [shipping.name || order.customerName, shipping.address1, shipping.address2, shipping.city, shipping.region, shipping.postalCode, shipping.country].filter(Boolean).join(", ");
    const delivery = document.createElement("p");
    delivery.textContent = shipping.address1 ? `Deliver to: ${address}${shipping.phone ? ` · Phone: ${shipping.phone}` : ""}` : "Delivery address not recorded. Confirm it in Stripe before dispatch.";
    const note = document.createElement("p");
    note.textContent = [shipping.deliveryNote ? `Delivery note: ${shipping.deliveryNote}` : "", shipping.coupon ? `Offer: ${shipping.coupon}` : "", `Confirmation email: ${order.confirmationEmailStatus || "not recorded"}`].filter(Boolean).join(" · ");
    const date = document.createElement("small");
    date.textContent = formatDashboardDate(order.createdAt);
    card.append(header, customer, items, delivery, note, date);
    list.append(card);
  });
  section.append(list);
  return section;
};

const renderAdminDashboard = (payload) => {
  const root = document.querySelector("[data-admin-dashboard-results]");
  if (!root) return;
  root.hidden = false;
  root.replaceChildren();
  const totals = document.createElement("div");
  totals.className = "admin-totals";
  [
    ["Pet accounts", payload.totals?.pets],
    ["Newsletter", payload.totals?.newsletter],
    ["Webinar", payload.totals?.webinar],
    ["Sessions", payload.totals?.sessions],
    ["Providers", payload.totals?.providers],
    ["Remembrance", payload.totals?.memorial],
    ["Research", payload.totals?.research],
    ["Care chats", payload.totals?.chats],
    ["Memories", payload.totals?.memories],
    ["Contact messages", payload.totals?.contacts],
    ["Store orders", payload.totals?.orders],
  ].forEach(([label, value]) => {
    const item = document.createElement("article");
    const number = document.createElement("strong");
    number.textContent = String(value || 0);
    const caption = document.createElement("span");
    caption.textContent = label;
    item.append(number, caption);
    totals.append(item);
  });
  root.append(totals, renderAdminStoreOrders(payload.orders || []));
  root.append(
    dashboardTable("Newest pet accounts", [
      { key: "petName", label: "Pet" },
      { key: "species", label: "Species" },
      { key: "focus", label: "Focus" },
      { key: "ownerName", label: "Owner" },
      { key: "email", label: "Email" },
      { key: "createdAt", label: "Created", format: formatDashboardDate },
    ], payload.enrollments || []),
    dashboardTable("Newsletter signups", [
      { key: "email", label: "Email" },
      { key: "source", label: "Source" },
      { key: "createdAt", label: "Created", format: formatDashboardDate },
    ], payload.newsletter || []),
    dashboardTable("Webinar waitlist", [
      { key: "email", label: "Email" },
      { key: "concern", label: "Care question" },
      { key: "createdAt", label: "Created", format: formatDashboardDate },
    ], payload.webinar || []),
    dashboardTable("Care Session registrations", [
      { key: "sessionTitle", label: "Session" },
      { key: "firstName", label: "Name" },
      { key: "species", label: "Pet" },
      { key: "focus", label: "Focus" },
      { key: "question", label: "Question" },
      { key: "email", label: "Email" },
      { key: "createdAt", label: "Created", format: formatDashboardDate },
    ], payload.sessions || []),
    dashboardTable("Provider listing requests", [
      { key: "organization", label: "Organization" },
      { key: "contactName", label: "Contact" },
      { key: "requestType", label: "Request" },
      { key: "serviceType", label: "Service" },
      { key: "coverage", label: "Coverage" },
      { key: "email", label: "Email" },
      { key: "createdAt", label: "Created", format: formatDashboardDate },
    ], payload.providers || []),
    dashboardTable("Remembrance collection interest", [
      { key: "firstName", label: "Name" },
      { key: "collection", label: "Collection" },
      { key: "species", label: "Pet" },
      { key: "timing", label: "Moment" },
      { key: "note", label: "Note" },
      { key: "email", label: "Email" },
      { key: "createdAt", label: "Created", format: formatDashboardDate },
    ], payload.memorial || []),
    dashboardTable("Care Circle research", [
      { key: "petName", label: "Pet" },
      { key: "query", label: "Question" },
      { key: "species", label: "Scope" },
      { key: "email", label: "Account" },
      { key: "createdAt", label: "Created", format: formatDashboardDate },
    ], payload.research || []),
    dashboardTable("Care chats", [
      { key: "petName", label: "Pet" },
      { key: "title", label: "Question" },
      { key: "topic", label: "Topic" },
      { key: "privacy", label: "Privacy" },
      { key: "status", label: "Status" },
      { key: "email", label: "Account" },
      { key: "createdAt", label: "Created", format: formatDashboardDate },
    ], payload.chats || []),
    dashboardTable("Pet memory timeline", [
      { key: "petName", label: "Pet" },
      { key: "title", label: "Memory" },
      { key: "email", label: "Account" },
      { key: "createdAt", label: "Created", format: formatDashboardDate },
    ], payload.memories || []),
    dashboardTable("Contact messages", [
      { key: "name", label: "Name" },
      { key: "email", label: "Email" },
      { key: "topic", label: "Topic" },
      { key: "message", label: "Message" },
      { key: "status", label: "Status" },
      { key: "createdAt", label: "Created", format: formatDashboardDate },
    ], payload.contacts || [])
  );
};

let adminCredentials = { accountName: "", password: "" };
let adminEditingProductSlug = "";
let adminProductsCache = [];
let adminProductMedia = [];

document.querySelector("[data-admin-brand-preview]")?.addEventListener("toggle", async (event) => {
  const panel = event.currentTarget;
  if (!panel.open || panel.dataset.loaded === "true" || panel.dataset.loading === "true") return;
  const note = panel.querySelector("[data-brand-preview-note]");
  const image = panel.querySelector("img");
  panel.dataset.loading = "true";
  note.textContent = "Loading private packaging preview…";
  try {
    const response = await fetch("/internal/brand-preview/collection.jpg", {
      headers: { "x-woafy-admin-name": adminCredentials.accountName, "x-woafy-admin-password": adminCredentials.password },
      cache: "no-store",
    });
    if (!response.ok || !response.headers.get("content-type")?.startsWith("image/")) throw new Error("Unable to load the preview. Close and reopen to try again.");
    const url = URL.createObjectURL(await response.blob());
    image.onload = () => URL.revokeObjectURL(url);
    image.src = url;
    image.hidden = false;
    panel.dataset.loaded = "true";
    note.textContent = "Packaging design preview only. Supplier branding, stocked specifications and final samples need confirmation before customer publication. Add product-specific feedback below.";
  } catch (error) { note.textContent = error.message; }
  finally { panel.dataset.loading = "false"; }
});

const adminProductRequest = async (method = "GET", payload, endpoint = "/team-review/api/admin-products") => {
  const response = await fetch(endpoint, {
    method,
    headers: {
      accept: "application/json",
      ...(payload ? { "content-type": "application/json" } : {}),
      "x-woafy-admin-name": adminCredentials.accountName,
      "x-woafy-admin-password": adminCredentials.password,
    },
    ...(payload ? { body: JSON.stringify(payload) } : {}),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || "The product catalog could not be updated.");
  return result;
};

const uploadedProductImagePattern = /^\/api\/(?:product-images|product-media)\/[0-9a-f-]{36}(?:\?v=[^#]+)?$/i;
const isUploadedProductImage = (value) => {
  const source = String(value || "").trim();
  if (!source) return false;
  try {
    const parsed = new URL(source, window.location.origin);
    return parsed.origin === window.location.origin && uploadedProductImagePattern.test(`${parsed.pathname}${parsed.search}`);
  } catch {
    return false;
  }
};
const readAdminDesignOptions = () => [...document.querySelectorAll("[data-admin-design-row]")].map((row) => ({
  label: row.querySelector("[data-design-label]").value.trim(),
  mediaId: row.querySelector("[data-design-media]").value,
  priceAdjustment: row.querySelector("[data-design-price]").value,
  ...(row.dataset.artworkIndex !== undefined ? { artworkIndex: Number(row.dataset.artworkIndex) } : {}),
}));
const renderAdminDesignOptions = (options = readAdminDesignOptions()) => {
  const root = document.querySelector("[data-admin-design-list]");
  if (!root) return;
  root.replaceChildren();
  const images = adminProductMedia.filter((item) => item.kind === "image" && !item.legacy);
  options.forEach((option) => {
    const row = document.createElement("div");
    row.className = "admin-design-row";
    row.dataset.adminDesignRow = "";
    if (Number.isInteger(option.artworkIndex)) row.dataset.artworkIndex = String(option.artworkIndex);
    const name = document.createElement("input");
    name.dataset.designLabel = "";
    name.placeholder = "Design name, e.g. Golden Retriever";
    name.maxLength = 60;
    name.value = option.label || "";
    name.setAttribute("aria-label", "Premade design name");
    const select = document.createElement("select");
    select.dataset.designMedia = "";
    select.setAttribute("aria-label", "Premade design photo");
    select.append(new Option("Photo (optional)", ""), ...images.map((image, index) => new Option(`Photo ${index + 1}`, image.id)));
    select.value = option.mediaId || "";
    const preview = document.createElement("img");
    preview.alt = "Selected design photo";
    const showPreview = () => {
      const image = images.find((item) => item.id === select.value);
      preview.hidden = !image;
      if (image) preview.src = image.url;
    };
    select.addEventListener("change", showPreview);
    showPreview();
    const remove = document.createElement("button");
    remove.type = "button";
    remove.textContent = "Remove";
    remove.addEventListener("click", () => row.remove());
    const price = document.createElement("input");
    price.type = "number";
    price.min = "0";
    price.step = "0.01";
    price.value = String(option.priceAdjustment ?? Number(option.priceAdjustmentCents || 0) / 100);
    price.dataset.designPrice = "";
    price.setAttribute("aria-label", "Design add-on price in USD");
    row.append(name, select, price, preview, remove);
    root.append(row);
  });
};
const readAdminVariants = () => [...document.querySelectorAll("[data-admin-variant-row]")].map((row) => ({
  id: row.dataset.variantId,
  ...Object.fromEntries([...row.querySelectorAll("[data-editor-field]")].map((input) => [input.dataset.editorField, input.type === "checkbox" ? input.checked : input.value])),
}));
const readAdminContent = () => [...document.querySelectorAll("[data-admin-content-row]")].map((row) => Object.fromEntries([...row.querySelectorAll("[data-editor-field]")].map((input) => [input.dataset.editorField, input.type === "checkbox" ? input.checked : input.multiple ? [...input.selectedOptions].map((option) => option.value) : input.value])));
const editorField = (row, labelText, key, value, type = "text") => {
  const label = document.createElement("label");
  const caption = document.createElement("span");
  caption.textContent = labelText;
  const input = document.createElement(type === "textarea" ? "textarea" : "input");
  if (type !== "textarea") input.type = type;
  input.dataset.editorField = key;
  if (type === "checkbox") input.checked = value !== false;
  else input.value = value ?? "";
  if (type === "number") { input.min = "0"; input.step = key === "price" ? "0.01" : "1"; }
  if (type === "textarea") { input.rows = 8; input.maxLength = 10000; label.className = "field-wide"; }
  label.append(caption, input);
  row.append(label);
};
const renderAdminVariants = (variants = readAdminVariants()) => {
  const root = document.querySelector("[data-admin-variant-list]");
  if (!root) return;
  root.replaceChildren();
  variants.forEach((variant) => {
    const row = document.createElement("div");
    row.className = "admin-variant-row";
    row.dataset.adminVariantRow = "";
    row.dataset.variantId = variant.id || crypto.randomUUID();
    editorField(row, "Option name", "label", variant.label);
    editorField(row, "Color", "color", variant.color);
    editorField(row, "Size", "size", variant.size);
    editorField(row, "Price (USD)", "price", variant.price ?? Number(variant.priceCents || 0) / 100, "number");
    editorField(row, "Available quantity", "stockQuantity", variant.stockQuantity, "number");
    editorField(row, "Visible to buyers", "active", variant.active, "checkbox");
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "text-button";
    remove.textContent = "Remove variant";
    remove.addEventListener("click", () => row.remove());
    row.append(remove);
    root.append(row);
  });
};
const renderAdminContent = (sections = readAdminContent()) => {
  const root = document.querySelector("[data-admin-content-list]");
  if (!root) return;
  if (!sections.some((section) => section.layout)) {
    const standardOrder = ["feature", "demonstration", "specifications", "faq"];
    sections = [...sections].sort((a, b) => standardOrder.indexOf(a.type || "feature") - standardOrder.indexOf(b.type || "feature"));
  }
  root.replaceChildren();
  const standardButton = document.querySelector("[data-admin-content-standard]");
  if (standardButton) standardButton.hidden = sections.length > 0;
  sections.forEach((section, index) => {
    const row = document.createElement("div");
    row.className = "admin-content-row";
    row.dataset.adminContentRow = "";
    editorField(row, "Section heading", "heading", section.heading);
    const typeLabel = document.createElement("label");
    const typeCaption = document.createElement("span");
    typeCaption.textContent = "Content type";
    const typeSelect = document.createElement("select");
    typeSelect.dataset.editorField = "type";
    [["feature", "Photo & story"], ["demonstration", "Demonstration & steps"], ["specifications", "Specification table"], ["faq", "FAQ accordion"]].forEach(([value, label]) => typeSelect.append(new Option(label, value)));
    typeSelect.value = section.type || "feature";
    const help = document.createElement("small");
    const describeLayout = () => { help.textContent = { feature: "Separate paragraphs with a blank line.", demonstration: "Write one step per line. Choose an uploaded demonstration photo or video below.", specifications: "Write one specification per line: Label: value", faq: "Use the section heading for the question and the description for the answer." }[typeSelect.value]; };
    typeSelect.addEventListener("change", describeLayout);
    describeLayout();
    typeLabel.append(typeCaption, typeSelect, help);
    row.append(typeLabel);
    const layoutLabel = document.createElement("label");
    const layoutCaption = document.createElement("span");
    layoutCaption.textContent = "Block layout";
    const layoutSelect = document.createElement("select");
    layoutSelect.dataset.editorField = "layout";
    [["auto", "Standard product template"], ["full-width", "Full-width image & text"], ["media-left", "Image left / text right"], ["media-right", "Text left / image right"], ["gallery", "Photo & video gallery"]].forEach(([value, label]) => layoutSelect.append(new Option(label, value)));
    layoutSelect.value = section.layout || "auto";
    layoutLabel.append(layoutCaption, layoutSelect);
    row.append(layoutLabel);
    editorField(row, "Visible on product page", "visible", section.visible, "checkbox");
    editorField(row, "Description", "text", section.text, "textarea");
    const label = document.createElement("label");
    const caption = document.createElement("span");
    caption.textContent = "Uploaded photo or video";
    const select = document.createElement("select");
    select.dataset.editorField = "mediaId";
    select.append(new Option("Text only", ""), ...adminProductMedia.filter((item) => !item.legacy).map((item, position) => new Option(`${item.kind === "video" ? "Video" : "Photo"} ${position + 1}`, item.id)));
    select.value = section.mediaId || "";
    label.append(caption, select);
    row.append(label);
    const mobileLabel = document.createElement("label");
    const mobileCaption = document.createElement("span");
    mobileCaption.textContent = "Mobile photo (optional)";
    const mobileSelect = document.createElement("select");
    mobileSelect.dataset.editorField = "mobileMediaId";
    mobileSelect.append(new Option("Same photo on all devices", ""), ...adminProductMedia.filter((item) => !item.legacy && item.kind === "image").map((item, position) => new Option(`Photo ${position + 1}`, item.id)));
    mobileSelect.value = section.mobileMediaId || "";
    mobileLabel.append(mobileCaption, mobileSelect);
    row.append(mobileLabel);
    const galleryLabel = document.createElement("label");
    galleryLabel.className = "field-wide";
    const galleryCaption = document.createElement("span");
    galleryCaption.textContent = "Gallery photos & videos";
    const gallerySelect = document.createElement("select");
    gallerySelect.dataset.editorField = "mediaIds";
    gallerySelect.multiple = true;
    gallerySelect.size = 4;
    adminProductMedia.filter((item) => !item.legacy).forEach((item, position) => {
      const option = new Option(`${item.kind === "video" ? "Video" : "Photo"} ${position + 1}`, item.id);
      option.selected = (section.mediaIds || []).includes(item.id);
      gallerySelect.append(option);
    });
    const galleryHelp = document.createElement("small");
    galleryHelp.textContent = "Choose up to eight uploaded items. Use Command or Ctrl to select several.";
    galleryLabel.append(galleryCaption, gallerySelect, galleryHelp);
    row.append(galleryLabel);
    const updateMediaFields = () => { galleryLabel.hidden = layoutSelect.value !== "gallery"; label.hidden = mobileLabel.hidden = layoutSelect.value === "gallery"; };
    layoutSelect.addEventListener("change", updateMediaFields);
    updateMediaFields();
    const actions = document.createElement("div");
    actions.className = "admin-product-actions";
    ["Move up", "Move down", "Remove"].forEach((action) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "text-button";
      button.textContent = action;
      button.disabled = (action === "Move up" && index === 0) || (action === "Move down" && index === sections.length - 1);
      button.addEventListener("click", () => {
        const current = readAdminContent();
        if (action === "Remove") current.splice(index, 1);
        else { const target = index + (action === "Move up" ? -1 : 1); [current[index], current[target]] = [current[target], current[index]]; }
        renderAdminContent(current);
      });
      actions.append(button);
    });
    row.append(actions);
    root.append(row);
  });
};
const renderAdminProductMedia = () => {
  const root = document.querySelector("[data-admin-product-media-list]");
  if (!root) return;
  root.replaceChildren();
  if (!adminProductMedia.length) {
    const empty = document.createElement("p");
    empty.textContent = "No media added.";
    root.append(empty);
    renderAdminDesignOptions();
    return;
  }
  const mainImageId = adminProductMedia.find((item) => item.kind === "image")?.id;
  adminProductMedia.forEach((item, index) => {
    const card = document.createElement("article");
    card.className = "admin-product-media-item";
    const media = item.kind === "video" ? document.createElement("video") : document.createElement("img");
    media.src = item.url;
    if (item.kind === "video") media.muted = true;
    else media.alt = `Product media ${index + 1}`;
    const label = document.createElement("span");
    label.textContent = item.kind === "video" ? "Video" : item.id === mainImageId ? "Main image" : "Image";
    const remove = document.createElement("button");
    remove.type = "button";
    remove.dataset.adminMediaRemove = item.id;
    remove.setAttribute("aria-label", `Remove ${label.textContent.toLowerCase()}`);
    remove.textContent = "Remove";
    const actions = document.createElement("div");
    actions.className = "admin-product-actions";
    ["Move up", "Move down"].forEach((action) => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = action;
      button.disabled = action === "Move up" ? index === 0 : index === adminProductMedia.length - 1;
      button.addEventListener("click", () => {
        const target = index + (action === "Move up" ? -1 : 1);
        [adminProductMedia[index], adminProductMedia[target]] = [adminProductMedia[target], adminProductMedia[index]];
        renderAdminProductMedia();
        renderAdminContent();
      });
      actions.append(button);
    });
    actions.append(remove);
    card.append(media, label, actions);
    root.append(card);
  });
  renderAdminDesignOptions();
};

const canvasBlob = (canvas, type, quality) => new Promise((resolve) => canvas.toBlob(resolve, type, quality));

const resizeProductImage = async (file) => {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) throw new Error("Choose a JPG, PNG, or WebP product photo.");
  if (file.size <= 1_650_000) return file;
  const objectUrl = URL.createObjectURL(file);
  try {
    const image = new Image();
    await new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = () => reject(new Error("That image could not be opened."));
      image.src = objectUrl;
    });
    const render = async (maxEdge, quality) => {
      const scale = Math.min(1, maxEdge / Math.max(image.naturalWidth, image.naturalHeight));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      const context = canvas.getContext("2d", { alpha: true });
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      return canvasBlob(canvas, "image/webp", quality);
    };
    let blob = await render(1800, 0.86);
    if (!blob || blob.size > 1_800_000) blob = await render(1400, 0.76);
    if (!blob || blob.size > 1_800_000) throw new Error("That photo is still too large after resizing. Choose a smaller image.");
    return new File([blob], `${file.name.replace(/\.[^.]+$/, "") || "product"}.webp`, { type: "image/webp" });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
};

const uploadAdminProductMedia = async (file) => {
  const prepared = file.type.startsWith("image/") ? await resizeProductImage(file) : file;
  if (!prepared.type.startsWith("image/") && !["video/mp4", "video/webm"].includes(prepared.type)) throw new Error("Use JPG, PNG, WebP, MP4, or WebM.");
  if (prepared.size > 1_800_000) throw new Error(`${file.name} is larger than 1.8 MB.`);
  const formData = new FormData();
  formData.append("media", prepared, prepared.name);
  const response = await fetch("/team-review/api/admin-product-media", {
    method: "POST",
    headers: {
      accept: "application/json",
      "x-woafy-admin-name": adminCredentials.accountName,
      "x-woafy-admin-password": adminCredentials.password,
    },
    body: formData,
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || !result.media) throw new Error(result.error || "The product media could not be uploaded.");
  return result.media;
};

const formatProductPrice = (priceCents) => `$${(Number(priceCents || 0) / 100).toFixed(2)}`;

const resetAdminProductForm = (message = "Ready for a new product.") => {
  const form = document.querySelector("[data-admin-product-form]");
  if (!form) return;
  adminEditingProductSlug = "";
  adminProductMedia = [];
  form.reset();
  form.elements.namedItem("active").checked = false;
  form.elements.namedItem("originalSlug").value = "";
  form.elements.namedItem("slug").dataset.auto = "true";
  renderAdminProductMedia();
  renderAdminDesignOptions([]);
  renderAdminVariants([]);
  renderAdminContent([]);
  document.querySelector("[data-product-form-title]")?.replaceChildren(document.createTextNode("New product"));
  const note = form.querySelector("[data-admin-product-note]");
  if (note) note.textContent = message;
};

const fillAdminProductForm = (product) => {
  const form = document.querySelector("[data-admin-product-form]");
  if (!form || !product) return;
  adminEditingProductSlug = product.slug;
  form.elements.namedItem("originalSlug").value = product.slug;
  form.elements.namedItem("title").value = product.title || "";
  form.elements.namedItem("slug").value = product.slug || "";
  form.elements.namedItem("price").value = (Number(product.priceCents || 0) / 100).toFixed(2);
  adminProductMedia = Array.isArray(product.media) ? product.media.map((item) => ({ ...item, existing: true })) : [];
  if (!adminProductMedia.length && isUploadedProductImage(product.imageUrl)) adminProductMedia = [{ id: "legacy", kind: "image", url: product.imageUrl, legacy: true }];
  form.elements.namedItem("shortDescription").value = product.shortDescription || "";
  form.elements.namedItem("details").value = Array.isArray(product.details) ? product.details.join("\n") : "";
  form.elements.namedItem("customizationType").value = product.customizationType || "none";
  form.elements.namedItem("customizationPrice").value = Number(product.customizationPriceCents ?? 1000) / 100;
  form.elements.namedItem("customizationLabel").value = product.customizationLabel || "Customize this product";
  form.elements.namedItem("customizationShapes").value = (product.customizationShapes || []).join("\n");
  form.elements.namedItem("stockQuantity").value = product.stockQuantity ?? "";
  form.elements.namedItem("maxQuantity").value = product.maxQuantity || 8;
  form.elements.namedItem("active").checked = Boolean(product.active);
  renderAdminProductMedia();
  renderAdminDesignOptions(Array.isArray(product.designOptions) ? product.designOptions : []);
  renderAdminVariants(product.variants || []);
  renderAdminContent(product.content || []);
  document.querySelector("[data-product-form-title]")?.replaceChildren(document.createTextNode(`Edit ${product.title || "product"}`));
  form.scrollIntoView({ behavior: "smooth", block: "start" });
};

const createTeamProductReview = (product) => {
  const details = document.createElement("details");
  details.className = "admin-team-review";
  details.dataset.productReview = product.slug;
  const summary = document.createElement("summary");
  summary.textContent = "Team comments & review";
  const status = document.createElement("p");
  status.setAttribute("role", "status");
  const history = document.createElement("div");
  const form = document.createElement("form");
  const field = (text, input) => {
    const label = document.createElement("label");
    const title = document.createElement("span");
    title.textContent = text;
    label.append(title, input);
    return label;
  };
  const reviewer = document.createElement("input");
  reviewer.required = true;
  reviewer.maxLength = 80;
  reviewer.name = "reviewer";
  const decision = document.createElement("select");
  decision.name = "decision";
  for (const [value, name] of [["note","Comment only"],["changes_requested","Needs changes"],["approved","Approved"]]) decision.append(new Option(name,value));
  const comment = document.createElement("textarea");
  comment.required = true;
  comment.maxLength = 2000;
  comment.name = "comment";
  comment.rows = 3;
  const submit = document.createElement("button");
  submit.type = "submit";
  submit.className = "button secondary";
  submit.textContent = "Save team feedback";
  form.append(field("Your name",reviewer),field("Review decision",decision),field("Comment",comment),submit);
  const states = {not_reviewed:"Not reviewed",changes_requested:"Needs changes",approved:"Approved",note:"Comment"};
  const render = result => {
    status.textContent = `Latest team decision: ${states[result.decision]} · Private to the team. Latest 100 comments.`;
    history.replaceChildren();
    for (const entry of result.comments || []) {
      const article = document.createElement("article");
      const heading = document.createElement("strong");
      heading.textContent = `${entry.reviewer} · ${states[entry.decision]} · ${new Date(entry.createdAt).toLocaleString()}`;
      const text = document.createElement("p");
      text.textContent = entry.comment;
      article.append(heading,text);
      history.append(article);
    }
  };
  details.addEventListener("toggle", async () => {
    if (!details.open) return;
    status.textContent = "Loading team feedback…";
    try { render(await adminProductRequest("GET",undefined,`/team-review/api/admin-product-feedback?slug=${encodeURIComponent(product.slug)}`)); }
    catch (error) { status.textContent = error.message; }
  });
  form.addEventListener("submit",async event => {
    event.preventDefault();
    if (submit.disabled) return;
    submit.disabled = true;
    try {
      render(await adminProductRequest("POST",{slug:product.slug,reviewer:reviewer.value,comment:comment.value,decision:decision.value},"/team-review/api/admin-product-feedback"));
      comment.value = "";
    } catch (error) { status.textContent = error.message; }
    finally { submit.disabled = false; }
  });
  details.append(summary,status,history,form);
  return details;
};

const renderAdminProductList = (products) => {
  const root = document.querySelector("[data-admin-product-list]");
  if (!root) return;
  adminProductsCache = products.map((product) => ({ ...product }));
  root.replaceChildren();
  if (!products.length) {
    const empty = document.createElement("p");
    empty.className = "admin-product-empty";
    empty.textContent = "No products yet. Add the first one above.";
    root.append(empty);
    return;
  }
  products.forEach((product) => {
    const card = document.createElement("article");
    card.className = "admin-product-row";
    let image;
    if (isUploadedProductImage(product.imageUrl)) {
      image = document.createElement("img");
      image.src = combinedProductPhotos[product.slug] || product.imageUrl;
      image.alt = `${product.title} product photo`;
      image.loading = "lazy";
    } else {
      image = document.createElement("span");
      image.className = "admin-product-photo-needed";
      image.textContent = "Photo needed";
    }
    const copy = document.createElement("div");
    copy.className = "admin-product-row-copy";
    const status = document.createElement("span");
    status.className = product.active ? "admin-product-status is-live" : "admin-product-status";
    status.textContent = product.active ? "Published" : "Hidden";
    const title = document.createElement("h4");
    title.textContent = product.title;
    const meta = document.createElement("p");
    const mediaCount = Array.isArray(product.media) && product.media.length ? product.media.length : (product.imageUrl ? 1 : 0);
    meta.textContent = `${product.priceCents > 0 ? formatProductPrice(product.priceCents) : "Price needed"} · ${mediaCount} ${mediaCount === 1 ? "file" : "files"} · /${product.slug}`;
    copy.append(status, title, meta);
    const actions = document.createElement("div");
    actions.className = "admin-product-row-actions";
    const edit = document.createElement("button");
    edit.type = "button";
    edit.className = "button secondary";
    edit.dataset.adminProductEdit = product.slug;
    edit.textContent = "Edit";
    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "text-button";
    toggle.dataset.adminProductToggle = product.slug;
    toggle.dataset.nextActive = String(!product.active);
    toggle.textContent = product.active ? "Hide" : "Publish";
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "text-button admin-product-delete";
    remove.dataset.adminProductDelete = product.slug;
    remove.textContent = "Delete";
    actions.append(edit, toggle, remove);
    card.append(image, copy, actions, createTeamProductReview(product));
    root.append(card);
  });
};

const loadAdminProducts = async () => {
  const panel = document.querySelector("[data-admin-products]");
  const note = document.querySelector("[data-admin-product-note]");
  if (!panel || !adminCredentials.accountName || !adminCredentials.password) return;
  try {
    const result = await adminProductRequest();
    renderAdminProductList(Array.isArray(result.products) ? result.products : []);
    panel.hidden = false;
    panel.dataset.loaded = "true";
  } catch (error) {
    if (note) note.textContent = error.message || "The product catalog could not be loaded.";
  }
};

document.querySelector("[data-product-new]")?.addEventListener("click", resetAdminProductForm);
document.querySelector("[data-product-reset]")?.addEventListener("click", resetAdminProductForm);

const adminProductForm = document.querySelector("[data-admin-product-form]");
adminProductForm?.elements.namedItem("title")?.addEventListener("input", (event) => {
  const slug = adminProductForm.elements.namedItem("slug");
  if (adminEditingProductSlug || (slug.value && slug.dataset.auto !== "true")) return;
  slug.value = event.currentTarget.value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 100);
  slug.dataset.auto = "true";
});
adminProductForm?.elements.namedItem("slug")?.addEventListener("input", (event) => {
  if (event.currentTarget.value) event.currentTarget.dataset.auto = "false";
});
adminProductForm?.elements.namedItem("mediaFiles")?.addEventListener("change", async (event) => {
  const files = [...(event.currentTarget.files || [])];
  const note = adminProductForm.querySelector("[data-admin-product-note]");
  if (!files.length) return;
  if (adminProductMedia.length + files.length > 12) {
    if (note) note.textContent = "A product can have up to 12 images and videos.";
    event.currentTarget.value = "";
    return;
  }
  event.currentTarget.disabled = true;
  try {
    for (const file of files) {
      if (note) note.textContent = `Uploading ${file.name}…`;
      adminProductMedia.push(await uploadAdminProductMedia(file));
      renderAdminProductMedia();
      renderAdminContent();
    }
    if (note) note.textContent = `${adminProductMedia.length} media ${adminProductMedia.length === 1 ? "file" : "files"} ready.`;
  } catch (error) {
    if (note) note.textContent = error.message || "The media could not be uploaded.";
  } finally {
    event.currentTarget.value = "";
    event.currentTarget.disabled = false;
  }
});

document.addEventListener("click", async (event) => {
  if (event.target.closest("[data-admin-content-standard]")) {
    renderAdminContent([
      { type: "feature", layout: "full-width", heading: "Product overview", text: "", mediaId: "" },
      { type: "demonstration", layout: "full-width", heading: "How it works", text: "", mediaId: "" },
      { type: "specifications", layout: "auto", heading: "Product details", text: "", mediaId: "" },
      { type: "faq", layout: "auto", heading: "", text: "", mediaId: "" },
    ]);
    return;
  }
  if (event.target.closest("[data-admin-variant-add]")) {
    renderAdminVariants([...readAdminVariants(), { label: "", price: adminProductForm.elements.namedItem("price").value, active: true }]);
    return;
  }
  if (event.target.closest("[data-admin-content-add]")) {
    renderAdminContent([...readAdminContent(), { heading: "", text: "", mediaId: "" }]);
    return;
  }
  if (event.target.closest("[data-admin-design-add]")) {
    renderAdminDesignOptions([...readAdminDesignOptions(), { label: "", mediaId: "" }]);
    return;
  }
  const remove = event.target.closest("[data-admin-media-remove]");
  if (!remove) return;
  const item = adminProductMedia.find((candidate) => candidate.id === remove.dataset.adminMediaRemove);
  adminProductMedia = adminProductMedia.filter((candidate) => candidate.id !== remove.dataset.adminMediaRemove);
  renderAdminProductMedia();
  renderAdminContent();
  if (!item || item.legacy || item.existing) return;
  await fetch("/team-review/api/admin-product-media", {
    method: "DELETE",
    headers: { "content-type": "application/json", "x-woafy-admin-name": adminCredentials.accountName, "x-woafy-admin-password": adminCredentials.password },
    body: JSON.stringify({ id: item.id }),
  }).catch(() => {});
});

document.querySelector("[data-admin-product-form]")?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const button = form.querySelector("[data-product-save]");
  const note = form.querySelector("[data-admin-product-note]");
  const values = Object.fromEntries(new FormData(form).entries());
  const payload = {
    title: values.title,
    slug: values.slug,
    price: values.price,
    mediaIds: adminProductMedia.filter((item) => !item.legacy).map((item) => item.id),
    imageUrl: adminProductMedia.find((item) => item.legacy)?.url || "",
    customizationType: values.customizationType,
    customizationPrice: values.customizationPrice,
    customizationLabel: values.customizationLabel,
    customizationShapes: String(values.customizationShapes || "").split(/\r?\n/).map((shape) => shape.trim()).filter(Boolean),
    stockQuantity: values.stockQuantity,
    maxQuantity: values.maxQuantity,
    variants: readAdminVariants(),
    content: readAdminContent(),
    designOptions: readAdminDesignOptions(),
    shortDescription: values.shortDescription,
    details: String(values.details || "").split(/\r?\n/).map((item) => item.trim()).filter(Boolean),
    active: values.active === "on",
  };
  if (button) { button.disabled = true; button.textContent = adminEditingProductSlug ? "Updating..." : "Saving..."; }
  if (note) note.textContent = "";
  try {
    const result = adminEditingProductSlug
      ? await adminProductRequest("PATCH", { ...payload, originalSlug: adminEditingProductSlug })
      : await adminProductRequest("POST", payload);
    resetAdminProductForm(result.message || "Product saved.");
    await loadAdminProducts();
  } catch (error) {
    if (note) note.textContent = error.message || "The product could not be saved.";
  } finally {
    if (button) { button.disabled = false; button.textContent = "Save product"; }
  }
});

document.addEventListener("click", async (event) => {
  const editButton = event.target.closest("[data-admin-product-edit]");
  const toggleButton = event.target.closest("[data-admin-product-toggle]");
  const deleteButton = event.target.closest("[data-admin-product-delete]");
  if (editButton) {
    try {
      let product = adminProductsCache.find((item) => item.slug === editButton.dataset.adminProductEdit);
      if (!product) {
        const result = await adminProductRequest();
        product = (result.products || []).find((item) => item.slug === editButton.dataset.adminProductEdit);
      }
      if (!product) throw new Error("That product could not be found.");
      fillAdminProductForm(product);
    } catch (error) {
      const note = document.querySelector("[data-admin-product-note]");
      if (note) note.textContent = error.message || "The product could not be loaded.";
    }
    return;
  }
  if (deleteButton) {
    const product = adminProductsCache.find((item) => item.slug === deleteButton.dataset.adminProductDelete);
    if (!window.confirm(`Delete ${product?.title || "this product"}? This removes it from the Shop and cannot be undone.`)) return;
    deleteButton.disabled = true;
    try {
      const result = await adminProductRequest("DELETE", { slug: deleteButton.dataset.adminProductDelete });
      if (adminEditingProductSlug === deleteButton.dataset.adminProductDelete) resetAdminProductForm();
      const note = document.querySelector("[data-admin-product-note]");
      if (note) note.textContent = result.message || "Product deleted.";
      await loadAdminProducts();
    } catch (error) {
      const note = document.querySelector("[data-admin-product-note]");
      if (note) note.textContent = error.message || "The product could not be deleted.";
    } finally {
      deleteButton.disabled = false;
    }
    return;
  }
  if (!toggleButton) return;
  toggleButton.disabled = true;
  try {
    const result = await adminProductRequest("PATCH", { action: "visibility", slug: toggleButton.dataset.adminProductToggle, active: toggleButton.dataset.nextActive === "true" });
    const note = document.querySelector("[data-admin-product-note]");
    if (note) note.textContent = result.message || "Product visibility updated.";
    await loadAdminProducts();
  } catch (error) {
    const note = document.querySelector("[data-admin-product-note]");
    if (note) note.textContent = error.message || "Product visibility could not be updated.";
  } finally {
    toggleButton.disabled = false;
  }
});

document.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-admin-customization-image]");
  if (!button) return;
  button.disabled = true;
  const original = button.textContent;
  button.textContent = "Opening…";
  try {
    const response = await fetch(`/team-review/api/admin-customization-image/${encodeURIComponent(button.dataset.adminCustomizationImage)}`, {
      headers: { "x-woafy-admin-name": adminCredentials.accountName, "x-woafy-admin-password": adminCredentials.password },
    });
    if (!response.ok) throw new Error("The customization photo could not be opened.");
    const objectUrl = URL.createObjectURL(await response.blob());
    window.open(objectUrl, "_blank", "noopener,noreferrer");
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60000);
  } catch (error) {
    window.alert(error.message || "The customization photo could not be opened.");
  } finally {
    button.disabled = false;
    button.textContent = original;
  }
});

const selectAdminWorkspaceTab = (tabName) => {
  document.querySelectorAll("[data-admin-tab]").forEach((button) => button.classList.toggle("is-active", button.dataset.adminTab === tabName));
  document.querySelectorAll("[data-admin-view]").forEach((view) => { view.hidden = view.dataset.adminView !== tabName; });
};

document.querySelectorAll("[data-admin-tab]").forEach((button) => {
  button.addEventListener("click", () => selectAdminWorkspaceTab(button.dataset.adminTab || "store"));
});

document.querySelectorAll("[data-admin-dashboard-form]").forEach((form) => {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const accountName = form.querySelector("[name='accountName']")?.value.trim() || "";
    const password = form.querySelector("[name='password']")?.value || "";
    const note = form.querySelector("[data-admin-dashboard-note]");
    const button = form.querySelector("button[type='submit']");
    if (button) {
      button.disabled = true;
      button.textContent = "Signing in...";
    }
    if (note) note.textContent = "";
    adminCredentials = { accountName, password };
    try {
      const response = await fetch("/team-review/api/admin", { headers: { "x-woafy-admin-name": accountName, "x-woafy-admin-password": password, accept: "application/json" } });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "The private dashboard could not be opened.");
      renderAdminDashboard(result);
      await loadAdminProducts();
      const tabs = document.querySelector("[data-admin-workspace-tabs]");
      if (tabs) tabs.hidden = false;
      selectAdminWorkspaceTab("store");
      if (note) note.textContent = "Workspace opened for this browser session.";
    } catch (error) {
      adminCredentials = { accountName: "", password: "" };
      const tabs = document.querySelector("[data-admin-workspace-tabs]");
      if (tabs) tabs.hidden = true;
      document.querySelectorAll("[data-admin-view]").forEach((view) => { view.hidden = true; });
      if (note) note.textContent = error.message || "The private dashboard could not be opened.";
    } finally {
      if (button) {
        button.disabled = false;
        button.textContent = "Sign in";
      }
    }
  });
});

applyMemberState();
loadCircles();
loadCommunity();
loadCommunityResearch();
