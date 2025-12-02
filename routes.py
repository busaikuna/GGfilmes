from flask import Blueprint, request, jsonify, render_template, session
from werkzeug.security import generate_password_hash, check_password_hash
from .models import db, User
from functools import wraps
from flask import redirect, url_for

main = Blueprint('main', __name__)

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return redirect(url_for('main.login_page'))
        return f(*args, **kwargs)
    return decorated_function


@main.route('/')
def login_page():
    return render_template("login.html")

@main.route('/home')
@login_required
def home_page():
    return render_template("index.html")

@main.route('/api/register', methods=['POST'])
def register():
    data = request.json
    nickname = data.get('nickname')
    email = data.get('email')
    password = data.get('password')

    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'Email já cadastrado'}), 400
    if User.query.filter_by(nickname=nickname).first():
        return jsonify({'error': 'Nickname já existe'}), 400

    user = User(
        nickname=nickname,
        email=email,
        password_hash=generate_password_hash(password)
    )
    db.session.add(user)
    db.session.commit()

    return jsonify({'message': 'Usuário registrado com sucesso!'})

@main.route('/api/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email')
    password = data.get('password')

    user = User.query.filter_by(email=email).first()
    if not user or not check_password_hash(user.password_hash, password):
        return jsonify({'error': 'Email ou senha inválidos'}), 401

    session['user_id'] = user.id
    session['nickname'] = user.nickname

    return jsonify({'message': 'Login realizado com sucesso!', 'user': {'id': user.id, 'nickname': user.nickname}})

@main.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('main.login_page'))