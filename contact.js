"use strict";

/**
 * contact.js
 * -----------
 * This script controls the Info & Contact page.
 * It:
 *  - Loads a random Advice from an external API
 *  - Lets the user fetch a new advice on button click
 *  - Validates the contact form and shows clear error messages
 *  - Can write form data to a .txt file and read a .txt file
 *  - Saves valid form data to localStorage and restores it on load
 *  - Demonstrates basic Object-Oriented Programming
 */
// Bug Fix
// The Bored API was throwing out API errors. The status code was 200, but because there was no Access-Control-Allow-Origin, the browser refused to give my code access to the data.
// Changed code to include advice slip API instead which included CORS

// Advice Slip (random advice)
const ACTIVITY_API_URL = "https://api.adviceslip.com/advice";

/**
 * IdeaService
 * -----------
 * Talks to the Advice Slip API and returns a single advice string.
 */
class IdeaService {
  /**
   * Fetches a random piece of advice from the Advice Slip API.
   * @returns {Promise<string>} Advice text.
   */
  async getIdea() {
    const res = await fetch(ACTIVITY_API_URL, {
      cache: "no-cache", // try not to reuse old advice
    });

    if (!res.ok) {
      throw new Error(`API returned ${res.status}`);
    }

    const data = await res.json();
    const advice =
      data.slip && data.slip.advice
        ? data.slip.advice
        : "Take a quick walk and look for colours.";
    return advice;
  }
}

/**
 * FormValidator
 * -------------
 * Validates the contact form fields and displays error messages.
 * Also saves valid form data to localStorage and restores it.
 */
class FormValidator {
  /**
   * @param {HTMLFormElement} form - The contact form element.
   * @param {number} minLength - Minimum message length.
   */
  constructor(form, minLength) {
    /** @type {HTMLFormElement} */
    this.form = form;
    /** @type {number} */
    this.minLength = minLength;
    /** @type {HTMLElement | null} */
    this.statusEl = document.getElementById("formStatus");
  }

  /**
   * Attach the submit handler and restore any saved data.
   */
  init() {
    // Restore previously saved data, if any
    this.restoreFromStorage();

    // Attach submit handler
    this.form.addEventListener("submit", (e) => this.onSubmit(e));
  }

  /**
   * Restores saved form data from localStorage (if any)
   * and fills the form fields.
   */
  restoreFromStorage() {
    try {
      const raw = localStorage.getItem("contactFormData");
      if (!raw) return;

      const data = JSON.parse(raw);

      if (data.name && this.form.elements["name"]) {
        this.form.elements["name"].value = data.name;
      }
      if (data.email && this.form.elements["email"]) {
        this.form.elements["email"].value = data.email;
      }
      if (data.message && this.form.elements["message"]) {
        this.form.elements["message"].value = data.message;
      }
    } catch (err) {
      console.warn(
        "Could not restore contact form data from localStorage:",
        err
      );
    }
  }

  /**
   * Handle form submission: validate fields and show messages.
   * If valid, save to localStorage.
   * @param {SubmitEvent} e
   */
  onSubmit(e) {
    e.preventDefault();
    let valid = true;

    /** @type {HTMLInputElement} */
    const name = this.form.elements["name"];
    /** @type {HTMLInputElement} */
    const email = this.form.elements["email"];
    /** @type {HTMLTextAreaElement} */
    const message = this.form.elements["message"];

    // Clear previous errors
    this.clearError(name, "nameError");
    this.clearError(email, "emailError");
    this.clearError(message, "messageError");
    if (this.statusEl) {
      this.statusEl.textContent = "";
    }

    // Name validation
    if (!name.value.trim()) {
      this.setError(
        name,
        "nameError",
        "Please enter your name so we know who you are."
      );
      valid = false;
    }

    // Email validation
    if (!email.value.trim()) {
      this.setError(
        email,
        "emailError",
        "Please enter an email address we can reply to."
      );
      valid = false;
    } else if (!email.validity.valid) {
      this.setError(
        email,
        "emailError",
        "Please enter a valid email address (e.g. name@example.com)."
      );
      valid = false;
    }

    // Message validation
    const msg = message.value.trim();
    if (!msg) {
      this.setError(
        message,
        "messageError",
        "Please include a short description of your moodboard brief."
      );
      valid = false;
    } else if (msg.length < this.minLength) {
      this.setError(
        message,
        "messageError",
        `Your message is a bit short. Please use at least ${this.minLength} characters.`
      );
      valid = false;
    }

    // If invalid, show status and stop
    if (!valid) {
      if (this.statusEl) {
        this.statusEl.textContent =
          "Please fix the highlighted fields and try again.";
      }
      return;
    }

    // SAVE TO LOCALSTORAGE HERE (only when valid)
    const formData = {
      name: name.value.trim(),
      email: email.value.trim(),
      message: msg,
    };

    try {
      localStorage.setItem("contactFormData", JSON.stringify(formData));
    } catch (err) {
      console.warn("Could not save contact form data to localStorage:", err);
    }

    // Show success and reset form
    if (this.statusEl) {
      this.statusEl.textContent =
        "Thanks! Your message has passed validation. In a real project this would now be securely sent to the server via HTTPS POST.";
    }
    this.form.reset();
  }

