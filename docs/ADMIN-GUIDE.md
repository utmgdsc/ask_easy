# AskEasy — Administrator Guide

This document covers:

1. How to access the data the application collects
2. How to wipe student entries at the end of a term
3. How Shibboleth SSO is connected to the VM

---

## 1. Accessing the Data

AskEasy stores all data in a **PostgreSQL 16** database. You can access it in two ways:

**Admin Dashboard (recommended):** Navigate to `/admin` in the app while logged in as a professor. The dashboard shows row counts for every table and previews of recent users, courses, and sessions.

**Direct database access:** SSH into the VM and open a psql shell:

```bash
ssh <your-utorid>@askeasy.utm.utoronto.ca
docker exec -it ask_easy-postgres-1 psql -U postgres -d ask_easy
```

From there you can query any table (`\dt` lists them all). Type `\q` to exit.

### Database Tables

| Table | What it stores |
|---|---|
| `User` | Every person who has logged in (UTORid, name, email, role) |
| `Course` | Courses created by professors (code, name, semester) |
| `CourseEnrollment` | Which users belong to which courses (STUDENT / TA / PROFESSOR) |
| `Session` | Live Q&A sessions within a course |
| `Question` | Questions asked during sessions |
| `Answer` | Answers to questions |
| `QuestionUpvote` / `AnswerUpvote` | Upvote records |
| `SlideSet` | Uploaded PDF slide files |

---

## 2. Wiping Student Data at End of Term

Use the **Admin Dashboard** at `/admin`. It lets you select which tables to clear (e.g., just enrollments, just sessions, or everything) and handles the deletion order automatically. You must type `CONFIRM` before the clear button activates.

To also remove uploaded slide PDFs from disk:

```bash
ssh <your-utorid>@askeasy.utm.utoronto.ca
rm -rf ~/AskEasy/uploads/*
```

---

## 3. Shibboleth SSO

### Architecture

```
Browser  ──HTTPS──▶  Apache + mod_shib  ──localhost──▶  Next.js App (Docker, :3000)
                         │
                         ▼
                   U of T IdP (login page)
```

### Login Flow

1. User visits `https://askeasy.utm.utoronto.ca`.
2. Apache/mod_shib checks for a Shibboleth session. If none exists, it redirects to the U of T login page (`idpz.utorauth.utoronto.ca`).
3. User logs in with their UTORid and password (same SSO as Quercus, ACORN, etc.).
4. The IdP sends a SAML assertion back. mod_shib validates it and injects headers (`utorid`, `mail`, `cn`) into the request.
5. Apache reverse-proxies to the Next.js app, which reads the `utorid` header and creates an encrypted session cookie (8-hour TTL).

### Spoofing Prevention

- **Apache** strips any client-supplied identity headers before mod_shib injects real ones (`RequestHeader unset ... early`).
- **The app** (`src/server.ts`) also strips these headers from any non-localhost connection.

### Key Files on the VM

| File | Purpose |
|---|---|
| `/etc/apache2/sites-enabled/askeasy.conf` | Apache vhost (TLS, reverse proxy, Shibboleth directives) |
| `/etc/shibboleth/shibboleth2.xml` | Shibboleth SP config (entity ID, IdP, metadata) |
| `/etc/shibboleth/utorauth_metadata_verify.crt` | U of T metadata signing certificate |
| `/etc/letsencrypt/live/askeasy.utm.utoronto.ca/` | TLS certs (auto-renewed by certbot) |
| `whitelist.txt` (project dir) | UTORids that get the PROFESSOR role |

### Key shibboleth2.xml Settings

```xml
<ApplicationDefaults entityID="https://sp.utm.utoronto.ca/ask_easy"
                     REMOTE_USER="utorid">
  <SSO entityID="https://idpz.utorauth.utoronto.ca/shibboleth">SAML2</SSO>
  <MetadataProvider type="XML"
    url="https://md.sso.utoronto.ca/mda/ut-idp-metadata.xml"
    backingFilePath="/var/cache/shibboleth/ut-idp-metadata.xml"
    reloadInterval="3600">
    <MetadataFilter type="Signature" verifyName="false"
      certificate="/etc/shibboleth/utorauth_metadata_verify.crt"/>
  </MetadataProvider>
</ApplicationDefaults>
```

### How We Registered with U of T

1. Installed `libapache2-mod-shib` and configured `shibboleth2.xml`.
2. Started the shibd daemon.
3. Fetched SP metadata: `curl https://askeasy.utm.utoronto.ca/Shibboleth.sso/Metadata > sp-metadata.xml`
4. Emailed `sp-metadata.xml` to **shib.admin@utoronto.ca** to register.

### Role Assignment

- UTORid in `whitelist.txt` → PROFESSOR role.
- Everyone else → STUDENT role.
- TAs are assigned per-course by professors through the app UI.
- To add a professor: `echo "utorid" >> ~/AskEasy/whitelist.txt && docker restart ask_easy-app-1`
