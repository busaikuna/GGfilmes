import os
import requests
from flask import Flask, jsonify, request
import threading
import time
from dotenv import load_dotenv
from flask_cors import CORS

load_dotenv()

app = Flask(__name__)
CORS(app)


TMDB_BASE_URL = "https://api.themoviedb.org/3"
RAWG_BASE_URL = "https://api.rawg.io/api"


@app.route("/api/movies")
def get_trending_movies():
    url = f"{TMDB_BASE_URL}/trending/movie/week"
    params = {"api_key": TMDB_API_KEY, "language": "pt-BR"}
    r = requests.get(url, params=params)
    data = r.json()
    return jsonify(data.get("results", []))


@app.route("/api/games")
def get_trending_games():
    url = f"{RAWG_BASE_URL}/games"
    params = {
        "key": RAWG_API_KEY,
        "ordering": "-rating",
        "page_size": 10,
    }
    r = requests.get(url, params=params)
    data = r.json()
    return jsonify(data.get("results", []))


@app.route("/api/search")
def search_all():
    query = request.args.get("q")
    if not query:
        return jsonify({"error": "Parâmetro 'q' é obrigatório"}), 400

    movies_url = f"{TMDB_BASE_URL}/search/movie"
    movies_params = {"api_key": TMDB_API_KEY, "query": query, "language": "pt-BR"}
    movies_data = requests.get(movies_url, params=movies_params).json()

    games_url = f"{RAWG_BASE_URL}/games"
    games_params = {"key": RAWG_API_KEY, "search": query, "page_size": 5}
    games_data = requests.get(games_url, params=games_params).json()

    return jsonify({
        "movies": movies_data.get("results", []),
        "games": games_data.get("results", [])
    })

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)
