# Les Pelous de Veyettes – Website

This repository contains the source code for the official website of  
**Union Sportive et Culturelle de Chavagne – Section Randonnée Pédestre "Les Pelous de Veyettes"**.

👉 [Live preview on Netlify](https://luxury-florentine-83c69f.netlify.app/)

---

## 🚀 Features

- 🏠 Static website built with **HTML, CSS, and JavaScript**
- 📝 Content editing powered by **Decap CMS** (formerly Netlify CMS)
- 🔑 Authentication handled by **Netlify Identity**
- 📅 Google Calendar integration to display the club’s activities
- 📂 Editable sections (via CMS):
  - Club life (`Vie du club`)
  - Practical information (`Infos pratiques`)
  - Board members (`Membres du bureau`)
  - Contact information

---

## 🛠️ Development

### Requirements
- [Node.js](https://nodejs.org/) (for local development with Netlify CLI)
- [Netlify CLI](https://docs.netlify.com/cli/get-started/)

### Run locally
```bash
# Install Netlify CLI if not already installed
npm install -g netlify-cli

# Start local development server
netlify dev
This will serve the site at http://localhost:8888 with CMS and authentication enabled.
```

📂 Project structure
```graphql
.
├── admin/              # Decap CMS entrypoint (index.html + config.yml)
├── assets/             # Static assets (images, uploads…)
├── data/               # JSON/Markdown content editable via CMS
├── index.html          # Homepage
├── script.js           # Custom frontend scripts
└── styles.css          # Site styles
```

🔐 Authentication

Only invited members can log in to the administration (/admin).

Login is managed via Netlify Identity.

Google login is supported and recommended.

📄 License

This project is maintained for the Les Pelous de Veyettes hiking club.
