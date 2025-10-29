import os
import re
import unicodedata
import requests
from flask import Flask, jsonify, request, render_template
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

TMDB_API_KEY = os.getenv("TMDB_API_KEY")
RAWG_API_KEY = os.getenv("RAWG_API_KEY")
TMDB_BASE_URL = "https://api.themoviedb.org/3"
RAWG_BASE_URL = "https://api.rawg.io/api"

EXPLICIT_KEYWORDS = [
    "porn", "porno", "pornô", "xxx", "sexo", "sexual", "erótico", "erotico",
    "adult", "adulto", "hardcore", "softcore", "nude", "nudes", "nudity", "nu", "sexo explícito"
]

_explicit_pattern = re.compile(r"\b(" + "|".join(re.escape(w) for w in EXPLICIT_KEYWORDS) + r")\b", re.IGNORECASE)


def normalize_text(text: str) -> str:
    """Normaliza (remover acentos e transformar em minúsculas) para comparar melhor."""
    if not text:
        return ""
    text = str(text).lower()
    text = unicodedata.normalize("NFKD", text)
    text = "".join([c for c in text if not unicodedata.combining(c)])
    return text


def contains_explicit(text: str) -> bool:
    """Retorna True se o texto contiver termos explícitos."""
    if not text:
        return False
    text_norm = normalize_text(text)
    return bool(_explicit_pattern.search(text_norm))


def filter_movies(results: list) -> list:
    """Filtra resultados de filmes (remove adult e conteúdo com palavras-chave explícitas)."""
    safe = []
    for m in results:
        # TMDb tem campo "adult"
        if m.get("adult"):
            continue

        title = m.get("title") or m.get("name") or ""
        overview = m.get("overview") or ""

        if contains_explicit(title) or contains_explicit(overview):
            continue

        safe.append(m)
    return safe


def filter_games(results: list) -> list:
    """Filtra resultados de jogos (baseado em título/descrição e possíveis campos de rating)."""
    safe = []
    for g in results:
        title = g.get("name") or g.get("title") or ""
        description = g.get("description_raw") or g.get("short_description") or g.get("slug") or ""
        esrb = g.get("esrb_rating") or g.get("rating") or None
        if isinstance(esrb, dict) and esrb.get("name"):
            if "adult" in esrb.get("name").lower() or "ao" in esrb.get("name").lower():
                continue

        if contains_explicit(title) or contains_explicit(description):
            continue

        safe.append(g)
    return safe


@app.route("/api/movies")
def get_trending_movies():
    """Filmes em destaque (filtrados)."""
    url = f"{TMDB_BASE_URL}/trending/movie/week"
    params = {"api_key": TMDB_API_KEY, "language": "pt-BR"}
    r = requests.get(url, params=params)
    data = r.json()
    results = data.get("results", [])
    safe_results = filter_movies(results)
    return jsonify(safe_results)


@app.route("/api/games")
def get_trending_games():
    """Jogos em destaque (filtrados)."""
    url = f"{RAWG_BASE_URL}/games"
    params = {
        "key": RAWG_API_KEY,
        "ordering": "-rating",
        "page_size": 10,
    }
    r = requests.get(url, params=params)
    data = r.json()
    results = data.get("results", [])
    safe_results = filter_games(results)
    return jsonify(safe_results)


@app.route("/api/search")
def search_all():
    """Busca filmes e jogos pelo nome (filtrados)."""
    query = request.args.get("q")
    if not query:
        return jsonify({"error": "Parâmetro 'q' é obrigatório"}), 400

    movies_url = f"{TMDB_BASE_URL}/search/movie"
    movies_params = {
        "api_key": TMDB_API_KEY,
        "query": query,
        "language": "pt-BR",
        "include_adult": False  # <--- evita resultados marcados como adult
    }
    movies_data = requests.get(movies_url, params=movies_params).json()
    movies_results = movies_data.get("results", [])
    movies_safe = filter_movies(movies_results)

    games_url = f"{RAWG_BASE_URL}/games"
    games_params = {"key": RAWG_API_KEY, "search": query, "page_size": 5}
    games_data = requests.get(games_url, params=games_params).json()
    games_results = games_data.get("results", [])
    games_safe = filter_games(games_results)

    return jsonify({
        "movies": movies_safe,
        "games": games_safe
    })


@app.route("/")
def home():
    return render_template("index.html")


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)
