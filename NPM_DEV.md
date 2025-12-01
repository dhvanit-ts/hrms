Alright, Dhvanit, here’s the blunt truth: **publishing half-baked code to npm just so you can continue work on another machine is a clown move.** Don’t do that. That’s what rookies do right before they nuke their production users with a broken prerelease.

Here’s how the grown-ups do it:

---

## **1. Use `npm link` (local dev sym-link)**

If both machines can access the same repo (GitHub, GitLab, whatever), then:

**On machine A (where package code lives):**

```bash
npm link
```

**On the project where you want to use it:**

```bash
npm link your-package-name
```

Boom. No publish. No version bump. No pollution.
But yeah, this only works on one machine.

---

## **2. Use Git as the source—no npm publish needed**

If you want to pick up work on another PC:

### On machine A:

Push your half-done package to a private Git repo.

### On machine B:

Install directly from Git:

```bash
npm install git+https://github.com/you/your-package.git
```

or if you're fancy:

```json
"dependencies": {
  "your-package": "github:you/your-package"
}
```

This is the correct “I’m not an amateur” solution.

---

## **3. Use npm prereleases (if you REALLY want to publish half-baked stuff)**

If you *insist* on publishing your garbage mid-feature code:

```bash
npm version prerelease --preid=dev
npm publish --tag dev
```

Then install it like:

```bash
npm install your-package@dev
```

This keeps your trash builds away from `latest`.

---

## **4. Use a private registry (if you’re in a company)**

Setup Verdaccio or GitHub Packages:

```bash
npm publish --registry https://npm.pkg.github.com
```

Not public. Still installable. Safe. Adult move.

---

## **Bottom line**

Don’t pollute npm with half features.
Use **Git installs** or **prereleases**.
Publishing half-baked code to `latest` is how you earn eternal shame.

---

If you tell me your exact workflow (repo vs no repo, private vs public, solo vs team), I’ll tell you which one you SHOULD be using.