  /**
   * Mark a field invalid and show an error message.
   * @param {HTMLInputElement | HTMLTextAreaElement} field
   * @param {string} id - Error element id.
   * @param {string} message - Error message text.
   */
  setError(field, id, message) {
    const el = document.getElementById(id);
    field.classList.add("is-invalid");
    if (el) el.textContent = message;
  }

  /**
   * Clear the error for a field.
   * @param {HTMLInputElement | HTMLTextAreaElement} field
   * @param {string} id
   */
  clearError(field, id) {
    const el = document.getElementById(id);
    field.classList.remove("is-invalid");
    if (el) el.textContent = "";
  }
}

/**
 * ContactPage
 * -----------
 * Wires up the advice feature, form validation, and text file read/write.
 */
class ContactPage {
  constructor() {
    /** @type {HTMLElement | null} */
    this.ideaText = document.getElementById("ideaText");
    /** @type {HTMLButtonElement | null} */
    this.refreshBtn = document.getElementById("refreshIdea");
    /** @type {IdeaService} */
    this.ideaService = new IdeaService();

    const defaultMin = 20;
    /** @type {number} */
    const minFromConfig =
      window.CONFIG && typeof CONFIG.minMessageLength === "number"
        ? CONFIG.minMessageLength
        : defaultMin;
    this.minMessageLength = minFromConfig;
  }

  /**
   * Set up event listeners for:
   *  - advice loading
   *  - form validation
   *  - text file download
   *  - text file upload
   */
  init() {
    // Advice feature
    if (this.ideaText && this.refreshBtn) {
      this.loadIdea(); // initial
      this.refreshBtn.addEventListener("click", () => this.loadIdea());
    }

    // Form validator
    const form = document.getElementById("contactForm");
    if (form instanceof HTMLFormElement) {
      const validator = new FormValidator(form, this.minMessageLength);
      validator.init();
    }

    // TEXT FILE WRITE feature
    const downloadBtn = document.getElementById("downloadText");
    if (downloadBtn) {
      downloadBtn.addEventListener("click", () => {
        this.downloadTextFile();
      });
    }

    // TEXT FILE READ feature
    const fileInput = document.getElementById("fileInput");
    if (fileInput) {
      fileInput.addEventListener("change", (event) => {
        this.readUploadedFile(event);
      });
    }
  }

  /**
   * Load an advice string from the API and display it.
   * Shows a simple error message if the API fails.
   * @returns {Promise<void>}
   */
  async loadIdea() {
    if (!this.ideaText) return;

    this.ideaText.textContent = "Thinking of good advice…";

    try {
      const idea = await this.ideaService.getIdea();
      this.ideaText.textContent = idea;
    } catch (e) {
      console.error(e);
      this.ideaText.textContent = "Could not load an idea right now.";
    }
  }

  /**
   * Creates a .txt file using current form values + advice
   * and triggers a download in the browser.
   */
  downloadTextFile() {
    const nameInput = document.getElementById("name");
    const emailInput = document.getElementById("email");
    const messageInput = document.getElementById("message");

    const name = nameInput?.value || "N/A";
    const email = emailInput?.value || "N/A";
    const message = messageInput?.value || "N/A";
    const idea = this.ideaText?.textContent || "No advice loaded";

    const text =
      "Moodboard Contact Export\n" +
      "-------------------------\n" +
      `Name: ${name}\n` +
      `Email: ${email}\n` +
      `Message: ${message}\n` +
      `Advice: ${idea}\n`;

    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "contact-export.txt";
    a.click();

    URL.revokeObjectURL(url);
  }

  /**
   * Reads a .txt file uploaded by the user and displays its contents.
   * @param {Event} event - File input change event.
   */
  readUploadedFile(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = (e) => {
      const text = e.target.result;
      const output = document.getElementById("fileContents");
      if (!output) return;
      output.textContent = text;
      output.style.display = "block";
    };

    reader.readAsText(file);
  }
}

// Boot up the contact page
const page = new ContactPage();
page.init();
