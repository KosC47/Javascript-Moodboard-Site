"use strict";

/**
 * contact.js
 * -----------
 * This script controls the Info & Contact page.
 * It:
 *  - Loads a random Advice from an external API
 *  - Lets the user fetch a new advice on button click
 *  - Validates the contact form and shows clear error messages
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
 * This class is for talking to the Advice Slip API.
 * It hides the details of the fetch() call and just returns a string.
 */

class IdeaService {
  async getIdea() {
    const res = await fetch(ACTIVITY_API_URL, {
      // avoid caching old advice
      cache: "no-cache",
    });

    if (!res.ok) {
      throw new Error(`API returned ${res.status}`);
    }

    const data = await res.json();
    // Advice Slip format
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
 * This class handles client side validation of the contact form.
 * It checks the name, email and message fields and displays error messages.
 */

class FormValidator {
  /**
   * Creates instance
   * @param {HTMLFormElement} form
   * @param {number} minLength - minimum message length
   */

  constructor(form, minLength) {
    this.form = form;
    this.minLength = minLength;
    this.statusEl = document.getElementById("formStatus");
  }

  /**
   * Attaches the submit event handler to the form.
   */

  init() {
    this.form.addEventListener("submit", (e) => this.onSubmit(e));
  }

  onSubmit(e) {
    e.preventDefault();
    let valid = true;

    // Bug Fix
    // The msg field on contact form didnt show any error, even when it was empty.
    // other fields validated correctly, nothing which dispalyed error.
    // Fix use correct element name lol.

    const name = this.form.elements["name"];
    const email = this.form.elements["email"];
    const message = this.form.elements["message"];

    // clear previous errors
    this.clearError(name, "nameError");
    this.clearError(email, "emailError");
    this.clearError(message, "messageError");
    this.statusEl.textContent = "";

    // Name
    if (!name.value.trim()) {
      this.setError(
        name,
        "nameError",
        "Please enter your name so we know who you are."
      );
      valid = false;
    }

    // Email
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

    // Message
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
    // if anything failed it will display a message and stop
    if (!valid) {
      this.statusEl.textContent =
        "Please fix the highlighted fields and try again.";
      return;
    }

    // This displays the successful validation msg
    this.statusEl.textContent =
      "Thanks! Your message has passed validation. In a real project this would now be securely sent to the server via HTTPS POST.";
    this.form.reset();
  }

  // Marks field as invalid displays error
  setError(field, id, message) {
    const el = document.getElementById(id);
    field.classList.add("is-invalid");
    if (el) el.textContent = message;
  }

  // clears errors removes error msg
  clearError(field, id) {
    const el = document.getElementById(id);
    field.classList.remove("is-invalid");
    if (el) el.textContent = "";
  }
}

/**
 * ContactPage
 * -----------
 * This class coordinates everything on the contact page.
 * It:
 *  - Sets up the advice loading feature using IdeaService
 *  - Sets up the "New idea" button
 *  - Creates and starts a FormValidator for the contact form
 */

class ContactPage {
  /**
   * Creates new ContactPage instance and finds DOM elements.
   * Also reads values such as the minimum message length.
   */
  constructor() {
    this.ideaText = document.getElementById("ideaText");
    this.refreshBtn = document.getElementById("refreshIdea");
    this.ideaService = new IdeaService();

    // Fallback if CONFIG is missing
    const defaultMin = 20;
    const minFromConfig =
      window.CONFIG && typeof CONFIG.minMessageLength === "number"
        ? CONFIG.minMessageLength
        : defaultMin;
    this.minMessageLength = minFromConfig;
  }

  /**
   * Sets up event listeners and initial behaviour on the contact page.
   * Called once after creating the ContactPage object.
   */

  init() {
    // advice feature
    if (this.ideaText && this.refreshBtn) {
      this.loadIdea(); // initial load
      this.refreshBtn.addEventListener("click", () => {
        this.loadIdea(); // NEW ADVICE button
      });
    }

    // Form validator
    const form = document.getElementById("contactForm");
    if (form) {
      const validator = new FormValidator(form, this.minMessageLength);
      validator.init();
    }
  }
  // Loads advice string from advice api
  // if the API fails it will display an error msg
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
}

const page = new ContactPage();
page.init();
