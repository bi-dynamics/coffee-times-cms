# Coffee Times CMS Onboarding Guide

Welcome to the Coffee Times CMS. This guide will help you get started with managing your listings.

## Accessing the CMS

The CMS is hosted live at the following link:
[https://coffee-times-cms.netlify.app/](https://coffee-times-cms.netlify.app/)

## Login Credentials

Credentials are **not** stored in this repository. They live in
`CREDENTIALS.local.md` in the project root, which is gitignored.

If you do not have that file, ask the development team for a copy — do not
commit credentials to this guide or to any other tracked file.

## Key CMS Features

### 1. Dashboard Overview

Once logged in, you will see the Dashboard. It provides a quick summary of:

- **Total Categories**: Number of available listing types.
- **Total Listings**: Total number of business listings across all categories (syncs with Firestore).
- **Quick Access**: A grid of categories for fast navigation.

### 2. Managing Listings

To manage listings, navigate to a category from the Dashboard or the sidebar.

#### Adding a New Listing

1. Click the **Add Listing** button in the top right corner of a category page.
2. Fill in the **Basic Information** (Title, Description, Town, Suburb).
3. Provide **Contact Details** (Phone, Email, Website).
4. Upload **Images** for the listing.
5. Click **Create Listing**.

#### Editing or Deleting a Listing

- In the category table, click the **three dots (...)** next to a listing.
- Select **Edit** to modify the details or **Delete** to remove the listing.

#### Status Management

- Listings can be toggled between **Draft** and **Active**.
- Only **Active** listings are visible to the public. You can change this using the **Active Status** switch in the listing form.

### 3. Category-Specific Fields

Some categories have unique fields. For example:

- **Accomodations**: Includes bedrooms and bathrooms.
- **Service Categories** (e.g., IT Services, Plumbing): Includes a list of specific services offered.

---

_For any technical issues, please contact the development team._
