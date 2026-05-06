# Wraptron — change notes

Developers: add a new `##` section **at the top** of the list below (directly under the `---` rule). Use the form `Version — YYYY-MM-DD` as the heading, then one bullet per change (`- `). The in-app **About** dialog shows the **three newest** sections.

---

## 0.1.2 — 2026-05-03

- About dialog shows the three newest entries from `src/data/changenotes.md`
- Added this file so release notes stay versioned and easy to edit in the repo

## 0.1.1 — 2026-05-03

- Sidebar footer: About the app and Feedback (bug icon, mailto) shortcuts
- Top navigation: removed global search and notifications; navbar vertical padding set to 8px

## 0.1.0 — 2026-05-02

- Settings: appearance (light / dark / system), language (English), timezone placeholder
- Contacts: mobile layout with name, optional company, and call/email actions; compact + for new contact
- Theming: page shells and app launcher use theme tokens for dark mode
