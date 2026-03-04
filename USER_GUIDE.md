# AUI Health Center — User Guide

This guide explains how to use the AUI Health Center application. It is written for staff (doctors, nurses, administrators) who use the system in their daily work.

---

## Table of contents

1. [Getting started](#1-getting-started)
2. [Logging in and out](#2-logging-in-and-out)
3. [Using the interface (desktop and mobile)](#3-using-the-interface-desktop-and-mobile)
4. [Dashboard](#4-dashboard)
5. [Consultations](#5-consultations)
6. [Patients](#6-patients)
7. [Materials (Liste des Matériels)](#7-materials-liste-des-matériels)
8. [Admin: Materials management](#8-admin-materials-management)
9. [Admin: Suppliers](#9-admin-suppliers)
10. [Admin: Personnel](#10-admin-personnel)
11. [Reports and statistics](#11-reports-and-statistics)
12. [Profile and account](#12-profile-and-account)
13. [Notifications](#13-notifications)
14. [Tips and troubleshooting](#14-tips-and-troubleshooting)

---

## 1. Getting started

- **What you need:** A supported web browser (Chrome, Firefox, Safari, or Edge) and an internet connection.
- **Where to open the app:** Use the address provided by your administrator (for example: `https://hc.aui.ma` or your organization’s URL).
- **Who can use it:** Doctors, nurses, and administrators. What you see (menus and actions) depends on your role.

---

## 2. Logging in and out

### Signing in with Outlook (recommended)

1. Open the Health Center app in your browser.
2. On the login page, click **“Sign in with Outlook”**.
3. You will be redirected to Microsoft. Enter your **AUI Outlook email** and password if asked.
4. After Microsoft confirms your identity, you are brought back to the Health Center and logged in.

**Note:** Only accounts that are registered in the system (with the correct AUI email) will have access. If you do not see the app after signing in with Outlook, contact your administrator.

### Signing in with email and password (fallback)

If your organization allows it, you can sign in without Outlook:

1. On the login page, enter your **email** in the “Email (fallback login)” field (e.g. `name@aui.ma`).
2. Enter your **password** in the “Password” field.
3. Click **“Sign in”**.

**Important:** Do not use this fallback on a shared or public computer unless your administrator has approved it.

### Signing out

1. Click your **name and role** in the top-right corner of the screen.
2. In the menu that opens, click **“Sign Out”**.

You will be returned to the login page.

---

## 3. Using the interface (desktop and mobile)

### On a computer (desktop)

- **Left side:** The **sidebar** shows the Health Center logo and the main menu (Dashboard, Consultations, Patients, etc.). Click an item to open that section.
- **Top:** The **header** has a search box, a **bell icon** for notifications, and your **profile** (name and role). Click your name to open the profile menu (Profile, Sign Out).
- **Center:** The **main area** shows the content of the page you selected (e.g. list of consultations, list of patients).

### On a phone or tablet (mobile)

- **Menu:** The sidebar is hidden by default. Tap the **☰ (hamburger) icon** at the top left to open the menu. Tap a menu item to go to that page; the menu closes automatically. Tap the dark area outside the menu to close it without changing page.
- **Search and profile:** The search bar and your profile stay at the top; they may appear in a more compact form on small screens.
- **Tables:** On small screens, some tables can be scrolled horizontally. Some columns may be hidden on very small screens to keep the layout readable.

---

## 4. Dashboard

**Path:** Sidebar → **Dashboard**

The Dashboard is the first page you see after login. It gives a quick overview:

- **Cards with numbers:** For example, number of consultations today, pending items, low stock alerts, patients seen, etc. (exact cards depend on your role.)
- **Shortcuts:** You can use the Dashboard as a starting point, then use the sidebar to go to Consultations, Patients, or other sections.

You do not need to perform any action on the Dashboard; it is for information only.

---

## 5. Consultations

**Path:** Sidebar → **Consultations**

Consultations are the core of the app: each visit (AUI student/staff or external person) is recorded as one consultation.

### Viewing the list of consultations

- The main table shows: **Patient**, **Doctor**, **Date & Time**, **Status**, and **Actions**.
- Use the **filters** (e.g. status, date) if available to narrow the list.
- Consultations marked **“Externe”** are for non-AUI patients (e.g. family, restaurant staff, ASI students, guests); they are stored locally and may have limited edit/delete options.

### Creating a new consultation

1. Click **“New Consultation”** (or similar button at the top).
2. In the form that opens:
   - **Patient type:**
     - **AUI (by ID):** Select “AUI” and enter the patient’s **ID number (idNum)**. The system will load the patient’s name if they exist.
     - **External:** Select “Externe” and choose the category (Famille, Restaurant staff, ASI student, Guest). Enter the **name** and optionally phone.
   - **Date and time** of the consultation.
   - **Motif** (reason for visit).
   - **Diagnostic:** Enter the diagnosis (and, for nurses, any **vitals** such as Temperature, TA, P, Sat, GàJ, FR, poids, taille if the form offers them).
   - **Traitement** (treatment) if applicable.
3. Click **“Save”** or **“Create”** to record the consultation.

**Nurses:** If the form has a “Constantes” (vitals) section, fill in the values; they are included in the consultation note.

### Viewing consultation details

1. In the consultations list, find the row of the consultation.
2. Click the **eye (👁) icon** in the **Actions** column.
3. A modal or a new screen will show full details (patient, date, motif, diagnostic, traitement, and any assigned materials).

From the **detail view** you can often:
- **Assign materials** to the patient (e.g. crutches, brace) — see [Materials (Liste des Matériels)](#7-materials-liste-des-matériels).
- **Unassign** a material when the patient returns it.

### Editing a consultation

1. In the list, click the **pencil (✏️) icon** in the **Actions** column for that consultation.
2. Change the fields you need (date, motif, diagnostic, traitement, etc.).
3. Click **“Save”** or **“Update”**.

**Note:** For **external** consultations, edit/delete may not be available depending on configuration.

### Deleting a consultation

1. In the list, click the **trash (🗑) icon** in the **Actions** column.
2. Confirm when the app asks you to confirm deletion.

**Note:** Only non-external consultations can usually be deleted from the list.

### Sortie de stock (stock exit linked to a consultation)

If your role has access:

1. In the list, click the **pill/stock icon** in the **Actions** column for the consultation.
2. In the window that opens, enter the **medicines or materials** taken out of stock for this consultation (e.g. quantity, product).
3. Save. This records the exit so that stock levels can be updated.

---

## 6. Patients

**Path:** Sidebar → **Patients**

This page lists patients (students, faculty, staff, guests) and lets you search and open their medical record.

### Searching for a patient

- **By ID (idNum):** Type the patient’s **ID number** in the “Recherche par ID” (or “Search by ID”) field. The list updates to show that patient when the number is valid.
- **By name:** Use the “Recherche par nom” (or “Search by name”) field. The list is filtered as you type (first name, last name).
- **By category:** Use the **category** dropdown (Student, Faculty, Staff, Guest) to show only that type. Categories are stored locally and can be set per patient.

### Viewing a patient’s medical record (dossier médical)

1. Find the patient in the table.
2. Click **“Dossier Médical”** (or the equivalent button) for that row.
3. A modal or page opens with the patient’s **medical record**: personal info, history, consultations, etc.

### Adding a consultation from the Patients page

1. Find the patient in the list.
2. Click **“Ajouter Consultation”** (Add Consultation) for that patient.
3. You are taken to the consultation form or a new consultation is created for that patient; complete the form and save.

### Setting a patient’s category (Student / Faculty / Staff / Guest)

1. In the **Patients** table, find the **Category** column.
2. Use the **dropdown** in that column for the patient and select: Student, Faculty, Staff, or Guest.
3. The choice is saved automatically (stored in your browser). Filter later using the category filter at the top.

### Importing medical records (Excel)

If your role has access:

1. Click **“Importer Dossiers Médicaux”** (or similar).
2. Choose an **Excel file** (.xlsx, .xls, .csv) that follows the format expected by the Health Center (ask your administrator for the template).
3. Upload the file. The app will show how many records were imported successfully and any errors.
4. Check the result message and fix the file if there are errors, then try again if needed.

---

## 7. Materials (Liste des Matériels)

**Path:** Sidebar → **Liste des Matériels**

This page is for **viewing** and **managing materials assigned to patients** (e.g. crutches, braces). It is available to doctors and nurses.

### Viewing the list of materials

- You see a list of **materials** (name, category, quantity, etc.). Use it to know what exists in stock and what is assigned.

### Assigning a material to a patient (from a consultation)

1. Open the **consultation** (from Consultations list → click the **eye** icon to open details, or open **Consultation Details** from the list).
2. On the **Consultation Details** page, find the **Assigned materials** section.
3. Click **“Assign”** or **“Add material”**.
4. In the dialog, select the **material** and (if asked) **quantity**.
5. Confirm. The material is then linked to that patient for that consultation.

The system records the assignment date. If a material is not returned after **3 weeks**, it may appear in **Notifications** as “Non retourné (> 3 sem.)” so staff can follow up.

### Unassigning (return) a material

1. Open the **Consultation Details** (or the consultation form where assigned materials are shown).
2. Find the **material** in the list of assigned materials.
3. Click **“Unassign”** or **“Return”** (or similar).
4. Confirm. The material is no longer assigned to that patient and the “overdue” tracking is updated.

---

## 8. Admin: Materials management

**Path:** Sidebar → **Liste des Matériels** (admin view) or **Materiels**

**Available to:** Administrators only.

This section is for **managing the catalog** of materials (add, edit, view stock), not only assignments. Use it to:

- Add new types of materials.
- Edit names, categories, quantities, minimum stock levels.
- View which materials are low in stock.

Specific buttons and fields depend on the screen; typically you will see **Add**, **Edit**, and a table or list of materials with actions per row.

---

## 9. Admin: Suppliers

**Path:** Sidebar → **Suppliers**

**Available to:** Administrators only.

Here you manage **suppliers** (companies or contacts that provide medicines or materials).

### Viewing the list

- The table shows supplier **name**, **address**, **phone**, **email**, **type**, **status**, etc.
- Use **search** and **filters** (type, status) to find a supplier.

### Adding a supplier

1. Click **“Add Supplier”** (or similar).
2. Fill in: **Name (nom fournisseur)**, **address**, **phone**, **email**, **type**, and any other required fields.
3. Save.

### Editing a supplier (including the name)

1. In the list, click the **Edit (pencil)** action for that supplier.
2. Change the **name** or any other field.
3. Save. The supplier name and other details are updated.

### Deleting a supplier

1. Click the **Delete (trash)** action for that supplier.
2. Confirm. The supplier is removed from the list (use with care).

---

## 10. Admin: Personnel

**Path:** Sidebar → **Personnel**

**Available to:** Administrators only.

This page is for **managing staff** (doctors, nurses, administrators) who can log in to the Health Center.

- You can **view** the list of personnel (name, role, email, status).
- Depending on the screen, you may **add**, **edit**, or **deactivate** users. Roles usually include: Admin, Médecin (doctor), Infirmier/Infirmière (nurse).

Access and roles are often linked to **Outlook/Azure** accounts (email addresses). If someone cannot log in, an administrator must ensure their email is registered with the correct role in the system.

---

## 11. Reports and statistics

**Path:** Sidebar → **Reports**

**Available to:** Administrators and (depending on configuration) some medical staff.

Reports give **statistics** about consultations, materials, and stock.

### Choosing the period

- At the top, use the **period** dropdown: **Aujourd’hui** (Today), **Cette semaine** (This week), **Ce mois** (This month), **3 derniers mois**, **Cette année** (This year).
- The charts and numbers below update for the selected period.

### What you see

- **Summary cards:** Total patients, total consultations, total materials, low stock count, etc.
- **Charts:** For example:
  - **Évolution des Consultations** — consultations over time (by day).
  - **Consultations par créneau horaire** — distribution by time slot (e.g. 08:30–13:30, 13:30–18:00, 18:00–23:00, 23:00–08:30).
  - **Top diagnostics** — most frequent diagnoses.
  - **Consultations par mois** — when the period spans several months.
  - **Matériels par catégorie** — materials by category.
  - **Matériels les plus utilisés** — most used materials.
- **Tables:** e.g. “Consultations récentes” (recent consultations).

### Exporting a report (CSV)

1. Select the **period** you want.
2. Click **“Exporter CSV”** (Export CSV).
3. A file is downloaded (e.g. `rapport_thisMonth_2025-03-04.csv`). Open it in Excel or another spreadsheet tool to print or share.

---

## 12. Profile and account

**Path:** Sidebar → **My Profile** (or **Profile**), or click your **name** in the top-right → **View Profile** / **Edit Profile**

### Viewing your profile

- You see your **name**, **email**, **phone**, **role**, **specialty** (if applicable), and **status**. This information comes from your account (e.g. Outlook/Azure or the personnel list).

### Editing your profile

1. Click **“Edit”** or **“Edit Profile”**.
2. Change **name**, **phone**, **specialty**, or **password** (if the form allows it). Email may be read-only if it is linked to Outlook.
3. Click **“Save”**.
4. If the app shows a success message, your profile is updated. Changes may take effect on next login or page refresh.

---

## 13. Notifications

**Location:** **Bell icon** in the top-right of the header.

Click the **bell** to open the **Notifications** panel. You may see:

- **Low stock (stock faible):** Medicines (or materials) whose quantity is at or below the minimum. The list shows product name and current/minimum quantity. Click **“Médicaments”** to go to the medicines/materials page.
- **Overdue materials (non retournés > 3 sem.):** Materials that were assigned to a patient more than **3 weeks** ago and not yet returned. Click **“Consultations”** to open the consultations list and follow up.

The **red badge** on the bell shows the total number of notifications (low stock + overdue). Use this to stay aware of items to reorder or to recover.

---

## 14. Tips and troubleshooting

### I cannot log in

- **With Outlook:** Ensure you use your **AUI Outlook email** and that your account is registered in the Health Center (contact your administrator).
- **With email/password:** Confirm your email and password. If you forgot your password, contact your administrator (the app may not have a “Forgot password” link).

### I don’t see a menu item (e.g. Reports, Suppliers, Personnel)

- Some sections are **only for administrators**. If you are a doctor or nurse, you will not see Admin-only menus. If you believe you should have access, contact your administrator.

### The app is slow or doesn’t load

- Check your **internet connection**.
- **Refresh** the page (F5 or the browser refresh button).
- Try closing other browser tabs or apps. If the problem continues, contact your IT support.

### I created an external consultation but I don’t see it in the main list

- External consultations (Famille, Restaurant staff, ASI student, Guest) are stored **in the browser** (local storage). They appear in the Consultations list on **the same device and browser** where you created them. They are not synced to the server or other devices.

### Materials “non retournés” (overdue) — what do I do?

- Open **Consultations** (from the notifications link or the sidebar).
- Find the consultation(s) for the patient who has the material.
- Open the **Consultation Details** and either:
  - **Unassign** the material when the patient returns it, or
  - Contact the patient to remind them to return it.

### I need a printable or shareable report

- Go to **Reports**, choose the **period**, then click **“Exporter CSV”**. Open the CSV in Excel and print or share the file.

### I use the app on my phone

- Use the **☰ menu** to move between sections. Tables may scroll horizontally; some columns hide on very small screens. For long data entry, a computer is usually easier.

---

## Contact

For **access problems**, **role changes**, or **technical issues**, contact your **Health Center administrator** or **IT support**. They can check that your email is registered, your role is correct, and that the application URL and permissions are set properly.

---

*Last updated: March 2025 — AUI Health Center.*
