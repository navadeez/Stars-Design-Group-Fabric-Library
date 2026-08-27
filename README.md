# Stars Design Group – Fabric Library

A private fabric library built with React, Vite and Firebase.

## Features
- Firebase email/password login
- Private access for authorized users
- Add, edit and delete fabric records
- Upload multiple fabric pictures
- Card and table views
- Universal quick search across all fabric fields, including remarks
- Fabric details: ID, name, composition, construction, weave, GSM, Oz, width, finish, color, supplier, price, currency, MOQ, lead time and remarks

## 1. Create a Firebase project
1. Go to Firebase Console.
2. Create a project.
3. Add a Web App.
4. Enable Authentication → Email/Password.
5. Create authorized users under Authentication → Users.
6. Create a Firestore Database.
7. Enable Firebase Storage.
8. Copy your Web App configuration into `src/firebase.js`.

## 2. Install and test locally
```bash
npm install
npm run dev
```

## 3. Firestore rules
Use rules similar to this for a private application:

```text
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /fabrics/{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## 4. Storage rules
Use rules similar to this:

```text
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /fabrics/{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## 5. GitHub
Create a new GitHub repository and upload these files.

## 6. Deploy
This is a Vite React app. You can deploy the built frontend using GitHub Pages or another static hosting provider:

```bash
npm run build
```

For GitHub Pages, configure the Vite `base` setting if the site is hosted under a repository subpath, then deploy the `dist` folder.

## Important
Do not put any Firebase service account private keys in this repository. The web Firebase configuration is intended for frontend use; database and storage security must be enforced with Firebase Security Rules and Firebase Authentication.
