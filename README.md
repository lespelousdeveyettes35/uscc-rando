# Les Pelous de Veyettes – Website

This repository contains the source code for the official website of  
**Union Sportive et Culturelle de Chavagne – Section Randonnée Pédestre "Les Pelous de Veyettes"**.

👉 [Live preview on Netlify](https://luxury-florentine-83c69f.netlify.app/)

---

## 🚀 Features

- Static website built with **HTML, CSS, and JavaScript**
- Content editing powered by **Decap CMS** (formerly Netlify CMS)
- Authentication handled by **Netlify Identity**
- Google Calendar integration to display the club’s activities
- Editable sections (via CMS):
  - Club life (`Vie du club`)
  - Practical information (`Infos pratiques`)
  - Board members (`Membres du bureau`)
  - Contact information
- 🔒 **Private backoffice** (for admins only):
  - Protected with **Netlify Identity roles**
  - CRUD management of **adherents (members list)** stored in **Netlify Blobs**
  - No external database required

---

## 🛠️ Development

### Requirements
- [Node.js](https://nodejs.org/)  
- [Netlify CLI](https://docs.netlify.com/cli/get-started/)

### Run locally
```bash
# Install Netlify CLI if not already installed
npm install -g netlify-cli

# Start local development server
netlify dev
