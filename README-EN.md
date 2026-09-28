# CineVerse

CineVerse is a web application for searching and viewing movies. Film information is obtained from **The Movie Database (TMDB)** and, from each movie's detail page, users can also view the cast, actor profiles, and filmographies.

The application also allows users to create an account, save favorite movies in the browser, and publish and manage reviews.

The project is built with **Laravel 12**, **Vue 3**, **Inertia.js 2**, and **TypeScript**. Laravel handles authentication, sessions, reviews, profile data, and data persistence; Inertia connects Laravel with Vue, while Vue Router controls the internal navigation of the SPA.

## What CineVerse allows you to do

- Browse trending, popular, now playing, upcoming, and top-rated movies.
- Search, filter, and sort movies.
- View movie details, cast, director, trailers, and related content.
- View actor profiles and filmographies from a movie's cast.
- Register, log in, and log out.
- Verify email addresses and recover passwords.
- Create, edit, and delete your own reviews.
- View community reviews and your review history from your profile.
- Save up to 20 favorite movies in the browser.
- Use the interface in Spanish or English.

## Main technologies

- PHP 8.2+
- Laravel 12
- Laravel Breeze
- Inertia.js 2
- Vue 3
- TypeScript
- Vue Router
- Pinia
- TanStack Vue Query
- Axios
- Vite 7
- MySQL 8
- TMDB API

## Repository structure

```text
cineverse-laravel/
├── README-ES.md
├── README-EN.md
├── database/
├── docs/
├── src/
└── *.mp4
```

- `database/`: contains the test SQL database.
- `docs/`: contains the technical documentation and Markdown (`.md`) files with complementary information and test results.
- `src/`: contains the complete Laravel project and the integrated Vue frontend.
- The videos included in the root of the repository show the website in operation.

## Getting started

From `src/`:

```bash
composer install
npm install
```

Create the `.env` file from `.env.example` and generate the application key:

```bash
php artisan key:generate
```

Configure the following in `.env`:

- the MySQL connection;
- `VITE_TMDB_BASE_URL`;
- `VITE_TMDB_TOKEN`;
- SMTP settings if you want to test email verification and password recovery.

## Database

The database can be prepared in two ways:

- by importing the SQL copy included in `database/`;
- or by creating an empty database and generating its structure and data using the project's migrations and seeders.

If you use the second option, first create the database in MySQL and configure its connection in `.env`.

Then, from `src/`:

```bash
php artisan migrate --seed
```

The included dataset contains **5,000 users** and **24,322 reviews**.

## Development

The integrated way to start the project is:

```bash
composer run dev
```

This script starts the Laravel development server, the queue process, Laravel Pail, and Vite concurrently.

Laravel and Vite can also be run separately:

```bash
php artisan serve
npm run dev
```

## Architecture

The main interface flow is:

```text
Laravel
   ↓
Inertia
   ↓
Vue 3
   ↓
Vue Router
```

The frontend queries TMDB to obtain information about movies and actors, while Laravel and MySQL manage CineVerse's own data, such as users and reviews.

## Documentation

The technical documentation, complementary Markdown files, and test data results are located in:

```text
docs/
```

The `database/` folder contains the SQL copy prepared for project delivery, while the project in `src/` can also rebuild its structure and test data through migrations and seeders.
